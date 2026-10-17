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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * SM-RENDU step 1 checks: parity of the compact state with the legacy page data, size,
 * SQL reads, permissions and state version.
 *
 * Read-only unless --write-test is given (creates then deletes one temporary group).
 * Run only on a development or measurement copy, never on production.
 *
 *   php tools/sm/check-state.php --moodle-root=PATH --courseid=5 [--write-test] [--output=C:/path/result.json]
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

define('CLI_SCRIPT', true);

// The plugin may be linked into the tested Moodle; --moodle-root names that Moodle explicitly.
$moodleroot = dirname(__DIR__, 4);
foreach ($argv as $arg) {
    if (strpos($arg, '--moodle-root=') === 0) {
        $moodleroot = substr($arg, strlen('--moodle-root='));
    }
}
require($moodleroot . '/config.php');
require_once($CFG->libdir . '/clilib.php');
require_once($CFG->dirroot . '/group/lib.php');

use core_external\external_api;
use local_groupimport\local\state_version;
use local_groupimport\service\course_state;
use local_groupimport\service\course_structure;

[$options] = cli_get_params(
    ['moodle-root' =>
         '',
         'courseid' =>
         0,
         'write-test' =>
         false,
         'output' =>
         '',
         'help' =>
         false],
    ['h' =>
    'help']
);
if ($options['help'] || empty($options['courseid'])) {
    cli_writeln('Usage: php tools/sm/check-state.php [--moodle-root=PATH] --courseid=ID [--write-test] [--output=FILE]');
    exit(0);
}

$course = get_course((int)$options['courseid']);
$context = context_course::instance($course->id);
\core\session\manager::set_user(get_admin());
$PAGE->set_context($context);

$failures = [];
$fail = static function (string $message) use (&$failures): void {
    if (count($failures) < 50) {
        $failures[] = $message;
    }
};

// Legacy data, exactly as manage.php receives it.
$reads = $DB->perf_get_reads();
$start = microtime(true);
$legacy = course_structure::get_state($course, $context);
$legacyms = round((microtime(true) - $start) * 1000);
$legacyreads = $DB->perf_get_reads() - $reads;

// Compact state.
$reads = $DB->perf_get_reads();
$start = microtime(true);
$state = course_state::build($course, $context);
$statems = round((microtime(true) - $start) * 1000);
$statereads = $DB->perf_get_reads() - $reads;
$statejson = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

$rolenames = array_column($state['roles'], 'name', 'id');

// 1. Participants: same ids in the same order, same names, e-mails, groups and roles.
if (array_map('intval', array_keys($legacy['users'])) !== array_column($state['users'], 'id')) {
    $fail('users: ids or order differ');
}
$identifierkeys = array_column($state['meta']['identifierfields'], 'key');
foreach ($state['users'] as $user) {
    $old = $legacy['users'][$user['id']] ?? null;
    if (!$old) {
        continue;
    }
    foreach (['fullname', 'email'] as $field) {
        if ($old[$field] !== $user[$field]) {
            $fail("user {$user['id']}: $field differs");
        }
    }
    if ($old['groupids'] !== $user['groupids']) {
        $fail("user {$user['id']}: groupids differ");
    }
    $names = array_map(static function (int $roleid) use ($rolenames): string {
        return $rolenames[$roleid];
    }, $user['roleids']);
    if (array_values($old['roles']) !== $names) {
        $fail("user {$user['id']}: roles differ");
    }
    foreach (['username', 'email', 'idnumber'] as $field) {
        if (in_array($field, $identifierkeys, true) && (string)$old[$field] !== ($user['identifiers'][$field] ?? '')) {
            $fail("user {$user['id']}: identifier $field differs");
        }
    }
    foreach (array_keys($user['identifiers'] ?? []) as $field) {
        if (!in_array($field, $identifierkeys, true)) {
            $fail("user {$user['id']}: identifier $field is not an allowed field");
        }
    }
}

