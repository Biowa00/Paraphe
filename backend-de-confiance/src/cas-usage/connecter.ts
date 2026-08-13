import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { NiveauVerification } from "@paraphe/partage";
import type { DepotUtilisateurs, ServiceOtp, ServiceSession } from "../domaine/ports";

export interface DemandeConnexion {
  telephone: string;
  /** Ticket OTP frais (action « connexion »), consommé à l'instant (I2). */
  otpTicket: string;
}

export interface DependancesConnexion {
  depot: DepotUtilisateurs;
  otp: ServiceOtp;
  session: ServiceSession;
}

export interface ResultatConnexion {
  token: string;
  utilisateur: {
    id: string;
    niveau: NiveauVerification;
    identifiantPublic: string | null;
  };
}

/**
 * Connexion par téléphone + OTP frais (I2). Retrouve le compte par téléphone et
 * délivre un jeton de session signé par le backend de confiance. Un OTP volé
 * sans compte correspondant ne connecte personne ; une session n'est jamais
 * une preuve de signature (l'OTP reste exigé à chaque signature, I2).
 */
export async function connecter(
  demande: DemandeConnexion,
  deps: DependancesConnexion,
): Promise<ResultatConnexion> {
  // OTP frais consommé d'abord (usage unique).
  await deps.otp.consommerTicket(demande.otpTicket, "connexion");

  const u = await deps.depot.parTelephone(demande.telephone);
  if (!u) {
    throw new ErreurMetier(
      CODES_ERREUR.CONNEXION_REFUSEE,
      "Aucun compte associé à ce numéro.",
    );
  }

  const token = deps.session.emettre({
    sub: u.id,
    niveau: u.niveauVerification,
    identifiantPublic: u.identifiantPublic,
  });

  return {
    token,
    utilisateur: { id: u.id, niveau: u.niveauVerification, identifiantPublic: u.identifiantPublic },
  };
}
