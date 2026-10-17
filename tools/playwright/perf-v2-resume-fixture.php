<?php
// Resume the exact owned fixture left by the interrupted performance run.
$resumeoptions = getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:']);
if (($resumeoptions['action'] ?? '') === 'cleanup') {
    require(__DIR__ . '/perf-v2-fixture.php');
    exit;
}
define('CLI_SCRIPT', true);
require($resumeoptions['moodle-root'] . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$previous = 'C:/dev/Moodle 51 Perf/moodle/local/perf-v2-20261017/easystud/authenticated/' .
    'easystud-authenticated-20261017T043915575Z-43456/fixture-manifest.json';
$manifest = json_decode(file_get_contents($previous), true, 512, JSON_THROW_ON_ERROR);
if ($manifest['owner'] !== 'codex2-perf-v2' || !$manifest['complete'] ||
        count($manifest['userIds']) !== 3000 || isset($manifest['cleanup'])) {
    throw new RuntimeException('Previous fixture is not available for adoption');
}
foreach ($manifest['courseIds'] as $id) {
    $course = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);
    if ($id <= 71 || !in_array($course->shortname, array_map(
            static fn($suffix) => $manifest['identity'] . '-' . $suffix, ['large', 'small', 'medium']), true)) {
        throw new RuntimeException('Foreign course');
    }
}
foreach ($manifest['userIds'] as $id) {
    if (!$DB->record_exists('user', ['id' => $id, 'deleted' => 0,
            'auth' => 'nologin', 'idnumber' => $manifest['identity']])) {
        throw new RuntimeException('Fixture user missing or foreign');
    }
}
if (is_file($resumeoptions['manifest'])) {
    throw new RuntimeException('Fresh destination manifest required');
}
$manifest['adoptedFrom'] = $previous;
file_put_contents($resumeoptions['manifest'], json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode(['complete' => true, 'managerUrl' => $CFG->wwwroot .
    '/local/groupimport/manage.php?id=' . $manifest['smallCourseId']]);
