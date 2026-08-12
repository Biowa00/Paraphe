import process from "node:process";
import { Client } from "pg";

// Vérifie que l'application peut se connecter à la base Supabase, et que les
// tables y sont bien. Lance : npm run verifier:db -w @paraphe/backend-de-confiance

try {
  process.loadEnvFile();
} catch {
  // Pas de fichier .env : on utilisera les variables d'environnement système.
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "DATABASE_URL manquant. Renseigne backend-de-confiance/.env (voir .env.example).",
  );
  process.exit(1);
}

const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  const r = await client.query<{ n: number }>(
    "select count(*)::int as n from information_schema.tables where table_schema = 'public'",
  );
  console.log(`✅ Connexion réussie. Tables publiques : ${r.rows[0]?.n ?? 0}`);
} catch (erreur) {
  console.error("❌ Échec de connexion :", (erreur as Error).message);
  process.exitCode = 1;
} finally {
  await client.end();
}
