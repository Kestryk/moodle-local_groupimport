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
 * Private read-only progress, requiring the original owner's course permission.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');

$courseid = required_param('id', PARAM_INT);
$jobid = required_param('jobid', PARAM_INT);
$course = get_course($courseid);
require_login($course);
require_capability('moodle/course:managegroups', context_course::instance($courseid));
require_sesskey();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    throw new moodle_exception('invalidrequest', 'error');
}
$job = $DB->get_record('local_groupimport_jobs', ['id' => $jobid], '*', MUST_EXIST);
$history = $DB->get_record('local_groupimport_history', [
    'id' => $job->historyid, 'courseid' => $courseid, 'userid' => $USER->id,
], '*', MUST_EXIST);
\core\session\manager::write_close();
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
echo json_encode([
    'status' => $job->status,
    'processed' => (int)$job->nextrow,
    'total' => (int)$history->rowcount,
    'errors' => (int)$history->errorcount,
    'complete' => in_array($job->status, ['completed', 'cancelled'], true),
], JSON_THROW_ON_ERROR);
