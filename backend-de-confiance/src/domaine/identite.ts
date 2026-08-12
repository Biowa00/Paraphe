import type { NiveauIdentite } from "@paraphe/partage";

// Ordre des niveaux d'identité (cf. 02_logic/03).
const RANG: Record<NiveauIdentite, number> = {
  otp_seul: 0,
  standard: 1,
  renforce: 2,
};

/** Un niveau vérifié à l'instant satisfait-il le niveau exigé par l'émetteur ? */
export function niveauSuffisant(
  verifie: NiveauIdentite,
  exige: NiveauIdentite,
): boolean {
  return RANG[verifie] >= RANG[exige];
}
