import { describe, it, expect } from "vitest";
import { CODES_ERREUR } from "@paraphe/partage";
import { creerEnveloppe } from "./creer-enveloppe";
import { envoyerEnveloppe } from "./envoyer-enveloppe";
import { DepotEnveloppesMemoire } from "../adaptateurs/depot-enveloppes-memoire";

const DOCUMENT = Buffer.from("document", "utf8");

function ctx() {
  let n = 0;
  return {
    depot: new DepotEnveloppesMemoire(),
    horloge: { maintenant: () => new Date("2026-08-12T14:00:00Z") },
    genererId: () => `id-${++n}`,
  };
}

async function creerBrouillon(deps: ReturnType<typeof ctx>) {
  return creerEnveloppe(
    {
      createurId: "alice",
      titre: "Bail",
      mode: "sequentiel",
      signataires: [
        { nomDeclare: "Bob", telephone: "+229", ordre: 1, niveauIdentiteExige: "standard" },
      ],
    },
    deps,
  );
}

describe("creerEnveloppe", () => {
  it("crée un brouillon avec signataires en_attente et journalise creee", async () => {
    const deps = ctx();
    const { enveloppeId } = await creerBrouillon(deps);
    const agg = await deps.depot.charger(enveloppeId);
    expect(agg!.enveloppe.statut).toBe("brouillon");
    expect(agg!.enveloppe.documentHashOrigine).toBeNull();
    expect(agg!.signataires).toHaveLength(1);
    expect(agg!.signataires[0]!.statut).toBe("en_attente");
    expect(agg!.journal.lister().map((e) => e.type)).toEqual(["creee"]);
  });
});

describe("envoyerEnveloppe", () => {
  it("fige l'empreinte d'origine et passe brouillon → envoyee", async () => {
    const deps = ctx();
    const { enveloppeId } = await creerBrouillon(deps);
    const r = await envoyerEnveloppe({ enveloppeId, document: DOCUMENT, acteur: "alice" }, deps);
    expect(r.statut).toBe("envoyee");
    const agg = await deps.depot.charger(enveloppeId);
    expect(agg!.enveloppe.documentHashOrigine).toBe(r.documentHashOrigine);
    expect(agg!.journal.lister().map((e) => e.type)).toEqual(["creee", "envoyee"]);
  });

  it("refuse d'envoyer une enveloppe sans signataire", async () => {
    const deps = ctx();
    const { enveloppeId } = await creerEnveloppe(
      { createurId: "alice", titre: "Vide", mode: "parallele", signataires: [] },
      deps,
    );
    await expect(
      envoyerEnveloppe({ enveloppeId, document: DOCUMENT, acteur: "alice" }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.TRANSITION_INTERDITE });
  });

  it("refuse un second envoi (transition interdite depuis envoyee)", async () => {
    const deps = ctx();
    const { enveloppeId } = await creerBrouillon(deps);
    await envoyerEnveloppe({ enveloppeId, document: DOCUMENT, acteur: "alice" }, deps);
    await expect(
      envoyerEnveloppe({ enveloppeId, document: DOCUMENT, acteur: "alice" }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.TRANSITION_INTERDITE });
  });

  it("refuse d'envoyer une enveloppe introuvable", async () => {
    const deps = ctx();
    await expect(
      envoyerEnveloppe({ enveloppeId: "inconnu", document: DOCUMENT, acteur: "alice" }, deps),
    ).rejects.toMatchObject({ code: CODES_ERREUR.ENVELOPPE_INTROUVABLE });
  });
});
