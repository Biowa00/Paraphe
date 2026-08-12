# PARAPHE — Brief de démarrage

**À lire en premier. Ce document est le point d'entrée du projet.**

---

## 0. Ce qu'on fait maintenant, et ce qu'on ne fait pas

Tu es sur un dépôt vide. Nous allons construire ensemble la **documentation de conception** de Paraphe, avant toute ligne de code applicatif.

**Ne code rien.** Pas de `npm init`, pas de scaffolding, pas de composant. La sortie de cette phase est un ensemble de fichiers Markdown.

**Ne crée pas non plus toute l'arborescence d'un coup.** On avance dossier par dossier, dans l'ordre. Pour chaque dossier :

1. Tu me poses les questions ouvertes que ce dossier soulève
2. On en discute
3. Tu rédiges les fichiers de ce dossier
4. Tu mets à jour `CLAUDE.md`
5. On passe au suivant

Si une décision manque, **demande — n'invente pas**. Un choix inventé et écrit dans un fichier de spec devient une contrainte que personne n'a validée.

Un fichier `CAHIER-DES-CHARGES.md` accompagne ce brief dans `00_brief/`. Il contient le détail complet. Ce document-ci en est la version opérationnelle, pas un résumé fidèle : en cas de contradiction, **ce document fait foi**.

---

## 1. Le produit en dix lignes

**Paraphe** est une plateforme béninoise de signature électronique et d'archivage à valeur probante.

Une entreprise ou un particulier dépose un document, désigne des signataires, les signataires signent à distance depuis leur téléphone après vérification de leur identité, et le document est scellé avec un dossier de preuve opposable.

Le problème résolu n'est pas « signer sans se déplacer ». C'est : **prouver qui a signé quoi, quand, et que rien n'a bougé depuis.**

Marché : Bénin, PME d'abord. Mobile d'abord, WhatsApp comme canal principal, Mobile Money comme moyen de paiement.

---

## 2. Les invariants — non négociables

Ces règles priment sur toute considération de confort, de délai ou d'élégance technique. Si une décision d'implémentation les met en cause, c'est l'implémentation qui change.

| # | Invariant |
|---|---|
| I1 | Une signature tracée n'est **jamais** stockée puis rejouée sur un document. Le signataire retrace à chaque signature. |
| I2 | Chaque signature exige un **OTP frais**, pas seulement une session valide. |
| I3 | Une enveloppe scellée ne peut être **ni modifiée ni supprimée**, par personne, y compris l'exploitant, y compris en base. |
| I4 | Le NPI n'est jamais stocké en clair — hachage salé uniquement. |
| I5 | Les images de pièces d'identité sont purgées après vérification. |
| I6 | Le journal d'événements est en **ajout seul**, et répliqué hors du contrôle des administrateurs de la plateforme. |
| I7 | Aucun compte interne ne peut lire le contenu d'un document, signer au nom d'un tiers, ni créer un compte vérifié sans parcours d'identification effectif. |
| I8 | Signer est **toujours gratuit** pour le destinataire, sans limite de temps ni de volume. |

L'invariant I7 a une conséquence architecturale lourde : **si la stack retenue expose une clé d'administration qui contourne les règles d'accès, l'invariant est violé par construction.** À traiter explicitement au moment du choix de stack, pas après.

---

## 3. Décisions déjà prises

- **Nom** : Paraphe. Dépôt OAPI en semi-figuratif prévu (le mot seul est faiblement distinctif).
- **Trois niveaux de compte** : Invité (aucune inscription, signe par lien) · Vérifié (identité confirmée une fois) · Entreprise (IFU + RCCM + représentant légal).
- **Une entreprise peut envoyer à n'importe qui**, membre ou non. Les externes signent en invités.
- **L'objet pivot du modèle de données est l'enveloppe**, pas le document.
- **Ordre de construction** : signature → archivage → numérisation. La numérisation de l'existant papier est en V3, pas avant.
- **Modèle éco** : 3 signatures offertes à l'inscription pour les particuliers, sans expiration. Crédits prépayés en Mobile Money pour les PME. Abonnement par siège pour les entreprises structurées.
- **Identification v1** : OCR de la pièce d'identité + selfie avec détection de vivacité + OTP. Pas de biométrie stockée. L'accès aux services de l'ANIP est une démarche en cours, pas une dépendance de la v1.
- **Statut juridique** : signature **avancée**, pas qualifiée. On ne revendique jamais la présomption légale de fiabilité.

---

## 4. Décisions ouvertes — à trancher ensemble

Ne les tranche pas seul. Elles sont listées ici pour que tu saches quoi me demander.

1. **Stack technique.** Non arrêtée. Contrainte dominante : l'invariant I7. Le sujet du chiffrement des documents et de la séparation des clés doit être résolu avant de choisir, pas déduit du choix.
2. **Hébergement.** Vérifier les obligations de localisation des données applicables au Bénin avant de fixer une région.
3. **Prix unitaire du crédit.** Dépend des entretiens PME à mener.
4. **Fournisseurs** : OTP/SMS, WhatsApp Business, OCR et vivacité, horodatage, Mobile Money. À arbitrer sur coût, couverture Bénin et fiabilité.
5. **Format de scellement** : PAdES à évaluer sérieusement avant toute solution maison.

---

## 5. Structure cible du dépôt

