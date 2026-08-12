import process from "node:process";
import { compositionDev, compositionPostgres } from "./exposition/composition";
import { construireServeur } from "./exposition/serveur";

// Point d'entrée. Persistance choisie par l'environnement :
//   PARAPHE_PERSISTENCE=postgres → boucle et comptes en base (Supabase).
//   sinon (défaut) → tout en mémoire (dev sans dépendance).
try {
  process.loadEnvFile();
} catch {
  /* variables système : rien à charger */
}

const enPostgres = process.env.PARAPHE_PERSISTENCE === "postgres";
const app = construireServeur(enPostgres ? compositionPostgres() : compositionDev());
const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    const mode = enPostgres ? "Postgres" : "mémoire (dev)";
    console.log(`Paraphe écoute sur http://localhost:${port} — persistance : ${mode}`);
  })
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  });
