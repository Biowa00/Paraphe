import { describe, it, expect } from "vitest";
import { JournalAjoutSeul, type Evenement } from "./journal";

function evt(type: Evenement["type"]): Evenement {
  return { enveloppeId: "env-1", type, acteur: "test", horodatage: new Date() };
}

describe("JournalAjoutSeul (I6 — ajout seul)", () => {
  it("ajoute et liste dans l'ordre", () => {
    const j = new JournalAjoutSeul();
    j.ajouter(evt("creee"));
    j.ajouter(evt("envoyee"));
    expect(j.lister().map((e) => e.type)).toEqual(["creee", "envoyee"]);
  });

  it("n'expose aucune méthode de modification ou de suppression", () => {
    const j = new JournalAjoutSeul() as unknown as Record<string, unknown>;
    for (const interdit of [
      "modifier",
      "supprimer",
      "vider",
      "update",
      "delete",
      "pop",
      "splice",
    ]) {
      expect(typeof j[interdit]).toBe("undefined");
    }
  });

  it("la liste retournée est une copie : la muter n'altère pas le journal", () => {
    const j = new JournalAjoutSeul();
    j.ajouter(evt("creee"));
    (j.lister() as Evenement[]).pop();
    expect(j.taille).toBe(1);
  });

  it("un événement inscrit est gelé : impossible de réécrire l'histoire", () => {
    const j = new JournalAjoutSeul();
    j.ajouter(evt("signee"));
    const inscrit = j.lister()[0]!;
    expect(() => {
      (inscrit as { type: string }).type = "refusee";
    }).toThrow();
  });
});
