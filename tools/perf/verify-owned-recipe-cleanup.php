<?php
// Fresh read-only proof after each supervised recipe, including restoration beyond wrapper flags.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
$run = realpath($argv[1] ?? '');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf' || !$run ||
        !str_starts_with(str_replace('\\', '/', $run), 'C:/dev/artifacts/')) { throw new RuntimeException('Owned8051 run required'); }
$f = json_decode(file_get_contents($run . '/fixture-manifest.json'), true, 512, JSON_THROW_ON_ERROR);
if (($f['courseId'] ?? 0) <= 5 || !str_starts_with($f['shortname'] ?? '', 'eed-guide-write-') ||
        count($f['userIds'] ?? []) < 2 || count($f['userIds']) > 5) { throw new RuntimeException('Disposable fixture required'); }
$checks = ['courseAbsent' => !$DB->record_exists('course', ['id' => $f['courseId']])];
foreach ($f['userIds'] as $id) {
    $u = $DB->get_record('user', ['id' => $id], 'id,deleted', MUST_EXIST);
    $checks['deletedUser' . $id] = (bool)$u->deleted;
}
function recipe_read_config($key) {
    global $DB;
    $r = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $key]);
    return $r ? $r->value : null;
}
if (array_key_exists('qaCompleteViewBefore', $f)) { $checks['completeViewRestored'] = recipe_read_config('showcompleteview') === $f['qaCompleteViewBefore']; }
if (is_file($run . '/m1-state.json')) {
    $s = json_decode(file_get_contents($run . '/m1-state.json'), true, 512, JSON_THROW_ON_ERROR);
    if (($s['runId'] ?? '') !== $f['runId'] || empty($s['userId'])) { throw new RuntimeException('M1 state identity mismatch'); }
    foreach ($s['config'] as $key => $value) {
        if (!in_array($key, ['motionlevel', 'respectsystemmotion'], true)) { throw new RuntimeException('Unexpected saved M1 key'); }
        $checks[$key . 'Restored'] = recipe_read_config($key) === $value;
    }
    $r = $DB->get_record('user_preferences', ['userid' => $s['userId'], 'name' => 'easyedu_motion_level']);
    $checks['preferenceRestored'] = ($r ? $r->value : null) === $s['preference'];
    $checks['restoredStateRecorded'] = $s['restored'] === true;
}
$pass = !in_array(false, $checks, true);
echo json_encode(['readOnly' => true, 'pass' => $pass, 'course' => $f['courseId'], 'checks' => $checks], JSON_PRETTY_PRINT);
exit($pass ? 0 : 1);
