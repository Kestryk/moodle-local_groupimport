<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

/**
 * Local-supervised T052 fixture ownership and measurement helpers.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

/** Write an external JSON record atomically, without authentication state. */
function easystud_perf_write(string $path, array $data): void {
    if (!is_dir(dirname($path)) || !is_writable(dirname($path))) {
        throw new RuntimeException('The external output directory must exist and be writable.');
    }
    $temporary = $path . '.pending';
    if (
        file_put_contents($temporary, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES |
            JSON_THROW_ON_ERROR) . "\n", LOCK_EX) === false || !rename($temporary, $path)
    ) {
        throw new RuntimeException('Cannot persist the performance ownership record.');
    }
}

/** Reject production hosts and settings that invalidate a cache-enabled baseline. */
function easystud_perf_require_local(): array {
    global $CFG;
    if (!in_array(parse_url($CFG->wwwroot, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1'], true)) {
        throw new RuntimeException('T052 is restricted to a local Moodle installation.');
    }
    $cache = [
        'cachejs' => !isset($CFG->cachejs) || (bool)$CFG->cachejs,
        'cachetemplates' => !isset($CFG->cachetemplates) || (bool)$CFG->cachetemplates,
        'themedesignermode' => !empty($CFG->themedesignermode),
        'disableallcaches' => !empty($CFG->disableallcaches),
    ];
    if (!$cache['cachejs'] || !$cache['cachetemplates'] || $cache['themedesignermode'] || $cache['disableallcaches']) {
        throw new RuntimeException('Cache-enabled baseline unavailable: runtime cache settings need owner review.');
    }
    return $cache;
}

/** Read a manifest; a matching course name alone is never ownership evidence. */
function easystud_perf_manifest(string $path): array {
    $data = json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR);
    if (
        ($data['fixture'] ?? '') !== 'easystud-perf-t052-v1' ||
            ($data['prefix'] ?? '') !== 'perffixture-t052-'
    ) {
        throw new RuntimeException('Unknown T052 ownership manifest.');
    }
    return $data;
}

/** Validate every existing owned object before measurement or deletion. */
function easystud_perf_validate(array $manifest): void {
    global $DB;
    $courseid = (int)($manifest['courseId'] ?? 0);
    $course = null;
    if ($courseid) {
        $course = $DB->get_record('course', ['id' => $courseid]);
        if (
            $course && ($course->idnumber !== $manifest['fixture'] ||
                $course->shortname !== 'perffixture-t052' || (int)$course->visible !== 0)
        ) {
            throw new RuntimeException('Fixture course ownership changed.');
        }
        foreach ($course ? ['groups', 'groupings'] : [] as $table) {
            foreach ($DB->get_records($table, ['courseid' => $courseid], '', 'id,name') as $record) {
                if (!str_starts_with($record->name, $manifest['prefix'])) {
                    throw new RuntimeException('An unowned group or grouping is present in the fixture course.');
                }
            }
        }
        $enrolled = $course ? get_enrolled_users(context_course::instance($courseid), '', 0, 'u.id') : [];
        foreach ($enrolled as $user) {
            if (!in_array((int)$user->id, array_values($manifest['userIds']), true)) {
                throw new RuntimeException('A non-fixture enrolment is present; cleanup refused.');
            }
        }
    }
    foreach ($manifest['userIds'] as $index => $userid) {
        $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0], 'id,username,email,auth,idnumber');
        if (!$user) {
            continue;
        }
        if (
            $user->username !== $manifest['prefix'] . sprintf('%04d', $index) ||
                $user->email !== $user->username . '@example.invalid' || $user->auth !== 'nologin' ||
                $user->idnumber !== $manifest['fixture']
        ) {
            throw new RuntimeException('Fixture user ownership changed.');
        }
        if (
            $DB->record_exists_sql('SELECT 1 FROM {user_enrolments} ue JOIN {enrol} e ON e.id = ue.enrolid ' .
                'WHERE ue.userid = ? AND e.courseid <> ?', [$userid, $courseid]) ||
                $DB->record_exists_sql(
                    'SELECT 1 FROM {role_assignments} WHERE userid = ? AND contextid <> ?',
                    [$userid, $course ? context_course::instance($courseid)->id : 0]
                )
        ) {
            throw new RuntimeException('Fixture user gained an external enrolment or role; cleanup refused.');
        }
    }
}

/** Hash existing relationship rows; no passwords, names or private messages are read. */
function easystud_perf_relationships(array $manifest): array {
    global $DB;
    $courseid = (int)($manifest['courseId'] ?? 0);
    $queries = [
        'groups' => ['SELECT id,courseid FROM {groups} WHERE courseid <> ? ORDER BY id', [$courseid]],
        'groupings' => ['SELECT id,courseid FROM {groupings} WHERE courseid <> ? ORDER BY id', [$courseid]],
        'memberships' => ['SELECT gm.id,gm.groupid,gm.userid FROM {groups_members} gm JOIN {groups} g ' .
            'ON g.id = gm.groupid WHERE g.courseid <> ? ORDER BY gm.id', [$courseid]],
        'assignments' => ['SELECT gg.id,gg.groupid,gg.groupingid FROM {groupings_groups} gg JOIN {groupings} g ' .
            'ON g.id = gg.groupingid WHERE g.courseid <> ? ORDER BY gg.id', [$courseid]],
        'enrolments' => ['SELECT ue.id,ue.userid,ue.enrolid FROM {user_enrolments} ue JOIN {enrol} e ' .
            'ON e.id = ue.enrolid WHERE e.courseid <> ? ORDER BY ue.id', [$courseid]],
        'roles' => ['SELECT id,roleid,contextid,userid FROM {role_assignments} ORDER BY id', []],
    ];
    $result = [];
    foreach ($queries as $key => [$sql, $params]) {
        $records = $DB->get_records_sql($sql, $params);
        if ($key === 'roles') {
            foreach ($records as $id => $record) {
                if (in_array((int)$record->userid, array_values($manifest['userIds']), true)) {
                    unset($records[$id]);
                }
            }
        }
        $result[$key] = hash('sha256', json_encode(array_values($records), JSON_THROW_ON_ERROR));
    }
    return $result;
}
