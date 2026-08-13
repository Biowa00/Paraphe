// Ports : interfaces dont dépendent les cas d'usage. Les adaptateurs (KMS,
// stockage objet, cachet serveur…) les implémentent. Le domaine dépend
// d'abstractions, jamais d'un fournisseur concret (cf. 04_structure_rules/02).

import type { NiveauIdentite, NiveauVerification, StatutEnveloppe } from "@paraphe/partage";
import type { EnveloppeAgg } from "./modele";
import type { CompteVerifieAgg, Utilisateur } from "./utilisateur";
import type { Paiement, TitulaireType, TransactionCredit } from "./credits";

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

// ─── Vérification publique (lecture seule, sans compte) ───────

export interface SignataireVerifiable {
  nomDeclare: string;
  niveau: NiveauIdentite;
  dateSignature: string | null;
}

/**
 * Projection publique d'une enveloppe : uniquement ce qui sert à la preuve.
 * N'expose JAMAIS le contenu ni le titre (chiffré au repos) — cohérent avec I7.
 */
export interface EnveloppeVerifiable {
  id: string;
  statut: StatutEnveloppe;
  /** Empreinte SHA-256 figée à l'envoi (couche intégrité). */
  documentHashOrigine: string | null;
  dateScellement: string | null;
  /** Clé détruite (crypto-shredding) : le contenu n'est plus lisible (I5/effacement). */
  cleDetruite: boolean;
  signataires: SignataireVerifiable[];
}

/**
 * Dépôt de lecture pour la vérification publique. Ne rend que la projection
 * publique ; `parEmpreinte` ne renvoie qu'une enveloppe SCELLÉE (on ne divulgue
 * pas les brouillons).
 */
export interface DepotVerification {
  parRef(ref: string): Promise<EnveloppeVerifiable | null>;
  parEmpreinte(empreinte: string): Promise<EnveloppeVerifiable | null>;
}

// ─── Archive personnelle ──────────────────────────────────────

/** Résumé d'une enveloppe pour l'archive de son créateur (titre visible par lui). */
export interface EnveloppeResume {
  id: string;
  titre: string;
  statut: StatutEnveloppe;
  mode: "sequentiel" | "parallele";
  dateCreation: string;
  dateScellement: string | null;
  signataires: { id: string; nomDeclare: string; statut: string }[];
}

/** Dépôt de lecture de l'archive : les enveloppes créées par un utilisateur. */
export interface DepotArchive {
  mesEnveloppes(createurId: string): Promise<EnveloppeResume[]>;
}

// ─── Crédits & paiements (Mobile Money) ───────────────────────

/** Solde d'un titulaire = somme du registre (ajout seul), détaillé par type. */
export interface Solde {
  solde: number;
  dontBienvenue: number;
}

export interface DepotCredits {
  solde(type: TitulaireType, id: string): Promise<Solde>;
  enregistrer(tx: TransactionCredit): Promise<void>;
  /**
   * Débite 1 crédit pour l'envoi d'une enveloppe, de façon atomique et
   * conditionnelle : ne débite QUE si le solde est ≥ 1. Renvoie `false` si le
   * solde est insuffisant (aucune ligne écrite).
   */
  debiterEnvoi(type: TitulaireType, id: string, enveloppeId: string): Promise<boolean>;
}

/** Résultat de la confirmation d'un paiement (idempotente). */
export interface ResultatConfirmation {
  /** Vrai si CE webhook a effectivement crédité (faux = déjà traité). */
  credite: boolean;
  quantite: number;
}

export interface DepotPaiements {
  creer(p: Paiement): Promise<void>;
  parReference(reference: string): Promise<Paiement | null>;
  /**
   * Confirme un paiement et crédite le solde EN UNE TRANSACTION, de façon
   * idempotente : un second appel avec la même référence ne crédite pas deux
   * fois (05_api_contracts/05).
   */
  confirmer(reference: string, succes: boolean): Promise<ResultatConfirmation>;
}

/** Instructions de paiement rendues à l'acheteur. */
export interface InstructionsPaiement {
  reference: string;
  instructions: string;
}

/**
 * Opérateur Mobile Money. Initie une demande de paiement et renvoie des
 * instructions + une référence. Le fournisseur réel (MTN/Moov) est une décision
 * ouverte (n°4) ; en dev, un adaptateur simulé.
 */
export interface OperateurMobileMoney {
  initier(montant: number, devise: string, telephone: string): Promise<InstructionsPaiement>;
}

/** Dépôt des comptes utilisateurs et de leur vérification d'identité. */
export interface DepotUtilisateurs {
  /** Existe-t-il déjà un compte actif rattaché à ce hash de NPI ? (unicité, I4) */
  npiHashExiste(npiHash: string): Promise<boolean>;
  /** Insère compte + vérification + crédits de bienvenue en une transaction. */
  creerCompteVerifie(agg: CompteVerifieAgg): Promise<void>;
  charger(id: string): Promise<CompteVerifieAgg | null>;
  /** Retrouve un compte par son téléphone (pour la connexion). */
  parTelephone(telephone: string): Promise<Utilisateur | null>;
}

// ─── Session (connexion) ──────────────────────────────────────

export interface SessionPayload {
  /** Identifiant de l'utilisateur connecté. */
  sub: string;
  niveau: NiveauVerification;
  identifiantPublic: string | null;
}

/**
 * Jeton de session signé par le backend de confiance (téléphone + OTP →
 * session). Le secret vit hors code (env dev → KMS en prod). Aucun secret côté
 * client : le client ne fait que porter le jeton (04_structure_rules/05).
 */
export interface ServiceSession {
  emettre(payload: SessionPayload): string;
  /** Renvoie la charge utile si le jeton est valide et non expiré, sinon null. */
  verifier(token: string): SessionPayload | null;
}
