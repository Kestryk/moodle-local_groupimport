# K17-12 — Codechecker zéro erreur

Base `bc3f48f8`, branche `work/codex1/easystud-codechecker-zero-20261017`.

## Contrôle statique

Tous les fichiers PHP du plugin et de ses outils/fixtures sont contrôlés, sans suppression de règle ni exception par fichier (seuls `.git`, `node_modules` et `vendor` sont hors périmètre tiers).
MoodleCS : **280 → 0 erreurs**, 49 → 43 avertissements. PHP lint : **186/186 PASS**. Porte isolée : **13/13 PASS**.
Les classes doubles ont chacune leur fichier et leurs noms propres, avec alias à l'API attendue par la fixture. Un bootstrap CLI explicite remplace les définitions Moodle dispersées. Les extractions de fonctions utilisent des fichiers temporaires supprimés à l'arrêt du processus, sans évaluation de chaînes par `eval`.
Les assertions de transaction/historique du test d'exécution sont conservées ; les contrôles R8 utilisent toujours SQLite isolé.
La seule évolution du code produit est `error_log` → `debugging(..., DEBUG_DEVELOPER)` dans les deux gestionnaires d'erreurs AJAX ; le JSON et les opérations métier restent identiques.

## Preuves et limites

Fichiers externes : `C:/dev/artifacts/codechecker-zero-20261017/after-final8.json`, `php-lint-final.json`, `isolated-final8.json`, `pills-final.json`, `contracts-final.json`, `tutorial-final.log`.
T037/T038 PASS avec le Kit `C:/dev/worktrees/easyedu-ui-kit-guide-db964-20261017` ; pastilles, contrats CRLF et retrait tutoriel vérifiés avec les arguments requis.
La preuve native local_codechecker et le paquet sont ajoutés après le commit des entrées de production, requis par package-plugin.cjs.
Aucun build produit, publication localhost ou modification de service n'est effectué par ce lot.
