import type { StatutEnveloppe } from "@paraphe/partage";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import { empreinteSha256 } from "../domaine/empreinte";
import { transition } from "../domaine/enveloppe";
import type { DepotEnveloppes, Horloge } from "../domaine/ports";

export interface DemandeEnvoi {
  enveloppeId: string;
  document: Buffer;
  acteur: string;
}

export interface DependancesEnvoi {
  depot: DepotEnveloppes;
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

  const statut = transition(agg.enveloppe.statut, "envoyer");
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
