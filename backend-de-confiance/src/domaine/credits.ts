// Crédits : registre en AJOUT SEUL. Le solde est la SOMME des lignes, jamais un
// compteur mutable (07_database/01). Le destinataire ne paie jamais (I8).

export type TitulaireType = "utilisateur" | "entreprise";
export type TypeCredit = "bienvenue" | "achat" | "consommation" | "ajustement";

export interface Titulaire {
  type: TitulaireType;
  id: string;
}

export interface TransactionCredit {
  titulaireType: TitulaireType;
  titulaireId: string;
  type: TypeCredit;
  /** Signé : positif crédite, négatif consomme. */
  montant: number;
  enveloppeId?: string | null;
  /** Référence opérateur (achat) — clé d'idempotence. */
  referenceExterne?: string | null;
}

export type StatutPaiement = "en_attente" | "confirme" | "echoue";

export interface Paiement {
  id: string;
  titulaireType: TitulaireType;
  titulaireId: string;
  packId: string;
  quantite: number;
  montant: number;
  devise: string;
  referenceExterne: string;
  statut: StatutPaiement;
}

// ─── Catalogue de packs ───────────────────────────────────────
// Prix = décision ouverte (entretiens PME) : valeurs de PLACEHOLDER, en FCFA.

export interface Pack {
  packId: string;
  quantite: number;
  prix: number;
  devise: string;
}

export const PACKS: readonly Pack[] = [
  { packId: "decouverte", quantite: 10, prix: 5000, devise: "XOF" },
  { packId: "pme", quantite: 50, prix: 22500, devise: "XOF" },
  { packId: "volume", quantite: 200, prix: 80000, devise: "XOF" },
];

export function trouverPack(packId: string): Pack | undefined {
  return PACKS.find((p) => p.packId === packId);
}
