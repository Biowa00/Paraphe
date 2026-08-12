# 06 · Catalogue de services externes — index

> **À quoi sert ce dossier.** Recenser les dépendances externes : ce que chacune fait, pourquoi elle est critique, comment la choisir, ce qu'elle coûte, et son **plan B**. C'est ici qu'on anticipe ce qui peut tuer la disponibilité (99,5 % exigé) ou faire exploser les coûts (SMS à l'échelle).
> **Quand le lire.** Avant de brancher un fournisseur, avant `08_environments`, à toute négociation commerciale.
> **Dépend de.** `02_logic` (ce que le service doit garantir), `05_api_contracts` (points d'intégration), `CLAUDE.md` (décisions ouvertes).

## Deux principes de lecture

1. **Aucun fournisseur nommé ici n'est un choix arrêté.** Tout est **candidat, à valider** (décision ouverte n°4). Le choix se fait sur trois axes : **coût**, **couverture réelle au Bénin**, **fiabilité**.
2. **Tout service critique a un plan B écrit.** Une dépendance sans dégradation prévue est un point de défaillance unique. La règle « une signature manquée est un contrat perdu » interdit de dépendre d'un seul fournisseur pour le chemin de signature.

## Services

| Fichier | Service | Criticité |
|---|---|---|
| [01](01-notifications-otp.md) | Notifications & OTP (WhatsApp, SMS, e-mail) | **Vitale** — chemin de signature |
| [02](02-identite.md) | OCR + vivacité + face-match | Haute — inscription/renforcé |
| [03](03-horodatage.md) | Horodatage (source de temps) | Haute — couche Temps de la preuve |
| [04](04-mobile-money.md) | Mobile Money | Haute — encaissement |
| [05](05-securite-infra.md) | KMS, stockage objet chiffré, journal externalisé, ancrage | **Vitale** — tient I3/I6/I7 |

## Ce qui n'est jamais délégué

Un service externe peut **livrer** (envoyer un SMS, calculer un score, horodater) mais ne **détient jamais** : le contenu en clair d'un document, une clé de déchiffrement, le pepper NPI. La confiance reste chez Paraphe ; les tiers rendent des services périphériques.
