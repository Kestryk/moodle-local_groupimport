<?php
// Share one disposable fixture across the three independently supervised phases.
$sharedoptions = getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:']);
if ($sharedoptions['action'] === 'cleanup') {
    echo json_encode(['complete' => true, 'deferredToOuterSupervisor' => true]);
    exit;
}
define('CLI_SCRIPT', true);
require($sharedoptions['moodle-root'] . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
$shared = 'C:/dev/Moodle 51 Perf/moodle/local/perf-v2-config-20261017/shared-fixture-recovery.json';
$m = json_decode(file_get_contents($shared), true, 512, JSON_THROW_ON_ERROR);
if ($m['owner'] !== 'codex2-perf-v2' || !$m['complete'] || isset($m['cleanup'])) {
    throw new RuntimeException('Invalid shared fixture');
}
foreach ($m['courseIds'] as $id) {
    $c = $DB->get_record('course', ['id' => $id], '*', MUST_EXIST);
    if ($id <= 71 || strpos($c->shortname, $m['identity'] . '-') !== 0) {
        throw new RuntimeException('Foreign fixture course');
    }
}
if (is_file($sharedoptions['manifest'])) {
    throw new RuntimeException('Fresh wrapper manifest required');
}
file_put_contents($sharedoptions['manifest'], json_encode($m, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
echo json_encode(['complete' => true, 'managerUrl' => $CFG->wwwroot .
    '/local/groupimport/manage.php?id=' . $m['smallCourseId']]);
