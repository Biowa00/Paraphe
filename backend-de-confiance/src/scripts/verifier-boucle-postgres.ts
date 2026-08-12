import process from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import {
  DepotEnveloppesSurClient,
} from "../adaptateurs/depot-enveloppes-postgres";
import { DepotUtilisateursSurClient } from "../adaptateurs/depot-utilisateurs-postgres";
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

// Prouve que la BOUCLE COMPLÈTE tourne contre la VRAIE base : un créateur vérifié
// est inscrit, puis créer → envoyer → signer → sceller, TOUT en Postgres, dans
// UNE transaction ANNULÉE (rollback). Aucune donnée de test conservée (malgré
// I3 qui interdit de supprimer un scellé : on n'écrit jamais de commit).

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

try {
  await client.query("begin");
  const depotU = new DepotUtilisateursSurClient(client);
  const depot = new DepotEnveloppesSurClient(client);

  // 1. Inscrire un créateur vérifié (FK createur_id → utilisateur).
  const inscription = await inscrireCompteVerifie(
    {
      telephone: `+229${randomInt(0, 1e8)}`,
      otpTicket: otp.emettreTicket("inscription"),
      refPiece: referencePieceDev({ npi: `${randomInt(1e12, 9e12)}`, nom: "DOSSOU", prenoms: "Awa" }),
      refSelfie: referenceSelfieDev({ vivaciteOk: true, score: 0.96 }),
    },
    {
      depot: depotU,
      otp,
      ocr: new OcrPieceLocalDev(),
      biometrie: new BiometrieLocalDev(),
      hacheurNpi: new HacheurNpiLocalDev("pepper-verif-boucle"),
      horloge,
      genererId,
      alea: () => randomInt(0, 2 ** 31),
    },
  );
  if (inscription.niveau !== "verifie") throw new Error("Inscription non vérifiée.");
  const createurId = inscription.utilisateurId;

  // 2. Créer l'enveloppe (un signataire, séquentiel).
  const { enveloppeId } = await creerEnveloppe(
    {
      createurId,
      titre: "TEST boucle Postgres",
      mode: "sequentiel",
      signataires: [
        { nomDeclare: "Bob", telephone: "+22990000001", ordre: 1, niveauIdentiteExige: "standard" },
      ],
    },
    { depot, horloge, genererId },
  );

  // 3. Envoyer (fige l'empreinte).
  const document = Buffer.from("Contenu du document de test", "utf8");
  await envoyerEnveloppe({ enveloppeId, document, acteur: createurId }, { depot, horloge });

  // 4. Signer (unique signataire → complete).
  const agg1 = await depot.charger(enveloppeId);
  const sigId = agg1!.signataires[0]!.id;
  const sign = await traiterSignature(
    {
      enveloppeId,
      signataireId: sigId,
      niveauVerifie: "standard",
      otpTicket: otp.emettreTicket("signature"),
      trace: { horodatageCapture: new Date().toISOString(), traits: [[0, 0], [1, 2], [3, 4]] },
      acteur: "bob",
    },
    { depot, otp, horloge },
  );
  if (sign.statut !== "complete") throw new Error(`Attendu complete, obtenu ${sign.statut}.`);

  // 5. Sceller (chiffrement + WORM + cachet), puis persister l'état scellé.
  const agg = await depot.charger(enveloppeId);
  const scell = await scellerEnveloppe(
    {
      enveloppeId,
      statutActuel: agg!.enveloppe.statut,
      document,
      empreinteOrigine: agg!.enveloppe.documentHashOrigine ?? "",
      signataires: agg!.signataires.map((s) => ({
        nomDeclare: s.nomDeclare,
        niveau: s.niveauIdentiteExige,
        horodatageSignature: s.dateSignature ?? "",
      })),
      journal: agg!.journal,
      acteur: "systeme",
    },
    {
      chiffreur: new ChiffreurLocalDev(),
      stockage: new StockageLocalDev(),
      sceau: new SceauServeurLocalDev(),
      horloge,
    },
  );
  agg!.enveloppe.statut = "scellee";
  agg!.enveloppe.dateScellement = horloge.maintenant().toISOString();
  await depot.enregistrer(agg!);

  // 6. Recharger depuis la base et vérifier l'état final.
  const final = await depot.charger(enveloppeId);
  const typesJournal = final!.journal.lister().map((e) => e.type).join(",");
  const ok =
    final !== null &&
    final.enveloppe.statut === "scellee" &&
    final.enveloppe.createurId === createurId &&
    typesJournal === "creee,envoyee,otp_valide,signee,scellee" &&
    scell.dossierPreuve.cachet.signature.length > 0;

  console.log(
    ok
      ? "✅ Boucle complète prouvée sur Postgres (inscrire → créer → envoyer → signer → sceller)."
      : `❌ Boucle incohérente (statut=${final?.enveloppe.statut}, journal=${typesJournal}).`,
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
