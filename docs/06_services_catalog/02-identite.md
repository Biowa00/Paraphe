# 06.02 · OCR, vivacité, face-match

> **À quoi sert ce fichier.** Les briques d'identité de l'inscription vérifiée et du niveau renforcé.
> **Dépend de.** `02_logic/03` (règles d'identité), `05_api_contracts/02`, `01_features/01`.

## Rôle

- **OCR** de la pièce d'identité : extraire NPI, nom, prénoms, date de naissance ; contrôles de cohérence et détection de falsification.
- **Détection de vivacité** : prouver un humain présent (mouvement aléatoire).
- **Face-match** : comparer le selfie au portrait de la pièce → score.

## Contraintes non négociables (rappel `02_logic/03`)

- Les **images sont purgées après vérification** (I5) : le fournisseur ne conserve rien au-delà du traitement, ou Paraphe traite puis purge. **À exiger contractuellement.**
- **Aucune donnée biométrique conservée** : le selfie sert à la comparaison puis est supprimé.
- Le **NPI n'est pas exposé** : haché (HMAC+pepper) dès l'extraction (I4).
- Un score intermédiaire → **revue manuelle < 24 h**, jamais rejet sec.

## Critères de choix

- **Reconnaissance des pièces d'identité béninoises** (format, sécurité) — critère décisif, beaucoup de solutions internationales échouent ici.
- **Qualité vivacité/anti-spoofing** sur mobile milieu de gamme, en réseau irrégulier.
- **Politique de rétention** compatible avec I5 (traitement sans conservation).
- **Coût par vérification** ; tarif dégressif.
- **Localisation de traitement** compatible avec les contraintes de données (voir `08`).

## Inducteurs de coût

- Coût **par vérification** (inscription = 1) ; le renforcé récurrent réutilise l'identité (pas de nouvelle OCR à chaque signature, `02_logic/03`), ce qui limite la dépense.
- Taux de bascule en revue manuelle = coût **humain** ; un mauvais fournisseur coûte deux fois (API + opérateur).

## Candidats à évaluer *(non tranché)*

- Fournisseurs KYC/identité avec **couverture Afrique de l'Ouest** et prise en charge des pièces béninoises.
- Solution combinée OCR + vivacité + face-match (un seul intégrateur) vs briques séparées.
- **Plan B stratégique déjà acté** : l'accès aux services de l'**ANIP** (vérification officielle) est une démarche en cours — s'il aboutit, il renforce ou remplace le face-match, mais **la v1 ne dépend que d'OCR + selfie + OTP** (cahier §11).

## Plan B / dégradation

- **Fournisseur OCR/vivacité en panne** → mise en file d'attente et **revue manuelle** élargie temporairement, plutôt que blocage de l'inscription.
- **Pièce non reconnue** → nouvelle capture guidée, puis revue manuelle.
- Le chemin d'inscription tolère une dégradation ; le chemin de **signature** (qui, lui, est vital) ne dépend pas de l'OCR pour les niveaux OTP seul / Standard.
