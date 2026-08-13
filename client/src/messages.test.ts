import { describe, it, expect } from "vitest";
import { messageErreur } from "./messages";

describe("messageErreur", () => {
  it("traduit les codes connus", () => {
    expect(messageErreur("pas_votre_tour")).toMatch(/tour/i);
    expect(messageErreur("otp_expire")).toMatch(/expir/i);
    expect(messageErreur("enveloppe_scellee")).toMatch(/scell/i);
  });

  it("a un repli neutre pour un code inconnu", () => {
    expect(messageErreur("code_bidon")).toMatch(/erreur/i);
  });
});
