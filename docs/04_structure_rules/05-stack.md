# 04.05 · Stack technique (décision n°1 — résolue)

> **À quoi sert ce fichier.** Figer les briques concrètes retenues, cohérentes avec I1–I8 et portables (relocalisables pour la localisation Bénin). Complète les conventions stack-agnostiques de `01`→`04`.
> **Quand la lire.** Avant de scaffolder, d'ajouter une dépendance, de choisir un outil.
> **Dépend de.** `02_logic/04` (chiffrement, séparation), `04_structure_rules/02` (arborescence), `07_database` (RLS), `08_environments`.

## Direction retenue

**TypeScript full-stack, portable.** On s'appuie sur l'existant (Postgres) mais avec des briques **relocalisables** vers une région conforme Bénin si nécessaire. Aucun verrouillage sur un fournisseur non déplaçable.

## Briques

| Zone | Choix | Pourquoi |
|---|---|---|
| Langage | **TypeScript** partout, mode strict | Un seul langage client/serveur/partagé |
| Monorepo | **npm workspaces** (`client`, `backend-de-confiance`, `partage`) | Zéro outillage supplémentaire, portable |
| Client | **Vite + React**, mobile d'abord, PWA-ready | Pages légères (3G), pas de couplage serveur |
| Backend de confiance | **Node + Fastify + TS**, en couches (`02-arborescence`) | Léger, découplé du front, porte le sensible |
| Partagé | **types + schémas Zod + codes d'erreur** | Contrats communs, **sans logique de confiance** |
| Base | **Postgres** (Supabase pour démarrer, accès Postgres standard) | RLS natif, relocalisable |
| Migrations | **SQL-first** (runner léger) | Contrôle total sur RLS + triggers (`07_database/02`) ; un ORM les combattrait |
| Stockage documents | **objet chiffré, S3-compatible, verrouillage d'objet (WORM)** | Écriture unique (I3), portable |
| Clés | **KMS séparé**, derrière un adaptateur | Séparation base/clés (I7), remplaçable |
| Tests | **Vitest** + tests d'invariants | TS natif, rapide |
| Qualité | **ESLint + Prettier + TS strict** | Cohérence |

## Règles non négociables héritées

- **`client/` ne détient aucun secret ni clé.** Le `service_role` n'y est jamais présent (`07_database/03`, I7).
- Le **backend de confiance** est la seule zone à détenir accès base **et** orchestration KMS, via des rôles **séparés**.
- Les fournisseurs (KMS, stockage, OTP, OCR, Mobile Money, horodatage) sont derrière des **adaptateurs** remplaçables (`06_services_catalog`, `04_structure_rules/02`).
- Tout choix reste **portable** : rien qui empêche de déménager vers une région conforme Bénin (`08_environments/03`).

## Sous-choix ajustables

Les briques ci-dessus sont des **défauts raisonnables**, pas des dogmes. Framework backend (Fastify), runner de migrations, fournisseur KMS/stockage concret peuvent être ajustés tant que les règles non négociables tiennent. Un changement se note ici et dans `CLAUDE.md`.
