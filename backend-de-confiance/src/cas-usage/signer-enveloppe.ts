import type { NiveauIdentite, StatutEnveloppe } from "@paraphe/partage";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import { empreinteSha256 } from "../domaine/empreinte";
import { transition } from "../domaine/enveloppe";
import { niveauSuffisant } from "../domaine/identite";
import type { JournalAjoutSeul } from "../domaine/journal";
import type { Trace } from "../domaine/trace";
import type { Horloge, ServiceOtp } from "../domaine/ports";

export interface DemandeSignature {
  enveloppeId: string;
  /** Statut courant : doit être « envoyee » ou « partiellement_signee ». */
  statutActuel: StatutEnveloppe;
  signataireId: string;
  niveauExige: NiveauIdentite;
  /** Niveau d'identité vérifié à l'instant (résultat de l'étape d'identité). */
  niveauVerifie: NiveauIdentite;
  /** Ticket OTP frais consommé à l'instant (I2). */
  otpTicket: string;
  /** Tracé refait à l'instant (I1). */
  trace: Trace;
  /** Mode séquentiel : est-ce le tour de ce signataire ? */
  estSonTour: boolean;
  estDernierSignataire: boolean;
  journal: JournalAjoutSeul;
  acteur: string;
  ip?: string;
  userAgent?: string;
  empreinteAppareil?: string;
}

export interface DependancesSignature {
  otp: ServiceOtp;
  horloge: Horloge;
}

export interface ResultatSignature {
  statut: StatutEnveloppe;
  /** Empreinte du tracé (preuve qu'il a existé), jamais le tracé réutilisable. */
  empreinteTrace: string;
}

/**
 * Acte de signature. Ordre volontaire : on valide tout ce qui est sans effet
 * (état, tour, identité, présence du tracé) AVANT de consommer l'OTP, pour ne
 * pas brûler un OTP frais sur une erreur évitable. La consommation de l'OTP est
 * le point qui matérialise « OTP frais à l'instant » (I2).
 */
export async function signerEnveloppe(
  demande: DemandeSignature,
  deps: DependancesSignature,
): Promise<ResultatSignature> {
  assertEtatSignable(demande.statutActuel);

  if (!demande.estSonTour) {
    throw new ErreurMetier(
      CODES_ERREUR.PAS_VOTRE_TOUR,
      "Ce n'est pas le tour de ce signataire.",
    );
  }
  if (!niveauSuffisant(demande.niveauVerifie, demande.niveauExige)) {
    throw new ErreurMetier(
      CODES_ERREUR.IDENTITE_NIVEAU_INSUFFISANT,
      "Niveau d'identité insuffisant pour signer.",
    );
  }

  // I1 — le tracé est fourni à l'instant ; on n'en recharge jamais un depuis un
  // stockage (aucun port ne le permet). On conserve seulement son empreinte
  // comme preuve, jamais un tracé réapposable.
  if (demande.trace.traits.length === 0) {
    throw new ErreurMetier(
      CODES_ERREUR.TRACE_ABSENTE,
      "Tracé de signature requis à l'instant.",
    );
  }
  const empreinteTrace = empreinteSha256(JSON.stringify(demande.trace));

  // I2 — OTP frais, consommé à l'instant, à usage unique.
  await deps.otp.consommerTicket(demande.otpTicket, "signature");

  const horodatage = deps.horloge.maintenant();
  const statut = transition(demande.statutActuel, "signer", {
    dernierSignataire: demande.estDernierSignataire,
  });

  const commun = {
    enveloppeId: demande.enveloppeId,
    acteur: demande.acteur,
    horodatage,
    ip: demande.ip,
    userAgent: demande.userAgent,
    empreinteAppareil: demande.empreinteAppareil,
  };
  demande.journal.ajouter({ ...commun, type: "otp_valide" });
  demande.journal.ajouter({
    ...commun,
    type: "signee",
    donnees: { signataireId: demande.signataireId, empreinteTrace },
  });

  return { statut, empreinteTrace };
}

function assertEtatSignable(statut: StatutEnveloppe): void {
  if (statut === "scellee") {
    throw new ErreurMetier(
      CODES_ERREUR.ENVELOPPE_SCELLEE,
      "Enveloppe scellée : signature impossible.",
    );
  }
  if (statut === "expiree") {
    throw new ErreurMetier(
      CODES_ERREUR.ENVELOPPE_EXPIREE,
      "Enveloppe expirée : signature impossible.",
    );
  }
  if (statut !== "envoyee" && statut !== "partiellement_signee") {
    throw new ErreurMetier(
      CODES_ERREUR.TRANSITION_INTERDITE,
      `Signature impossible depuis l'état « ${statut} ».`,
    );
  }
}
