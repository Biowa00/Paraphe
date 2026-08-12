# 07.03 · Politiques d'accès (RLS)

> **À quoi sert ce fichier.** Traduire la matrice `03_rbac` en politiques d'accès au niveau des lignes (RLS Postgres), et neutraliser le « piège du `service_role` » pour tenir I7 en base.
> **Quand la lire.** Avant d'exposer le moindre endpoint, à chaque revue de sécurité.
> **Dépend de.** `03_rbac/03` (matrice), `02_logic/04` (I7, séparation base/clés), `01-schema.md`.

## Le piège du `service_role` — et comment on le désamorce

Supabase/Postgres expose une clé `service_role` qui **contourne toute RLS**. Prise telle quelle, c'est « la clé d'administration qui contourne les règles d'accès » que le brief déclare violer **I7 par construction**. On la neutralise par trois règles cumulatives :

1. **Le contenu n'est pas dans la base.** Documents en clair et clés vivent hors Postgres (stockage objet chiffré + KMS). Même `service_role` ne lit aucun contenu : il n'est pas là. C'est la protection **structurelle**, celle qui ne dépend d'aucune configuration.
2. **L'application n'utilise pas `service_role` sur les chemins qui touchent aux données clients.** Elle se connecte via un rôle applicatif **toujours soumis à RLS**. La clé `service_role` n'est pas présente dans l'environnement applicatif standard.
3. **Les rares tâches d'administration légitimes** (migrations, maintenance) passent par un chemin séparé, tracé dans le journal externalisé, sous double contrôle pour les opérations critiques (`03_rbac/02`).

> Règle d'or : si une fonctionnalité **exige** `service_role` pour lire ou écrire une donnée client, elle est **mal conçue**. On la revoit.

## Contexte d'exécution

Chaque requête applicative porte l'identité de l'appelant (utilisateur authentifié, ou invité porteur d'un jeton d'enveloppe à portée limitée). Les politiques ci-dessous s'expriment en fonction de cette identité (`current_user_id`) et, pour un invité, du **jeton de signature** lié à une enveloppe précise.

## Politiques par table

### `utilisateur`
- **Lecture** : un utilisateur lit sa propre ligne. Personne ne liste les utilisateurs.
- **Écriture** : self, sur un sous-ensemble de colonnes (jamais `npi_hash`, `niveau_verification`, `statut` — écrits par le parcours de vérification côté serveur de confiance).

### `entreprise` / `membre_entreprise` / `membre_role`
- **Lecture** : membre actif de l'entreprise concernée. Cloisonnement strict : aucune fuite inter-entreprises.
- **Écriture** : réservée au rôle **Administrateur** de cette entreprise (gestion des sièges, rôles, habilitations).

### `enveloppe`
- **Lecture** autorisée si l'appelant est :
  - le `createur`, **ou**
  - un `signataire` de l'enveloppe (compte ou invité via jeton), **ou**
  - un membre de l'entreprise émettrice disposant d'un rôle donnant accès à l'archive (Administrateur, Émetteur, Validateur, Lecteur, Signataire habilité).
- **Création** : niveau vérifié minimum ; jamais un invité.
- **Mise à jour** : uniquement les transitions autorisées, jamais si `scellee` (doublé par le trigger `02`). L'approbation d'un circuit interdit `createur = validateur` sur la **même** enveloppe.

### `signataire` / `zone_signature`
- **Lecture** : parties de l'enveloppe et entreprise émettrice autorisée.
- **Écriture** : le créateur/émetteur pose les signataires et zones tant que l'enveloppe n'est pas envoyée ; l'acte de signature (`statut→signee`) n'est possible que par le signataire concerné, avec OTP frais validé (I2) — logique portée côté serveur.

### `evenement`
- **Lecture** : parties de l'enveloppe et entreprise émettrice ; **Auditeur conformité** (interne) en lecture sur les journaux.
- **Écriture** : `INSERT` seulement, par le serveur de confiance. **Aucun** `UPDATE`/`DELETE` pour qui que ce soit (I6, cf. `02`).

### `document_stocke`
- **Lecture** : références visibles aux parties autorisées ; le **contenu** n'est déchiffrable que par les parties (clé au KMS), jamais par un rôle interne (I7).
- **Écriture** : `INSERT` seulement ; `immuable` toujours vrai.

### `enveloppe_cle`
- **Lecture/écriture** : chemin d'administration séparé, jamais le rôle applicatif standard. La bascule `active→detruite` exige double contrôle et notification (`02_logic/04`).

### `verification_identite`
- **Lecture** : self, et **Opérateur de vérification** (interne) **uniquement** pour les dossiers en file d'attente (`resultat = en_revue`), jamais hors file. Aucune image (purgées, I5).

### `credit_transaction`
- **Lecture** : le titulaire (utilisateur ou membres autorisés de l'entreprise).
- **Écriture** : `INSERT` seulement par le serveur (registre en ajout) ; jamais de réécriture d'une transaction passée.

## Traçabilité des accès internes

Les rôles internes (`03_rbac/02`) n'ont **aucune** politique leur ouvrant le contenu. Leurs accès autorisés (statut, métadonnées, file de vérification, journaux) sont **tracés** dans le journal externalisé. Le Propriétaire n'accède qu'à des **vues agrégées**, jamais aux lignes de contenu.

## Ce qui reste à `08_environments`

Le mécanisme concret de réplication du journal hors contrôle des admins, la gestion des secrets, et la confirmation du fournisseur KMS. Les politiques ci-dessus les **supposent** ; elles ne sont pas valables si `08` les contredit.
