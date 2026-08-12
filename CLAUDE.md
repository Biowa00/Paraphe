# CLAUDE.md — Paraphe

Ce fichier est la **carte**, pas le savoir. Lisant ceci seul, tu dois savoir quels deux ou trois fichiers ouvrir pour une tâche — et lesquels ne pas ouvrir. Aucun contenu dupliqué depuis un autre fichier. Plafond : 200 lignes.

Documentation en **français**. Identifiants du domaine (tables, entités, colonnes) en **français** — langage métier du cahier §6 (arbitrage amendant le brief §8). Code technique générique sans portée métier : anglais admis. Détail `04_structure_rules/01-nommage.md`.

---

## Le produit en trois phrases

**Positionnement (accroche) : « Signé. Scellé. Incontestable. »** — *Prouvez qui a signé quoi, quand — et que rien n'a bougé depuis.*

Paraphe est une plateforme béninoise de signature électronique **avancée** (pas qualifiée) et d'archivage à valeur probante, mobile d'abord, canal WhatsApp, paiement Mobile Money. On dépose un document dans une **enveloppe**, on désigne des signataires qui signent à distance après vérification d'identité, l'enveloppe est **scellée** avec un dossier de preuve opposable et vérifiable publiquement. Le problème résolu n'est pas « signer sans se déplacer » : c'est **prouver qui a signé quoi, quand, et que rien n'a bougé depuis**.

---

## Les huit invariants — non négociables, jamais résumés

| # | Invariant |
|---|---|
| I1 | Une signature tracée n'est **jamais** stockée puis rejouée sur un document. Le signataire retrace à chaque signature. |
| I2 | Chaque signature exige un **OTP frais**, pas seulement une session valide. |
| I3 | Une enveloppe scellée ne peut être **ni modifiée ni supprimée**, par personne, y compris l'exploitant, y compris en base. |
| I4 | Le NPI n'est jamais stocké en clair — haché uniquement. |
| I5 | Les images de pièces d'identité sont purgées après vérification. |
| I6 | Le journal d'événements est en **ajout seul**, et répliqué hors du contrôle des administrateurs de la plateforme. |
| I7 | Aucun compte interne ne peut lire le contenu d'un document, signer au nom d'un tiers, ni créer un compte vérifié sans parcours d'identification effectif. |
| I8 | Signer est **toujours gratuit** pour le destinataire, sans limite de temps ni de volume. |

Conséquence lourde de I7 : si la stack expose une clé d'administration qui contourne les règles d'accès, l'invariant est violé **par construction**. À traiter au choix de stack, pas après.

## Règle de construction — non négociable

