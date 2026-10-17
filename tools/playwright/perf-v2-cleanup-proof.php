<?php
// Read-only verification of every owned manifest, including interrupted setup.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$root = 'C:/dev/Moodle 51 Perf/moodle/local/perf-v2-20261017';
$courses = [];
$users = [];
$sources = [];
$unchanged = true;
$hash = hash('sha256', json_encode($DB->get_records('groups', ['courseid' => 71], 'id', 'id,name')));
foreach (glob($root . '/easystud/authenticated/*/fixture-manifest.json') as $file) {
    $m = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    if (($m['owner'] ?? '') !== 'codex2-perf-v2') {
        throw new RuntimeException('Foreign fixture manifest');
    }
    foreach ($m['courseIds'] as $id) {
        if ($id <= 71) {
            throw new RuntimeException('Unexpected course id');
        }
        $courses[$id] = $id;
    }
    foreach ($m['userIds'] as $id) {
        $users[$id] = $id;
    }
    $sources[] = ['file' => $file, 'identity' => $m['identity'],
        'courses' => count($m['courseIds']), 'users' => count($m['userIds'])];
    $unchanged = $unchanged && $m['course71GroupsHash'] === $hash;
}
$count = static function($table, $field, $ids) use ($DB) {
    if (!$ids) {
        return 0;
    }
    [$sql, $params] = $DB->get_in_or_equal(array_values($ids));
    return $DB->count_records_select($table, $field . ' ' . $sql, $params);
};
$active = 0;
foreach (array_chunk(array_values($users), 500) as $chunk) {
    [$sql, $params] = $DB->get_in_or_equal($chunk);
    $active += $DB->count_records_sql('SELECT COUNT(1) FROM {user} WHERE deleted = 0 AND id ' . $sql, $params);
}
$remaining = [
    'courses' => $count('course', 'id', $courses),
    'groups' => $count('groups', 'courseid', $courses),
    'groupings' => $count('groupings', 'courseid', $courses),
    'enrolments' => $count('user_enrolments', 'userid', $users),
    'histories' => $count('local_groupimport_history', 'courseid', $courses),
    'activeUsers' => $active,
];
echo json_encode(['complete' => array_sum($remaining) === 0 && $unchanged,
    'remaining' => $remaining, 'ownedCourseIds' => array_values($courses),
    'ownedUsers' => count($users), 'course71Exists' => $DB->record_exists('course', ['id' => 71]),
    'course71GroupsUnchanged' => $unchanged, 'manifests' => $sources,
    'configuration' => ['runtime' => $CFG->wwwroot,
        'database' => $CFG->dbname, 'dataroot' => $CFG->dataroot,
        'installedPluginVersion' => get_config('local_groupimport', 'version'),
        'debug' => $CFG->debug, 'debugdisplay' => $CFG->debugdisplay,
        'cachejs' => $CFG->cachejs ?? true, 'cachetemplates' => $CFG->cachetemplates ?? true,
        'themedesignermode' => $CFG->themedesignermode ?? false],
], JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
