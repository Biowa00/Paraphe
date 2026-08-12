# 09.01 · Jetons de design

> **À quoi sert ce fichier.** Fixer les jetons en **principes** (rôles, échelles, contraintes), sans figer de valeurs héx avant maquette.
> **Quand la lire.** Avant de dessiner un composant ou de choisir une couleur.
> **Dépend de.** `00_brief` §7, `00-INDEX`.

Principe : on définit des **rôles**, pas des valeurs brutes. Quand la marque sera arrêtée, on remplira les héx **sans changer les rôles**.

## Couleur

- **Palette restreinte, un seul accent.** Registre fintech épuré : beaucoup de surface neutre, un accent unique de marque, des couleurs sémantiques réservées aux statuts. La décoration ne doit jamais concurrencer la lisibilité.
- **Rôles** : `surface`, `surface-alt`, `texte`, `texte-attenue`, `bordure`, `accent`, `accent-contraste`.
- **Sémantique de statut d'enveloppe** (réutilisée partout : liste, badge, tableau de bord) : `en-cours`, `signee`, `complete`, `scellee`, `refusee`, `expiree`. Une couleur par statut, cohérente sur toutes les surfaces.
- **Contraste** : viser au moins le niveau AA. Ne jamais coder une information **uniquement** par la couleur (statut = couleur **+** libellé **+** icône).

## Typographie

- **Une famille solide et lisible**, avec un excellent rendu sur petit écran. Éviter les fantaisies : la confiance passe par la clarté.
- **Échelle limitée** (par ex. titre / sous-titre / corps / légende), définie en principes ; pas de multiplication des tailles.
- **Performance** : police système ou une seule police web **sous-ensemblée** (subset) et préchargée. Le poids typographique compte en 3G.

## Espacement, rayon, élévation

- **Unité de base** unique (grille cohérente) ; toutes les marges en multiples.
- **Rayons** discrets et constants.
- **Élévation minimale** : peu d'ombres, franches. Un fintech propre respire par le blanc, pas par les ombres portées.

## Mouvement

- **Animations sobres et courtes**, utiles (transition d'état, feedback), jamais décoratives.
- **Respecter `prefers-reduced-motion`.**
- En 3G, aucune animation ne doit bloquer l'affichage du contenu.

## Iconographie

- **Jeu d'icônes cohérent**, trait simple, lisible en petit. Une icône par statut d'enveloppe, réutilisée du tableau de bord au cachet (le QR excepté).

## Accessibilité (transverse)

- Cibles tactiles suffisantes (doigt, pas souris).
- Contraste AA, information jamais portée par la seule couleur.
- Parcours signataire opérable par une personne peu familière du numérique.
