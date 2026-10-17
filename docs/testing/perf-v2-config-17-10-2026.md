# Performance V2 — configuration de :8051, 17 octobre 2026

**A mesurée ; B et C bloquées par un prérequis Moodle avant connexion.** Source figée `a5d0ffab`, aucune modification produit, aucun redémarrage. A :60 navigations complètes et10 sondes PHP,0 erreur page/console. B :HTTP500 avant le premier cas ; C :même HTTP500 reproduit par un contrôle natif ciblé à1600. Les24 combinaisons page/largeur/cache B/C ne sont pas chronométrées : aucune valeur de remplacement.

## Configuration relevée et restaurée

| Réglage effectif | Origine | A | B | C | Restauré |
|---|---|---|---|---|---|
| debug | 32767 | 0 | 0 | 0 | 32767 |
| debugdisplay | "0" | "0" | "0" | "0" | "0" |
| enable_read_only_sessions | null | null | "1" | "1" | null |
| cachejs | "1" | "1" | "1" | "1" | "1" |
| cachetemplates | "1" | "1" | "1" | "1" | "1" |
| slasharguments | "1" | "1" | "1" | "1" | "1" |
| themedesignermode | "0" | "0" | "0" | "" | "0" |
| session_handler_class | null | null | null | null | null |

`null` = réglage absent du CFG. A surcharge debug=0 ; B ajoute enable_read_only_sessions=true ; C ajoute cachejs/cachetemplates/slasharguments=true et themedesignermode=false. Ces quatre valeurs sont déjà effectives dans A/B. Les valeurs CFG temporaires ne modifient aucune ligne de configuration en base. Aucun changement de mapping MUC n’a été ajouté.

## Blocage natif B/C

Après soumission réelle du formulaire de connexion, Moodle retourne500 avec :

> The session caches can not be in the session store when enable_read_only_sessions is enabled.

Le message désigne **core/navigation_cache** et demande de mapper les caches en mode session hors du stockage de session par défaut. B attendait la sortie de `/login/index.php` :expiration120s,0 navigation mesurée. C contrôle directement ce refus500, sans clic forcé ni modification du produit. Le PASS du test diagnostique signifie « refus reproduit », pas « configuration C utilisable ».

Preuve B : `C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017/B/easystud/authenticated/easystud-authenticated-20261017T070428945Z-3036/playwright-output/perf-v2-config-continuatio-4101a-continuation-native-own8051/perf-v2-config-raw.json` et son voisin `error-context.md`. Preuve/capture C : `C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017/C/easystud/authenticated/easystud-authenticated-20261017T072309744Z-54956/playwright-output/perf-v2-config-prerequisit-b12fa-prerequisite-native-own8051/C-session-cache-prerequisite.png`. Les fichiers de configuration privés restent hors Git.

## Protocole A

1600/390 ×1000, FR ;3 pages ;5 couples froid/chaud par cas. Froid = purge Moodle et cache HTTP Chromium vidé ; chaud = même navigation immédiatement après avec cache navigateur autorisé. Pas de redémarrage ni vidage des caches OS/DB. Poste partagé, sans limitation CPU/réseau ; largeur390 de navigateur de bureau, pas un téléphone matériel. Page utilisable = ready + manager initialisé + squelettes remplacés. Les octets et durées sont relevés via CDP ; fenêtre après load et2 frames ; requêtes inachevées conservées comme telles.

Le premier run a atteint1700s après56 navigations complètes. Deux tentatives interrompues sont archivées et exclues, sans supprimer d’échantillon complet. Une fixture de mêmes effectifs et structure a été recréée pour les4 navigations manquantes ; ids800=256. Le cours71 est absent, il n’est pas présenté comme mesuré. Petit cours30,4groupes/2groupements ; cours800,150groupes/40groupements et2400appartenances. Mass Import est vide. Ordre non randomisé et charge partagée limitent les comparaisons. La campagne précédente utilisait une autre source : l’écart ne quantifie pas le seul effet du débogage.

## Page utilisable et get_state — A

| Page | px | Cache | n | Utilisable méd./max ms | get_state attente méd./max ms | get_state durée méd./max ms |
|---|---:|---|---:|---:|---:|---:|
| sm-800 | 1600 | cold |5| 28013.1 / 48808.9 | 4136.2 / 6391.6 | 4147.4 / 6396.3 |
| sm-800 | 1600 | warm |5| 5751.4 / 7378.8 | 2069.2 / 3092.2 | 2072.4 / 3096.4 |
| sm-800 | 390 | cold |5| 58160.3 / 68263.8 | 5084.0 / 10594.1 | 5098.7 / 10610.6 |
| sm-800 | 390 | warm |5| 6477.8 / 15614.6 | 3008.3 / 7655.9 | 3012.1 / 7665.2 |
| sm-small | 1600 | cold |5| 61944.6 / 70362.5 | 8185.5 / 12739.3 | 8203.1 / 12753.7 |
| sm-small | 1600 | warm |5| 8104.5 / 10464.0 | 3603.8 / 4356.6 | 3610.2 / 4361.3 |
| sm-small | 390 | cold |5| 28898.9 / 33800.6 | 3814.5 / 4535.6 | 3824.5 / 4545.0 |
| sm-small | 390 | warm |5| 4854.2 / 7549.1 | 2001.9 / 4551.4 | 2006.5 / 4554.2 |
| mass-import | 1600 | cold |5| 26185.5 / 38544.8 | — / — | — / — |
| mass-import | 1600 | warm |5| 8142.0 / 11564.9 | — / — | — / — |
| mass-import | 390 | cold |5| 93068.7 / 143112.5 | — / — | — / — |
| mass-import | 390 | warm |5| 13967.9 / 25953.3 | — / — | — / — |

