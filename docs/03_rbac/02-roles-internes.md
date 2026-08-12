# 03.02 · Rôles internes de l'exploitant

> **À quoi sert ce fichier.** Définir les rôles de l'équipe qui exploite le SaaS, ce que chacun peut et ne peut **jamais** faire, le modèle de non-cumul, le double contrôle et l'accès exceptionnel.
> **Quand la lire.** Avant de créer le moindre accès d'administration, avant `08_environments`.
> **Dépend de.** `00_brief/` (I7), `02_logic/04` (séparation base/clés, journal externalisé), cahier §4bis.

## Principe fondateur

**L'exploitant administre un commerce, pas un contenu.** Il pilote comptes, facturation, plans, modération, supervision. Il n'a **aucun** accès en lecture au contenu des documents, ni **aucune** capacité d'écriture sur une enveloppe scellée. Cette limitation est un argument de vente et une protection : ne pas pouvoir accéder, c'est ne pas pouvoir être contraint de produire hors procédure.

## Les cinq rôles

| Rôle | Peut faire | Ne peut **jamais** faire |
|---|---|---|
| **Propriétaire** | Gérer plans tarifaires, facturation, comptes entreprise ; suspendre un compte ; consulter les statistiques agrégées | Lire un document, accéder à une pièce d'identité, agir sur une enveloppe |
| **Administrateur technique** | Déployer, superviser l'infra, restaurer une sauvegarde | Déchiffrer un document, modifier un journal, agir **seul** sur une restauration |
| **Agent support** | Voir statut d'une enveloppe, dates, destinataires ; relancer une notification | Ouvrir un document, voir son titre complet ou son contenu |
| **Opérateur de vérification** | Traiter les revues manuelles d'identité en attente | Consulter un dossier hors file d'attente, conserver une pièce après décision |
| **Auditeur conformité** | Lire les journaux et rapports d'accès | Modifier ou supprimer quoi que ce soit |

Le **Propriétaire** est un rôle de **gestion**. Toute action sensible qu'il déclenche (suspension d'un compte, changement de plan) est **journalisée et notifiée au client** concerné.

## Modèle de non-cumul (décision actée)

Le §4bis dit « aucun compte ne cumule ces rôles ». On tient la règle en deux temps, selon ce qui peut être garanti :

**Par construction — jamais cumulable, indépendant de toute discipline :**

- **Détenteur de la base ≠ détenteur des clés (KMS).** Aucun compte, aucun composant ne réunit les deux (cf. `02_logic/04`).
- **Double contrôle imposé par le système** pour les opérations critiques (liste ci-dessous) : deux comptes distincts, sinon l'opération n'aboutit pas.
- **Journal en ajout seul, répliqué hors du contrôle des administrateurs** (I6) : un admin ne peut pas effacer la trace de son passage.

**Par politique tracée — au démarrage à effectif réduit :**

- Les rôles opérationnels (**Agent support**, **Opérateur de vérification**, **Auditeur conformité**) sont portés par des comptes distincts de ceux qu'ils contrôlent.
- Le **2ᵉ acteur** requis pour un double contrôle peut être un prestataire externe au lancement.
- Chaque écart éventuel est **tracé** dans le journal externalisé et relève de l'exception, pas de la norme.

> Ce que la séparation par construction garantit ne repose sur **personne** ; ce qui relève de la politique repose sur la trace et le 2ᵉ acteur. On ne met **jamais** une séparation touchant la preuve du côté « politique ».

## Opérations exigeant le double contrôle

Deux comptes internes distincts, sinon l'opération échoue :

- **Restauration d'une sauvegarde.**
- **Destruction d'une clé d'enveloppe** (crypto-shredding, cf. `02_logic/04`).
- **Accès exceptionnel** (ci-dessous).
- **Modification d'un plan tarifaire global.**

## Accès exceptionnel encadré

Mécanisme de dernier recours pour incidents graves. Il exige : **justification écrite**, **double contrôle**, **limitation dans le temps**, et **notification automatique du client**. **Aucun accès silencieux.** Même ce mécanisme ne donne pas les moyens de violer un interdit par construction (il ne fabrique pas de clé absente, ne réécrit pas le journal).

## Réquisition judiciaire

Procédure documentée : une demande d'autorité ne donne accès qu'aux **métadonnées** et au **dossier de preuve**, sauf décision de justice explicite portant sur le contenu. Le client est informé **lorsque la loi le permet**.

## Interdits absolus (§4bis.4 — rappel)

Aucun compte interne, quel que soit son niveau, ne peut : signer au nom d'un tiers ; créer un compte vérifié sans parcours effectif ; modifier une signature, un horodatage ou un événement de journal ; altérer une empreinte ; rejouer un tracé stocké. Ces interdits sont **impossibles par construction** (cf. `02_logic/04`), pas seulement défendus.
