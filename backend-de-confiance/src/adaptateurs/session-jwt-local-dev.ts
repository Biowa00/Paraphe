import { createHmac, timingSafeEqual } from "node:crypto";
import type { ServiceSession, SessionPayload } from "../domaine/ports";

/**
 * DEV — jeton de session signé HS256 (sans dépendance externe). Le secret vient
 * d'une variable d'environnement (ou d'un défaut de dev) ; en production il vit
 * au KMS, hors code. Format compact type JWT : `entete.charge.signature`.
 * Le client ne détient jamais le secret : il ne fait que porter le jeton.
 */
export class SessionJwtLocalDev implements ServiceSession {
  readonly #secret: string;
  readonly #dureeMs: number;

  constructor(
    secret = process.env.SESSION_SECRET ?? "dev-session-secret-non-secret",
    dureeMs = 7 * 24 * 60 * 60 * 1000, // 7 jours
  ) {
    this.#secret = secret;
    this.#dureeMs = dureeMs;
  }

  emettre(payload: SessionPayload): string {
    const entete = enc({ alg: "HS256", typ: "JWT" });
    const corps = enc({ ...payload, exp: Date.now() + this.#dureeMs });
    const signature = this.#signer(`${entete}.${corps}`);
    return `${entete}.${corps}.${signature}`;
  }

  verifier(token: string): SessionPayload | null {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [entete, corps, signature] = parts as [string, string, string];

    const attendue = this.#signer(`${entete}.${corps}`);
    const a = Buffer.from(signature);
    const b = Buffer.from(attendue);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    try {
      const charge = JSON.parse(Buffer.from(corps, "base64url").toString("utf8")) as SessionPayload & {
        exp: number;
      };
      if (typeof charge.exp !== "number" || Date.now() > charge.exp) return null;
      return { sub: charge.sub, niveau: charge.niveau, identifiantPublic: charge.identifiantPublic };
    } catch {
      return null;
    }
  }

  #signer(donnees: string): string {
    return createHmac("sha256", this.#secret).update(donnees).digest("base64url");
  }
}

function enc(o: unknown): string {
  return Buffer.from(JSON.stringify(o), "utf8").toString("base64url");
}
