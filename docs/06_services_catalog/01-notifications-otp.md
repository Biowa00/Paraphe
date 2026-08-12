# 06.01 · Notifications & OTP

> **À quoi sert ce fichier.** Le canal par lequel arrivent liens de signature, OTP et relances. Service **vital** : il est sur le chemin critique de la signature.
> **Dépend de.** `05_api_contracts/02` (OTP), `09` exigences non fonctionnelles du cahier (WhatsApp principal, SMS, e-mail secours).

## Rôle

- Livrer les **liens de signature** (invités).
- Livrer les **OTP** (inscription, signature, connexion).
- Livrer les **relances** (V2).

Hiérarchie de canaux (cahier §9) : **WhatsApp principal → SMS → e-mail en secours.**

## Pourquoi c'est vital

Si l'OTP n'arrive pas, la signature n'a pas lieu : contrat perdu. Ce service conditionne directement la disponibilité perçue (99,5 %).

## Critères de choix

- **Couverture réelle des opérateurs béninois** (livraison SMS effective, délais).
- **Accès à l'API WhatsApp Business** et statut de fournisseur agréé.
- **Coût unitaire** SMS et conversation WhatsApp ; paliers de volume.
- **Fiabilité / SLA**, taux de livraison mesuré, reporting.
- **Bascule multi-canal** native ou à orchestrer côté Paraphe.

## Inducteurs de coût — point de vigilance majeur

Le **coût des SMS à l'échelle** est un risque identifié (cahier §11). Leviers :

- **Privilégier WhatsApp** (souvent moins cher et plus riche que le SMS) quand le numéro est joignable.
- **Plafonner les relances** (anti-harcèlement + coût, `01_features/13`).
- Négocier tôt des tarifs de volume avec les opérateurs.
- Ne pas ré-émettre d'OTP inutilement (fenêtre de validité raisonnable).

## Candidats à évaluer *(non tranché)*

- **WhatsApp Business API** via un BSP (fournisseur de solution) — à choisir sur présence Bénin et tarifs.
- **Agrégateur SMS** à couverture Afrique de l'Ouest / Bénin.
- **Passerelle directe opérateur** (MTN, Moov/Celtiis) si les volumes le justifient.

## Plan B / dégradation

- **WhatsApp indisponible** → bascule automatique **SMS**.
- **SMS échoue** → **e-mail** si disponible ; sinon, l'émetteur est informé que le destinataire n'est pas joignable (pas d'échec silencieux).
- **Fournisseur principal en panne** → **second fournisseur** configuré en secours pour l'OTP (le chemin de signature ne doit pas dépendre d'un seul prestataire).
- Idempotence des envois pour éviter les doublons lors d'une bascule.
