import type { ModeEnveloppe, NiveauIdentite, StatutEnveloppe } from "@paraphe/partage";
import type { JournalAjoutSeul } from "./journal";

export type StatutSignataire = "en_attente" | "ouverte" | "signee" | "refusee";

export interface Enveloppe {
  id: string;
  createurId: string;
  entrepriseId: string | null;
  titre: string;
  mode: ModeEnveloppe;
  statut: StatutEnveloppe;
  /** Figée à l'envoi (couche intégrité) ; nulle tant que brouillon. */
  documentHashOrigine: string | null;
  dateCreation: string;
  dateExpiration: string | null;
  dateScellement: string | null;
}

export interface Signataire {
  id: string;
  enveloppeId: string;
  utilisateurId: string | null;
  telephone: string;
  nomDeclare: string;
  ordre: number;
  niveauIdentiteExige: NiveauIdentite;
  statut: StatutSignataire;
  dateSignature: string | null;
}

/** Agrégat manipulé par les cas d'usage : l'enveloppe, ses signataires, son journal. */
export interface EnveloppeAgg {
  enveloppe: Enveloppe;
  signataires: Signataire[];
  journal: JournalAjoutSeul;
}