// Custom profile identifiers: independent per-user reads on a sample.
foreach (array_slice($state['users'], 0, 25) as $user) {
    foreach ($identifierkeys as $field) {
        if (strpos($field, 'profile_field_') !== 0) {
            continue;
        }
        $expected = (string)$DB->get_field_sql(
            'SELECT d.data FROM {user_info_data} d JOIN {user_info_field} f ON f.id = d.fieldid
              WHERE d.userid = ? AND f.shortname = ?',
            [$user['id'], substr($field, strlen('profile_field_'))]
        );
        if ($expected !== ($user['identifiers'][$field] ?? '')) {
            $fail("user {$user['id']}: identifier $field differs");
        }
    }
}

// 2. Groups.
if (array_map('intval', array_keys($legacy['groups'])) !== array_column($state['groups'], 'id')) {
    $fail('groups: ids or order differ');
}
foreach ($state['groups'] as $group) {
    $old = $legacy['groups'][$group['id']] ?? null;
    if (!$old) {
        continue;
    }
    $checks = [
        'name' => [$old['name'], $group['name']],
        'rawname' => [$old['rawname'], $group['rawname']],
        'idnumber' => [$old['idnumber'], $group['idnumber']],
        'memberids' => [$old['memberids'], $group['memberids']],
        'groupingids' => [$old['groupingids'], $group['groupingids']],
        'enrolmentkey' => [$old['enrolmentkey'], $group['enrolmentkey']],
        'pictureurl' => [$old['picture'], $group['pictureurl']],
        'hidepicture' => [$old['hidepicture'], $group['hidepicture']],
        'hasdescription' => [trim($old['rawdescription']) !== '', $group['hasdescription']],
    ];
    foreach ($checks as $field => [$expected, $actual]) {
        if ($expected !== $actual) {
            $fail("group {$group['id']}: $field differs");
        }
    }
}

// 3. Groupings and the "without grouping" section.
if (array_map('intval', array_keys($legacy['groupings'])) !== array_column($state['groupings'], 'id')) {
    $fail('groupings: ids or order differ');
}
foreach ($state['groupings'] as $grouping) {
    $old = $legacy['groupings'][$grouping['id']] ?? null;
    if (
        $old && ($old['name'] !== $grouping['name'] || $old['idnumber'] !== $grouping['idnumber'] ||
            $old['groupids'] !== $grouping['groupids'] ||
            (trim($old['rawdescription']) !== '') !== $grouping['hasdescription'])
    ) {
        $fail("grouping {$grouping['id']}: fields differ");
    }
}
$ungrouped = array_values(array_map(static function (array $group): int {
    return $group['id'];
}, array_filter($state['groups'], static function (array $group): bool {
    return empty($group['groupingids']);
})));
if ($ungrouped !== $legacy['ungroupedgroupids']) {
    $fail('ungrouped group ids differ');
}

// 4. Details: same values as the legacy participant/group/grouping data.
$sampleusers = array_slice(array_column($state['users'], 'id'), 0, 20);
$details = $sampleusers ? course_state::get_details($course, $context, 'user', $sampleusers) : [];
foreach ($details as $detail) {
    $old = $legacy['users'][$detail['id']];
    foreach (
        ['fullname', 'email', 'profileimage', 'profileurl', 'username', 'idnumber', 'institution',
            'department', 'city', 'country', 'lang', 'description'] as $field
    ) {
        if ($old[$field] !== $detail[$field]) {
            $fail("details user {$detail['id']}: $field differs");
        }
    }
}
$samplegroups = array_slice(array_column($state['groups'], 'id'), 0, 20);
foreach ($samplegroups ? course_state::get_details($course, $context, 'group', $samplegroups) : [] as $detail) {
    $old = $legacy['groups'][$detail['id']];
    if ($old['description'] !== $detail['description'] || $old['rawdescription'] !== $detail['rawdescription']) {
        $fail("details group {$detail['id']}: description differs");
    }
}
$samplegroupings = array_slice(array_column($state['groupings'], 'id'), 0, 20);
foreach ($samplegroupings ? course_state::get_details($course, $context, 'grouping', $samplegroupings) : [] as $detail) {
    $old = $legacy['groupings'][$detail['id']];
    if (
        $old['description'] !== $detail['description'] || $old['rawdescription'] !== $detail['rawdescription'] ||
            $old['configdata'] !== $detail['configdata']
    ) {
        $fail("details grouping {$detail['id']}: fields differ");
    }
}

