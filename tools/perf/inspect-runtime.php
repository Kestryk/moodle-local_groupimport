<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

/**
 * Inspect local runtime identity without exposing database credentials.
 * Optional cache purge requires an exact expected copy URL and database name.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$options = getopt('', ['moodle-root:', 'expected-url:', 'expected-db:', 'purge']);
$root = realpath($options['moodle-root'] ?? '');
if (!$root || !is_file($root . '/config.php')) {
    throw new RuntimeException('An explicit Moodle root is required.');
}
define('CLI_SCRIPT', true);
require($root . '/config.php');
if (!in_array(parse_url($CFG->wwwroot, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1'], true)) {
    throw new RuntimeException('Local runtime only.');
}
if (isset($options['purge'])) {
    if (empty($options['expected-url']) || empty($options['expected-db']) ||
            rtrim($CFG->wwwroot, '/') !== rtrim($options['expected-url'], '/') ||
            $CFG->dbname !== $options['expected-db'] ||
            parse_url($CFG->wwwroot, PHP_URL_PORT) !== 8051 || $CFG->dbname !== 'moodle51perf') {
        throw new RuntimeException('Cache purge refused outside the explicitly identified Perf copy.');
    }
    purge_all_caches();
}
$params = ['prefix' => 'perffixture-%'];
echo json_encode([
    'url' => $CFG->wwwroot,
    'database' => $CFG->dbname,
    'dataroot' => $CFG->dataroot,
    'liveFixtureUsers' => $DB->count_records_select('user', 'deleted = 0 AND username LIKE :prefix', $params),
    'fixtureCourses' => $DB->count_records_select('course', 'shortname LIKE :prefix', $params),
    'cachePurged' => isset($options['purge']),
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n";
