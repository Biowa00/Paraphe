import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import { PACKS, trouverPack, type Pack, type Paiement, type TitulaireType } from "../domaine/credits";
import type {
  DepotCredits,
  DepotPaiements,
  OperateurMobileMoney,
  Solde,
} from "../domaine/ports";

// ─── Consulter le solde ───────────────────────────────────────

export async function consulterSolde(
  titulaire: { type: TitulaireType; id: string },
  deps: { depot: DepotCredits },
): Promise<Solde> {
  return deps.depot.solde(titulaire.type, titulaire.id);
}

// ─── Catalogue de packs ───────────────────────────────────────

export function listerPacks(): readonly Pack[] {
  return PACKS;
}

// ─── Acheter des crédits (initie le paiement Mobile Money) ─────

export interface DemandeAchat {
  titulaireType: TitulaireType;
  titulaireId: string;
  packId: string;
  telephone: string;
}

export interface DependancesAchat {
  depotPaiements: DepotPaiements;
  operateur: OperateurMobileMoney;
  genererId: () => string;
}

export interface ResultatAchat {
  transactionId: string;
  statut: "en_attente";
  instructionsPaiement: string;
}

/**
 * Initie un achat : choisit le pack, demande à l'opérateur des instructions de
 * paiement, et enregistre le paiement « en_attente ». Aucun crédit n'est ajouté
 * ici : le solde ne bouge qu'à la confirmation du webhook (05_api_contracts/05).
 */
export async function acheterCredits(
  demande: DemandeAchat,
  deps: DependancesAchat,
): Promise<ResultatAchat> {
  const pack = trouverPack(demande.packId);
  if (!pack) {
    throw new ErreurMetier(CODES_ERREUR.TRANSITION_INTERDITE, "Pack de crédits inconnu.");
  }

  const instr = await deps.operateur.initier(pack.prix, pack.devise, demande.telephone);

  const paiement: Paiement = {
    id: deps.genererId(),
    titulaireType: demande.titulaireType,
    titulaireId: demande.titulaireId,
    packId: pack.packId,
    quantite: pack.quantite,
    montant: pack.prix,
    devise: pack.devise,
    referenceExterne: instr.reference,
    statut: "en_attente",
  };
  await deps.depotPaiements.creer(paiement);

  return {
    transactionId: instr.reference,
    statut: "en_attente",
    instructionsPaiement: instr.instructions,
  };
}

// ─── Confirmer un paiement (webhook opérateur, idempotent) ─────

export interface ResultatWebhook {
  statut: "confirme" | "echoue" | "ignore";
  credite: boolean;
}

/**
 * Traite la notification opérateur. Idempotent : une double notification ne
 * crédite jamais deux fois. Un échec/interruption ne débite rien (I8, solde
 * inchangé). Une référence inconnue est ignorée sans effet.
 */
export async function confirmerPaiement(
  entree: { reference: string; succes: boolean },
  deps: { depotPaiements: DepotPaiements },
): Promise<ResultatWebhook> {
  const paiement = await deps.depotPaiements.parReference(entree.reference);
  if (!paiement) {
    return { statut: "ignore", credite: false };
  }
  const r = await deps.depotPaiements.confirmer(entree.reference, entree.succes);
  return { statut: entree.succes ? "confirme" : "echoue", credite: r.credite };
}
