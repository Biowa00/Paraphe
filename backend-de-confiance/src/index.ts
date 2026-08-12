import { compositionDev } from "./exposition/composition";
import { construireServeur } from "./exposition/serveur";

// Point d'entrée DEV : serveur local, adaptateurs en mémoire.
const app = construireServeur(compositionDev());
const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    console.log(`Paraphe (dev) écoute sur http://localhost:${port}`);
  })
  .catch((erreur) => {
    console.error(erreur);
    process.exit(1);
  });