```
├── CLAUDE.md              ← mémoire permanente de l'agent
├── .claudeignore
├── .gitignore
└── docs/
    ├── 00_brief/           ← ce document + cahier des charges + glossaire
    ├── 01_features/        ← une fiche par fonctionnalité, numérotée
    ├── 02_logic/           ← machine à états, chaîne de preuve, règles d'identité
    ├── 03_rbac/            ← rôles utilisateurs, rôles internes, matrice de permissions
    ├── 04_structure_rules/ ← conventions de code, nommage, arborescence applicative
    ├── 05_api_contracts/   ← contrats d'endpoints, schémas de requête/réponse, erreurs
    ├── 06_services_catalog/← services externes, ce qu'ils font, ce qu'ils coûtent, plan B
    ├── 07_database/        ← schéma, contraintes, politiques d'accès, migrations
    ├── 08_environments/    ← variables, secrets, environnements, déploiement
    └── 09_components/      ← design system, inventaire de composants, landing page
```

**Ordre de rédaction proposé** : `00` → `01` → `02` → `03` → `07` → `05` → `06` → `04` → `08` → `09`.

La logique et les rôles avant la base ; la base avant l'API ; l'API avant les conventions de code. Le design en dernier, quand on sait ce qu'on affiche. Propose un autre ordre si tu le juges meilleur, mais argumente.

---

## 6. Le rôle de CLAUDE.md

`CLAUDE.md` est le seul fichier lu à chaque session. **Il ne contient pas le savoir du projet : il contient la carte qui permet d'aller le chercher.**

Sa règle de conception : lisant `CLAUDE.md` seul, tu dois pouvoir décider **quels deux ou trois fichiers ouvrir** pour n'importe quelle tâche — et surtout, savoir lesquels ne pas ouvrir.

Il contient :

- Le produit en trois phrases
- Les huit invariants, en toutes lettres (ce sont les seules règles jamais résumées ni tronquées)
- Une table de routage : *type de tâche → fichiers à lire*
- L'état d'avancement de chaque dossier (rédigé / en cours / vide)
- Les décisions ouvertes en attente d'arbitrage
- Les conventions transverses en une ligne chacune

Il ne contient **pas** : de schéma de base, de contrat d'API, de liste de composants, ni aucun contenu dupliqué depuis un autre fichier. Toute duplication est une source de divergence.

**Plafond : 200 lignes.** S'il grossit, c'est qu'il absorbe du contenu qui appartient à un dossier.

Chaque fichier de `docs/` commence par un en-tête court : à quoi il sert, quand le lire, de quels autres fichiers il dépend. C'est ce qui rend le routage fiable.

---

## 7. Direction design

Références à étudier : **DocuSign** (référence mondiale, très institutionnelle, un peu datée) et **Yousign** (européen, plus moderne, meilleur sur le parcours mobile).

On s'inspire de leurs **parcours** — le placement des zones de signature, le tunnel du signataire, la lisibilité du statut d'une enveloppe. On ne copie pas leur direction artistique : ils s'adressent à des DAF européens, pas à un gérant de PME à Cotonou.

**Landing page.** Le niveau visé est celui d'un site de studio, pas d'un template SaaS. Deux contraintes qui gouvernent tout :

- **La confiance est le sujet.** Chaque choix visuel doit répondre à la question « puis-je confier mes contrats à ces gens ». Une landing page trop décorative dessert le produit.
- **Elle sera vue sur un téléphone milieu de gamme, en 4G irrégulière.** Le poids et la performance ne sont pas un détail de fin de projet.

L'élément le plus vu du produit n'est pas la landing page : c'est le **cachet apposé en bas d'un PDF**, en noir, en petit, à côté d'une date. C'est lui qui circule. Le design system part de là.

`09_components/` traitera : jetons de design, inventaire de composants, spécification de la landing page, et spécification du cachet et de la page de vérification publique.

---

## 8. Comment je veux qu'on travaille

- **Pose des questions avant de rédiger.** Un dossier mal cadré coûte plus cher à corriger qu'à discuter.
- **Une décision non prise se note comme telle**, dans `CLAUDE.md`, section décisions ouvertes. On ne comble pas un trou par une hypothèse silencieuse.
- **Conteste-moi.** Si une de mes décisions est mauvaise ou contredit un invariant, dis-le et explique pourquoi. Un cahier des charges validé par complaisance ne sert à personne.
- **Pas de remplissage.** Un fichier de spec qui paraphrase son titre est du bruit qui coûtera des tokens à chaque lecture.
- **Français** pour toute la documentation. **Amendement (arbitré après coup) :** les identifiants du domaine — noms de tables, d'entités et de colonnes — sont en **français**, conformes au langage métier du cahier §6 (`utilisateur`, `enveloppe`, `signataire`…). L'anglais reste admis pour le code technique générique (utilitaires, infra) sans portée métier. Détail en `docs/04_structure_rules/01-nommage.md`.

---

## 9. Première tâche

Ne crée encore aucun dossier.

1. Lis ce document et `00_brief/CAHIER-DES-CHARGES.md`.
2. Reviens vers moi avec : ce que tu as compris du produit en cinq lignes, les contradictions ou zones floues que tu as relevées entre les deux documents, et les questions qu'il faut trancher avant d'écrire quoi que ce soit.
3. Propose l'ordre de travail que tu recommandes.

On construit ensuite l'arborescence, dossier par dossier.
