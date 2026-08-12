// Types du domaine, partagés entre backend et client.
// Identifiants en français (langage métier du cahier §6, cf. 04_structure_rules/01).

export const STATUTS_ENVELOPPE = [
  "brouillon",
  "attente_validation",
  "envoyee",
  "partiellement_signee",
  "complete",
  "scellee",
  "refusee",
  "expiree",
] as const;
export type StatutEnveloppe = (typeof STATUTS_ENVELOPPE)[number];

export const TYPES_EVENEMENT = [
  "creee",
  "envoyee",
  "ouverte",
  "consultee",
  "otp_envoye",
  "otp_valide",
  "signee",
  "refusee",
  "expiree",
  "scellee",
  "telechargee",
] as const;
export type TypeEvenement = (typeof TYPES_EVENEMENT)[number];

export const NIVEAUX_IDENTITE = ["otp_seul", "standard", "renforce"] as const;
export type NiveauIdentite = (typeof NIVEAUX_IDENTITE)[number];

export const MODES_ENVELOPPE = ["sequentiel", "parallele"] as const;
export type ModeEnveloppe = (typeof MODES_ENVELOPPE)[number];

// Niveau de vérification d'un compte (distinct du niveau d'identité exigé par
// signataire) : un invité peut signer, seul un compte « verifie » peut émettre.
export const NIVEAUX_VERIFICATION = ["invite", "verifie"] as const;
export type NiveauVerification = (typeof NIVEAUX_VERIFICATION)[number];

// Issue d'une vérification d'identité (cf. 02_logic/03). Un score intermédiaire
// bascule en revue manuelle (`en_revue`), jamais un rejet sec.
export const RESULTATS_VERIFICATION = ["valide", "refuse", "en_revue"] as const;
export type ResultatVerification = (typeof RESULTATS_VERIFICATION)[number];
