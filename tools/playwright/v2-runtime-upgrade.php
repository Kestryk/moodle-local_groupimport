<?php
// Own8051 only: invoke Moodle's plugin upgrade lifecycle without other plugins.
define('CLI_SCRIPT', true);
define('NO_UPGRADE_CHECK', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {throw new RuntimeException('Own8051 only');}
require_once($CFG->libdir . '/upgradelib.php');
$before = (int)get_config('local_groupimport', 'version');
$history = $DB->count_records('local_groupimport_history');
if ($before < 2026101700) {
    require_once($CFG->dirroot . '/local/groupimport/db/upgrade.php');
    xmldb_local_groupimport_upgrade($before);
    upgrade_component_updated('local_groupimport');
    cache_helper::purge_all();
}
upgrade_finished();
echo json_encode(['before' => $before, 'after' => (int)get_config('local_groupimport', 'version'),
    'historyBefore' => $history, 'historyAfter' => $DB->count_records('local_groupimport_history'),
    'scheduledTask' => $DB->record_exists('task_scheduled', ['classname' => '\local_groupimport\task\purge_import_history'])]) . PHP_EOL;