Attente HTTP = receiveHeadersStart − sendEnd :transport/attente serveur inclus, pas temps CPU ni durée instrumentée de verrou. Durée = requête totale. Mass Import ne demande pas get_state. B/C :**non mesurable, connexion500**, pour chacun des12 cas par configuration.

## Sonde PHP CLI A (hors requête HTTP)

| Participants | n | get_state méd./max ms | Bootstrap méd./max ms | Pic mémoire max Mio |
|---|---:|---:|---:|---:|
| 800 | 5 | 297.5 / 370.1 | 5564.1 / 6256.9 | 22.0 |
| 30 | 5 | 143.4 / 182.2 | 6077.5 / 6220.1 | 18.0 |

Sonde séparée sans concurrence HTTP : le temps CLI ne mesure pas le verrou de la session du navigateur.

## Les dix mêmes postes — A

Révisions normalisées ; contexteSVG de cours normalisé parce que les cours ont changé. Aucun nouveau top10 substitué. Temps serveur calculé seulement sur les réponses réseau, cache local/304 comptés séparément.

| Poste | Cache | n/réseau/cache | Attente méd./max ms | Durée méd./max ms |
|---|---|---:|---:|---:|
| /pluginfile.php/5/user/icon/boost/f2 | cold | 30/30/0 | 8194.8 / 32589.0 | 13759.4 / 45065.5 |
| /pluginfile.php/5/user/icon/boost/f2 | warm | 31/0/31 | — / — | 0.1 / 0.9 |
| /lib/javascript.php/REV/lib/requirejs/require.min.js | cold | 30/30/0 | 6026.8 / 45617.9 | 9660.7 / 55384.8 |
| /lib/javascript.php/REV/lib/requirejs/require.min.js | warm | 30/0/30 | — / — | 0.2 / 0.6 |
| /theme/font.php/boost/core/REV/fa-regular-400.woff2 | cold | 30/30/0 | 5750.1 / 28311.5 | 5758.9 / 28324.5 |
| /theme/font.php/boost/core/REV/fa-regular-400.woff2 | warm | 30/30/0 | 2996.5 / 23067.4 | 3006.9 / 23081.2 |
| /theme/image.php/boost/core/REV/i/arrow-right | cold | 30/30/0 | 4641.8 / 25421.7 | 5234.3 / 27934.5 |
| /theme/image.php/boost/core/REV/i/arrow-right | warm | 31/0/31 | — / — | 0.1 / 2.7 |
| /pluginfile.php/COURSE/course/generated/course.svg | cold | 30/30/0 | 6337.5 / 28365.4 | 6342.0 / 28371.7 |
| /pluginfile.php/COURSE/course/generated/course.svg | warm | 30/0/30 | — / — | 0.2 / 1.7 |
| /theme/font.php/boost/core/REV/fa-solid-900.woff2 | cold | 30/30/0 | 5399.9 / 28316.9 | 5409.3 / 28332.3 |
| /theme/font.php/boost/core/REV/fa-solid-900.woff2 | warm | 30/30/0 | 2909.4 / 12076.2 | 2930.9 / 12090.8 |
| /lib/requirejs.php/REV/core/first.js | cold | 30/30/0 | 4713.2 / 17017.1 | 4773.4 / 17148.9 |
| /lib/requirejs.php/REV/core/first.js | warm | 30/0/30 | — / — | 0.3 / 0.6 |
| /lib/javascript.php/REV/lib/javascript-static.js | cold | 30/30/0 | 4257.2 / 25416.2 | 4279.6 / 25454.5 |
| /lib/javascript.php/REV/lib/javascript-static.js | warm | 30/0/30 | — / — | 0.1 / 0.3 |
| /lib/ajax/service-nologin.php?info=core_output_load_template_with_dependencies | cold | 47/38/0 | 3413.4 / 9910.0 | 3417.5 / 9919.1 |
| /lib/ajax/service-nologin.php?info=core_output_load_template_with_dependencies | warm | 33/3/26 | 3424.8 / 9260.3 | 1.9 / 9336.5 |
| /theme/image.php/boost/core/REV/i/arrow-left | cold | 30/30/0 | 4022.2 / 24915.9 | 4097.2 / 25390.1 |
| /theme/image.php/boost/core/REV/i/arrow-left | warm | 31/0/31 | — / — | 0.1 / 2.6 |

