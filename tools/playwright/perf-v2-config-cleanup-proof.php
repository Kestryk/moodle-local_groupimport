<?php
// Verify only manifest-owned test objects, without deleting anything.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$root = 'C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017';
$courses = [];
$users = [];
foreach (glob($root . '/shared-fixture*.json') as $file) {
    $m = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    if ($m['owner'] !== 'codex2-perf-v2') {
        throw new RuntimeException('Foreign owner');
    }
    foreach ($m['courseIds'] as $id) {
        if ($id <= 71) {
            throw new RuntimeException('Foreign course');
        }
        $courses[$id] = $id;
    }
    foreach ($m['userIds'] as $id) {
        $users[$id] = $id;
    }
}
$count = static function($table, $field, $ids, $condition = '') use ($DB) {
    $total = 0;
    foreach (array_chunk(array_values($ids), 400) as $chunk) {
        [$sql, $params] = $DB->get_in_or_equal($chunk);
        $total += $DB->count_records_select($table, $field . ' ' . $sql . $condition, $params);
    }
    return $total;
};
$remaining = ['courses' => $count('course', 'id', $courses),
    'groups' => $count('groups', 'courseid', $courses),
    'groupings' => $count('groupings', 'courseid', $courses),
    'enrolments' => $count('user_enrolments', 'userid', $users),
    'histories' => $count('local_groupimport_history', 'courseid', $courses),
    'activeUsers' => $count('user', 'id', $users, ' AND deleted = 0')];
echo json_encode(['complete' => array_sum($remaining) === 0, 'remaining' => $remaining,
    'ownedCourses' => count($courses), 'ownedUsers' => count($users)], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
