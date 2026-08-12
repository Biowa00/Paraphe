# 13 · Tableau de bord et relances — V2

> **À quoi sert cette fiche.** Décrire le tableau de bord de suivi des enveloppes d'une entreprise et les relances automatiques des signataires.
> **Quand la lire.** Pour toute évolution du suivi d'activité entreprise ou des relances.
> **Dépend de.** `01_features/02` et `03` (envoi et signature), `06_services_catalog` (notifications), `02_logic` (états).

> ⚠️ Ne pas confondre avec le **tableau de bord d'exploitation du propriétaire** (métadonnées agrégées, décrit en `03_rbac`/cahier §4bis). Ici, il s'agit du suivi **par l'entreprise cliente de ses propres enveloppes**.

## Objectif

Donner à une entreprise une vue d'ensemble de ses envois en cours et relancer automatiquement les signataires qui tardent, pour réduire le délai de signature. Une signature manquée est un contrat perdu.

## Acteurs

- **Administrateur / Émetteur** : suit l'activité, configure les relances.

## Préconditions

- Compte entreprise vérifié, enveloppes émises.

## Parcours

1. **Vue d'ensemble** : enveloppes envoyées, partiellement signées, complètes, expirées, refusées ; délai moyen de signature.
2. **Détail par enveloppe** : qui a signé, qui reste, depuis quand.
3. **Relances automatiques** : rappels WhatsApp/SMS aux signataires en attente, selon une cadence configurable.
4. **Relance manuelle** ponctuelle possible.

## Règles et invariants engagés

- Les relances s'adressent au **destinataire sans jamais lui facturer quoi que ce soit** (I8).
- Le suivi porte sur des **métadonnées d'enveloppe** (statuts, dates, signataires) et n'ouvre pas le contenu.
- Chaque relance émise est journalisée (I6) et son coût (SMS) remonte au suivi d'exploitation.

## Cas limites et échecs

- **Sur-sollicitation** → plafond de relances pour ne pas harceler un destinataire (préserve l'expérience signataire).
- **Enveloppe expirée** → les relances cessent ; l'émetteur peut ré-émettre.
- **Canal indisponible** → bascule WhatsApp↔SMS, e-mail en secours.

## Hors périmètre

Le **tableau de bord d'exploitation du propriétaire** (agrégats commerciaux, file de vérifications manuelles) est un tout autre écran, décrit en `03_rbac` et §4bis du cahier. Le **détail des fournisseurs de notification** vit en `06_services_catalog`.
