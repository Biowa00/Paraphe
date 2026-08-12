import { describe, it, expect } from "vitest";
import { transition } from "./enveloppe";
import { ErreurMetier } from "@paraphe/partage";

describe("machine à états de l'enveloppe (02_logic/01)", () => {
  it("brouillon → envoyee via envoyer", () => {
    expect(transition("brouillon", "envoyer")).toBe("envoyee");
  });

  it("envoyee → partiellement_signee si le signataire n'est pas le dernier", () => {
    expect(transition("envoyee", "signer", { dernierSignataire: false })).toBe(
      "partiellement_signee",
    );
  });

  it("envoyee → complete si signataire unique/dernier", () => {
    expect(transition("envoyee", "signer", { dernierSignataire: true })).toBe(
      "complete",
    );
  });

  it("partiellement_signee → complete au dernier signataire", () => {
    expect(
      transition("partiellement_signee", "signer", { dernierSignataire: true }),
    ).toBe("complete");
  });

  it("complete → scellee", () => {
    expect(transition("complete", "sceller")).toBe("scellee");
  });

  it("circuit V2 : brouillon → attente_validation → envoyee", () => {
    expect(transition("brouillon", "soumettre")).toBe("attente_validation");
    expect(transition("attente_validation", "approuver")).toBe("envoyee");
  });
});

describe("I3 — une enveloppe scellée est figée par construction", () => {
  it("aucune transition ne sort de scellee", () => {
    for (const e of ["envoyer", "signer", "refuser", "expirer", "sceller"] as const) {
      expect(() => transition("scellee", e)).toThrowError(ErreurMetier);
    }
  });

  it("refuser/expirer mènent à un état terminal, lui aussi figé", () => {
    expect(transition("envoyee", "refuser")).toBe("refusee");
    expect(() => transition("refusee", "signer")).toThrowError(ErreurMetier);
    expect(transition("envoyee", "expirer")).toBe("expiree");
    expect(() => transition("expiree", "signer")).toThrowError(ErreurMetier);
  });
});

describe("transitions illégales rejetées", () => {
  it("on ne peut pas envoyer une enveloppe déjà complete", () => {
    expect(() => transition("complete", "envoyer")).toThrowError(ErreurMetier);
  });

  it("on ne peut pas sceller une enveloppe qui n'est pas complete", () => {
    expect(() => transition("envoyee", "sceller")).toThrowError(ErreurMetier);
  });
});
