import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  randomUUID,
} from "node:crypto";
import type { ChiffreurEnveloppe, ResultatChiffrement } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — clés d'enveloppe en mémoire. Ne JAMAIS utiliser en
 * production : les clés doivent vivre dans un KMS hors process et hors base.
 *
 * Respecte néanmoins déjà les propriétés qui comptent :
 *  - le stockage ne reçoit que du chiffré (jamais le clair, I7) ;
 *  - la clé est séparée du document ;
 *  - détruire la clé rend le contenu définitivement illisible (crypto-shredding).
 *
 * Format du chiffré : iv(12) || authTag(16) || corps  (AES-256-GCM).
 */
export class ChiffreurLocalDev implements ChiffreurEnveloppe {
  readonly #cles = new Map<string, Buffer>();

  async chiffrer(_enveloppeId: string, clair: Buffer): Promise<ResultatChiffrement> {
    const cle = randomBytes(32);
    const refCle = randomUUID();
    this.#cles.set(refCle, cle);

    const iv = randomBytes(12);
    const chiffreur = createCipheriv("aes-256-gcm", cle, iv);
    const corps = Buffer.concat([chiffreur.update(clair), chiffreur.final()]);
    const tag = chiffreur.getAuthTag();

    return { refCle, chiffre: Buffer.concat([iv, tag, corps]) };
  }

  async dechiffrer(refCle: string, chiffre: Buffer): Promise<Buffer> {
    const cle = this.#cles.get(refCle);
    if (!cle) {
      throw new Error(
        `Clé ${refCle} absente : contenu illisible (clé détruite / crypto-shredding).`,
      );
    }
    const iv = chiffre.subarray(0, 12);
    const tag = chiffre.subarray(12, 28);
    const corps = chiffre.subarray(28);

    const dechiffreur = createDecipheriv("aes-256-gcm", cle, iv);
    dechiffreur.setAuthTag(tag);
    return Buffer.concat([dechiffreur.update(corps), dechiffreur.final()]);
  }

  async detruireCle(refCle: string): Promise<void> {
    this.#cles.delete(refCle);
  }
}
