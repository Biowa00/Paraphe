# 09.03 · Cachet apposé sur le PDF

> **À quoi sert ce fichier.** Spécifier le cachet — l'élément le plus vu du produit, celui qui circule hors de l'app. Le design system part de lui.
> **Quand la lire.** Avant de générer un PDF scellé.
> **Dépend de.** `02_logic/02` (preuve, cachet serveur), `05_api_contracts/04` (vérification), `00-INDEX`.

## Registre : sobre institutionnel, délibérément austère

Le cachet **n'est pas** dans le registre fintech moderne du reste du produit. Il doit lire comme une **mention légale / un tampon officiel** : noir, compact, typographique. Sa sobriété **est** son message — il inspire le sérieux d'un acte.

## Contenu (informations minimales et suffisantes)

- **`PARAPHE`** + mention de niveau (`vérifié` / `standard`) du/des signataire(s).
- **Identifiant d'enveloppe** lisible, format `BJ-XXXX-XXX`.
- **Date et heure** de scellement (et fuseau).
- **URL de vérification** en clair (ex. `paraphe.bj/v/XXXXXXX`).
- **QR code** vers la page de vérification publique.

Exemple de disposition (coin de page, ~4 cm) :

```
┌────────────────────────────────┐
│ PARAPHE · vérifié        [QR]  │
│ Enveloppe BJ-7F3A-2C1          │
│ Scellé le 12/08/2026 14:03 UTC │
│ paraphe.bj/v/7F3A2C1           │
└────────────────────────────────┘
```

## Règles de robustesse (non négociables)

- **Noir sur blanc pur.** Aucune information portée par la couleur : le cachet doit rester intégralement lisible après **photocopie N&B, fax, scan de mauvaise qualité**.
- **Redondance QR ↔ texte.** Si le QR est illisible (impression dégradée), l'**identifiant + l'URL en clair** suffisent à retrouver et vérifier le document. Jamais de dépendance au seul QR.
- **Contraste et taille** garantissant la lisibilité de l'identifiant à l'œil nu sur un tirage médiocre.
- **Pas de trame fine ni de dégradé** (ne survivent pas à la photocopie).

## Multi-signataires

- Le cachet en pied de page reste **compact** : il porte l'identité de l'**enveloppe** et le lien de vérification, pas la liste complète.
- La **liste détaillée des signataires** (identité, niveau, horodatage) vit dans le **dossier de preuve** (`02_logic/02`) et sur la page de vérification, pas dans le pied de page.

## Ce que le cachet ne fait jamais

- Il **ne contient aucun contenu** du document, aucun NPI, aucune donnée personnelle au-delà de ce qui est strictement nécessaire à l'identification de l'enveloppe.
- Il **n'est pas** une signature tracée apposée (I1) : c'est un sceau de plateforme (cachet serveur, `02_logic/02`), plus le renvoi vérifiable.
- Il ne prétend jamais à la signature **qualifiée** : la mention reste cohérente avec le statut **avancé**.

## Cohérence de marque

Le QR et l'identifiant relient le monde papier au monde numérique : quiconque scanne tombe sur la **page de vérification** (registre moderne). Le cachet austère et la page moderne sont les **deux faces** d'une même promesse — l'acte et sa vérification.
