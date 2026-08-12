import { describe, it, expect } from "vitest";
import { CODES_ERREUR } from "@paraphe/partage";
import { DepotEnveloppesMemoire } from "./depot-enveloppes-memoire";
import { JournalAjoutSeul } from "../domaine/journal";
import type { EnveloppeAgg } from "../domaine/modele";

function aggBrouillon(): EnveloppeAgg {
  return {
    enveloppe: {
      id: "e1",
      createurId: "alice",
      entrepriseId: null,
      titre: "t",
      mode: "sequentiel",
      statut: "brouillon",
      documentHashOrigine: null,
      dateCreation: "2026-08-12T14:00:00Z",
      dateExpiration: null,
      dateScellement: null,
    },
    signataires: [],
    journal: new JournalAjoutSeul(),
  };
}

describe("DepotEnveloppesMemoire", () => {
  it("charger renvoie une copie : muter le résultat n'altère pas le dépôt", async () => {
    const depot = new DepotEnveloppesMemoire();
    await depot.creer(aggBrouillon());

    const a = await depot.charger("e1");
    a!.enveloppe.titre = "modifié localement";

    const b = await depot.charger("e1");
    expect(b!.enveloppe.titre).toBe("t");
  });

  it("I3 : une fois enregistrée scellée, l'enveloppe ne peut plus être réécrite", async () => {
    const depot = new DepotEnveloppesMemoire();
    await depot.creer(aggBrouillon());

    const c1 = await depot.charger("e1");
    c1!.enveloppe.statut = "scellee";
    await depot.enregistrer(c1!); // état précédent = brouillon → autorisé

    const c2 = await depot.charger("e1");
    c2!.enveloppe.titre = "x";
    await expect(depot.enregistrer(c2!)).rejects.toMatchObject({
      code: CODES_ERREUR.ENVELOPPE_SCELLEE,
    });
  });

  it("refuse d'enregistrer une enveloppe jamais créée", async () => {
    const depot = new DepotEnveloppesMemoire();
    await expect(depot.enregistrer(aggBrouillon())).rejects.toMatchObject({
      code: CODES_ERREUR.ENVELOPPE_INTROUVABLE,
    });
  });
});
