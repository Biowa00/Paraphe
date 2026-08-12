import { describe, it, expect } from "vitest";
import { CODES_ERREUR } from "@paraphe/partage";
import { signerEnveloppe, type DemandeSignature } from "./signer-enveloppe";
import { JournalAjoutSeul } from "../domaine/journal";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import type { Trace } from "../domaine/trace";

const TRACE_VALIDE: Trace = {
  horodatageCapture: "2026-08-12T14:00:00Z",
  traits: [
    [0, 0],
    [1, 2],
    [3, 4],
  ],
};

function ctx() {
  const otp = new GuichetOtpLocalDev();
  const horloge = { maintenant: () => new Date("2026-08-12T14:00:05Z") };
  const journal = new JournalAjoutSeul();
  return { otp, horloge, journal };
}

function demande(
  otp: GuichetOtpLocalDev,
  journal: JournalAjoutSeul,
  over: Partial<DemandeSignature> = {},
): DemandeSignature {
  return {
    enveloppeId: "env-1",
    statutActuel: "envoyee",
    signataireId: "sig-1",
    niveauExige: "standard",
    niveauVerifie: "standard",
    otpTicket: otp.emettreTicket("signature"),
    trace: TRACE_VALIDE,
    estSonTour: true,
    estDernierSignataire: false,
    journal,
    acteur: "bob",
    ...over,
  };
}

describe("signerEnveloppe — chemin nominal", () => {
  it("signe et passe envoyee → partiellement_signee, journalise otp_valide puis signee", async () => {
    const { otp, horloge, journal } = ctx();
    const r = await signerEnveloppe(demande(otp, journal), { otp, horloge });
    expect(r.statut).toBe("partiellement_signee");
    expect(journal.lister().map((e) => e.type)).toEqual(["otp_valide", "signee"]);
  });

  it("le dernier signataire fait passer l'enveloppe à complete", async () => {
    const { otp, horloge, journal } = ctx();
    const r = await signerEnveloppe(
      demande(otp, journal, { estDernierSignataire: true }),
      { otp, horloge },
    );
    expect(r.statut).toBe("complete");
  });
});

describe("signerEnveloppe — I2 (OTP frais)", () => {
  it("un ticket OTP est à usage unique : le rejeu est refusé", async () => {
    const { otp, horloge, journal } = ctx();
    const ticket = otp.emettreTicket("signature");
    await signerEnveloppe(demande(otp, journal, { otpTicket: ticket }), { otp, horloge });
    await expect(
      signerEnveloppe(
        demande(otp, journal, { otpTicket: ticket, statutActuel: "partiellement_signee" }),
        { otp, horloge },
      ),
    ).rejects.toMatchObject({ code: CODES_ERREUR.OTP_INVALIDE });
  });

  it("l'OTP est lié à l'action : un ticket d'inscription ne signe pas", async () => {
    const { otp, horloge, journal } = ctx();
    const ticket = otp.emettreTicket("inscription");
    await expect(
      signerEnveloppe(demande(otp, journal, { otpTicket: ticket }), { otp, horloge }),
    ).rejects.toMatchObject({ code: CODES_ERREUR.OTP_INVALIDE });
  });
});

describe("signerEnveloppe — I1 (tracé à l'instant)", () => {
  it("exige un tracé non vide, et n'en recharge jamais un stocké", async () => {
    const { otp, horloge, journal } = ctx();
    const ticket = otp.emettreTicket("signature");
    await expect(
      signerEnveloppe(
        demande(otp, journal, {
          otpTicket: ticket,
          trace: { horodatageCapture: "2026-08-12T14:00:00Z", traits: [] },
        }),
        { otp, horloge },
      ),
    ).rejects.toMatchObject({ code: CODES_ERREUR.TRACE_ABSENTE });

    // Le tracé manquant échoue AVANT la consommation de l'OTP :
    // le même ticket reste donc valide pour une signature correcte.
    const r = await signerEnveloppe(
      demande(otp, journal, { otpTicket: ticket }),
      { otp, horloge },
    );
    expect(r.statut).toBe("partiellement_signee");
  });
});

describe("signerEnveloppe — gardes", () => {
  it("refuse si le niveau d'identité vérifié est insuffisant", async () => {
    const { otp, horloge, journal } = ctx();
    await expect(
      signerEnveloppe(
        demande(otp, journal, { niveauExige: "renforce", niveauVerifie: "standard" }),
        { otp, horloge },
      ),
    ).rejects.toMatchObject({ code: CODES_ERREUR.IDENTITE_NIVEAU_INSUFFISANT });
  });

  it("refuse si ce n'est pas le tour du signataire (séquentiel)", async () => {
    const { otp, horloge, journal } = ctx();
    await expect(
      signerEnveloppe(demande(otp, journal, { estSonTour: false }), { otp, horloge }),
    ).rejects.toMatchObject({ code: CODES_ERREUR.PAS_VOTRE_TOUR });
  });

  it("refuse de signer une enveloppe scellée (I3) ou expirée", async () => {
    const { otp, horloge, journal } = ctx();
    await expect(
      signerEnveloppe(demande(otp, journal, { statutActuel: "scellee" }), { otp, horloge }),
    ).rejects.toMatchObject({ code: CODES_ERREUR.ENVELOPPE_SCELLEE });
    await expect(
      signerEnveloppe(demande(otp, journal, { statutActuel: "expiree" }), { otp, horloge }),
    ).rejects.toMatchObject({ code: CODES_ERREUR.ENVELOPPE_EXPIREE });
  });
});
