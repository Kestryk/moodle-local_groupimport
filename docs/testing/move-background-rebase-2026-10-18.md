# MOVE-BG — rebase sur PERF-SRV, 18 octobre 2026

## Périmètre et intégration

Branche `work/codex1/easystud-move-bg-rebase-20261018`, nouvelle copie de travail,
issue des deux commits `e348d271` / `9697a992`. Base demandée : `fa16784f`.
Le prérequis de forme `34787045` reste un commit distinct dans l'ascendance,
afin d'obtenir MoodleCS à zéro erreur avant son intégration annoncée par Claude.
Ne pas l'appliquer deux fois : intégrer ce prérequis puis les commits MOVE-BG.
L'ancienne branche MOVE-BG reste inchangée à `9697a992`.

Le premier rebase n'a produit aucun conflit PHP, JavaScript ou de migration.
Les seuls conflits sont CHANGELOG (deux passages) et l'intake JSON : toutes les
entrées de la base sont conservées, avec l'entrée MOVE-BG et sa mise à jour de
migration. Aucun réordonnancement ni nettoyage des anciennes clés de l'intake.

`classes/service/membership_transfer.php` est strictement identique à
`fa16784f` : sélection des utilisateurs/groupes avant validation, lectures
bornées, cache des origines et transmission de l'objet origine à
`groups_remove_member`. Le chemin correct est `classes/service/`, pas
`classes/local/`. MOVE-BG route les requêtes de plus de 500 paires dans
`ajax.php`; chaque lot du worker appelle ce même service conservé. Le service
direct reste utilisé jusqu'à 500 paires. Aucun correctif PERF-SRV n'est écrasé.

Le module source et les deux fichiers AMD de `local/cm/move_modal` sont
identiques à `9697a992`. Aucun build effectué pendant le créneau réservé.
Seule correction supplémentaire : mise en forme d'un appel d'assertion trop
long dans `test-move-job.php`, sans changement de son assertion.

## Migration

- `version.php` : `2026101801`, numéro attribué par Claude/Kevin.
- `db/install.xml` : version `2026101801`, table `local_groupimport_moves`.
- `db/upgrade.php` : étape conditionnée par `< 2026101801`, création si absente,
  puis `upgrade_plugin_savepoint(true, 2026101801, 'local', 'groupimport')`.
- Étapes antérieures et valeur de `requires` préservées.
- Dix contrôles de migration/installation PASS avec les classes XMLDB réelles
  de Moodle 4.5, puis dix avec celles de Moodle 5.1. Chargement de classes
  uniquement : aucun bootstrap Moodle, aucune connexion à une base.

## Contrôles PHP CLI

| Contrôle | Résultat |
| --- | --- |
| `test-student-membership-transfer.php` | PASS, service réel avec doubles natifs |
| `fixtures/security-s4-isolated.php` | PASS, 44 contrôles |
| `test-move-job.php` | PASS, 8 cas atomicité/reprise/notification/droits |
| `fixtures/s2-privacy-isolated.php` | PASS, 49 contrôles |
| `test-move-upgrade.php <lib 4.5>` | PASS, 10 contrôles |
| `test-move-upgrade.php <lib 5.1>` | PASS, 10 contrôles |
| `php -l` | PASS, 32 fichiers PHP ajoutés/modifiés depuis `fa16784f` |
| MoodleCS complet, standard `moodle`, tous les PHP du plugin | 0 erreur, 27 avertissements |
| Identité du service PERF-SRV et des trois fichiers MOVE AMD/source | PASS par `git diff --exit-code` |

Avertissements maintenus : 18 gardes `MOODLE_INTERNAL` jugées inutiles par le
sniff, 8 contrôles `require_login` non détectés dans des fixtures et 1 double
de classe de service dans la fixture de worker. Ne pas supprimer des gardes,
changer l'authentification de fixtures ou restructurer leurs doubles pour
faire disparaître ces avertissements dans ce rebase borné.

Rapports bruts et sorties CLI : `C:/dev/artifacts/move-bg-rebase-20261018/`.
MoodleCS : `phpcs-final.json`; syntaxe : `php-lint.log`; un journal par test.
Le code de sortie MoodleCS reste 1 à cause des avertissements, avec zéro erreur.

Aucun navigateur, Playwright, accès runtime, copie/purge Moodle, build AMD ou
styles, ni publication. Les preuves natives précédentes ne sont pas rejouées
et ne certifient pas cette nouvelle base. Le verdict CHARGE-V2b et l'accord
Claude restent nécessaires avant intégration/publication; aucun nouveau
profilage du bootstrap ni assouplissement du seuil HTTP dans ce lot.
