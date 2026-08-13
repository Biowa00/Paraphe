import { randomUUID } from "node:crypto";
import type { InstructionsPaiement, OperateurMobileMoney } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — opérateur Mobile Money simulé. Le fournisseur réel (MTN MoMo,
 * Moov Money, ou un agrégateur) est une décision ouverte (n°4) : coût par
 * transaction, webhook signé, réconciliation. Ici on fabrique une référence et
 * des instructions ; la confirmation arrive ensuite par le webhook (comme en réel).
 */
export class OperateurMobileMoneyLocalDev implements OperateurMobileMoney {
  async initier(
    montant: number,
    devise: string,
    _telephone: string,
  ): Promise<InstructionsPaiement> {
    void _telephone;
    const reference = `MM-${randomUUID()}`;
    return {
      reference,
      instructions:
        `Payez ${montant} ${devise} en Mobile Money puis validez sur votre téléphone. ` +
        `(Démo : aucun paiement réel ; la confirmation est simulée via le webhook.)`,
    };
  }
}
