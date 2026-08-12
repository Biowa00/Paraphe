// Ports : interfaces dont dépendent les cas d'usage. Les adaptateurs (KMS,
// stockage objet, cachet serveur…) les implémentent. Le domaine dépend
// d'abstractions, jamais d'un fournisseur concret (cf. 04_structure_rules/02).

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
