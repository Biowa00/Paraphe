import type { Pool, PoolClient } from "pg";
import type {
  CompteVerifieAgg,
  Utilisateur,
  VerificationIdentite,
} from "../domaine/utilisateur";
import type { DepotUtilisateurs } from "../domaine/ports";

type Db = Pool | PoolClient;

function toIso(v: unknown): string {
  return v instanceof Date ? v.toISOString() : String(v);
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function versUtilisateur(r: any): Utilisateur {
  return {
    id: r.id,
    identifiantPublic: r.identifiant_public ?? null,
    telephone: r.telephone,
    niveauVerification: r.niveau_verification,
    npiHash: r.npi_hash ?? null,
    nom: r.nom ?? null,
    prenoms: r.prenoms ?? null,
    dateVerification: r.date_verification ? toIso(r.date_verification) : null,
  };
}

function versVerification(r: any): VerificationIdentite {
  return {
    id: r.id,
    utilisateurId: r.utilisateur_id,
    methode: r.methode,
    score: r.score === null || r.score === undefined ? null : Number(r.score),
    resultat: r.resultat,
    controleRef: r.controle_ref,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function insererCompteVerifie(db: Db, agg: CompteVerifieAgg): Promise<void> {
  const u = agg.utilisateur;
  await db.query(
    `insert into utilisateur
       (id, identifiant_public, telephone, niveau_verification, npi_hash, nom, prenoms, date_verification)
     values ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      u.id,
      u.identifiantPublic,
      u.telephone,
      u.niveauVerification,
      u.npiHash,
      u.nom,
      u.prenoms,
      u.dateVerification,
    ],
  );

  const v = agg.verification;
  await db.query(
    `insert into verification_identite
       (id, utilisateur_id, methode, score, resultat, controle_ref)
     values ($1, $2, $3, $4, $5, $6)`,
    [v.id, v.utilisateurId, v.methode, v.score, v.resultat, v.controleRef],
  );

  if (agg.creditsBienvenue > 0) {
    // Registre en ajout seul : une ligne = l'octroi de bienvenue (I8, non expirant).
    await db.query(
      `insert into credit_transaction (titulaire_type, titulaire_id, type, montant)
       values ('utilisateur', $1, 'bienvenue', $2)`,
      [u.id, agg.creditsBienvenue],
    );
  }
}

export async function npiHashExisteDb(db: Db, npiHash: string): Promise<boolean> {
  const r = await db.query(
    `select 1 from utilisateur where npi_hash = $1 and statut = 'actif' limit 1`,
    [npiHash],
  );
  return (r.rowCount ?? 0) > 0;
}

export async function utilisateurParTelephoneDb(db: Db, telephone: string): Promise<Utilisateur | null> {
  const r = await db.query(
    `select * from utilisateur where telephone = $1 and statut = 'actif' limit 1`,
    [telephone],
  );
  return r.rowCount ? versUtilisateur(r.rows[0]) : null;
}

export async function chargerCompteVerifie(db: Db, id: string): Promise<CompteVerifieAgg | null> {
  const ru = await db.query(`select * from utilisateur where id = $1`, [id]);
  if (ru.rowCount === 0) return null;

  const rv = await db.query(
    `select * from verification_identite where utilisateur_id = $1 order by date desc limit 1`,
    [id],
  );
  const rc = await db.query<{ somme: number }>(
    `select coalesce(sum(montant), 0)::int as somme from credit_transaction
       where titulaire_type = 'utilisateur' and titulaire_id = $1 and type = 'bienvenue'`,
    [id],
  );

  return {
    utilisateur: versUtilisateur(ru.rows[0]),
    verification: rv.rowCount ? versVerification(rv.rows[0]) : (null as never),
    creditsBienvenue: rc.rows[0]?.somme ?? 0,
  };
}

/** Adaptateur Postgres du dépôt utilisateurs (I4 : n'écrit que le hash du NPI). */
export class DepotUtilisateursPostgres implements DepotUtilisateurs {
  readonly #pool: Pool;

  constructor(pool: Pool) {
    this.#pool = pool;
  }

  async npiHashExiste(npiHash: string): Promise<boolean> {
    return npiHashExisteDb(this.#pool, npiHash);
  }

  async creerCompteVerifie(agg: CompteVerifieAgg): Promise<void> {
    const client = await this.#pool.connect();
    try {
      await client.query("begin");
      await insererCompteVerifie(client, agg);
      await client.query("commit");
    } catch (erreur) {
      await client.query("rollback");
      throw erreur;
    } finally {
      client.release();
    }
  }

  async charger(id: string): Promise<CompteVerifieAgg | null> {
    return chargerCompteVerifie(this.#pool, id);
  }

  async parTelephone(telephone: string): Promise<Utilisateur | null> {
    return utilisateurParTelephoneDb(this.#pool, telephone);
  }
}

/** Dépôt utilisateurs lié à UN client (transaction gérée par l'appelant). */
export class DepotUtilisateursSurClient implements DepotUtilisateurs {
  readonly #db: Db;

  constructor(db: Db) {
    this.#db = db;
  }

  async npiHashExiste(npiHash: string): Promise<boolean> {
    return npiHashExisteDb(this.#db, npiHash);
  }

  async creerCompteVerifie(agg: CompteVerifieAgg): Promise<void> {
    await insererCompteVerifie(this.#db, agg);
  }

  async charger(id: string): Promise<CompteVerifieAgg | null> {
    return chargerCompteVerifie(this.#db, id);
  }

  async parTelephone(telephone: string): Promise<Utilisateur | null> {
    return utilisateurParTelephoneDb(this.#db, telephone);
  }
}
