# I13 / X4 / X5 — composants, tokens et spécificité

Base : publication I12 `9838d0b0`, Kit canonique `40a4c06`.

## Implémentation

- I13 : les règles de `_k16-finish.scss` et `_k17-car.scss` sont replacées dans les sept partiels de leur composant (cartes légères, pagination/listes, filtres, étiquettes, structure, participants, layout). Les deux partiels de lots et leurs imports sont retirés. Le contrôle Sass conserve exactement les **21488 entrées** de déclaration : sélecteurs, contextes média, propriétés, valeurs, priorité et multiplicité. Seul l’ordre de leur émission change ; la preuve native reste obligatoire.
- Les deux requêtes média de drag consomment `responsiveWorkspaceQuery`. Les prédicats `(hover: none), (pointer: coarse)` sont conservés ; la chaîne recomposée est strictement identique à l’ancienne. Aucun token de breakpoint n’est créé et aucune autre fonction drag n’est modifiée.
- X4 : six occurrences sont remplacées par quatre tokens existants (`surface`, `count-bg/border/text`). Trois autres substitutions candidates sont retirées avant publication : les tokens `group-soft` et `grouping-soft` suivent la palette configurée et ne représentent pas la peinture fixe de ces variantes. Le pilote démontre pour un compteur le passage de `rgb(234,246,239)` à `color(srgb 0.907686 0.939176 0.923216)` ; ce changement n’est pas accepté. Les **22 lignes restantes** sans équivalent sémantique exact restent intactes, dont l’accent `#72508c` des groupes sans groupement. Aucun token approximatif n’est inventé.
- X5 : dans le Kit, six priorités de couleur/fond/bordure du bouton de départ du Guide sont retirées ; leur sélecteur de composant doit suffire face aux boutons Moodle. Deux `text-decoration-line: none !important` redondants avec `text-decoration: none !important` sont supprimés. Les 43 priorités Guide restantes (autres commandes, focus, Motion et messages) et 31 priorités d’aide sont conservées. Les 18 priorités responsive restent intactes (affichage/hidden/édition et paddings d’arbre), faute de preuve globale permettant de les retirer sans risque sur les états pris en charge.
- X6 : aucune migration Bootstrap, classe `sr-only`/`custom-select`/`form-group` ou attribut `data-target`.

## Contrôles acquis, recette en cours

- Build AMD officiel : exit 0, graphe sans cycle. Seuls drag_drop/drag_support et leurs maps changent. 34 maps réécrites uniquement pour des fins de ligne échappées dans sourcesContent ont été conservées depuis le parent après vérification de l’identité des mappings et du contenu source décodé.
- ESLint avec le même chemin/configuration pour l’entrée historique et finale : drag_drop **1 erreur / 2 avertissements → 1 / 2**, drag_support **0 / 0 → 0 / 0**. La longueur de ligne préexistante n’est pas corrigée hors périmètre. Les avertissements de métadonnées Browserslist sont isolés sans installation de dépendance.
- `test-security-escaping.cjs`, `test-filter-engine.cjs` et contrat d’aide partagée (9 assertions) : PASS.
- La recette native doit encore valider la cascade réordonnée, les couleurs résolues, les cartes sélectionnées et le bouton Guide/aide en repos/survol/focus. Ce document ne revendique pas encore son acceptation finale.

## Emplacements à réviser

`C:/dev/artifacts/easystud-claude-interface-review-20261011/revue-2026-10-11/I12-CONSOMMATEUR-20261022/` : `i13-moves.json`, `audit-i13-linear.log`, `i13-declaration-delta.json`, `x4-colour-inventory.json`, `generated-map-audit.json`, `eslint-comparison.json`, `cleanup-amd-exact-exit.stdout.log`, `cleanup-contextual-help.log`.

Kit X5 préparé dans `C:/dev/worktrees/easyedu-codex2-x5-20261022`, branche `work/codex2/easyedu-x5-specificity-20261022`. Rien n’est publié sur localhost :80 ni sur les autres copies.
