# 05.01 · Conventions d'API

> **À quoi sert ce fichier.** Les règles communes à tous les endpoints : authentification, versionnage, erreurs, idempotence.
> **Quand la lire.** Avant d'écrire ou d'appeler n'importe quel endpoint.
> **Dépend de.** `03_rbac`, `07_database/03`.

## Base

- Préfixe versionné : `/v1/…`. Une rupture de contrat incrémente la version ; on n'altère pas `/v1` en place.
- Corps en **JSON** ; documents en `multipart/form-data` à l'upload.
- Horodatages **ISO 8601 UTC**. Montants de crédits en entiers.
- Conçu **mobile d'abord / 3G** : réponses compactes, pas de sur-emballage, pagination systématique sur les listes.

## Authentification

Trois natures d'appelant :

| Appelant | Jeton | Portée |
|---|---|---|
| **Utilisateur vérifié** | session (JWT court + refresh) | ses ressources, selon RLS |
| **Invité** | **jeton d'enveloppe** issu du lien | **une seule enveloppe**, lecture + acte de signature |
| **Rôle interne** | auth d'administration séparée | jamais dans ces contrats publics ; chemin distinct, tracé |

Règle non négociable (**I2**) : **toute signature exige un OTP frais validé à l'instant**, quelle que soit la validité de la session ou du jeton d'enveloppe. Un jeton valide n'autorise **jamais** à lui seul une signature.

Le jeton d'enveloppe d'un invité est **à portée strictement limitée** : il ne donne accès qu'à l'enveloppe visée, ni liste, ni autre ressource.

## Format d'erreur

Toutes les erreurs partagent une enveloppe unique :

```
{ "erreur": { "code": "otp_invalide", "message": "…", "details": { … } } }
```

- `code` : chaîne stable, testable, jamais traduite (l'UI traduit).
- Codes HTTP : `400` requête invalide · `401` non authentifié · `403` interdit (RLS/rôle) · `404` inexistant/hors périmètre · `409` conflit d'état · `410` lien expiré · `422` règle métier · `429` trop de tentatives · `5xx` serveur.
- Un `403` ne divulgue jamais l'existence d'une ressource hors périmètre (répondre comme `404` si la simple existence est sensible).

Codes métier récurrents : `otp_invalide`, `otp_expire`, `otp_trop_de_tentatives`, `identite_niveau_insuffisant`, `enveloppe_scellee`, `enveloppe_expiree`, `pas_votre_tour`, `createur_ne_peut_valider`, `credits_insuffisants`, `npi_deja_utilise`, `vivacite_echec`.

## Idempotence

- Les opérations à effet (envoi, signature, achat de crédits, scellement) acceptent un en-tête `Idempotency-Key`. Un rejeu renvoie le résultat initial, sans double effet (pas de double débit de crédit, pas de double signature).

## Ce qui ne transite jamais

- Aucun endpoint ne renvoie un **document en clair** à un tiers non partie.
- Aucun endpoint n'expose le **NPI**, une **clé**, le **pepper**, ou une **image de pièce** (purgée, I5).
- Aucun endpoint ne permet un `UPDATE`/`DELETE` sur `evenement` ou une enveloppe `scellee` (I3, I6) — ils n'existent pas.
