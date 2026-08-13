import type { NiveauIdentite, StatutEnveloppe } from "@paraphe/partage";
import { empreinteSha256 } from "../domaine/empreinte";
import type { DepotVerification, EnveloppeVerifiable } from "../domaine/ports";

export interface DemandeVerification {
  /** Document déposé (base64 en dev ; multipart en prod). Optionnel. */
  documentBase64?: string;
  /** Identifiant d'enveloppe lu sur le cachet. Optionnel. */
  enveloppeRef?: string;
}

export interface DependancesVerification {
  depot: DepotVerification;
}

export type RaisonNonIntegre = "modifie_apres_signature" | "aucune_correspondance";

export interface SignataireRapporte {
  nom: string;
  niveau: NiveauIdentite;
  dateSignature: string | null;
}

/**
 * Rapport public. Ne contient QUE ce qui sert à la preuve : intégrité,
 * signataires, niveaux, dates. Jamais le contenu ni le titre (I7).
 * `integre` vaut `null` quand aucun document n'est fourni (référence seule) :
 * on montre le dossier scellé sans pouvoir confronter un fichier.
 */
export interface RapportVerification {
  integre: boolean | null;
  raison?: RaisonNonIntegre;
  statut?: StatutEnveloppe;
  enveloppeRef?: string;
  dateScellement?: string | null;
  /** Présent uniquement si la clé a été détruite (contenu illisible). */
  contenu?: "efface";
  signataires?: SignataireRapporte[];
}

const AUCUNE_CORRESPONDANCE: RapportVerification = {
  integre: false,
  raison: "aucune_correspondance",
};

function rapporter(env: EnveloppeVerifiable, integre: boolean | null): RapportVerification {
  return {
    integre,
    statut: env.statut,
    enveloppeRef: env.id,
    dateScellement: env.dateScellement,
    ...(env.cleDetruite ? { contenu: "efface" as const } : {}),
    signataires: env.signataires.map((s) => ({
      nom: s.nomDeclare,
      niveau: s.niveau,
      dateSignature: s.dateSignature,
    })),
  };
}

/**
 * Vérification publique (01_features/04, 02_logic/02). Recalcule l'empreinte du
 * document déposé et la confronte à l'archive **scellée**. Ne divulgue jamais le
 * contenu (I7) ; sur document inconnu ou brouillon, réponse neutre sans fuite.
 *
 * Périmètre de la tranche : couche **intégrité** (empreinte SHA-256 figée). La
 * re-vérification du cachet serveur et l'ancrage public quotidien viendront avec
 * la clé de scellement stable (KMS) et le support d'ancrage (décisions ouvertes).
 */
export async function verifierDocument(
  demande: DemandeVerification,
  deps: DependancesVerification,
): Promise<RapportVerification> {
  const { documentBase64, enveloppeRef } = demande;

  if (documentBase64) {
    const empreinte = empreinteSha256(Buffer.from(documentBase64, "base64"));

    if (enveloppeRef) {
      const env = await deps.depot.parRef(enveloppeRef);
      if (!env || env.statut !== "scellee") return AUCUNE_CORRESPONDANCE;
      if (env.documentHashOrigine !== empreinte) {
        // La référence désigne bien une archive, mais ce fichier en diffère.
        return { integre: false, raison: "modifie_apres_signature" };
      }
      return rapporter(env, true);
    }

    // Sans référence : on cherche une archive scellée d'empreinte identique.
    const env = await deps.depot.parEmpreinte(empreinte);
    if (!env) return AUCUNE_CORRESPONDANCE;
    return rapporter(env, true);
  }

  // Référence seule (lue sur le cachet), sans fichier à confronter.
  if (enveloppeRef) {
    const env = await deps.depot.parRef(enveloppeRef);
    if (!env || env.statut !== "scellee") return AUCUNE_CORRESPONDANCE;
    return rapporter(env, null);
  }

  // Ni document ni référence : rejeté en amont (route). Réponse neutre par sûreté.
  return AUCUNE_CORRESPONDANCE;
}
