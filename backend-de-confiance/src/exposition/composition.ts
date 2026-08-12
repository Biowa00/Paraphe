import { randomUUID } from "node:crypto";
import { DepotEnveloppesMemoire } from "../adaptateurs/depot-enveloppes-memoire";
import { GuichetOtpLocalDev } from "../adaptateurs/guichet-otp-local-dev";
import { ChiffreurLocalDev } from "../adaptateurs/chiffreur-local-dev";
import { StockageLocalDev } from "../adaptateurs/stockage-local-dev";
import { SceauServeurLocalDev } from "../adaptateurs/sceau-serveur-local-dev";
import { HorlogeSysteme } from "../adaptateurs/horloge-systeme";

/**
 * Racine de composition : assemble les adaptateurs concrets et les fournit aux
 * routes. En dev, tout est en mémoire. En production, on remplace ces
 * adaptateurs (KMS, Postgres, stockage S3…) ici, et NULLE PART AILLEURS.
 */
export interface Composition {
  depot: DepotEnveloppesMemoire;
  otp: GuichetOtpLocalDev;
  chiffreur: ChiffreurLocalDev;
  stockage: StockageLocalDev;
  sceau: SceauServeurLocalDev;
  horloge: HorlogeSysteme;
  genererId: () => string;
  /** DEV : tampon des documents en clair entre l'envoi et le scellement. */
  bufferDocuments: Map<string, Buffer>;
}

export function compositionDev(): Composition {
  return {
    depot: new DepotEnveloppesMemoire(),
    otp: new GuichetOtpLocalDev(),
    chiffreur: new ChiffreurLocalDev(),
    stockage: new StockageLocalDev(),
    sceau: new SceauServeurLocalDev(),
    horloge: new HorlogeSysteme(),
    genererId: () => randomUUID(),
    bufferDocuments: new Map(),
  };
}
