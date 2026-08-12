# 05.02 · Endpoints — identité

> **À quoi sert ce fichier.** Contrats de l'inscription vérifiée, de l'OTP et de la revue manuelle.
> **Quand la lire.** Pour l'implémentation du tunnel d'inscription et du composant OTP.
> **Dépend de.** `02_logic/03` (règles d'identité), `01_features/01`, `07_database/01`.

Tous ces endpoints sont portés par le **backend de confiance**.

## OTP

### `POST /v1/otp/demande`
Envoie un OTP sur un numéro.
- **Req** : `{ telephone, but }` — `but` ∈ `inscription | signature | connexion`.
- **Rép 200** : `{ otp_id, expire_dans_s }`. Le code n'est **jamais** renvoyé.
- Émet l'événement `otp_envoye` (si lié à une enveloppe).
- Erreurs : `429 otp_trop_de_tentatives`.

### `POST /v1/otp/verifie`
Valide un code. **Usage unique**, durée courte (I2).
- **Req** : `{ otp_id, code }`.
- **Rép 200** : `{ verifie: true, ticket }` — `ticket` à usage unique, à présenter à l'action qui exigeait l'OTP (signature, etc.).
- Erreurs : `422 otp_invalide`, `410 otp_expire`, `429 otp_trop_de_tentatives`.

> Le `ticket` matérialise « OTP frais consommé à l'instant ». Il est lié à une action précise et expire immédiatement après usage.

## Inscription vérifiée (parcours §5.1)

Séquence : téléphone → OTP → pièce → selfie → tracé → identifiant public. Chaque étape est indépendante et reprend en cas d'abandon.

### `POST /v1/inscription/piece`
Dépôt recto/verso, OCR, contrôles de falsification.
- **Req** : `multipart` (recto, verso) + `otp_ticket`.
- **Rép 200** : `{ dossier_id, extrait: { nom, prenoms, date_naissance }, coherence: ok|douteuse }`.
- Les **images sont chiffrées puis purgées après vérification** (I5) ; jamais renvoyées.
- Le **NPI extrait n'est jamais renvoyé** ; il est haché (HMAC+pepper) côté serveur (I4).
- Erreurs : `422 npi_deja_utilise`, `422 piece_illisible`.

### `POST /v1/inscription/selfie`
Selfie animé, vivacité, face-match.
- **Req** : `multipart` (vidéo/frames) + `dossier_id` + `defi` (mouvement demandé).
- **Rép 200** : `{ score, resultat: valide | en_revue | refuse }`.
- Le selfie sert à la comparaison **puis est supprimé** ; aucune donnée biométrique conservée.
- Score intermédiaire → `resultat: en_revue` (bascule revue manuelle < 24 h), **jamais** un rejet sec.
- Erreurs : `422 vivacite_echec`.

### `POST /v1/inscription/finalise`
Attribue l'identifiant public et crédite la bienvenue.
- **Req** : `{ dossier_id, trace_reference? }` — le tracé de référence est optionnel (voir décision ouverte n°7 : peut n'être pas conservé).
- **Rép 200** : `{ identifiant_public, niveau: "verifie", credits_bienvenue: 3 }`.
- Le tracé de référence, s'il est accepté, n'est **jamais** un instrument réutilisable (I1).

## Revue manuelle (opérateur de vérification)

Chemin interne, hors contrats publics. Rappel de contrainte (`03_rbac`) : l'opérateur ne voit **que** les dossiers `en_revue` (file d'attente), ne conserve **aucune** pièce après décision, et sa décision est journalisée. Aucun endpoint ne permet de consulter un dossier hors file.
