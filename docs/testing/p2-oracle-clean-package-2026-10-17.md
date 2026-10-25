# P2 : contrat actuel et paquet vierge — 17/10/2026, 8 h 10

Base `a5d0ffab`, branche `work/codex1/easystud-p2-oracle-20261017`. Aucun code produit, AMD généré, template ou style modifié ; aucun build, runtime, base, purge ou publication.

## Oracle de retrait du tutoriel

Le test comparait tous les fichiers courants à `05a84c57`, avant le retrait et avant les corrections ultérieures d’accessibilité, du Guide et des styles. L’ajout légitime de `bindAccessibleNames` faisait échouer la comparaison de l’orchestrateur.

- Les **17 assertions originales**, y compris les comparaisons intégrales du programme, de la navigation, des huit fichiers hors périmètre et les exports AMD appelables, sont conservées sur le commit de retrait réellement intégré `c33fbbeb` face à `05a84c57`. Aucun fichier ni assertion historique n’est retiré du test.
- **16 assertions actuelles** contrôlent les corps des fonctions actives, l’absence du binder/helper retiré, l’import et l’unique appel du binder partagé, les sélecteurs actuels, les exports compilés et l’absence d’appel legacy dans l’AMD généré.
- L’alias `data-easystud-guided-panel` du sélecteur de contrôles flottants était déjà conservé dans P2 ; il reste explicitement contrôlé, sans le confondre avec le tutoriel supprimé.
- **Six mutations en mémoire rejetées** : réintroduction du binder, suppression de la limite de fonctions actives, retrait de l’appel partagé, retour d’un sélecteur retiré, retour d’un appel legacy compilé, altération d’un export compilé. Aucun fichier produit n’est modifié pour ces cas négatifs.
- Node 22.11.0 : oracle JS PASS ; `node --check` PASS. Test P2 CSS inchangé : 10 assertions PASS, 4 140 règles actives conservées. Aucune assertion n’a été transformée en simple avertissement ou ignorée.

## Installation vierge : vérification statique du zip existant

Le zip d’origine a été extrait dans un **nouveau dossier vide**, `C:/dev/artifacts/p2-oracle-0810-20261017/blank-extraction/groupimport`. L’audit ne résout jamais un chemin de plugin dans un worktree, une copie du pool ou une installation existante. Aucun fichier du plugin n’a été inclus/exécuté : seuls le lexeur PHP `token_get_all` et `php -l` ont été utilisés.

- **409 vérifications, zéro manque, zéro référence dynamique laissée sans examen** dans le périmètre : chemins déclarés par le PHP/db, déclarations et chemins autoload des classes du plugin, quatre méthodes de callbacks/tâche/services, sept appels AMD PHP, cinq appels de templates PHP, partiels récursifs, 52 modules AMD nommés et leurs 86 références locales, 52 couples source/build, deux fichiers JSON de tours.
- Les callbacks `state_version::observe`, `get_state::execute`, `get_details::execute`, `purge_import_history::execute` sont présents dans les classes attendues. Les JSON de tours référencés par `db/install.php` et `db/upgrade.php` sont présents et valides.
- **43/43 fichiers PHP passent `php -l`**. Les fichiers externes de Moodle (`config.php`, bibliothèques group/form/file et templates du cœur) sont des dépendances du socle Moodle, pas des manques du zip. Ils ne sont ni exécutés ni incorporés dans le plugin.
- ZIP inchangé : 306 fichiers, 1 964 949 octets, SHA-256 `5113d999d2c5bd759e8a868b31daea3059677ebcaa91a4264cb938f2060a5797` ; CRC complet PASS. Les chemins sont résolus à l’intérieur de l’extraction vierge. La preuve précédente d’exclusion des fichiers de développement reste applicable, puisque le hash est identique.

**Manques constatés : aucun dans ce contrôle statique.** Une installation SQL/Moodle à blanc et son comportement ne sont pas certifiés : toute exécution runtime est interdite par la consigne. Le minimum déclaré reste Moodle 5.1 (`2025100600`).

Rapport détaillé et scripts d’audit externes : `C:/dev/artifacts/p2-oracle-0810-20261017/` (clean-install-static.json, php-tokens.php, audit-clean-zip.py, journaux JS/CSS). Le rapport JSON versionné donne les références directes et l’inventaire des classes ; les données intégrales restent hors Git.
