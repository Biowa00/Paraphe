# Cahier des charges

## Plateforme de signature électronique et d'archivage à valeur probante — Bénin

*Document de conception — version 1.0 — 10 août 2026*
*Nom de code : à définir*

---

## 1. Le problème

Deux frictions bloquent aujourd'hui les entreprises béninoises :

**La signature.** Faire signer un contrat suppose de réunir physiquement les parties, ou d'échanger des scans dont personne ne peut garantir l'authenticité. Un scan signé ne prouve ni qui a signé, ni quand, ni que le document n'a pas été modifié après coup. En cas de litige, la partie qui invoque le document supporte seule la charge de la preuve.

**L'archivage.** Les documents engageants vivent dans des boîtes mail, des clés USB et des classeurs. Retrouver un contrat de trois ans prend des heures. Prouver qu'il n'a pas été altéré est impossible.

Ces deux problèmes n'en font qu'un : **il manque un lieu où un document est signé, scellé et conservé de manière opposable.**

---

## 2. Positionnement

> Une plateforme qui permet à toute entreprise ou tout particulier béninois de faire signer un document à distance, avec une identification vérifiée du signataire, et de conserver ce document sous une forme dont l'intégrité est démontrable par un tiers.

### Principe directeur

**La friction est payée une seule fois, par celui qui paie — jamais par celui qui signe.**

Toute décision de conception se tranche par cette règle. Si une contrainte ralentit le signataire destinataire, elle est déplacée vers l'émetteur ou supprimée.

### Ce que le produit n'est pas

- Ce n'est pas un service de signature *qualifiée* au sens du Livre III du Code du numérique — cela suppose un agrément de prestataire de services de confiance (voir §3).
- Ce n'est pas un coffre-fort de stockage généraliste concurrent de Google Drive.
- Ce n'est pas un outil de légalisation administrative se substituant à la mairie.

C'est un **service de signature avancée avec dossier de preuve**, positionné sur la recevabilité et la force probante, pas sur la présomption légale de fiabilité.

---

## 3. Cadre juridique et conformité

### 3.1 Fondement

La loi n° 2017-20 portant Code du numérique en République du Bénin fournit la base :

| Sujet | Portée |
|---|---|
| Équivalence écrit électronique / papier | Admise sous réserve d'identification de l'auteur et de garantie d'intégrité |
| Signature électronique | Admise au même titre qu'une signature manuscrite |
| Horodatage électronique | Reconnu comme preuve, sous réserve d'une source de temps fiable |
| Archivage électronique | Encadré : garantie d'intégrité, de lisibilité et de restitution |
| Présomption de fiabilité | **Réservée à la signature qualifiée** (dispositif sécurisé + certificat qualifié délivré par un prestataire agréé) |

### 3.2 Conséquence opérationnelle

En l'absence d'agrément, la plateforme produit une **signature avancée**. Elle est recevable en justice, mais sans présomption : c'est la qualité du dossier de preuve qui emporte la conviction du juge.

**La stratégie du produit consiste donc à rendre ce dossier de preuve si complet qu'il rende la contestation coûteuse et peu crédible.**

### 3.3 Démarches à engager en parallèle du développement

| Démarche | Interlocuteur | Criticité |
|---|---|---|
| Vérifier l'existence d'un registre de prestataires de confiance agréés | ASIN | Haute |
| Demander une convention d'accès aux services de vérification d'identité | ANIP | Haute — conditionne l'architecture d'identification |
| Déclaration / autorisation de traitement de données à caractère personnel | APDP | **Bloquante avant mise en production** |
| Étudier les conditions d'obtention du statut de prestataire de services de confiance | ASIN | Moyenne — objectif à 24 mois |

### 3.4 Protection des données

