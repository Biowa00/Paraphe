-- Migration 0004 — paiements Mobile Money (S5)
-- Source : docs/01_features/06, docs/05_api_contracts/05, docs/06_services_catalog/04.
-- Dépend de 0002 (enum titulaire_credit, table credit_transaction).
--
-- Ajoute la table `paiement` (achats Mobile Money en attente/confirmés) et un
-- lien d'idempotence côté registre : une transaction d'achat porte la référence
-- opérateur, unique, pour ne jamais créditer deux fois (double webhook).

begin;

create type statut_paiement as enum ('en_attente', 'confirme', 'echoue');

create table paiement (
  id                uuid primary key default gen_random_uuid(),
  titulaire_type    titulaire_credit not null,
  titulaire_id      uuid not null,
  pack_id           text not null,
  quantite          int not null,               -- crédits à créditer si confirmé
  montant           numeric not null,           -- prix payé
  devise            text not null default 'XOF',
  reference_externe text not null unique,        -- référence opérateur (idempotence)
  statut            statut_paiement not null default 'en_attente',
  date              timestamptz not null default now(),
  date_confirmation timestamptz
);
create index idx_paiement_titulaire on paiement(titulaire_type, titulaire_id);

-- Idempotence du crédit : une transaction d'achat référence son paiement.
-- Un second webhook avec la même référence ne peut pas insérer une 2e ligne.
alter table credit_transaction add column reference_externe text;
create unique index uq_credit_reference
  on credit_transaction(reference_externe) where reference_externe is not null;

-- RLS activé (deny par défaut). Politiques : migration ultérieure (auth).
alter table paiement enable row level security;

commit;
