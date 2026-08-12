import { describe, it, expect } from "vitest";
import { verify } from "node:crypto";
import { ErreurMetier } from "@paraphe/partage";
import { scellerEnveloppe, type DemandeScellement } from "./sceller-enveloppe";
import { empreinteSha256 } from "../domaine/empreinte";
import { JournalAjoutSeul } from "../domaine/journal";
import { ChiffreurLocalDev } from "../adaptateurs/chiffreur-local-dev";
import { StockageLocalDev } from "../adaptateurs/stockage-local-dev";
import { SceauServeurLocalDev } from "../adaptateurs/sceau-serveur-local-dev";

const DOCUMENT = Buffer.from("Contrat de bail — 12 mois", "utf8");

function contexte() {
  const chiffreur = new ChiffreurLocalDev();
  const stockage = new StockageLocalDev();
  const sceau = new SceauServeurLocalDev();
  const horloge = { maintenant: () => new Date("2026-08-12T14:03:00Z") };

  const journal = new JournalAjoutSeul();
  journal.ajouter({
    enveloppeId: "env-1",
    type: "creee",
    acteur: "alice",
    horodatage: new Date("2026-08-12T13:00:00Z"),
  });
  journal.ajouter({
    enveloppeId: "env-1",
    type: "signee",
    acteur: "bob",
    horodatage: new Date("2026-08-12T14:00:00Z"),
  });

  return { chiffreur, stockage, sceau, horloge, journal };
}

function demande(journal: JournalAjoutSeul): DemandeScellement {
  return {
    enveloppeId: "env-1",
    statutActuel: "complete",
    document: DOCUMENT,
    empreinteOrigine: empreinteSha256(DOCUMENT),
    signataires: [
      { nomDeclare: "Bob", niveau: "standard", horodatageSignature: "2026-08-12T14:00:00Z" },
    ],
    journal,
    acteur: "systeme",
  };
}

describe("scellerEnveloppe (S1 — bout en bout)", () => {
  it("scelle, chiffre, stocke en WORM et produit un dossier de preuve", async () => {
    const { journal, ...deps } = contexte();
    const r = await scellerEnveloppe(demande(journal), deps);

    expect(r.statut).toBe("scellee");
    expect(r.dossierPreuve.empreinteFinale).toBe(empreinteSha256(DOCUMENT));
    expect(r.dossierPreuve.journal.map((e) => e.type)).toEqual([
      "creee",
      "signee",
      "scellee",
    ]);

    // Le stockage ne contient que du chiffré, jamais le clair (I7).
    const chiffre = await deps.stockage.lire(r.cheminChiffre);
    expect(chiffre.includes(DOCUMENT)).toBe(false);

    // Mais une partie légitime, avec la clé, peut déchiffrer à l'identique.
    const dechiffre = await deps.chiffreur.dechiffrer(r.refCle, chiffre);
    expect(dechiffre.equals(DOCUMENT)).toBe(true);
  });

  it("le cachet serveur signe le dossier et est vérifiable", async () => {
    const { journal, ...deps } = contexte();
    const r = await scellerEnveloppe(demande(journal), deps);

    const { cachet, ...corps } = r.dossierPreuve;
    const ok = verify(
      null,
      Buffer.from(JSON.stringify(corps), "utf8"),
      deps.sceau.clePublique,
      Buffer.from(cachet.signature, "base64"),
    );
    expect(ok).toBe(true);
    expect(cachet.algorithme).toBe("ed25519");
  });

  it("I3 : impossible de sceller une enveloppe qui n'est pas complete", async () => {
    const { journal, ...deps } = contexte();
    await expect(
      scellerEnveloppe({ ...demande(journal), statutActuel: "envoyee" }, deps),
    ).rejects.toThrowError(ErreurMetier);
  });

  it("WORM : le document scellé ne peut pas être écrasé", async () => {
    const { journal, ...deps } = contexte();
    const r = await scellerEnveloppe(demande(journal), deps);
    await expect(
      deps.stockage.ecrire(r.cheminChiffre, Buffer.from("faux")),
    ).rejects.toThrow();
  });

  it("crypto-shredding : détruire la clé rend le contenu illisible, l'enveloppe demeure", async () => {
    const { journal, ...deps } = contexte();
    const r = await scellerEnveloppe(demande(journal), deps);

    await deps.chiffreur.detruireCle(r.refCle);

    // L'objet chiffré existe toujours (I3 : aucune suppression)…
    const chiffre = await deps.stockage.lire(r.cheminChiffre);
    expect(chiffre.length).toBeGreaterThan(0);
    // …mais il est désormais illisible.
    await expect(deps.chiffreur.dechiffrer(r.refCle, chiffre)).rejects.toThrow();
  });
});
