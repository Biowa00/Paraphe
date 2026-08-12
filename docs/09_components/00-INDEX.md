# 09 · Composants & design — index

> **À quoi sert ce dossier.** Le design system : jetons, inventaire de composants, et les trois surfaces à fort enjeu — le **cachet PDF**, la **landing**, la **page de vérification publique**.
> **Quand le lire.** Avant de dessiner ou coder une interface, avant la landing.
> **Dépend de.** `00_brief` §7 (direction design), `01_features` (parcours à afficher), `02_logic/02` (ce que le cachet et la vérif prouvent).

## Le point de départ : le cachet, pas la landing

L'élément le plus vu du produit **n'est pas la landing** : c'est le **cachet en bas d'un PDF signé**, en noir, en petit, à côté d'une date. C'est lui qui circule de main en main. **Le design system part de là** (`03-cachet-pdf.md`).

## Deux registres visuels assumés

| Surface | Registre | Pourquoi |
|---|---|---|
| **Cachet PDF** | Sobre institutionnel, noir, typographique | Circule hors de l'app, doit lire comme un acte officiel, survivre à la photocopie/fax |
| **App, landing, page de vérif** | Moderne épuré tech-fintech | S'adresse à un gérant de PME sur mobile ; rassure par la clarté, pas par la décoration |

Ce n'est pas une incohérence : c'est une hiérarchie. Le cachet est le **sceau** ; le reste est l'**expérience**.

| Fichier | Contenu |
|---|---|
| [01](01-jetons-design.md) | Jetons de design (principes, sans héx figé) |
| [02](02-inventaire-composants.md) | Inventaire de composants |
| [03](03-cachet-pdf.md) | Spécification du cachet apposé sur le PDF |
| [04](04-landing.md) | Spécification de la landing page |
| [05](05-page-verification.md) | Spécification de la page de vérification publique |

## Contraintes qui gouvernent tout (cahier §7, §9)

- **Mobile d'abord**, téléphone milieu de gamme, **4G/3G irrégulière** : le poids et la performance ne sont **pas** un détail de fin de projet.
- **La confiance est le sujet** : chaque choix visuel répond à « puis-je confier mes contrats à ces gens ».
- **Parcours signataire : trois écrans maximum**, utilisable par une personne peu familière du numérique.
