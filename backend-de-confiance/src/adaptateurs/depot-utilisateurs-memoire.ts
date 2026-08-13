import type { CompteVerifieAgg, Utilisateur } from "../domaine/utilisateur";
import type { DepotCredits, DepotUtilisateurs } from "../domaine/ports";

/** DEV / TESTS — dépôt utilisateurs en mémoire. Miroir de l'adaptateur Postgres. */
export class DepotUtilisateursMemoire implements DepotUtilisateurs {
  readonly #comptes = new Map<string, CompteVerifieAgg>();
  readonly #creditsLedger?: DepotCredits;
  /** Registre des crédits (ajout seul) : montants par titulaire. */
  readonly credits: Array<{ titulaireId: string; type: string; montant: number }> = [];

  /**
   * `creditsLedger` (optionnel) : registre partagé où déposer les crédits de
   * bienvenue, pour que le solde/débit les voient — comme en Postgres, où ils
   * vivent dans `credit_transaction`.
   */
  constructor(creditsLedger?: DepotCredits) {
    this.#creditsLedger = creditsLedger;
  }

  async npiHashExiste(npiHash: string): Promise<boolean> {
    for (const c of this.#comptes.values()) {
      if (c.utilisateur.npiHash === npiHash) return true;
    }
    return false;
  }

  async creerCompteVerifie(agg: CompteVerifieAgg): Promise<void> {
    // Copie défensive : le dépôt ne partage pas de référence mutable.
    this.#comptes.set(agg.utilisateur.id, structuredClone(agg));
    if (agg.creditsBienvenue > 0) {
      this.credits.push({
        titulaireId: agg.utilisateur.id,
        type: "bienvenue",
        montant: agg.creditsBienvenue,
      });
      await this.#creditsLedger?.enregistrer({
        titulaireType: "utilisateur",
        titulaireId: agg.utilisateur.id,
        type: "bienvenue",
        montant: agg.creditsBienvenue,
      });
    }
  }

  async charger(id: string): Promise<CompteVerifieAgg | null> {
    const c = this.#comptes.get(id);
    return c ? structuredClone(c) : null;
  }

  async parTelephone(telephone: string): Promise<Utilisateur | null> {
    for (const c of this.#comptes.values()) {
      if (c.utilisateur.telephone === telephone) return structuredClone(c.utilisateur);
    }
    return null;
  }
}
