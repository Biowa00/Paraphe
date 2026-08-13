# Suivi du projet Paraphe

> **Mis à jour le 12 août 2026 (soir).**
> Ce fichier dit, en clair, **ce qui est fait**, **ce qui est en cours**, et **ce qui reste à faire**. Il est mis à jour à chaque étape. Pour l'ordre de construction détaillé, voir [docs/ROADMAP.md](docs/ROADMAP.md).

---

## En un coup d'œil

| Domaine | État |
|---|---|
| 📋 Conception (le plan complet) | ✅ Fait |
| ⚙️ Le cœur : signer & sceller un document | ✅ Fait (marche, 92 tests) |
| 🌐 API (l'appli répond à des requêtes) | ✅ Fait |
| ☁️ Sauvegarde en ligne (GitHub) | ✅ Fait |
| 🗄️ Base de données (Supabase) | ✅ Fait (12 tables) |
| 👤 Comptes / inscription vérifiée | ✅ Fait côté backend (chemin « validé », 60 tests) — écran + revue manuelle à venir |
| 🔌 Brancher l'appli entière sur la base | ✅ Fait — boucle complète (inscrire→créer→envoyer→signer→sceller) prouvée sur Postgres |
| 🔍 Vérification publique (authentique ou altéré ?) | ✅ Fait — backend + **premier écran** (page publique) |
| ✍️ Tunnel de signature invité (écran) | ✅ Fait côté écran — tracé + OTP (simulé) → scellement |
| 💳 Crédits Mobile Money (recharge, solde, conso) | ✅ Fait côté backend — achat, webhook idempotent, débit à l'envoi (paiement simulé) |
| 🔑 Connexion (qui est authentifié) | ✅ Fait côté backend — téléphone + OTP → session ; émission réservée aux comptes vérifiés |
| 🖥️ L'écran que verront les utilisateurs | 🔄 Commencé — vérification + signature ; le reste à venir |
| 🚀 Mise en ligne pour de vrais clients | ⏳ À faire (dépend de décisions) |

---

## ✅ Fait

### 📋 Conception
- Tout le dossier de conception rédigé : produit, règles, sécurité, base de données, API, services externes, design, environnements. (`docs/00_brief` → `docs/09_components`)
- Feuille de route, convention « pas de fonctionnalité à moitié », guide d'entretien PME, choix de la technologie. (`docs/ROADMAP.md`, `docs/04_structure_rules`)

### ⚙️ Le cœur (signer & sceller)
- Créer un document (enveloppe), le faire signer, le sceller : **ça fonctionne**, prouvé par **49 tests**.
- Les règles de sécurité clés sont **dans le code et testées** : signature jamais rejouée (I1), code à usage unique à chaque signature (I2), document scellé impossible à modifier (I3), journal impossible à réécrire (I6), contenu chiffré (I7).
- Le dossier de preuve est produit et **signé** (le « cachet » vérifiable).

### 🌐 API
- Un serveur qui répond à de vraies requêtes (`créer`, `envoyer`, `signer` → scellement automatique). Testé, et vérifié en conditions réelles.
- Se lance en local : `npm run dev -w @paraphe/backend-de-confiance`.

### ☁️ Sauvegarde en ligne
- Code sauvegardé sur GitHub : `Biowa00/Paraphe`. 8 sauvegardes (commits) à ce jour.

### 🗄️ Base de données (Supabase)
- **12 tables** créées, avec les règles anti-triche **gravées dans la base** (pas seulement dans le code).
- 3 mises à jour de base appliquées (`0001`, `0002`, `0003`).
- La connexion entre l'appli et la base est **vérifiée**.
- Le code qui enregistre dans la base est écrit et **prouvé** (test aller-retour contre la vraie base, sans laisser de déchet).

### 👤 Inscription vérifiée (créer un vrai compte)
- Le parcours **téléphone + code → pièce (OCR) → selfie (vivacité + face-match) → identifiant public `BJ-XXXX-XXX` + 3 crédits de bienvenue** est codé de bout en bout côté serveur (`POST /v1/inscription`).
- Les règles de sécurité clés sont **dans le code et testées** : le NPI n'est **jamais** stocké en clair, seulement haché (I4) ; aucune image ni donnée biométrique conservée (I5) ; impossible de créer un compte vérifié sans avoir suivi le parcours (I7) ; code à usage unique (I2).
- Un même NPI ne peut ouvrir deux comptes actifs (unicité).
- **Prouvé contre la vraie base** : compte + vérification + crédits enregistrés puis rechargés à l'identique (`npm run verifier:inscription`, transaction annulée, zéro déchet).
- Les fournisseurs réels (OCR, vivacité) ne sont pas encore choisis : on tourne avec des **simulateurs** en attendant (décision ouverte n°4).

### 🔌 Toute l'appli branchée sur la base
- La boucle complète **inscrire → créer → envoyer → signer → sceller** tourne **contre la vraie base** (Supabase), pas seulement en mémoire.
- **Prouvé de bout en bout** : `npm run verifier:boucle` (créateur vérifié réel, document scellé, journal ordonné des 5 événements, cachet vérifiable), le tout dans une transaction annulée → **zéro déchet**, même si un scellé est indestructible (I3).
- Le serveur peut démarrer en mode base avec `PARAPHE_PERSISTENCE=postgres` (défaut : mémoire, pour le dev sans dépendance).

### 🔍 Vérification publique (le moteur d'acquisition)
- N'importe qui peut vérifier un document **sans compte** : on dépose le fichier (ou on saisit la référence du cachet), et le serveur répond **intègre** ou **altéré** (`POST /v1/verification`).
- Réponse : intégrité, **signataires + niveau + date**, statut — **jamais le contenu ni le titre** (I7). Document inconnu ou brouillon → réponse **neutre**, sans fuite.
- **Prouvé contre la vraie base** : document authentique = intègre, document trafiqué = rejeté, recherche par empreinte OK (`npm run verifier:verification`, transaction annulée).
- Périmètre de cette tranche : la couche **intégrité** (empreinte SHA-256). La **re-vérification du cachet serveur** et l'**ancrage public quotidien** viendront avec la clé de scellement stable (KMS) et le support d'ancrage (décisions ouvertes n°6).

### 🖥️ Premier écran : la page publique de vérification
- **La première vraie interface visible.** On dépose un PDF (ou on arrive via `/v/référence` depuis le QR du cachet) et l'écran affiche un **verdict clair** : authentique ✓ / modifié ✗ / aucune correspondance, avec signataires, niveaux et dates.
- Socle front posé : **Vite + React + TypeScript** (workspace `client`), mobile d'abord, aucun secret côté client. Jetons de design en rôles (un seul accent, placeholder marque), accessible (verdict = couleur **+** libellé **+** icône), `prefers-reduced-motion` respecté.
- Le fichier **ne quitte pas l'appareil de façon lisible** : seul son sceau est confronté ; l'écran ne montre jamais le contenu ni le titre (I7).
- Branché sur le vrai backend (`POST /v1/verification`, proxy dev). **Observé de bout en bout** : document authentique → intègre ; document trafiqué → « modifié après signature ». Build de prod OK (~48 kB gzip), 6 tests front.
- Pour le voir : `npm run dev -w @paraphe/backend-de-confiance` (un terminal) + `npm run dev -w @paraphe/client` (un autre) → http://localhost:5173.

### 🔑 Connexion & autorisation (backend)
- **Se connecter** par **téléphone + code OTP frais** (I2) → le backend de confiance délivre un **jeton de session signé** (HS256 ; secret en env dev → KMS en prod). `POST /v1/connexion`.
- **Émission protégée** : créer/envoyer une enveloppe exige une **session valide** ; seul un compte **vérifié** peut émettre (I7). Le créateur est **l'utilisateur connecté** (jamais un champ du corps). Les crédits (solde/achat) sont ceux du connecté. Les invités (signature) restent **sans compte** (I8).
- **Aucun secret côté client** : le client ne fait que porter le jeton (frontière de confiance).
- Décision : **pas Supabase Auth**, on reste portable (relocalisation Bénin = décision n°2). L'**isolation en base (RLS en dur)** est reportée (nécessite un rôle DB restreint) — l'autorisation est portée par le backend pour l'instant.
- Prouvé contre la vraie base : `npm run verifier:connexion` (inscription → connexion → jeton vérifiable ; numéro inconnu refusé).
- Correctif au passage : en mode mémoire (dev), les **crédits de bienvenue** alimentent désormais le **registre partagé** (comme en Postgres) → ils sont dépensables à l'envoi.

### 💳 Crédits Mobile Money — recharge & solde (backend)
- **Registre en ajout seul** : le solde est la **somme** des lignes (bienvenue + achat + consommation), jamais un compteur qu'on écrase.
- Parcours : choisir un **pack** → **achat** (instructions de paiement) → **webhook** de confirmation → solde crédité. `GET /v1/credits/solde`, `GET /v1/credits/packs`, `POST /v1/credits/achat`, `POST /v1/credits/mobile-money/callback`.
- **Idempotence prouvée** : une double notification de l'opérateur ne crédite **jamais** deux fois (verrou + index unique). Un paiement échoué ne débite rien (I8).
- Le **destinataire ne paie jamais** — ces endpoints ne le concernent pas (I8).
- Le fournisseur Mobile Money réel (MTN/Moov) est **simulé** en attendant l'arbitrage (décision n°4) ; le **prix des packs** est un placeholder (dépend des entretiens PME).
- **Consommation** : un crédit est **débité à l'envoi** d'une enveloppe (débit atomique conditionnel) ; **solde nul → l'enveloppe reste en brouillon** (`credits_insuffisants`).
- Migration **`0004`** (table `paiement`) appliquée. **86 tests** (78 backend + 8 front). Prouvé contre la vraie base : `npm run verifier:credits` (bienvenue 3 → achat 10 → solde 13 ; double webhook sans double crédit) ; les preuves boucle/vérification débitent bien un crédit à l'envoi.

### ✍️ Tunnel de signature invité (écran)
- L'écran où un invité **signe un document reçu**, gratuitement, sans compte : ouvrir (`/signer/<enveloppe>/<signataire>`) → **tracer sa signature** (refaite à l'instant, jamais rejouée — I1) → **code de vérification frais** (I2) → confirmation ; scellement automatique au dernier signataire.
- Pad de signature au doigt (canvas), messages d'erreur clairs (tour non venu, déjà scellé, code expiré…).
- Le **code OTP est simulé** en attendant le vrai WhatsApp/SMS (décision ouverte n°4) — indiqué honnêtement à l'écran.
- Le backend expose désormais le **niveau d'identité exigé** par signataire (pour piloter l'écran).
- **Observé bout en bout** au niveau HTTP : ouvrir → OTP → signer → scellé ; un rejeu du même code est rejeté. **76 tests verts** (68 backend + 8 front).

