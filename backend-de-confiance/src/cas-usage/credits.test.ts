import { describe, it, expect } from "vitest";
import { acheterCredits, confirmerPaiement, consulterSolde, listerPacks } from "./credits";
import { DepotCreditsMemoire, DepotPaiementsMemoire } from "../adaptateurs/depot-credits-memoire";
import { OperateurMobileMoneyLocalDev } from "../adaptateurs/operateur-mobile-money-local-dev";

let n = 0;

function ctx() {
  const credits = new DepotCreditsMemoire();
  const paiements = new DepotPaiementsMemoire(credits);
  return {
    credits,
    depsAchat: {
      depotPaiements: paiements,
      operateur: new OperateurMobileMoneyLocalDev(),
      genererId: () => `id-${++n}`,
    },
    depsWebhook: { depotPaiements: paiements },
  };
}

const titulaire = { titulaireType: "utilisateur" as const, titulaireId: "u1", telephone: "+22990000001" };

describe("achat de crédits", () => {
  it("un achat non confirmé ne crédite rien (solde inchangé)", async () => {
    const { credits, depsAchat } = ctx();
    await acheterCredits({ ...titulaire, packId: "decouverte" }, depsAchat);
    expect((await consulterSolde({ type: "utilisateur", id: "u1" }, { depot: credits })).solde).toBe(0);
  });

  it("achat → webhook succès → solde crédité de la quantité du pack", async () => {
    const { credits, depsAchat, depsWebhook } = ctx();
    const r = await acheterCredits({ ...titulaire, packId: "pme" }, depsAchat);
    const w = await confirmerPaiement({ reference: r.transactionId, succes: true }, depsWebhook);
    expect(w.credite).toBe(true);
    expect((await consulterSolde({ type: "utilisateur", id: "u1" }, { depot: credits })).solde).toBe(50);
  });

  it("double webhook → jamais de double crédit (idempotence)", async () => {
    const { credits, depsAchat, depsWebhook } = ctx();
    const r = await acheterCredits({ ...titulaire, packId: "decouverte" }, depsAchat);
    const w1 = await confirmerPaiement({ reference: r.transactionId, succes: true }, depsWebhook);
    const w2 = await confirmerPaiement({ reference: r.transactionId, succes: true }, depsWebhook);
    expect(w1.credite).toBe(true);
    expect(w2.credite).toBe(false); // déjà traité
    expect((await consulterSolde({ type: "utilisateur", id: "u1" }, { depot: credits })).solde).toBe(10);
  });

  it("webhook d'échec → aucun crédit débité (I8)", async () => {
    const { credits, depsAchat, depsWebhook } = ctx();
    const r = await acheterCredits({ ...titulaire, packId: "decouverte" }, depsAchat);
    const w = await confirmerPaiement({ reference: r.transactionId, succes: false }, depsWebhook);
    expect(w.statut).toBe("echoue");
    expect((await consulterSolde({ type: "utilisateur", id: "u1" }, { depot: credits })).solde).toBe(0);
  });

  it("référence inconnue → ignorée sans effet", async () => {
    const { depsWebhook } = ctx();
    const w = await confirmerPaiement({ reference: "MM-inconnue", succes: true }, depsWebhook);
    expect(w.statut).toBe("ignore");
    expect(w.credite).toBe(false);
  });

  it("pack inconnu → refusé", async () => {
    const { depsAchat } = ctx();
    await expect(
      acheterCredits({ ...titulaire, packId: "bidon" }, depsAchat),
    ).rejects.toBeTruthy();
  });

  it("le catalogue de packs est exposé", () => {
    expect(listerPacks().length).toBeGreaterThan(0);
    expect(listerPacks()[0]).toHaveProperty("quantite");
  });
});
