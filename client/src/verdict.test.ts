import { describe, it, expect } from "vitest";
import { verdictDe, libelleNiveau, formaterDate } from "./verdict";

describe("verdictDe", () => {
  it("document intègre → verdict positif", () => {
    const v = verdictDe({ integre: true });
    expect(v.ton).toBe("ok");
    expect(v.icone).toBe("✓");
  });

  it("modifié après signature → alerte, ton factuel", () => {
    const v = verdictDe({ integre: false, raison: "modifie_apres_signature" });
    expect(v.ton).toBe("alerte");
    expect(v.titre).toMatch(/modifi/i);
  });

  it("aucune correspondance → neutre (jamais dramatisé)", () => {
    const v = verdictDe({ integre: false, raison: "aucune_correspondance" });
    expect(v.ton).toBe("neutre");
  });

  it("référence seule (integre null) → info", () => {
    const v = verdictDe({ integre: null });
    expect(v.ton).toBe("info");
  });
});

describe("libelleNiveau", () => {
  it("traduit les niveaux d'identité", () => {
    expect(libelleNiveau("renforce")).toBe("Renforcé");
    expect(libelleNiveau("standard")).toBe("Standard");
    expect(libelleNiveau("otp_seul")).toBe("OTP seul");
  });
});

describe("formaterDate", () => {
  it("rend un tiret pour une date absente ou invalide", () => {
    expect(formaterDate(null)).toBe("—");
    expect(formaterDate("pas-une-date")).toBe("—");
  });
});
