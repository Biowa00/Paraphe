// Ports : interfaces dont dépendent les cas d'usage. Les adaptateurs (KMS,
// stockage objet, cachet serveur…) les implémentent. Le domaine dépend
// d'abstractions, jamais d'un fournisseur concret (cf. 04_structure_rules/02).

import type { EnveloppeAgg } from "./modele";
import type { CompteVerifieAgg } from "./utilisateur";

export interface ResultatChiffrement {
  /** Référence de la clé au KMS (jamais la clé elle-même). */
  refCle: string;
  /** Contenu chiffré, seul objet destiné au stockage. */
  chiffre: Buffer;
}

/**
 * Chiffrement par enveloppe (I7) : une clé propre à chaque document, détenue
 * hors du stockage. Détruire la clé rend le contenu illisible (crypto-shredding,
 * cf. 02_logic/04).
 */
export interface ChiffreurEnveloppe {
  chiffrer(enveloppeId: string, clair: Buffer): Promise<ResultatChiffrement>;
  dechiffrer(refCle: string, chiffre: Buffer): Promise<Buffer>;
  detruireCle(refCle: string): Promise<void>;
}

/** Stockage objet en écriture unique (WORM) : soutient I3. */
export interface StockageDocuments {
  /** Écrit un objet. Refuse d'écraser un chemin déjà présent. */
  ecrire(chemin: string, contenu: Buffer): Promise<void>;
  lire(chemin: string): Promise<Buffer>;
}

export interface Sceau {
  algorithme: string;
  /** Signature encodée en base64. */
  signature: string;
  /** Référence de la clé publique (empreinte ancrée publiquement, 02_logic/02). */
  refClePublique: string;
}

/** Cachet serveur : signe l'enveloppe scellée et le dossier de preuve. */
export interface SceauServeur {
  readonly refClePublique: string;
  sceller(donnees: Buffer): Promise<Sceau>;
}

/** Source de temps injectable (testable). */
export interface Horloge {
  maintenant(): Date;
}

/** Dépôt de l'agrégat enveloppe (métadonnées + signataires + journal). */
export interface DepotEnveloppes {
  creer(agg: EnveloppeAgg): Promise<void>;
  charger(id: string): Promise<EnveloppeAgg | null>;
  enregistrer(agg: EnveloppeAgg): Promise<void>;
}

export type ActionOtp = "inscription" | "signature" | "connexion";

/**
 * Guichet OTP. `consommerTicket` valide et CONSOMME un ticket frais lié à une
 * action précise : à usage unique (I2). Un ticket rejoué, expiré ou destiné à
 * une autre action est rejeté.
 */
export interface ServiceOtp {
  consommerTicket(ticket: string, action: ActionOtp): Promise<void>;
}

/**
 * Hachage déterministe du NPI : HMAC-SHA256(NPI, pepper), pepper au KMS hors
 * base (I4). Déterministe pour garantir l'unicité d'un compte ; jamais de sel
 * aléatoire par enregistrement (02_logic/03).
 */
export interface HacheurNpi {
  hacher(npi: string): Promise<string>;
}

/** Données extraites d'une pièce par OCR (le NPI n'est jamais renvoyé au client). */
export interface ExtraitPiece {
  npi: string;
  nom: string;
  prenoms: string;
  dateNaissance: string;
  /** Contrôles de cohérence/falsification : `ok` ou `douteuse`. */
  coherence: "ok" | "douteuse";
}

/**
 * OCR d'une pièce d'identité. Reçoit une RÉFÉRENCE vers la pièce chiffrée (jamais
 * conservée en clair) et rend l'extrait. L'image est purgée après vérification
 * hors de ce port (I5) ; ce port ne persiste rien.
 */
export interface ServiceOcrPiece {
  extraire(refPiece: string): Promise<ExtraitPiece>;
}

/** Résultat d'une vérification biométrique (vivacité + face-match). */
export interface ResultatBiometrie {
  vivaciteOk: boolean;
  /** Score de face-match (0..1). */
  score: number;
}

/**
 * Vivacité + face-match. Reçoit des RÉFÉRENCES (selfie animé, portrait de la
 * pièce) ; le selfie sert à la comparaison puis est supprimé, aucune donnée
 * biométrique conservée (02_logic/03, I5). Ce port ne persiste rien.
 */
export interface ServiceBiometrie {
  verifier(refSelfie: string, refPortrait: string): Promise<ResultatBiometrie>;
}

/** Dépôt des comptes utilisateurs et de leur vérification d'identité. */
export interface DepotUtilisateurs {
  /** Existe-t-il déjà un compte actif rattaché à ce hash de NPI ? (unicité, I4) */
  npiHashExiste(npiHash: string): Promise<boolean>;
  /** Insère compte + vérification + crédits de bienvenue en une transaction. */
  creerCompteVerifie(agg: CompteVerifieAgg): Promise<void>;
  charger(id: string): Promise<CompteVerifieAgg | null>;
}
