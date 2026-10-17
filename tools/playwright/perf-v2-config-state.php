<?php
// Read only the exact settings used by the configuration experiment.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$keys = ['debug', 'debugdisplay', 'enable_read_only_sessions', 'cachejs', 'cachetemplates',
    'slasharguments', 'themedesignermode', 'session_handler_class'];
$effective = [];
$database = [];
foreach ($keys as $key) {
    $effective[$key] = property_exists($CFG, $key) ? $CFG->$key : null;
    $record = $DB->get_record('config', ['name' => $key], 'value');
    $database[$key] = $record ? $record->value : null;
}
echo json_encode(['runtime' => $CFG->wwwroot, 'databaseName' => $CFG->dbname,
    'effective' => $effective, 'database' => $database,
    'pluginVersion' => get_config('local_groupimport', 'version')], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