- Le NPI n'est **jamais stocké en clair**. Seul un hachage salé est conservé, suffisant pour garantir l'unicité d'un compte sans exposer la donnée en cas de fuite.
- Les images de pièces d'identité sont chiffrées au repos et **purgées après vérification** ; seuls sont conservés le résultat de la vérification et un identifiant de contrôle.
- Aucune donnée biométrique n'est conservée en v1 (le selfie sert à la comparaison puis est supprimé). Le traitement biométrique relève d'un régime d'autorisation renforcé : à écarter tant qu'il n'apporte pas de valeur décisive.
- Politique de conservation explicite, avec purge automatique et journal des accès.

---

## 4. Utilisateurs et niveaux de compte

Le découpage en trois niveaux est la décision structurante du produit. Il évite d'imposer à tous la lourdeur nécessaire à quelques-uns.

### Niveau 1 — Invité

**Aucune inscription.** Reçoit un lien par WhatsApp ou SMS, ouvre le document, signe.

- Identification : OTP sur le numéro + selfie avec détection de vivacité + tracé de la signature
- Preuve produite : niveau **standard**
- Coût pour lui : gratuit, toujours
- Objectif : c'est le canal d'acquisition principal du produit

### Niveau 2 — Compte vérifié (particulier)

Identité confirmée une fois, réutilisable indéfiniment.

- Identification : parcours complet §5.1
- Preuve produite : niveau **renforcé**, avec badge visible sur chaque signature
- Dispose d'un identifiant plateforme public (format `BJ-XXXX-XXX`)
- Accède à son archive personnelle et peut émettre des documents

### Niveau 3 — Compte entreprise

- Création conditionnée à : IFU, RCCM, et vérification que le créateur est bien le représentant légal ou détient une délégation
- Sièges nominatifs avec rôles distincts
- Modèles de documents réutilisables, archive partagée, facturation centralisée

**Rôles au sein d'une entreprise :**

| Rôle | Droits |
|---|---|
| Administrateur | Gère les sièges, la facturation, les modèles |
| Émetteur | Crée et envoie des enveloppes |
| Validateur | Approuve avant envoi (circuit interne optionnel) |
| Signataire habilité | Engage la société — habilitation explicite, tracée |
| Lecteur | Consulte l'archive sans agir |

### Point d'attention majeur

**Une entreprise doit pouvoir envoyer un document à n'importe qui**, membre ou non : clients, fournisseurs, prestataires, bailleurs, banques. Restreindre l'envoi aux seuls membres enregistrés viderait le produit de son usage principal. Les externes signent en tant qu'invités (niveau 1).

---

## 4 bis. L'exploitant de la plateforme

### 4bis.1 Principe fondateur

Sur un service de preuve, **l'exploitant est l'acteur le plus contraint du système, jamais le plus puissant.**

Un « super administrateur » disposant d'un accès total au contenu des documents détruirait la valeur du produit. Devant un tribunal, il suffirait à la partie adverse de démontrer qu'une personne — le propriétaire du service — pouvait techniquement modifier ou fabriquer une pièce, pour que l'ensemble du dossier de preuve perde sa force. La promesse « même nous ne pouvons pas modifier vos documents » (§7.4) n'est tenable que si elle est vraie au niveau de l'architecture, pas au niveau de la politique interne.

**Conséquence : le propriétaire du SaaS administre un commerce, pas un contenu.** Il pilote les comptes, la facturation, les plans, la modération et la supervision technique. Il n'a aucun accès en lecture au contenu des documents, ni aucune capacité d'écriture sur les enveloppes scellées.

Cette limitation n'est pas une contrainte subie : c'est un argument de vente, et elle protège aussi l'exploitant. Ne pas pouvoir accéder aux documents, c'est ne pas pouvoir en être tenu responsable, ni être contraint de les produire hors procédure légale.

### 4bis.2 Rôles internes

Aucun compte ne cumule ces rôles. Le fractionnement est délibéré.

