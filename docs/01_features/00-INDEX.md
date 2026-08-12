# 01 · Fonctionnalités — index

> **À quoi sert ce dossier.** Une fiche par **parcours** utilisateur. Chaque fiche décrit ce que l'utilisateur vit, pas comment c'est implémenté. Le « comment » vit dans `02_logic`, `05_api_contracts`, `07_database`.
> **Quand le lire.** Avant de spécifier ou modifier une fonctionnalité. Pour retrouver quel parcours couvre quel besoin.
> **Dépend de.** `00_brief/` (cahier, glossaire). Renvoie vers `02_logic` (règles), `03_rbac` (droits), `05_api_contracts` (endpoints).

Une fiche = un parcours. Le flux est décrit du point de vue de l'acteur. Les règles transverses (chaîne de preuve, chiffrement, machine à états) ne sont **pas** répétées ici : elles sont dans `02_logic`, et les fiches y renvoient.

## Lot V1 — le produit vendable

| Fiche | Parcours |
|---|---|
| [01](01-inscription-verifiee.md) | Inscription vérifiée (particulier) |
| [02](02-creation-envoi-enveloppe.md) | Création et envoi d'une enveloppe |
| [03](03-signature-enveloppe.md) | Signature d'une enveloppe (invité et vérifié) |
| [04](04-verification-publique.md) | Vérification publique d'un document |
| [05](05-archive-personnelle.md) | Archive personnelle |
| [06](06-paiement-credits.md) | Achat de crédits en Mobile Money |

## Lot V2 — l'entreprise

| Fiche | Parcours |
|---|---|
| [07](07-compte-entreprise.md) | Création d'un compte entreprise |
| [08](08-sieges-roles-habilitations.md) | Sièges, rôles et habilitations |
| [09](09-circuit-validation.md) | Circuit de validation interne |
| [10](10-modeles-documents.md) | Modèles de documents réutilisables |
| [11](11-archive-partagee.md) | Archive partagée et recherche |
| [12](12-facturation-centralisee.md) | Facturation centralisée |
| [13](13-tableau-bord-relances.md) | Tableau de bord et relances |

## Lot V3 — pour mémoire (non détaillé ici)

Import/numérisation du papier existant · OCR + recherche plein texte · classement et durées de conservation · API d'intégration · éventuelle demande d'agrément prestataire de confiance. Fiches à rédiger le moment venu.
