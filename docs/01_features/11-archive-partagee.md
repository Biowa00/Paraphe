# 11 · Archive partagée et recherche — V2

> **À quoi sert cette fiche.** Décrire l'archive commune d'une entreprise et la recherche associée.
> **Quand la lire.** Pour toute évolution de l'archive entreprise, des droits de consultation ou de la recherche.
> **Dépend de.** `01_features/05` (archive personnelle), `03_rbac` (cloisonnement, rôle Lecteur), `07_database`.

## Objectif

Donner à une entreprise une archive commune de ses enveloppes, consultable selon les rôles, avec une recherche efficace. C'est le prolongement entreprise de l'archive personnelle (fiche `05`).

## Acteurs

- **Membres de l'entreprise** selon leur rôle : de l'Administrateur au **Lecteur** (consulte sans agir).

## Préconditions

- Compte entreprise vérifié.
- Rôle donnant accès à l'archive.

## Parcours

1. **Vue partagée** des enveloppes de l'entreprise, filtrable par statut, date, contrepartie, émetteur.
2. **Recherche** sur les métadonnées (titre, signataires, dates, statut).
3. **Ouverture / téléchargement** d'une enveloppe et de son dossier de preuve, selon les droits.

## Règles et invariants engagés

- **Cloisonnement par entreprise** : une entreprise ne voit jamais l'archive d'une autre (exigence de sécurité du cahier, détaillée en `03_rbac`/`07_database`).
- Un **Lecteur** consulte sans jamais agir sur une enveloppe.
- La recherche porte sur des **métadonnées**, pas sur le contenu chiffré des documents : la recherche plein texte du contenu relève de l'OCR **V3** et n'est pas un objectif V2.
- Les enveloppes scellées restent **inaltérables** (I3), quel que soit le rôle qui les consulte.

## Cas limites et échecs

- **Membre retiré** → perd l'accès à l'archive partagée, sans effacer la trace de ses actions.
- **Gros volume** → pagination et index sur les métadonnées.
- **Enveloppe crypto-shreddée** → apparaît avec son statut et ses métadonnées ; le contenu n'est plus lisible.

## Hors périmètre

La **recherche plein texte du contenu** (OCR) est V3. La **matrice précise** des droits de consultation est en `03_rbac`. L'**export comptable** est la fiche `12`.
