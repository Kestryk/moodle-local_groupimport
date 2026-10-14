<?php
// Read-only T055 preflight: the retired rendering helper no longer exists.
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
if ((int)get_config('local_groupimport', 'version') < 2026101400 ||
        $DB->record_exists('config_plugins', ['plugin' => 'local_groupimport', 'name' => 'renderingmode'])) {
    throw new RuntimeException('Single-mode publication/upgrade required; do not recreate the retired setting.');
}
echo "PASS T055 upgraded copy; retired configuration absent; read-only preflight.\n";
