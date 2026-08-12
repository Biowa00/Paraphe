import { describe, it, expect } from "vitest";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import { inscrireCompteVerifie, type DemandeInscription } from "./inscrire-compte-verifie";
import { DepotUtilisateursMemoire } from "../adaptateurs/depot-utilisateurs-memoire";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { OcrPieceLocalDev, referencePieceDev } from "../adaptateurs/ocr-piece-local-dev";
import { BiometrieLocalDev, referenceSelfieDev } from "../adaptateurs/biometrie-local-dev";

let compteur = 0;

function ctx() {
  const otp = new GuichetOtpLocalDev();
  const depot = new DepotUtilisateursMemoire();
  return {
    otp,
    depot,
    deps: {
      depot,
      otp,
      ocr: new OcrPieceLocalDev(),
      biometrie: new BiometrieLocalDev(),
      hacheurNpi: new HacheurNpiLocalDev("pepper-de-test"),
      horloge: { maintenant: () => new Date("2026-08-12T10:00:00Z") },
      genererId: () => `id-${++compteur}`,
      alea: () => Math.floor(Math.random() * 1e9),
    },
  };
}

function demande(
  otp: GuichetOtpLocalDev,
  over: {
    npi?: string;
    coherence?: "ok" | "douteuse";
    score?: number;
    vivaciteOk?: boolean;
    ticketValide?: boolean;
  } = {},
): DemandeInscription {
  return {
    telephone: "+2299000" + Math.floor(Math.random() * 1e4),
    otpTicket: over.ticketValide === false ? "ticket-bidon" : otp.emettreTicket("inscription"),
    refPiece: referencePieceDev({
      npi: over.npi ?? "1234567890123",
      nom: "DOSSOU",
      prenoms: "Awa",
      dateNaissance: "1990-01-01",
      coherence: over.coherence ?? "ok",
    }),
    refSelfie: referenceSelfieDev({
      vivaciteOk: over.vivaciteOk ?? true,
      score: over.score ?? 0.95,
    }),
  };
}

describe("inscrireCompteVerifie", () => {
  it("score élevé → compte vérifié, identifiant public BJ-XXXX-XXX, 3 crédits", async () => {
    const { otp, deps, depot } = ctx();
    const r = await inscrireCompteVerifie(demande(otp), deps);

    expect(r.resultat).toBe("valide");
    expect(r.niveau).toBe("verifie");
    expect(r.identifiantPublic).toMatch(/^BJ-[A-Z2-9]{4}-[A-Z2-9]{3}$/);
    expect(r.creditsBienvenue).toBe(3);

    const enregistre = await depot.charger(r.utilisateurId);
    expect(enregistre?.utilisateur.niveauVerification).toBe("verifie");
    expect(enregistre?.verification.resultat).toBe("valide");
  });

  it("I4 — le NPI n'est jamais conservé en clair, seul le hash déterministe", async () => {
    const { otp, deps, depot } = ctx();
    const npi = "9998887776665";
    const r = await inscrireCompteVerifie(demande(otp, { npi }), deps);

    const enregistre = await depot.charger(r.utilisateurId);
    // Le NPI en clair n'apparaît nulle part ; on ne stocke qu'un hash.
    expect(enregistre?.utilisateur.npiHash).toBeTruthy();
    expect(enregistre?.utilisateur.npiHash).not.toContain(npi);
    // Déterminisme : même NPI → même hash.
    const attendu = await deps.hacheurNpi.hacher(npi);
    expect(enregistre?.utilisateur.npiHash).toBe(attendu);
  });

  it("I4 — NPI déjà rattaché à un compte actif → refus", async () => {
    const { otp, deps } = ctx();
    await inscrireCompteVerifie(demande(otp, { npi: "5555555555555" }), deps);

    await expect(
      inscrireCompteVerifie(demande(otp, { npi: "5555555555555" }), deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.NPI_DEJA_UTILISE });
  });

  it("I7 — pas de compte vérifié sans OTP frais valide", async () => {
    const { otp, deps } = ctx();
    await expect(
      inscrireCompteVerifie(demande(otp, { ticketValide: false }), deps),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("I2 — le ticket OTP est à usage unique (rejouer le même ticket échoue)", async () => {
    const { otp, deps } = ctx();
    const ticket = otp.emettreTicket("inscription");
    // 1er usage : consomme le ticket.
    await inscrireCompteVerifie({ ...demande(otp, { npi: "1000000000001" }), otpTicket: ticket }, deps);
    // Rejeu du même ticket : consommé, donc rejeté avant tout le reste (I2).
    await expect(
      inscrireCompteVerifie({ ...demande(otp, { npi: "1000000000002" }), otpTicket: ticket }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.OTP_INVALIDE });
  });

  it("vivacité échouée → VIVACITE_ECHEC, aucun compte créé", async () => {
    const { otp, deps, depot } = ctx();
    await expect(
      inscrireCompteVerifie(demande(otp, { vivaciteOk: false }), deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.VIVACITE_ECHEC });
    expect(depot.credits).toHaveLength(0);
  });

  it("score intermédiaire → en_revue, compte invité, aucun crédit", async () => {
    const { otp, deps, depot } = ctx();
    const r = await inscrireCompteVerifie(demande(otp, { score: 0.7 }), deps);
    expect(r.resultat).toBe("en_revue");
    expect(r.niveau).toBe("invite");
    expect(r.identifiantPublic).toBeNull();
    expect(r.creditsBienvenue).toBe(0);
    expect(depot.credits).toHaveLength(0);
  });

  it("score trop bas → refuse, NPI non réservé (réessai possible)", async () => {
    const { otp, deps } = ctx();
    const r = await inscrireCompteVerifie(demande(otp, { npi: "1112223334445", score: 0.2 }), deps);
    expect(r.resultat).toBe("refuse");
    const enregistre = await deps.depot.charger(r.utilisateurId);
    expect(enregistre?.utilisateur.npiHash).toBeNull();
  });

  it("cohérence douteuse ne peut jamais donner valide (au mieux en_revue)", async () => {
    const { otp, deps } = ctx();
    const r = await inscrireCompteVerifie(demande(otp, { coherence: "douteuse", score: 0.99 }), deps);
    expect(r.resultat).toBe("en_revue");
  });

  it("pièce illisible → PIECE_ILLISIBLE", async () => {
    const { otp, deps } = ctx();
    await expect(
      inscrireCompteVerifie({ ...demande(otp), refPiece: "pas-du-base64-json" }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.PIECE_ILLISIBLE });
  });
});
