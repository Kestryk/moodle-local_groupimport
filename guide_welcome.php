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
 * Current-user acknowledgement of an actual guide opening.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('AJAX_SCRIPT', true);
require_once(__DIR__ . '/../../config.php');

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    throw new moodle_exception('invalidrequest', 'error');
}
require_login(null, false);
require_sesskey();
$course = get_course(required_param('courseid', PARAM_INT));
require_login($course, false);
require_capability('moodle/course:managegroups', context_course::instance($course->id));
$generation = required_param('generation', PARAM_ALPHANUM);
// The "later" action postpones the invitation until the next login; otherwise the guide was actually opened.
$acknowledged = optional_param('action', '', PARAM_ALPHA) === 'later' ?
    \local_groupimport\local\guide_welcome::postpone($generation) :
    \local_groupimport\local\guide_welcome::mark_opened($generation);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['acknowledged' => $acknowledged], JSON_THROW_ON_ERROR);
