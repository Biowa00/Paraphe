# 06.03 · Horodatage

> **À quoi sert ce fichier.** La source de temps fiable et traçable de la couche **Temps** de la preuve.
> **Dépend de.** `02_logic/02` (chaîne de preuve), `07.5` du cahier (PAdES).

## Rôle

Dater chaque événement de preuve (`signee`, `scellee`…) sur une **source de temps fiable et traçable**, opposable à un tiers. C'est la troisième couche (« quand ? »).

## Critères de choix

- **Traçabilité** : la source doit pouvoir être justifiée (pas l'horloge locale du serveur).
- **Compatibilité PAdES** : un horodatage intégrable au PDF (jeton d'un service d'horodatage / TSA) prépare le format cible LTV.
- **Fiabilité et disponibilité** du service.
- **Coût par jeton** si TSA externe.

## Options *(non tranché — décision ouverte)*

- **Autorité d'horodatage (TSA) externe** délivrant des jetons RFC 3161, intégrables PAdES. Le plus solide juridiquement.
- **Source de temps interne synchronisée** (NTP fiable + journalisation), suffisante pour l'événementiel, moins forte pour l'opposabilité fine.
- Combinaison : TSA pour le **scellement** (moment probant), source interne pour l'événementiel courant.

## Inducteurs de coût

- Nombre de **jetons TSA** si l'on horodate chaque scellement auprès d'une autorité externe.
- Arbitrage : horodater finement chaque événement (coûteux) vs horodater le **scellement** et journaliser le reste.

## Plan B / dégradation

- **TSA indisponible au scellement** → file d'attente courte + re-tentative ; à défaut, horodatage interne **marqué comme tel** dans le dossier de preuve (transparence : ne jamais présenter un temps interne comme un temps d'autorité).
- L'ancrage public quotidien (`05-securite-infra`) fournit une **borne temporelle indépendante** complémentaire.