---

## 🔄 En cours (commencé, pas terminé)

- **Chemins d'inscription non « validé ».** Quand le face-match est **intermédiaire**, le dossier part en **revue manuelle** (opérateur) — cette file d'attente et l'écran opérateur ne sont pas encore construits. Le tunnel en 3 écrans avec **envoi réel des photos** (et leur purge) viendra avec l'interface.
- **Vérification publique — raffinements.** L'intégrité marche ; restent le **cachet re-vérifiable** (clé KMS stable) et l'**ancrage quotidien** (« même nous ne pouvons pas modifier »).

---

## ⏳ À faire

### Prochaine étape (au choix)
- **🖥️ Écrans émetteur** : connexion + créer/envoyer une enveloppe + recharger son solde (la connexion backend est prête).
- **📁 Archive personnelle** (S6) : lister ses documents + télécharger le dossier de preuve (la connexion permet de cloisonner).
- **🔒 RLS en dur** (durcissement) : isolation au niveau base avec un rôle DB restreint.

### Ensuite
- **📁 Archive personnelle** (retrouver ses documents signés).

### Plus tard
- **🖥️ L'interface** (l'écran) que verront les utilisateurs.
- **🔌 Brancher les vrais services** : WhatsApp/SMS (codes OTP), pièce d'identité + selfie, Mobile Money (paiement), horodatage officiel, coffre à clés (KMS), stockage des documents.
- **🏢 V2 entreprise** (comptes société, rôles, modèles, facturation) puis **V3 archivage**.

