# 04.03 · Conventions transverses

> **À quoi sert ce fichier.** Les règles de code qui protègent les invariants : erreurs, secrets, journalisation, tests, idempotence.
> **Quand la lire.** À toute écriture de code et à la revue.
> **Dépend de.** `05_api_contracts/01` (erreurs, idempotence), `02_logic`, `03_rbac`.

## Erreurs

- Format unique (`05_api_contracts/01`) : `{ erreur: { code, message, details } }`. `code` stable et testable.
- Une erreur ne **divulgue jamais** une donnée sensible (existence d'une ressource hors périmètre, indice sur un contenu).
- On échoue **explicitement**, jamais en silence : un envoi qui ne part pas, un OTP non reçu, un paiement interrompu remontent un état clair.

## Secrets

- **Aucun secret dans le code** ni dans le dépôt : clés, pepper, jetons fournisseurs vivent en variables d'environnement / KMS (`08_environments`).
- **Aucune clé ni secret côté `client/`** (`02-arborescence`).
- Les images de pièces, le NPI en clair, les codes OTP ne sont **jamais** écrits sur disque applicatif ni dans un log.

## Journalisation

- Deux journaux distincts, à ne pas confondre :
  - Le **journal d'événements de preuve** (`evenement`, I6) : en ajout seul, répliqué hors contrôle admin. C'est de la donnée, pas du log technique.
  - Les **logs techniques** (débogage, performance) : jamais de contenu de document, jamais de secret, jamais de NPI. Purge selon rétention.
- Toute action d'un rôle interne est tracée (`03_rbac/02`).

## Idempotence et effets

- Les opérations à effet (envoi, signature, paiement, scellement) sont **idempotentes** via `Idempotency-Key` : pas de double débit, pas de double signature.
- Les effets externes (SMS, débit) passent par des adaptateurs qui gèrent le rejeu.

## Tests — priorité aux invariants

- Les **invariants I1–I8 sont couverts par des tests** qui échouent si l'invariant est violé. Exemples minimaux :
  - signer sans OTP frais → refusé (I2) ;
  - un tracé de référence ne peut pas être réapposé (I1) ;
  - `UPDATE`/`DELETE` sur `evenement` ou enveloppe scellée → impossible (I3, I6) ;
  - un rôle interne ne peut pas lire un contenu (I7).
- Le domaine (machine à états, règles d'identité) est testé **unitairement**, sans base ni réseau.

## Migrations et données

- Toute table naît avec ses **politiques RLS** et la révocation des privilèges d'écriture là où l'ajout seul s'applique (`07_database/04`). Pas de table livrée « nue ».

## Revue

- Une revue vérifie d'abord : **quel invariant ce code touche-t-il, et le préserve-t-il ?** Le style vient après.