**Aucune fonctionnalité à moitié.** On construit en **tranche verticale complète** (logique → droits → base+RLS → API → services+plan B → UI → tests d'invariants → vérification bout en bout), ou on ne commence pas. Une case concernée non cochée = fonctionnalité **en cours**, jamais « faite ». Convention et checklist : `04_structure_rules/04-cycle-fonctionnalite.md`. Ordre de livraison : `docs/ROADMAP.md`.

---

## Décisions d'architecture déjà résolues

Ces trois-là sont des contraintes d'entrée pour `02_logic` et `07_database`.

- **Chiffrement** : par enveloppe, clés dans un **KMS séparé** de la base. Effacement = **crypto-shredding** (destruction de la clé), jamais suppression de l'enveloppe. Réconcilie I3 et l'obligation d'effacement APDP.
- **Niveaux d'identité exigibles** (3) : *OTP seul* (faible enjeu) · *Standard* = OTP + selfie/vivacité (invité, pas de face-match faute de portrait de référence) · *Renforcé* = OTP + pièce + face-match (compte vérifié).
- **Hash NPI** (précise I4) : **HMAC-SHA256 + pepper au KMS**, déterministe pour garantir l'unicité d'un compte. Pas de sel aléatoire par enregistrement.
- **Effacement** : **crypto-shredding** sur demande légalement fondée uniquement, **double contrôle**, tracé en ajout seul, **client notifié**. Jamais automatique ni silencieux. Détail `02_logic/04`.
- **Cachet serveur** : clé de scellement **au KMS, auto-gérée**, rotation, empreinte publique ancrée. Statut « avancée », pas de certificat d'AC en v1. Détail `02_logic/02`.

---

## Table de routage — type de tâche → fichiers à lire

| Tâche | Ouvrir |
|---|---|
| Comprendre le produit, le cadrage, un terme | `docs/00_brief/` (brief, cahier, glossaire) |
| Savoir quoi construire ensuite, situer dans le temps | `docs/ROADMAP.md` |
| Construire une fonctionnalité (règle bout en bout, checklist) | `docs/04_structure_rules/04-cycle-fonctionnalite.md` |
| Spécifier / modifier une fonctionnalité | `docs/01_features/` + la fiche concernée |
| Cycle de vie enveloppe, chaîne de preuve, règles d'identité, chiffrement | `docs/02_logic/` |
| Qui a le droit de quoi (utilisateurs, rôles internes, matrice) | `docs/03_rbac/` |
| Schéma, contraintes, politiques d'accès en base | `docs/07_database/` |
| Contrat d'un endpoint, formats requête/réponse, erreurs | `docs/05_api_contracts/` |
| Choisir/brancher un service externe, coût, plan B | `docs/06_services_catalog/` |
| Conventions de code, nommage, arborescence applicative | `docs/04_structure_rules/` |
| Variables, secrets, environnements, déploiement | `docs/08_environments/` |
| Design system, composant, cachet PDF, landing, page de vérification | `docs/09_components/` |

Ne pas ouvrir tout `docs/` par réflexe. La table ci-dessus suffit à cibler.

---

## État d'avancement des dossiers

| Dossier | État |
|---|---|
| `00_brief/` | **rédigé** — brief, cahier des charges, glossaire. |
| `01_features/` | **rédigé** — 13 fiches (6 V1 + 7 V2) + index. Une fiche par parcours. |
| `02_logic/` | **rédigé** — états d'enveloppe, chaîne de preuve, règles d'identité, archi. chiffrement. |
| `03_rbac/` | **rédigé** — rôles utilisateurs, rôles internes, matrice de permissions. |
| `04_structure_rules/` | **rédigé** — nommage (domaine FR), arborescence (frontière de confiance), conventions transverses. Stack-agnostique. |
| `05_api_contracts/` | **rédigé** — conventions, identité, enveloppes, vérif. publique, crédits, entreprise (V2). |
| `06_services_catalog/` | **rédigé** — notif/OTP, identité, horodatage, Mobile Money, KMS/infra. Fournisseurs = candidats, non tranchés. |
| `07_database/` | **rédigé** — schéma, contraintes, RLS (isolation `service_role`), migrations. |
| `08_environments/` | **rédigé** — environnements, secrets, hébergement/localisation (bloquant), déploiement/sauvegarde/journal externalisé. |
| `09_components/` | **rédigé** — jetons (principes), composants, cachet PDF, landing, page de vérification. |

Ordre de rédaction retenu : `00 → 01 → 02 → 03 → 07 → 05 → 06 → 04 → 08 → 09`. La note d'architecture de chiffrement est produite **dans `02`**, pas déduite du choix de stack.

---

## Décisions ouvertes — en attente d'arbitrage

1. ~~**Stack technique**~~ — **RÉSOLUE** : TypeScript full-stack portable (npm workspaces · Vite/React · Fastify/Node · Postgres · stockage objet WORM · KMS séparé). Détail `04_structure_rules/05-stack.md`.
2. **Hébergement** — vérifier les obligations de localisation des données applicables au Bénin avant de fixer une région.
3. **Prix unitaire du crédit** — dépend des entretiens PME.
4. **Fournisseurs** — OTP/SMS, WhatsApp Business, OCR + vivacité, horodatage, Mobile Money. Arbitrer sur coût, couverture Bénin, fiabilité.
5. **Format de scellement** — chaîne de preuve **conçue autour de PAdES (LTV)** ; confirmation formelle subordonnée à une évaluation technique.
6. **Support d'ancrage public quotidien** — blockchain, OpenTimestamps, dépôt notarié, presse ? Non tranché.
7. **Tracé de référence** — le conserver (aplati, affichage seul) ou pas du tout ? Le produit marche sans ; tout stockage réutilisable frôle I1. À trancher avant implémentation (`07_database/01`).

---

## Conventions transverses

- **Mobile d'abord**, fonctionnement acceptable en 3G, poids des pages maîtrisé.
- **WhatsApp puis SMS** en canaux principaux ; e-mail en secours.
- **Signature avancée uniquement** : ne jamais revendiquer la présomption légale de fiabilité.
- **Une décision non prise se note ici** (section ci-dessus), jamais comblée par une hypothèse silencieuse.
- Chaque fichier de `docs/` s'ouvre par un en-tête court : à quoi il sert, quand le lire, de quoi il dépend.
- L'objet pivot est **l'enveloppe**, pas le document.
- Une entreprise peut envoyer à **n'importe qui** ; les externes signent en invités.
- **Backend de confiance** pour tout le sensible (identité, OTP, signature, scellement, KMS, crédits) ; lecture directe PostgREST/RLS tolérée pour le trivial. Toute feature exigeant `service_role` sur une donnée client est mal conçue.
- **Métadonnées sensibles chiffrées au repos** (dont le `titre` d'enveloppe). La base ne détient jamais de clair de document ni de clé.
