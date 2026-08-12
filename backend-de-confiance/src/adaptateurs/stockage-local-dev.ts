import type { StockageDocuments } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — objets en mémoire, sémantique WORM (écriture unique).
 * En production : stockage objet S3-compatible avec verrouillage d'objet.
 * L'écrasement d'un objet existant est refusé (soutient I3).
 */
export class StockageLocalDev implements StockageDocuments {
  readonly #objets = new Map<string, Buffer>();

  async ecrire(chemin: string, contenu: Buffer): Promise<void> {
    if (this.#objets.has(chemin)) {
      throw new Error(
        `Écriture unique (WORM) : « ${chemin} » existe déjà, écrasement refusé.`,
      );
    }
    this.#objets.set(chemin, Buffer.from(contenu));
  }

  async lire(chemin: string): Promise<Buffer> {
    const objet = this.#objets.get(chemin);
    if (!objet) {
      throw new Error(`Objet introuvable : « ${chemin} ».`);
    }
    return Buffer.from(objet);
  }
}
