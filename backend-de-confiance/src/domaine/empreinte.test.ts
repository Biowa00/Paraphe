import { describe, it, expect } from "vitest";
import { empreinteSha256 } from "./empreinte";

describe("empreinteSha256 (couche intégrité)", () => {
  it("est déterministe et connue pour la chaîne vide", () => {
    expect(empreinteSha256("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    );
  });

  it("donne la même empreinte pour la même entrée", () => {
    expect(empreinteSha256("contrat")).toBe(empreinteSha256("contrat"));
  });

  it("change dès que l'entrée change (rien n'a bougé depuis)", () => {
    expect(empreinteSha256("contrat")).not.toBe(empreinteSha256("contrat "));
  });
});
