import { generateKeyPairSync, sign, randomUUID } from "node:crypto";
import type { KeyObject } from "node:crypto";
import type { Sceau, SceauServeur } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — paire de clés Ed25519 éphémère, générée au démarrage.
 * En production : clé de scellement au KMS, rotation périodique, empreinte
 * publique ancrée (cf. 02_logic/02). Statut « avancée », pas de certificat d'AC.
 */
export class SceauServeurLocalDev implements SceauServeur {
  readonly #privee: KeyObject;
  readonly #publique: KeyObject;
  readonly refClePublique: string;

  constructor() {
    const { privateKey, publicKey } = generateKeyPairSync("ed25519");
    this.#privee = privateKey;
    this.#publique = publicKey;
    this.refClePublique = randomUUID();
  }

  async sceller(donnees: Buffer): Promise<Sceau> {
    const signature = sign(null, donnees, this.#privee).toString("base64");
    return { algorithme: "ed25519", signature, refClePublique: this.refClePublique };
  }

  /** Exposée pour la vérification (en prod, publiée avec l'ancrage). */
  get clePublique(): KeyObject {
    return this.#publique;
  }
}