| Rôle | Peut faire | Ne peut jamais faire |
|---|---|---|
| **Propriétaire** | Gérer les plans tarifaires, la facturation, les comptes entreprise, suspendre un compte, consulter les statistiques agrégées | Lire un document, accéder à une pièce d'identité, agir sur une enveloppe |
| **Administrateur technique** | Déployer, superviser l'infrastructure, restaurer une sauvegarde | Déchiffrer un document, modifier un journal, agir seul sur une restauration |
| **Agent support** | Voir le statut d'une enveloppe, les dates, les destinataires, relancer une notification | Ouvrir un document, voir son titre complet ou son contenu |
| **Opérateur de vérification** | Traiter les revues manuelles d'identité en attente | Consulter un dossier hors file d'attente, conserver une pièce après décision |
| **Auditeur conformité** | Lire les journaux et les rapports d'accès | Modifier ou supprimer quoi que ce soit |

Le rôle **Propriétaire** est un rôle de gestion. Toute action sensible qu'il déclenche (suspension d'un compte, changement de plan tarifaire) est journalisée et notifiée au client concerné.

### 4bis.3 Mécanismes qui rendent la contrainte réelle

Une règle interne ne prouve rien. Ces mécanismes-là, si :

**Chiffrement par enveloppe.** Chaque document est chiffré avec une clé qui lui est propre. Les clés sont détenues par un service de gestion de clés distinct de la base de données, avec des accès séparés. Celui qui détient la base n'a pas les clés ; celui qui a les clés n'a pas la base.

**Aucune suppression.** Il n'existe pas d'opération de suppression sur une enveloppe scellée, à aucun niveau, y compris en base. Seule la suspension d'accès est possible.

**Journal d'administration externalisé.** Toute action d'un compte interne est écrite dans un journal en ajout seul, répliqué en continu vers un stockage que les administrateurs de la plateforme ne contrôlent pas. Un administrateur ne peut pas effacer la trace de son propre passage.

