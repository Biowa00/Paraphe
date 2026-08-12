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
| `0001_socle.sql` | Tables du cœur (utilisateur, entreprise, enveloppe, signataire, evenement, document_stocke, enveloppe_cle), enums, triggers I3/I6, RLS activé | ⏳ en attente du connecteur |

## À venir

- `0002` — politiques RLS (03-politiques-acces), après le modèle d'authentification.
- Tables V2 (membre_entreprise, membre_role, modèles, facturation).
- Adaptateur Postgres de `DepotEnveloppes` (remplace le dépôt mémoire) lisant `DATABASE_URL` depuis `.env`.
