# 05 · Contrats d'API — index

> **À quoi sert ce dossier.** Les contrats d'endpoints : méthode, chemin, authentification, schémas de requête/réponse, erreurs, et l'invariant que chacun protège. C'est l'exécution concrète de la machine à états (`02_logic/01`) sous les politiques d'accès (`07_database/03`).
> **Quand le lire.** Avant d'implémenter un endpoint ou un écran qui l'appelle.
> **Dépend de.** `02_logic`, `03_rbac`, `07_database`.

## Frontière d'architecture (décision actée)

- **Backend de confiance** (obligatoire) pour tout ce qui touche : inscription/identité, OTP, signature, scellement, KMS, crédits, création et transitions d'enveloppe. Lui seul détient les accès séparés (base + orchestration KMS) ; le client n'y touche jamais directement.
- **Lecture directe** (PostgREST sous RLS) tolérée pour le trivial en lecture seule : lister ses enveloppes, lire un statut. Jamais pour une écriture, jamais pour une donnée sensible.

> Règle : tout ce qui **change un état de preuve** ou **valide une identité** passe par le backend de confiance. Aucune exception.

| Fichier | Contenu |
|---|---|
| [01](01-conventions.md) | Auth, versionnage, format d'erreur, idempotence, pagination |
| [02](02-identite.md) | Inscription vérifiée, OTP, revue manuelle |
| [03](03-enveloppes.md) | Cycle de vie d'enveloppe : créer, envoyer, ouvrir, signer, sceller, télécharger |
| [04](04-verification-publique.md) | Vérification publique sans compte |
| [05](05-credits.md) | Solde et achat de crédits (Mobile Money) |
| [06](06-entreprise.md) | *(V2)* entreprise, membres/rôles, modèles, facturation, tableau de bord |

Les schémas sont décrits en champs, pas en OpenAPI figé : la spec exécutable naîtra avec le code, contrainte par ces fichiers.
