-- Migration 0002 — complément du schéma
-- Source : docs/07_database/01-schema.md
-- Dépend de 0001 (réutilise la fonction refuser_toujours()).
--
-- Ajoute : zones de signature, membres d'entreprise + rôles (cumul permis),
-- vérifications d'identité, registre de crédits (en ajout seul).

begin;

-- ─────────────────────────────────────────────────────────────
-- Types énumérés complémentaires
-- ─────────────────────────────────────────────────────────────
create type role_entreprise as enum (
  'administrateur', 'emetteur', 'validateur', 'signataire_habilite', 'lecteur'
);
create type methode_verification as enum ('ocr_selfie', 'revue_manuelle');
create type resultat_verification as enum ('valide', 'refuse', 'en_revue');
create type titulaire_credit as enum ('utilisateur', 'entreprise');
create type type_credit as enum ('bienvenue', 'achat', 'consommation', 'ajustement');

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table zone_signature (
  id            uuid primary key default gen_random_uuid(),
  enveloppe_id  uuid not null references enveloppe(id),
  signataire_id uuid not null references signataire(id),
  page          int not null,
  x             numeric not null,
  y             numeric not null,
  largeur       numeric not null,
  hauteur       numeric not null
);

create table membre_entreprise (
  id                     uuid primary key default gen_random_uuid(),
  entreprise_id          uuid not null references entreprise(id),
  utilisateur_id         uuid not null references utilisateur(id),
  habilitation_signature boolean not null default false,
  date_ajout             timestamptz not null default now(),
  date_retrait           timestamptz,
  unique (entreprise_id, utilisateur_id)
);

-- Cumul de rôles permis (03_rbac/01) → les rôles sont dans une table dédiée.
create table membre_role (
  membre_id uuid not null references membre_entreprise(id),
  role      role_entreprise not null,
  primary key (membre_id, role)
);

-- Images purgées après vérification (I5) : on ne garde que le résultat.
create table verification_identite (
  id             uuid primary key default gen_random_uuid(),
  utilisateur_id uuid not null references utilisateur(id),
  methode        methode_verification not null,
  score          numeric,
  resultat       resultat_verification not null,
  controle_ref   text not null,
  date           timestamptz not null default now()
);

-- Solde = somme des lignes (registre en ajout, jamais un compteur mutable).
create table credit_transaction (
  id             uuid primary key default gen_random_uuid(),
  titulaire_type titulaire_credit not null,
  titulaire_id   uuid not null,
  type           type_credit not null,
  montant        int not null,
  enveloppe_id   uuid references enveloppe(id),
  date           timestamptz not null default now()
);

create index idx_zone_enveloppe on zone_signature(enveloppe_id);
create index idx_membre_entreprise on membre_entreprise(entreprise_id);
create index idx_verification_utilisateur on verification_identite(utilisateur_id);
create index idx_credit_titulaire on credit_transaction(titulaire_type, titulaire_id);

-- ─────────────────────────────────────────────────────────────
-- credit_transaction : registre en ajout seul (jamais réécrit)
-- ─────────────────────────────────────────────────────────────
create trigger trg_credit_no_update before update on credit_transaction
  for each row execute function refuser_toujours();
create trigger trg_credit_no_delete before delete on credit_transaction
  for each row execute function refuser_toujours();

-- ─────────────────────────────────────────────────────────────
-- RLS activé (deny par défaut) sur les nouvelles tables
-- ─────────────────────────────────────────────────────────────
alter table zone_signature        enable row level security;
alter table membre_entreprise     enable row level security;
alter table membre_role           enable row level security;
alter table verification_identite enable row level security;
alter table credit_transaction    enable row level security;

commit;
