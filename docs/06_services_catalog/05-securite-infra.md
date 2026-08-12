# 06.05 · KMS, stockage objet chiffré, journal externalisé, ancrage

> **À quoi sert ce fichier.** Les services d'infrastructure qui **tiennent les invariants** I3/I6/I7. Service **vital** : ce ne sont pas des commodités, ce sont les fondations de la promesse de preuve.
> **Dépend de.** `02_logic/04` (architecture de chiffrement), `07_database` (ce qui n'est pas en base), `03_rbac/02` (double contrôle).

## A. KMS (gestion des clés)

**Rôle.** Détenir les **clés d'enveloppe**, le **pepper NPI**, la **clé de scellement serveur**. Chiffrer/déchiffrer et signer sans jamais exposer le secret. Permettre la **destruction de clé** (crypto-shredding).

**Non négociable.**
- Le KMS est **distinct de la base** et à **accès séparé** (celui qui a la base n'a pas les clés). C'est le fondement matériel de I7.
- La destruction d'une clé exige **double contrôle** + trace + notification (`02_logic/04`).

**Critères.** Séparation réelle des rôles, rotation, journal d'usage, gestion d'accès fine, **localisation** compatible (`08`), export/portabilité pour éviter le verrouillage fournisseur.

**Candidats *(non tranché)*.** KMS d'un fournisseur cloud, ou HSM géré. Contrainte : ne doit pas être opérable par le même compte que la base.

**Plan B.** Sauvegarde chiffrée des **enveloppes de clés** (pas des clés en clair), procédure de reprise à double contrôle. La perte du KMS sans reprise = perte d'accès aux contenus (par conception) : la redondance du KMS est donc critique.

## B. Stockage objet chiffré (documents)

**Rôle.** Conserver les documents **chiffrés** en **écriture unique** (WORM). La base ne garde que `hash` + `chemin_stockage`.

**Critères.** Mode **écriture unique / verrouillage d'objet** natif (soutient I3), durabilité, chiffrement au repos, localisation compatible.

**Plan B.** Réplication **sur deux zones** (cahier §9), restauration testée trimestriellement. Une restauration ne réintroduit jamais une version antérieure d'un objet scellé (contournerait I3).

## C. Journal externalisé (I6)

**Rôle.** Répliquer le journal en **ajout seul** vers un stockage **hors du contrôle des administrateurs de la plateforme**. Un admin ne peut pas effacer la trace de son passage.

**Critères.** Immuabilité vérifiable (WORM / ajout seul), séparation d'administration réelle vis-à-vis de l'équipe Paraphe, horodatage.

**Point d'attention.** « Hors du contrôle des admins » est une **propriété d'organisation autant que technique** : si le même compte administre l'appli et le stockage du journal, la propriété est fausse. À traiter en `08_environments`.

## D. Ancrage public (décision ouverte n°6)

**Rôle.** Publier chaque jour une **empreinte globale des archives** sur un support **public et indépendant**, pour que « même nous ne pouvons pas modifier » soit **vérifiable**.

**Options *(non tranché)*.**
- **OpenTimestamps / blockchain publique** — vérifiable par quiconque, faible coût, très indépendant.
- **Dépôt horodaté chez un tiers** (huissier, notaire, autorité) — fort juridiquement, plus lourd.
- **Publication presse/registre** — symbolique, faible valeur technique.

**Critères.** Indépendance réelle vis-à-vis de Paraphe, vérifiabilité par un tiers, coût quotidien, pérennité.

**Plan B.** Redonder l'ancrage sur **deux supports** (ex. chaîne publique + dépôt tiers) pour ne pas dépendre d'un seul mécanisme de transparence.
