import process from "node:process";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import { JournalAjoutSeul } from "../domaine/journal";
import type { EnveloppeAgg } from "../domaine/modele";
import {
  insererEnveloppeAgg,
  chargerEnveloppeAgg,
} from "../adaptateurs/depot-enveloppes-postgres";

// Prouve que l'adaptateur Postgres fait un aller-retour correct contre la VRAIE
// base, dans une transaction ANNULÉE (rollback) : aucune donnée de test conservée.

try {
  process.loadEnvFile();
} catch {
  /* variables système */
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const client = await pool.connect();
try {
  await client.query("begin");

  const createurId = randomUUID();
  await client.query(
    `insert into utilisateur (id, telephone, niveau_verification) values ($1, $2, 'verifie')`,
    [createurId, `+229${Math.floor(Math.random() * 1e8)}`],
  );

  const enveloppeId = randomUUID();
  const sigId = randomUUID();
  const journal = new JournalAjoutSeul();
  journal.ajouter({ enveloppeId, type: "creee", acteur: createurId, horodatage: new Date() });

  const agg: EnveloppeAgg = {
    enveloppe: {
      id: enveloppeId,
      createurId,
      entrepriseId: null,
      titre: "TEST round-trip",
      documentHashOrigine: null,
      mode: "sequentiel",
      statut: "brouillon",
      dateCreation: new Date().toISOString(),
      dateExpiration: null,
      dateScellement: null,
    },
    signataires: [
      {
        id: sigId,
        enveloppeId,
        utilisateurId: null,
        telephone: "+22990000001",
        nomDeclare: "Bob",
        ordre: 1,
        niveauIdentiteExige: "standard",
        statut: "en_attente",
        dateSignature: null,
      },
    ],
    journal,
  };

  await insererEnveloppeAgg(client, agg);
  const recharge = await chargerEnveloppeAgg(client, enveloppeId);

  const ok =
    recharge !== null &&
    recharge.enveloppe.titre === "TEST round-trip" &&
    recharge.enveloppe.statut === "brouillon" &&
    recharge.signataires.length === 1 &&
    recharge.signataires[0]?.nomDeclare === "Bob" &&
    recharge.journal.lister().map((e) => e.type).join(",") === "creee";

  console.log(
    ok
      ? "✅ Aller-retour Postgres OK (créer → recharger, identique)."
      : "❌ Aller-retour incohérent.",
  );
  if (!ok) process.exitCode = 1;

  await client.query("rollback");
  console.log("(transaction annulée : aucune donnée de test laissée dans la base)");
} catch (erreur) {
  await client.query("rollback");
  console.error("❌ Erreur :", (erreur as Error).message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
