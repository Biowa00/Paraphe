// Traduction des codes d'erreur métier stables (backend) en messages humains.
// L'UI traduit à partir du code, jamais l'inverse (05_api_contracts/01).

const MESSAGES: Record<string, string> = {
  otp_invalide: "Le code n'est pas valide. Recommencez.",
  otp_expire: "Le code a expiré. Demandez-en un nouveau.",
  otp_trop_de_tentatives: "Trop de tentatives. Patientez un instant avant de réessayer.",
  identite_niveau_insuffisant: "Le niveau d'identité requis pour signer n'est pas atteint.",
  pas_votre_tour: "Ce n'est pas encore votre tour de signer.",
  enveloppe_scellee: "Ce document est déjà scellé : il ne peut plus être signé.",
  enveloppe_expiree: "Ce document a expiré.",
  trace_absente: "Veuillez tracer votre signature avant de valider.",
  enveloppe_introuvable: "Ce document est introuvable ou le lien n'est plus valide.",
  transition_interdite: "Cette action n'est pas possible dans l'état actuel du document.",
  reseau: "Impossible de joindre le service. Vérifiez votre connexion.",
};

export function messageErreur(code: string): string {
  return MESSAGES[code] ?? "Une erreur est survenue. Réessayez.";
}
