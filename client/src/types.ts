// Miroir du contrat public de POST /v1/verification (05_api_contracts/04).
// Le client ne connaît QUE la projection publique : jamais de contenu ni de titre.

export type NiveauIdentite = "otp_seul" | "standard" | "renforce";

export interface SignataireRapporte {
  nom: string;
  niveau: NiveauIdentite;
  dateSignature: string | null;
}

export interface RapportVerification {
  integre: boolean | null;
  raison?: "modifie_apres_signature" | "aucune_correspondance";
  statut?: string;
  enveloppeRef?: string;
  dateScellement?: string | null;
  contenu?: "efface";
  signataires?: SignataireRapporte[];
}

// ─── Détail d'enveloppe (parcours signataire) ───────────────────

export type StatutSignataire = "en_attente" | "ouverte" | "signee" | "refusee";
export type StatutEnveloppe =
  | "brouillon"
  | "attente_validation"
  | "envoyee"
  | "partiellement_signee"
  | "complete"
  | "scellee"
  | "refusee"
  | "expiree";

export interface SignataireDetail {
  id: string;
  nomDeclare: string;
  statut: StatutSignataire;
  niveauIdentiteExige: NiveauIdentite;
  dateSignature: string | null;
}

export interface EnveloppeDetail {
  id: string;
  statut: StatutEnveloppe;
  mode: "sequentiel" | "parallele";
  signataires: SignataireDetail[];
}

// ─── Espace émetteur ────────────────────────────────────────────

export interface Pack {
  packId: string;
  quantite: number;
  prix: number;
  devise: string;
}

export interface Solde {
  solde: number;
  dontBienvenue: number;
}

export interface SignataireACreer {
  nomDeclare: string;
  telephone: string;
  ordre: number;
  niveauIdentiteExige: NiveauIdentite;
}

/** Un point du tracé de signature (I1 : refait à chaque signature, jamais rejoué). */
export type PointTrace = [number, number];

export interface Trace {
  horodatageCapture: string;
  traits: PointTrace[];
}
