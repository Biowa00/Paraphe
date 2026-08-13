import type { StatutEnveloppe } from "@paraphe/partage";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import { empreinteSha256 } from "../domaine/empreinte";
import { transition } from "../domaine/enveloppe";
import type { DepotCredits, DepotEnveloppes, Horloge } from "../domaine/ports";

export interface DemandeEnvoi {
  enveloppeId: string;
  document: Buffer;
  acteur: string;
}

export interface DependancesEnvoi {
  depot: DepotEnveloppes;
  credits: DepotCredits;
  horloge: Horloge;
}

export interface ResultatEnvoi {
  statut: StatutEnveloppe;
  documentHashOrigine: string;
}

/**
 * Envoie une enveloppe : fige l'empreinte d'origine du document (couche
 * intégrité), passe brouillon → envoyee (lève sinon), journalise `envoyee`.
 * La notification WhatsApp/SMS sera branchée via un adaptateur (06).
 */
export async function envoyerEnveloppe(
  demande: DemandeEnvoi,
  deps: DependancesEnvoi,
): Promise<ResultatEnvoi> {
  const agg = await deps.depot.charger(demande.enveloppeId);
  if (!agg) {
    throw new ErreurMetier(
      CODES_ERREUR.ENVELOPPE_INTROUVABLE,
      "Enveloppe introuvable.",
    );
  }
  if (agg.signataires.length === 0) {
    throw new ErreurMetier(
      CODES_ERREUR.TRANSITION_INTERDITE,
      "Aucun signataire : envoi impossible.",
    );
  }

  // Valider la transition AVANT de débiter (sinon un envoi impossible — déjà
  // envoyée, etc. — consommerait un crédit).
  const statut = transition(agg.enveloppe.statut, "envoyer");

  // Débit d'un crédit (l'émetteur paie ; I8 ne concerne que le destinataire).
  // Solde insuffisant → l'enveloppe reste brouillon (05_api_contracts/03).
  const titulaire = agg.enveloppe.entrepriseId
    ? { type: "entreprise" as const, id: agg.enveloppe.entrepriseId }
    : { type: "utilisateur" as const, id: agg.enveloppe.createurId };
  const debite = await deps.credits.debiterEnvoi(titulaire.type, titulaire.id, demande.enveloppeId);
  if (!debite) {
    throw new ErreurMetier(
      CODES_ERREUR.CREDITS_INSUFFISANTS,
      "Solde de crédits insuffisant pour envoyer.",
    );
  }

  const documentHashOrigine = empreinteSha256(demande.document);

  agg.enveloppe.statut = statut;
  agg.enveloppe.documentHashOrigine = documentHashOrigine;
  agg.journal.ajouter({
    enveloppeId: demande.enveloppeId,
    type: "envoyee",
    acteur: demande.acteur,
    horodatage: deps.horloge.maintenant(),
  });

  await deps.depot.enregistrer(agg);
  return { statut, documentHashOrigine };
}
