# 05.05 · Endpoints — crédits et paiement

> **À quoi sert ce fichier.** Contrats du solde et de l'achat de crédits en Mobile Money.
> **Quand la lire.** Pour l'écran de recharge et la consommation.
> **Dépend de.** `01_features/06`, `06_services_catalog` (Mobile Money), `07_database/01` (`credit_transaction`).

Backend de confiance. Le **destinataire ne paie jamais** (I8) — aucun de ces endpoints ne le concerne.

### `GET /v1/credits/solde`
- **Rép 200** : `{ solde, dont_bienvenue }`. Le solde est la somme du registre `credit_transaction` (ajout seul), pas un compteur mutable.

### `GET /v1/credits/packs`
- **Rép 200** : `[{ pack_id, quantite, prix, devise }]`. Prix = décision ouverte (entretiens PME).

### `POST /v1/credits/achat`
Initie un achat Mobile Money.
- **Req** : `{ pack_id }` + `Idempotency-Key`.
- **Rép 200** : `{ transaction_id, statut: "en_attente", instructions_paiement }`.

### `POST /v1/credits/mobile-money/callback`
Webhook opérateur (signé/authentifié).
- Confirme ou échoue la transaction ; crédite le solde **une seule fois** (idempotent) sur succès.
- Échec/interruption → **aucun crédit débité**, solde inchangé.
- Double notification opérateur → réconciliation, jamais de double crédit.

### Consommation (interne)
Un crédit est débité à l'**envoi** d'une enveloppe (`03-enveloppes` → `/envoi`), via une transaction `consommation`. Les crédits `bienvenue` (3 à l'inscription) **n'expirent pas** et ne sont pas renouvelables.

> La **facturation centralisée entreprise** (abonnement par siège, export comptable) est un contrat distinct, en `06-entreprise.md` (V2).
