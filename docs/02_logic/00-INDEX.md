# 02 · Logique — index

> **À quoi sert ce dossier.** Les règles qui font la valeur du produit : cycle de vie d'une enveloppe, chaîne de preuve, règles d'identité, architecture de chiffrement. C'est le « comment ça tient juridiquement et techniquement », que les fiches de `01_features` ne font que référencer.
> **Quand le lire.** Avant `07_database` et `05_api_contracts` (ils en dérivent). Dès qu'une décision touche un invariant.
> **Dépend de.** `00_brief/` (invariants, glossaire). Contraint `07_database`, `05_api_contracts`, `03_rbac`.

Ce dossier est la **source de vérité** des règles transverses. Les fiches de fonctionnalité renvoient ici ; elles ne redéfinissent jamais une règle.

| Fichier | Contenu |
|---|---|
| [01](01-machine-etats-enveloppe.md) | Machine à états de l'enveloppe : états, transitions, gardes, événements |
| [02](02-chaine-de-preuve.md) | Les trois couches, le dossier de preuve, le scellement, l'ancrage public |
| [03](03-regles-identite.md) | Les 3 niveaux d'identité, OTP, vivacité, face-match, hash NPI, purge |
| [04](04-architecture-chiffrement.md) | Chiffrement par enveloppe, KMS, crypto-shredding, ce que l'exploitant ne peut pas |

## Décisions d'architecture actées (rappel — détail dans les fichiers)

- **Chiffrement** par enveloppe, clés au **KMS séparé**. Effacement = **crypto-shredding** sur demande fondée, double contrôle, tracé, client notifié. Voir `04`.
- **Hash NPI** : HMAC-SHA256 + pepper au KMS (déterministe, unicité). Voir `03`.
- **Cachet serveur** : clé de scellement au KMS, auto-gérée, rotation, empreinte publique ancrée. Voir `02`.
- **Format de preuve** : cible **PAdES niveau LTV** (confirmation = décision ouverte). Voir `02`.
