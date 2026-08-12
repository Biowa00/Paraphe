import process from "node:process";
import { randomInt, randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  insererCompteVerifie,
  chargerCompteVerifie,
} from "../adaptateurs/depot-utilisateurs-postgres";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { genererIdentifiantPublic } from "../domaine/utilisateur";
import type { CompteVerifieAgg } from "../domaine/utilisateur";

// Prouve que l'inscription vérifiée fait un aller-retour correct contre la VRAIE
// base : compte + vérification + crédit de bienvenue, dans une transaction
// ANNULÉE (rollback) — aucune donnée de test conservée.

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

  const hacheur = new HacheurNpiLocalDev("pepper-verif-inscription");
  const utilisateurId = randomUUID();
  const npiHash = await hacheur.hacher("1234567890123");
  const identifiantPublic = genererIdentifiantPublic(() => randomInt(0, 2 ** 31));

  const agg: CompteVerifieAgg = {
    utilisateur: {
      id: utilisateurId,
      identifiantPublic,
      telephone: `+229${randomInt(0, 1e8)}`,
      niveauVerification: "verifie",
      npiHash,
      nom: "DOSSOU",
      prenoms: "Awa",
      dateVerification: new Date().toISOString(),
    },
    verification: {
      id: randomUUID(),
      utilisateurId,
      methode: "ocr_selfie",
      score: 0.95,
      resultat: "valide",
      controleRef: randomUUID(),
    },
    creditsBienvenue: 3,
  };

  await insererCompteVerifie(client, agg);
  const recharge = await chargerCompteVerifie(client, utilisateurId);

  const ok =
    recharge !== null &&
    recharge.utilisateur.niveauVerification === "verifie" &&
    recharge.utilisateur.identifiantPublic === identifiantPublic &&
    recharge.utilisateur.npiHash === npiHash &&
    recharge.verification.resultat === "valide" &&
    recharge.creditsBienvenue === 3;

  console.log(
    ok
      ? "✅ Aller-retour inscription Postgres OK (compte vérifié + vérif + 3 crédits, rechargés identiques)."
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
