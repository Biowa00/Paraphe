import process from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import { DepotUtilisateursSurClient } from "../adaptateurs/depot-utilisateurs-postgres";
import {
  soldeDb,
  creerPaiementDb,
  paiementParReferenceDb,
  confirmerPaiementDb,
} from "../adaptateurs/depot-credits-postgres";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { OcrPieceLocalDev, referencePieceDev } from "../adaptateurs/ocr-piece-local-dev";
import { BiometrieLocalDev, referenceSelfieDev } from "../adaptateurs/biometrie-local-dev";
import { HorlogeSysteme } from "../adaptateurs/horloge-systeme";
import { inscrireCompteVerifie } from "../cas-usage/inscrire-compte-verifie";
import type { Paiement } from "../domaine/credits";

// Prouve S5 contre la VRAIE base, dans une transaction ANNULÉE (rollback) :
//   inscription (3 crédits de bienvenue) → achat pack 10 → webhook succès → solde 13
//   → double webhook → toujours 13 (idempotence). Zéro déchet.

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

try {
  await client.query("begin");

  // 1. Inscrire un titulaire vérifié → 3 crédits de bienvenue.
  const insc = await inscrireCompteVerifie(
    {
      telephone: `+229${randomInt(0, 1e8)}`,
      otpTicket: otp.emettreTicket("inscription"),
      refPiece: referencePieceDev({ npi: `${randomInt(1e12, 9e12)}`, nom: "DOSSOU", prenoms: "Awa" }),
      refSelfie: referenceSelfieDev({ vivaciteOk: true, score: 0.96 }),
    },
    {
      depot: new DepotUtilisateursSurClient(client),
      otp,
      ocr: new OcrPieceLocalDev(),
      biometrie: new BiometrieLocalDev(),
      hacheurNpi: new HacheurNpiLocalDev("pepper-verif-credits"),
      horloge: new HorlogeSysteme(),
      genererId: () => randomUUID(),
      alea: () => randomInt(0, 2 ** 31),
    },
  );
  const id = insc.utilisateurId;
  const soldeInitial = (await soldeDb(client, "utilisateur", id)).solde;

  // 2. Achat d'un pack de 10, en attente.
  const reference = `MM-${randomUUID()}`;
  const paiement: Paiement = {
    id: randomUUID(),
    titulaireType: "utilisateur",
    titulaireId: id,
    packId: "decouverte",
    quantite: 10,
    montant: 5000,
    devise: "XOF",
    referenceExterne: reference,
    statut: "en_attente",
  };
  await creerPaiementDb(client, paiement);
  const soldeAvantConfirmation = (await soldeDb(client, "utilisateur", id)).solde;

  // 3. Webhook succès → +10, puis double webhook → aucun effet.
  const w1 = await confirmerPaiementDb(client, reference, true);
  const w2 = await confirmerPaiementDb(client, reference, true);
  const soldeFinal = (await soldeDb(client, "utilisateur", id)).solde;

  const p = await paiementParReferenceDb(client, reference);

  const ok =
    soldeInitial === 3 &&
    soldeAvantConfirmation === 3 && // en attente : rien crédité
    w1.credite === true &&
    w2.credite === false && // idempotence
    soldeFinal === 13 &&
    p?.statut === "confirme";

  console.log(
    ok
      ? "✅ Crédits prouvés sur Postgres (bienvenue=3 → achat 10 → solde 13 ; double webhook sans double crédit)."
      : `❌ Incohérent (init=${soldeInitial}, attente=${soldeAvantConfirmation}, final=${soldeFinal}, w2=${w2.credite}).`,
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
