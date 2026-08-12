# Glossaire — Paraphe

> **À quoi sert ce fichier.** Fixer le sens unique de chaque terme métier et technique du projet, pour que tous les autres dossiers parlent la même langue.
> **Quand le lire.** Au moindre doute sur un mot employé dans une spec. À relire avant d'introduire un terme nouveau.
> **Dépend de.** `CAHIER-DES-CHARGES.md` et `PARAPHE-BRIEF-DEMARRAGE.md` (mêmes définitions, jamais contradictoires).

Règle : un terme = une définition. Si un dossier a besoin d'un sens différent, il crée un terme nouveau, il ne redéfinit pas un terme existant.

---

## Objets du domaine

**Enveloppe** — L'objet pivot du modèle de données. Contient un document, un ou plusieurs signataires, un mode de signature, un cycle de vie et un journal d'événements. Ce n'est pas le document qui est l'unité, c'est l'enveloppe.

**Document** — Le PDF déposé dans une enveloppe. Sa version d'origine et sa version finale sont figées par empreinte. Word accepté mais converti en PDF côté serveur avant chiffrement.

**Signataire** — Une personne désignée pour signer une enveloppe. Peut être un invité (sans compte) ou un utilisateur vérifié. Chaque signataire porte un **niveau d'identité exigé** fixé par l'émetteur.

**Émetteur** — Celui qui crée et envoie l'enveloppe. Paie la friction (crédit consommé). Jamais le signataire destinataire.

**Dossier de preuve** — Produit à chaque scellement : PDF joint + fichier structuré réunissant empreintes, identités, méthodes d'authentification, horodatages, journal chronologique et signature serveur du dossier lui-même. C'est lui qui emporte la conviction du juge.

**Scellement** — Opération finale qui fige l'enveloppe complète en écriture unique. Après scellement : aucune modification ni suppression possible, par personne (I3).

**Ancrage public** — Publication quotidienne d'une empreinte globale de l'ensemble des archives sur un support public et indépendant. Permet à un tiers de vérifier qu'une archive n'a pas été réécrite. Support précis : **décision ouverte**.

---

## Identité et preuve

**Signature avancée** — Le statut juridique de Paraphe. Recevable en justice, mais **sans présomption légale de fiabilité**. On ne revendique jamais mieux.

**Signature qualifiée** — Le cran au-dessus (dispositif sécurisé + certificat qualifié + prestataire agréé). Bénéficie de la présomption de fiabilité. **Hors périmètre v1**, objectif éventuel à 24 mois.

**Signature tracée** — Le tracé manuscrit dessiné par le signataire. **Aucune valeur probante en soi** : il rassure, il ne prouve rien. Jamais stocké puis rejoué ; retracé à chaque document (I1).

**Niveau d'identité exigé** — Exigence d'authentification posée par l'émetteur sur un signataire. Trois niveaux :
- **OTP seul** — faible enjeu (ex. accusé de lecture, décharge simple).
- **Standard** — OTP + selfie avec détection de vivacité. Cas de l'invité sans pièce. Le selfie prouve ici la *vivacité* (un humain vivant), pas l'identité : aucun portrait de référence à comparer.
- **Renforcé** — OTP + pièce d'identité + face-match contre le portrait de la pièce. Cas du compte vérifié.

**OTP** — Code à usage unique envoyé sur le numéro. Exigé **frais à chaque signature**, pas seulement à la connexion (I2). Une session volée ne permet pas de signer.

**Vivacité (détection de)** — Contrôle qu'un selfie provient d'une personne réelle et présente (mouvement demandé aléatoirement), et non d'une photo.

**Face-match** — Comparaison du selfie au portrait extrait de la pièce d'identité, produisant un score de correspondance. N'existe qu'au niveau Renforcé.

**Niveau de preuve** — Qualité du faisceau produit pour une signature : *standard* (invité) ou *renforcé* (compte vérifié, badge visible).

---

## Données réglementées

**NPI** — Numéro Personnel d'Identification (identité nationale béninoise). **Jamais stocké en clair** (I4). Conservé sous forme de **HMAC-SHA256 + pepper** détenu au KMS : déterministe, donc l'unicité d'un compte est vérifiable, mais une fuite de la base seule reste inexploitable.

**Pepper** — Secret de hachage conservé hors base (au KMS), commun à tous les NPI. À distinguer d'un sel par enregistrement : le pepper permet l'unicité, le sel aléatoire l'empêcherait.

**IFU** — Identifiant Fiscal Unique. Exigé à la création d'un compte entreprise.

**RCCM** — Registre du Commerce et du Crédit Mobilier. Exigé à la création d'un compte entreprise.

**Identifiant public** — Identifiant plateforme d'un compte vérifié, format `BJ-XXXX-XXX`. Public, opposable, distinct de l'`id` interne.

---

## Chiffrement et exploitation

**Chiffrement par enveloppe** — Chaque document est chiffré avec une clé qui lui est propre. Les clés vivent dans un KMS séparé de la base. Qui détient la base n'a pas les clés ; qui a les clés n'a pas la base. Fondement matériel de I7.

**KMS** — Service de gestion des clés, distinct de la base de données, à accès séparé. Détient les clés d'enveloppe et le pepper NPI.

**Crypto-shredding** — Effacement par destruction de la clé : l'enveloppe scellée n'est jamais supprimée (I3), mais détruire sa clé la rend illisible. C'est la voie retenue pour satisfaire une obligation d'effacement (APDP) sans violer l'immutabilité.

**Exploitant** — Le propriétaire du SaaS. Administre **un commerce, pas un contenu** : comptes, facturation, plans, modération, supervision. Aucun accès en lecture au contenu, aucune écriture sur une enveloppe scellée. L'acteur le plus contraint du système, jamais le plus puissant.

**Journal d'événements** — Suite d'événements en **ajout seul**, jamais modifiée ni supprimée, répliquée hors du contrôle des administrateurs de la plateforme (I6). Trace tout le cycle de vie d'une enveloppe.

---

## Format et temps

**Empreinte SHA-256** — Condensé cryptographique figeant l'état exact d'un document à un instant. Sert à prouver l'intégrité (« rien n'a bougé depuis »).

**Horodatage** — Datation d'un événement sur une source de temps fiable et traçable. Fournisseur : décision ouverte.

**PAdES** — Norme de signature PDF traitant nativement signature multiple, conservation longue durée et horodatage. **À évaluer sérieusement avant toute solution maison** (décision ouverte).

---

## Comptes

**Invité (niveau 1)** — Aucune inscription. Reçoit un lien, signe. Preuve standard. Gratuit, toujours, sans limite (I8). Canal d'acquisition principal.

**Compte vérifié (niveau 2)** — Particulier dont l'identité est confirmée une fois (parcours §5.1), réutilisable. Preuve renforcée, badge, identifiant public.

**Compte entreprise (niveau 3)** — IFU + RCCM + représentant légal ou délégation. Sièges nominatifs, rôles distincts, modèles, archive partagée, facturation centralisée.

**Crédit** — Unité de consommation prépayée (Mobile Money) débitée à l'émetteur pour l'envoi. Les 3 crédits de bienvenue du particulier **n'expirent pas**.
