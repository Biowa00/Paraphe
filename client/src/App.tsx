import { Verification } from "./pages/Verification";

/**
 * Routage minimal (pas de dépendance : poids maîtrisé en 3G).
 * `/v/XXXX` = arrivée directe depuis le QR du cachet → vérification par référence.
 */
export function App() {
  const chemin = window.location.pathname;
  const refDirecte = chemin.startsWith("/v/")
    ? decodeURIComponent(chemin.slice(3))
    : undefined;
  return <Verification refInitiale={refDirecte} />;
}
