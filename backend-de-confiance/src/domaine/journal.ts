import type { TypeEvenement } from "@paraphe/partage";

export interface Evenement {
  readonly enveloppeId: string;
  readonly type: TypeEvenement;
  readonly acteur: string;
  readonly horodatage: Date;
  readonly ip?: string;
  readonly userAgent?: string;
  readonly empreinteAppareil?: string;
  readonly donnees?: Readonly<Record<string, unknown>>;
}

/**
 * Journal en ajout seul (I6).
 *
 * L'invariant n'est pas défendu par une règle, il est rendu vrai par la forme
 * de l'objet : aucune méthode de modification ni de suppression n'existe. On ne
 * peut qu'`ajouter` et `lister`. La liste rendue est une copie, et chaque
 * événement inscrit est gelé — impossible de réécrire l'histoire.
 *
 * (Ceci est le miroir applicatif de la contrainte base : révocation d'UPDATE/
 * DELETE sur `evenement`, cf. 07_database/02.)
 */
export class JournalAjoutSeul {
  readonly #evenements: Evenement[] = [];

  ajouter(evenement: Evenement): void {
    this.#evenements.push(Object.freeze({ ...evenement }));
  }

  lister(): readonly Evenement[] {
    return [...this.#evenements];
  }

  get taille(): number {
    return this.#evenements.length;
  }
}
