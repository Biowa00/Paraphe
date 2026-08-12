# 08.01 · Environnements

> **À quoi sert ce fichier.** Fixer les environnements et leur isolation.
> **Quand la lire.** Avant de créer un environnement ou d'y injecter des données.
> **Dépend de.** `07_database`, `02_logic/04`.

## Environnements

- **`dev`** — développement local / bac à sable. Fournisseurs en mode sandbox (SMS, Mobile Money, OCR).
- **`staging`** — préproduction, iso-configuration de la prod, pour valider migrations et parcours de bout en bout.
- **`prod`** — production.

## Isolation stricte

- **Aucune donnée réelle en dev ni en staging.** Pas de vrai NPI, pas de vraie pièce, pas de document client. On utilise des jeux de données synthétiques.
- **Secrets par environnement**, jamais partagés : les clés de `dev` ne donnent aucun accès à `prod`.
- **KMS et pepper distincts par environnement.** Un hash NPI de staging n'est pas comparable à celui de prod (pepper différent) — c'est voulu.
- Les webhooks (Mobile Money, notifications) pointent vers l'environnement correspondant, jamais croisés.

## Comptes internes et environnements

- Les rôles internes (`03_rbac/02`) et leur séparation s'appliquent **en prod**. En dev/staging, on peut cumuler pour travailler, **jamais** sur des données réelles (il n'y en a pas).
- La séparation « base ≠ clés » (I7) est **respectée dès staging** pour que la préproduction teste vraiment l'architecture, pas une version relâchée.
