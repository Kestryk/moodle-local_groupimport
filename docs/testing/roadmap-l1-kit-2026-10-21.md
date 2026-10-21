# Roadmap L1 — Kit43f2611 et consommateur EasyStud

Références vérifiées : Kit main43f2611 (distant relu), EasyStudc737a2e2.
Les quatre fichiers AMD générés non commités du worktree Claude sont préservés.
Les contrôles utilisent deux worktrees propres dédiés et des fixtures externes.

## Décision : aucune resynchronisation mécanique

EasyStud consomme des sources SCSS vendues dans scss/easyedu, des copies Guide
et un adaptateur Motion local. Pas de submodule, package/npm racine ni liaison
runtime au dépôt Kit. Le manifeste documentaire n'est pas un chargeur de code.

La navigation43f2611 provient d'EasyStud, avec des replis supplémentaires pour
les anciens consommateurs. Le probe amont, exécuté sur son vrai wrapper et ses
feuilles actuelles, relève zéro différence de propriétés calculées pour EasyStud.
Ces replis n'exigent donc pas une nouvelle copie vendue ou un rebuild du plugin.

Motion M3-1 ajoute des API préparatoires au Kit, pas un moteur substituable à
l'adaptateur EasyStud. Le module local possède déjà getLevel/setLevel,
scrollBehavior et respecte les choix utilisateur. Il possède aussi des helpers
Guide/menus/tiroir/clic absents du Kit. Aucun appel EasyStud ne réclame les nouveaux
finish/createRootOwner/dispose du Kit. Son contrat M1 conserve une propagation
de niveau à la page, différente de la portée explicite de M3-1.

Le rapport amont docs/reports/motion-m3-1-2026-10-20.md précise que les helpers
M3-1 ne sont pas encore level-aware et que M3-2 reste nécessaire. Remplacer le
module local casserait des exports et changerait cette politique. Ce n'est pas
une synchronisation mécanique. Aucun moteur ni manifeste n'est faussement épinglé
comme entièrement identique à main ; aucune nouvelle fonction n'est implémentée.

## Portes réellement rejouées

- audit-kit.ps1 :29constats connus,0nouveau, sortie0, sans mise à jour de baseline.
- Matrice M3-1 :129cas PASS ; garde legacy :5cas PASS.
- Caractérisation des vrais corps Motion EasyStud et des snapshots historiques :PASS.
- Navigation : zéro différence EasyStud ; le probe utilise une copie historique
  CCB externe, aucun dépôt CCB ni runtime n'est modifié.
-92contrats historiques, mêmes scripts et fixtures de consommation que M3-0,
  sources Kit remplacées par43f2611 :6PASS/86FAIL/0TIMEOUT, les92statuts identiques
  à la référence ddd30ce. Aucun PASS perdu ni nouvel échec. Les86échecs hérités
  ne sont pas présentés comme des PASS ou attribués à Motion.
- Le garde supplémentaire test-motion-level-fixture-contract reste FAIL :
  son mixin motion-policy n'est pas encore exporté par main. À la référence,
  ce garde échouait déjà faute d'API M3. Il reste hors des92contrats et n'est
  pas affaibli ; ce n'est pas une porte M3-2 verte.

La reprise du runner historique a d'abord rencontré une erreur de quoting de
chemin Windows dans le harnais Python. Le successeur n'a changé que ces chemins,
pas les scripts testés ou leurs assertions. Les logs initiaux restent conservés.

Preuves : C:/dev/artifacts/roadmap-l1-l4-20261021/ : audit-kit.log,
m3-matrix.json, legacy-motion.log, consumer-motion-characterization.json,
motion-api.json, navigation-proof/, current43-final/results.json,
contract-provenance.json et l1-summary.json.

Aucun code produit, runtime Moodle, build généré ou Kit main modifié. Les
compilations Sass et les navigateurs utilisés par les probes restent isolés,
headless et hors des serveurs Moodle. Pas de nouvelle entrée de CHANGELOG ou
contrat AI : il s'agit d'une vérification, pas d'un changement de fonctionnalité
ou de protocole partagé. La parité complète de tous les composants Kit n'est
pas revendiquée : cette conclusion couvre la fusion navigation/M3-1 demandée.
