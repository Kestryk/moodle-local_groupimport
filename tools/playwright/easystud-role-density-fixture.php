<?php
// Local-supervised SM-15 only. Never modifies existing users or role permissions.
// Run through Invoke-EasyStudRolesDensitySupervised.ps1 with both exclusive leases.
define('CLI_SCRIPT', true);

$options = getopt('', ['moodle-root:', 'action:', 'manifest:', 'run-id:', 'course-id::']);
foreach (['moodle-root', 'action', 'manifest'] as $key) {
    if (empty($options[$key])) {
        fwrite(STDERR, "Required options: --moodle-root --action --manifest [--run-id].\n");
        exit(2);
    }
}
$moodleroot = realpath($options['moodle-root']);
if (!$moodleroot || !is_file($moodleroot . '/config.php')) {
    throw new RuntimeException('Invalid Moodle root.');
}
require($moodleroot . '/config.php');
require_once($CFG->dirroot . '/user/lib.php');
require_once($CFG->libdir . '/enrollib.php');
if (!in_array(parse_url($CFG->wwwroot, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1'], true)) {
    throw new RuntimeException('This fixture is restricted to localhost.');
}
$USER = get_admin();
if (!$USER) {
    throw new RuntimeException('No local administrator exists.');
}
$manifestpath = $options['manifest'];
if (!is_dir(dirname($manifestpath)) || !is_writable(dirname($manifestpath))) {
    throw new RuntimeException('External manifest directory must already exist and be writable.');
}

/** Durable ownership record; no credentials or real-user data. */
function density_manifest(string $path, array $manifest): void {
    if (file_put_contents($path, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX) === false) {
        throw new RuntimeException('Cannot persist fixture ownership manifest.');
    }
}

/** Hash the pre-existing definitions and course relationships, not passwords. */
function density_baseline(int $courseid, int $contextid): array {
    global $DB;
    $queries = [
        'roleDefinitions' => ['SELECT id, name, shortname, description, sortorder, archetype FROM {role} ORDER BY id', []],
        'courseAssignments' => ['SELECT * FROM {role_assignments} WHERE contextid = ? ORDER BY id', [$contextid]],
        'courseEnrolments' => ['SELECT ue.* FROM {user_enrolments} ue JOIN {enrol} e ON e.id = ue.enrolid WHERE e.courseid = ? ORDER BY ue.id', [$courseid]],
        'courseGroups' => ['SELECT * FROM {groups} WHERE courseid = ? ORDER BY id', [$courseid]],
        'courseMembers' => ['SELECT gm.* FROM {groups_members} gm JOIN {groups} g ON g.id = gm.groupid WHERE g.courseid = ? ORDER BY gm.id', [$courseid]],
        'courseGroupings' => ['SELECT * FROM {groupings} WHERE courseid = ? ORDER BY id', [$courseid]],
    ];
    $result = [];
    foreach ($queries as $key => [$sql, $params]) {
        $result[$key] = hash('sha256', json_encode($DB->get_records_sql($sql, $params)));
    }
    return $result;
}

/** Fail closed before deleting anything if the exact fixture ownership drifted. */
function density_cleanup(array $manifest): array {
    global $DB;
    if (($manifest['fixture'] ?? '') !== 'easystud-sm15-role-density' ||
            !preg_match('/^eed-sm15-[a-f0-9]{12}-$/', $manifest['prefix'] ?? '') ||
            empty($manifest['courseId']) || empty($manifest['contextId'])) {
        throw new RuntimeException('Unknown fixture manifest; cleanup refused.');
    }
    $prefix = $manifest['prefix'];
    $users = [];
    foreach ($manifest['userIds'] as $id) {
        $user = $DB->get_record('user', ['id' => $id, 'deleted' => 0]);
        if (!$user) { continue; }
        if (!str_starts_with($user->username, $prefix) || $user->auth !== 'nologin' ||
                $DB->record_exists_sql('SELECT 1 FROM {user_enrolments} ue JOIN {enrol} e ON e.id = ue.enrolid WHERE ue.userid = ? AND e.courseid <> ?', [$id, $manifest['courseId']])) {
            throw new RuntimeException('Fixture user ownership changed; cleanup refused.');
        }
        $users[] = $user;
    }
    foreach ($manifest['roleIds'] as $id) {
        $role = $DB->get_record('role', ['id' => $id]);
        if (!$role) { continue; }
        if (!str_starts_with($role->shortname, $prefix) || $role->archetype !== '' ||
                $DB->record_exists('role_capabilities', ['roleid' => $id])) {
            throw new RuntimeException('Fixture role ownership changed; cleanup refused.');
        }
        foreach ($DB->get_records('role_assignments', ['roleid' => $id]) as $assignment) {
            if ((int)$assignment->contextid !== (int)$manifest['contextId'] ||
                    !in_array((int)$assignment->userid, $manifest['userIds'], true)) {
                throw new RuntimeException('Fixture role used elsewhere; cleanup refused.');
            }
        }
    }
    $manual = enrol_get_plugin('manual');
    $instance = $DB->get_record('enrol', ['id' => $manifest['enrolId'], 'courseid' => $manifest['courseId'], 'enrol' => 'manual'], '*', MUST_EXIST);
    foreach ($users as $user) { $manual->unenrol_user($instance, $user->id); }
    foreach ($manifest['roleIds'] as $id) {
        if ($DB->record_exists('role', ['id' => $id])) { delete_role($id); }
    }
    foreach ($users as $user) {
        if (!delete_user($user)) { throw new RuntimeException('Native fixture user deletion failed.'); }
    }
    $after = density_baseline((int)$manifest['courseId'], (int)$manifest['contextId']);
    $complete = $after === $manifest['baseline'];
    return ['complete' => $complete, 'preExistingRelationshipsUnchanged' => $complete, 'baselineAfter' => $after,
        'roleIds' => $manifest['roleIds'], 'userIds' => $manifest['userIds'],
        'note' => 'Native deleted-user tombstones and audit events intentionally remain.'];
}

if ($options['action'] === 'cleanup') {
    if (!is_file($manifestpath)) {
        echo json_encode(['complete' => true, 'reason' => 'no-manifest']) . "\n";
        exit(0);
    }
    $manifest = json_decode(file_get_contents($manifestpath), true, 512, JSON_THROW_ON_ERROR);
    $cleanup = density_cleanup($manifest);
    $manifest['cleanup'] = $cleanup;
    density_manifest($manifestpath, $manifest);
    echo json_encode($cleanup, JSON_UNESCAPED_SLASHES) . "\n";
    exit($cleanup['complete'] ? 0 : 1);
}
if ($options['action'] !== 'setup' || empty($options['run-id']) ||
        !preg_match('/^[A-Za-z0-9-]+$/', $options['run-id']) || is_file($manifestpath)) {
    throw new RuntimeException('Setup needs a unique safe run-id and a new manifest.');
}
$courseid = (int)($options['course-id'] ?? 5);
$course = get_course($courseid);
$context = context_course::instance($courseid);
$instance = null;
foreach (enrol_get_instances($courseid, true) as $candidate) {
    if ($candidate->enrol === 'manual') { $instance = $candidate; break; }
}
if (!$instance) { throw new RuntimeException('A pre-existing manual enrolment instance is required.'); }
$manifest = ['schemaVersion' => 1, 'fixture' => 'easystud-sm15-role-density',
    'prefix' => 'eed-sm15-' . substr(hash('sha256', $options['run-id']), 0, 12) . '-',
    'courseId' => $courseid, 'contextId' => (int)$context->id, 'enrolId' => (int)$instance->id,
    'roleIds' => [], 'userIds' => [], 'baseline' => density_baseline($courseid, (int)$context->id),
    'managerUrl' => $CFG->wwwroot . '/local/groupimport/manage.php?id=' . $courseid];
density_manifest($manifestpath, $manifest);
$transaction = $DB->start_delegated_transaction();
try {
    $roles = ['QA: Facilitator', 'QA: Tutor', 'QA: Mentor', 'QA: Observer', 'QA: Reviewer',
        'QA: Teaching assistant', 'QA: Accessibility support', 'QA: Programme coordinator',
        'QA: Assessment supervisor', 'QA: Industry liaison', 'QA: Learning designer', 'QA: External examiner'];
    foreach ($roles as $index => $name) {
        $roleid = create_role($name, $manifest['prefix'] . 'role-' . $index, 'Temporary EasyStud role-density fixture; no capabilities.', '');
        set_role_contextlevels($roleid, [CONTEXT_COURSE]);
        $manifest['roleIds'][] = (int)$roleid;
        density_manifest($manifestpath, $manifest);
    }
    $manual = enrol_get_plugin('manual');
    for ($index = 0; $index < 3; $index++) {
        $userid = user_create_user((object)['username' => $manifest['prefix'] . 'user-' . $index,
            'auth' => 'nologin', 'confirmed' => 1, 'mnethostid' => $CFG->mnet_localhost_id,
            'firstname' => 'QA role density', 'lastname' => 'Fixture ' . ($index + 1),
            'email' => $manifest['prefix'] . 'user-' . $index . '@example.invalid',
            'password' => 'not cached', 'maildisplay' => 0], false);
        $manifest['userIds'][] = (int)$userid;
        density_manifest($manifestpath, $manifest);
        // No standard role or capability is granted to these nologin users.
        $manual->enrol_user($instance, $userid, 0);
        foreach ($manifest['roleIds'] as $roleindex => $roleid) {
            if ($index === 0 || $roleindex % 2 === $index - 1) {
                role_assign($roleid, $userid, $context->id);
            }
        }
    }
    $transaction->allow_commit();
    echo json_encode($manifest, JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $exception) {
    // Moodle rollback throws. Recheck exact ownership even if ids were rolled back.
    try { $transaction->rollback($exception); } catch (Throwable $rolledback) {
        $cleanup = density_cleanup($manifest);
        if (!$cleanup['complete']) { throw new RuntimeException('Setup failed and fixture cleanup is incomplete.', 0, $rolledback); }
        throw $rolledback;
    }
}
