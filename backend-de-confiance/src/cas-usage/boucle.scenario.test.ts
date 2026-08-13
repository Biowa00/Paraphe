import { describe, it, expect } from "vitest";
import { verify } from "node:crypto";
import type { Trace } from "../domaine/trace";
import { creerEnveloppe } from "./creer-enveloppe";
import { envoyerEnveloppe } from "./envoyer-enveloppe";
import { traiterSignature } from "./traiter-signature";
import { scellerEnveloppe } from "./sceller-enveloppe";
import { DepotEnveloppesMemoire } from "../adaptateurs/depot-enveloppes-memoire";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { ChiffreurLocalDev } from "../adaptateurs/chiffreur-local-dev";
import { StockageLocalDev } from "../adaptateurs/stockage-local-dev";
import { SceauServeurLocalDev } from "../adaptateurs/sceau-serveur-local-dev";
import { DepotCreditsMemoire } from "../adaptateurs/depot-credits-memoire";

/** Un dépôt de crédits où « alice » peut envoyer (10 crédits). */
function creditsAlice(): DepotCreditsMemoire {
  const c = new DepotCreditsMemoire();
  c.lignes.push({ titulaireType: "utilisateur", titulaireId: "alice", type: "achat", montant: 10 });
  return c;
}

const TRACE: Trace = {
  horodatageCapture: "2026-08-12T14:00:00Z",
  traits: [
    [0, 0],
    [1, 1],
  ],
};
const DOCUMENT = Buffer.from("Bail commercial — Cotonou", "utf8");

describe("boucle de signature (S1 — de bout en bout)", () => {
  it("créer → envoyer → signer ×2 (séquentiel) → sceller", async () => {
    let n = 0;
    const genererId = () => `id-${++n}`;
    const horloge = { maintenant: () => new Date("2026-08-12T14:00:00Z") };
    const depot = new DepotEnveloppesMemoire();
    const otp = new GuichetOtpLocalDev();

    // 1. Créer
    const { enveloppeId } = await creerEnveloppe(
      {
        createurId: "alice",
        titre: "Bail",
        mode: "sequentiel",
        signataires: [
          { nomDeclare: "Bob", telephone: "+22990000001", ordre: 1, niveauIdentiteExige: "standard" },
          { nomDeclare: "Carine", telephone: "+22990000002", ordre: 2, niveauIdentiteExige: "standard" },
        ],
      },
      { depot, horloge, genererId },
    );

    // 2. Envoyer
    const envoi = await envoyerEnveloppe(
      { enveloppeId, document: DOCUMENT, acteur: "alice" },
      { depot, credits: creditsAlice(), horloge },
    );
    expect(envoi.statut).toBe("envoyee");

    const apresEnvoi = await depot.charger(enveloppeId);
    const [sig1, sig2] = apresEnvoi!.signataires;

    // 3. Signer le premier (séquentiel, pas le dernier)
    const r1 = await traiterSignature(
      {
        enveloppeId,
        signataireId: sig1!.id,
        niveauVerifie: "standard",
        otpTicket: otp.emettreTicket("signature"),
        trace: TRACE,
        acteur: "bob",
      },
      { depot, otp, horloge },
    );
    expect(r1.statut).toBe("partiellement_signee");

    // 4. Signer le dernier → complete
    const r2 = await traiterSignature(
      {
        enveloppeId,
        signataireId: sig2!.id,
        niveauVerifie: "standard",
        otpTicket: otp.emettreTicket("signature"),
        trace: TRACE,
        acteur: "carine",
      },
      { depot, otp, horloge },
    );
    expect(r2.statut).toBe("complete");

    // 5. Sceller
    const agg = await depot.charger(enveloppeId);
    const chiffreur = new ChiffreurLocalDev();
    const stockage = new StockageLocalDev();
    const sceau = new SceauServeurLocalDev();
    const scell = await scellerEnveloppe(
      {
        enveloppeId,
        statutActuel: agg!.enveloppe.statut,
        document: DOCUMENT,
        empreinteOrigine: agg!.enveloppe.documentHashOrigine!,
        signataires: agg!.signataires.map((s) => ({
          nomDeclare: s.nomDeclare,
          niveau: s.niveauIdentiteExige,
          horodatageSignature: s.dateSignature!,
        })),
        journal: agg!.journal,
        acteur: "systeme",
      },
      { chiffreur, stockage, sceau, horloge },
    );
    expect(scell.statut).toBe("scellee");

    // Journal complet et ordonné de toute la vie de l'enveloppe.
    expect(agg!.journal.lister().map((e) => e.type)).toEqual([
      "creee",
      "envoyee",
      "otp_valide",
      "signee",
      "otp_valide",
      "signee",
      "scellee",
    ]);

    // Le stockage ne contient que du chiffré ; le cachet du dossier est vérifiable.
    const chiffre = await stockage.lire(scell.cheminChiffre);
    expect(chiffre.includes(DOCUMENT)).toBe(false);

    const { cachet, ...corps } = scell.dossierPreuve;
    const cachetValide = verify(
      null,
      Buffer.from(JSON.stringify(corps), "utf8"),
      sceau.clePublique,
      Buffer.from(cachet.signature, "base64"),
    );
    expect(cachetValide).toBe(true);
  });

  it("empêche un signataire de doubler le tour (séquentiel)", async () => {
    let n = 0;
    const genererId = () => `id-${++n}`;
    const horloge = { maintenant: () => new Date("2026-08-12T14:00:00Z") };
    const depot = new DepotEnveloppesMemoire();
    const otp = new GuichetOtpLocalDev();

    const { enveloppeId } = await creerEnveloppe(
      {
        createurId: "alice",
        titre: "Bail",
        mode: "sequentiel",
        signataires: [
          { nomDeclare: "Bob", telephone: "+22990000001", ordre: 1, niveauIdentiteExige: "standard" },
          { nomDeclare: "Carine", telephone: "+22990000002", ordre: 2, niveauIdentiteExige: "standard" },
        ],
      },
      { depot, horloge, genererId },
    );
    await envoyerEnveloppe({ enveloppeId, document: DOCUMENT, acteur: "alice" }, { depot, credits: creditsAlice(), horloge });

    const agg = await depot.charger(enveloppeId);
    const [, sig2] = agg!.signataires;

    // Le 2e signataire ne peut pas signer avant le 1er.
    await expect(
      traiterSignature(
        {
          enveloppeId,
          signataireId: sig2!.id,
          niveauVerifie: "standard",
          otpTicket: otp.emettreTicket("signature"),
          trace: TRACE,
          acteur: "carine",
        },
        { depot, otp, horloge },
      ),
    ).rejects.toMatchObject({ code: "pas_votre_tour" });
  });
});
