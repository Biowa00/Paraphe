import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { NiveauVerification, ResultatVerification } from "@paraphe/partage";
import {
  deciderResultat,
  genererIdentifiantPublic,
  type CompteVerifieAgg,
  type Utilisateur,
  type VerificationIdentite,
} from "../domaine/utilisateur";
import type {
  DepotUtilisateurs,
  HacheurNpi,
  Horloge,
  ServiceBiometrie,
  ServiceOcrPiece,
  ServiceOtp,
} from "../domaine/ports";

export interface DemandeInscription {
  telephone: string;
  /** Ticket OTP frais (action « inscription »), consommé à l'instant (I2/I7). */
  otpTicket: string;
  /** Référence vers la pièce chiffrée (jamais d'octets en clair côté domaine). */
  refPiece: string;
  /** Référence vers le selfie animé (supprimé après comparaison, I5). */
  refSelfie: string;
}

export interface DependancesInscription {
  depot: DepotUtilisateurs;
  otp: ServiceOtp;
  ocr: ServiceOcrPiece;
  biometrie: ServiceBiometrie;
  hacheurNpi: HacheurNpi;
  horloge: Horloge;
  genererId: () => string;
  /** Source d'aléa pour l'identifiant public (entier ≥ 0). */
  alea: () => number;
}

export interface ResultatInscription {
  utilisateurId: string;
  niveau: NiveauVerification;
  resultat: ResultatVerification;
  identifiantPublic: string | null;
  creditsBienvenue: number;
}

const CREDITS_BIENVENUE = 3;

/**
 * Inscription vérifiée (01_features/01, 02_logic/03). Consomme un OTP frais,
 * lit la pièce (OCR), vérifie vivacité + face-match, hache le NPI (I4) et
 * contrôle son unicité, puis crée le compte + sa vérification + les crédits de
 * bienvenue en une seule transaction.
 *
 * - `valide`  → compte « verifie », identifiant public, 3 crédits de bienvenue.
 * - `en_revue`→ compte « invite » en attente de revue manuelle (< 24 h) ; le NPI
 *   reste réservé. La promotion opérateur est un chemin interne ultérieur.
 * - `refuse`  → compte « invite », aucun crédit, NPI non réservé.
 *
 * Aucune image ni donnée biométrique n'est conservée (I5) : le domaine ne
 * manipule que des références. Le NPI n'existe jamais en clair au repos (I4).
 */
export async function inscrireCompteVerifie(
  demande: DemandeInscription,
  deps: DependancesInscription,
): Promise<ResultatInscription> {
  // 1. OTP frais consommé — pas de compte vérifié sans parcours effectif (I2/I7).
  await deps.otp.consommerTicket(demande.otpTicket, "inscription");

  // 2. OCR de la pièce (peut lever piece_illisible).
  const extrait = await deps.ocr.extraire(demande.refPiece);

  // 3. NPI haché puis contrôle d'unicité (I4). Le clair n'est jamais conservé.
  const npiHash = await deps.hacheurNpi.hacher(extrait.npi);
  if (await deps.depot.npiHashExiste(npiHash)) {
    throw new ErreurMetier(
      CODES_ERREUR.NPI_DEJA_UTILISE,
      "Un compte actif est déjà rattaché à cette pièce.",
    );
  }

  // 4. Vivacité (préalable) puis face-match.
  const bio = await deps.biometrie.verifier(demande.refSelfie, demande.refPiece);
  if (!bio.vivaciteOk) {
    throw new ErreurMetier(CODES_ERREUR.VIVACITE_ECHEC, "Vivacité non prouvée.");
  }

  // 5. Décision. Une cohérence douteuse ne peut jamais donner « valide ».
  let resultat = deciderResultat(bio.score);
  if (extrait.coherence === "douteuse" && resultat === "valide") {
    resultat = "en_revue";
  }

  const maintenant = deps.horloge.maintenant().toISOString();
  const estValide = resultat === "valide";
  const utilisateurId = deps.genererId();

  const utilisateur: Utilisateur = {
    id: utilisateurId,
    identifiantPublic: estValide ? genererIdentifiantPublic(deps.alea) : null,
    telephone: demande.telephone,
    niveauVerification: estValide ? "verifie" : "invite",
    // Sur refus net, on ne réserve pas le NPI ; sinon on le lie (unicité).
    npiHash: resultat === "refuse" ? null : npiHash,
    nom: extrait.nom,
    prenoms: extrait.prenoms,
    dateVerification: estValide ? maintenant : null,
  };

  const verification: VerificationIdentite = {
    id: deps.genererId(),
    utilisateurId,
    methode: "ocr_selfie",
    score: bio.score,
    resultat,
    // Identifiant de contrôle conservé après purge des pièces (I5).
    controleRef: deps.genererId(),
  };

  const agg: CompteVerifieAgg = {
    utilisateur,
    verification,
    creditsBienvenue: estValide ? CREDITS_BIENVENUE : 0,
  };

  await deps.depot.creerCompteVerifie(agg);

  return {
    utilisateurId,
    niveau: utilisateur.niveauVerification,
    resultat,
    identifiantPublic: utilisateur.identifiantPublic,
    creditsBienvenue: agg.creditsBienvenue,
  };
}
