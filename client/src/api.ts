import type { RapportVerification } from "./types";

interface EntreeVerification {
  documentBase64?: string;
  enveloppeRef?: string;
}

/** Appelle le backend de confiance. Le client ne détient aucun secret. */
export async function verifier(entree: EntreeVerification): Promise<RapportVerification> {
  let rep: Response;
  try {
    rep = await fetch("/v1/verification", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entree),
    });
  } catch {
    throw new Error("Impossible de joindre le service. Vérifiez votre connexion.");
  }
  if (rep.status === 400) {
    throw new Error("Fournissez un document ou une référence d'enveloppe.");
  }
  if (!rep.ok) {
    throw new Error("Le service de vérification est momentanément indisponible.");
  }
  return (await rep.json()) as RapportVerification;
}

/** Lit un fichier et renvoie son contenu encodé en base64 (sans le préfixe data:). */
export function fichierEnBase64(fichier: File): Promise<string> {
  return new Promise((resoudre, rejeter) => {
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const resultat = String(lecteur.result);
      const virgule = resultat.indexOf(",");
      resoudre(virgule >= 0 ? resultat.slice(virgule + 1) : resultat);
    };
    lecteur.onerror = () => rejeter(new Error("Lecture du fichier impossible."));
    lecteur.readAsDataURL(fichier);
  });
}
