import type { FastifyReply } from "fastify";
import { ErreurMetier, type CodeErreur } from "@paraphe/partage";

// Correspondance code métier → statut HTTP (cf. 05_api_contracts/01).
const STATUT_PAR_CODE: Record<CodeErreur, number> = {
  otp_invalide: 422,
  otp_expire: 410,
  otp_trop_de_tentatives: 429,
  identite_niveau_insuffisant: 422,
  enveloppe_scellee: 409,
  enveloppe_expiree: 409,
  pas_votre_tour: 409,
  createur_ne_peut_valider: 403,
  credits_insuffisants: 422,
  npi_deja_utilise: 409,
  vivacite_echec: 422,
  trace_absente: 422,
  enveloppe_introuvable: 404,
  transition_interdite: 409,
};

export function envoyerErreur(reply: FastifyReply, erreur: unknown): void {
  if (erreur instanceof ErreurMetier) {
    const statut = STATUT_PAR_CODE[erreur.code] ?? 400;
    reply.status(statut).send({ erreur: { code: erreur.code, message: erreur.message } });
    return;
  }
  // Erreur inattendue : ne rien divulguer.
  reply.status(500).send({ erreur: { code: "erreur_interne", message: "Erreur interne." } });
}
