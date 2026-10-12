<?php
/** Authorized copy-only Moodle plugin upgrade; no admin/cli dependency. */
define('CLI_SCRIPT', true);
$options = getopt('', ['moodle-root:']);
require($options['moodle-root'] . '/config.php');
if ($CFG->dbname !== 'moodle51perf' || parse_url($CFG->wwwroot, PHP_URL_PORT) !== 8051) {
    throw new RuntimeException('Upgrade refused outside the dedicated copy.');
}
require_once($CFG->libdir . '/upgradelib.php');
\core\session\manager::set_user(get_admin());
ob_start();
upgrade_noncore(false);
upgrade_finished();
ob_end_clean();
echo json_encode(['version' => get_config('local_groupimport', 'version'),
    'stateTable' => $DB->get_manager()->table_exists(new xmldb_table('local_groupimport_statever')),
    'services' => $DB->count_records_select('external_functions', 'name IN (:state, :details)',
        ['state' => 'local_groupimport_get_state', 'details' => 'local_groupimport_get_details'])]) . "\n";
