<?php
// Test-only restoration of the synthetic first learner; own Perf fixture only.
define('CLI_SCRIPT', true);
$options = [];
for ($i = 1; $i < count($argv); $i += 2) {
    $options[ltrim($argv[$i], '-')] = $argv[$i + 1] ?? '';
}
require($options['moodle-root'] . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own Perf only');
}
require_once($CFG->dirroot . '/group/lib.php');
$data = json_decode(file_get_contents($options['manifest']), true, 512, JSON_THROW_ON_ERROR);
$courseid = (int)$data['courseId'];
$userid = (int)$data['userIds'][0];
$course = $DB->get_record('course', ['id' => $courseid], '*', MUST_EXIST);
$user = $DB->get_record('user', ['id' => $userid], '*', MUST_EXIST);
if (strpos($course->shortname, 'eed-guide-write-') !== 0 || strpos($user->username, 'eed-guide-write-') !== 0) {
    throw new RuntimeException('Owned synthetic fixture required');
}
$before = $DB->get_records('groups_members', ['userid' => $userid], 'groupid');
foreach ($data['groupIds'] as $groupid) {
    if (!$DB->record_exists('groups', ['id' => $groupid, 'courseid' => $courseid])) {
        throw new RuntimeException('Fixture group escaped its course');
    }
    groups_remove_member($groupid, $userid);
}
groups_add_member($data['groupIds'][0], $userid);
$after = $DB->get_records('groups_members', ['userid' => $userid], 'groupid');
echo json_encode(['courseId' => $courseid, 'userId' => $userid,
    'before' => array_values($before), 'after' => array_values($after)]) . PHP_EOL;
