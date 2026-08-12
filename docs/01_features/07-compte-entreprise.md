# 07 · Création d'un compte entreprise — V2

> **À quoi sert cette fiche.** Décrire comment une société ouvre un compte entreprise (niveau 3) et fait vérifier son existence et son représentant légal.
> **Quand la lire.** Pour toute évolution de l'onboarding entreprise, de la vérification IFU/RCCM ou de la délégation.
> **Dépend de.** `03_rbac` (rôles internes à l'entreprise), `01_features/01` (le créateur est d'abord un particulier vérifié), `06_services_catalog`.

## Objectif

Permettre à une société d'agir en tant que personne morale : émettre sous sa raison sociale, engager des signataires habilités, partager une archive et centraliser la facturation.

## Acteurs

- **Créateur** : un particulier déjà **vérifié** (niveau 2) qui déclare être le représentant légal ou détenir une délégation.
- Deviendra **Administrateur** de l'entreprise (rôle défini en `03_rbac`).

## Préconditions

- Le créateur possède un compte vérifié.
- La société dispose d'un **IFU** et d'un **RCCM**.

## Parcours

1. **Saisie des informations légales** : raison sociale, **IFU**, **RCCM**.
2. **Vérification** que le créateur est bien le **représentant légal**, ou qu'il détient une **délégation** explicite et tracée.
3. **Validation** → le compte entreprise passe en statut vérifié → le créateur devient Administrateur.
4. **Amorçage** : il peut dès lors inviter des membres et leur attribuer des rôles (fiche `08`).

## Règles et invariants engagés

- La création d'un compte vérifié (personne physique) ne peut jamais se faire sans parcours d'identification effectif (I7) — cela vaut aussi pour le représentant légal.
- L'habilitation à **engager la société** n'est pas implicite : elle est attribuée nominativement (fiche `08`), jamais présumée du seul fait d'appartenir à l'entreprise.
- Les pièces justificatives suivent la même politique de purge que les pièces d'identité quand elles contiennent des données personnelles (I5).

## Cas limites et échecs

- **IFU/RCCM incohérents ou introuvables** → revue manuelle, pas de rejet sec.
- **Créateur non représentant légal, sans délégation** → création bloquée jusqu'à production d'une délégation.
- **Représentant légal changeant** → procédure de mise à jour tracée (événement journalisé).

## Hors périmètre

L'attribution fine des rôles et habilitations est la fiche `08`. La **matrice de permissions** complète vit en `03_rbac`. La facturation est la fiche `12`.
