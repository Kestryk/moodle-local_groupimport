<?php
/** Prepare one QA account's Guide preference on the dedicated Perf copy only. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['moodle-root:', 'state:', 'action:']);
$root = realpath($options['moodle-root'] ?? '');
$statepath = $options['state'] ?? '';
if (!$root || !$statepath || !is_file($root . '/config.php')) {
    throw new RuntimeException('Explicit Perf root and external state path required.');
}
define('CLI_SCRIPT', true);
require $root . '/config.php';
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Dedicated Perf copy required.');
}
$key = \local_groupimport\local\guide_welcome::PREFERENCE;
$action = $options['action'] ?? 'prepare';
$state = is_file($statepath) ? json_decode(file_get_contents($statepath), true, 512, JSON_THROW_ON_ERROR) : null;
if ($action === 'prepare') {
    $username = getenv('EASYEDU_MOODLE_USERNAME');
    if (!$username) { throw new RuntimeException('QA username must be loaded in process environment.'); }
    $user = $DB->get_record('user', ['username' => strtolower($username), 'deleted' => 0], 'id', MUST_EXIST);
    $generation = \local_groupimport\local\guide_welcome::generation();
    if (!$state) {
        $previous = $DB->get_record('user_preferences', ['userid' => $user->id, 'name' => $key]);
        $state = ['copy' => $CFG->wwwroot, 'userid' => (int)$user->id,
            'previousExists' => (bool)$previous, 'previousValue' => $previous ? $previous->value : null,
            'applied' => $generation, 'restored' => false];
        file_put_contents($statepath, json_encode($state, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
    }
    if ($state['copy'] !== $CFG->wwwroot || $state['userid'] !== (int)$user->id || $state['restored']) {
        throw new RuntimeException('QA preference state ownership conflict.');
    }
    set_user_preference($key, $generation, $user->id);
} else if ($action === 'restore' && $state && !$state['restored']) {
    if ($state['copy'] !== $CFG->wwwroot ||
            (string)get_user_preferences($key, '', $state['userid']) !== $state['applied']) {
        throw new RuntimeException('QA preference changed outside this run.');
    }
    if ($state['previousExists']) {
        set_user_preference($key, $state['previousValue'], $state['userid']);
    } else {
        unset_user_preference($key, $state['userid']);
    }
    $state['restored'] = true;
    file_put_contents($statepath, json_encode($state, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
} else { throw new RuntimeException('Unknown action or absent preparation state.'); }
echo json_encode(['action' => $action, 'restored' => $state['restored']], JSON_THROW_ON_ERROR) . "\n";
