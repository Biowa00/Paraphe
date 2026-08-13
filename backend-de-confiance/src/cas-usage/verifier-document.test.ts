import { describe, it, expect } from "vitest";
import { verifierDocument } from "./verifier-document";
import { empreinteSha256 } from "../domaine/empreinte";
import { DepotEnveloppesMemoire } from "../adaptateurs/depot-enveloppes-memoire";
import { JournalAjoutSeul } from "../domaine/journal";
import type { EnveloppeAgg } from "../domaine/modele";
import type { StatutEnveloppe } from "@paraphe/partage";

const DOCUMENT = Buffer.from("Contrat de bail — version finale", "utf8");
const base64 = (b: Buffer) => b.toString("base64");

function aggScelle(
  id: string,
  document: Buffer,
  statut: StatutEnveloppe = "scellee",
): EnveloppeAgg {
  return {
    enveloppe: {
      id,
      createurId: "u1",
      entrepriseId: null,
      titre: "SECRET — ne doit jamais fuiter",
      documentHashOrigine: empreinteSha256(document),
      mode: "sequentiel",
      statut,
      dateCreation: "2026-08-12T10:00:00Z",
      dateExpiration: null,
      dateScellement: statut === "scellee" ? "2026-08-12T10:05:00Z" : null,
    },
    signataires: [
      {
        id: "s1",
        enveloppeId: id,
        utilisateurId: null,
        telephone: "+22990000001",
        nomDeclare: "Bob Dossou",
        ordre: 1,
        niveauIdentiteExige: "renforce",
        statut: "signee",
        dateSignature: "2026-08-12T10:04:00Z",
      },
    ],
    journal: new JournalAjoutSeul(),
  };
}

async function depotAvec(...aggs: EnveloppeAgg[]) {
  const depot = new DepotEnveloppesMemoire();
  for (const a of aggs) await depot.creer(a);
  return depot;
}

describe("verifierDocument", () => {
  it("document intègre + référence → integre true, signataires et dates", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument(
      { documentBase64: base64(DOCUMENT), enveloppeRef: "env-1" },
      { depot },
    );
    expect(r.integre).toBe(true);
    expect(r.statut).toBe("scellee");
    expect(r.signataires).toEqual([
      { nom: "Bob Dossou", niveau: "renforce", dateSignature: "2026-08-12T10:04:00Z" },
    ]);
  });

  it("document altéré avec la bonne référence → integre false, modifie_apres_signature", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument(
      { documentBase64: base64(Buffer.from("Contrat trafiqué")), enveloppeRef: "env-1" },
      { depot },
    );
    expect(r.integre).toBe(false);
    expect(r.raison).toBe("modifie_apres_signature");
    expect(r.signataires).toBeUndefined(); // aucune fuite sur un doc altéré
  });

  it("document intègre sans référence → retrouvé par empreinte", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument({ documentBase64: base64(DOCUMENT) }, { depot });
    expect(r.integre).toBe(true);
    expect(r.enveloppeRef).toBe("env-1");
  });

  it("document inconnu → aucune_correspondance, message neutre", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument({ documentBase64: base64(Buffer.from("Autre")) }, { depot });
    expect(r).toEqual({ integre: false, raison: "aucune_correspondance" });
  });

  it("un brouillon n'est jamais divulgué (même empreinte)", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT, "envoyee"));
    // par empreinte : parEmpreinte ne renvoie que du scellé
    const parEmpreinte = await verifierDocument({ documentBase64: base64(DOCUMENT) }, { depot });
    expect(parEmpreinte).toEqual({ integre: false, raison: "aucune_correspondance" });
    // par référence : non scellé → neutre
    const parRef = await verifierDocument(
      { documentBase64: base64(DOCUMENT), enveloppeRef: "env-1" },
      { depot },
    );
    expect(parRef).toEqual({ integre: false, raison: "aucune_correspondance" });
  });

  it("référence seule (sans document) → integre null + dossier scellé", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument({ enveloppeRef: "env-1" }, { depot });
    expect(r.integre).toBeNull();
    expect(r.enveloppeRef).toBe("env-1");
    expect(r.signataires).toHaveLength(1);
  });

  it("I7 — le rapport ne contient jamais le titre ni le contenu", async () => {
    const depot = await depotAvec(aggScelle("env-1", DOCUMENT));
    const r = await verifierDocument(
      { documentBase64: base64(DOCUMENT), enveloppeRef: "env-1" },
      { depot },
    );
    const serialise = JSON.stringify(r);
    expect(serialise).not.toContain("SECRET");
    expect(serialise).not.toContain(base64(DOCUMENT));
  });
});
