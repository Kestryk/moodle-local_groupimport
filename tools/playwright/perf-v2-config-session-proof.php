<?php
// Read-only native metadata, never session contents or identifiers.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$function = \core_external\external_api::external_function_info('local_groupimport_get_state');
echo json_encode(['handlerClass' => \core\session\manager::get_handler_class(),
    'function' => 'local_groupimport_get_state',
    'registeredReadonlySession' => $function->readonlysession ?? null,
    'enabled' => !empty($CFG->enable_read_only_sessions),
    'sapi' => PHP_SAPI,
    'limitation' => 'Configuration/registered service metadata only, not a measurement of a live HTTP lock.'],
    JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
