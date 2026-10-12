<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

/**
 * Idempotent local-only T052 data generator and exact-owner cleanup.
 * Run with the runtime and fixture leases through Invoke-Baseline.ps1.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
define('CLI_SCRIPT', true);
$options = getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:', 'purge', 'help']);
if (isset($options['help'])) {
    echo "--moodle-root PATH --manifest EXTERNAL.json [--action setup|cleanup|verify] [--purge]\n";
    exit;
}
if (empty($options['moodle-root']) || empty($options['manifest'])) {
    fwrite(STDERR, "Required: --moodle-root and --manifest.\n");
    exit(2);
}
$root = realpath($options['moodle-root']);
if (!$root || !is_file($root . '/config.php')) {
    throw new RuntimeException('Invalid Moodle root.');
}
require($root . '/config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->libdir . '/testing/generator/lib.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
$cache = easystud_perf_require_local();
\core\session\manager::set_user(get_admin());
$path = getenv('EASYEDU_PERF_MANIFEST') ?: $options['manifest'];
// Moodle backup diagnostics use error_log even for successful cleanup. Keep
// them in the external run rather than PowerShell's terminating stderr stream.
ini_set('error_log', $path . '.php-errors.log');
$action = isset($options['purge']) ? 'cleanup' : ($options['action'] ?? 'setup');
if (!in_array($action, ['setup', 'cleanup', 'verify'], true)) {
    throw new RuntimeException('Unknown fixture action.');
}
$manifest = is_file($path) ? easystud_perf_manifest($path) : [
    'fixture' => 'easystud-perf-t052-v1', 'prefix' => 'perffixture-t052-',
    'courseId' => 0, 'userIds' => [], 'groupIds' => [], 'groupingIds' => [],
    'runId' => $options['run-id'] ?? 'manual', 'complete' => false,
];
if ($action !== 'setup' && !is_file($path)) {
    throw new RuntimeException('Cleanup/verification requires an existing ownership manifest.');
}
easystud_perf_validate($manifest);
if ($action === 'cleanup') {
    $courseid = (int)$manifest['courseId'];
    if ($courseid && $DB->record_exists('course', ['id' => $courseid])) {
        // The plugin does not implement a course-deletion callback for its history.
        $DB->delete_records('local_groupimport_history', ['courseid' => $courseid]);
        ob_start();
        delete_course($courseid, false);
        ob_end_clean();
    }
    $usersremoved = true;
    foreach ($manifest['userIds'] as $userid) {
        $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0]);
        if ($user && !delete_user($user)) {
            throw new RuntimeException('A fixture user could not be removed.');
        }
        $usersremoved = $usersremoved && !$DB->record_exists('user', ['id' => $userid, 'deleted' => 0]);
    }
    $after = easystud_perf_relationships($manifest);
    $manifest['cleanup'] = [
        'complete' => $usersremoved && !$DB->record_exists('course', ['id' => $courseid]) &&
            $after === $manifest['baselineRelationships'],
        'preExistingRelationshipsUnchanged' => $after === $manifest['baselineRelationships'],
        'userTombstonesRetained' => true,
    ];
    easystud_perf_write($path, $manifest);
    echo json_encode($manifest['cleanup'], JSON_THROW_ON_ERROR) . "\n";
    exit($manifest['cleanup']['complete'] ? 0 : 1);
}
if ($action === 'setup') {
    if (!isset($manifest['baselineRelationships'])) {
        $manifest['baselineRelationships'] = easystud_perf_relationships($manifest);
    }
    easystud_perf_write($path, $manifest);
    $generator = new testing_data_generator();
    if (!$manifest['courseId']) {
        if ($DB->record_exists('course', ['shortname' => 'perffixture-t052']) ||
                $DB->record_exists('course', ['idnumber' => $manifest['fixture']])) {
            throw new RuntimeException('An existing fixture needs its original manifest; adoption refused.');
        }
        $course = $generator->create_course([
            'fullname' => 'EasyStud Perf Fixture', 'shortname' => 'perffixture-t052',
            'idnumber' => $manifest['fixture'], 'visible' => 0, 'numsections' => 0,
            'summary' => 'Synthetic local T052 performance course. No real users.', 'newsitems' => 0,
        ]);
        $manifest['courseId'] = (int)$course->id;
        easystud_perf_write($path, $manifest);
    }
    $courseid = (int)$manifest['courseId'];
    $manual = enrol_get_plugin('manual');
    if (!$manual) {
        throw new RuntimeException('Manual enrolment plugin is unavailable.');
    }
    if (!$DB->record_exists('enrol', ['courseid' => $courseid, 'enrol' => 'manual'])) {
        $manual->add_instance(get_course($courseid), ['status' => ENROL_INSTANCE_ENABLED]);
    }
    for ($i = 0; $i < 800; $i++) {
        if (!isset($manifest['userIds'][$i])) {
            $username = $manifest['prefix'] . sprintf('%04d', $i);
            if ($DB->record_exists('user', ['username' => $username, 'deleted' => 0])) {
                throw new RuntimeException('Unowned fixture username exists; adoption refused.');
            }
            $user = $generator->create_user([
                'username' => $username, 'email' => $username . '@example.invalid', 'auth' => 'nologin',
                'idnumber' => $manifest['fixture'], 'firstname' => 'Perf', 'lastname' => sprintf('User %04d', $i),
                'firstnamephonetic' => '', 'lastnamephonetic' => '', 'middlename' => '', 'alternatename' => '',
                'description' => '<p>Synthetic participant for EasyStud T052, with profile text and multiple memberships.</p>',
                'descriptionformat' => FORMAT_HTML,
            ]);
            $manifest['userIds'][$i] = (int)$user->id;
            easystud_perf_write($path, $manifest);
        }
        if (!is_enrolled(context_course::instance($courseid), $manifest['userIds'][$i])) {
            if (!$generator->enrol_user($manifest['userIds'][$i], $courseid, 'student')) {
                throw new RuntimeException('Cannot enrol a synthetic participant.');
            }
        }
    }
    foreach (['groupIds' => 150, 'groupingIds' => 40] as $key => $count) {
        for ($i = 0; $i < $count; $i++) {
            if (!isset($manifest[$key][$i])) {
                $record = ['courseid' => $courseid, 'name' => $manifest['prefix'] .
                    ($key === 'groupIds' ? 'group-' : 'grouping-') . sprintf('%03d', $i)];
                $item = $key === 'groupIds' ? $generator->create_group($record) : $generator->create_grouping($record);
                $manifest[$key][$i] = (int)$item->id;
                easystud_perf_write($path, $manifest);
            }
        }
    }
    foreach ($manifest['userIds'] as $i => $userid) {
        foreach ([0, 17, 61] as $offset) {
            $groupid = $manifest['groupIds'][($i + $offset) % 150];
            if (!groups_is_member($groupid, $userid)) {
                $generator->create_group_member(['groupid' => $groupid, 'userid' => $userid]);
            }
        }
    }
    foreach ($manifest['groupIds'] as $i => $groupid) {
        foreach ([0, 7] as $offset) {
            $groupingid = $manifest['groupingIds'][($i + $offset) % 40];
            if (!$DB->record_exists('groupings_groups', ['groupingid' => $groupingid, 'groupid' => $groupid])) {
                $generator->create_grouping_group(['groupingid' => $groupingid, 'groupid' => $groupid]);
            }
        }
    }
    $manifest['complete'] = true;
    easystud_perf_write($path, $manifest);
}
easystud_perf_validate($manifest);
$result = [
    'complete' => $manifest['complete'], 'courseId' => $manifest['courseId'],
    'users' => count($manifest['userIds']), 'groups' => count($manifest['groupIds']),
    'groupings' => count($manifest['groupingIds']), 'memberships' => $DB->count_records_sql(
        'SELECT COUNT(1) FROM {groups_members} gm JOIN {groups} g ON g.id = gm.groupid WHERE g.courseid = ?',
        [$manifest['courseId']]),
    'managerUrl' => $CFG->wwwroot . '/local/groupimport/manage.php?id=' . $manifest['courseId'],
    'cacheSettings' => $cache,
];
echo json_encode($result, JSON_THROW_ON_ERROR) . "\n";
