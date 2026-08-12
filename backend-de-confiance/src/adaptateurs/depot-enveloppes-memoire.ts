import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { EnveloppeAgg } from "../domaine/modele";
import type { DepotEnveloppes } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — dépôt en mémoire. En production : Postgres (07_database).
 *
 * On stocke des copies des scalaires (enveloppe, signataires) pour que la garde
 * « figé après scellement » compare bien l'état PRÉCÉDENT. Le journal, lui, est
 * partagé : c'est un objet en ajout seul (I6), le partager est voulu.
 */
export class DepotEnveloppesMemoire implements DepotEnveloppes {
  readonly #store = new Map<string, EnveloppeAgg>();

  async creer(agg: EnveloppeAgg): Promise<void> {
    if (this.#store.has(agg.enveloppe.id)) {
      throw new ErreurMetier(
        CODES_ERREUR.TRANSITION_INTERDITE,
        "Enveloppe déjà existante.",
      );
    }
    this.#store.set(agg.enveloppe.id, this.#copier(agg));
  }

  async charger(id: string): Promise<EnveloppeAgg | null> {
    const stocke = this.#store.get(id);
    return stocke ? this.#copier(stocke) : null;
  }

  async enregistrer(agg: EnveloppeAgg): Promise<void> {
    const existant = this.#store.get(agg.enveloppe.id);
    if (!existant) {
      throw new ErreurMetier(
        CODES_ERREUR.ENVELOPPE_INTROUVABLE,
        "Enveloppe introuvable.",
      );
    }
    // I3 (garde dev) : on n'écrit jamais par-dessus une enveloppe déjà scellée.
    // L'enforcement fort est en base (07_database/02) ; ici, cohérence.
    if (existant.enveloppe.statut === "scellee") {
      throw new ErreurMetier(
        CODES_ERREUR.ENVELOPPE_SCELLEE,
        "Enveloppe scellée : figée.",
      );
    }
    this.#store.set(agg.enveloppe.id, this.#copier(agg));
  }

  #copier(agg: EnveloppeAgg): EnveloppeAgg {
    return {
      enveloppe: { ...agg.enveloppe },
      signataires: agg.signataires.map((s) => ({ ...s })),
      journal: agg.journal,
    };
  }
}
