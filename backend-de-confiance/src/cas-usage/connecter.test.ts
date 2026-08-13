import { describe, it, expect } from "vitest";
import { CODES_ERREUR } from "@paraphe/partage";
import { connecter } from "./connecter";
import { DepotUtilisateursMemoire } from "../adaptateurs/depot-utilisateurs-memoire";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { SessionJwtLocalDev } from "../adaptateurs/session-jwt-local-dev";
import type { CompteVerifieAgg } from "../domaine/utilisateur";

function compte(id: string, telephone: string): CompteVerifieAgg {
  return {
    utilisateur: {
      id,
      identifiantPublic: "BJ-ABCD-EFG",
      telephone,
      niveauVerification: "verifie",
      npiHash: "hash",
      nom: "DOSSOU",
      prenoms: "Awa",
      dateVerification: "2026-08-13T10:00:00Z",
    },
    verification: {
      id: "v1",
      utilisateurId: id,
      methode: "ocr_selfie",
      score: 0.95,
      resultat: "valide",
      controleRef: "ctrl",
    },
    creditsBienvenue: 3,
  };
}

function ctx() {
  const depot = new DepotUtilisateursMemoire();
  const otp = new GuichetOtpLocalDev();
  const session = new SessionJwtLocalDev("secret-de-test");
  return { depot, otp, session, deps: { depot, otp, session } };
}

describe("connecter", () => {
  it("téléphone connu + OTP frais → jeton de session vérifiable", async () => {
    const { depot, otp, session, deps } = ctx();
    await depot.creerCompteVerifie(compte("u1", "+22990000001"));

    const r = await connecter({ telephone: "+22990000001", otpTicket: otp.emettreTicket("connexion") }, deps);
    expect(r.utilisateur.id).toBe("u1");
    expect(r.utilisateur.niveau).toBe("verifie");

    const charge = session.verifier(r.token);
    expect(charge?.sub).toBe("u1");
  });

  it("numéro inconnu → connexion refusée", async () => {
    const { otp, deps } = ctx();
    await expect(
      connecter({ telephone: "+22999999999", otpTicket: otp.emettreTicket("connexion") }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.CONNEXION_REFUSEE });
  });

  it("sans OTP frais valide → refus (I2)", async () => {
    const { depot, deps } = ctx();
    await depot.creerCompteVerifie(compte("u1", "+22990000001"));
    await expect(
      connecter({ telephone: "+22990000001", otpTicket: "bidon" }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.OTP_INVALIDE });
  });

  it("un ticket « connexion » ne peut pas servir à autre chose (lié à l'action)", async () => {
    const { otp, session } = ctx();
    // Un ticket émis pour la signature ne connecte pas.
    const ticketSignature = otp.emettreTicket("signature");
    await expect(otp.consommerTicket(ticketSignature, "connexion")).rejects.toBeTruthy();
    void session;
  });

  it("un jeton falsifié est rejeté", () => {
    const { session } = ctx();
    const bon = session.emettre({ sub: "u1", niveau: "verifie", identifiantPublic: null });
    const falsifie = bon.slice(0, -3) + "aaa";
    expect(session.verifier(falsifie)).toBeNull();
  });
});
