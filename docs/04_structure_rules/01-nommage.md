# 04.01 · Langue et nommage

> **À quoi sert ce fichier.** Fixer la langue des identifiants et les règles de nommage, pour un vocabulaire unique entre base, API et code.
> **Quand la lire.** Avant de créer une table, un champ, un endpoint, une variable métier.
> **Dépend de.** `00_brief` §8 (amendé), `07_database/01`, `05_api_contracts`.

## Langue des identifiants (arbitrage acté)

- **Domaine en français.** Tables, entités, colonnes, types d'événements, valeurs d'énumération métier suivent le langage du cahier §6 : `utilisateur`, `enveloppe`, `signataire`, `evenement`, `niveau_identite_exige`, `scellee`… C'est la langue métier partagée avec le client et les documents juridiques.
- **Termes béninois conservés tels quels** : `npi`, `ifu`, `rccm`, `identifiant_public`.
- **Anglais admis** uniquement pour le **code technique générique sans portée métier** : utilitaires, adaptateurs d'infra, helpers (`retry`, `parseHeader`, `HttpClient`…). Dès qu'un identifiant porte un concept métier, il est en français.
- **Documentation** : toujours en français.

> Règle de tranchage : « ce nom désigne-t-il un concept du cahier ? » → oui = français ; non, c'est de la plomberie = anglais admis.

## Casse

- **Tables et colonnes** : `snake_case` minuscule (`document_hash_origine`, `date_scellement`).
- **Énumérations** : valeurs en `snake_case` (`partiellement_signee`, `otp_valide`).
- **Variables / fonctions** : selon l'idiome du langage retenu (à préciser au choix de stack), mais le **radical métier reste français** (`enveloppeScellee`, `verifierOtp`).
- **Constantes** : `MAJUSCULE_SNAKE`.
- **Endpoints** : chemins en français, `kebab` si multi-mots (`/dossier-preuve`, `/mobile-money/callback`).

## Cohérence transverse

Un même concept porte **le même nom** partout : la colonne `statut`, le champ d'API `statut`, la variable `statut`. Pas de synonymes (`etat`/`statut`/`status` mélangés). Le glossaire (`00_brief/GLOSSAIRE.md`) est l'autorité en cas de doute sur le terme.

## Fichiers de documentation

- `docs/NN_dossier/MM-titre.md`, numérotés, `kebab-case`, français.
- Chaque fichier commence par l'en-tête court : à quoi il sert, quand le lire, dépend de.
