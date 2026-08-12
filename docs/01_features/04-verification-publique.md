# 04 · Vérification publique d'un document — V1

> **À quoi sert cette fiche.** Décrire la page publique qui permet à quiconque de vérifier l'intégrité et les signatures d'un document, sans compte.
> **Quand la lire.** Pour toute évolution de la page de vérification, du rapport affiché ou du lien vers le dossier de preuve.
> **Dépend de.** `02_logic` (chaîne de preuve, ancrage public), `09_components` (rendu de la page et du cachet), `05_api_contracts`.

## Objectif

Offrir à un tiers — un juge, une banque, un partenaire — le moyen de vérifier lui-même qu'un document est intègre et par qui il a été signé. **C'est le principal levier commercial** : chaque document signé qui circule ramène un nouvel utilisateur vers cette page.

## Acteurs

- **N'importe qui**, sans compte, sans paiement. Gratuit par principe.

## Préconditions

- Aucune. On arrive ici par le lien du cachet apposé sur le PDF, ou par recherche.

## Parcours

1. **Dépôt d'un PDF** (ou saisie de l'identifiant d'enveloppe présent sur le cachet).
2. La plateforme recalcule l'empreinte et la confronte à l'archive scellée.
3. **Réponse affichée** :
   - Document **intègre** / document **altéré**.
   - Liste des **signataires**, avec leur **niveau d'identité** (standard / renforcé).
   - **Date et heure** de chaque signature.
   - **Lien vers le dossier de preuve complet**.

## Règles et invariants engagés

- La vérification s'appuie sur l'empreinte SHA-256 figée et sur le **journal en ajout seul** (I6).
- La réponse ne divulgue **que** ce qui est nécessaire à la vérification : identités des signataires et métadonnées de signature. Elle **n'ouvre pas le contenu** du document à un tiers non autorisé (cohérent avec I7).
- L'**ancrage public quotidien** (empreinte globale publiée sur un support indépendant) permet de prouver que l'archive elle-même n'a pas été réécrite — argument « même nous ne pouvons pas modifier vos documents » (§7.4).

## Cas limites et échecs

- **Document altéré** → réponse explicite « ce document ne correspond à aucune version scellée » ou « version modifiée après signature ».
- **Document inconnu** → aucune correspondance ; message neutre, sans fuite d'information.
- **Enveloppe dont l'accès a été suspendu ou la clé détruite (crypto-shredding)** → l'existence et l'intégrité restent vérifiables via les métadonnées et le journal, mais le contenu n'est plus lisible.

## Hors périmètre

Le **format** du dossier de preuve et le mécanisme d'**ancrage** vivent en `02_logic`. Le **rendu visuel** de la page et du cachet vit en `09_components`. Le choix du **support d'ancrage** est une décision ouverte (voir `CLAUDE.md`).
