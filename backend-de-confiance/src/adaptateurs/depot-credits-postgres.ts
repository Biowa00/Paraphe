import type { Pool, PoolClient } from "pg";
import type { Paiement, TitulaireType, TransactionCredit } from "../domaine/credits";
import type {
  DepotCredits,
  DepotPaiements,
  ResultatConfirmation,
  Solde,
} from "../domaine/ports";

type Db = Pool | PoolClient;

// ─── Crédits (registre en ajout seul) ─────────────────────────

export async function soldeDb(db: Db, type: TitulaireType, id: string): Promise<Solde> {
  const r = await db.query<{ solde: number; bienvenue: number }>(
    `select
       coalesce(sum(montant), 0)::int as solde,
       coalesce(sum(montant) filter (where type = 'bienvenue'), 0)::int as bienvenue
     from credit_transaction
     where titulaire_type = $1 and titulaire_id = $2`,
    [type, id],
  );
  return { solde: r.rows[0]?.solde ?? 0, dontBienvenue: r.rows[0]?.bienvenue ?? 0 };
}

export async function enregistrerCreditDb(db: Db, tx: TransactionCredit): Promise<void> {
  await db.query(
    `insert into credit_transaction (titulaire_type, titulaire_id, type, montant, enveloppe_id, reference_externe)
     values ($1, $2, $3, $4, $5, $6)`,
    [tx.titulaireType, tx.titulaireId, tx.type, tx.montant, tx.enveloppeId ?? null, tx.referenceExterne ?? null],
  );
}

/**
 * Débite 1 crédit pour un envoi, atomiquement : la ligne n'est insérée que si le
 * solde courant est ≥ 1 (condition évaluée dans le même ordre SQL). Renvoie vrai
 * si une ligne a été écrite.
 */
export async function debiterEnvoiDb(
  db: Db,
  type: TitulaireType,
  id: string,
  enveloppeId: string,
): Promise<boolean> {
  const r = await db.query(
    `insert into credit_transaction (titulaire_type, titulaire_id, type, montant, enveloppe_id)
     select $1, $2, 'consommation', -1, $3
     where (
       select coalesce(sum(montant), 0) from credit_transaction
       where titulaire_type = $1 and titulaire_id = $2
     ) >= 1
     returning id`,
    [type, id, enveloppeId],
  );
  return (r.rowCount ?? 0) > 0;
}

export class DepotCreditsPostgres implements DepotCredits {
  readonly #pool: Pool;
  constructor(pool: Pool) {
    this.#pool = pool;
  }
  solde(type: TitulaireType, id: string): Promise<Solde> {
    return soldeDb(this.#pool, type, id);
  }
  enregistrer(tx: TransactionCredit): Promise<void> {
    return enregistrerCreditDb(this.#pool, tx);
  }
  debiterEnvoi(type: TitulaireType, id: string, enveloppeId: string): Promise<boolean> {
    return debiterEnvoiDb(this.#pool, type, id, enveloppeId);
  }
}

// ─── Paiements (confirmation idempotente) ─────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
function versPaiement(r: any): Paiement {
  return {
    id: r.id,
    titulaireType: r.titulaire_type,
    titulaireId: r.titulaire_id,
    packId: r.pack_id,
    quantite: r.quantite,
    montant: Number(r.montant),
    devise: r.devise,
    referenceExterne: r.reference_externe,
    statut: r.statut,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function creerPaiementDb(db: Db, p: Paiement): Promise<void> {
  await db.query(
    `insert into paiement
       (id, titulaire_type, titulaire_id, pack_id, quantite, montant, devise, reference_externe, statut)
     values ($1, $2, $3, $4, $5, $6, $7, $8, 'en_attente')`,
    [p.id, p.titulaireType, p.titulaireId, p.packId, p.quantite, p.montant, p.devise, p.referenceExterne],
  );
}

export async function paiementParReferenceDb(db: Db, reference: string): Promise<Paiement | null> {
  const r = await db.query(`select * from paiement where reference_externe = $1`, [reference]);
  return r.rowCount ? versPaiement(r.rows[0]) : null;
}

/**
 * Confirme et crédite atomiquement. `for update` verrouille la ligne : deux
 * webhooks concurrents ne créditent pas deux fois ; l'index unique sur
 * credit_transaction.reference_externe est le garde-fou ultime.
 */
export async function confirmerPaiementDb(
  db: Db,
  reference: string,
  succes: boolean,
): Promise<ResultatConfirmation> {
  const r = await db.query(
    `select * from paiement where reference_externe = $1 for update`,
    [reference],
  );
  if (r.rowCount === 0) return { credite: false, quantite: 0 };
  const p = versPaiement(r.rows[0]);
  if (p.statut !== "en_attente") return { credite: false, quantite: p.quantite };

  if (!succes) {
    await db.query(`update paiement set statut = 'echoue' where reference_externe = $1`, [reference]);
    return { credite: false, quantite: p.quantite };
  }

  await db.query(
    `update paiement set statut = 'confirme', date_confirmation = now() where reference_externe = $1`,
    [reference],
  );
  await db.query(
    `insert into credit_transaction (titulaire_type, titulaire_id, type, montant, reference_externe)
     values ($1, $2, 'achat', $3, $4)
     on conflict (reference_externe) where reference_externe is not null do nothing`,
    [p.titulaireType, p.titulaireId, p.quantite, reference],
  );
  return { credite: true, quantite: p.quantite };
}

export class DepotPaiementsPostgres implements DepotPaiements {
  readonly #pool: Pool;
  constructor(pool: Pool) {
    this.#pool = pool;
  }
  creer(p: Paiement): Promise<void> {
    return creerPaiementDb(this.#pool, p);
  }
  parReference(reference: string): Promise<Paiement | null> {
    return paiementParReferenceDb(this.#pool, reference);
  }
  async confirmer(reference: string, succes: boolean): Promise<ResultatConfirmation> {
    const client = await this.#pool.connect();
    try {
      await client.query("begin");
      const r = await confirmerPaiementDb(client, reference, succes);
      await client.query("commit");
      return r;
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }
}
