# 06 · Achat de crédits en Mobile Money — V1

> **À quoi sert cette fiche.** Décrire comment un particulier ou une PME recharge son solde de crédits pour émettre des enveloppes.
> **Quand la lire.** Pour toute évolution de l'achat de crédits, de l'intégration Mobile Money ou de la consommation.
> **Dépend de.** `06_services_catalog` (Mobile Money), `02_logic` (règle de consommation), `10_econo` du cahier (modèle éco).

## Objectif

Permettre de payer **à l'usage**, sans abonnement, en Mobile Money — le moyen de paiement réel des PME béninoises. **Pas d'abonnement en entrée de gamme** : une PME n'engage pas de coût récurrent pour un besoin intermittent.

## Acteurs

- **Particulier vérifié** ou **PME** (packs prépayés).
- Le **signataire destinataire ne paie jamais** (I8) — il n'accède pas à ce parcours.

## Préconditions

- Compte au moins vérifié.
- Un compte Mobile Money.

## Parcours

1. **Choix d'un pack** de crédits (unités ou packs prépayés).
2. **Paiement Mobile Money** → confirmation → solde crédité.
3. **Consommation** : un crédit est débité à l'envoi d'une enveloppe (règle exacte en `02_logic`).

## Règles et invariants engagés

- **3 crédits de bienvenue** offerts à l'inscription d'un particulier, **non renouvelables** et **sans expiration**. Ils ne créent pas d'échéance artificielle.
- La gratuité du destinataire est absolue et **jamais** limitée dans le temps ou en volume (I8).
- L'offre particulier est une **amorce**, pas un palier permanent : pas de franchise mensuelle reconduite.

## Cas limites et échecs

- **Paiement échoué / interrompu** → aucun crédit débité, solde inchangé, message clair.
- **Double débit opérateur** → réconciliation ; le crédit ne doit être compté qu'une fois.
- **Solde nul au moment d'émettre** → l'enveloppe reste en brouillon (voir fiche `02`).

## Hors périmètre

Le **prix unitaire du crédit** est une décision ouverte (dépend des entretiens PME). La **facturation centralisée entreprise** (abonnement par siège, export comptable) est un parcours V2 distinct (`12`). Le choix du **fournisseur Mobile Money** vit en `06_services_catalog`.
