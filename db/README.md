# Migrations base de données

Migrations SQL versionnées, appliquées **dans l'ordre** des numéros. Source de vérité du schéma : `docs/07_database/`.

## Principes (cf. 07_database/04)

- **En avant, additives.** On n'annule pas une migration jouée en production.
- **Ajout seul / immuabilité rendus vrais en base** par des triggers, pas seulement par l'application.
- **Aucune table sans, à terme, ses politiques RLS.** RLS est activé dès `0001` (deny par défaut) ; les politiques arrivent avec le modèle d'authentification.
- **Localisation Bénin (décision ouverte n°2)** : bloquante avant d'y mettre de vraies données personnelles. En dev, données de test uniquement.

## Comment appliquer

Deux voies équivalentes :

1. **Connecteur Supabase** (une fois autorisé, en session interactive) : la migration est appliquée via l'outil, puis vérifiée (`list_tables`, `list_migrations`).
2. **Éditeur SQL Supabase** : copier-coller le contenu du fichier `.sql` → *Run*.

## État

| Migration | Contenu | Appliquée ? |
|---|---|---|
| `0001_socle.sql` | Tables du cœur (utilisateur, entreprise, enveloppe, signataire, evenement, document_stocke, enveloppe_cle), enums, triggers I3/I6, RLS activé | ⏳ à lancer |
| `0002_complement.sql` | zone_signature, membre_entreprise, membre_role, verification_identite, credit_transaction (registre en ajout seul), RLS activé | ⏳ à lancer |

À lancer **dans l'ordre** (0001 puis 0002) dans l'éditeur SQL Supabase.

## À venir (volontairement PAS encore écrit)

- **`0003` — politiques RLS** (03-politiques-acces). **Bloqué par une décision** : le modèle d'authentification (comment un utilisateur prouve son identité à la base). Les écrire maintenant, sans ce modèle, produirait de **mauvaises règles d'accès** — pire que pas de règles. RLS est déjà **activé** (deny par défaut, donc sûr) ; les politiques viendront quand l'authentification sera câblée.
- Tables V2 avancées (modèles de documents, facturation par siège).
- Adaptateur Postgres de `DepotEnveloppes` (remplace le dépôt mémoire) lisant `DATABASE_URL` depuis `.env`.
