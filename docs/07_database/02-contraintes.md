# 07.02 · Contraintes d'intégrité

> **À quoi sert ce fichier.** Définir les contraintes qui font tenir les invariants **en base**, indépendamment de l'application : ajout seul (I6), immuabilité du scellé (I3), cohérence des états.
> **Quand la lire.** Avant d'écrire une migration ou un trigger, à la revue de sécurité.
> **Dépend de.** `01-schema.md`, `02_logic/01` (transitions), `03-politiques-acces.md`.

Principe directeur : **une garantie de preuve ne repose jamais sur la seule discipline applicative.** Ce qui doit être impossible est rendu impossible au niveau des privilèges et des contraintes, pas seulement du code.

## Ajout seul — `evenement` et `document_stocke` (I6, I3)

- **Aucun rôle** ne dispose du privilège `UPDATE` ni `DELETE` sur `evenement` et `document_stocke`. Le privilège est **révoqué**, pas seulement non utilisé.
- Un **trigger** `BEFORE UPDATE OR DELETE` lève une exception inconditionnelle sur ces tables (défense en profondeur, même si un privilège était accordé par erreur).
- Le journal est **répliqué en continu** vers un stockage hors du contrôle des administrateurs de la plateforme (I6) — mécanisme décrit en `08_environments`, mais la propriété est non négociable.

## Immuabilité de l'enveloppe scellée (I3)

- Un **trigger** `BEFORE UPDATE` sur `enveloppe` refuse toute modification lorsque `statut = scellee`. Aucune transition ne sort de `scellee`.
- Aucune ligne `enveloppe` ne peut être supprimée (pas de privilège `DELETE`). Il n'existe pas d'opération de suppression d'enveloppe, à aucun niveau.
- Le seul changement admis après scellement concerne `enveloppe_cle.statut` (`active`→`detruite`) pour le crypto-shredding — jamais l'enveloppe ni le journal.

## Cohérence de la machine à états

- `statut` de `enveloppe` contraint par un **trigger de transition** qui n'autorise que les passages définis en `02_logic/01`. Toute transition non prévue est rejetée.
- `date_scellement NN` **si et seulement si** `statut = scellee` (contrainte `CHECK`).
- `signataire.date_signature NN` si et seulement si `statut = signee`.
- En mode `sequentiel`, la garde d'ordre est vérifiée à l'application de `signee` (un signataire ne signe pas avant son tour).

## Unicité et identité

- `utilisateur.npi_hash` **unique** → garantit « un seul compte par NPI » (l'unicité repose sur le caractère **déterministe** du HMAC, `02_logic/03`).
- `utilisateur.telephone` unique ; `entreprise.ifu` et `entreprise.rccm` uniques.
- `identifiant_public` unique, non nul dès le niveau vérifié.

## Intégrité référentielle

- `signataire.utilisateur_id` **nullable** (invité) ; les autres FK sont non nulles sauf `enveloppe.entreprise_id` (particulier).
- `membre_role` en cascade logique de `membre_entreprise` (un membre retiré conserve sa trace via `date_retrait`, on ne supprime pas l'historique).
- Suppression physique **proscrite** partout où une donnée a valeur de preuve ; on utilise des statuts (`suspendu`, `retrait`, `detruite`), jamais `DELETE`.

## Habilitation et rôles

- `membre_entreprise.habilitation_signature` par défaut `false` ; passer à `true` est une action d'Administrateur, journalisée.
- Le retrait (`date_retrait`) n'efface aucune signature ni aucun événement passés.

## Chiffrement — ce que la contrainte ne peut pas faire

Aucune contrainte SQL ne protège un contenu que la base ne détient pas : les documents en clair et les clés **ne sont pas dans Postgres** (`00-INDEX`). Les contraintes ci-dessus protègent l'**intégrité des métadonnées et du journal** ; la confidentialité du contenu est assurée par le chiffrement par enveloppe et le KMS (`02_logic/04`).
