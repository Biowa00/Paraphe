# 08.02 · Secrets

> **À quoi sert ce fichier.** Les règles de gestion des secrets, qui protègent I4 et I7.
> **Quand la lire.** Avant de manipuler une clé, un jeton fournisseur, le pepper.
> **Dépend de.** `02_logic/04` (KMS), `04_structure_rules/03` (secrets dans le code), `06_services_catalog/05`.

## Inventaire des secrets

| Secret | Où il vit | Qui y accède |
|---|---|---|
| Clés d'enveloppe | **KMS** | backend de confiance, via rôle KMS séparé |
| Pepper NPI | **KMS** | backend de confiance (hachage), jamais la base |
| Clé de scellement serveur | **KMS** | backend de confiance (scellement) |
| Jetons fournisseurs (SMS, WhatsApp, OCR, Mobile Money, horodatage) | coffre de secrets / variables d'env | backend de confiance |
| Identifiants base | coffre de secrets | backend de confiance |

## Règles

- **Aucun secret dans le dépôt** ni dans le code (`04_structure_rules/03`). Un secret commité est un secret compromis : rotation immédiate.
- **Aucun secret côté `client/`.** Le client ne détient jamais de clé ni de jeton privilégié.
- **Séparation base ≠ clés** (I7) : le détenteur des identifiants base n'a pas accès au KMS, et réciproquement. Deux coffres/rôles distincts, pas un seul.
- **Rotation** périodique des jetons fournisseurs et de la clé de scellement (empreinte publique de la nouvelle clé ancrée, `02_logic/02`).
- **Le pepper ne tourne pas comme les autres** : le changer invaliderait la comparaison d'unicité des NPI existants. Toute évolution du pepper suppose une stratégie de re-hachage explicite — à concevoir avant, jamais dans l'urgence.

## Ce qui n'est jamais un secret « comme un autre »

Les images de pièces, le NPI en clair et les codes OTP ne sont pas des secrets à stocker : ils sont **éphémères** (purgés/à usage unique). On ne les met ni en coffre, ni en log, ni sur disque applicatif.
