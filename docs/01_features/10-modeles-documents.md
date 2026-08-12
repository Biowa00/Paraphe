# 10 · Modèles de documents réutilisables — V2

> **À quoi sert cette fiche.** Décrire la création et l'usage de modèles d'enveloppe réutilisables au sein d'une entreprise.
> **Quand la lire.** Pour toute évolution des modèles : zones pré-placées, champs variables, rôles types.
> **Dépend de.** `01_features/02` (création d'enveloppe), `03_rbac` (qui gère les modèles).

## Objectif

Éviter de reconstruire une enveloppe à chaque envoi récurrent (contrat de travail, bon de commande, décharge…). Un modèle capture le document type, les zones de signature et les rôles de signataires, prêts à instancier. **Réservé aux comptes entreprise.**

## Acteurs

- **Administrateur / Émetteur** : crée et maintient les modèles.
- **Émetteur** : instancie un modèle pour produire une enveloppe réelle.

## Préconditions

- Compte entreprise vérifié.

## Parcours

1. **Création d'un modèle** à partir d'un document type : placement des zones, définition des **rôles de signataires** (ex. « employeur », « employé ») et du **niveau d'identité exigé** par rôle.
2. **Champs variables** optionnels (nom, montant, date…) à renseigner à l'instanciation.
3. **Instanciation** : l'Émetteur choisit un modèle, renseigne les champs et les destinataires réels, puis envoie (rejoint le parcours de la fiche `02`).

## Règles et invariants engagés

- Un modèle est une **matrice de préparation**, pas une enveloppe : il ne porte ni signature, ni empreinte scellée.
- À l'instanciation, une **enveloppe neuve** est créée avec sa propre empreinte d'origine ; le modèle n'est jamais « signé ».
- Le niveau d'identité exigé défini dans le modèle reste **modifiable** à l'instanciation par l'Émetteur.

## Cas limites et échecs

- **Modèle modifié après coup** → n'affecte aucune enveloppe déjà émise ; seules les instanciations futures en héritent.
- **Modèle supprimé** → les enveloppes déjà créées restent intactes (elles sont autonomes).
- **Document type volumineux** → mêmes limites d'ingestion que la fiche `02`.

## Hors périmètre

Le choix des **types de documents** à livrer en priorité dépend de la question ouverte n°1 du cahier (entretiens PME) — non tranché ici. La **recherche** dans l'archive est la fiche `11`.
