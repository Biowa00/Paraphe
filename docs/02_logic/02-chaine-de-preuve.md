# 02.02 · Chaîne de preuve

> **À quoi sert ce fichier.** Décrire ce qui rend une signature Paraphe opposable : les trois couches, le dossier de preuve, le scellement par cachet serveur, l'ancrage public.
> **Quand le lire.** Avant de spécifier le dossier de preuve, la page de vérification publique, ou le format de scellement.
> **Dépend de.** `01-machine-etats-enveloppe.md`, `03-regles-identite.md`, `04-architecture-chiffrement.md`.

## Le pari

Paraphe produit une signature **avancée**, sans présomption légale de fiabilité. La force probante vient donc **entièrement de la qualité du dossier de preuve**. L'objectif de conception : rendre la contestation coûteuse et peu crédible.

## Les trois couches

| Couche | Question | Mécanisme |
|---|---|---|
| **Identité** | Qui a signé ? | OTP + selfie/vivacité + (renforcé) pièce + face-match + NPI haché. Détail en `03`. |
| **Intégrité** | Le document a-t-il changé ? | Empreinte **SHA-256** figée au moment de la signature. |
| **Temps** | Quand ? | Horodatage sur source de temps fiable et traçable (fournisseur = décision ouverte). |

## Règle absolue sur la signature tracée (I1)

Le tracé **n'a aucune valeur probante en soi** : il rassure l'utilisateur, il ne prouve rien. En conséquence :

- Le tracé de référence n'est **jamais** rejoué depuis la base pour l'apposer sur un document.
- Le signataire **retrace à chaque document**.
- Une base de tracés réutilisables serait un instrument de contrefaçon et ferait tomber tout le dossier de preuve. Cet interdit doit être **impossible par construction**, pas seulement défendu.

## Le dossier de preuve

Produit **à chaque scellement**, sous deux formes jointes : un **PDF lisible par un humain** et un **fichier structuré** exploitable par machine. Il contient :

- Empreinte du document **d'origine** et empreinte **finale**.
- Pour **chaque signataire** : identité, niveau de vérification, méthode d'authentification, horodatage, IP, appareil.
- **Journal chronologique complet** des événements (§6).
- **Signature serveur du dossier lui-même** (cachet serveur, ci-dessous).

## Scellement et cachet serveur

À la transition `complete → scellee` :

1. L'empreinte finale de l'enveloppe est calculée.
2. Le **cachet serveur** est apposé : une **clé de scellement détenue au KMS**, auto-gérée par la plateforme, signe l'enveloppe et le dossier de preuve. Rotation périodique ; l'empreinte publique de la clé est publiée avec l'ancrage quotidien pour rester vérifiable dans le temps.
3. Le stockage bascule en **écriture unique** : aucune modification possible après scellement, y compris par l'exploitant (I3).

Ce cachet est un scellement de **plateforme**, cohérent avec le statut « avancée ». Il ne revendique pas la présomption d'une signature qualifiée. Un éventuel adossement à un certificat d'AC est une évolution possible (piste vers l'agrément à 24 mois), pas une exigence v1.

## Format cible : PAdES (LTV)

La chaîne de preuve est conçue pour s'exprimer en **PAdES**, qui traite nativement la signature multiple, l'horodatage et la **conservation longue durée (LTV)** dans un PDF. On évite de réinventer.

> **Décision ouverte** : la confirmation formelle « PAdES adopté » reste subordonnée à une évaluation technique (voir `CLAUDE.md`). D'ici là, `07`/`05` ne figent aucun format concurrent maison.

## Ancrage public

Chaque jour, une **empreinte globale de l'ensemble des archives** est publiée sur un support public et indépendant (support précis = décision ouverte). Un tiers peut ainsi vérifier qu'une archive n'a pas été réécrite après coup.

C'est ce qui transforme l'argument commercial : Paraphe **ne demande pas qu'on lui fasse confiance, elle permet qu'on la vérifie**. « Même nous ne pouvons pas modifier vos documents » devient une affirmation vérifiable, pas une promesse.

## Vérification publique

La page publique (fiche `01_features/04`) recalcule l'empreinte d'un PDF déposé et la confronte à l'archive scellée + au journal. Elle restitue intégrité, signataires, niveaux, dates, et le lien vers le dossier de preuve — **sans ouvrir le contenu** à un tiers non autorisé (I7).

## Invariants engagés

- **I1** : tracé jamais rejoué.
- **I3** : écriture unique après scellement.
- **I6** : journal en ajout seul, inclus intégralement au dossier de preuve.
