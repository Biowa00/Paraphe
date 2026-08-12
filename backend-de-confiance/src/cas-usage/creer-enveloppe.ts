import type { ModeEnveloppe, NiveauIdentite } from "@paraphe/partage";
import { JournalAjoutSeul } from "../domaine/journal";
import type { Enveloppe, EnveloppeAgg, Signataire } from "../domaine/modele";
import type { DepotEnveloppes, Horloge } from "../domaine/ports";

export interface SignataireACreer {
  nomDeclare: string;
  telephone: string;
  ordre: number;
  niveauIdentiteExige: NiveauIdentite;
  utilisateurId?: string | null;
}

export interface DemandeCreation {
  createurId: string;
  entrepriseId?: string | null;
  titre: string;
  mode: ModeEnveloppe;
  dateExpiration?: string | null;
  signataires: SignataireACreer[];
}

export interface DependancesCreation {
  depot: DepotEnveloppes;
  horloge: Horloge;
  genererId: () => string;
}

export interface ResultatCreation {
  enveloppeId: string;
}

/**
 * Crée une enveloppe en brouillon, avec ses signataires (statut « en_attente »),
 * et journalise l'événement `creee`. L'envoi (fige l'empreinte) est un pas
 * distinct : cf. `envoyerEnveloppe`.
 */
export async function creerEnveloppe(
  demande: DemandeCreation,
  deps: DependancesCreation,
): Promise<ResultatCreation> {
  const enveloppeId = deps.genererId();
  const dateCreation = deps.horloge.maintenant().toISOString();

  const enveloppe: Enveloppe = {
    id: enveloppeId,
    createurId: demande.createurId,
    entrepriseId: demande.entrepriseId ?? null,
    titre: demande.titre,
    mode: demande.mode,
    statut: "brouillon",
    documentHashOrigine: null,
    dateCreation,
    dateExpiration: demande.dateExpiration ?? null,
    dateScellement: null,
  };

  const signataires: Signataire[] = demande.signataires.map((s) => ({
    id: deps.genererId(),
    enveloppeId,
    utilisateurId: s.utilisateurId ?? null,
    telephone: s.telephone,
    nomDeclare: s.nomDeclare,
    ordre: s.ordre,
    niveauIdentiteExige: s.niveauIdentiteExige,
    statut: "en_attente",
    dateSignature: null,
  }));

  const journal = new JournalAjoutSeul();
  journal.ajouter({
    enveloppeId,
    type: "creee",
    acteur: demande.createurId,
    horodatage: deps.horloge.maintenant(),
  });

  const agg: EnveloppeAgg = { enveloppe, signataires, journal };
  await deps.depot.creer(agg);

  return { enveloppeId };
}
