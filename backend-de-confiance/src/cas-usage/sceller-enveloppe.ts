import type { StatutEnveloppe } from "@paraphe/partage";
import { empreinteSha256 } from "../domaine/empreinte";
import { transition } from "../domaine/enveloppe";
import type { JournalAjoutSeul } from "../domaine/journal";
import type { DossierPreuve, ResumeSignataire } from "../domaine/dossier-preuve";
import type {
  ChiffreurEnveloppe,
  Horloge,
  SceauServeur,
  StockageDocuments,
} from "../domaine/ports";

export interface DemandeScellement {
  enveloppeId: string;
  /** Statut courant : doit être « complete ». */
  statutActuel: StatutEnveloppe;
  document: Buffer;
  /** Empreinte figée à l'envoi (couche intégrité). */
  empreinteOrigine: string;
  signataires: ResumeSignataire[];
  journal: JournalAjoutSeul;
  acteur: string;
}

export interface DependancesScellement {
  chiffreur: ChiffreurEnveloppe;
  stockage: StockageDocuments;
  sceau: SceauServeur;
  horloge: Horloge;
}

export interface ResultatScellement {
  statut: StatutEnveloppe;
  refCle: string;
  cheminChiffre: string;
  dossierPreuve: DossierPreuve;
}

/**
 * Scelle une enveloppe complète : transition d'état (I3), chiffrement par
 * enveloppe, stockage en écriture unique (I3), journalisation (I6), puis
 * production du dossier de preuve signé par le cachet serveur (02_logic/02).
 */
export async function scellerEnveloppe(
  demande: DemandeScellement,
  deps: DependancesScellement,
): Promise<ResultatScellement> {
  // 1. complete → scellee ; lève une ErreurMetier si l'état n'est pas complete (I3).
  const statut = transition(demande.statutActuel, "sceller");

  // 2. Empreinte finale (couche intégrité).
  const empreinteFinale = empreinteSha256(demande.document);

  // 3. Chiffrement par enveloppe + stockage WORM (le clair ne persiste jamais).
  const { refCle, chiffre } = await deps.chiffreur.chiffrer(
    demande.enveloppeId,
    demande.document,
  );
  const cheminChiffre = `enveloppes/${demande.enveloppeId}/document.enc`;
  await deps.stockage.ecrire(cheminChiffre, chiffre);

  // 4. Journaliser le scellement (ajout seul, I6).
  const horodatage = deps.horloge.maintenant();
  demande.journal.ajouter({
    enveloppeId: demande.enveloppeId,
    type: "scellee",
    acteur: demande.acteur,
    horodatage,
  });

  // 5. Corps du dossier de preuve, puis cachet serveur qui le signe.
  const corps = {
    enveloppeId: demande.enveloppeId,
    empreinteOrigine: demande.empreinteOrigine,
    empreinteFinale,
    signataires: demande.signataires,
    journal: demande.journal.lister().map((e) => ({
      type: e.type,
      acteur: e.acteur,
      horodatage: e.horodatage.toISOString(),
    })),
    horodatageScellement: horodatage.toISOString(),
  };
  const cachet = await deps.sceau.sceller(Buffer.from(JSON.stringify(corps), "utf8"));

  return {
    statut,
    refCle,
    cheminChiffre,
    dossierPreuve: { ...corps, cachet },
  };
}
