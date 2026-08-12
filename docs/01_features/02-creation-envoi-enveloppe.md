# 02 · Création et envoi d'une enveloppe — V1

> **À quoi sert cette fiche.** Décrire comment un émetteur constitue une enveloppe, y place ses signataires et l'envoie.
> **Quand la lire.** Pour toute évolution de l'éditeur d'enveloppe, du placement des zones, du choix du mode ou des notifications d'envoi.
> **Dépend de.** `02_logic` (machine à états de l'enveloppe, niveaux d'identité), `06_services_catalog` (WhatsApp/SMS, conversion PDF), `05_api_contracts`.

## Objectif

Permettre à un émetteur de transformer un document en enveloppe prête à signer, en quelques écrans, sur mobile. La **friction est payée ici**, par l'émetteur — jamais reportée sur le signataire.

## Acteurs

- **Émetteur** : compte vérifié (particulier) ou, en V2, membre habilité d'une entreprise avec le rôle Émetteur.
- Consomme un **crédit** à l'envoi (règle de facturation précisée en `06`/`10_econo` du cahier).

## Préconditions

- Compte au moins **vérifié** (niveau 2). Un invité ne crée pas d'enveloppe.
- Crédits suffisants, ou crédits de bienvenue disponibles.

## Parcours

1. **Dépôt du document** — PDF, ou Word converti en PDF **côté serveur** avant chiffrement.
2. **Ajout des signataires** — pour chacun : nom, numéro de téléphone, rôle, et **niveau d'identité exigé** (OTP seul / Standard / Renforcé, cf. glossaire).
3. **Choix du mode** — **séquentiel** (l'un après l'autre, dans l'ordre) ou **parallèle** (tous en même temps).
4. **Placement des zones de signature** par glisser-déposer sur le document.
5. **Envoi** — notification **WhatsApp/SMS** à chaque signataire concerné (au premier seulement si séquentiel).

## Règles et invariants engagés

- À l'envoi, l'empreinte **SHA-256 du document d'origine** est figée (`document_hash_origine`) et l'événement `envoyee` est journalisé (I6).
- Le document est **chiffré par enveloppe** dès l'ingestion ; la fenêtre de conversion Word→PDF est le seul instant où le contenu transite en clair côté serveur, avant chiffrement. Après, plus aucun accès en lecture par l'exploitant (I7).
- Une entreprise (V2) peut désigner **n'importe quel destinataire**, membre ou non ; les externes signeront en invités.

## Cas limites et échecs

- **Crédits insuffisants** → l'enveloppe reste en `brouillon`, invitation à recharger (parcours `06`).
- **Numéro invalide / non joignable** → signalé avant envoi ; e-mail en canal de secours.
- **Document trop lourd / format non supporté** → refus à l'ingestion avec message ; pas de silence.
- **Date d'expiration** posée à la création ; à échéance sans signature complète → état `expiree`.

## Hors périmètre

Le cycle de vie complet (`brouillon → envoyee → partiellement_signee → complete → scellee`, plus `expiree`/`refusee`) est décrit en `02_logic`. Les **modèles réutilisables** sont un parcours V2 distinct (`10`). Le **circuit de validation avant envoi** est V2 (`09`).
