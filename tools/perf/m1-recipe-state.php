<?php
// Supervised8051 QA configuration, with durable exact restoration. Never loads a principal DB.
function m1_recipe_validate(string $file): array {
    global $CFG, $DB;
    if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf' ||
            basename($file) !== 'm1-state.json' || !str_starts_with(str_replace('\\', '/', realpath(dirname($file))), 'C:/dev/artifacts/')) {
        throw new RuntimeException('External owned8051 M1 state required');
    }
    $fixture = dirname($file) . '/fixture-manifest.json';
    $f = json_decode(file_get_contents($fixture), true, 512, JSON_THROW_ON_ERROR);
    if (empty($f['courseId']) || $f['courseId'] <= 5 || !str_starts_with($f['shortname'] ?? '', 'eed-guide-write-')) {
        throw new RuntimeException('Manifested disposable course required');
    }
    return $f;
}
function m1_recipe_read_config(string $key) {
    global $DB;
    $r = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $key]);
    return $r ? $r->value : null;
}
function m1_recipe_store(string $file, array $value): void {
    if (file_put_contents($file, json_encode($value, JSON_PRETTY_PRINT), LOCK_EX) === false) {
        throw new RuntimeException('Cannot persist M1 restoration state');
    }
}
function m1_recipe_restore(string $file): array {
    global $DB;
    $f = m1_recipe_validate($file);
    $s = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    if (($s['runId'] ?? '') !== $f['runId'] || empty($s['userId']) || !is_siteadmin($s['userId'])) {
        throw new RuntimeException('M1 restore identity mismatch');
    }
    foreach ($s['config'] as $key => $value) {
        if (!in_array($key, ['motionlevel', 'respectsystemmotion'], true)) { throw new RuntimeException('Unexpected M1 key'); }
        if ($value === null) { unset_config($key, 'local_groupimport'); }
        else { set_config($key, $value, 'local_groupimport'); }
        if (m1_recipe_read_config($key) !== $value) { throw new RuntimeException('M1 config restore mismatch'); }
    }
    if ($s['preference'] === null) { unset_user_preference('easyedu_motion_level', $s['userId']); }
    else { set_user_preference('easyedu_motion_level', $s['preference'], $s['userId']); }
    $actual = $DB->get_record('user_preferences', ['userid' => $s['userId'], 'name' => 'easyedu_motion_level']);
    if (($actual ? $actual->value : null) !== $s['preference']) { throw new RuntimeException('M1 preference restore mismatch'); }
    $s['restored'] = true;
    m1_recipe_store($file, $s);
    return ['restored' => true, 'userId' => $s['userId'], 'configKeys' => array_keys($s['config'])];
}
if (defined('EASYEDU_M1_RECIPE_LIBRARY')) { return; }
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
$options = getopt('', ['state:', 'action:', 'userid:', 'level:']);
$file = $options['state'] ?? '';
$f = m1_recipe_validate($file);
$action = $options['action'] ?? '';
if ($action === 'begin') {
    if (file_exists($file)) { throw new RuntimeException('Fresh M1 state required'); }
    $id = (int)($options['userid'] ?? 0);
    $qa = $DB->get_record('user', ['id' => $id], '*', MUST_EXIST);
    if (!is_siteadmin($qa) || $qa->username !== getenv('EASYEDU_MOODLE_USERNAME') ||
            !$DB->record_exists('course', ['id' => $f['courseId'], 'shortname' => $f['shortname']])) {
        throw new RuntimeException('Connected supervised QA administrator and live fixture required');
    }
    $preference = $DB->get_record('user_preferences', ['userid' => $id, 'name' => 'easyedu_motion_level']);
    $s = ['runId' => $f['runId'], 'userId' => $id, 'preference' => $preference ? $preference->value : null,
        'config' => ['motionlevel' => m1_recipe_read_config('motionlevel'),
            'respectsystemmotion' => m1_recipe_read_config('respectsystemmotion')], 'restored' => false];
    m1_recipe_store($file, $s);
    echo json_encode(['saved' => true, 'userId' => $id]);
} else if ($action === 'restore') {
    echo json_encode(m1_recipe_restore($file));
} else {
    $s = json_decode(file_get_contents($file), true, 512, JSON_THROW_ON_ERROR);
    if ($s['runId'] !== $f['runId'] || $s['restored']) { throw new RuntimeException('Active owned M1 state required'); }
    if ($action === 'admin') {
        $level = $options['level'] ?? '';
        if (!in_array($level, ['full', 'reduced', 'minimal'], true)) { throw new RuntimeException('Invalid M1 level'); }
        set_config('motionlevel', $level, 'local_groupimport');
        // Future opt-in is not the default policy under test; preserve absence when absent.
        if ($s['config']['respectsystemmotion'] !== null) { set_config('respectsystemmotion', '0', 'local_groupimport'); }
    } else if ($action !== 'inspect') { throw new RuntimeException('Unknown M1 recipe action'); }
    $pref = $DB->get_record('user_preferences', ['userid' => $s['userId'], 'name' => 'easyedu_motion_level']);
    echo json_encode(['admin' => m1_recipe_read_config('motionlevel'), 'preference' => $pref ? $pref->value : null]);
}
