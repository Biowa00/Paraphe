import process from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import { DepotEnveloppesSurClient } from "../adaptateurs/depot-enveloppes-postgres";
import { DepotUtilisateursSurClient } from "../adaptateurs/depot-utilisateurs-postgres";
import { parRefDb, parEmpreinteDb } from "../adaptateurs/depot-verification-postgres";
import { soldeDb, enregistrerCreditDb, debiterEnvoiDb } from "../adaptateurs/depot-credits-postgres";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { ChiffreurLocalDev } from "../adaptateurs/chiffreur-local-dev";
import { StockageLocalDev } from "../adaptateurs/stockage-local-dev";
import { SceauServeurLocalDev } from "../adaptateurs/sceau-serveur-local-dev";
import { HorlogeSysteme } from "../adaptateurs/horloge-systeme";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { OcrPieceLocalDev, referencePieceDev } from "../adaptateurs/ocr-piece-local-dev";
import { BiometrieLocalDev, referenceSelfieDev } from "../adaptateurs/biometrie-local-dev";
import { inscrireCompteVerifie } from "../cas-usage/inscrire-compte-verifie";
import { creerEnveloppe } from "../cas-usage/creer-enveloppe";
import { envoyerEnveloppe } from "../cas-usage/envoyer-enveloppe";
import { traiterSignature } from "../cas-usage/traiter-signature";
import { scellerEnveloppe } from "../cas-usage/sceller-enveloppe";
import { verifierDocument } from "../cas-usage/verifier-document";
import type { DepotCredits, DepotVerification } from "../domaine/ports";
import type { PoolClient } from "pg";

// Prouve la VÉRIFICATION PUBLIQUE contre la VRAIE base : on scelle une enveloppe,
// puis un tiers vérifie le document authentique (intègre) et un document altéré
// (rejeté). Le tout dans une transaction ANNULÉE (rollback) — zéro déchet.

try {
  process.loadEnvFile();
} catch {
  /* variables système */
}
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant.");
  process.exit(1);
}

const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
const client = await pool.connect();
const otp = new GuichetOtpLocalDev();
const horloge = new HorlogeSysteme();
const genererId = () => randomUUID();

// Dépôt de vérification lié au client de la transaction en cours.
const depotVerif = (c: PoolClient): DepotVerification => ({
  parRef: (ref) => parRefDb(c, ref),
  parEmpreinte: (e) => parEmpreinteDb(c, e),
});

try {
  await client.query("begin");
  const depot = new DepotEnveloppesSurClient(client);
  const depotU = new DepotUtilisateursSurClient(client);
  const credits: DepotCredits = {
    solde: (t, i) => soldeDb(client, t, i),
    enregistrer: (tx) => enregistrerCreditDb(client, tx),
    debiterEnvoi: (t, i, e) => debiterEnvoiDb(client, t, i, e),
  };

  // Inscrire un créateur vérifié + sceller une enveloppe (document connu).
  const insc = await inscrireCompteVerifie(
    {
      telephone: `+229${randomInt(0, 1e8)}`,
      otpTicket: otp.emettreTicket("inscription"),
      refPiece: referencePieceDev({ npi: `${randomInt(1e12, 9e12)}`, nom: "DOSSOU", prenoms: "Awa" }),
      refSelfie: referenceSelfieDev({ vivaciteOk: true, score: 0.96 }),
    },
    {
      depot: depotU, otp, ocr: new OcrPieceLocalDev(), biometrie: new BiometrieLocalDev(),
      hacheurNpi: new HacheurNpiLocalDev("pepper-verif-verification"), horloge, genererId,
      alea: () => randomInt(0, 2 ** 31),
    },
  );

  const document = Buffer.from("Document à vérifier publiquement", "utf8");
  const { enveloppeId } = await creerEnveloppe(
    {
      createurId: insc.utilisateurId, titre: "TEST vérification", mode: "sequentiel",
      signataires: [{ nomDeclare: "Bob", telephone: "+22990000001", ordre: 1, niveauIdentiteExige: "standard" }],
    },
    { depot, horloge, genererId },
  );
  await envoyerEnveloppe({ enveloppeId, document, acteur: insc.utilisateurId }, { depot, credits, horloge });
  const agg1 = await depot.charger(enveloppeId);
  await traiterSignature(
    {
      enveloppeId, signataireId: agg1!.signataires[0]!.id, niveauVerifie: "standard",
      otpTicket: otp.emettreTicket("signature"),
      trace: { horodatageCapture: new Date().toISOString(), traits: [[0, 0], [1, 2]] }, acteur: "bob",
    },
    { depot, otp, horloge },
  );
  const agg = await depot.charger(enveloppeId);
  await scellerEnveloppe(
    {
      enveloppeId, statutActuel: agg!.enveloppe.statut, document,
      empreinteOrigine: agg!.enveloppe.documentHashOrigine ?? "",
      signataires: agg!.signataires.map((s) => ({
        nomDeclare: s.nomDeclare, niveau: s.niveauIdentiteExige, horodatageSignature: s.dateSignature ?? "",
      })),
      journal: agg!.journal, acteur: "systeme",
    },
    { chiffreur: new ChiffreurLocalDev(), stockage: new StockageLocalDev(), sceau: new SceauServeurLocalDev(), horloge },
  );
  agg!.enveloppe.statut = "scellee";
  agg!.enveloppe.dateScellement = horloge.maintenant().toISOString();
  await depot.enregistrer(agg!);

  // Vérification publique contre la base.
  const deps = { depot: depotVerif(client) };
  const authentique = await verifierDocument(
    { documentBase64: document.toString("base64"), enveloppeRef: enveloppeId },
    deps,
  );
  const altere = await verifierDocument(
    { documentBase64: Buffer.from("Document trafiqué").toString("base64"), enveloppeRef: enveloppeId },
    deps,
  );
  const parEmpreinte = await verifierDocument({ documentBase64: document.toString("base64") }, deps);

  const ok =
    authentique.integre === true &&
    authentique.signataires?.length === 1 &&
    altere.integre === false &&
    altere.raison === "modifie_apres_signature" &&
    parEmpreinte.integre === true &&
    parEmpreinte.enveloppeRef === enveloppeId;

  console.log(
    ok
      ? "✅ Vérification publique prouvée sur Postgres (authentique = intègre, altéré = rejeté, recherche par empreinte OK)."
      : `❌ Vérification incohérente (authentique=${authentique.integre}, altéré=${altere.raison}).`,
  );
  if (!ok) process.exitCode = 1;

  await client.query("rollback");
  console.log("(transaction annulée : aucune donnée de test laissée dans la base)");
} catch (erreur) {
  await client.query("rollback");
  console.error("❌ Erreur :", (erreur as Error).message);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
