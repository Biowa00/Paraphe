# ROADMAP — Paraphe

> **À quoi sert ce fichier.** Fixer l'ordre de livraison, à la manière dont une équipe sérieuse construit un produit : par **tranches verticales complètes** (`04_structure_rules/04`), chacune livrée de bout en bout, mesurée, puis itérée. Pas de couches horizontales à moitié posées.
> **Quand le lire.** Pour décider quoi construire ensuite, et pour situer une fonctionnalité dans le temps.
> **Dépend de.** `00_brief` §8 et §12 (lots, prochaines étapes), `01_features`, `04_structure_rules/04`.

## Principe de livraison

1. **Découvrir avant de construire** — valider le besoin réel (entretiens PME) avant d'écrire du code.
2. **Tranches verticales fines mais complètes** — la plus petite version qui traverse toutes les couches et rend un service réel. Chaque tranche respecte la *Definition of Done* (`04_structure_rules/04`).
3. **Livrer, mesurer, itérer** — on regarde ce qui se passe (taux de signature, abandon, délai) avant d'empiler la suite.
4. **Les invariants d'abord** — aucune tranche n'est « faite » si un invariant qu'elle touche n'est pas testé.

Les jalons ci-dessous sont ordonnés par **dépendance et valeur**, pas par confort technique.

---

## Phase 0 — Avant la première ligne de code (démarches en parallèle)

Ces éléments **ne bloquent pas** l'écriture de la doc, mais certains **bloquent la mise en production**. Ils viennent du cahier §12.

