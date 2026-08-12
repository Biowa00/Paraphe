# 02.04 · Architecture de chiffrement et séparation des clés

> **À quoi sert ce fichier.** Décrire comment les documents sont chiffrés, comment les clés sont séparées de la base, comment l'effacement est possible sans violer l'immutabilité, et pourquoi l'exploitant ne peut techniquement pas lire ou fabriquer une pièce.
> **Quand la lire.** **Avant le choix de stack** (I7 en dépend) et avant `07_database` et `08_environments`.
> **Dépend de.** `00_brief/` (I3, I4, I5, I7), `02-chaine-de-preuve.md`. Contrainte dominante du produit.

## Pourquoi ce fichier existe

Sur un service de preuve, **l'exploitant est l'acteur le plus contraint, jamais le plus puissant**. Devant un tribunal, il suffirait de démontrer qu'une personne — le propriétaire du service — *pouvait* techniquement modifier ou fabriquer une pièce, pour faire tomber tout le dossier. La promesse « même nous ne pouvons pas modifier vos documents » n'est tenable que si elle est vraie **au niveau de l'architecture**, pas de la politique interne. Ce fichier décrit les mécanismes qui la rendent vraie.

## Chiffrement par enveloppe

- Chaque document est chiffré avec une **clé qui lui est propre** (clé d'enveloppe).
- Les clés d'enveloppe vivent dans un **KMS distinct de la base de données**, à accès séparé.
- **Séparation des pouvoirs** : qui détient la base n'a pas les clés ; qui a les clés n'a pas la base. Aucun compte, aucun composant ne réunit les deux.
- Le **pepper** du hash NPI (cf. `03`) et la **clé de scellement serveur** (cf. `02`) vivent également au KMS.

Fondement matériel de **I7** : sans les clés, l'exploitant ne peut pas lire un contenu ; sans réunir les deux domaines, il ne peut pas fabriquer une pièce cohérente avec le journal externalisé.

## La fenêtre d'ingestion (à écrire noir sur blanc)

Le seul instant où un contenu transite **en clair** côté serveur est l'**ingestion** : dépôt du document et, le cas échéant, conversion **Word → PDF** avant chiffrement. Dès la fin de l'ingestion, le document est chiffré par enveloppe et l'exploitant n'y a plus aucun accès en lecture.

Cette fenêtre doit être : la plus courte possible, en mémoire de préférence, sans persistance en clair, et **documentée** comme la frontière exacte du « à partir d'ici, personne chez Paraphe ne lit ». Ne pas la nommer laisserait un angle d'attaque à un contradicteur technique.

## Effacement = crypto-shredding (réconcilie I3 et l'APDP)

Il n'existe **aucune** opération de suppression d'une enveloppe scellée, à aucun niveau, y compris en base (I3). L'« effacement » d'un contenu, quand il est légalement dû, se fait par **destruction de la clé d'enveloppe** : l'enveloppe demeure, son contenu devient **définitivement illisible**. Les métadonnées et le journal (I6) subsistent, l'intégrité reste vérifiable.

**Gouvernance de la destruction de clé** (décision actée) :

- **Déclencheur** : uniquement une **demande d'effacement légalement fondée** (droit APDP de la personne concernée, ou décision de justice). Jamais automatique.
- **Double contrôle** : validation par **deux comptes internes distincts** (§4bis.3).
- **Trace** : la destruction est écrite comme **événement en ajout seul** dans le journal externalisé — un administrateur ne peut pas effacer la trace de son propre geste.
- **Notification** : le **client concerné est notifié automatiquement**. Aucun effacement silencieux.

## Ce qui est impossible par construction (I7, §4bis.4)

Ces interdits ne sont pas des règles internes : ils doivent être **irréalisables dans l'implémentation**. Si l'un est techniquement possible, la conception est à revoir.

- Lire le contenu d'un document (aucune clé côté exploitation).
- Signer au nom d'un tiers.
- Créer un compte vérifié sans parcours d'identification effectif.
- Modifier une signature, un horodatage, un événement du journal.
- Altérer une empreinte de document.
- Rejouer un tracé stocké (I1).

## Journal externalisé — I6

Toute action, y compris interne, est écrite dans un **journal en ajout seul**, **répliqué en continu vers un stockage que les administrateurs de la plateforme ne contrôlent pas**. Support précis à choisir en `08_environments`, mais la propriété « hors du contrôle des admins » est non négociable.

## Accès exceptionnel encadré

Un mécanisme de dernier recours existe pour incidents graves : **justification écrite**, **double contrôle**, **limité dans le temps**, et **client notifié automatiquement**. Aucun accès silencieux. Distinct de la réquisition judiciaire (métadonnées + dossier de preuve seulement, sauf décision de justice explicite ; client informé quand la loi le permet).

## Ce qui reste à trancher (renvoi)

- Choix du **KMS** concret et du **stockage externalisé du journal** → `06_services_catalog` / `08_environments`.
- **Localisation des données** applicable au Bénin → `08_environments` (décision ouverte).
- Ces choix doivent respecter, et non contourner, les propriétés ci-dessus. **Une stack qui expose une clé d'administration contournant les règles d'accès viole I7 par construction** et est disqualifiée.
