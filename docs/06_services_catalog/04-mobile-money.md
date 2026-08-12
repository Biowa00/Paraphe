# 06.04 · Mobile Money

> **À quoi sert ce fichier.** L'encaissement des crédits (particulier/PME) et, en V2, de la facturation entreprise.
> **Dépend de.** `05_api_contracts/05` (crédits), `01_features/06`, `10` du cahier (modèle éco).

## Rôle

Encaisser en **Mobile Money**, moyen de paiement réel du marché visé. Pas d'abonnement en entrée de gamme : achat de crédits à l'usage.

## Critères de choix

- **Couverture des portefeuilles dominants au Bénin** (voir candidats).
- **Robustesse des webhooks de confirmation** et réconciliation.
- **Coût par transaction** et frais de retrait/settlement.
- **Délais de règlement** vers le compte de l'exploitant.
- Qualité du **sandbox** pour tester sans mouvement réel.

## Candidats à évaluer *(non tranché)*

- **MTN MoMo** (API dédiée) — portefeuille majeur au Bénin.
- **Moov Money** (Moov Africa / Celtiis) — second portefeuille majeur.
- **Agrégateur de paiement** couvrant plusieurs portefeuilles via une seule intégration (réduit le travail d'intégration, ajoute une marge et une dépendance).

> Idéalement, couvrir **les deux portefeuilles dominants** dès la V1 : exclure l'un revient à refuser une part du marché.

## Inducteurs de coût

- **Frais par transaction** (souvent un pourcentage) → pèsent sur la marge des petits paniers de crédits.
- Frais de **settlement/retrait**.
- Coût d'intégration multiple vs marge d'un agrégateur.

## Règles métier à respecter (rappel)

- Confirmation via **webhook signé** ; crédit **idempotent** (jamais de double crédit sur double notification, `05_api_contracts/05`).
- Échec/interruption → **aucun crédit débité**, solde inchangé.
- Le **destinataire ne paie jamais** (I8) : Mobile Money ne concerne que l'émetteur.

## Plan B / dégradation

- **Un portefeuille en panne** → l'autre reste proposé ; l'achat n'est pas bloqué globalement.
- **Webhook manqué** → réconciliation par interrogation périodique du statut de transaction (ne jamais créditer sans confirmation vérifiée).
- Panne totale de l'encaissement → n'affecte **pas** la signature en cours (les crédits déjà acquis restent utilisables) ; seul l'achat est suspendu.
