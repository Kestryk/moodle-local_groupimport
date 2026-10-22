# K17-12 — Codechecker zéro erreur

## Résultat actuel

Base `01872080`, branche `work/codex1/easystud-codechecker-zero-20261017`.
La source et le paquet contrôlés sont ceux du commit `9cee7358` (les documents de clôture sont ajoutés ensuite).

| Porte | Résultat |
|---|---|
| MoodleCS officiel 3.7, tous les PHP du plugin et de ses outils/fixtures | 197 fichiers ; **0 erreur, 49 avertissements** |
| Contrôle non-PHP officiel local_codechecker 5.1.0, sans exclusion ajoutée | 13 fichiers ; **0 erreur, 0 avertissement** |
| Interface native local_codechecker 5.1.0 / DB 2025120200, copie source | **0 erreur, 49 avertissements**, console 0 |
| Paquet complet extrait : MoodleCS / interface native | 50 PHP ; **0 erreur, 12 avertissements**, console 0 |
| Paquet complet extrait : contrôle non-PHP officiel | 1 fichier ; **0 erreur, 0 avertissement** |
| PHP lint | **197/197 PASS** |
| Porte sécurité, Privacy, R6/R8/R9 et import | **13/13 PASS** |
| Isolation de l’import différé et union/restauration des remplacements | **PASS** |
| Archives historiques repliées et reconstruction des octets originaux | **8/8 PASS** |

Le paquet statiquement validé contient 329 fichiers, 2 044 998 octets. SHA-256 :
`5b1144386db87a9936dab9ecd38ddd2c2209e5fb436058cd6773521a72856b88`.
La structure Moodle, les fichiers autorisés et les exclusions de développement sont vérifiés par `package-plugin.cjs`.
Cela ne constitue pas une nouvelle installation fonctionnelle sur une base Moodle vierge.

## Périmètre et préservation

Les classes doubles et leur bootstrap CLI sont documentés et séparés ; les assertions de sécurité, transactions,
historique et SQLite restent actives. Les deux `error_log` AJAX deviennent des `debugging(..., DEBUG_DEVELOPER)`
sans changement du JSON ou des opérations métier. Deux commentaires de méthodes privées du spécimen Guide
complètent les docblocks ; aucune instruction exécutable du moteur Guide n’est modifiée.

Les 14 erreurs non-PHP historiques de longueur de ligne sont corrigées par un repli physique de huit transcriptions.
Toutes les valeurs, assertions et tous les octets d’origine sont reconstructibles : manifeste `physical-wraps.json`,
test `test-retired-transcript-wraps.cjs`, originaux externes sauvegardés. Aucune règle ni liste d’exclusions n’est assouplie.
La licence de police est conservée intégralement et stockée en LF par son attribut Git.

L’interface native suit ses exclusions Moodle officielles et omet le CSV de fixture ; le contrôle séparé de la fonction
officielle `local_codechecker_check_other_files`, sans exclusion, vérifie également ce CSV et ne trouve aucun problème.
Les contrôles CLI chargent le moteur officiel sans config Moodle, sans base de données et sans modifier son code.

Les résolutions de rebase ont été explicitement autorisées par Kevin et appliquées par le parent ; aucun nouveau
conflit n’est résolu par cette clôture. Les branches Guide/Navigation/Cartes et leurs contrats visuels restent intacts.
La porte T037/T038 d’une ancienne base ne certifie pas le nouveau Guide : son miroir est un lot/prérequis distinct.
La précédente comparaison des deux programmes PHP du Guide, FR/EN, avec la base `2827b7c7` était strictement identique.
La matrice native précédente, avant les nouvelles bases Guide, était 6/6 prête avec de vraies cartes et console 0 ;
elle n’est pas réétiquetée comme une recette visuelle de `01872080`.

## Copie de contrôle et preuves

Seule la copie :8054 a été utilisée sous verrou propre, pour l’interface du plugin de contrôle déjà installé.
Les copies de fichiers sont hashées et ne sont jamais exécutées comme pages produit. Aucun accès :80 ou :8051,
aucun arrêt de service, aucun build produit et aucune publication localhost. Les contrôles métier restent isolés.
Les captures natives du résultat sont dans le dossier de revue : `CODECHECKER-ZERO-PHP-2026-10-17.png`
et `CODECHECKER-ZERO-PAQUET-2026-10-17.png`.

Preuves externes : `<workspace>/artifacts/codechecker-zero-20261017/current-018/` :
`final-proof.json`, `phpcs.json`, `other-files.json`, `lint.json`, `smoke.json`, les logs d’import,
les rapports du paquet, son manifeste et le manifeste SHA-256 des copies natives.
Les essais précédents restent archivés ; leurs échecs de harnais et limites ne sont pas supprimés.

## Avertissements restants, non bloquants

Le détail par règle et ligne est conservé dans `codechecker-zero-warnings-2026-10-17.json`.
Ils restent des avertissements officiels ; aucune sévérité n’est diminuée pour obtenir zéro erreur.

| Fichier | Avertissements |
|---|---:|
| `ajax.php` | 2 |
| `importlib.php` | 1 |
| `index.php` | 2 |
| `tests/guide_welcome_test.php` | 1 |
| `classes/local/batch_reader.php` | 1 |
| `classes/local/guide_discovery.php` | 1 |
| `classes/local/guide_specimen.php` | 1 |
| `classes/local/guide_welcome.php` | 1 |
| `classes/local/import_execution.php` | 1 |
| `classes/local/import_preview.php` | 1 |
| `classes/local/motion.php` | 1 |
| `tests/privacy/provider_test.php` | 1 |
| `tools/perf/decompose.php` | 1 |
| `tools/perf/lib.php` | 1 |
| `tools/playwright/claude-integration-fixture.php` | 1 |
| `tools/playwright/easystud-action-button-alignment-fixture.php` | 1 |
| `tools/playwright/easystud-role-density-fixture.php` | 1 |
| `tools/playwright/guide-writing-course-fixture.php` | 2 |
| `tools/playwright/k16-sort-copy-fixture.php` | 2 |
| `tools/playwright/k21-course-counts.php` | 1 |
| `tools/playwright/palette-native-default-roles.php` | 1 |
| `tools/playwright/palette-native-full-defaults.php` | 1 |
| `tools/playwright/student-native-context.php` | 1 |
| `tools/playwright/t020-complete-view-config.php` | 1 |
| `tools/release/test-guide-welcome-state.php` | 1 |
| `tools/release/test-import-execution-served.php` | 1 |
| `tools/release/test-server-name-escaping-served.php` | 1 |
| `tools/release/test-server-name-escaping.php` | 1 |
| `tools/release/test-theme-palette-standalone.php` | 1 |
| `tools/release/fixtures/r6-bulk-actions-isolated.php` | 2 |
| `tools/release/fixtures/s2-privacy-isolated.php` | 12 |
| `tools/release/fixtures/security-s6-isolated.php` | 1 |
| `tools/release/fixtures/security-s7-m5-isolated.php` | 1 |
