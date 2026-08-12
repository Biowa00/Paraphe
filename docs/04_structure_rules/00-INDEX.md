# 04 · Règles de structure — index

> **À quoi sert ce dossier.** Les conventions qui rendent le futur code cohérent : nommage, arborescence applicative, règles transverses. Court et cadrant.
> **Quand le lire.** Avant d'écrire du code, à toute revue. À compléter au moment du choix de stack.
> **Dépend de.** `00_brief` (langue), `07_database` (nommage des entités), `05_api_contracts` (frontière backend/client).

## Statut

**Conventions stack-agnostiques** (décision actée) : on fixe des principes indépendants du langage. Le choix de stack (décision ouverte n°1) reste à faire ; à ce moment, on ajoutera un fichier de conventions **spécifiques** (linter, formatage, idiomes) sans contredire ce qui est ici.

| Fichier | Contenu |
|---|---|
| [01](01-nommage.md) | Langue et nommage des identifiants, tables, événements, endpoints |
| [02](02-arborescence.md) | Découpage applicatif : backend de confiance, client, partagé |
| [03](03-conventions-transverses.md) | Erreurs, secrets, journalisation, tests, idempotence |
| [04](04-cycle-fonctionnalite.md) | Cycle de vie d'une fonctionnalité : bout en bout, Definition of Ready/Done |
| [05](05-stack.md) | Stack technique retenue (briques concrètes, portables) |

## Le principe qui prime

Le code sert des **invariants**. Aucune convention de confort ne passe avant I1–I8. Une règle de structure qui gênerait un invariant est fausse, pas l'invariant.
