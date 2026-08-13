import process from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import { DepotUtilisateursSurClient } from "../adaptateurs/depot-utilisateurs-postgres";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { SessionJwtLocalDev } from "../adaptateurs/session-jwt-local-dev";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { OcrPieceLocalDev, referencePieceDev } from "../adaptateurs/ocr-piece-local-dev";
import { BiometrieLocalDev, referenceSelfieDev } from "../adaptateurs/biometrie-local-dev";
import { HorlogeSysteme } from "../adaptateurs/horloge-systeme";
import { inscrireCompteVerifie } from "../cas-usage/inscrire-compte-verifie";
import { connecter } from "../cas-usage/connecter";

// Prouve la connexion contre la VRAIE base, transaction ANNULÉE :
//   inscription → connexion (téléphone + OTP) → jeton de session vérifiable,
//   sub = utilisateur inscrit. Un numéro inconnu est refusé. Zéro déchet.

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
const session = new SessionJwtLocalDev("secret-verif-connexion");

try {
  await client.query("begin");
  const depot = new DepotUtilisateursSurClient(client);
  const telephone = `+229${randomInt(0, 1e8)}`;

  const insc = await inscrireCompteVerifie(
    {
      telephone,
      otpTicket: otp.emettreTicket("inscription"),
      refPiece: referencePieceDev({ npi: `${randomInt(1e12, 9e12)}`, nom: "DOSSOU", prenoms: "Awa" }),
      refSelfie: referenceSelfieDev({ vivaciteOk: true, score: 0.96 }),
    },
    {
      depot, otp, ocr: new OcrPieceLocalDev(), biometrie: new BiometrieLocalDev(),
      hacheurNpi: new HacheurNpiLocalDev("pepper-verif-connexion"),
      horloge: new HorlogeSysteme(), genererId: () => randomUUID(),
      alea: () => randomInt(0, 2 ** 31),
    },
  );

  const cnx = await connecter({ telephone, otpTicket: otp.emettreTicket("connexion") }, { depot, otp, session });
  const charge = session.verifier(cnx.token);

  let refuseInconnu = false;
  try {
    await connecter({ telephone: "+229000000000", otpTicket: otp.emettreTicket("connexion") }, { depot, otp, session });
  } catch {
    refuseInconnu = true;
  }

  const ok =
    charge !== null &&
    charge.sub === insc.utilisateurId &&
    charge.niveau === "verifie" &&
    cnx.utilisateur.id === insc.utilisateurId &&
    refuseInconnu;

  console.log(
    ok
      ? "✅ Connexion prouvée sur Postgres (inscription → connexion → jeton vérifiable ; numéro inconnu refusé)."
      : `❌ Incohérent (sub=${charge?.sub}, refuseInconnu=${refuseInconnu}).`,
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
