# 12 · Facturation centralisée — V2

> **À quoi sert cette fiche.** Décrire la facturation d'un compte entreprise : abonnement par siège, volume inclus, export comptable.
> **Quand la lire.** Pour toute évolution de la facturation entreprise, distincte de l'achat de crédits particulier.
> **Dépend de.** `01_features/06` (crédits, à ne pas confondre), `06_services_catalog` (paiement), `10_econo` du cahier.

## Objectif

Offrir aux entreprises structurées un modèle adapté à un usage régulier : **abonnement par siège + volume inclus**, facturation centralisée et export comptable. Ce parcours est distinct de l'achat de crédits à l'unité (fiche `06`), qui vise le particulier et la PME intermittente.

## Acteur

- **Administrateur** de l'entreprise. Lui seul gère la facturation.

## Préconditions

- Compte entreprise vérifié.

## Parcours

1. **Choix d'un plan** par siège, avec un **volume d'envois inclus**.
2. **Paiement** (Mobile Money et/ou autres moyens adaptés aux entreprises) → activation.
3. **Consommation centralisée** : les envois de tous les membres sont imputés au compte entreprise.
4. **Export comptable** : relevés de consommation et pièces pour la comptabilité.

## Règles et invariants engagés

- La facturation est un **rôle de gestion** (Administrateur) ; elle ne donne **aucun** accès au contenu des documents (I7).
- Le **destinataire ne paie jamais** (I8) : la facturation ne concerne que l'entreprise émettrice.
- Toute action sensible de facturation est journalisée et notifiée à l'entreprise (cohérent avec la traçabilité des actions du propriétaire, cf. `03_rbac`).

## Cas limites et échecs

- **Dépassement du volume inclus** → bascule sur crédits additionnels ou palier supérieur, selon le plan (règle éco à préciser).
- **Défaut de paiement** → suspension d'accès possible ; jamais de suppression d'enveloppe (I3), jamais de blocage d'un destinataire en cours de signature (I8).
- **Changement de plan** → tracé, sans effet rétroactif sur les enveloppes déjà scellées.

## Hors périmètre

Les **prix** et paliers exacts sont des décisions ouvertes (entretiens PME). L'**achat de crédits à l'unité** est la fiche `06`. Le détail des moyens de paiement vit en `06_services_catalog`.
