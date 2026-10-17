# Correctifs ciblés du Guide — 17 octobre 2026

Base : `64db2140`, branche `work/codex2/easystud-guide-fixes-20261017`.
Suite de la recette `662a1560`. Seul le runtime `http://localhost:8051`
est utilisé ; aucune publication sur le runtime principal.

## Changements et contrat conservé

- C-G3 : seule `discovery_simulation_short` devient « Exemple » / « Example ».
  Le texte long de sécurité reste inchangé.
- J-G2 : les deux phases de lecture de l’ajout sur bureau gagnent chacune
  cinq secondes ; les cinq phases d’inspection perdent chacune 350 ms ; les
  phases du déplacement compact gagnent chacune 250 ms. Il s’agit de temps
  de lecture des consignes existantes, sur l’horloge annulable/pausable ;
  aucune boucle décorative ni animation de hauteur. Motion et ses niveaux
  restent inchangés : réduction des gestes, pas du temps de lecture.
- J-G3 : si le nœud suivi disparaît, le Guide résout à nouveau la cible de
  l’étape active. Une cible temporaire de feuille/menu encore visible garde
  sa priorité. La position par défaut de la checklist ne s’applique qu’en
  absence des classes de docking existantes : le placement à gauche/droite
  peut ainsi fonctionner sans nouveau composant ni nouvelle mesure visuelle.
  Le rafraîchissement pendant le défilement suit également la cible la plus
  récente (menu puis confirmation). L’alignement extérieur attend la fin réelle
  du défilement intérieur au lieu de mesurer sa position à mi-parcours.
  Chaque nouvelle étape remplace explicitement la cible en attente avant le
  défilement : une sélection précédente ne peut plus reprendre la priorité,
  y compris quand le défilement réduit/minimal se termine immédiatement.
  À 768 px, le repli garde son état mais recalcule la place disponible après
  sa transition : le premier rectangle, encore grand, n’empêche plus le dock
  supérieur du panneau réduit. Les conteneurs intérieurs réservent la même
  marge inférieure que le défilement extérieur (valeurs existantes), afin de
  ne pas laisser une cible sous les actions fixes en bas de l’écran.

La spec successive attend les animations réelles après l’ajout. Elle ne clique
sur « Effacer la sélection » que si une case de participant reste cochée ;
une barre sortante sans sélection ne constitue plus un faux prérequis. Les
oracles de surbrillance, de clic natif et de non-recouvrement restent stricts.

## Recette

Pilote FR390 puis FR/EN ×1600/1280/768/390 ×Complètes/Réduites/Minimales.
Inspection diapositive6, ajout/déplacement diapositive8, badge court mobile,
parcours réglages groupe, réglages groupement et actions jusqu’à leur fin.
Les gestes et écritures sont natifs ; cours/comptes synthétiques isolés,
réinitialisation des appartenances entre cellules, suppression en fin de lot.
La surbrillance doit correspondre à sa cible à2px près, sans recouvrement
par la checklist et avec centre accessible par `elementFromPoint`.

Les preuves détaillées restent dans
`C:/dev/Moodle 51 Perf/moodle/local/guide-fixes-20261017`.
Résultats définitifs : voir `recette-guide-fixes-17-10-2026.md` et son JSON.

## Report demandé à Codex n°1

Le Kit n’est pas modifié par Codex n°2. Appliquer le patch
`guide-fixes-kit-mirror-20261017.patch` à
`C:/dev/worktrees/easyedu-ui-kit-guide-mirror-20261017` :

- `guide/amd/src/easyedu_guide.js` : temps de lecture et résolution de cible ;
- `scss/easyedu/components/_guide-discovery.scss` : défaut de docking conditionnel.

Le miroir embarqué dans le plugin reprend le même comportement JS.
Sur le Kit réel, les gardes de parité doivent rester en échec tant que le
report n’a pas été intégré. La projection externe du patch permet de vérifier
le roundtrip sans écrire dans le dépôt Kit. Le vieux test de préservation
T037 est lié à `22b0d16` et échoue déjà sur la base demandée ; il n’est pas
modifié pour masquer cet écart historique.

Penpot : badge « Exemple / Example » à390 ; checklist droite/gauche et
repli/top selon la cible, entrées des réglages et étapes du parcours actions.
Aucune modification des dimensions, couleurs, rayons ou typographies du Kit.
