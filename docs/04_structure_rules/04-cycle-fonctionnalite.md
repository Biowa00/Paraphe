# 04.04 · Cycle de vie d'une fonctionnalité — bout en bout

> **À quoi sert ce fichier.** Interdire les fonctionnalités à moitié faites. Une fonctionnalité se construit en **tranche verticale complète**, du besoin à la preuve qu'elle marche — ou pas du tout.
> **Quand la lire.** Avant de commencer **toute** fonctionnalité, et à la revue avant de la déclarer terminée.
> **Dépend de.** `01_features` (le quoi), `02`→`09` (les couches), `ROADMAP.md` (l'ordre).

## La règle

**On ne livre jamais une fonctionnalité à moitié câblée.** Pas d'UI sans API dessous, pas d'API sans règle ni test, pas de règle sans la contrainte en base. Une tranche verticale traverse **toutes** les couches concernées et se termine par une **vérification de bout en bout**. Le demi-travail n'est pas du progrès : c'est de la dette qui a l'air d'un progrès.

C'est la façon dont les équipes sérieuses livrent : des **tranches fines mais complètes**, plutôt que des couches horizontales à moitié connectées.

## Definition of Ready — avant de commencer

Une fonctionnalité ne démarre que si :

1. **Sa fiche existe** dans `01_features` (le parcours est clair).
2. **Les décisions ouvertes qu'elle requiert sont tranchées** (voir `CLAUDE.md`). On ne code pas par-dessus un trou.
3. **Les invariants qu'elle touche sont identifiés** (lesquels de I1–I8 ?).
4. **Le périmètre exact du lot est fixé** (V1 / V2 / V3, cf. `ROADMAP.md`).

## Definition of Done — la checklist qui autorise « terminé »

Une fonctionnalité n'est **terminée** que quand **toutes** les cases concernées sont cochées :

- [ ] **Logique** (`02_logic`) : règles, machine à états, chaîne de preuve à jour et respectées.
- [ ] **Droits** (`03_rbac`) : autorisations posées, matrice respectée, cloisonnement vérifié.
- [ ] **Données** (`07_database`) : schéma + contraintes + **RLS** + migration. Aucune table livrée sans politique.
- [ ] **API** (`05_api_contracts`) : endpoints, schémas, erreurs, idempotence.
- [ ] **Services** (`06_services_catalog`) : fournisseur branché **avec son plan B**.
- [ ] **UI** (`09_components`) : composants et écrans, mobile d'abord, états d'erreur inclus.
- [ ] **Tests d'invariants** : un test qui **échoue si l'invariant est violé** pour chaque I concerné (`04_structure_rules/03`).
- [ ] **Vérification bout en bout** : le parcours réel est exécuté et observé (pas seulement des tests unitaires).
- [ ] **Docs à jour** : fiche `01` et fichiers de couche reflétant ce qui est livré.
- [ ] **`CLAUDE.md`** : état d'avancement mis à jour.

Si une case concernée n'est pas cochée, la fonctionnalité est **en cours**, pas terminée. On ne la présente pas comme faite (`04_structure_rules/03` + honnêteté de reporting).

## Ce qu'on ne fait jamais

- Livrer un écran qui appelle une API inexistante ou factice.
- Créer une table sans RLS « pour y revenir ».
- Marquer « fait » une fonctionnalité dont un invariant n'est pas testé.
- Étaler une fonctionnalité sur plusieurs lots en laissant un état intermédiaire cassé en production.

## Petites tranches, quand même

Bout en bout **n'est pas** « tout à la fois ». Une fonctionnalité se découpe en tranches **fines mais complètes** : la plus petite version qui traverse toutes les couches et rend un service réel. On préfère dix tranches complètes à une couche horizontale à moitié posée.
