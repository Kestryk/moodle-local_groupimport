<?php
/** Copy-only temporary rendering-mode setting, exact restoration. PHP8.1/Moodle4.5. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$options = getopt('', ['moodle-root:', 'state:', 'action:', 'mode:']);
$root = realpath($options['moodle-root'] ?? '');
if (!$root || !is_file($root . '/config.php') || empty($options['state'])) { throw new RuntimeException('Explicit copy root/state required.'); }
define('CLI_SCRIPT', true);
require($root . '/config.php');
require_once(__DIR__ . '/lib.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') { throw new RuntimeException('Perf copy only.'); }
$path = $options['state'];
$action = $options['action'] ?? 'inspect';
$current = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => 'renderingmode']);
$state = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : null;
if ($action === 'set') {
    $mode = $options['mode'] ?? '';
    if (!in_array($mode, ['legacy', 'reactive'], true)) { throw new RuntimeException('Unknown rendering mode.'); }
    if (!$state) { $state = ['copy' => $CFG->wwwroot, 'database' => $CFG->dbname,
        'previousExists' => (bool)$current, 'previousValue' => $current ? $current->value : null,
        'applied' => null, 'restored' => false]; }
    if ($state['copy'] !== $CFG->wwwroot || $state['database'] !== $CFG->dbname || $state['restored']) {
        throw new RuntimeException('State ownership/restore conflict.');
    }
    $state['applied'] = $mode;
    easystud_perf_write($path, $state); // Persist restoration intent before write.
    set_config('renderingmode', $mode, 'local_groupimport');
} else if ($action === 'restore' && $state && !$state['restored']) {
    if ($state['copy'] !== $CFG->wwwroot || $state['database'] !== $CFG->dbname ||
            ($current ? $current->value : null) !== $state['applied']) { throw new RuntimeException('Setting changed outside this run; preserve state.'); }
    if ($state['previousExists']) { set_config('renderingmode', $state['previousValue'], 'local_groupimport'); }
    else { unset_config('renderingmode', 'local_groupimport'); }
    $state['restored'] = true;
    easystud_perf_write($path, $state);
} else if (!in_array($action, ['inspect', 'restore'], true)) { throw new RuntimeException('Unknown action.'); }
echo json_encode(['mode' => get_config('local_groupimport', 'renderingmode'),
    'version' => get_config('local_groupimport', 'version'), 'state' => $state], JSON_THROW_ON_ERROR) . "\n";
