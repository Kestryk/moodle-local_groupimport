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

// Read-only proof after supervised fixture cleanup, dedicated Perf runtime only.
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$options = getopt('', ['moodle-root:', 'manifest:']);
require($options['moodle-root'] . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$data = json_decode(file_get_contents($options['manifest']), true, 512, JSON_THROW_ON_ERROR);
$courseid = (int)$data['courseId'];
if ($courseid <= 5 || !str_starts_with($data['shortname'], 'eed-guide-write-')) {
    throw new RuntimeException('Owned disposable fixture required');
}
$activeusers = 0;
foreach ($data['userIds'] as $id) {
    $user = $DB->get_record('user', ['id' => $id]);
    if ($user && !$user->deleted) {
        $activeusers++;
    }
}
$drafts = $DB->count_records_select('files', 'component = ? AND filearea = ? AND ' .
    $DB->sql_like('filename', '?'), ['user', 'draft', $DB->sql_like_escape('recette-soir-' . $courseid . '-') . '%']);
$result = [
    'runId' => $data['runId'], 'courseId' => $courseid,
    'remainingCourses' => $DB->count_records('course', ['id' => $courseid]),
    'remainingGroups' => $DB->count_records('groups', ['courseid' => $courseid]),
    'remainingGroupings' => $DB->count_records('groupings', ['courseid' => $courseid]),
    'activeSyntheticUsers' => $activeusers, 'remainingOwnCsvDrafts' => $drafts,
];
if (isset($data['showCompleteBefore'])) {
    $result['completeViewRestored'] = get_config('local_groupimport', 'showcompleteview') === $data['showCompleteBefore']['value'];
}
echo json_encode($result, JSON_UNESCAPED_SLASHES) . PHP_EOL;
