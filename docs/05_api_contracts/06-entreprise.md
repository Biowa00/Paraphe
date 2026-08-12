# 05.06 · Endpoints — entreprise (V2)

> **À quoi sert ce fichier.** Contrats des parcours entreprise : création, membres/rôles, modèles, facturation, tableau de bord. Esquisse V2 — à préciser au moment du développement V2.
> **Quand la lire.** Au lot V2. Ignorer pour la V1.
> **Dépend de.** `01_features/07`→`13`, `03_rbac`, `07_database`.

Backend de confiance. Toutes les écritures respectent la matrice `03_rbac/03`.

## Compte et membres

### `POST /v1/entreprises`
- **Req** : `{ raison_sociale, ifu, rccm, delegation? }`. Le créateur (vérifié) devient Administrateur.
- **Rép 201** : `{ id, statut_verification: "en_attente" }`. Vérification représentant légal → revue possible.

### `POST /v1/entreprises/{id}/membres`
- **Req** : `{ utilisateur_ref, roles: [emetteur|validateur|…], habilitation_signature? }`.
- Réservé à l'**Administrateur**. Rôles multiples permis (cumul). Habilitation explicite et tracée.
- `date_ajout`/`date_retrait` gérées ; un retrait n'efface aucune signature passée (I3, I6).

## Circuit de validation

### `POST /v1/enveloppes/{id}/soumission`
Soumet au circuit interne (au lieu d'envoyer).
- **Rép 200** : `{ statut: "attente_validation" }`.

### `POST /v1/enveloppes/{id}/validation`
Approuve ou renvoie.
- **Req** : `{ decision: approuve|renvoye, motif? }`.
- Garde forte : `createur_ne_peut_valider` (`403`) si l'appelant a créé cette enveloppe. Approbation → part aux signataires.

## Modèles

### `POST /v1/entreprises/{id}/modeles` · `POST /v1/modeles/{id}/instancie`
- Un modèle capture document type, zones, rôles de signataires, niveaux exigés (modifiables à l'instanciation).
- L'instanciation crée une **enveloppe neuve** avec sa propre empreinte ; le modèle n'est jamais « signé ».

## Facturation

### `GET /v1/entreprises/{id}/facturation` · `POST …/abonnement`
- Abonnement **par siège + volume inclus**. Consommation imputée au compte entreprise. Export comptable.
- Rôle de gestion (Administrateur) : **aucun** accès au contenu (I7). Actions sensibles journalisées et notifiées.

## Tableau de bord (entreprise)

### `GET /v1/entreprises/{id}/tableau-bord`
- Métadonnées uniquement : enveloppes par statut, délai moyen, signataires en attente.
- **À ne pas confondre** avec le tableau de bord d'exploitation du Propriétaire (agrégats, `03_rbac/02`).

### `POST /v1/enveloppes/{id}/relance`
- Relance WhatsApp/SMS d'un signataire en attente. Plafond anti-harcèlement. Le destinataire n'est jamais facturé (I8).
