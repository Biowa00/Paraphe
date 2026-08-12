# 03 · RBAC — index

> **À quoi sert ce dossier.** Définir qui a le droit de quoi : niveaux de compte, rôles au sein d'une entreprise cliente, rôles internes de l'exploitant, et la matrice de permissions. C'est ici que l'invariant **I7** se matérialise côté droits d'accès.
> **Quand le lire.** Avant de coder une autorisation, de modéliser `membre_entreprise`, ou d'exposer un endpoint sensible.
> **Dépend de.** `00_brief/` (I7), `02_logic/04` (séparation base/clés, double contrôle), cahier §4 et §4bis.

Deux mondes distincts, à ne jamais confondre :

- **Rôles utilisateurs** (`01`) — dans une entreprise **cliente**. Servent à produire et gérer des enveloppes.
- **Rôles internes** (`02`) — chez l'**exploitant** du SaaS. Administrent un commerce, **jamais un contenu**.

| Fichier | Contenu |
|---|---|
| [01](01-roles-utilisateurs.md) | Niveaux de compte + rôles entreprise + règle de cumul + habilitation |
| [02](02-roles-internes.md) | Les 5 rôles de l'exploitant, non-cumul, double contrôle, accès exceptionnel |
| [03](03-matrice-permissions.md) | Matrice consolidée action × rôle |

## Décisions actées (détail dans les fichiers)

- **Cumul entreprise** : permis, **sauf** émetteur = validateur d'une **même** enveloppe. Voir `01`.
- **Non-cumul interne** : séparations touchant la preuve **par construction** (base ≠ clés, double contrôle système, journal externalisé) ; opérationnel **par politique tracée**, 2ᵉ acteur au démarrage. Voir `02`.
