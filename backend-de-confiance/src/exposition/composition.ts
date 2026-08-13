import process from "node:process";
import { randomUUID, randomInt } from "node:crypto";
import { Pool } from "pg";
import { DepotEnveloppesMemoire } from "../adaptateurs/depot-enveloppes-memoire";
import { DepotUtilisateursMemoire } from "../adaptateurs/depot-utilisateurs-memoire";
import { DepotEnveloppesPostgres } from "../adaptateurs/depot-enveloppes-postgres";
import { DepotUtilisateursPostgres } from "../adaptateurs/depot-utilisateurs-postgres";
import { DepotVerificationPostgres } from "../adaptateurs/depot-verification-postgres";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { ChiffreurLocalDev } from "../adaptateurs/chiffreur-local-dev";
import { StockageLocalDev } from "../adaptateurs/stockage-local-dev";
import { SceauServeurLocalDev } from "../adaptateurs/sceau-serveur-local-dev";
import { HorlogeSysteme } from "../adaptateurs/horloge-systeme";
import { HacheurNpiLocalDev } from "../adaptateurs/hacheur-npi-local-dev";
import { OcrPieceLocalDev } from "../adaptateurs/ocr-piece-local-dev";
import { BiometrieLocalDev } from "../adaptateurs/biometrie-local-dev";
import type {
  DepotEnveloppes,
  DepotUtilisateurs,
  DepotVerification,
} from "../domaine/ports";

/**
 * Racine de composition : assemble les adaptateurs concrets et les fournit aux
 * routes. En dev, tout est en mémoire. En production, on remplace ces
 * adaptateurs (KMS, Postgres, stockage S3…) ici, et NULLE PART AILLEURS.
 */
export interface Composition {
  depot: DepotEnveloppes;
  depotUtilisateurs: DepotUtilisateurs;
  depotVerification: DepotVerification;
  otp: GuichetOtpLocalDev;
  chiffreur: ChiffreurLocalDev;
  stockage: StockageLocalDev;
  sceau: SceauServeurLocalDev;
  hacheurNpi: HacheurNpiLocalDev;
  ocr: OcrPieceLocalDev;
  biometrie: BiometrieLocalDev;
  horloge: HorlogeSysteme;
  genererId: () => string;
  /** Source d'aléa pour l'identifiant public. */
  alea: () => number;
  /** DEV : tampon des documents en clair entre l'envoi et le scellement. */
  bufferDocuments: Map<string, Buffer>;
}

/** Services et fabriques communs à toutes les compositions (dev en v1). */
function servicesCommuns() {
  return {
    otp: new GuichetOtpLocalDev(),
    chiffreur: new ChiffreurLocalDev(),
    stockage: new StockageLocalDev(),
    sceau: new SceauServeurLocalDev(),
    hacheurNpi: new HacheurNpiLocalDev(),
    ocr: new OcrPieceLocalDev(),
    biometrie: new BiometrieLocalDev(),
    horloge: new HorlogeSysteme(),
    genererId: () => randomUUID(),
    alea: () => randomInt(0, 2 ** 31),
    bufferDocuments: new Map<string, Buffer>(),
  };
}

/** Composition DEV : tout en mémoire, aucune dépendance externe. */
export function compositionDev(): Composition {
  // Une seule instance mémoire sert le dépôt d'écriture ET la vérification :
  // la page publique voit les enveloppes réellement scellées par le serveur.
  const enveloppes = new DepotEnveloppesMemoire();
  return {
    depot: enveloppes,
    depotVerification: enveloppes,
    depotUtilisateurs: new DepotUtilisateursMemoire(),
    ...servicesCommuns(),
  };
}

/**
 * Composition PERSISTANTE : la boucle enveloppe et les comptes vivent en
 * Postgres (Supabase). Les autres services restent des adaptateurs dev tant que
 * les fournisseurs réels ne sont pas tranchés (KMS, stockage objet, OTP, OCR…).
 * On construit ici, et NULLE PART AILLEURS.
 */
export function compositionPostgres(pool?: Pool): Composition {
  const url = process.env.DATABASE_URL;
  if (!pool && !url) {
    throw new Error("DATABASE_URL manquant : composition Postgres impossible.");
  }
  const p =
    pool ?? new Pool({ connectionString: url, ssl: { rejectUnauthorized: false } });
  return {
    depot: new DepotEnveloppesPostgres(p),
    depotUtilisateurs: new DepotUtilisateursPostgres(p),
    depotVerification: new DepotVerificationPostgres(p),
    ...servicesCommuns(),
  };
}
