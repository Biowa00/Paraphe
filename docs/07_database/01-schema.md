# 07.01 · Schéma

> **À quoi sert ce fichier.** Décrire les entités, leurs colonnes, types et relations. Base du modèle physique, sans DDL.
> **Quand le lire.** Avant de définir un endpoint, avant d'écrire une migration.
> **Dépend de.** `02_logic/01` (états), cahier §6 (entités pivots), nos décisions actées (cumul de rôles, crypto-shredding, HMAC NPI).

Convention : `PK` clé primaire, `FK` clé étrangère, `NN` non nul, `U` unique, `NULL` nullable. Types indicatifs (Postgres visé).

## Cœur — V1

### `utilisateur`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `identifiant_public` | text `U` `NULL` | format `BJ-XXXX-XXX`, attribué au passage niveau 2 |
| `telephone` | text `NN` `U` | canal principal |
| `niveau_verification` | enum(`invite`,`verifie`) `NN` | un invité peut ne pas avoir de ligne (voir note) |
| `npi_hash` | text `U` `NULL` | **HMAC-SHA256 + pepper (KMS)**, jamais le NPI en clair (I4). `U` garantit l'unicité |
| `nom` | text `NULL` | |
| `prenoms` | text `NULL` | |
| `date_verification` | timestamptz `NULL` | |
| `statut` | enum(`actif`,`suspendu`) `NN` | |

> Note : un **invité** pur (niveau 1) peut n'exister que comme ligne `signataire` (avec `utilisateur_id` nul) et ne pas avoir de compte. On ne crée un `utilisateur` que lorsqu'un compte est nécessaire.

### `entreprise`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `raison_sociale` | text `NN` | |
| `ifu` | text `NN` `U` | |
| `rccm` | text `NN` `U` | |
| `representant_legal_id` | uuid `FK`→utilisateur `NN` | |
| `statut_verification` | enum(`en_attente`,`verifiee`,`suspendue`) `NN` | |

### `membre_entreprise`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `entreprise_id` | uuid `FK` `NN` | |
| `utilisateur_id` | uuid `FK` `NN` | |
| `habilitation_signature` | bool `NN` default false | engage la société — explicite, tracée |
| `date_ajout` | timestamptz `NN` | |
| `date_retrait` | timestamptz `NULL` | membre actif si nul |

> Contrainte `U(entreprise_id, utilisateur_id)`. Les **rôles** ne sont pas une colonne ici : le cumul étant permis (`03_rbac/01`), ils sont portés par `membre_role`.

### `membre_role`
| Colonne | Type | Notes |
|---|---|---|
| `membre_id` | uuid `FK`→membre_entreprise `NN` | |
| `role` | enum(`administrateur`,`emetteur`,`validateur`,`signataire_habilite`,`lecteur`) `NN` | |

> `PK(membre_id, role)`. Un membre peut porter plusieurs rôles (cumul permis). La garde « émetteur ≠ validateur d'une **même** enveloppe » n'est pas structurelle : elle est appliquée à la transition d'approbation (voir `02_logic` / `05`).

### `enveloppe` — objet pivot
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `createur_id` | uuid `FK`→utilisateur `NN` | |
| `entreprise_id` | uuid `FK`→entreprise `NULL` | nul si émise par un particulier |
| `titre` | text `NN` | métadonnée (chiffrée au repos si sensible — voir `03`) |
| `document_hash_origine` | text `NN` | SHA-256 figé à l'envoi |
| `mode` | enum(`sequentiel`,`parallele`) `NN` | |
| `statut` | enum(`brouillon`,`attente_validation`,`envoyee`,`partiellement_signee`,`complete`,`scellee`,`refusee`,`expiree`) `NN` | machine à états `02_logic/01` |
| `date_creation` | timestamptz `NN` | |
| `date_expiration` | timestamptz `NULL` | |
| `date_scellement` | timestamptz `NULL` | renseignée à `scellee` |

### `signataire`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `enveloppe_id` | uuid `FK` `NN` | |
| `utilisateur_id` | uuid `FK` `NULL` | **nul pour un invité** |
| `telephone` | text `NN` | |
| `nom_declare` | text `NN` | |
| `ordre` | int `NN` | pertinent en mode séquentiel |
| `niveau_identite_exige` | enum(`otp_seul`,`standard`,`renforce`) `NN` | défaut `standard` (`02_logic/03`) |
| `statut` | enum(`en_attente`,`ouverte`,`signee`,`refusee`) `NN` | |
| `date_signature` | timestamptz `NULL` | |

