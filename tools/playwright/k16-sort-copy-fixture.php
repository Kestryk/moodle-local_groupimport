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
// Disposable K16 sorting and membership-copy replay, restricted to the dedicated Perf DB.

define('CLI_SCRIPT', true);
$options = [];
for ($i = 1; $i < count($argv); $i += 2) {
    $options[ltrim($argv[$i], '-')] = $argv[$i + 1] ?? '';
}
$root = realpath($options['moodle-root'] ?? '');
if (!$root || !is_file($root . '/config.php')) {
    throw new RuntimeException('Explicit Moodle root required');
}
require($root . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Dedicated Perf copy only');
}
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/enrollib.php');
require_once($CFG->dirroot . '/user/lib.php');
$USER = get_admin();
$file = $options['manifest'] ?? '';
if (!$file || !is_dir(dirname($file))) {
    throw new RuntimeException('External manifest directory required');
}
function guide_fixture_save(string $file, array $data): void {
    if (file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES), LOCK_EX) === false) {
        throw new RuntimeException('Cannot persist fixture ownership');
    }
}
function guide_fixture_cleanup(array $data): array {
    global $DB, $CFG;
    $courseid = (int)($data['courseId'] ?? 0);
    $prefix = 'eed-guide-write-';
    if ($courseid && ($course = $DB->get_record('course', ['id' => $courseid]))) {
        if ($course->shortname !== ($data['shortname'] ?? '') || !str_starts_with($course->shortname, $prefix)) {
            throw new RuntimeException('Course ownership mismatch');
        }
        $CFG->forced_plugin_settings['tool_recyclebin']['categorybinenable'] = 0;
        $CFG->forced_plugin_settings['tool_recyclebin']['coursebinenable'] = 0;
        delete_course($course, false);
    }
    foreach (($data['userIds'] ?? []) as $id) {
        $user = $DB->get_record('user', ['id' => (int)$id]);
        if ($user && !$user->deleted) {
            if (!str_starts_with($user->username, $prefix) || $user->auth !== 'nologin') {
                throw new RuntimeException('Synthetic user ownership mismatch');
            }
            delete_user($user);
        }
    }
    $remaining = $courseid && $DB->record_exists('course', ['id' => $courseid]);
    return ['complete' => !$remaining, 'courseRemoved' => !$remaining,
        'syntheticUsersDeleted' => count($data['userIds'] ?? [])];
}
$action = $options['action'] ?? '';
if ($action === 'cleanup') {
    $data = is_file($file) ? json_decode(file_get_contents($file), true) : [];
    if (!is_array($data)) {
        throw new RuntimeException('Invalid fixture manifest');
    }
    $id = (int)($data['courseId'] ?? 0);
    $course = $id ? $DB->get_record('course', ['id' => $id]) : false;
    if ($course && $course->shortname !== ($data['shortname'] ?? '')) {
        throw new RuntimeException('Course snapshot ownership mismatch');
    }
    $snapshot = ['groups' => [], 'memberships' => [], 'groupingAssignments' => []];
    if ($course) {
        $snapshot['groups'] = array_values($DB->get_records('groups', ['courseid' => $id], 'id', 'id,name'));
        $snapshot['memberships'] = array_values($DB->get_records_sql(
            'SELECT gm.id, gm.groupid, gm.userid FROM {groups_members} gm JOIN {groups} g ON g.id = gm.groupid WHERE g.courseid = ?',
            [$id]
        ));
        $snapshot['groupingAssignments'] = array_values($DB->get_records_sql(
            'SELECT gg.id, gg.groupingid, gg.groupid FROM {groupings_groups} gg JOIN {groupings} g ON g.id = gg.groupingid WHERE g.courseid = ?',
            [$id]
        ));
    }
    $data['finalCourseState'] = $snapshot;
    guide_fixture_save($file, $data);
    echo json_encode(guide_fixture_cleanup($data) + ['finalCourseState' => $snapshot]) . PHP_EOL;
    exit;
}
if ($action !== 'setup' || !preg_match('/^[a-zA-Z0-9-]+$/', $options['run-id'] ?? '')) {
    throw new RuntimeException('Explicit setup/cleanup and safe run ID required');
}
if (is_file($file)) {
    throw new RuntimeException('Fresh manifest required');
}
$suffix = substr(hash('sha256', $options['run-id']), 0, 12);
$data = ['schemaVersion' => 1, 'runId' => $options['run-id'], 'courseId' => 0,
    'shortname' => 'eed-guide-write-' . $suffix, 'userIds' => []];
