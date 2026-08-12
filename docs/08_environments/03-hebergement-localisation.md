# 08.03 · Hébergement et localisation

> **À quoi sert ce fichier.** Cadrer le choix de région et l'exigence de localisation des données, et la disponibilité.
> **Quand la lire.** Avant la première mise en production. **Bloquant.**
> **Dépend de.** `07_database/04`, cahier §9 (disponibilité, hébergement), décision ouverte n°2.

## Localisation des données — décision ouverte, bloquante

- Il faut **vérifier les obligations de localisation des données applicables au Bénin** (données personnelles, exigences APDP, éventuelles règles sectorielles) **avant** de fixer la région d'hébergement.
- **Aucune mise en production** tant que cette vérification n'est pas faite et la région validée (`07_database/04`).
- Cette réponse conditionne le choix du fournisseur cloud, du KMS et du stockage objet (`06_services_catalog/05`).

## Critères de région

- **Conformité** à la localisation exigée (critère premier, non négociable).
- **Latence** acceptable depuis le Bénin sur mobile / réseau irrégulier.
- Disponibilité des briques nécessaires dans la région : KMS, stockage objet **WORM**, multi-zone.

## Disponibilité (cahier §9)

- Cible **99,5 % minimum**. « Une signature manquée est un contrat perdu. »
- Le **chemin de signature** (notifications/OTP, backend de confiance, lecture d'enveloppe) est prioritaire : ses dépendances ont un plan B (`06`).
- **Réplication sur deux zones** (sauvegarde, `04`).
- Fonctionnement **acceptable en 3G**, poids des pages maîtrisé (contrainte transverse portée aussi par `09_components`).

## Frontière avec l'APDP

Le dépôt du dossier APDP est **bloquant avant mise en production** (cahier §3.3). La localisation et l'autorisation de traitement se traitent **en parallèle du développement**, pas après — sans quoi la prod est repoussée.
