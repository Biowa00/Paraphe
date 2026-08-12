# 03.01 · Rôles utilisateurs

> **À quoi sert ce fichier.** Définir les niveaux de compte et les rôles au sein d'une entreprise cliente, avec la règle de cumul et l'habilitation à signer.
> **Quand la lire.** Avant de modéliser `membre_entreprise`, avant tout contrôle d'accès applicatif.
> **Dépend de.** `01_features/07` et `08`, cahier §4.

## Niveaux de compte

| Niveau | Qui | Ce qu'il peut faire |
|---|---|---|
| **1 — Invité** | Aucune inscription | Ouvrir un lien, vérifier son identité au niveau exigé, **signer**. Rien d'autre. Gratuit, toujours (I8). |
| **2 — Vérifié** | Particulier, identité confirmée une fois | Émettre des enveloppes, accéder à son archive personnelle, signer avec preuve **renforcée** (badge, identifiant public `BJ-XXXX-XXX`). |
| **3 — Entreprise** | Personne morale (IFU + RCCM + représentant légal) | Tout ce qui précède, via des **membres** porteurs de rôles, avec archive partagée, modèles et facturation centralisée. |

Un invité n'émet jamais. Émettre suppose au moins le niveau **vérifié**.

## Rôles au sein d'une entreprise

| Rôle | Droits |
|---|---|
| **Administrateur** | Gère les sièges, la facturation, les modèles, les rôles. |
| **Émetteur** | Crée et envoie des enveloppes. |
| **Validateur** | Approuve une enveloppe avant envoi (circuit interne optionnel, fiche `09`). |
| **Signataire habilité** | **Engage la société** — habilitation explicite et tracée. |
| **Lecteur** | Consulte l'archive partagée sans agir. |

## Règle de cumul (décision actée)

Un membre **peut porter plusieurs rôles**. Une seule garde, forte :

> **Le créateur d'une enveloppe ne peut pas en être le validateur.** La séparation des tâches porte sur **l'objet** (cette enveloppe-ci), pas sur la personne.

Ainsi une PME où Alice est à la fois Émettrice et Validatrice fonctionne ; mais l'enveloppe qu'Alice a créée doit être approuvée par **un autre** validateur. Si aucun autre validateur n'existe, l'enveloppe ne peut pas franchir un circuit de validation activé — c'est voulu.

## Habilitation à signer pour la société

- L'habilitation (`membre_entreprise.habilitation_signature`) est **explicite**, attribuée par un Administrateur, **datée** à l'ajout et au retrait.
- Elle n'est **jamais** implicite du seul fait d'appartenir à l'entreprise.
- Signer en tant qu'habilité reste soumis à **OTP frais** et **retracé** (I1, I2) : l'habilitation ne dispense d'aucune preuve.
- Le retrait d'une habilitation n'altère jamais une signature déjà apposée (I3, I6).

## Appartenance multiple

Un même utilisateur (niveau 2) peut être **membre de plusieurs entreprises** avec des rôles différents dans chacune. Les droits sont évalués **par entreprise**, jamais globalement. Le cloisonnement des données par entreprise est une exigence de sécurité (voir `07_database`).

## Envoi à des externes

Une entreprise peut adresser une enveloppe à **n'importe qui**, membre ou non (clients, fournisseurs, bailleurs, banques). Les externes signent en **invités** (niveau 1). Restreindre l'envoi aux seuls membres viderait le produit de son usage principal.
