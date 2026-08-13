import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { EnveloppeAgg } from "../domaine/modele";
import type {
  DepotEnveloppes,
  DepotVerification,
  EnveloppeVerifiable,
} from "../domaine/ports";

/**
 * DEV UNIQUEMENT — dépôt en mémoire. En production : Postgres (07_database).
 *
 * On stocke des copies des scalaires (enveloppe, signataires) pour que la garde
 * « figé après scellement » compare bien l'état PRÉCÉDENT. Le journal, lui, est
 * partagé : c'est un objet en ajout seul (I6), le partager est voulu.
 */
export class DepotEnveloppesMemoire implements DepotEnveloppes, DepotVerification {
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

  // ─── Vérification publique (lecture seule) ───────────────────

  async parRef(ref: string): Promise<EnveloppeVerifiable | null> {
    const agg = this.#store.get(ref);
    return agg ? this.#versVerifiable(agg) : null;
  }

  async parEmpreinte(empreinte: string): Promise<EnveloppeVerifiable | null> {
    for (const agg of this.#store.values()) {
      if (agg.enveloppe.statut === "scellee" && agg.enveloppe.documentHashOrigine === empreinte) {
        return this.#versVerifiable(agg);
      }
    }
    return null;
  }

  #versVerifiable(agg: EnveloppeAgg): EnveloppeVerifiable {
    return {
      id: agg.enveloppe.id,
      statut: agg.enveloppe.statut,
      documentHashOrigine: agg.enveloppe.documentHashOrigine,
      dateScellement: agg.enveloppe.dateScellement,
      cleDetruite: false, // pas de coffre de clés en mémoire (dev)
      signataires: agg.signataires.map((s) => ({
        nomDeclare: s.nomDeclare,
        niveau: s.niveauIdentiteExige,
        dateSignature: s.dateSignature,
      })),
    };
  }

  #copier(agg: EnveloppeAgg): EnveloppeAgg {
    return {
      enveloppe: { ...agg.enveloppe },
      signataires: agg.signataires.map((s) => ({ ...s })),
      journal: agg.journal,
    };
  }
}
