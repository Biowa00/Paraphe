# 08 · Environnements — index

> **À quoi sert ce dossier.** Rendre concrètes les conditions d'exécution : environnements, secrets, hébergement/localisation, déploiement, sauvegarde. C'est ici qu'on matérialise deux promesses fragiles : « journal hors du contrôle des admins » (I6) et la localisation des données au Bénin.
> **Quand le lire.** Avant tout déploiement, avant de brancher un secret, avant la première mise en production.
> **Dépend de.** `02_logic/04` (séparation base/clés), `06_services_catalog/05` (KMS, journal, stockage), `07_database/04` (migrations, localisation).

| Fichier | Contenu |
|---|---|
| [01](01-environnements.md) | Séparation dev / staging / prod, isolation des données |
| [02](02-secrets.md) | Gestion des secrets, KMS, rotation |
| [03](03-hebergement-localisation.md) | Région, localisation Bénin (bloquante), disponibilité |
| [04](04-deploiement-sauvegarde.md) | Déploiement, sauvegarde/restauration, journal externalisé |

## Deux exigences qui ne sont pas que techniques

- **« Journal hors du contrôle des admins » (I6)** est une propriété d'**organisation** autant que d'outil : elle est fausse si le compte qui administre l'appli administre aussi le stockage du journal. Traitée en `04`.
- **Localisation des données** : décision ouverte n°2, **bloquante avant mise en production**. Traitée en `03`.
