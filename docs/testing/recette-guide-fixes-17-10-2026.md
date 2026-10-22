# Recette ciblée des correctifs du Guide — 17 octobre 2026

Suite de `662a1560`. Base `64db2140`, démos `ce872af0`, parcours `359c4739`, complément M1 `daa587f3`, runtime :8051 uniquement.
Le complément M1 conserve la seconde phase de lecture de l’ajout desktop en Réduites/Minimales, auparavant sautée par la garde du fantôme animé. Les huit cellules concernées sont rejouées et remplacent les mesures antérieures correspondantes ; les autres branches de démo et les parcours restent inchangés.

| Lot | Résultat | Preuve |
| --- | --- | --- |
| C-G3 | PASS | 18 badges mobiles ; variante courte FR/EN, texte long conservé. |
| J-G2 | PASS | 72 démos ; Complètes 22304–25509 ms ; aucune animation de hauteur. |
| J-G3 | PASS | 72 parcours, cibles peintes, delta ≤ 2 px, centres accessibles et chevauchement nul exigés. |

24 cellules : FR/EN × 1600/1280/768/390 × Complètes/Réduites/Minimales. 0 erreur de page ; 0 erreur console.
Les durées de première fin sont échantillonnées toutes les 100 ms ; sinon la durée de commande observée est conservée. Les bornes sont strictes : 22 000–26 000 ms.
Les niveaux réduits gardent les temps de lecture ; gestes réduits ≤ 120 ms sans transformation, aucune animation au niveau minimal. Motion reste inchangé.

## Échecs et réserves

Aucun nouvel échec natif dans cette recette ciblée.

Les pilotes antérieurs sont conservés dans les preuves externes, exclus de ces résultats. Le pilote 3 atteignait la fin du parcours compact, mais montrait encore un bouton initial hors viewport ; le candidat final attend la fin réelle du défilement intérieur.
La première passe de parcours sur ce872af0 a été arrêtée après la cible précédente conservée à try-context en FR1600/Réduites. Capture et reçu restent dans matrix-paths. Seuls le processus Playwright possédé et le superviseur EN encore en attente ont été fermés par PID vérifié ; le superviseur FR a nettoyé sa fixture. Le correctif bc3ac105 impose la nouvelle cible avant le défilement instantané. Les deux étapes FR/EN finales rejouent tous les parcours.
La passe suivante sur bc3ac105 a isolé les cas 768 : repli encore mesuré avant sa fin et marge basse appliquée seulement au défilement extérieur. Le pilote 359c4739 passe les trois parcours FR768/Réduites : entrée auparavant recouverte sur 18 304 px², puis 0 ; bouton de carte remonté de y=914,36 à y=776,36. La spec successive attend la fin des animations et ne demande pas un effacement à une barre sortante dont la sélection est déjà vide. Les oracles de cible et de non-recouvrement sont conservés.

## Kit et tests statiques

T037 composition, T038 navigation et roundtrip : PASS sur projection externe du report. Sur le Kit réel, les gardes de parité restent FAIL attendu jusqu’au report par Codex n°1. T037 finished-preservation échoue déjà sur la base (comparaison historique à 22b0d16), sans régression nouvelle.
Report Kit : voir [patch](guide-fixes-kit-mirror-20261017.patch) et [explication](guide-fixes-17-10-2026.md). Deux fichiers : Guide JS et SCSS discovery ; aucun nouveau token ni composant.

## Preuves

Mesures : [JSON](recette-guide-fixes-17-10-2026.json). Données détaillées et captures (maximum six) : `<workspace>\Moodle 51 Perf\moodle\local\guide-fixes-20261017`.
Fixtures synthétiques isolées, remises à l’état initial entre cellules, puis supprimées par le superviseur. Voir les reçus de restauration et la preuve DB après nettoyage dans le dossier externe.
Aucune publication sur :80, aucune modification du Kit ni des autres runtimes.

## Positions de checklist relevées aux entrées

Les classes ci-dessous reflètent le placement existant ; le correctif SCSS lui permet de prendre effet. Les rectangles et les transitions suivantes restent dans le JSON.

