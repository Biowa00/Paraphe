# 07 · Base de données — index

> **À quoi sert ce dossier.** Le schéma des données, les contraintes d'intégrité, les politiques d'accès (RLS) qui rendent I3/I6/I7 vrais **en base**, et les principes de migration. C'est le dossier où une erreur coûte le plus cher : c'est lui qui décide si « même nous ne pouvons pas » est vrai au niveau du stockage.
> **Quand le lire.** Avant `05_api_contracts` (les endpoints en dérivent), avant toute décision de stack de persistance.
> **Dépend de.** `02_logic` (états, chaîne de preuve, chiffrement), `03_rbac` (matrice → politiques d'accès).

## Décision de fond : ce que la base contient, et ce qu'elle ne contient jamais

La base relationnelle (Postgres visé) détient **exclusivement** des **métadonnées** et des **références** :

- Elle **ne contient jamais** de document en clair.
- Elle **ne contient jamais** de clé de chiffrement, ni le pepper NPI, ni la clé de scellement (tout cela vit au **KMS**, cf. `02_logic/04`).
- Les documents chiffrés vivent dans un **stockage objet** en écriture unique ; la base n'en garde que le `hash` et le `chemin_stockage`.

Conséquence : **même un accès Postgres de plus haut privilège (`service_role`) ne peut pas lire un contenu** — il n'est pas là. I7 tient au niveau du **stockage**, pas seulement des règles RLS. C'est ce qui neutralise le « piège du `service_role` » signalé dans le brief.

| Fichier | Contenu |
|---|---|
| [01](01-schema.md) | Entités, colonnes, types, relations |
| [02](02-contraintes.md) | Intégrité, ajout seul, immuabilité du scellé |
| [03](03-politiques-acces.md) | RLS traduisant la matrice `03_rbac`, isolation du `service_role` |
| [04](04-migrations.md) | Principes de migration, localisation des données |

Aucun DDL exécutable ici : on est en conception. Le SQL viendra avec le code, contraint par ces fichiers.
