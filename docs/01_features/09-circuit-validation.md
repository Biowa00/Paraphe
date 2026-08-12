# 09 · Circuit de validation interne — V2

> **À quoi sert cette fiche.** Décrire le circuit optionnel par lequel une enveloppe est approuvée en interne **avant** d'être envoyée aux signataires externes.
> **Quand la lire.** Pour toute évolution du workflow d'approbation interne.
> **Dépend de.** `03_rbac` (rôles Émetteur / Validateur), `01_features/02` (création d'enveloppe), `02_logic` (états).

## Objectif

Permettre à une entreprise d'insérer une étape d'approbation interne entre la préparation d'une enveloppe et son envoi, sans complexifier le parcours pour les entreprises qui n'en veulent pas. **Optionnel** par défaut.

## Acteurs

- **Émetteur** : prépare l'enveloppe, la soumet à validation.
- **Validateur** : approuve ou renvoie l'enveloppe avant tout envoi externe.

## Préconditions

- Compte entreprise avec le circuit de validation **activé**.
- Au moins un membre porteur du rôle Validateur.

## Parcours

1. L'**Émetteur** prépare l'enveloppe (document, signataires, zones) et la **soumet** au lieu de l'envoyer directement.
2. L'enveloppe entre dans un **état d'attente de validation interne** (préalable à `envoyee`).
3. Le **Validateur** examine et : **approuve** → l'enveloppe part aux signataires ; ou **renvoie** avec un motif → retour à l'Émetteur.
4. Chaque décision est **journalisée** (I6).

## Règles et invariants engagés

- La validation interne est **antérieure** à l'envoi : elle n'affecte ni le document scellé, ni les signatures externes.
- Le circuit interne est **invisible pour le signataire externe** : la friction reste du côté de l'entreprise émettrice, jamais du destinataire.
- Aucune approbation interne ne remplace la signature elle-même : approuver n'est pas signer.

## Cas limites et échecs

- **Renvoi multiple** → chaque cycle est tracé ; l'historique reste lisible.
- **Validateur indisponible** → l'Administrateur peut réassigner le rôle ; l'enveloppe reste en attente, jamais envoyée par défaut.
- **Circuit désactivé** → l'Émetteur envoie directement (parcours V1 standard, fiche `02`).

## Hors périmètre

La définition des rôles Émetteur/Validateur est en `03_rbac`. Les **relances** automatiques des signataires (après envoi) sont la fiche `13`.
