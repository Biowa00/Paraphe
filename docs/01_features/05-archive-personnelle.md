# 05 · Archive personnelle — V1

> **À quoi sert cette fiche.** Décrire l'espace où un compte vérifié retrouve, consulte et télécharge ses enveloppes et leurs dossiers de preuve.
> **Quand la lire.** Pour toute évolution de la liste des enveloppes, des filtres, ou du téléchargement.
> **Dépend de.** `02_logic` (états d'enveloppe), `03_rbac` (qui voit quoi), `07_database`.

## Objectif

Donner à un particulier vérifié un endroit unique où ses documents signés vivent, à l'opposé des boîtes mail et des clés USB. L'archive **se remplit d'elle-même** avec les enveloppes signées — c'est le socle du futur produit d'archivage.

## Acteur

- **Compte vérifié** (niveau 2), pour ses propres enveloppes (créées par lui ou signées par lui).

## Préconditions

- Être connecté à un compte vérifié.

## Parcours

1. **Liste des enveloppes** avec statut lisible (brouillon, envoyée, partiellement signée, complète, scellée, expirée, refusée).
2. **Ouverture d'une enveloppe** → détail : signataires, dates, journal des événements, statut d'intégrité.
3. **Téléchargement** du document scellé et de son **dossier de preuve** (PDF joint + fichier structuré).
4. Filtres simples : par statut, par date, par contrepartie.

## Règles et invariants engagés

- Une enveloppe scellée est **consultable et téléchargeable, jamais modifiable ni supprimable** par l'utilisateur (I3).
- L'utilisateur voit **ses** enveloppes ; le cloisonnement est décrit en `03_rbac`.
- Chaque téléchargement génère un événement `telechargee` (I6).

## Cas limites et échecs

- **Enveloppe expirée ou refusée** → reste visible dans l'archive avec son statut, pour mémoire.
- **Grand volume** → pagination ; la recherche plein texte n'est **pas** un objectif V1 (elle arrive avec l'archive partagée V2, fiche `11`, et l'OCR V3).

## Hors périmètre

L'**archive partagée** entre membres d'une entreprise et la **recherche avancée** sont V2 (`11`). L'**import de documents papier existants** est V3. La suppression n'existe pas : voir crypto-shredding en `02_logic`.
