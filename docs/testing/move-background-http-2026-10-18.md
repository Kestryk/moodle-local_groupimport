# MOVE-BG — diagnostic HTTP du 18/10/2026

**Décision : non publié. Le seuil global < 2 s reste FAIL, sans acceptation de Claude.**

## Route, volumes et frontière mesurée

Les essais API réels, sous bail sur `http://localhost:8051`, utilisaient la route temporaire `/local/recette-move-bg-20261018/ajax.php` pour le candidat MOVE-BG. Les mutations ont été exécutées avec les API Moodle ; cours, comptes, appartenances et schéma temporaires ont été nettoyés. Aucune publication sur localhost :80.

| Appartenances | Traitement | Temps HTTP | Temps worker |
|---|---|---:|---:|
| 400 | direct, comportement conservé | 23,703 s | — |
| 800 | mise en file adhoc | 11,820 s | 39,088 s |
| 3 000 | mise en file adhoc | 4,640 s | 218,737 s |

Le temps baisse entre 800 et 3 000 : ces premiers relevés ne démontrent pas un coût proportionnel au nombre de membres. Ils ne constituent pas une mesure à cache constant.

Un passage distinct, avec 3 000 membres et sans exécution du worker, a instrumenté `/local/recette-move-profile-20261018/ajax.php` :

| Frontière serveur cumulée | Temps | Nombre de requêtes SQL cumulé |
|---|---:|---:|
| Retour de `require config.php` | 3,398881 s | 2 |
| Contrôles d’accès terminés | 3,415474 s | 5 |
| Validation de la sélection terminée | 3,458247 s | 11 |
| Tâche mise en file | 3,525323 s | 19 |
| Transaction validée | 3,528108 s | 20 |
| Réponse prête | 3,531069 s | 21 |

HTTP client : 3,562748 s. Coût après les contrôles d’accès jusqu’au commit : 0,112634 s. Ce dernier nombre n’est **pas** le temps HTTP et ne satisfait pas le seuil.

## Contre-épreuve sans MOVE-BG ni données synthétiques

Le 18/10, une sonde temporaire protégée, exclusivement sur la copie louée :8051, a mesuré `/local/recette-move-hotspot-20261018/probe.php`. Zéro membre déplacé, aucun schéma créé, aucune écriture métier. La route et le bail ont été supprimés/libérés en fin de test. Aucun fichier de configuration ou réglage de cache n’a été modifié.

| Sonde | Mesure serveur | Temps HTTP |
|---|---:|---:|
| Configuration seule (`ABORT_AFTER_CONFIG`, 14 fichiers) | 0,012543 s | 0,051294 s |
| Connexion MariaDB configurée, premier passage | 0,001088 s | 0,015469 s pour toute la sonde |
| `SELECT 1`, premier passage | 0,001075 s | compris ci-dessus |
| Bootstrap Moodle complet, 163 fichiers, premier passage | 2,102062 s | 2,109187 s |
| Connexion MariaDB configurée, second passage | 0,001060 s | 0,016050 s pour toute la sonde |
| `SELECT 1`, second passage | 0,000309 s | compris ci-dessus |
| Bootstrap Moodle complet, 163 fichiers, second passage | 1,927860 s | 1,935297 s |

OPcache est actif. L’hôte DB configuré est déjà `127.0.0.1` : aucun contournement DNS à apporter. Le temps SQL cumulé du bootstrap complet vaut 0,006755 s (4 requêtes) puis 0,000981 s (2 requêtes).

**Point chaud établi : le bootstrap Moodle complet, avant le code MOVE-BG, principalement hors SQL.** La configuration initiale, la connexion DB et les requêtes ne représentent pas les secondes observées. Le sous-système exact au sein du bootstrap (chargements, sessions, MUC, extensions) reste à profiler ; aucune cause plus précise n’est affirmée sans trace. Un problème de session/cache interne au bootstrap reste possible.

## Vérification des hypothèses dans le candidat

- Pas de lecture SQL par membre pour les appartenances ordinaires : validation par lectures groupées (`batch_reader`, puis une lecture des appartenances du cours). Dans la mesure à 3 000 membres, la validation complète reste sous 0,04 s. Les éventuels callbacks des composants gérant eux-mêmes des appartenances sont conservés pour les droits natifs ; ils n’étaient pas présents dans la fixture.
- Le verrou MOVE-BG de mise en file utilise un délai nul (`get_lock(..., 0)`), sans attente prolongée ; il n’est même pas atteint par la contre-épreuve de bootstrap. Il ne peut expliquer les secondes déjà écoulées avant l’accès au candidat.
- La migration contient l’index unique `requestkey`, l’index `fingerprint` et l’index composite `courseid,userid`. Les groupes sont lus par leur clé native et les appartenances par cours. Aucun index ajouté arbitrairement pour masquer ce coût ; les lectures et l’insertion mesurées ne sont pas le point chaud.
- Les 400 membres restent sur la voie synchrone native comme demandé. Leur durée n’est pas une régression introduite par la tâche de fond ; elle doit être évaluée séparément si le seuil direct est remis en question.

## Reprise attendue

Profilage du bootstrap de cette copie par son opérateur : isoler le coût non SQL du chargement, des sessions et de MUC, sans changer les contrats d’accès ni les données pour accélérer artificiellement la réponse. Rejouer ensuite les temps HTTP réels 800/3 000 et la découverte cron sur installation mise à niveau. En attendant, **ne pas publier** : une acceptation explicite de Claude est nécessaire si le critère < 2 s est conservé en dérogation.

Preuves immuables externes : `<workspace>/artifacts/move-bg-20261018/native-v7.json`, `http-phases.jsonl`, `http-profile-result.json`, `bootstrap-hotspot-result.json`. Les sondes ne valident ni une matrice graphique FR/EN ni l’installation native 4.5.
