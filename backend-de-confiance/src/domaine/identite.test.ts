import { describe, it, expect } from "vitest";
import { niveauSuffisant } from "./identite";

describe("niveauSuffisant (02_logic/03)", () => {
  it("renforce satisfait standard", () => {
    expect(niveauSuffisant("renforce", "standard")).toBe(true);
  });
  it("égalité suffit", () => {
    expect(niveauSuffisant("standard", "standard")).toBe(true);
  });
  it("otp_seul ne satisfait pas renforce", () => {
    expect(niveauSuffisant("otp_seul", "renforce")).toBe(false);
  });
  it("standard ne satisfait pas renforce", () => {
    expect(niveauSuffisant("standard", "renforce")).toBe(false);
  });
});
