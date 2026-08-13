import type { Paiement, TitulaireType, TransactionCredit } from "../domaine/credits";
import type {
  DepotCredits,
  DepotPaiements,
  ResultatConfirmation,
  Solde,
} from "../domaine/ports";

/** DEV / TESTS — registre de crédits en mémoire (ajout seul). */
export class DepotCreditsMemoire implements DepotCredits {
  readonly lignes: TransactionCredit[] = [];

  async solde(type: TitulaireType, id: string): Promise<Solde> {
    let solde = 0;
    let dontBienvenue = 0;
    for (const l of this.lignes) {
      if (l.titulaireType === type && l.titulaireId === id) {
        solde += l.montant;
        if (l.type === "bienvenue") dontBienvenue += l.montant;
      }
    }
    return { solde, dontBienvenue };
  }

  async enregistrer(tx: TransactionCredit): Promise<void> {
    this.lignes.push({ ...tx });
  }
}

/** DEV / TESTS — paiements en mémoire, confirmation idempotente. */
export class DepotPaiementsMemoire implements DepotPaiements {
  readonly #paiements = new Map<string, Paiement>();
  readonly #credits: DepotCreditsMemoire;

  constructor(credits: DepotCreditsMemoire) {
    this.#credits = credits;
  }

  async creer(p: Paiement): Promise<void> {
    this.#paiements.set(p.referenceExterne, { ...p });
  }

  async parReference(reference: string): Promise<Paiement | null> {
    const p = this.#paiements.get(reference);
    return p ? { ...p } : null;
  }

  async confirmer(reference: string, succes: boolean): Promise<ResultatConfirmation> {
    const p = this.#paiements.get(reference);
    if (!p) return { credite: false, quantite: 0 };
    // Idempotence : déjà traité → aucun nouveau crédit.
    if (p.statut !== "en_attente") return { credite: false, quantite: p.quantite };
    if (!succes) {
      p.statut = "echoue";
      return { credite: false, quantite: p.quantite };
    }
    p.statut = "confirme";
    await this.#credits.enregistrer({
      titulaireType: p.titulaireType,
      titulaireId: p.titulaireId,
      type: "achat",
      montant: p.quantite,
      referenceExterne: reference,
    });
    return { credite: true, quantite: p.quantite };
  }
}
