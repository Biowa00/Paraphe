# 02.03 · Règles d'identité

> **À quoi sert ce fichier.** Définir les niveaux d'identité, ce que chacun exige, la règle d'OTP frais, la vivacité, le face-match, le traitement du NPI et la purge des pièces.
> **Quand le lire.** Avant de spécifier l'inscription, le tunnel signataire, ou toute table touchant l'identité.
> **Dépend de.** `00_brief/` (I1, I2, I4, I5), `06_services_catalog` (OCR, vivacité, OTP), le cahier §5.1 et §3.4.

## Les trois niveaux d'identité exigibles

L'émetteur fixe, **par signataire**, le niveau exigé. Trois niveaux, du plus léger au plus fort :

| Niveau | Exige | Selfie sert à | Preuve produite |
|---|---|---|---|
| **OTP seul** | OTP frais | — | faible enjeu (ex. accusé de lecture, décharge simple) |
| **Standard** | OTP frais + selfie **vivacité** | prouver qu'un **humain vivant** signe | standard (cas de l'invité) |
| **Renforcé** | OTP frais + **pièce d'identité** + **face-match** | comparer le selfie au portrait de la pièce | renforcé (cas du compte vérifié) |

Point clé souvent mal compris : au niveau **Standard**, l'invité n'a **pas de pièce**, donc **pas de portrait de référence**. Le selfie y prouve la **vivacité**, jamais l'identité. Le face-match n'existe **qu'au niveau Renforcé**.

**Défaut retenu** : si l'émetteur ne précise rien, le niveau exigé est **Standard**. L'émetteur peut l'abaisser (OTP seul) ou l'élever (Renforcé). *(Défaut de conception, ajustable — noté ici pour ne pas rester implicite.)*

## OTP frais — I2

- L'OTP est exigé **à chaque signature**, pas seulement à la connexion. Une session valide ne suffit pas ; une session volée ne permet pas de signer.
- Chaque OTP est **à usage unique** et **à durée de validité courte** (valeur exacte à fixer en `06`/`08`).
- Événements journalisés : `otp_envoye`, `otp_valide`.

## Vivacité et face-match

- **Vivacité** : un mouvement demandé **aléatoirement** ; contre-mesure aux photos/rejeu. Requise dès le niveau Standard.
- **Face-match** (Renforcé uniquement) : comparaison du selfie au portrait extrait de la pièce → **score de correspondance**.
- **Aucune donnée biométrique n'est conservée** : le selfie sert à la comparaison **puis est supprimé**. Le traitement biométrique relève d'un régime d'autorisation renforcé, écarté tant qu'il n'apporte pas de valeur décisive.

## Score intermédiaire → revue manuelle

Un score de face-match **intermédiaire** ne déclenche **jamais un rejet sec** : il bascule vers une **revue manuelle sous 24 h**, traitée par un opérateur de vérification (rôle défini en `03_rbac`). L'opérateur ne conserve **aucune** pièce après décision.

## NPI — I4

- Le NPI extrait par OCR n'est **jamais stocké en clair**.
- Il est transformé en **`HMAC-SHA256(NPI, pepper)`**, le **pepper** étant détenu au **KMS**, hors base.
- Ce hash est **déterministe** : il permet de vérifier l'**unicité** d'un compte (même NPI → même hash → création bloquée si un compte actif existe déjà). Un sel aléatoire par enregistrement est **exclu** : il empêcherait cette vérification.
- Une fuite de la base seule reste **inexploitable** sans le pepper.

## Pièces d'identité — I5

- Les images de pièces sont **chiffrées au repos** le temps de la vérification.
- Elles sont **purgées après vérification**. On ne conserve que le **résultat** de la vérification et un **identifiant de contrôle**.
- Même politique pour les justificatifs d'entreprise contenant des données personnelles.

## Réutilisabilité de l'identité vérifiée

Une identité confirmée (niveau 2) est **réutilisable indéfiniment**. À une signature ultérieure exigeant le Renforcé, l'identité déjà vérifiée est réutilisée : seul l'**OTP frais** (et le **tracé**) sont redemandés à l'instant. On ne refait pas l'OCR/face-match à chaque fois — mais on ne dispense **jamais** de l'OTP frais ni du retracé (I1, I2).

## Ligne rouge (rappel §4bis.4)

Aucun compte interne ne peut créer un compte vérifié **sans que le parcours d'identification ait été effectivement suivi** (I7). Impossible par construction, pas seulement interdit.
