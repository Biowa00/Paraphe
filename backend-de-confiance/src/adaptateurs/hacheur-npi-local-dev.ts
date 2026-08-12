import { createHmac } from "node:crypto";
import type { HacheurNpi } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — HMAC-SHA256(NPI, pepper), déterministe (I4). En production, le
 * pepper vit au KMS, hors base, et n'est jamais chargé en clair dans le process ;
 * ici il vient d'une variable d'environnement (ou d'un défaut de dev). La
 * propriété essentielle est la même : même NPI → même hash (unicité), et une
 * fuite de la base seule reste inexploitable sans le pepper.
 */
export class HacheurNpiLocalDev implements HacheurNpi {
  readonly #pepper: string;

  constructor(pepper = process.env.PEPPER_NPI ?? "dev-pepper-npi-non-secret") {
    this.#pepper = pepper;
  }

  async hacher(npi: string): Promise<string> {
    return createHmac("sha256", this.#pepper).update(npi).digest("hex");
  }
}