| Action | Interlocuteur | Nature |
|---|---|---|
| ~~Convention d'accès ANIP~~ — **abandonnée (12/08/2026)** | ANIP | Vérification d'identité via **fournisseur KYC commercial** ; logique v1 (OCR+selfie+OTP) inchangée |
| Registre des prestataires de confiance agréés | ASIN | Renseignement |
| Déclaration/autorisation de traitement | APDP | **Bloquante avant prod** |
| Avis d'un avocat béninois sur un cas type de dossier de preuve | Conseil juridique | Réduit le risque contentieux |
| ~10 entretiens PME ([guide prêt à l'emploi](00_brief/GUIDE-ENTRETIEN-PME.md)) | Marché | Tranche la **question ouverte n°1** (quels documents = quels modèles V1) |
| Prototype cliquable du tunnel signataire, testé chronomètre en main | 10 utilisateurs non initiés | Valide l'ergonomie avant de coder |
| Vérifier la **localisation des données** applicable au Bénin | Juridique/technique | **Bloquante avant prod** (`08_environments/03`) |

**Sortie de phase 0** : besoin validé, cadre juridique engagé, prototype éprouvé. *Puis seulement* on démarre la V1.

---

## Phase 1 — V1, le produit vendable (objectif : 3 mois)

Construite en tranches verticales, dans cet ordre :

- **S1 · Socle de confiance & preuve.** Chiffrement par enveloppe + KMS, journal en ajout seul + réplication externalisée, empreinte SHA-256, scellement + dossier de preuve + cachet serveur. *C'est la fondation ; rien de vendable sans elle.*
  - ✅ *Domaine* : `empreinte` (SHA-256), `journal` (ajout seul, I6), `machine à états` (I3).
  - ✅ *Scellement bout en bout* : ports + adaptateurs **dev** (chiffrement par enveloppe AES-256-GCM, stockage WORM, cachet serveur Ed25519), cas d'usage `scellerEnveloppe`, dossier de preuve signé.
  - ✅ *Signature (I1/I2)* : cas d'usage `signerEnveloppe` — OTP frais à usage unique lié à l'action (I2), tracé requis à l'instant jamais rejoué (I1), gardes de niveau d'identité / tour / état. Guichet OTP dev.
  - ✅ *Boucle complète (local)* : `creerEnveloppe`, `envoyerEnveloppe`, `traiterSignature` + dépôt en mémoire ; scénario `créer → envoyer → signer×2 → sceller` prouvé de bout en bout (journal ordonné des 7 événements, cachet vérifiable).
  - ✅ *Exposition HTTP (Fastify)* : routes `POST /v1/enveloppes`, `/envoi`, `/signature` (scellement auto au dernier signataire), `GET /v1/enveloppes/:id`, `/v1/sante`, OTP dev. Validation Zod, mapping code métier → statut HTTP. Serveur lançable en local (`npm run dev`), boucle vérifiée en curl réel.
  - **49 tests verts** (dont 5 d'API via `inject`).
  - ✅ *Persistance Postgres* : base Supabase branchée (`.env`, `DATABASE_URL`) ; migration `0003` (ordre des événements) appliquée ; adaptateur `DepotEnveloppesPostgres` écrit et **prouvé par un aller-retour contre la vraie base** (créer → recharger, transaction annulée, zéro résidu).
  - ✅ *Boucle branchée sur Postgres* : `compositionPostgres()` + interrupteur `PARAPHE_PERSISTENCE=postgres` ; boucle complète (inscrire→créer→envoyer→signer→sceller) **prouvée contre la vraie base** (`npm run verifier:boucle`), dans une transaction annulée (zéro déchet).
  - ✅ *Connexion (backend)* : téléphone + OTP frais → **jeton de session signé** par le backend de confiance (`POST /v1/connexion`, pas Supabase Auth). Émission réservée aux comptes **vérifiés** (I7) ; créateur = utilisateur connecté ; invités sans compte (I8). Prouvé (`npm run verifier:connexion`).
  - ⏳ *Suite* : **RLS en dur** en base (rôle DB restreint — durcissement, aujourd'hui l'autorisation est portée par le backend) ; adaptateurs KMS/stockage S3 en production ; secret de session au KMS.
- **S2 · Inscription vérifiée (niveau 2).** OTP, OCR pièce, vivacité, face-match, identifiant public, revue manuelle. *Sans émetteur vérifié, personne n'envoie.*
  - ✅ *Chemin « validé » bout en bout (backend)* : cas d'usage `inscrireCompteVerifie` — OTP frais consommé (I2/I7), OCR (port + adaptateur dev), vivacité + face-match (port + adaptateur dev), **NPI haché HMAC+pepper jamais en clair (I4)** + unicité, **aucune image/biométrie conservée (I5)**, identifiant public `BJ-XXXX-XXX`, 3 crédits de bienvenue. Ports `HacheurNpi`/`ServiceOcrPiece`/`ServiceBiometrie`/`DepotUtilisateurs` ; dépôts mémoire + **Postgres (transaction atomique compte+vérif+crédits)**.
  - ✅ *Exposition HTTP* : `POST /v1/inscription`. **60 tests verts** ; aller-retour prouvé contre la vraie base (`npm run verifier:inscription`).
  - ⏳ *Suite* : file de **revue manuelle** opérateur (scores intermédiaires → `en_revue`, chemin interne `03_rbac`) ; tunnel 3 écrans multipart avec **envoi + purge réels des images (I5)** ; branchement des fournisseurs réels OCR/vivacité/OTP (décision ouverte n°4) ; hacheur NPI adossé au **KMS** (pepper hors process).
- **S3 · Boucle de signature (le cœur).** Créer/envoyer une enveloppe → signature invité (OTP frais + tracé, niveaux OTP-seul/Standard/Renforcé) → scellement automatique. *La tranche qui rend le produit réel.*
  - ✅ *Backend* : boucle complète créer→envoyer→signer→sceller (voir S1) ; GET enveloppe expose le niveau exigé + le mode.
  - ✅ *Écran signataire invité* : `/signer/<enveloppe>/<signataire>` — tracé au doigt (canvas, I1), OTP frais à l'instant (I2, simulé en dev), confirmation, scellement auto. Messages d'erreur mappés. Observé bout en bout.
  - ⏳ *Suite* : rendu du **document en lecture seule** (nécessite stockage/déchiffrement), **selfie/vivacité** au niveau Standard, **refus de signer** (`POST /refus`), vrai canal OTP (décision n°4).
- **S4 · Vérification publique.** La page sans compte + endpoint d'ancrage. *Le levier d'acquisition ; chaque document scellé y ramène du monde.*
  - ✅ *Vérification d'intégrité (backend)* : `POST /v1/verification` (sans compte) — dépôt document/référence → intègre/altéré + signataires/niveaux/dates, **sans divulguer le contenu ni le titre (I6/I7)** ; document inconnu ou brouillon → réponse neutre. Port `DepotVerification` + adaptateurs mémoire/Postgres. **68 tests verts** ; prouvé contre la vraie base (`npm run verifier:verification`).
  - ✅ *Page publique (1er écran)* : workspace `client` (Vite + React, mobile d'abord, aucun secret) ; dépôt PDF ou `/v/référence` → verdict clair + signataires/niveaux/dates, sans divulguer le contenu (I7). Branchée sur `POST /v1/verification`, observée bout en bout ; 6 tests front.
  - ⏳ *Suite* : **re-vérification du cachet serveur** (clé de scellement stable au KMS) ; **ancrage public quotidien** + `GET /v1/ancrage/{date}` (support = décision ouverte n°6).
- **S5 · Crédits Mobile Money.** Solde, packs, 3 crédits de bienvenue non expirants, webhook idempotent. *L'encaissement.*
  - ✅ *Recharge & solde (backend)* : registre en ajout seul (solde = somme), packs, `POST /credits/achat`, webhook `mobile-money/callback` **idempotent** (double notification sans double crédit), échec sans débit (I8). Opérateur MM **simulé** (réel = décision n°4), prix = placeholder. Migration `0004` (table `paiement`). Prouvé contre la vraie base (`npm run verifier:credits`).
  - ✅ *Consommation* : **débit d'1 crédit à l'envoi** (atomique conditionnel) ; solde nul → l'enveloppe reste en brouillon (`credits_insuffisants`). Prouvé (les preuves boucle/vérification débitent un crédit).
  - ⏳ *Suite* : branchement d'un vrai fournisseur Mobile Money + **webhook signé / réconciliation** ; écran de recharge (UI).
- **S6 · Archive personnelle.** Liste, consultation, téléchargement du dossier de preuve.

**Sortie de V1 (critères)** : une PME réelle s'inscrit, envoie, fait signer un invité, obtient un document scellé + preuve ; n'importe qui vérifie publiquement ; le paiement fonctionne. Interface mobile d'abord, 3G acceptable. *Dossier APDP et localisation validés avant d'ouvrir au public.*

---

## Phase 2 — V2, l'entreprise (mois 4 à 8)

Tranches, une fois la V1 en usage réel :

- Compte entreprise (IFU/RCCM/représentant légal).
- Sièges, rôles, habilitations (cumul permis, sauf émetteur=validateur).
- Circuit de validation interne.
- Modèles de documents réutilisables (nourris par la question ouverte n°1).
- Archive partagée + recherche sur métadonnées.
- Facturation centralisée par siège + export comptable.
- Tableau de bord entreprise + relances automatiques.
- Interface signataire en **fon et yoruba**.

---

## Phase 3 — V3, archivage & numérisation (mois 9 à 18)

- Import/numérisation du papier existant.
- OCR + recherche plein texte du contenu.
- Classement, métadonnées, durées de conservation.
- API d'intégration aux outils métier.
- Éventuelle demande d'agrément prestataire de services de confiance.

---

## Ordre de fond (rappel du cahier)

**Signature → archivage → numérisation.** L'archive se remplit d'elle-même avec les documents signés ; la numérisation de l'existant est un outil de rétention, pas d'acquisition. La placer en tête retarderait la première vente de plus d'un an.
