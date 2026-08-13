import type { Pool, PoolClient } from "pg";
import type { DepotArchive, EnveloppeResume } from "../domaine/ports";

type Db = Pool | PoolClient;

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

/**
 * Liste les enveloppes créées par un utilisateur (son archive). Le titre lui est
 * visible (c'est son document). En une requête + une pour les signataires.
 */
export async function mesEnveloppesDb(db: Db, createurId: string): Promise<EnveloppeResume[]> {
  const re = await db.query(
    `select id, titre, statut, mode, date_creation, date_scellement
       from enveloppe where createur_id = $1 order by date_creation desc`,
    [createurId],
  );
  if (re.rowCount === 0) return [];

  const ids = re.rows.map((r) => r.id);
  const rs = await db.query(
    `select id, enveloppe_id, nom_declare, statut, ordre
       from signataire where enveloppe_id = any($1) order by ordre`,
    [ids],
  );

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const parEnveloppe = new Map<string, EnveloppeResume["signataires"]>();
  for (const s of rs.rows as any[]) {
    const liste = parEnveloppe.get(s.enveloppe_id) ?? [];
    liste.push({ id: s.id, nomDeclare: s.nom_declare, statut: s.statut });
    parEnveloppe.set(s.enveloppe_id, liste);
  }

  return (re.rows as any[]).map((r) => ({
    id: r.id,
    titre: r.titre,
    statut: r.statut,
    mode: r.mode,
    dateCreation: toIso(r.date_creation),
    dateScellement: r.date_scellement ? toIso(r.date_scellement) : null,
    signataires: parEnveloppe.get(r.id) ?? [],
  }));
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export class DepotArchivePostgres implements DepotArchive {
  readonly #pool: Pool;
  constructor(pool: Pool) {
    this.#pool = pool;
  }
  mesEnveloppes(createurId: string): Promise<EnveloppeResume[]> {
    return mesEnveloppesDb(this.#pool, createurId);
  }
}
