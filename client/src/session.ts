// Session émetteur côté client : on ne stocke QUE le jeton signé par le backend
// et un résumé public de l'utilisateur. Aucun secret (le jeton n'est pas déchiffrable
// côté client) — cf. frontière de confiance (04_structure_rules/05).

export interface UtilisateurSession {
  id: string;
  niveau: "invite" | "verifie";
  identifiantPublic: string | null;
}

export interface SessionStockee {
  token: string;
  utilisateur: UtilisateurSession;
}

const CLE = "paraphe.session";

export function lireSession(): SessionStockee | null {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? (JSON.parse(brut) as SessionStockee) : null;
  } catch {
    return null;
  }
}

export function enregistrerSession(s: SessionStockee): void {
  localStorage.setItem(CLE, JSON.stringify(s));
}

export function effacerSession(): void {
  localStorage.removeItem(CLE);
}

export function jeton(): string | null {
  return lireSession()?.token ?? null;
}
