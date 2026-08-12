// Codes d'erreur métier stables (cf. 05_api_contracts/01-conventions).
// Jamais traduits : l'UI traduit à partir du code.

export const CODES_ERREUR = {
  OTP_INVALIDE: "otp_invalide",
  OTP_EXPIRE: "otp_expire",
  OTP_TROP_DE_TENTATIVES: "otp_trop_de_tentatives",
  IDENTITE_NIVEAU_INSUFFISANT: "identite_niveau_insuffisant",
  ENVELOPPE_SCELLEE: "enveloppe_scellee",
  ENVELOPPE_EXPIREE: "enveloppe_expiree",
  PAS_VOTRE_TOUR: "pas_votre_tour",
  CREATEUR_NE_PEUT_VALIDER: "createur_ne_peut_valider",
  CREDITS_INSUFFISANTS: "credits_insuffisants",
  NPI_DEJA_UTILISE: "npi_deja_utilise",
  VIVACITE_ECHEC: "vivacite_echec",
  TRACE_ABSENTE: "trace_absente",
  ENVELOPPE_INTROUVABLE: "enveloppe_introuvable",
  TRANSITION_INTERDITE: "transition_interdite",
} as const;

export type CodeErreur = (typeof CODES_ERREUR)[keyof typeof CODES_ERREUR];

export class ErreurMetier extends Error {
  readonly code: CodeErreur;

  constructor(code: CodeErreur, message?: string) {
    super(message ?? code);
    this.name = "ErreurMetier";
    this.code = code;
  }
}
