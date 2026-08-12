import { randomUUID } from "node:crypto";
import { CODES_ERREUR, ErreurMetier } from "@paraphe/partage";
import type { ActionOtp, ServiceOtp } from "../domaine/ports";

/**
 * DEV UNIQUEMENT — tickets OTP en mémoire. En production, `emettreTicket` est
 * remplacé par la vérification réelle d'un OTP (SMS/WhatsApp), mais la propriété
 * essentielle est la même : un ticket est frais, lié à une action, et à
 * USAGE UNIQUE (I2).
 */
export class GuichetOtpLocalDev implements ServiceOtp {
  readonly #tickets = new Map<string, { action: ActionOtp; expire: number }>();

  /** Simule un OTP fraîchement vérifié : émet un ticket à usage unique. */
  emettreTicket(action: ActionOtp, dureeMs = 120_000): string {
    const ticket = randomUUID();
    this.#tickets.set(ticket, { action, expire: Date.now() + dureeMs });
    return ticket;
  }

  async consommerTicket(ticket: string, action: ActionOtp): Promise<void> {
    const entree = this.#tickets.get(ticket);
    if (!entree) {
      throw new ErreurMetier(
        CODES_ERREUR.OTP_INVALIDE,
        "Ticket OTP inconnu ou déjà consommé.",
      );
    }
    // Consommation immédiate : même un échec ultérieur invalide le ticket
    // (pas de réutilisation possible).
    this.#tickets.delete(ticket);

    if (entree.action !== action) {
      throw new ErreurMetier(
        CODES_ERREUR.OTP_INVALIDE,
        "Ticket OTP destiné à une autre action.",
      );
    }
    if (Date.now() > entree.expire) {
      throw new ErreurMetier(CODES_ERREUR.OTP_EXPIRE, "Ticket OTP expiré.");
    }
  }
}