guide_fixture_save($file, $data);
try {
    $category = (int)$DB->get_field_sql('SELECT MIN(id) FROM {course_categories}');
    if (!$category) {
        throw new RuntimeException('Course category required');
    }
    $course = create_course((object)['fullname' => 'EasyStud guided write QA ' . $suffix,
        'shortname' => $data['shortname'], 'category' => $category, 'visible' => 1]);
    $data['courseId'] = (int)$course->id;
    guide_fixture_save($file, $data);
    $instances = enrol_get_instances($course->id, true);
    $manual = array_values(array_filter($instances, static fn($instance) => $instance->enrol === 'manual'))[0] ?? null;
    $role = $DB->get_record('role', ['shortname' => 'student'], '*', MUST_EXIST);
    if (!$manual) {
        throw new RuntimeException('Manual enrollment required');
    }
    $full = !defined('EASYSTUD_K16_SMALL_FIXTURE');
    $names = $full ? array_merge(['One', 'Two'], array_map(static fn($i) => sprintf('Member %02d', $i), range(1, 16))) : ['One', 'Two'];
    foreach ($names as $name) {
        $id = user_create_user((object)['username' => 'eed-guide-write-' . $suffix . '-' . str_replace(' ', '-', strtolower($name)),
            'firstname' => 'QA Guided', 'lastname' => $name,
            'email' => $suffix . '-' . str_replace(' ', '-', strtolower($name)) . '@example.invalid',
            'auth' => 'nologin', 'confirmed' => 1, 'mnethostid' => $CFG->mnet_localhost_id], false, false);
        $data['userIds'][] = (int)$id;
        guide_fixture_save($file, $data);
        enrol_get_plugin('manual')->enrol_user($manual, $id, $role->id);
    }
    $data['groupIds'] = [];
    $names = ['QA Source Alpha', 'QA Destination Beta', 'QA Activity Gamma'];
    if (defined('EASYSTUD_K16_COPY_GROUP_NAMES')) {
        $names = EASYSTUD_K16_COPY_GROUP_NAMES;
    }
    if ($full) {
        $names = array_merge($names, array_map(static fn($i) => sprintf('QA Group %02d', $i), range(1, 10)));
    }
    foreach ($names as $name) {
        $data['groupIds'][] = (int)groups_create_group((object)['courseid' => $course->id, 'name' => $name]);
    }
    groups_add_member($data['groupIds'][0], $data['userIds'][0]);
    groups_add_member($data['groupIds'][1], $data['userIds'][1]);
    $data['groupingIds'] = [];
    $names = ['QA Source Structure', 'QA Activity Destination'];
    if ($full) {
        $names = array_merge($names, array_map(static fn($i) => sprintf('QA Grouping %02d', $i), range(1, 10)));
    }
    foreach ($names as $name) {
        $data['groupingIds'][] = (int)groups_create_grouping((object)['courseid' => $course->id, 'name' => $name]);
    }
    foreach ($data['groupIds'] as $id) {
        groups_assign_grouping($data['groupingIds'][0], $id);
    }
    $data['managerUrl'] = $CFG->wwwroot . '/local/groupimport/manage.php?id=' . $course->id . '&lang=fr';
    guide_fixture_save($file, $data);
    echo json_encode($data, JSON_UNESCAPED_SLASHES) . PHP_EOL;
} catch (Throwable $error) {
    guide_fixture_cleanup($data);
    throw $error;
}
