import { useState } from "react";
import { Verification } from "./pages/Verification";
import { Signature } from "./pages/Signature";
import { Connexion } from "./pages/Connexion";
import { Emettre } from "./pages/Emettre";
import { lireSession } from "./session";

/** Espace émetteur : connexion si non connecté, sinon tableau de bord. */
function Espace() {
  const [connecte, setConnecte] = useState(lireSession() !== null);
  return connecte ? (
    <Emettre onDeconnecte={() => setConnecte(false)} />
  ) : (
    <Connexion onConnecte={() => setConnecte(true)} />
  );
}

/**
 * Routage minimal (pas de dépendance : poids maîtrisé en 3G).
 * - `/v/XXXX`            → vérification par référence (QR du cachet).
 * - `/signer/ENV[/SIG]`  → tunnel de signature invité (lien reçu par WhatsApp/SMS).
 * - `/emettre`           → espace émetteur (connexion + création/envoi + recharge).
 * - défaut               → page de vérification.
 */
export function App() {
  const segments = window.location.pathname.split("/").filter(Boolean);

  if (segments[0] === "signer" && segments[1]) {
    return (
      <Signature
        enveloppeId={decodeURIComponent(segments[1])}
        signataireId={segments[2] ? decodeURIComponent(segments[2]) : undefined}
      />
    );
  }

  if (segments[0] === "v" && segments[1]) {
    return <Verification refInitiale={decodeURIComponent(segments[1])} />;
  }

  if (segments[0] === "emettre") {
    return <Espace />;
  }

  return <Verification />;
}
