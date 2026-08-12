# 05.04 · Endpoints — vérification publique

> **À quoi sert ce fichier.** Contrat de la page publique de vérification, sans compte.
> **Quand la lire.** Pour la page publique et l'affichage du cachet.
> **Dépend de.** `01_features/04`, `02_logic/02` (chaîne de preuve, ancrage).

Sans authentification. Gratuit par principe. C'est le principal levier d'acquisition — la réponse doit être rapide et lisible.

### `POST /v1/verification`
Vérifie un document déposé, ou un identifiant lu sur le cachet.
- **Req** : `multipart` (PDF) **ou** `{ enveloppe_ref }`.
- **Rép 200** :
```
{
  "integre": true,
  "statut": "scellee",
  "signataires": [
    { "nom": "…", "niveau": "renforce", "date_signature": "…" }
  ],
  "ancrage": { "date": "…", "reference_publique": "…" },
  "dossier_preuve_url": "…"
}
```
- **Ne divulgue jamais le contenu** du document à un tiers non partie (I7) : seulement intégrité, signataires, niveaux, dates, et le lien vers le dossier de preuve.
- **Document altéré** → `{ integre: false, raison: "modifie_apres_signature" | "aucune_correspondance" }`. Message neutre, sans fuite d'information sur d'autres archives.
- **Enveloppe crypto-shreddée** → l'intégrité et les métadonnées restent vérifiables ; le contenu n'est plus lisible (`contenu: "efface"`).

### `GET /v1/ancrage/{date}`
Expose l'empreinte globale publiée pour une date (transparence de l'ancrage).
- **Rép 200** : `{ date, empreinte_globale, support, reference_publique }`.
- Permet à un tiers de recouper l'ancrage avec le support public indépendant (support = décision ouverte).

> Ces deux endpoints sont en **lecture seule** et ne révèlent que ce qui est nécessaire à la preuve. Ils n'exposent aucune liste d'enveloppes, aucun contenu.