// 5. Permissions. CLI has no session cookie, so call_external_function() always answers
// servicerequireslogin; the login itself is enforced by lib/ajax/service.php. Call execute()
// directly: parameter validation, validate_context() and the capability checks all run there.
$permissions = [];
$call = static function (string $function, array $args): string {
    $class = [
        'local_groupimport_get_state' => \local_groupimport\external\get_state::class,
        'local_groupimport_get_details' => \local_groupimport\external\get_details::class,
    ][$function];
    try {
        $class::clean_returnvalue($class::execute_returns(), $class::execute(...array_values($args)));
        return 'allowed';
    } catch (\Exception $e) {
        return 'refused:' . ($e->errorcode ?? get_class($e));
    }
};
$permissions['admin_get_state'] = $call('local_groupimport_get_state', ['courseid' => $course->id]);
$outsider = $DB->get_record_sql(
    "SELECT u.* FROM {user} u
      WHERE u.deleted = 0 AND u.id > 2 AND u.id NOT IN (SELECT ue.userid FROM {user_enrolments} ue
            JOIN {enrol} e ON e.id = ue.enrolid WHERE e.courseid = ?)",
    [$course->id],
    IGNORE_MULTIPLE
) ?: guest_user();
if ($outsider) {
    $permissions['admin_details_outsider'] = $call(
        'local_groupimport_get_details',
        ['courseid' => $course->id, 'type' => 'user', 'ids' => [$outsider->id]]
    );
}
$student = null;
foreach ($state['users'] as $user) {
    if (!has_capability('moodle/course:managegroups', $context, $user['id'])) {
        $student = core_user::get_user($user['id']);
        break;
    }
}
if ($student) {
    \core\session\manager::set_user($student);
    $permissions['student_get_state'] = $call('local_groupimport_get_state', ['courseid' => $course->id]);
    \core\session\manager::set_user(get_admin());
}
if ($permissions['admin_get_state'] !== 'allowed') {
    $fail('admin cannot call get_state: ' . $permissions['admin_get_state']);
}
if (isset($permissions['admin_details_outsider']) && $permissions['admin_details_outsider'] === 'allowed') {
    $fail('details of a user outside the course were returned');
}
if (isset($permissions['student_get_state']) && $permissions['student_get_state'] === 'allowed') {
    $fail('a participant without managegroups received the state');
}

// 6. Version: optional write test on a disposable group.
$version = ['before' => state_version::get($course->id)];
if ($options['write-test']) {
    $groupid = groups_create_group((object)['courseid' => $course->id, 'name' => 'SM-RENDU check ' . time()]);
    $version['aftercreate'] = state_version::get($course->id);
    groups_delete_group($groupid);
    state_version::flush();
    $version['afterdelete'] = state_version::get($course->id);
    if ($version['aftercreate'] <= $version['before'] || $version['afterdelete'] <= $version['aftercreate']) {
        $fail('state version did not increase on group changes');
    }
}

$legacyjson = json_encode($legacy, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
$result = [
    'courseid' => (int)$course->id,
    'counts' => $state['meta']['counts'],
    'parity' => empty($failures) ? 'PASS' : 'FAIL',
    'failures' => $failures,
    'bytes' => ['state' => strlen($statejson), 'legacystate' => strlen($legacyjson)],
    'build' => ['statems' => $statems, 'statereads' => $statereads, 'legacyms' => $legacyms, 'legacyreads' => $legacyreads],
    'permissions' => $permissions,
    'version' => $version,
];
$output = json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
if ($options['output']) {
    file_put_contents($options['output'], $output);
}
cli_writeln($output);
exit(empty($failures) ? 0 : 1);
