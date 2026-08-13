import { describe, it, expect, beforeEach } from "vitest";
import type { FastifyInstance } from "fastify";
import { construireServeur } from "./serveur";
import { compositionDev } from "./composition";

const TRACE = { horodatageCapture: "2026-08-12T14:00:00Z", traits: [[0, 0], [1, 1]] };

async function creerEtEnvoyer(app: FastifyInstance): Promise<{ id: string; sigId: string }> {
  const creation = await app.inject({
    method: "POST",
    url: "/v1/enveloppes",
    payload: {
      createurId: "alice",
      titre: "Bail",
      mode: "sequentiel",
      signataires: [
        { nomDeclare: "Bob", telephone: "+22990000001", ordre: 1, niveauIdentiteExige: "standard" },
      ],
    },
  });
  const { id } = creation.json();
  await app.inject({
    method: "POST",
    url: `/v1/enveloppes/${id}/envoi`,
    payload: { documentBase64: Buffer.from("Bail").toString("base64"), acteur: "alice" },
  });
  const detail = await app.inject({ method: "GET", url: `/v1/enveloppes/${id}` });
  return { id, sigId: detail.json().signataires[0].id };
}

describe("API HTTP", () => {
  let app: FastifyInstance;
  beforeEach(() => {
    app = construireServeur(compositionDev());
  });

  it("répond à /v1/sante", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/sante" });
    expect(r.statusCode).toBe(200);
    expect(r.json()).toEqual({ ok: true });
  });

  it("créer → envoyer → signer déclenche le scellement automatique", async () => {
    const { id, sigId } = await creerEtEnvoyer(app);

    const otp = await app.inject({
      method: "POST",
      url: "/v1/otp/verifie",
      payload: { action: "signature" },
    });
    const ticket = otp.json().ticket;

    const signature = await app.inject({
      method: "POST",
      url: `/v1/enveloppes/${id}/signature`,
      payload: { signataireId: sigId, niveauVerifie: "standard", otpTicket: ticket, trace: TRACE, acteur: "bob" },
    });
    expect(signature.statusCode).toBe(200);
    expect(signature.json().statut).toBe("scellee");
    expect(signature.json().dossierPreuve).toBeDefined();

    const detail = await app.inject({ method: "GET", url: `/v1/enveloppes/${id}` });
    expect(detail.json().statut).toBe("scellee");
    expect(detail.json().journal.map((e: { type: string }) => e.type)).toEqual([
      "creee",
      "envoyee",
      "otp_valide",
      "signee",
      "scellee",
    ]);
  });

  it("refuse une signature sans OTP frais (I2) → 422 otp_invalide", async () => {
    const { id, sigId } = await creerEtEnvoyer(app);
    const r = await app.inject({
      method: "POST",
      url: `/v1/enveloppes/${id}/signature`,
      payload: { signataireId: sigId, niveauVerifie: "standard", otpTicket: "bidon", trace: TRACE, acteur: "bob" },
    });
    expect(r.statusCode).toBe(422);
    expect(r.json().erreur.code).toBe("otp_invalide");
  });

  it("rejette une création invalide → 400", async () => {
    const r = await app.inject({
      method: "POST",
      url: "/v1/enveloppes",
      payload: { titre: "", mode: "sequentiel", signataires: [] },
    });
    expect(r.statusCode).toBe(400);
  });

  it("404 sur une enveloppe inconnue", async () => {
    const r = await app.inject({ method: "GET", url: "/v1/enveloppes/inconnu" });
    expect(r.statusCode).toBe(404);
  });

  it("vérification publique : document scellé → integre true ; altéré → false", async () => {
    // Sceller une enveloppe via la boucle (document = "Bail").
    const { id, sigId } = await creerEtEnvoyer(app);
    const otp = await app.inject({
      method: "POST",
      url: "/v1/otp/verifie",
      payload: { action: "signature" },
    });
    const sign = await app.inject({
      method: "POST",
      url: `/v1/enveloppes/${id}/signature`,
      payload: {
        signataireId: sigId,
        niveauVerifie: "standard",
        otpTicket: otp.json().ticket,
        trace: TRACE,
        acteur: "bob",
      },
    });
    expect(sign.json().statut).toBe("scellee");

    // Document authentique → intègre.
    const ok = await app.inject({
      method: "POST",
      url: "/v1/verification",
      payload: { documentBase64: Buffer.from("Bail").toString("base64"), enveloppeRef: id },
    });
    expect(ok.statusCode).toBe(200);
    expect(ok.json().integre).toBe(true);
    expect(ok.json().signataires).toHaveLength(1);
    // Ne divulgue pas le titre (I7).
    expect(JSON.stringify(ok.json())).not.toContain("Bail");

    // Document altéré → non intègre, sans fuite.
    const ko = await app.inject({
      method: "POST",
      url: "/v1/verification",
      payload: { documentBase64: Buffer.from("Bail modifié").toString("base64"), enveloppeRef: id },
    });
    expect(ko.json().integre).toBe(false);
    expect(ko.json().raison).toBe("modifie_apres_signature");

    // Sans document ni référence → 400.
    const vide = await app.inject({ method: "POST", url: "/v1/verification", payload: {} });
    expect(vide.statusCode).toBe(400);
  });

  it("POST /v1/inscription → compte vérifié + identifiant public + 3 crédits", async () => {
    const otp = await app.inject({
      method: "POST",
      url: "/v1/otp/verifie",
      payload: { action: "inscription" },
    });
    const ticket = otp.json().ticket;

    const refPiece = Buffer.from(
      JSON.stringify({ npi: "1234567890123", nom: "DOSSOU", prenoms: "Awa", coherence: "ok" }),
    ).toString("base64url");
    const refSelfie = Buffer.from(JSON.stringify({ vivaciteOk: true, score: 0.95 })).toString(
      "base64url",
    );

    const r = await app.inject({
      method: "POST",
      url: "/v1/inscription",
      payload: { telephone: "+22990000009", otpTicket: ticket, refPiece, refSelfie },
    });
    expect(r.statusCode).toBe(201);
    const body = r.json();
    expect(body.niveau).toBe("verifie");
    expect(body.creditsBienvenue).toBe(3);
    expect(body.identifiantPublic).toMatch(/^BJ-[A-Z2-9]{4}-[A-Z2-9]{3}$/);
    // Ni NPI ni image dans la réponse (I4/I5).
    expect(JSON.stringify(body)).not.toContain("1234567890123");
  });
});
