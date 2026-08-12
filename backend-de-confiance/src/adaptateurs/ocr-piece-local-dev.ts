import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { ExtraitPiece, ServiceOcrPiece } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — OCR simulé. Faute de vrai fournisseur OCR (décision ouverte
 * n°4), la « référence de pièce » encode en dev l'extrait attendu (JSON base64url).
 * En production, `refPiece` désignera l'objet chiffré et l'adaptateur appellera
 * le fournisseur OCR réel ; l'image sera purgée après vérification (I5).
 * Le NPI extrait n'est jamais renvoyé au client : il est haché côté serveur (I4).
 */
export class OcrPieceLocalDev implements ServiceOcrPiece {
  async extraire(refPiece: string): Promise<ExtraitPiece> {
    let brut: unknown;
    try {
      brut = JSON.parse(Buffer.from(refPiece, "base64url").toString("utf8"));
    } catch {
      throw new ErreurMetier(CODES_ERREUR.PIECE_ILLISIBLE, "Pièce illisible.");
    }
    const o = brut as Partial<ExtraitPiece>;
    if (!o || typeof o.npi !== "string" || !o.npi) {
      throw new ErreurMetier(CODES_ERREUR.PIECE_ILLISIBLE, "Pièce illisible.");
    }
    return {
      npi: o.npi,
      nom: o.nom ?? "",
      prenoms: o.prenoms ?? "",
      dateNaissance: o.dateNaissance ?? "",
      coherence: o.coherence === "douteuse" ? "douteuse" : "ok",
    };
  }
}

/** Aide de test/dev : forge une référence de pièce à partir d'un extrait. */
export function referencePieceDev(extrait: {
  npi: string;
  nom?: string;
  prenoms?: string;
  dateNaissance?: string;
  coherence?: "ok" | "douteuse";
}): string {
  return Buffer.from(JSON.stringify(extrait), "utf8").toString("base64url");
}
