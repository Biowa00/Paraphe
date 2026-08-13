import type { Pool, PoolClient } from "pg";
import type { DepotVerification, EnveloppeVerifiable } from "../domaine/ports";

type Db = Pool | PoolClient;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function toIso(v: unknown): string | null {
  if (v == null) return null;
  return v instanceof Date ? v.toISOString() : String(v);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function chargerSignataires(db: Db, enveloppeId: string) {
  const rs = await db.query(
    `select nom_declare, niveau_identite_exige, date_signature
       from signataire where enveloppe_id = $1 order by ordre`,
    [enveloppeId],
  );
  return rs.rows.map((s: any) => ({
    nomDeclare: s.nom_declare,
    niveau: s.niveau_identite_exige,
    dateSignature: toIso(s.date_signature),
  }));
}

function versVerifiable(e: any, signataires: EnveloppeVerifiable["signataires"]): EnveloppeVerifiable {
  return {
    id: e.id,
    statut: e.statut,
    documentHashOrigine: e.document_hash_origine ?? null,
    dateScellement: toIso(e.date_scellement),
    cleDetruite: e.cle_detruite === true,
    signataires,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const SELECT_ENVELOPPE = `
  select e.id, e.statut, e.document_hash_origine, e.date_scellement,
         (ec.statut = 'detruite') as cle_detruite
    from enveloppe e
    left join enveloppe_cle ec on ec.enveloppe_id = e.id`;

export async function parRefDb(db: Db, ref: string): Promise<EnveloppeVerifiable | null> {
  // Une référence qui n'est pas un UUID ne correspond à rien (pas d'erreur SQL).
  if (!UUID.test(ref)) return null;
  const r = await db.query(`${SELECT_ENVELOPPE} where e.id = $1`, [ref]);
  if (r.rowCount === 0) return null;
  const signataires = await chargerSignataires(db, r.rows[0].id);
  return versVerifiable(r.rows[0], signataires);
}

export async function parEmpreinteDb(db: Db, empreinte: string): Promise<EnveloppeVerifiable | null> {
  const r = await db.query(
    `${SELECT_ENVELOPPE} where e.document_hash_origine = $1 and e.statut = 'scellee' limit 1`,
    [empreinte],
  );
  if (r.rowCount === 0) return null;
  const signataires = await chargerSignataires(db, r.rows[0].id);
  return versVerifiable(r.rows[0], signataires);
}

/** Adaptateur Postgres de la vérification publique (lecture seule). */
export class DepotVerificationPostgres implements DepotVerification {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async parRef(ref: string): Promise<EnveloppeVerifiable | null> {
    return parRefDb(this.#pool, ref);
  }

  async parEmpreinte(empreinte: string): Promise<EnveloppeVerifiable | null> {
    return parEmpreinteDb(this.#pool, empreinte);
  }
}
