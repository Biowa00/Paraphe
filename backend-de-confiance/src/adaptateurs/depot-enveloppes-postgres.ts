import type { Pool, PoolClient } from "pg";
import { JournalAjoutSeul, type Evenement } from "../domaine/journal";
import type { Enveloppe, EnveloppeAgg, Signataire } from "../domaine/modele";
import type { DepotEnveloppes } from "../domaine/ports";

type Db = Pool | PoolClient;

// ─── Mappage lignes SQL → objets du domaine ───────────────────

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function versEnveloppe(r: any): Enveloppe {
  return {
    id: r.id,
    createurId: r.createur_id,
    entrepriseId: r.entreprise_id,
    titre: r.titre,
    documentHashOrigine: r.document_hash_origine,
    mode: r.mode,
    statut: r.statut,
    dateCreation: toIso(r.date_creation),
    dateExpiration: r.date_expiration ? toIso(r.date_expiration) : null,
    dateScellement: r.date_scellement ? toIso(r.date_scellement) : null,
  };
}

function versSignataire(r: any): Signataire {
  return {
    id: r.id,
    enveloppeId: r.enveloppe_id,
    utilisateurId: r.utilisateur_id,
    telephone: r.telephone,
    nomDeclare: r.nom_declare,
    ordre: r.ordre,
    niveauIdentiteExige: r.niveau_identite_exige,
    statut: r.statut,
    dateSignature: r.date_signature ? toIso(r.date_signature) : null,
  };
}

function versEvenement(r: any): Evenement {
  return {
    enveloppeId: r.enveloppe_id,
    type: r.type,
    acteur: r.acteur,
    horodatage: r.horodatage instanceof Date ? r.horodatage : new Date(r.horodatage),
    ip: r.ip ?? undefined,
    userAgent: r.user_agent ?? undefined,
    empreinteAppareil: r.empreinte_appareil ?? undefined,
    donnees: r.donnees ?? undefined,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// ─── Opérations bas niveau (acceptent un client ou un pool) ───

async function insererEvenement(db: Db, e: Evenement): Promise<void> {
  await db.query(
    `insert into evenement
       (enveloppe_id, type, acteur, horodatage, ip, user_agent, empreinte_appareil, donnees)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      e.enveloppeId,
      e.type,
      e.acteur,
      e.horodatage,
      e.ip ?? null,
      e.userAgent ?? null,
      e.empreinteAppareil ?? null,
      e.donnees ? JSON.stringify(e.donnees) : null,
    ],
  );
}

export async function insererEnveloppeAgg(db: Db, agg: EnveloppeAgg): Promise<void> {
  const e = agg.enveloppe;
  await db.query(
    `insert into enveloppe
       (id, createur_id, entreprise_id, titre, document_hash_origine, mode, statut,
        date_creation, date_expiration, date_scellement)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      e.id, e.createurId, e.entrepriseId, e.titre, e.documentHashOrigine, e.mode,
      e.statut, e.dateCreation, e.dateExpiration, e.dateScellement,
    ],
  );

  for (const s of agg.signataires) {
    await db.query(
      `insert into signataire
         (id, enveloppe_id, utilisateur_id, telephone, nom_declare, ordre,
          niveau_identite_exige, statut, date_signature)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        s.id, s.enveloppeId, s.utilisateurId, s.telephone, s.nomDeclare, s.ordre,
        s.niveauIdentiteExige, s.statut, s.dateSignature,
      ],
    );
  }

  for (const ev of agg.journal.lister()) {
    await insererEvenement(db, ev);
  }
}

export async function chargerEnveloppeAgg(db: Db, id: string): Promise<EnveloppeAgg | null> {
  const re = await db.query(`select * from enveloppe where id = $1`, [id]);
  if (re.rowCount === 0) return null;

  const enveloppe = versEnveloppe(re.rows[0]);

  const rs = await db.query(`select * from signataire where enveloppe_id = $1 order by ordre`, [id]);
  const signataires = rs.rows.map(versSignataire);

  const rev = await db.query(`select * from evenement where enveloppe_id = $1 order by seq`, [id]);
  const journal = new JournalAjoutSeul();
  for (const row of rev.rows) journal.ajouter(versEvenement(row));

  return { enveloppe, signataires, journal };
}

// ─── Adaptateur ───────────────────────────────────────────────

export class DepotEnveloppesPostgres implements DepotEnveloppes {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async creer(agg: EnveloppeAgg): Promise<void> {
    const client = await this.#pool.connect();
    try {
      await client.query("begin");
      await insererEnveloppeAgg(client, agg);
      await client.query("commit");
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }

  async charger(id: string): Promise<EnveloppeAgg | null> {
    return chargerEnveloppeAgg(this.#pool, id);
  }

  async enregistrer(agg: EnveloppeAgg): Promise<void> {
    const client = await this.#pool.connect();
    try {
      await client.query("begin");
      const e = agg.enveloppe;

      // Maj des scalaires de l'enveloppe (le trigger refuse si déjà scellée — I3).
      await client.query(
        `update enveloppe set statut = $2, document_hash_origine = $3, date_scellement = $4 where id = $1`,
        [e.id, e.statut, e.documentHashOrigine, e.dateScellement],
      );

      for (const s of agg.signataires) {
        await client.query(
          `update signataire set statut = $2, date_signature = $3 where id = $1`,
          [s.id, s.statut, s.dateSignature],
        );
      }

      // Journal en ajout seul : on insère uniquement les événements nouveaux
      // (au-delà de ceux déjà présents en base). L'ordre est préservé (seq).
      const compte = await client.query<{ n: number }>(
        `select count(*)::int as n from evenement where enveloppe_id = $1`,
        [e.id],
      );
      const dejaEnBase = compte.rows[0]?.n ?? 0;
      const evenements = agg.journal.lister();
      for (let i = dejaEnBase; i < evenements.length; i++) {
        await insererEvenement(client, evenements[i]!);
      }

      await client.query("commit");
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }
}
