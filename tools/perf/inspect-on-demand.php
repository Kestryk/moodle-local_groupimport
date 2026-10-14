<?php
// Read-only single-mode preflight; no setting, restoration or cache mutation.
if (PHP_SAPI !== 'cli') { exit(1); }
$options = getopt('', ['moodle-root:', 'expected-url:', 'expected-db:']);
$root = realpath($options['moodle-root'] ?? '');
if (!$root || !is_file($root . '/config.php') || empty($options['expected-url']) || empty($options['expected-db'])) {
    throw new RuntimeException('Explicit Moodle root, expected URL and database required.');
}
define('CLI_SCRIPT', true);
require $root . '/config.php';
if ($CFG->wwwroot !== $options['expected-url'] || $CFG->dbname !== $options['expected-db']) {
    throw new RuntimeException('Runtime identity mismatch.');
}
require_once($root . '/local/groupimport/lib.php');
if ((int)get_config('local_groupimport', 'version') < 2026101400 ||
        !local_groupimport_is_on_demand_rendering() ||
        $DB->record_exists('config_plugins', ['plugin' => 'local_groupimport', 'name' => 'renderingmode'])) {
    throw new RuntimeException('Single-mode publication/upgrade required; do not recreate the retired setting.');
}
echo "PASS on-demand only; retired configuration absent; read-only preflight.\n";
