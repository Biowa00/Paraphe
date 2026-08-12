# 01 · Inscription vérifiée (particulier) — V1

> **À quoi sert cette fiche.** Décrire le parcours par lequel un particulier passe du statut d'invité à celui de **compte vérifié** (niveau 2).
> **Quand la lire.** Pour toute évolution du tunnel d'inscription, de l'OCR, du selfie ou de l'attribution de l'identifiant public.
> **Dépend de.** `02_logic` (règles d'identité, hash NPI), `06_services_catalog` (OCR, vivacité, OTP), `03_rbac` (ce que débloque le niveau 2).

## Objectif

Confirmer une fois l'identité d'un particulier, de façon réutilisable indéfiniment, en **4 minutes sur mobile**. C'est un investissement que l'utilisateur fait une seule fois pour obtenir la preuve **renforcée** et le droit d'émettre.

## Acteur

Un particulier disposant d'un téléphone et d'une pièce d'identité. Il peut être un ancien invité qu'on invite à convertir (§10 du cahier).

## Préconditions

- Aucune. Le parcours est ouvert à tout le monde.
- Aucun crédit requis : l'inscription est gratuite. Les 3 crédits de bienvenue sont attribués à l'issue.

## Parcours

1. **Numéro de téléphone** → envoi d'un OTP → saisie → numéro validé.
2. **Photo de la pièce d'identité** (recto/verso) → OCR extrait NPI, nom, prénoms, date de naissance → contrôles de cohérence de format et détection de falsification.
3. **Selfie animé** — un mouvement est demandé aléatoirement → détection de vivacité → **face-match** contre le portrait de la pièce → score de correspondance.
4. **Tracé de la signature de référence** → conservé comme élément de **style**, jamais comme instrument réutilisable (I1).
5. **Attribution de l'identifiant public** `BJ-XXXX-XXX` → le compte est vérifié → 3 crédits de bienvenue crédités.

## Règles et invariants engagés

- Le **NPI** extrait est immédiatement transformé en `HMAC-SHA256 + pepper` (KMS) et n'est jamais stocké en clair (I4). L'unicité du compte est vérifiée sur ce hash déterministe : un NPI déjà rattaché à un compte actif bloque la création.
- Les **images de la pièce** sont chiffrées le temps de la vérification puis **purgées** ; on ne conserve que le résultat et un identifiant de contrôle (I5).
- **Aucune donnée biométrique** conservée : le selfie sert au face-match puis est supprimé.
- Le **tracé de référence** n'est jamais rejoué sur un document (I1).

## Cas limites et échecs

- **Score de face-match intermédiaire** → bascule vers **revue manuelle sous 24 h** (opérateur de vérification), jamais un rejet sec.
- **OCR illisible / pièce non reconnue** → invitation à recommencer la prise de vue, avec conseils ; pas de rejet définitif.
- **NPI déjà utilisé** par un compte actif → refus avec message clair et voie de contestation (usurpation possible).
- **Abandon en cours** → l'état est repris là où il s'est arrêté ; le motif d'abandon alimente le tableau de bord d'exploitation (métadonnée agrégée uniquement).

## Hors périmètre

Le détail des seuils de score et des règles anti-fraude vit dans `02_logic`. Le branchement des fournisseurs OCR/vivacité/OTP vit dans `06_services_catalog`. L'accès aux services de l'ANIP est une démarche en cours, **pas une dépendance de la v1**.
