# 04.02 · Arborescence applicative

> **À quoi sert ce fichier.** Fixer le découpage macro du code, indépendamment du framework, autour de la frontière de confiance.
> **Quand la lire.** Avant de poser la structure du dépôt applicatif.
> **Dépend de.** `05_api_contracts/00` (frontière backend/client), `02_logic/04` (séparation des accès).

## Trois zones, une frontière

Le découpage suit la **frontière de confiance** de `05` :

- **`backend-de-confiance/`** — porte tout le sensible : identité, OTP, signature, scellement, orchestration KMS, crédits, transitions d'enveloppe. Seule zone qui détient des accès privilégiés (base + KMS via des rôles **séparés**).
- **`client/`** — l'application mobile-first du signataire et de l'émetteur. Ne détient **aucun** secret, **aucune** clé. Peut lire en direct (PostgREST/RLS) pour le trivial.
- **`partage/`** — types, schémas de validation, codes d'erreur, constantes métier communs aux deux, **sans logique de confiance**.

> Invariant de structure : **aucune clé, aucun secret, aucun accès `service_role` ne vit dans `client/` ni dans `partage/`.** Si un besoin le réclame, la fonction appartient au backend de confiance.

## À l'intérieur du backend de confiance

Découpage en couches, du plus stable au plus volatil :

1. **domaine/** — entités et règles pures (machine à états, règles d'identité). Ne connaît ni la base, ni HTTP, ni les fournisseurs.
2. **cas-usage/** — orchestration d'un parcours (créer enveloppe, signer, sceller). Applique les règles du domaine, coordonne les adaptateurs.
3. **adaptateurs/** — base, KMS, stockage objet, fournisseurs externes (OTP, OCR, Mobile Money, horodatage). Un adaptateur par fournisseur, **remplaçable** (les plans B de `06` en dépendent).
4. **exposition/** — endpoints HTTP, validation d'entrée, mapping d'erreurs.

Le sens des dépendances va **vers le domaine** : le domaine ne dépend de rien ; l'exposition dépend de tout. Un changement de fournisseur (adaptateur) ne touche ni le domaine ni les cas d'usage.

## Pourquoi ce découpage

- Les **fournisseurs sont des candidats non tranchés** (`06`) : les isoler en adaptateurs permet d'en changer sans réécrire la logique.
- Les **invariants vivent dans le domaine** : centralisés, testables unitairement, hors d'atteinte d'un changement d'infra.
- La **frontière de confiance** est lisible dans l'arborescence elle-même, pas seulement dans la doc.