**Double contrôle.** Les opérations critiques (restauration de sauvegarde, accès exceptionnel, modification d'un plan tarifaire global) exigent la validation de deux comptes distincts.

**Accès exceptionnel encadré.** Un mécanisme de dernier recours existe pour les incidents graves. Il exige une justification écrite, le double contrôle, il est limité dans le temps, et **le client concerné en est notifié automatiquement**. Aucun accès silencieux.

**Réquisition judiciaire.** Procédure documentée : une demande d'autorité ne donne accès qu'aux métadonnées et au dossier de preuve, sauf décision de justice explicite. Le client est informé lorsque la loi le permet.

### 4bis.4 Interdits absolus

Aucun compte interne, quel que soit son niveau, ne peut :

- signer un document au nom d'un tiers
- créer un compte vérifié sans que le parcours d'identification ait été effectivement suivi
- modifier une signature, un horodatage ou un événement du journal
- altérer une empreinte de document
- rejouer une signature tracée stockée (voir §7.2)

Ces cinq interdits ne relèvent pas de la politique interne : **ils doivent être impossibles par construction**, et non simplement défendus. Si l'un d'eux est techniquement réalisable dans l'implémentation, la conception est à revoir.

### 4bis.5 Ce que le propriétaire voit réellement

Un tableau de bord d'exploitation, alimenté exclusivement par des données agrégées et des métadonnées :

- Comptes créés, taux de complétion du parcours de vérification, motifs d'abandon
- Enveloppes envoyées, taux de signature, délai moyen de signature
- Crédits vendus, chiffre d'affaires, consommation par segment
- Conversion des signataires invités en comptes vérifiés
- Coût des SMS et notifications, incidents techniques, disponibilité
- File d'attente des vérifications manuelles

C'est amplement suffisant pour piloter l'entreprise. Aucune décision commerciale ne requiert de lire le contrat d'un client.

---

## 5. Parcours clés

### 5.1 Inscription vérifiée — cible : 4 minutes, sur mobile

1. **Numéro de téléphone** → OTP → numéro validé
2. **Photo de la pièce d'identité** (recto/verso) → OCR extrait NPI, nom, prénoms, date de naissance → contrôles de cohérence du format et détection de falsification
3. **Selfie animé** (mouvement demandé aléatoirement) → comparaison au portrait de la pièce → score de correspondance
4. **Tracé de la signature de référence** → conservé comme élément de style, **jamais comme instrument réutilisable** (voir §7.2)
5. **Attribution de l'identifiant plateforme** → compte vérifié

Si le score de correspondance est intermédiaire, bascule vers une revue manuelle sous 24 h plutôt qu'un rejet sec.

### 5.2 Création et envoi d'une enveloppe

1. Dépôt du document (PDF, ou Word converti en PDF côté serveur)
2. Ajout des signataires : nom, numéro de téléphone, rôle, **niveau d'identité exigé**
3. Choix du mode : séquentiel (l'un après l'autre) ou parallèle (tous en même temps)
4. Placement des zones de signature par glisser-déposer
5. Envoi → notification WhatsApp/SMS à chaque signataire concerné

### 5.3 Signature par un invité

1. Ouverture du lien → le document s'affiche en lecture seule
2. Vérification d'identité selon le niveau exigé par l'émetteur
3. **Tracé de la signature, refait à cet instant précis**
4. **OTP frais, saisi à cet instant précis**
5. Confirmation → l'événement est inscrit au journal → notification à l'émetteur

Une session volée ne permet pas de signer : l'OTP est exigé à chaque signature, pas seulement à la connexion.

### 5.4 Vérification publique — gratuite et sans compte

Une page accessible à tous. On y dépose un PDF, on obtient en réponse :

- Document intègre / document altéré
- Liste des signataires, avec leur niveau d'identité
- Date et heure de chaque signature
- Lien vers le dossier de preuve complet

**Cette page est le principal levier commercial du produit.** Chaque document signé qui circule amène de nouveaux utilisateurs vers elle.

---

## 6. Modèle de données

L'objet central n'est pas le document. C'est **l'enveloppe**.

### Entités principales

**`utilisateur`**
`id` · `identifiant_public` · `telephone` · `niveau_verification` · `npi_hash` · `nom` · `prenoms` · `date_verification` · `statut`

**`entreprise`**
`id` · `raison_sociale` · `ifu` · `rccm` · `representant_legal_id` · `statut_verification`

**`membre_entreprise`**
`entreprise_id` · `utilisateur_id` · `role` · `habilitation_signature` · `date_ajout` · `date_retrait`

**`enveloppe`** — l'objet pivot
`id` · `createur_id` · `entreprise_id` · `titre` · `document_hash_origine` · `mode` (séquentiel / parallèle) · `statut` · `date_creation` · `date_expiration` · `date_scellement`

**`signataire`**
`enveloppe_id` · `utilisateur_id` (nullable pour un invité) · `telephone` · `nom_declare` · `ordre` · `niveau_identite_exige` · `statut` · `date_signature`

**`evenement`** — journal en ajout seul, jamais modifié ni supprimé
`enveloppe_id` · `type` · `acteur` · `horodatage` · `ip` · `user_agent` · `empreinte_appareil` · `donnees`

Types d'événements : `creee` · `envoyee` · `ouverte` · `consultee` · `otp_envoye` · `otp_valide` · `signee` · `refusee` · `expiree` · `scellee` · `telechargee`

**`document_stocke`**
`enveloppe_id` · `version` · `hash_sha256` · `chemin_stockage` · `date` · `immuable` (toujours vrai)

### Cycle de vie d'une enveloppe

```
brouillon → envoyee → partiellement_signee → complete → scellee
                ↓                    ↓
            expiree              refusee
```

Le multi-signataires est ainsi géré nativement : trois signataires sur un même document ne constituent pas un cas particulier, seulement trois lignes dans `signataire` et trois événements `signee`.

---

## 7. Architecture de preuve

### 7.1 Les trois couches

| Couche | Question | Mécanisme |
|---|---|---|
| **Identité** | Qui a signé ? | OTP + selfie/vivacité + pièce d'identité + NPI |
| **Intégrité** | Le document a-t-il changé ? | Empreinte SHA-256 figée au moment de la signature |
| **Temps** | Quand ? | Horodatage sur source de temps fiable et traçable |

### 7.2 Règle absolue sur la signature tracée

**Le tracé n'a aucune valeur probante en lui-même.** Il rassure l'utilisateur ; il ne prouve rien.

En conséquence :

- Le tracé de référence n'est **jamais rejoué** depuis la base pour l'apposer sur un document.
- Le signataire **retrace sa signature à chaque document**.
- Une base contenant des signatures réutilisables serait un instrument de contrefaçon, et suffirait à faire tomber tout le dossier de preuve devant un tribunal.

### 7.3 Le dossier de preuve

Produit à chaque scellement, sous forme d'un PDF joint et d'un fichier structuré :

- Empreinte du document original et empreinte finale
- Pour chaque signataire : identité, niveau de vérification, méthode d'authentification, horodatage, IP, appareil
- Journal chronologique complet des événements
- Signature serveur du dossier lui-même

### 7.4 Scellement et opposabilité

- Stockage en **écriture unique** : aucune modification possible après scellement, y compris par l'exploitant.
- Publication quotidienne d'une empreinte globale de l'ensemble des archives sur un support public et indépendant.

Cette dernière mesure change la nature de l'argument commercial : la plateforme ne demande pas qu'on lui fasse confiance, elle permet qu'on la vérifie. **« Même nous ne pouvons pas modifier vos documents »** est un message compréhensible par un dirigeant de PME sans culture technique.

### 7.5 Norme de référence

Le format **PAdES** traite déjà la signature multiple, la conservation à long terme et l'horodatage dans un PDF. À adopter plutôt qu'à réinventer.

---

## 8. Périmètre par lot

### V1 — Le produit vendable (objectif : 3 mois)

- Inscription vérifiée (parcours §5.1)
- Création d'enveloppe, signature simple et multiple
- Signature invité par lien WhatsApp/SMS
- Dossier de preuve et scellement
- Page de vérification publique
- Archive personnelle
- Paiement par crédits, en Mobile Money
- Interface mobile d'abord

### V2 — L'entreprise (mois 4 à 8)

- Comptes entreprise, sièges, rôles, habilitations
- Modèles de documents réutilisables
- Circuits de validation interne
- Archive partagée avec recherche
- Facturation centralisée, export comptable
- Tableau de bord et relances automatiques

### V3 — L'archivage et la numérisation (mois 9 à 18)

- Import et numérisation de l'existant papier
- OCR et recherche plein texte
- Classement, métadonnées, durées de conservation
- API pour intégration aux outils métier
- Éventuelle demande d'agrément prestataire de services de confiance

### Ordre de construction

**Signature → archivage → numérisation.** L'archive se remplit d'elle-même avec les documents signés. La numérisation de l'existant est un outil de rétention, non d'acquisition : la placer en tête retarderait de plus d'un an la première vente.

---

## 9. Exigences non fonctionnelles

| Domaine | Exigence |
|---|---|
| **Mobile** | Conception mobile d'abord. Fonctionnement acceptable en 3G. Poids des pages maîtrisé. |
| **Canal** | WhatsApp et SMS en canaux principaux ; l'e-mail en secours. |
| **Langue** | Français. Prévoir l'interface en fon et yoruba pour le parcours signataire en V2. |
| **Disponibilité** | 99,5 % minimum. Une signature manquée est un contrat perdu. |
| **Sécurité** | Chiffrement au repos et en transit, cloisonnement des données par entreprise, journal d'accès administrateur. |
| **Hébergement** | Vérifier les contraintes de localisation des données applicables au Bénin avant de choisir la région d'hébergement. |
| **Sauvegarde** | Réplication sur deux zones, restauration testée trimestriellement. |
| **Accessibilité** | Parcours signataire utilisable par une personne peu familière du numérique : trois écrans maximum. |

---

## 10. Modèle économique

**Pas d'abonnement en entrée de gamme.** Une PME béninoise n'engage pas un coût récurrent pour un besoin intermittent.

| Segment | Modèle |
|---|---|
| Particulier | **3 signatures offertes à l'inscription** (offre de bienvenue, non renouvelable), puis crédits à l'unité |
| PME | Packs de crédits prépayés, achetés en Mobile Money |
| Entreprise structurée | Abonnement par siège + volume inclus |
| Signataire destinataire | **Gratuit, sans exception** |

La gratuité pour le destinataire n'est pas une concession commerciale : c'est le moteur d'acquisition. Chaque document envoyé expose la plateforme à un nouvel utilisateur, dans un contexte où elle vient de lui rendre service. **Elle n'est jamais limitée dans le temps ni en volume.**

L'offre particulier, en revanche, est une **amorce, pas un palier permanent**. Un particulier signe rarement plus de deux ou trois documents par an : une franchise mensuelle reconduite indéfiniment coûterait des SMS chaque mois sans jamais convertir. Trois signatures offertes à l'inscription suffisent à faire découvrir le service.

Ces crédits de bienvenue **n'expirent pas**. Une date limite créerait une échéance qui n'a de sens que pour l'exploitant : le particulier dont le besoin survient huit mois plus tard trouverait ses crédits périmés au moment précis où il revenait. Le coût pour la plateforme est identique dans les deux cas, mais l'effet sur la rétention est inverse.

Les invités ayant signé deux ou trois fois reçoivent une proposition de passage en compte vérifié.

---

## 11. Risques et points à lever

| Risque | Gravité | Traitement |
|---|---|---|
| Absence d'accès aux services de vérification de l'ANIP | Élevée | Plan B opérationnel : OCR + selfie + OTP. Engager la démarche en parallèle. |
| Refus ou retard de l'APDP | Élevée | Dossier à déposer dès la conception, pas après. |
| Contestation judiciaire d'une signature | Élevée | Qualité du dossier de preuve ; obtenir en amont l'avis d'un avocat sur un cas type. |
| Défiance culturelle envers le document non papier | Moyenne | Page de vérification publique, ancrage indépendant, références clients visibles. |
| Coût des SMS/OTP à l'échelle | Moyenne | Négocier tôt avec les opérateurs ; privilégier WhatsApp. |
| Arrivée d'un concurrent international | Moyenne | L'ancrage sur l'identité nationale et le Mobile Money est difficile à répliquer depuis l'étranger. |
| Documents frauduleux à l'inscription | Moyenne | Revue manuelle des cas intermédiaires ; limitation du volume pour les comptes récents. |

### Question ouverte n° 1

Quel document précis fait le plus mal aux PME visées ? Contrats de travail, bons de commande, procès-verbaux d'assemblée, décharges, contrats de bail ? La réponse détermine les modèles à livrer en V1 et le discours commercial. **À trancher par une dizaine d'entretiens avant tout développement.**

### Question ouverte n° 2

Existe-t-il aujourd'hui un prestataire de services de confiance agréé au Bénin ? Si oui, un partenariat permettrait d'accéder à la signature qualifiée sans porter seul le coût de l'agrément.

---

## 12. Prochaines étapes

1. **Cette semaine** — Contacter l'ANIP au sujet d'une convention d'accès à la vérification d'identité. Cette réponse conditionne l'architecture d'identification.
2. **Cette semaine** — Interroger l'ASIN sur le registre des prestataires de services de confiance.
3. **Deux semaines** — Mener dix entretiens de PME pour trancher la question ouverte n° 1.
4. **Trois semaines** — Faire valider le principe du dossier de preuve par un avocat béninois.
5. **Un mois** — Prototype cliquable du parcours signataire invité, testé auprès de dix personnes non initiées, chronomètre en main.
6. **Puis seulement** — Démarrer le développement de la V1.

---

*Ce document est une base de travail destinée à évoluer. Les points juridiques doivent être confirmés auprès d'un conseil qualifié au Bénin avant tout engagement.*
