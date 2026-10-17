<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

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
    if (
        empty($options['expected-url']) || empty($options['expected-db']) ||
            rtrim($CFG->wwwroot, '/') !== rtrim($options['expected-url'], '/') ||
            $CFG->dbname !== $options['expected-db'] ||
            parse_url($CFG->wwwroot, PHP_URL_PORT) !== 8051 || $CFG->dbname !== 'moodle51perf'
    ) {
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
