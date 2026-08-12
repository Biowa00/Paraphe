import type { NiveauIdentite } from "@paraphe/partage";
import type { Sceau } from "./ports";

// Structure du dossier de preuve produit au scellement (cf. 02_logic/02).

export interface ResumeSignataire {
  nomDeclare: string;
  niveau: NiveauIdentite;
  horodatageSignature: string;
}

export interface EvenementSerialise {
  type: string;
  acteur: string;
  horodatage: string;
}

export interface DossierPreuve {
  enveloppeId: string;
  empreinteOrigine: string;
  empreinteFinale: string;
  signataires: ResumeSignataire[];
  journal: EvenementSerialise[];
  horodatageScellement: string;
  /** Signature serveur du dossier lui-même. */
  cachet: Sceau;
}