### 🧭 Décisions à prendre (par toi, à un moment)
- **Localisation des données au Bénin** — bloquant avant d'ouvrir au public / mettre de vraies données. *(en attendant : données de test seulement)*
- Fournisseurs (SMS/WhatsApp, pièce d'identité, Mobile Money, horodatage).
- Prix d'un crédit · support de l'ancrage public · confirmation du format PAdES · sort du « tracé de référence ».

### 📋 Démarches (en parallèle, hors code)
- ~~ANIP~~ **abandonné (12/08/2026)** → identité via fournisseur KYC commercial. ASIN (registre), **APDP (bloquant avant mise en ligne)**, avis d'un avocat, 10 entretiens PME (guide prêt : `docs/00_brief/GUIDE-ENTRETIEN-PME.md`).

---

## 🕒 Historique daté

### 12 août 2026 — journée de démarrage
- Toute la documentation de conception rédigée (10 dossiers).
- Feuille de route, convention de fonctionnalité, guide d'entretien PME.
- Cœur du produit codé : empreinte, journal (I6), machine à états (I3), signature (I1/I2), scellement + dossier de preuve.
- Boucle complète prouvée : créer → envoyer → signer → sceller.
- API HTTP (Fastify) montée et vérifiée.
- Dépôt GitHub créé et code poussé (`Biowa00/Paraphe`).
- Base Supabase : 12 tables créées (migrations `0001`, `0002`), puis ordre des événements (`0003`).
- Connexion appli ↔ base vérifiée ; adaptateur Postgres écrit et prouvé par aller-retour.

### 12 août 2026 (soir) — inscription vérifiée (backend)
- Parcours d'inscription vérifiée codé de bout en bout : OTP → OCR pièce → vivacité/face-match → identifiant public `BJ-XXXX-XXX` → 3 crédits de bienvenue.
- Invariants gravés et testés : NPI haché jamais en clair (I4), aucune image/biométrie conservée (I5), pas de compte vérifié sans parcours (I7), code à usage unique (I2), unicité du NPI.
- Adaptateurs simulés pour OCR/vivacité (fournisseurs réels = décision ouverte n°4) ; hachage NPI = HMAC-SHA256 + pepper.
- Route `POST /v1/inscription` ajoutée. **60 tests verts** (+11).
- Prouvé contre la vraie base : `npm run verifier:inscription` (compte + vérif + 3 crédits, rechargés identiques, transaction annulée).

### 12 août 2026 (soir) — toute la boucle branchée sur Postgres
- Dépôts « liés à un client » (enveloppes + utilisateurs) pour enchaîner plusieurs opérations dans une seule transaction.
- `compositionPostgres()` + interrupteur `PARAPHE_PERSISTENCE=postgres` (le serveur peut tourner sur la vraie base).
- Boucle complète **inscrire → créer → envoyer → signer → sceller** prouvée contre la vraie base : `npm run verifier:boucle` (journal ordonné des 5 événements, cachet vérifiable, transaction annulée, zéro déchet). 60 tests toujours verts.

### 13 août 2026 — vérification publique (backend)
- `POST /v1/verification` (sans compte) : dépôt d'un document ou d'une référence → **intègre / altéré** + signataires, niveaux, dates. Ne divulgue jamais le contenu ni le titre (I7) ; document inconnu ou brouillon → réponse neutre.
- Cas couverts : document authentique, altéré (`modifie_apres_signature`), inconnu (`aucune_correspondance`), recherche par empreinte, référence seule, crypto-shredding (`contenu: "efface"`).
- Port `DepotVerification` + adaptateurs mémoire et Postgres (lecture seule). **68 tests verts** (+8).
- Prouvé contre la vraie base : `npm run verifier:verification` (authentique = intègre, trafiqué = rejeté, transaction annulée).
- Périmètre : couche intégrité (SHA-256). Cachet re-vérifiable + ancrage quotidien = raffinements suivants (clé KMS stable, support d'ancrage).

### 13 août 2026 — premier écran : page publique de vérification
- Socle front posé : workspace `client` (Vite + React + TypeScript), mobile d'abord, aucun secret ; jetons de design en rôles, accessible, `prefers-reduced-motion`.
- Page de vérification : dépôt d'un PDF ou arrivée via `/v/référence` → verdict clair (authentique / modifié / aucune correspondance) + signataires, niveaux, dates ; ne montre jamais le contenu ni le titre (I7).
- Branchée sur le vrai backend (`POST /v1/verification`, proxy dev). Observé bout en bout au niveau HTTP (authentique = intègre, trafiqué = « modifié après signature »). Build prod ~48 kB gzip.
- **74 tests verts** (68 backend + 6 front). Pour voir l'écran : backend `npm run dev -w @paraphe/backend-de-confiance` + client `npm run dev -w @paraphe/client` → http://localhost:5173.

### 13 août 2026 — crédits Mobile Money : recharge & solde (backend)
- Migration `0004` (table `paiement`) appliquée à la base.
- Registre de crédits (solde = somme, ajout seul), packs, achat, webhook opérateur **idempotent** (jamais de double crédit) ; échec → solde inchangé (I8).
- Opérateur Mobile Money **simulé** (réel = décision n°4) ; prix des packs = placeholder.
- 4 endpoints crédits. **84 tests verts** (+8). Prouvé contre la vraie base (`npm run verifier:credits` : bienvenue 3 → achat 10 → solde 13 ; double webhook sans double crédit).
- Complément le même jour : **débit d'un crédit à l'envoi** (atomique conditionnel) ; solde nul → enveloppe reste en brouillon (`credits_insuffisants`). **86 tests verts**.

### 13 août 2026 — connexion & autorisation (backend)
- **Connexion téléphone + OTP frais** → jeton de session signé par le backend (`POST /v1/connexion`). Décision : pas Supabase Auth (portabilité).
- **Émission protégée** : créer/envoyer + crédits exigent une session ; seul un compte **vérifié** peut émettre (I7) ; créateur = utilisateur connecté.
- Adaptateur session (JWT HS256 sans dépendance), `parTelephone` (mémoire/Postgres). Correctif : crédits de bienvenue dans le registre partagé en dev.
- **92 tests verts** (84 backend + 8 front). Prouvé contre la vraie base (`npm run verifier:connexion`). RLS en dur reportée (rôle DB restreint).

### 13 août 2026 — tunnel de signature invité (écran)
- Deuxième écran : parcours de signature invité (`/signer/<enveloppe>/<signataire>`) — tracé au doigt (canvas, I1), OTP frais à l'instant (I2, simulé), confirmation, scellement auto.
- Backend : GET enveloppe expose désormais `niveauIdentiteExige` + `mode` (pour piloter l'écran).
- Mapping des codes d'erreur → messages humains (tour non venu, scellé, expiré…).
- **76 tests verts** (68 backend + 8 front). Observé bout en bout au niveau HTTP (ouvrir → OTP → signer → scellé ; rejeu rejeté).

*(Les prochaines dates s'ajouteront ici au fil de l'eau.)*
