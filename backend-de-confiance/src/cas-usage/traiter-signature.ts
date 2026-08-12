import type { NiveauIdentite, StatutEnveloppe } from "@paraphe/partage";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { Trace } from "../domaine/trace";
import type { DepotEnveloppes, Horloge, ServiceOtp } from "../domaine/ports";
import { signerEnveloppe } from "./signer-enveloppe";

export interface DemandeTraiterSignature {
  enveloppeId: string;
  signataireId: string;
  /** Niveau d'identité vérifié à l'instant. */
  niveauVerifie: NiveauIdentite;
  otpTicket: string;
  trace: Trace;
  acteur: string;
  ip?: string;
  userAgent?: string;
  empreinteAppareil?: string;
}

export interface DependancesTraiterSignature {
  depot: DepotEnveloppes;
  otp: ServiceOtp;
  horloge: Horloge;
}

export interface ResultatTraiterSignature {
  statut: StatutEnveloppe;
}

/**
 * Orchestre la signature : charge l'agrégat, calcule le contexte (tour,
 * dernier signataire, niveau exigé), délègue à `signerEnveloppe` (gardes I1/I2),
 * puis persiste le signataire et le nouvel état.
 */
export async function traiterSignature(
  demande: DemandeTraiterSignature,
  deps: DependancesTraiterSignature,
): Promise<ResultatTraiterSignature> {
  const agg = await deps.depot.charger(demande.enveloppeId);
  if (!agg) {
    throw new ErreurMetier(
      CODES_ERREUR.ENVELOPPE_INTROUVABLE,
      "Enveloppe introuvable.",
    );
  }
  const signataire = agg.signataires.find((s) => s.id === demande.signataireId);
  if (!signataire) {
    throw new ErreurMetier(
      CODES_ERREUR.ENVELOPPE_INTROUVABLE,
      "Signataire introuvable.",
    );
  }

  const enAttente = agg.signataires.filter((s) => s.statut === "en_attente");
  const estSonTour =
    signataire.statut === "en_attente" &&
    (agg.enveloppe.mode === "parallele" ||
      enAttente.every((s) => s.id === signataire.id || s.ordre > signataire.ordre));
  const estDernierSignataire =
    enAttente.length === 1 && enAttente[0]!.id === signataire.id;

  const resultat = await signerEnveloppe(
    {
      enveloppeId: demande.enveloppeId,
      statutActuel: agg.enveloppe.statut,
      signataireId: signataire.id,
      niveauExige: signataire.niveauIdentiteExige,
      niveauVerifie: demande.niveauVerifie,
      otpTicket: demande.otpTicket,
      trace: demande.trace,
      estSonTour,
      estDernierSignataire,
      journal: agg.journal,
      acteur: demande.acteur,
      ip: demande.ip,
      userAgent: demande.userAgent,
      empreinteAppareil: demande.empreinteAppareil,
    },
    { otp: deps.otp, horloge: deps.horloge },
  );

  signataire.statut = "signee";
  signataire.dateSignature = deps.horloge.maintenant().toISOString();
  agg.enveloppe.statut = resultat.statut;
  await deps.depot.enregistrer(agg);

  return { statut: resultat.statut };
}
