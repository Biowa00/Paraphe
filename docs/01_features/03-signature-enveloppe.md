# 03 · Signature d'une enveloppe (invité et vérifié) — V1

> **À quoi sert cette fiche.** Décrire le parcours de signature, commun à l'invité et au compte vérifié. Seule l'étape d'identité diffère, selon le niveau exigé par l'émetteur.
> **Quand la lire.** Pour toute évolution du tunnel signataire, de l'exigence d'OTP, du retracé ou de la confirmation.
> **Dépend de.** `02_logic` (niveaux d'identité, chaîne de preuve, OTP), `06_services_catalog` (OTP, vivacité).

## Objectif

Faire signer un destinataire à distance, depuis son téléphone, en **trois écrans maximum**, sans jamais lui faire payer ni créer de compte s'il n'en veut pas (I8). C'est le parcours le plus sensible du produit : toute friction ici se traduit en contrat perdu.

## Acteurs

- **Signataire** : invité (niveau 1, sans compte) ou compte vérifié (niveau 2).
- Le parcours est **toujours gratuit** pour lui, sans limite de temps ni de volume (I8).

## Préconditions

- Avoir reçu un lien valide (WhatsApp/SMS/e-mail de secours).
- En mode séquentiel, être le signataire dont c'est le tour.
- L'enveloppe n'est ni expirée ni déjà scellée.

## Parcours

1. **Ouverture du lien** → le document s'affiche en **lecture seule**. Événement `ouverte` puis `consultee` journalisés.
2. **Vérification d'identité selon le niveau exigé** par l'émetteur :
   - *OTP seul* → OTP frais uniquement.
   - *Standard* → OTP frais + selfie avec **détection de vivacité** (preuve qu'un humain vivant signe ; pas de face-match, l'invité n'a pas de pièce de référence).
   - *Renforcé* → parcours d'identité complet (OTP + pièce + face-match) ; s'il est déjà compte vérifié, l'identité est réutilisée et seul l'OTP frais est redemandé.
3. **Tracé de la signature, refait à cet instant précis** (I1) — jamais rejoué depuis une base.
4. **OTP frais, saisi à cet instant précis** (I2) — pas seulement une session valide.
5. **Confirmation** → événement `signee` inscrit au journal → **notification à l'émetteur**.

Quand le dernier signataire a signé, l'enveloppe passe `complete` puis est **scellée** automatiquement (le scellement et le dossier de preuve sont décrits en `02_logic`).

## Règles et invariants engagés

- **I1** : le signataire retrace à chaque document. Aucun tracé n'est réutilisé.
- **I2** : OTP frais exigé **à la signature**, pas à la connexion. Une session volée ne permet pas de signer.
- L'**empreinte SHA-256** du document est figée au moment de la signature (couche intégrité).
- Chaque événement porte horodatage, IP, user-agent, empreinte d'appareil (I6).

## Cas limites et échecs

- **Refus de signer** → événement `refusee`, enveloppe en état `refusee`, émetteur notifié.
- **OTP non reçu** → relance possible (compte le coût SMS côté exploitation) ; bascule WhatsApp↔SMS.
- **Échec de vivacité répété** → nouvelle tentative ; en cas de doute persistant, l'émetteur en est informé (pas de blocage silencieux du destinataire).
- **Lien expiré** → message clair et voie de relance via l'émetteur.
- **Signataire déjà signé** → l'ouverture ultérieure affiche le statut, pas un nouveau tunnel.

## Hors périmètre

Le **scellement**, le **dossier de preuve** et l'ordre séquentiel/parallèle relèvent de `02_logic`. La **conversion d'un invité en compte vérifié** (proposée après 2–3 signatures) est traitée dans la fiche `01` et le modèle éco.
