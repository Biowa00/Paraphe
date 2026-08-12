# 09.05 · Page de vérification publique

> **À quoi sert ce fichier.** Spécifier la page où quiconque vérifie un document, sans compte. C'est le **principal levier commercial** : chaque document signé qui circule y ramène un nouvel utilisateur.
> **Quand la lire.** Avant de concevoir cette page.
> **Dépend de.** `01_features/04`, `05_api_contracts/04`, `02_logic/02`.

## Intention

Donner à un tiers — un partenaire, une banque, un juge — la preuve **par lui-même**, en quelques secondes, sans rien installer ni créer de compte. La page arrive souvent depuis le **QR du cachet** (`03`) : la continuité papier → écran doit être évidente.

## Parcours

1. **Entrée** : déposer un PDF, **ou** arriver directement via l'identifiant du cachet (`/v/XXXXXXX`).
2. **Réponse immédiate et lisible** :
   - **Intègre** ✓ ou **altéré** ✗ (verdict clair, gros, en premier).
   - **Signataires** avec leur **niveau d'identité** (standard / renforcé).
   - **Date et heure** de chaque signature.
   - **Lien vers le dossier de preuve complet**.

## Ton et lisibilité

- Registre **moderne épuré**, mais le verdict prime sur l'esthétique : un non-technicien doit comprendre en une seconde si le document est fiable.
- **Rassurant même quand le document est altéré** : message neutre et factuel (« ce document ne correspond à aucune version scellée » / « version modifiée après signature »), sans dramatiser ni accuser.

## Ce que la page ne montre jamais

- **Aucun contenu** du document à un tiers non partie (I7) : seulement intégrité, signataires, niveaux, dates.
- **Aucune liste** d'enveloppes, aucune donnée d'un autre document (pas de fuite par recoupement).
- Pour une enveloppe **crypto-shreddée** : l'intégrité et les métadonnées restent vérifiables, le contenu est marqué **effacé**.

## Performance

- Page **très légère**, réponse rapide : elle est vue par des inconnus, souvent en mobilité, en 4G/3G. C'est la première impression du produit pour un futur client — elle doit être irréprochable et instantanée.

## Prolongement commercial (discret)

- Après le verdict, une invitation **sobre** : « Vous aussi, faites signer et sceller vos documents. » Jamais intrusive, jamais avant d'avoir rendu le service de vérification.
