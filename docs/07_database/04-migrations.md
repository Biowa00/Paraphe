# 07.04 · Principes de migration

> **À quoi sert ce fichier.** Fixer les règles d'évolution du schéma, compatibles avec l'ajout seul et l'immuabilité.
> **Quand la lire.** Avant toute migration.
> **Dépend de.** `02-contraintes.md`, `08_environments` (exécution, environnements).

## Règles

1. **Migrations en avant, versionnées, ordonnées.** Chaque migration a un numéro et un sens unique. Pas de migration « destructive » rejouée à l'envers sur des données de production.

2. **Additif par défaut.** On ajoute des colonnes/tables ; on ne réécrit pas une colonne portant de la preuve. Une colonne obsolète est marquée dépréciée, pas supprimée tant qu'elle a valeur probante.

3. **Tables en ajout seul : jamais de réécriture de données.** Faire évoluer `evenement` ou `document_stocke` se fait par nouvelles colonnes nullable ou nouvelles tables, jamais par `UPDATE` de l'historique. L'historique de preuve est intangible (I6, I3).

4. **Les privilèges se migrent aussi.** Toute nouvelle table reçoit d'emblée : révocation d'`UPDATE`/`DELETE` là où l'ajout seul s'applique, et ses politiques RLS. **Aucune table n'est livrée sans politique** — une table sans RLS explicite est un défaut, pas un défaut « à corriger plus tard ».

5. **Le contenu et les clés ne migrent pas dans Postgres.** Aucune migration n'introduit de document en clair ni de clé dans la base (invariant de conception, `00-INDEX`).

6. **Réversibilité maîtrisée.** Une migration doit pouvoir être annulée **avant** mise en production ; en production, on corrige par une migration avant, jamais par un rollback destructif sur des données scellées.

## Localisation des données

Le choix de la région d'hébergement et la conformité à d'éventuelles obligations de **localisation des données applicables au Bénin** sont une **décision ouverte** (voir `CLAUDE.md`), à trancher en `08_environments` **avant** la première migration de production. Une migration de production ne s'exécute pas tant que la région n'est pas validée.

## Sauvegarde et restauration

- Réplication sur **deux zones** ; restauration **testée trimestriellement** (exigence non fonctionnelle du cahier §9).
- Une restauration est une **opération critique** : double contrôle obligatoire (`03_rbac/02`), tracée au journal externalisé. Une restauration ne doit jamais servir à réintroduire une version antérieure d'une enveloppe scellée (ce serait contourner I3).
