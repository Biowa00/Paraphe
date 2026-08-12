import type {
  NiveauVerification,
  ResultatVerification,
} from "@paraphe/partage";

// Modèle du compte utilisateur et de sa vérification d'identité.
// Le NPI n'apparaît JAMAIS en clair ici : seul `npiHash` (HMAC+pepper, I4) est
// manipulé. Aucune image de pièce ni donnée biométrique n'est modélisée : elles
// ne sont pas conservées (I5).

export interface Utilisateur {
  id: string;
  /** Attribué à la vérification réussie : `BJ-XXXX-XXX`. Nul tant qu'invité. */
  identifiantPublic: string | null;
  telephone: string;
  niveauVerification: NiveauVerification;
  /** HMAC-SHA256(NPI, pepper) — jamais le NPI en clair (I4). Nul si non lié. */
  npiHash: string | null;
  nom: string | null;
  prenoms: string | null;
  /** Horodatage ISO de la vérification réussie ; nul tant qu'invité. */
  dateVerification: string | null;
}

export interface VerificationIdentite {
  id: string;
  utilisateurId: string;
  methode: "ocr_selfie" | "revue_manuelle";
  /** Score de face-match (0..1) ; nul si non applicable. */
  score: number | null;
  resultat: ResultatVerification;
  /** Identifiant de contrôle conservé après purge des pièces (I5). */
  controleRef: string;
}

/**
 * Agrégat produit par l'inscription : le compte, sa vérification, et le montant
 * de crédits de bienvenue à créditer (0 si le compte n'est pas encore vérifié).
 * Persisté en une seule transaction (registre crédit en ajout seul).
 */
export interface CompteVerifieAgg {
  utilisateur: Utilisateur;
  verification: VerificationIdentite;
  creditsBienvenue: number;
}

// ─── Décision de résultat (cf. 02_logic/03) ───────────────────

/** Seuils de face-match. Valeurs de conception, ajustables en `06`/`02`. */
export const SEUIL_VALIDE = 0.85;
export const SEUIL_REVUE = 0.6;

/**
 * Traduit un score de face-match en résultat. Un score intermédiaire bascule en
 * `en_revue` (revue manuelle < 24 h), jamais un rejet sec (02_logic/03).
 * La vivacité est un préalable traité en amont (échec ⇒ VIVACITE_ECHEC).
 */
export function deciderResultat(score: number): ResultatVerification {
  if (score >= SEUIL_VALIDE) return "valide";
  if (score >= SEUIL_REVUE) return "en_revue";
  return "refuse";
}

// ─── Identifiant public `BJ-XXXX-XXX` ─────────────────────────

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans I, L, O, 0, 1 (lisibilité)

/**
 * Forge un identifiant public `BJ-XXXX-XXX` à partir d'une source d'aléa.
 * `alea()` doit rendre un entier ≥ 0 ; l'unicité effective est garantie par la
 * contrainte unique en base (réessai en cas de collision, très improbable).
 */
export function genererIdentifiantPublic(alea: () => number): string {
  const tirer = (n: number): string => {
    let s = "";
    for (let i = 0; i < n; i++) {
      s += ALPHABET[Math.abs(Math.trunc(alea())) % ALPHABET.length];
    }
    return s;
  };
  return `BJ-${tirer(4)}-${tirer(3)}`;
}
