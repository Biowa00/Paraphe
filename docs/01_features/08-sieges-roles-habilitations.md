# 08 · Sièges, rôles et habilitations — V2

> **À quoi sert cette fiche.** Décrire comment un Administrateur d'entreprise gère les sièges nominatifs, attribue les rôles et confère l'habilitation à signer au nom de la société.
> **Quand la lire.** Pour toute évolution de la gestion des membres, des rôles ou de l'habilitation de signature.
> **Dépend de.** `03_rbac` (définition et matrice des rôles — **source de vérité**), `01_features/07`.

## Objectif

Donner à une entreprise un contrôle nominatif sur qui agit en son nom, avec une séparation nette des droits. Cette fiche décrit le **parcours** ; la définition des rôles et la matrice de permissions vivent en `03_rbac` et ne sont pas dupliquées ici.

## Acteur

- **Administrateur** de l'entreprise. Lui seul gère sièges, rôles et facturation.

## Préconditions

- Compte entreprise vérifié (fiche `07`).
- Les membres à ajouter sont, ou deviennent, des comptes vérifiés.

## Parcours

1. **Invitation d'un membre** par numéro/identifiant → le membre rejoint un **siège nominatif**.
2. **Attribution d'un rôle** parmi ceux définis en `03_rbac` : Administrateur, Émetteur, Validateur, Signataire habilité, Lecteur.
3. **Habilitation de signature** — pour un Signataire habilité, l'Administrateur confère explicitement le droit d'**engager la société**. L'habilitation est **tracée** (date d'ajout, date de retrait).
4. **Retrait** d'un membre ou d'une habilitation → le siège se libère, l'événement est journalisé.

## Règles et invariants engagés

- L'habilitation à engager la société est **explicite et tracée**, jamais implicite (cohérent avec I7 : aucun droit n'est présumé).
- Un membre habilité qui signe le fait toujours avec **OTP frais** et **retracé** (I1, I2) — l'habilitation ne dispense d'aucune preuve.
- Le retrait d'une habilitation n'altère **jamais** les signatures déjà apposées : le journal reste en ajout seul (I6), les enveloppes scellées restent intactes (I3).

## Cas limites et échecs

- **Membre retiré** → perd l'accès futur, conserve la trace de ses actions passées.
- **Dernier Administrateur** → ne peut être retiré sans transfert préalable du rôle (pas d'entreprise sans admin).
- **Membre non encore vérifié** → placé en attente ; ne peut recevoir d'habilitation avant vérification.

## Hors périmètre

La **liste exacte des droits** par rôle est en `03_rbac`. Le **circuit de validation avant envoi** est la fiche `09`. La distinction avec les **rôles internes de l'exploitant** (propriétaire, support…) est un tout autre sujet, traité en `03_rbac`.
