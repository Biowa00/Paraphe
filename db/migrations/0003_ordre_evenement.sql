-- Migration 0003 — ordre stable des événements
-- Deux événements peuvent partager le même horodatage (ex. otp_valide et signee
-- émis au même instant). Il faut un ordre total pour reconstituer le journal
-- exactement dans l'ordre où il s'est écrit.

begin;

alter table evenement add column seq bigint generated always as identity;
create index idx_evenement_ordre on evenement(enveloppe_id, seq);

commit;