### `zone_signature`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `enveloppe_id` | uuid `FK` `NN` | |
| `signataire_id` | uuid `FK` `NN` | |
| `page` | int `NN` | |
| `x` `y` `largeur` `hauteur` | numeric `NN` | placement par glisser-déposer |

### `evenement` — journal en ajout seul (I6)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `enveloppe_id` | uuid `FK` `NN` | |
| `type` | enum(`creee`,`envoyee`,`ouverte`,`consultee`,`otp_envoye`,`otp_valide`,`signee`,`refusee`,`expiree`,`scellee`,`telechargee`) `NN` | |
| `acteur` | text `NN` | identifiant d'acteur (utilisateur, invité, système) |
| `horodatage` | timestamptz `NN` | source de temps fiable |
| `ip` | inet `NULL` | |
| `user_agent` | text `NULL` | |
| `empreinte_appareil` | text `NULL` | |
| `donnees` | jsonb `NULL` | charge utile (jamais le contenu du document) |

> **Jamais** d'UPDATE ni de DELETE (voir `02`). Le `donnees` ne contient aucun contenu de document, seulement des éléments de preuve.

### `document_stocke`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `enveloppe_id` | uuid `FK` `NN` | |
| `version` | int `NN` | origine, finale, dossier de preuve… |
| `hash_sha256` | text `NN` | |
| `chemin_stockage` | text `NN` | **référence** vers le stockage objet (chiffré) |
| `date` | timestamptz `NN` | |
| `immuable` | bool `NN` default true | toujours vrai |

### `enveloppe_cle` — pont vers le KMS (crypto-shredding)
| Colonne | Type | Notes |
|---|---|---|
| `enveloppe_id` | uuid `FK` `PK` | |
| `kms_key_ref` | text `NN` | **référence** de clé au KMS, jamais la clé |
| `statut` | enum(`active`,`detruite`) `NN` | `detruite` = crypto-shreddée |
| `date_destruction` | timestamptz `NULL` | |

> La destruction bascule `statut` à `detruite` et journalise l'événement (double contrôle, notification — `02_logic/04`). L'enveloppe reste ; le contenu devient illisible.

### `verification_identite`
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `utilisateur_id` | uuid `FK` `NN` | |
| `methode` | enum(`ocr_selfie`,`revue_manuelle`) `NN` | |
| `score` | numeric `NULL` | face-match |
| `resultat` | enum(`valide`,`refuse`,`en_revue`) `NN` | |
| `controle_ref` | text `NN` | identifiant de contrôle ; **les images sont purgées** (I5) |
| `date` | timestamptz `NN` | |

### `credit_transaction` — solde à l'unité (particulier / PME)
| Colonne | Type | Notes |
|---|---|---|
| `id` | uuid `PK` | |
| `titulaire_type` | enum(`utilisateur`,`entreprise`) `NN` | |
| `titulaire_id` | uuid `NN` | |
| `type` | enum(`bienvenue`,`achat`,`consommation`,`ajustement`) `NN` | |
| `montant` | int `NN` | +crédits / −consommation |
| `enveloppe_id` | uuid `FK` `NULL` | pour une consommation |
| `date` | timestamptz `NN` | |

> Le solde est la somme des transactions (registre en ajout, pas un compteur mutable). Les crédits `bienvenue` **n'expirent pas**.

## Tracé de signature — point de vigilance (I1)

Le **tracé de référence** (§5.1) est « conservé comme élément de style, jamais comme instrument réutilisable ». Le **tracé par signature** est refait à chaque fois et fait partie de la preuve, intégré au PDF signé.

> ⚠️ Ne **jamais** créer une table de tracés vectoriels réutilisables interrogeable pour apposition : ce serait un instrument de contrefaçon (I1). Si un tracé de référence est conservé, il l'est sous forme **aplatie (image), à usage d'affichage seulement**, sans chemin technique permettant de le réapposer sur un document. **Décision à confirmer** : conserver un tracé de référence, ou pas du tout — le produit fonctionne sans. À trancher avant implémentation.

## Extensions — V2 (esquisse, à détailler quand on rédigera le code V2)

`modele` · `modele_zone` · `modele_role_signataire` (templates réutilisables) ·
`abonnement` · `siege` · `facture` (facturation centralisée par siège) ·
index de recherche sur métadonnées pour l'archive partagée.

Ces tables suivent les mêmes règles (métadonnées seulement, ajout seul pour tout ce qui est preuve). Détail reporté au lot V2 pour ne pas figer prématurément.
