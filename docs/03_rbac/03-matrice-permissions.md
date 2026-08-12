# 03.03 · Matrice de permissions

> **À quoi sert ce fichier.** Consolider en une table action × rôle qui a le droit de quoi. Référence pour coder les autorisations et écrire les tests d'accès.
> **Quand la lire.** À chaque endpoint sensible ; à la revue de sécurité.
> **Dépend de.** `01-roles-utilisateurs.md`, `02-roles-internes.md`.

Légende : ✅ autorisé · ⛔ interdit · ➖ sans objet · ⚠️ conditionné (note).

## A. Actions applicatives — utilisateurs

| Action | Invité | Vérifié | Admin ent. | Émetteur | Validateur | Signataire habilité | Lecteur |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| Signer une enveloppe reçue | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Créer / envoyer une enveloppe | ⛔ | ✅ | ✅ | ✅ | ⛔ | ⛔ | ⛔ |
| Approuver avant envoi (circuit) | ➖ | ➖ | ✅ | ⛔ | ✅⚠️¹ | ⛔ | ⛔ |
| Engager la société (signer pour elle) | ➖ | ➖ | ⚠️² | ⛔ | ⛔ | ✅ | ⛔ |
| Consulter l'archive **personnelle** | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Consulter l'archive **partagée** entreprise | ➖ | ➖ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Gérer sièges / rôles / habilitations | ➖ | ➖ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gérer modèles de documents | ➖ | ➖ | ✅ | ✅⚠️³ | ⛔ | ⛔ | ⛔ |
| Gérer facturation entreprise | ➖ | ➖ | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Acheter des crédits (à l'unité) | ➖ | ✅ | ✅ | ⚠️³ | ⛔ | ⛔ | ⛔ |
| Modifier / supprimer une enveloppe **scellée** | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |

¹ Un Validateur ne peut **pas** approuver une enveloppe **qu'il a lui-même créée** (séparation des tâches sur l'objet).
² L'Administrateur ne peut engager la société que s'il détient **aussi** l'habilitation de signature explicite ; le rôle Admin seul ne l'accorde pas.
³ Selon la configuration de l'entreprise (l'Admin peut ouvrir ces droits à l'Émetteur).

La dernière ligne est **⛔ pour tous, sans exception**, y compris l'exploitant : c'est I3, garanti par construction, pas par la matrice.

## B. Actions d'exploitation — rôles internes

| Action | Propriétaire | Admin technique | Support | Opérateur vérif. | Auditeur |
|---|:--:|:--:|:--:|:--:|:--:|
| Lire le contenu d'un document | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Voir statut / dates / destinataires d'une enveloppe | ✅⚠️⁴ | ⚠️⁵ | ✅ | ⛔ | ✅ |
| Traiter une revue d'identité en attente | ⛔ | ⛔ | ⛔ | ✅ | ⛔ |
| Conserver une pièce après décision | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Gérer plans / facturation / comptes | ✅ | ⛔ | ⛔ | ⛔ | ⛔ |
| Suspendre un compte | ✅⚠️⁶ | ⛔ | ⛔ | ⛔ | ⛔ |
| Déployer / superviser l'infra | ⛔ | ✅ | ⛔ | ⛔ | ⛔ |
| Restaurer une sauvegarde | ⛔ | ⚠️⁷ | ⛔ | ⛔ | ⛔ |
| Détruire une clé d'enveloppe (crypto-shredding) | ⚠️⁷ | ⚠️⁷ | ⛔ | ⛔ | ⛔ |
| Accès exceptionnel à un dossier | ⚠️⁷ | ⚠️⁷ | ⛔ | ⛔ | ⛔ |
| Lire journaux et rapports d'accès | ✅ (agrégé) | ⛔ | ⛔ | ⛔ | ✅ |
| Modifier / supprimer un journal | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| Signer au nom d'un tiers | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |

⁴ Le Propriétaire ne voit que des **données agrégées et métadonnées**, jamais le titre complet ni le contenu.
⁵ L'Admin technique voit ce qu'exige la supervision (santé, volumétrie), pas le contenu métier.
⁶ Journalisé **et notifié au client**.
⁷ **Double contrôle obligatoire** : deux comptes internes distincts, sinon l'opération échoue. Justification écrite + notification client pour l'accès exceptionnel et la destruction de clé.

Les lignes « lire le contenu », « modifier/supprimer un journal », « signer au nom d'un tiers » sont **⛔ pour tous les rôles internes** : ce sont des interdits **par construction** (I7, §4bis.4), pas des règles de matrice.

## Cloisonnement transverse

- Les droits utilisateurs sont évalués **par entreprise** : un membre de l'entreprise A n'a aucun droit sur l'entreprise B.
- Le contenu des documents n'est accessible qu'aux **parties de l'enveloppe** (émetteur, signataires) et aux membres autorisés de l'entreprise émettrice — jamais à un rôle interne de l'exploitant.
