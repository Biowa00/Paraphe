# 02.01 · Machine à états de l'enveloppe

> **À quoi sert ce fichier.** Définir sans ambiguïté les états d'une enveloppe, les transitions autorisées, leurs gardes et les événements journalisés. C'est le contrat que `07_database` et `05_api_contracts` doivent respecter.
> **Quand le lire.** Avant de modéliser la table `enveloppe`, avant d'écrire un endpoint qui change un statut.
> **Dépend de.** `03-regles-identite.md`, `02-chaine-de-preuve.md`, le modèle de données du cahier §6.

## Principe

L'enveloppe est l'objet pivot. Son statut est la **seule** vérité sur ce qu'on peut encore lui faire. Toute transition émet un ou plusieurs événements dans le journal **en ajout seul** (I6). Le multi-signataires n'est pas un cas particulier : c'est N lignes `signataire` et N événements `signee`.

## États

| État | Signification | Le contenu est-il modifiable ? |
|---|---|---|
| `brouillon` | En préparation, jamais envoyée | Oui (par l'émetteur) |
| `attente_validation` | *(V2)* soumise au circuit interne avant envoi | Oui, sur renvoi |
| `envoyee` | Notifiée aux signataires, aucune signature encore | Non — document figé |
| `partiellement_signee` | Au moins une signature, pas toutes | Non |
| `complete` | Toutes les signatures recueillies | Non |
| `scellee` | Figée définitivement + dossier de preuve produit | **Jamais** (I3) |
| `refusee` | Un signataire a refusé | Non |
| `expiree` | Échéance atteinte sans complétion | Non |

`scellee`, `refusee`, `expiree` sont **terminaux**. Une enveloppe scellée peut voir sa clé détruite (crypto-shredding, cf. `04`) : elle **reste** `scellee` et existante, seul son contenu devient illisible. Le crypto-shredding n'est pas un état du cycle de vie.

## Transitions

```
brouillon ──creee──────────────────────────────────► (existe)
brouillon ──[V2: soumettre]──► attente_validation
attente_validation ──approuver──► envoyee
attente_validation ──renvoyer──► brouillon
brouillon / attente_validation ──envoyee──► envoyee
envoyee ──signee (1ère)──► partiellement_signee
partiellement_signee ──signee (autres)──► partiellement_signee
partiellement_signee ──signee (dernière)──► complete
envoyee ──signee (unique signataire)──► complete
complete ──scellee (auto)──► scellee
{envoyee, partiellement_signee} ──refusee──► refusee
{envoyee, partiellement_signee} ──expiree──► expiree
```

## Gardes (conditions de transition)

- **`envoyee`** : au moins un signataire ; empreinte `document_hash_origine` calculée et figée ; solde de crédits suffisant (débit à l'envoi).
- **`signee`** : identité vérifiée au **niveau exigé** du signataire (cf. `03`) ; **OTP frais validé à l'instant** (I2) ; **tracé refait à l'instant** (I1) ; en mode séquentiel, c'est bien le tour de ce signataire.
- **`complete → scellee`** : automatique dès que le dernier signataire attendu a signé. Produit le dossier de preuve et applique le cachet serveur (cf. `02`).
- **`expiree`** : `date_expiration` atteinte ET enveloppe non `complete`.
- **`refusee`** : déclenché par l'action explicite d'un signataire.

## Mode séquentiel vs parallèle

- **Séquentiel** : les signataires sont sollicités dans l'ordre `signataire.ordre`. Le suivant n'est notifié qu'après la signature du précédent.
- **Parallèle** : tous notifiés à l'envoi ; l'ordre des signatures est libre.

Dans les deux cas, l'état passe à `complete` uniquement quand **tous** les signataires attendus ont signé.

## Événements émis (types du cahier §6)

`creee` · `envoyee` · `ouverte` · `consultee` · `otp_envoye` · `otp_valide` · `signee` · `refusee` · `expiree` · `scellee` · `telechargee`

Chaque événement porte : `enveloppe_id`, `type`, `acteur`, `horodatage`, `ip`, `user_agent`, `empreinte_appareil`, `donnees`. Le journal n'est **jamais** modifié ni supprimé (I6) et est répliqué hors du contrôle des administrateurs de la plateforme.

## Invariants engagés

- **I3** : aucune transition ne sort de `scellee`. Il n'existe pas d'opération de suppression d'enveloppe, à aucun niveau.
- **I6** : toute transition journalise ; le journal est en ajout seul.
- **I1 / I2** : gardes de la transition `signee`.