B/C :pas de réponse de ces ressources dans une page authentifiée mesurable ; attente non renseignée, jamais zéro.

## Cache HTTP et sessions : ce qui est prouvé

La connexion500 bloque les pages authentifiées en C. Un contrôle séparé des ressources publiques est terminé : deuxième lecture avec cache navigateur, puis requête conditionnelle explicite. Il ne fournit aucun temps de page authentifiée.

| Ressource publique | HTTP initial | Cache-Control | Validateur | Transfert deuxième lecture (octets) | HTTP conditionnel |
|---|---:|---|---|---:|---:|
| /lib/javascript.php/1792217535/lib/polyfills/polyfill.js | 200 | public, max-age=7776000, immutable | ETag | 0 | 304 |
| /lib/requirejs.php/1792217535/core/first.js | 200 | public, max-age=7776000, immutable | ETag | 0 | 304 |
| /theme/font.php/boost/core/1792217487/fa-solid-900.woff2 | 200 | absent | Last-Modified | 0 | 200 |
| /theme/image.php/boost/core/1792217535/i/arrow-left | 200 | absent | Last-Modified | 0 | 200 |
| /theme/styles.php/boost/1792217535_1780323562/all | 200 | absent | Last-Modified | 0 | 200 |

Seules les deux ressources JS ont un Cache-Control public, max-age=7776000, immutable et une revalidation304 : cache HTTP validé pour ces deux ressources. Police/image/CSS : Cache-Control absent et revalidation200 ; leur cache HTTP reste NON VALIDÉ. Une taille de transfert répétée nulle ne suffit pas à valider la nature ou la politique de la réponse (Content-Type non collecté par cette sonde). Les URL révisionnées ont été reprises de A après de nouvelles purges : une révision périmée est une limite supplémentaire. Les valeurs exactes ETag/Last-Modified sont dans le JSON. Les en-têtes de la réponse500 de connexion ne sont pas présentés comme une validation du cache statique.

Le service installé est bien readonlysession=true et le gestionnaire est core/session/file (sonde native de métadonnées). `lib/classes/session/manager.php:120` conditionne READ_ONLY_SESSION à enable_read_only_sessions. Mais `lib/javascript.php`, `lib/requirejs.php`, `theme/font.php` et `theme/image.php` définissent ABORT_AFTER_CONFIG ; `lib/setup.php:602` retourne avant l’initialisation de session. Leurs longues attentes ne prouvent donc pas directement un verrou de session. A/B n’étant pas mesurable en l’état, la part du verrou n’est pas isolée. Workers, CPU/disque, reconstruction et contention du poste restent à mesurer, sans correction ici.

## Recommandations Edunao

- Production :debug=0, debugdisplay=0 ; cachejs=1, cachetemplates=1, slasharguments=1, themedesignermode=0.
- Avant enable_read_only_sessions :mapper les caches en mode session hors du stockage de session et valider le backend ainsi que les écritures de session des plugins en préproduction. Le flag seul est insuffisant sur cette copie.
- Refaire A/B/C après arbitrage du backend MUC ; ce choix est une variable de performance supplémentaire et ne doit pas être masqué dans la comparaison.
- Vérifier Cache-Control/ETag ou Last-Modified et réutilisation réelle après proxy/CDN, préchauffer les ressources révisionnées, conserver les règles privées des fichiers authentifiés.
- Si les petits endpoints sans session restent lents :profiler workers PHP/stockage et charge simultanée ; ne pas attribuer leur attente au seul poids des fichiers ou au seul verrou.

## Restauration

Config parent et shim identiques octet pour octet aux sauvegardes ; git diff --no-index --quiet retourne0. CFG effectif et lignes DB relus identiques. 303 fichiers produit SHA256 identiques à a5d0ffab. Nettoyage natif :5cours/1600comptes uniques, restes `{"courses":0,"groups":0,"groupings":0,"enrolments":0,"histories":0,"activeUsers":0}`. Comptes supprimés logiquement par l’API Moodle. Aucun service redémarré ; aucune intervention :80/8052/8054/8055.

## Conclusion (5 lignes)

1. A :60 navigations complètes ; B/C :HTTP500 avant connexion, matrices non exécutables avec les réglages stricts demandés.
2. Désactiver le débogage ne suffit pas :maximum A 143.1 s ; médianes et maxima détaillés ci-dessus.
3. Moodle exige un mapping MUC hors session pour core/navigation_cache avant les sessions en lecture seule.
4. La contribution du verrou n’est pas isolée ; les endpoints JS/font sans session excluent son attribution automatique à tous les petits fichiers.
5. Edunao :débogage désactivé, caches actifs, migration MUC validée avant activation du flag ; configuration8051 restaurée à l’identique.
