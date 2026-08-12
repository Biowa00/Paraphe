import type { Horloge } from "../domaine/ports";

export class HorlogeSysteme implements Horloge {
  maintenant(): Date {
    return new Date();
  }
}
