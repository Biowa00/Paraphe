# 09.02 · Inventaire de composants

> **À quoi sert ce fichier.** Lister les composants nécessaires aux parcours, avec leur rôle et leurs états. Base d'un futur design system.
> **Quand la lire.** Avant de construire un écran.
> **Dépend de.** `01_features` (parcours), `01-jetons-design.md`.

Chaque composant a des **états explicites** (repos, focus, chargement, erreur, désactivé) et respecte les jetons.

## Primitifs

- **Bouton** (principal / secondaire / danger), avec état **chargement** (les actions réseau en 3G doivent montrer qu'elles travaillent).
- **Champ de saisie**, avec message d'erreur inline (jamais un contenu sensible dans l'erreur).
- **Champ OTP** — saisie de code à usage unique, gros chiffres, renvoi avec compte à rebours. Composant critique : il est sur le chemin de signature (I2).
- **Badge de statut d'enveloppe** — couleur + libellé + icône (jamais couleur seule).
- **Badge de niveau d'identité** — standard / renforcé, avec le badge « vérifié » visible sur les signatures renforcées.

## Spécifiques au métier

- **Pavé de signature (tracé)** — capture le tracé **à l'instant** (I1), effaçable/recommençable. Ne charge **jamais** un tracé antérieur pour l'apposer.
- **Visionneuse de document** — affichage PDF en lecture seule, performant en 3G (rendu progressif, pas de téléchargement bloquant), zoom.
- **Placement de zones de signature** — glisser-déposer d'une zone sur le document (côté émetteur).
- **Tunnel signataire (stepper)** — **trois écrans maximum** : ouvrir/lire → vérifier identité (selon niveau) → tracer + OTP. Progression lisible, retour possible.
- **Liste des signataires** — nom, statut, ordre (séquentiel), horodatage.
- **Carte d'enveloppe** — titre, statut, contreparties, dates ; unité de la liste d'archive.
- **Bloc de vérification** — résultat intègre/altéré, réutilisé dans la page publique et l'archive.

## Navigation & retours

- **En-tête minimal**, orienté action en cours (le tunnel signataire ne distrait pas).
- **États vides** utiles (archive vide → invite à créer/recevoir).
- **États d'erreur réseau** clairs, avec reprise — pas d'échec silencieux (`04_structure_rules/03`).
- **Notifications/toasts** sobres pour les confirmations (signé, envoyé, crédité).

## Internationalisation (préparer)

- Textes externalisés dès le départ. Interface signataire prévue en **fon et yoruba en V2** (cahier §9) : ne pas coder de texte en dur, prévoir des libellés extensibles (longueurs variables).
