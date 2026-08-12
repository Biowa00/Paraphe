import Fastify, { type FastifyInstance } from "fastify";
import { z } from "zod";
import { creerEnveloppe } from "../cas-usage/creer-enveloppe";
import { envoyerEnveloppe } from "../cas-usage/envoyer-enveloppe";
import { traiterSignature } from "../cas-usage/traiter-signature";
import { scellerEnveloppe } from "../cas-usage/sceller-enveloppe";
import type { DossierPreuve } from "../domaine/dossier-preuve";
import type { Composition } from "./composition";
import { envoyerErreur } from "./erreurs-http";

const NIVEAU = z.enum(["otp_seul", "standard", "renforce"]);

const schemaCreation = z.object({
  createurId: z.string().min(1),
  entrepriseId: z.string().nullish(),
  titre: z.string().min(1),
  mode: z.enum(["sequentiel", "parallele"]),
  dateExpiration: z.string().nullish(),
  signataires: z
    .array(
      z.object({
        nomDeclare: z.string().min(1),
        telephone: z.string().min(1),
        ordre: z.number().int(),
        niveauIdentiteExige: NIVEAU,
      }),
    )
    .min(1),
});

const schemaEnvoi = z.object({
  documentBase64: z.string().min(1),
  acteur: z.string().min(1),
});

const schemaSignature = z.object({
  signataireId: z.string().min(1),
  niveauVerifie: NIVEAU,
  otpTicket: z.string().min(1),
  trace: z.object({
    horodatageCapture: z.string().min(1),
    traits: z.array(z.tuple([z.number(), z.number()])),
  }),
  acteur: z.string().min(1),
});

const schemaOtp = z.object({
  action: z.enum(["inscription", "signature", "connexion"]),
});

function requeteInvalide(reply: Parameters<typeof envoyerErreur>[0], message: string) {
  reply.status(400).send({ erreur: { code: "requete_invalide", message } });
}

export function construireServeur(c: Composition): FastifyInstance {
  const app = Fastify({ logger: false });

  app.get("/v1/sante", async () => ({ ok: true }));

  // DEV : simule un OTP vérifié en renvoyant un ticket frais (à usage unique).
  app.post("/v1/otp/verifie", async (req, reply) => {
    const parse = schemaOtp.safeParse(req.body);
    if (!parse.success) return requeteInvalide(reply, "Action OTP invalide.");
    return reply.send({ ticket: c.otp.emettreTicket(parse.data.action) });
  });

  app.post("/v1/enveloppes", async (req, reply) => {
    const parse = schemaCreation.safeParse(req.body);
    if (!parse.success) return requeteInvalide(reply, "Enveloppe invalide.");
    try {
      const r = await creerEnveloppe(parse.data, {
        depot: c.depot,
        horloge: c.horloge,
        genererId: c.genererId,
      });
      return reply.status(201).send({ id: r.enveloppeId, statut: "brouillon" });
    } catch (e) {
      return envoyerErreur(reply, e);
    }
  });

  app.post("/v1/enveloppes/:id/envoi", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parse = schemaEnvoi.safeParse(req.body);
    if (!parse.success) return requeteInvalide(reply, "Envoi invalide.");
    try {
      const document = Buffer.from(parse.data.documentBase64, "base64");
      const r = await envoyerEnveloppe(
        { enveloppeId: id, document, acteur: parse.data.acteur },
        { depot: c.depot, horloge: c.horloge },
      );
      c.bufferDocuments.set(id, document); // DEV : conservé jusqu'au scellement
      return reply.send({ statut: r.statut, documentHashOrigine: r.documentHashOrigine });
    } catch (e) {
      return envoyerErreur(reply, e);
    }
  });

  app.post("/v1/enveloppes/:id/signature", async (req, reply) => {
    const { id } = req.params as { id: string };
    const parse = schemaSignature.safeParse(req.body);
    if (!parse.success) return requeteInvalide(reply, "Signature invalide.");
    try {
      const r = await traiterSignature(
        { enveloppeId: id, ...parse.data },
        { depot: c.depot, otp: c.otp, horloge: c.horloge },
      );
      if (r.statut !== "complete") {
        return reply.send({ statut: r.statut });
      }
      // Scellement automatique au dernier signataire (02_logic/01).
      const dossierPreuve = await scellerAutomatiquement(c, id);
      return reply.send({ statut: "scellee", dossierPreuve });
    } catch (e) {
      return envoyerErreur(reply, e);
    }
  });

  app.get("/v1/enveloppes/:id", async (req, reply) => {
    const { id } = req.params as { id: string };
    const agg = await c.depot.charger(id);
    if (!agg) {
      return reply
        .status(404)
        .send({ erreur: { code: "enveloppe_introuvable", message: "Introuvable." } });
    }
    return reply.send({
      id: agg.enveloppe.id,
      statut: agg.enveloppe.statut,
      signataires: agg.signataires.map((s) => ({
        id: s.id,
        nomDeclare: s.nomDeclare,
        statut: s.statut,
        dateSignature: s.dateSignature,
      })),
      journal: agg.journal.lister().map((e) => ({
        type: e.type,
        horodatage: e.horodatage.toISOString(),
      })),
    });
  });

  return app;
}

async function scellerAutomatiquement(
  c: Composition,
  enveloppeId: string,
): Promise<DossierPreuve> {
  const agg = await c.depot.charger(enveloppeId);
  if (!agg) throw new Error("Agrégat manquant au scellement.");
  const document = c.bufferDocuments.get(enveloppeId);
  if (!document) throw new Error("Document manquant au scellement (dev).");

  const scell = await scellerEnveloppe(
    {
      enveloppeId,
      statutActuel: agg.enveloppe.statut,
      document,
      empreinteOrigine: agg.enveloppe.documentHashOrigine ?? "",
      signataires: agg.signataires.map((s) => ({
        nomDeclare: s.nomDeclare,
        niveau: s.niveauIdentiteExige,
        horodatageSignature: s.dateSignature ?? "",
      })),
      journal: agg.journal,
      acteur: "systeme",
    },
    { chiffreur: c.chiffreur, stockage: c.stockage, sceau: c.sceau, horloge: c.horloge },
  );

  agg.enveloppe.statut = "scellee";
  agg.enveloppe.dateScellement = c.horloge.maintenant().toISOString();
  await c.depot.enregistrer(agg);
  c.bufferDocuments.delete(enveloppeId); // le clair ne traîne pas après scellement
  return scell.dossierPreuve;
}
