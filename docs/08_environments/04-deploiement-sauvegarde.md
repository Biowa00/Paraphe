# 08.04 · Déploiement, sauvegarde, journal externalisé

> **À quoi sert ce fichier.** Les règles de déploiement, de sauvegarde/restauration, et la matérialisation du journal hors contrôle des admins (I6).
> **Quand la lire.** Avant de déployer ou de configurer les sauvegardes.
> **Dépend de.** `07_database/04` (migrations), `03_rbac/02` (double contrôle), `06_services_catalog/05` (journal, stockage).

## Déploiement

- Déploiement **reproductible** depuis un état versionné ; pas de modification manuelle en prod non tracée.
- **Migrations** appliquées selon `07_database/04` (en avant, additives, aucune table sans RLS). Une migration de prod ne s'exécute pas tant que la **localisation** n'est pas validée (`03`).
- Séparation des accès de déploiement : l'**Administrateur technique** déploie mais ne **déchiffre pas** et n'agit pas **seul** sur une restauration (`03_rbac/02`).

## Sauvegarde et restauration

- **Réplication sur deux zones** (cahier §9).
- **Restauration testée trimestriellement** — testée, pas supposée.
- Une restauration est une **opération critique** : **double contrôle** obligatoire, tracée au journal externalisé.
- Une restauration ne réintroduit **jamais** une version antérieure d'une enveloppe scellée : ce serait contourner I3. Le stockage objet est **WORM** ; la restauration porte sur l'infrastructure, pas sur la réécriture de contenus scellés.

## Journal externalisé — rendre I6 vrai en pratique

Le journal en ajout seul (`evenement`, et le journal d'actions internes) est **répliqué en continu vers un stockage que les administrateurs de la plateforme ne contrôlent pas**. Conditions concrètes :

- **Séparation organisationnelle réelle** : le compte/organisation qui administre l'application n'administre **pas** le stockage du journal. Sinon la propriété « hors contrôle des admins » est fausse, quel que soit l'outil.
- **Immuabilité vérifiable** du stockage de destination (WORM / ajout seul).
- **Réplication continue**, pas un export périodique manuel (une trace effaçable avant export ne prouve rien).
- Idéalement, un **tiers distinct** (autre fournisseur, autre organisation) détient ce stockage.

> C'est la mesure qui protège contre « l'administrateur efface la trace de son propre passage ». Sans elle, I6 n'est qu'une intention.

> **Ce que « hors du contrôle des admins » ne veut PAS dire.** Le propriétaire ne perd ni la lecture du journal, ni l'exploitation du service (comptes, facturation, infra, support). Il conserve un accès **total en lecture**. La **seule** capacité retirée est de **modifier ou effacer** une ligne déjà écrite. Externaliser le journal ne transfère pas la propriété du business à un tiers : le tiers ne détient qu'un miroir en écriture seule que l'admin ne peut pas purger. Perdre cette « gomme » **est** la valeur du produit — c'est ce qui rend « même nous ne pouvons pas » vrai devant un juge (§4bis.1). Mettre le journal sous le seul contrôle du propriétaire violerait I6 et suffirait à faire tomber toute la preuve au premier contentieux.

## Accès exceptionnel et incidents

- Le mécanisme d'accès exceptionnel (`02_logic/04`, `03_rbac/02`) exige justification écrite, double contrôle, limite de temps, **notification du client**. Aucune configuration de prod ne doit permettre de le contourner.
- Tout incident touchant la disponibilité du chemin de signature déclenche la bascule des plans B fournisseurs (`06`).
