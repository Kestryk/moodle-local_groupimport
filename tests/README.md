# Socle de tests local_groupimport (TRI n°19)

## PHPUnit (en place)

Classes `advanced_testcase` déjà présentes, couvrant des fonctions centrales non triviales :

- `service/membership_transfer_test.php` — `membership_transfer::move_members()` (6 scénarios :
  préservation, doublons, origine étrangère, source périmée, droits).
- `service/membership_assignment_test.php`, `service/course_state_test.php`
- `local/import_reader_test.php`, `local/import_user_lookup_test.php`, `local/import_policies_test.php`
- `privacy/provider_test.php`, `guide_welcome_test.php`, `lib_test.php`, `motion_test.php`
- `background_import_test.php`, `external/siteid_refusal_test.php`

Vérifié dans ce lot (2026-10-19, copie `:8054`) :
- `php -l` sans erreur sur tous les fichiers de `tests/`.
- `local_codechecker` (`vendor/bin/phpcs --standard=moodle`) : **0 erreur**, 1 avertissement bénin
  (`MOODLE_INTERNAL` dans `guide_welcome_test.php`, sans impact).

**Non vérifié ici** : exécution réelle via `vendor/bin/phpunit`. Aucune copie du pool
(`:8052`, `:8054`, `:8055`) n'a de `vendor/` ni de `composer.json` à la racine Moodle — ce
paquet Windows ne livre pas les dépendances de dev. Les installer suppose un
`composer install` téléchargeant des paquets externes (phpunit/phpunit, mikey179/vfsstream…),
action bloquée par le mode sandbox de cette session ; elle demande donc un accord explicite de
Kevin et une exécution hors sandbox (ou la réutilisation d'un environnement déjà provisionné,
ex. `C:\dev\ccb-phpunit-r0-5b\moodle`, qui appartient à un autre projet et n'a pas été touché ici).

Marche à suivre une fois `composer install --no-interaction` fait à la racine Moodle (avec le
`composer.json` officiel de `MOODLE_501_STABLE`) :
```
php admin/tool/phpunit/cli/init.php
vendor/bin/phpunit --filter local_groupimport
```

## Behat (gap documenté, non construit dans ce lot)

- `tests/behat/core-flows.feature` et `accessibility.feature` existent déjà et n'utilisent que
  des steps Moodle core standard (Mink, `behat_general`, extension accessibilité) : **aucune
  classe `behat_*.php` spécifique au plugin n'est nécessaire**.
- Manquant pour exécuter : mêmes dépendances dev que ci-dessus (`behat/mink`, `behat/behat`…)
  plus un serveur Selenium/WebDriver pour les scénarios `@javascript`, et le bloc
  `$CFG->behat_*` + `php admin/tool/behat/cli/init.php`. Rien de tout cela n'est configuré sur
  le pool de copies Claude à ce jour.
- Décision : ne pas construire cette infra dans ce lot (hors périmètre TRI19 minimal, machine
  à solliciter) ; la prochaine étape serait de solliciter Kevin pour l'installation des
  dépendances (ou de pointer vers un environnement déjà prêt comme `ccb-phpunit-r0-5b`).
