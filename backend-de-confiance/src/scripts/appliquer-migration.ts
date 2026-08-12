import process from "node:process";
import { readFileSync } from "node:fs";
import { Client } from "pg";

// Applique un fichier de migration SQL à la base (via DATABASE_URL).
// Usage : tsx src/scripts/appliquer-migration.ts <chemin-vers.sql>

try {
  process.loadEnvFile();
} catch {
  // pas de .env : variables système
}

const chemin = process.argv[2];
if (!chemin) {
  console.error("Usage: appliquer-migration.ts <chemin.sql>");
  process.exit(1);
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant (backend-de-confiance/.env).");
  process.exit(1);
}

const sql = readFileSync(chemin, "utf8");
const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log(`✅ Migration appliquée : ${chemin}`);
} catch (erreur) {
  console.error("❌ Échec :", (erreur as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}
