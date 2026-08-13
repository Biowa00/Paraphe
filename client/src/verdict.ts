import type { NiveauIdentite, RapportVerification } from "./types";

export type Ton = "ok" | "alerte" | "neutre" | "info";

export interface Verdict {
  ton: Ton;
  /** Symbole lisible (jamais la seule couleur — 09_components/01). */
  icone: string;
  titre: string;
  message: string;
}

/**
 * Traduit le rapport en verdict humain. Ton neutre et factuel même quand le
 * document est altéré : on informe, on ne dramatise pas (09_components/05).
 */
export function verdictDe(r: RapportVerification): Verdict {
  if (r.integre === true) {
    return {
      ton: "ok",
      icone: "✓",
      titre: "Document authentique",
      message:
        "Ce document correspond exactement à la version scellée. Rien n'a été modifié depuis la signature.",
    };
  }
  if (r.integre === false && r.raison === "modifie_apres_signature") {
    return {
      ton: "alerte",
      icone: "✗",
      titre: "Version modifiée après signature",
      message:
        "Ce document diffère de la version scellée : il a été modifié après la signature.",
    };
  }
  if (r.integre === false) {
    return {
      ton: "neutre",
      icone: "–",
      titre: "Aucune correspondance",
      message:
        "Ce document ne correspond à aucune version scellée par Paraphe.",
    };
  }
  // integre === null : référence seule, sans fichier à confronter.
  return {
    ton: "info",
    icone: "•",
    titre: "Archive scellée",
    message:
      "Cette référence désigne une archive scellée. Déposez le fichier pour vérifier son intégrité.",
  };
}

const LIBELLE_NIVEAU: Record<NiveauIdentite, string> = {
  otp_seul: "OTP seul",
  standard: "Standard",
  renforce: "Renforcé",
};

export function libelleNiveau(niveau: NiveauIdentite): string {
  return LIBELLE_NIVEAU[niveau] ?? niveau;
}

/** Date lisible en français ; tolère une valeur absente. */
export function formaterDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(d);
}
