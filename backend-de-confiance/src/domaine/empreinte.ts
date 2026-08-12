import { createHash } from "node:crypto";

/**
 * Empreinte SHA-256 (couche « Intégrité » de la chaîne de preuve, cf. 02_logic/02).
 * Déterministe : la même entrée donne toujours la même empreinte ; la moindre
 * modification la change. C'est ce qui prouve « rien n'a bougé depuis ».
 */
export function empreinteSha256(donnees: Buffer | string): string {
  return createHash("sha256").update(donnees).digest("hex");
}
