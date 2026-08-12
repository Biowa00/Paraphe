import type { ResultatBiometrie, ServiceBiometrie } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — vivacité + face-match simulés. Faute de vrai fournisseur
 * (décision ouverte n°4), la « référence de selfie » encode en dev le résultat
 * attendu (JSON base64url : `{ vivaciteOk, score }`). En production, `refSelfie`
 * désignera le selfie animé et l'adaptateur appellera le fournisseur réel ; le
 * selfie est supprimé après comparaison, aucune donnée biométrique conservée (I5).
 */
export class BiometrieLocalDev implements ServiceBiometrie {
  async verifier(refSelfie: string, _refPortrait: string): Promise<ResultatBiometrie> {
    void _refPortrait;
    try {
      const o = JSON.parse(Buffer.from(refSelfie, "base64url").toString("utf8"));
      const score = typeof o.score === "number" ? o.score : 0;
      const vivaciteOk = o.vivaciteOk !== false; // défaut : vivant
      return { vivaciteOk, score };
    } catch {
      // Référence non décodable en dev → échec de vivacité (défensif).
      return { vivaciteOk: false, score: 0 };
    }
  }
}

/** Aide de test/dev : forge une référence de selfie à partir d'un résultat. */
export function referenceSelfieDev(r: { vivaciteOk?: boolean; score: number }): string {
  return Buffer.from(JSON.stringify(r), "utf8").toString("base64url");
}
