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
