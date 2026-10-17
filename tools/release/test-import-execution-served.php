<?php
// This file is part of Moodle - https://moodle.org/
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
 * Standalone CLI test fixture and release validation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Native DB failure proof: only temporary raw fixture rows inside a rolled-back transaction.

require($argv[1] . '/config.php');
if ($CFG->wwwroot !== 'http://localhost') {
    throw new RuntimeException('Principal localhost only');
}
get_course(5);
$marker = 'EasyStud B2 rollback ' . bin2hex(random_bytes(8));
$admin = get_admin();
$before = $DB->count_records('local_groupimport_history', ['courseid' => 5]);
try {
    \local_groupimport\local\import_execution::run([[]], static function () use ($DB, $marker, $admin): int {
        $groupid = $DB->insert_record('groups', (object)['courseid' => 5, 'name' => $marker,
            'description' => '', 'descriptionformat' => FORMAT_HTML, 'timecreated' => time(), 'timemodified' => time()]);
        $DB->insert_record('local_groupimport_history', (object)['courseid' => 5, 'userid' => $admin->id,
            'filename' => $marker, 'filehash' => hash('sha256', $marker), 'timecreated' => time(),
            'changesjson' => json_encode(['createdgroups' => [$groupid]])]);
        throw new RuntimeException('b2-injected-failure');
    });
    throw new LogicException('Injected failure was swallowed');
} catch (RuntimeException $exception) {
    if ($exception->getMessage() !== 'b2-injected-failure') {
        throw $exception;
    }
}
if (
    $DB->record_exists('groups', ['courseid' => 5, 'name' => $marker]) ||
        $DB->record_exists('local_groupimport_history', ['filename' => $marker]) ||
        $DB->count_records('local_groupimport_history', ['courseid' => 5]) !== $before
) {
    throw new RuntimeException('Native rollback did not preserve baseline');
}
echo json_encode(['passed' => true, 'course' => 5, 'nativeGroupAndHistoryRollback' => true,
    'persistentFixtureRows' => 0]) . PHP_EOL;
