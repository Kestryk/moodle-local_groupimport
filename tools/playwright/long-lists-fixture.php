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
 * Disposable K16-01 fixture, own8051 only, with exact-owner cleanup.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$options = getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:']);
if (empty($options['moodle-root']) || empty($options['manifest'])) {
    throw new RuntimeException('Moodle root and external manifest required.');
}
require($options['moodle-root'] . '/config.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/testing/generator/lib.php');
require_once(__DIR__ . '/../perf/lib.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Only own8051 is authorised.');
}
\core\session\manager::set_user(get_admin());
$path = $options['manifest'];
$action = $options['action'] ?? '';
$manifest = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : null;
ini_set('error_log', $path . '.php-errors.log');
if ($manifest && ($manifest['owner'] ?? '') !== 'codex2-k16-01') {
    throw new RuntimeException('Foreign fixture manifest.');
}
if ($action === 'cleanup') {
    if (!$manifest) {
        echo json_encode(['complete' => true, 'reason' => 'no-manifest']) . PHP_EOL;
        exit;
    }
    $courseid = (int)$manifest['courseId'];
    $course = $DB->get_record('course', ['id' => $courseid]);
    if ($course && $course->idnumber !== $manifest['identity']) {
        throw new RuntimeException('Foreign course: cleanup refused.');
    }
    $CFG->forced_plugin_settings['tool_recyclebin']['categorybinenable'] = 0;
    $CFG->forced_plugin_settings['tool_recyclebin']['coursebinenable'] = 0;
    if ($course) {
        ob_start();
        delete_course($course, false);
        ob_end_clean();
    }
    foreach ($manifest['userIds'] as $id) {
        $user = $DB->get_record('user', ['id' => $id, 'deleted' => 0]);
        if ($user) {
            if ($user->idnumber !== $manifest['identity'] || $user->auth !== 'nologin') {
                throw new RuntimeException('Foreign user: cleanup refused.');
            }
            delete_user($user);
        }
    }
    $complete = !$DB->record_exists('course', ['id' => $courseid]);
    foreach ($manifest['userIds'] as $id) {
        $complete = $complete && !$DB->record_exists('user', ['id' => $id, 'deleted' => 0]);
    }
    if (isset($manifest['settings'])) {
        foreach ($manifest['settings'] as $name => $value) {
            if ($value === null) {
                unset_config($name, 'local_groupimport');
            } else {
                set_config($name, $value, 'local_groupimport');
            }
            $actual = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $name]);
            $complete = $complete && ($actual ? $actual->value : null) === $value;
        }
    }
    $same = easystud_perf_relationships($manifest) === $manifest['before'];
    $manifest['cleanup'] = ['complete' => $complete && $same, 'preExistingRelationshipsUnchanged' => $same];
    easystud_perf_write($path, $manifest);
    echo json_encode($manifest['cleanup']) . PHP_EOL;
    exit($manifest['cleanup']['complete'] ? 0 : 1);
}
if ($action !== 'setup' || $manifest || empty($options['run-id'])) {
    throw new RuntimeException('Fresh supervised fixture setup required.');
}
$identity = 'codex2-k16-01-' . substr(hash('sha256', $options['run-id']), 0, 12);
if ($DB->record_exists('course', ['idnumber' => $identity])) {
    throw new RuntimeException('Existing course cannot be adopted.');
}
$manifest = ['owner' => 'codex2-k16-01', 'identity' => $identity, 'courseId' => 0, 'userIds' => []];
$manifest['before'] = easystud_perf_relationships($manifest);
$manifest['settings'] = [];
foreach (['showcompleteview'] as $name) {
    $row = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $name]);
    $manifest['settings'][$name] = $row ? $row->value : null;
}
easystud_perf_write($path, $manifest);
set_config('showcompleteview', 1, 'local_groupimport');
$generator = new testing_data_generator();
$course = $generator->create_course(['fullname' => 'QA K16-01 Long lists', 'shortname' => $identity,
    'idnumber' => $identity, 'visible' => 0, 'numsections' => 0]);
$manifest['courseId'] = (int)$course->id;
easystud_perf_write($path, $manifest);
for ($i = 0; $i < 60; $i++) {
    $user = $generator->create_user(['username' => $identity . '-' . $i, 'auth' => 'nologin',
        'firstname' => 'QA', 'lastname' => 'Member ' . sprintf('%02d', $i),
        'email' => $identity . '-' . $i . '@example.invalid', 'idnumber' => $identity]);
    $manifest['userIds'][] = (int)$user->id;
    easystud_perf_write($path, $manifest);
    $generator->enrol_user($user->id, $course->id, 'student');
}
$grouping = groups_create_grouping((object)['courseid' => $course->id, 'name' => 'QA Long grouping']);
$manifest['groupingId'] = $grouping;
$manifest['groupIds'] = [];
for ($i = 0; $i < 37; $i++) {
    $id = groups_create_group((object)['courseid' => $course->id, 'name' => 'QA Group ' . sprintf('%02d', $i)]);
    $manifest['groupIds'][] = $id;
    if ($i < 16) {
        groups_assign_grouping($grouping, $id);
    }
    foreach ($manifest['userIds'] as $index => $userid) {
        if (
            $index === 0 || ($index === 1 && $i < 15) || $i === 0 ||
                ($i === 1 && $index < 20) || ($i === 2 && $index < 21)
        ) {
            groups_add_member($id, $userid);
        }
    }
    easystud_perf_write($path, $manifest);
}
$manifest['complete'] = true;
$manifest['managerUrl'] = $CFG->wwwroot . '/local/groupimport/manage.php?id=' . $course->id;
easystud_perf_write($path, $manifest);
echo json_encode(['complete' => true, 'managerUrl' => $manifest['managerUrl']]) . PHP_EOL;
