import type {
  EnveloppeDetail,
  EnveloppeResume,
  Pack,
  RapportVerification,
  SignataireACreer,
  Solde,
  Trace,
} from "./types";
import { jeton, enregistrerSession, type SessionStockee } from "./session";

/** Erreur métier renvoyée par le backend (porte un code stable). */
export class ErreurApi extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "ErreurApi";
    this.code = code;
  }
}

async function lireErreur(rep: Response): Promise<ErreurApi> {
  try {
    const corps = (await rep.json()) as { erreur?: { code?: string; message?: string } };
    return new ErreurApi(
      corps.erreur?.code ?? "erreur",
      corps.erreur?.message ?? "Une erreur est survenue.",
    );
  } catch {
    return new ErreurApi("erreur", "Une erreur est survenue.");
  }
}

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

// ─── Parcours signataire ───────────────────────────────────────

/** Ouvre une enveloppe en lecture (statut, signataires, niveaux exigés). */
export async function ouvrirEnveloppe(id: string): Promise<EnveloppeDetail> {
  let rep: Response;
  try {
    rep = await fetch(`/v1/enveloppes/${encodeURIComponent(id)}`);
  } catch {
    throw new ErreurApi("reseau", "Impossible de joindre le service.");
  }
  if (rep.status === 404) throw new ErreurApi("enveloppe_introuvable", "Enveloppe introuvable.");
  if (!rep.ok) throw await lireErreur(rep);
  return (await rep.json()) as EnveloppeDetail;
}

/**
 * DEV : obtient un ticket OTP frais pour la signature. En production, ce sera un
 * code reçu par WhatsApp/SMS puis validé ; ici le backend émet directement le
 * ticket (le fournisseur réel est une décision ouverte n°4).
 */
export async function demanderTicketSignature(): Promise<string> {
  const rep = await fetch("/v1/otp/verifie", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "signature" }),
  });
  if (!rep.ok) throw await lireErreur(rep);
  const corps = (await rep.json()) as { ticket: string };
  return corps.ticket;
}

interface EntreeSignature {
  signataireId: string;
  niveauVerifie: string;
  otpTicket: string;
  trace: Trace;
  acteur: string;
}

/** Signe l'enveloppe (OTP frais + tracé refait à l'instant). Renvoie le statut. */
export async function signer(id: string, entree: EntreeSignature): Promise<{ statut: string }> {
  let rep: Response;
  try {
    rep = await fetch(`/v1/enveloppes/${encodeURIComponent(id)}/signature`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(entree),
    });
  } catch {
    throw new ErreurApi("reseau", "Impossible de joindre le service.");
  }
  if (!rep.ok) throw await lireErreur(rep);
  return (await rep.json()) as { statut: string };
}

// ─── Espace émetteur (authentifié) ─────────────────────────────

function entetes(json = true): Record<string, string> {
  const h: Record<string, string> = {};
  if (json) h["content-type"] = "application/json";
  const t = jeton();
  if (t) h["authorization"] = `Bearer ${t}`;
  return h;
}

async function poster<T>(url: string, corps: unknown): Promise<T> {
  let rep: Response;
  try {
    rep = await fetch(url, { method: "POST", headers: entetes(), body: JSON.stringify(corps) });
  } catch {
    throw new ErreurApi("reseau", "Impossible de joindre le service.");
  }
  if (!rep.ok) throw await lireErreur(rep);
  return (await rep.json()) as T;
}

/** DEV : obtient un ticket OTP frais pour une action donnée. */
export async function demanderTicket(action: "inscription" | "signature" | "connexion"): Promise<string> {
  const r = await poster<{ ticket: string }>("/v1/otp/verifie", { action });
  return r.ticket;
}

/** Connexion : téléphone + OTP frais → session (stockée localement). */
export async function connexion(telephone: string, otpTicket: string): Promise<SessionStockee> {
  const s = await poster<SessionStockee>("/v1/connexion", { telephone, otpTicket });
  enregistrerSession(s);
  return s;
}

export async function creerEnveloppe(payload: {
  titre: string;
  mode: "sequentiel" | "parallele";
  signataires: SignataireACreer[];
}): Promise<{ id: string; statut: string }> {
  return poster("/v1/enveloppes", payload);
}

export async function envoyer(id: string, documentBase64: string, acteur: string): Promise<{ statut: string }> {
  return poster(`/v1/enveloppes/${encodeURIComponent(id)}/envoi`, { documentBase64, acteur });
}

/** Mon archive : les enveloppes que j'ai créées. */
export async function mesEnveloppes(): Promise<EnveloppeResume[]> {
  let rep: Response;
  try {
    rep = await fetch("/v1/enveloppes", { headers: entetes(false) });
  } catch {
    throw new ErreurApi("reseau", "Impossible de joindre le service.");
  }
  if (!rep.ok) throw await lireErreur(rep);
  return ((await rep.json()) as { enveloppes: EnveloppeResume[] }).enveloppes;
}

export async function lireSolde(): Promise<Solde> {
  let rep: Response;
  try {
    rep = await fetch("/v1/credits/solde", { headers: entetes(false) });
  } catch {
    throw new ErreurApi("reseau", "Impossible de joindre le service.");
  }
  if (!rep.ok) throw await lireErreur(rep);
  return (await rep.json()) as Solde;
}

export async function listerPacks(): Promise<Pack[]> {
  const rep = await fetch("/v1/credits/packs");
  if (!rep.ok) throw await lireErreur(rep);
  return ((await rep.json()) as { packs: Pack[] }).packs;
}

export async function acheter(
  packId: string,
  telephone: string,
): Promise<{ transactionId: string; statut: string; instructionsPaiement: string }> {
  return poster("/v1/credits/achat", { packId, telephone });
}

/** DEV : simule la confirmation opérateur (webhook) d'un paiement. */
export async function simulerPaiement(reference: string): Promise<void> {
  await poster("/v1/credits/mobile-money/callback", { reference, succes: true });
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
