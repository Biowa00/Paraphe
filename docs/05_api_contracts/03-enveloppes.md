# 05.03 · Endpoints — enveloppes

> **À quoi sert ce fichier.** Contrats du cycle de vie d'une enveloppe : création, envoi, ouverture invité, signature (OTP frais + tracé), scellement, téléchargement du dossier de preuve.
> **Quand la lire.** Pour l'éditeur d'enveloppe et le tunnel signataire.
> **Dépend de.** `02_logic/01` (états), `02_logic/02` (preuve), `07_database/03` (RLS), `01_features/02` et `03`.

Toutes les écritures passent par le **backend de confiance**. Les lectures triviales (`GET` d'une liste) peuvent passer en direct sous RLS.

## Création et préparation

### `POST /v1/enveloppes`
Crée un brouillon.
- **Req** : `{ titre, mode: sequentiel|parallele, date_expiration?, entreprise_id? }`.
- **Rép 201** : `{ id, statut: "brouillon" }`. `titre` **chiffré au repos**.
- Auth : niveau vérifié minimum (jamais invité).
- Émet `creee`.

### `POST /v1/enveloppes/{id}/document`
Dépose le document (PDF, ou Word converti en PDF côté serveur avant chiffrement).
- **Req** : `multipart` (fichier).
- **Rép 200** : `{ document_hash_origine, pages }`.
- Le chiffrement par enveloppe s'applique à l'ingestion ; c'est la **fenêtre d'ingestion** (`02_logic/04`).

### `POST /v1/enveloppes/{id}/signataires`
Ajoute des signataires.
- **Req** : `[{ nom_declare, telephone, ordre, niveau_identite_exige: otp_seul|standard|renforce }]` (défaut `standard`).
- **Rép 200** : liste avec `signataire_id`.

### `POST /v1/enveloppes/{id}/zones`
Place les zones de signature.
- **Req** : `[{ signataire_id, page, x, y, largeur, hauteur }]`.

## Envoi

### `POST /v1/enveloppes/{id}/envoi`
Fige le document et notifie.
- **Req** : `Idempotency-Key`.
- **Rép 200** : `{ statut: "envoyee" }`.
- Gardes : ≥ 1 signataire, empreinte figée, **crédit débité** (`credits_insuffisants` → `422`, reste `brouillon`).
- Notifie WhatsApp/SMS (au 1ᵉʳ si séquentiel). Émet `envoyee`.

## Parcours signataire (invité ou vérifié)

### `GET /v1/enveloppes/{id}` *(jeton d'enveloppe ou session)*
Affiche en lecture seule.
- **Rép 200** : `{ titre, document_url_temporaire, signataires: [statut], mon_niveau_exige, mon_statut }`. Émet `ouverte`/`consultee`.
- `document_url_temporaire` : accès déchiffré **au porteur légitime** uniquement, à durée courte.

### `POST /v1/enveloppes/{id}/signature`
**L'acte central.** Signe la zone du signataire courant.
- **Req** : `{ otp_ticket, trace, empreinte_appareil }` — `trace` **refait à l'instant** (I1), `otp_ticket` **frais** (I2).
- **Rép 200** : `{ statut_signataire: "signee", statut_enveloppe }`.
- Gardes : identité au **niveau exigé** (`identite_niveau_insuffisant`), OTP frais valide, tour respecté en séquentiel (`pas_votre_tour`), enveloppe ni scellée (`enveloppe_scellee`) ni expirée (`enveloppe_expiree`).
- Émet `signee`, notifie l'émetteur. Si dernier signataire → **scellement automatique** (ci-dessous).
- Idempotent : un rejeu ne produit pas deux signatures.

### `POST /v1/enveloppes/{id}/refus`
- **Req** : `{ motif? }`. **Rép 200** : `{ statut: "refusee" }`. Émet `refusee`, notifie l'émetteur.

## Scellement (automatique, interne)

Déclenché par la dernière signature — pas un endpoint public. Calcule l'empreinte finale, produit le **dossier de preuve** (PDF + fichier structuré), applique le **cachet serveur** (clé KMS), bascule en **écriture unique** (I3). Émet `scellee`. Cible **PAdES/LTV** (`02_logic/02`).

## Consultation et preuve

### `GET /v1/enveloppes` *(direct RLS possible)*
Liste paginée des enveloppes de l'appelant (créées ou signées).

### `GET /v1/enveloppes/{id}/dossier-preuve`
- **Rép 200** : `{ pdf_url_temporaire, structure_url_temporaire }`. Émet `telechargee`.
- Accessible aux **parties** et aux membres autorisés de l'entreprise émettrice (`07_database/03`).

> Aucun endpoint ne modifie ni ne supprime une enveloppe scellée, ni un événement : ces opérations n'existent pas (I3, I6).