| Langue | Largeur | Parcours | Niveau | Docking | Chevauchement px² |
| --- | ---: | --- | --- | --- | ---: |
| fr | 1600 | inspect-group-settings | full | is-docked-right | 0 |
| fr | 1600 | inspect-grouping-settings | full | is-docked-left | 0 |
| fr | 1600 | inspect-group-settings | reduced | is-docked-right | 0 |
| fr | 1600 | inspect-grouping-settings | reduced | is-docked-left | 0 |
| fr | 1600 | inspect-group-settings | minimal | is-docked-right | 0 |
| fr | 1600 | inspect-grouping-settings | minimal | is-docked-left | 0 |
| fr | 1280 | inspect-group-settings | full | is-docked-right | 0 |
| fr | 1280 | inspect-grouping-settings | full | is-docked-left | 0 |
| fr | 1280 | inspect-group-settings | reduced | is-docked-right | 0 |
| fr | 1280 | inspect-grouping-settings | reduced | is-docked-left | 0 |
| fr | 1280 | inspect-group-settings | minimal | is-docked-right | 0 |
| fr | 1280 | inspect-grouping-settings | minimal | is-docked-left | 0 |
| fr | 768 | inspect-group-settings | full | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | inspect-grouping-settings | full | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | try-actions | full | is-docked-left | 0 |
| fr | 768 | inspect-group-settings | reduced | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | inspect-grouping-settings | reduced | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | try-actions | reduced | is-docked-left | 0 |
| fr | 768 | inspect-group-settings | minimal | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | inspect-grouping-settings | minimal | is-docked-right is-minimized is-docked-top | 0 |
| fr | 768 | try-actions | minimal | is-docked-left | 0 |
| fr | 390 | inspect-group-settings | full | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | inspect-grouping-settings | full | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | try-actions | full | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | inspect-group-settings | reduced | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | inspect-grouping-settings | reduced | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | try-actions | reduced | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | inspect-group-settings | minimal | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | inspect-grouping-settings | minimal | is-minimized is-docked-right is-docked-top | 0 |
| fr | 390 | try-actions | minimal | is-minimized is-docked-right is-docked-top | 0 |
| en | 1600 | inspect-group-settings | full | is-docked-right | 0 |
| en | 1600 | inspect-grouping-settings | full | is-docked-left | 0 |
| en | 1600 | inspect-group-settings | reduced | is-docked-right | 0 |
| en | 1600 | inspect-grouping-settings | reduced | is-docked-left | 0 |
| en | 1600 | inspect-group-settings | minimal | is-docked-right | 0 |
| en | 1600 | inspect-grouping-settings | minimal | is-docked-left | 0 |
| en | 1280 | inspect-group-settings | full | is-docked-right | 0 |
| en | 1280 | inspect-grouping-settings | full | is-docked-left | 0 |
| en | 1280 | inspect-group-settings | reduced | is-docked-right | 0 |
| en | 1280 | inspect-grouping-settings | reduced | is-docked-left | 0 |
| en | 1280 | inspect-group-settings | minimal | is-docked-right | 0 |
| en | 1280 | inspect-grouping-settings | minimal | is-docked-left | 0 |
| en | 768 | inspect-group-settings | full | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | inspect-grouping-settings | full | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | try-actions | full | is-docked-left | 0 |
| en | 768 | inspect-group-settings | reduced | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | inspect-grouping-settings | reduced | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | try-actions | reduced | is-docked-left | 0 |
| en | 768 | inspect-group-settings | minimal | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | inspect-grouping-settings | minimal | is-docked-right is-minimized is-docked-top | 0 |
| en | 768 | try-actions | minimal | is-docked-left | 0 |
| en | 390 | inspect-group-settings | full | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | inspect-grouping-settings | full | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | try-actions | full | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | inspect-group-settings | reduced | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | inspect-grouping-settings | reduced | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | try-actions | reduced | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | inspect-group-settings | minimal | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | inspect-grouping-settings | minimal | is-minimized is-docked-right is-docked-top | 0 |
| en | 390 | try-actions | minimal | is-minimized is-docked-right is-docked-top | 0 |
