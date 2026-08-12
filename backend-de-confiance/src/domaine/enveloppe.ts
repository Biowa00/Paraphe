import type { StatutEnveloppe } from "@paraphe/partage";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";

/**
 * Machine à états de l'enveloppe (cf. 02_logic/01).
 * Les événements de transition sont un sous-ensemble « qui change l'état » ;
 * les autres événements du journal (ouverte, consultee, otp_*, telechargee)
 * ne modifient pas le statut.
 */
export type EvenementTransition =
  | "soumettre"
  | "approuver"
  | "renvoyer"
  | "envoyer"
  | "signer"
  | "refuser"
  | "expirer"
  | "sceller";

/** États terminaux : on n'en sort jamais (I3). */
export const STATUTS_TERMINAUX: readonly StatutEnveloppe[] = [
  "scellee",
  "refusee",
  "expiree",
];

export interface ContexteTransition {
  /** Pour « signer » : vrai si c'est le dernier signataire attendu. */
  dernierSignataire?: boolean;
}

/**
 * Calcule le statut résultant d'un événement, ou lève une ErreurMetier si la
 * transition est interdite. Aucune transition ne sort d'un état terminal :
 * une enveloppe scellée est figée par construction (I3).
 */
export function transition(
  statut: StatutEnveloppe,
  evenement: EvenementTransition,
  contexte: ContexteTransition = {},
): StatutEnveloppe {
  if (STATUTS_TERMINAUX.includes(statut)) {
    throw new ErreurMetier(
      statut === "scellee"
        ? CODES_ERREUR.ENVELOPPE_SCELLEE
        : CODES_ERREUR.TRANSITION_INTERDITE,
      `Aucune transition depuis l'état terminal « ${statut} ».`,
    );
  }

  const suivant = calculer(statut, evenement, contexte);
  if (suivant === null) {
    throw new ErreurMetier(
      CODES_ERREUR.TRANSITION_INTERDITE,
      `Transition « ${evenement} » interdite depuis « ${statut} ».`,
    );
  }
  return suivant;
}

function calculer(
  statut: StatutEnveloppe,
  evenement: EvenementTransition,
  contexte: ContexteTransition,
): StatutEnveloppe | null {
  switch (evenement) {
    case "soumettre":
      return statut === "brouillon" ? "attente_validation" : null;
    case "approuver":
      return statut === "attente_validation" ? "envoyee" : null;
    case "renvoyer":
      return statut === "attente_validation" ? "brouillon" : null;
    case "envoyer":
      return statut === "brouillon" ? "envoyee" : null;
    case "signer":
      if (statut === "envoyee" || statut === "partiellement_signee") {
        return contexte.dernierSignataire ? "complete" : "partiellement_signee";
      }
      return null;
    case "refuser":
      return statut === "envoyee" || statut === "partiellement_signee"
        ? "refusee"
        : null;
    case "expirer":
      return statut === "envoyee" || statut === "partiellement_signee"
        ? "expiree"
        : null;
    case "sceller":
      return statut === "complete" ? "scellee" : null;
    default:
      return null;
  }
}
