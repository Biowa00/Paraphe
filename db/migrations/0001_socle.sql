-- Migration 0001 — socle du modèle de données
-- Source : docs/07_database/01-schema.md et 02-contraintes.md
-- Identifiants du domaine en français (04_structure_rules/01).
--
-- Cette migration crée les tables du cœur (boucle de signature) et rend vrais,
-- EN BASE, les invariants I3 (immuabilité du scellé) et I6 (journal ajout seul)
-- par des triggers — actifs même pour un accès privilégié.
--
-- Les politiques RLS (03-politiques-acces) viendront dans une migration
-- ultérieure, avec le modèle d'authentification. RLS est activé ici (deny par
-- défaut) : sûr tant qu'aucune politique n'ouvre l'accès.

begin;

-- ─────────────────────────────────────────────────────────────
-- Types énumérés
-- ─────────────────────────────────────────────────────────────
create type niveau_verification as enum ('invite', 'verifie');
create type statut_utilisateur as enum ('actif', 'suspendu');
create type statut_verification_entreprise as enum ('en_attente', 'verifiee', 'suspendue');
create type mode_enveloppe as enum ('sequentiel', 'parallele');
create type statut_enveloppe as enum (
  'brouillon', 'attente_validation', 'envoyee', 'partiellement_signee',
  'complete', 'scellee', 'refusee', 'expiree'
);
create type niveau_identite as enum ('otp_seul', 'standard', 'renforce');
create type statut_signataire as enum ('en_attente', 'ouverte', 'signee', 'refusee');
create type type_evenement as enum (
  'creee', 'envoyee', 'ouverte', 'consultee', 'otp_envoye', 'otp_valide',
  'signee', 'refusee', 'expiree', 'scellee', 'telechargee'
);
create type statut_cle as enum ('active', 'detruite');

-- ─────────────────────────────────────────────────────────────
-- Tables
-- ─────────────────────────────────────────────────────────────
create table utilisateur (
  id                  uuid primary key default gen_random_uuid(),
  identifiant_public  text unique,
  telephone           text not null unique,
  niveau_verification niveau_verification not null,
  npi_hash            text unique,                 -- HMAC + pepper (I4), jamais le NPI en clair
  nom                 text,
  prenoms             text,
  date_verification   timestamptz,
  statut              statut_utilisateur not null default 'actif'
);

create table entreprise (
  id                    uuid primary key default gen_random_uuid(),
  raison_sociale        text not null,
  ifu                   text not null unique,
  rccm                  text not null unique,
  representant_legal_id uuid not null references utilisateur(id),
  statut_verification   statut_verification_entreprise not null default 'en_attente'
);

create table enveloppe (
  id                     uuid primary key default gen_random_uuid(),
  createur_id            uuid not null references utilisateur(id),
  entreprise_id          uuid references entreprise(id),
  titre                  text not null,             -- destiné à contenir du chiffré au repos
  document_hash_origine  text,                      -- figé à l'envoi (couche intégrité)
  mode                   mode_enveloppe not null,
  statut                 statut_enveloppe not null default 'brouillon',
  date_creation          timestamptz not null default now(),
  date_expiration        timestamptz,
  date_scellement        timestamptz,
  constraint scellement_coherent
    check ((statut = 'scellee') = (date_scellement is not null))
);

create table signataire (
  id                    uuid primary key default gen_random_uuid(),
  enveloppe_id          uuid not null references enveloppe(id),
  utilisateur_id        uuid references utilisateur(id),   -- nul pour un invité
  telephone             text not null,
  nom_declare           text not null,
  ordre                 int not null,
  niveau_identite_exige niveau_identite not null default 'standard',
  statut                statut_signataire not null default 'en_attente',
  date_signature        timestamptz
);

create table evenement (
  id                  uuid primary key default gen_random_uuid(),
  enveloppe_id        uuid not null references enveloppe(id),
  type                type_evenement not null,
  acteur              text not null,
  horodatage          timestamptz not null default now(),
  ip                  inet,
  user_agent          text,
  empreinte_appareil  text,
  donnees             jsonb
);

create table document_stocke (
  id              uuid primary key default gen_random_uuid(),
  enveloppe_id    uuid not null references enveloppe(id),
  version         int not null,
  hash_sha256     text not null,
  chemin_stockage text not null,              -- référence vers le stockage objet chiffré
  date            timestamptz not null default now(),
  immuable        boolean not null default true
);

create table enveloppe_cle (
  enveloppe_id     uuid primary key references enveloppe(id),
  kms_key_ref      text not null,             -- référence de clé au KMS, jamais la clé
  statut           statut_cle not null default 'active',
  date_destruction timestamptz
);

create index idx_signataire_enveloppe on signataire(enveloppe_id);
create index idx_evenement_enveloppe on evenement(enveloppe_id);
create index idx_document_enveloppe on document_stocke(enveloppe_id);

-- ─────────────────────────────────────────────────────────────
-- I6 — journal en ajout seul ; I3 — immuabilité du scellé
-- Triggers = garde active, y compris pour un accès privilégié.
-- ─────────────────────────────────────────────────────────────
create or replace function refuser_toujours() returns trigger
  language plpgsql as $$
begin
  raise exception 'Opération interdite sur %, table en ajout seul / immuable (I3/I6).', tg_table_name;
end;
$$;

create or replace function empecher_modif_enveloppe_scellee() returns trigger
  language plpgsql as $$
begin
  if old.statut = 'scellee' then
    raise exception 'Enveloppe scellée : immuable (I3).';
  end if;
  return new;
end;
$$;

-- Journal : ni UPDATE ni DELETE.
create trigger trg_evenement_no_update before update on evenement
  for each row execute function refuser_toujours();
create trigger trg_evenement_no_delete before delete on evenement
  for each row execute function refuser_toujours();

-- Document stocké : ni UPDATE ni DELETE.
create trigger trg_document_no_update before update on document_stocke
  for each row execute function refuser_toujours();
create trigger trg_document_no_delete before delete on document_stocke
  for each row execute function refuser_toujours();

-- Enveloppe : pas de DELETE ; pas d'UPDATE une fois scellée.
create trigger trg_enveloppe_no_delete before delete on enveloppe
  for each row execute function refuser_toujours();
create trigger trg_enveloppe_immuable before update on enveloppe
  for each row execute function empecher_modif_enveloppe_scellee();

-- ─────────────────────────────────────────────────────────────
-- RLS activé (deny par défaut). Politiques : migration ultérieure
-- (03-politiques-acces), avec le modèle d'authentification.
-- ─────────────────────────────────────────────────────────────
alter table utilisateur       enable row level security;
alter table entreprise        enable row level security;
alter table enveloppe         enable row level security;
alter table signataire        enable row level security;
alter table evenement         enable row level security;
alter table document_stocke   enable row level security;
alter table enveloppe_cle     enable row level security;

commit;
