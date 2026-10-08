<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

/** Current-user acknowledgement of an actual guide opening. */
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
$acknowledged = \local_groupimport\local\guide_welcome::mark_opened($generation);
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
echo json_encode(['acknowledged' => $acknowledged], JSON_THROW_ON_ERROR);
