# Suivi du projet Paraphe

> **Mis à jour le 12 août 2026.**
> Ce fichier dit, en clair, **ce qui est fait**, **ce qui est en cours**, et **ce qui reste à faire**. Il est mis à jour à chaque étape. Pour l'ordre de construction détaillé, voir [docs/ROADMAP.md](docs/ROADMAP.md).

---

## En un coup d'œil

| Domaine | État |
|---|---|
| 📋 Conception (le plan complet) | ✅ Fait |
| ⚙️ Le cœur : signer & sceller un document | ✅ Fait (marche, 49 tests) |
| 🌐 API (l'appli répond à des requêtes) | ✅ Fait |
| ☁️ Sauvegarde en ligne (GitHub) | ✅ Fait |
| 🗄️ Base de données (Supabase) | ✅ Fait (12 tables) |
| 🔌 Brancher l'appli entière sur la base | 🔄 En cours (bloqué par « les comptes ») |
| 👤 Comptes / inscription | ⏳ À faire (prochaine étape) |
| 🖥️ L'écran que verront les utilisateurs | ⏳ À faire |
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

---

## 🔄 En cours (commencé, pas terminé)

- **Brancher l'appli entière sur la base.** Le code d'enregistrement existe et marche, mais il n'est pas encore utilisé par tout le parcours, car la base **exige un créateur réel et enregistré** pour chaque document. → débloqué par « les comptes » ci-dessous.

---

## ⏳ À faire

### Prochaine étape
- **👤 Comptes / inscription** (version simple d'abord) : créer de vrais utilisateurs, pour que la base accepte les documents. Débloque le branchement complet sur Postgres.

### Ensuite
- **🔒 Règles d'accès détaillées (RLS)** dans la base — une fois qu'on sait comment un utilisateur prouve son identité.
- **🔍 Page de vérification publique** (le moteur d'acquisition : prouver qu'un document est authentique).
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
- ANIP (vérification d'identité), ASIN (registre), **APDP (bloquant avant mise en ligne)**, avis d'un avocat, 10 entretiens PME (guide prêt : `docs/00_brief/GUIDE-ENTRETIEN-PME.md`).

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

*(Les prochaines dates s'ajouteront ici au fil de l'eau.)*
