<?php
// Isolated fixture reset and SQL proof; never usable on another runtime or course5.
define('CLI_SCRIPT', true);
$options = getopt('', ['moodle-root:', 'manifest:', 'action:', 'existing:', 'multi:']);
require($options['moodle-root'] . '/config.php');
require_once($CFG->dirroot . '/group/lib.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$data = json_decode(file_get_contents($options['manifest']), true, 512, JSON_THROW_ON_ERROR);
$courseid = (int)$data['courseId'];
$course = get_course($courseid);
if ($courseid <= 5 || $course->shortname !== $data['shortname'] ||
        !str_starts_with($course->shortname, 'eed-guide-write-')) {
    throw new RuntimeException('Disposable course ownership mismatch');
}
$userid = (int)$data['userIds'][0];
$user = $DB->get_record('user', ['id' => $userid], '*', MUST_EXIST);
if ($user->auth !== 'nologin' || !str_starts_with($user->username, 'eed-guide-write-')) {
    throw new RuntimeException('Synthetic user ownership mismatch');
}
foreach ($data['groupIds'] as $id) {
    $DB->get_record('groups', ['id' => $id, 'courseid' => $courseid], '*', MUST_EXIST);
}
\core\session\manager::set_user(get_admin());
if ($options['action'] === 'reset') {
    foreach ($data['groupIds'] as $id) {
        if (groups_is_member($id, $userid)) {
            groups_remove_member($id, $userid);
        }
    }
    groups_add_member($data['groupIds'][0], $userid);
    groups_add_member($data['groupIds'][3], $userid);
    if (!empty($options['multi'])) {
        groups_add_member($data['groupIds'][2], $userid);
    }
    if (!empty($options['existing'])) {
        groups_add_member($data['groupIds'][1], $userid);
    }
} else if ($options['action'] !== 'snapshot') {
    throw new RuntimeException('Explicit reset/snapshot required');
}
$rows = array_values($DB->get_records_sql('SELECT gm.id, gm.groupid, gm.userid
    FROM {groups_members} gm JOIN {groups} g ON g.id = gm.groupid
    WHERE g.courseid = ? AND gm.userid = ? ORDER BY gm.groupid, gm.id', [$courseid, $userid]));
echo json_encode(['courseId' => $courseid, 'userId' => $userid, 'groupIds' => $data['groupIds'],
    'rows' => $rows], JSON_UNESCAPED_SLASHES) . PHP_EOL;
