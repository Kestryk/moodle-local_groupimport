<?php
// Local-supervised SM-28 only. Changes two plugin configuration values and restores them exactly.
define('CLI_SCRIPT', true);

$options = getopt('', ['moodle-root:', 'action:', 'manifest:', 'run-id:']);
foreach (['moodle-root', 'action', 'manifest'] as $key) {
    if (empty($options[$key])) {
        fwrite(STDERR, "Required options: --moodle-root --action --manifest [--run-id].\n");
        exit(2);
    }
}
$moodleroot = realpath($options['moodle-root']);
if (!$moodleroot || !is_file($moodleroot . '/config.php')) {
    throw new RuntimeException('Invalid Moodle root.');
}
require($moodleroot . '/config.php');
if (!in_array(parse_url($CFG->wwwroot, PHP_URL_HOST), ['localhost', '127.0.0.1', '::1'], true)) {
    throw new RuntimeException('This fixture is restricted to localhost.');
}
$manifestpath = $options['manifest'];
if (!is_dir(dirname($manifestpath)) || !is_writable(dirname($manifestpath))) {
    throw new RuntimeException('External manifest directory must already exist and be writable.');
}

/** Write the exact configuration ownership record outside Git. */
function workspace_preferences_manifest(string $path, array $manifest): void {
    $json = json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR) . "\n";
    if (file_put_contents($path, $json, LOCK_EX) === false) {
        throw new RuntimeException('Cannot persist fixture ownership manifest.');
    }
}

/** Read a raw plugin configuration value without losing missing-value state. */
function workspace_preferences_read(string $name): array {
    global $DB;
    $record = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $name]);
    return ['exists' => (bool)$record, 'value' => $record ? (string)$record->value : null];
}

/** Restore both owned configuration records after verifying fixture ownership. */
function workspace_preferences_cleanup(array $manifest): array {
    if (($manifest['fixture'] ?? '') !== 'easystud-sm28-workspace-preferences' ||
            empty($manifest['previous']) || !isset($manifest['applied'])) {
        throw new RuntimeException('Unknown fixture manifest; cleanup refused.');
    }
    foreach ($manifest['applied'] as $name => $expected) {
        $current = workspace_preferences_read($name);
        if (!$current['exists'] || $current['value'] !== (string)$expected) {
            throw new RuntimeException('Owned configuration changed during the fixture; cleanup refused.');
        }
    }
    foreach ($manifest['previous'] as $name => $previous) {
        if ($previous['exists']) {
            set_config($name, $previous['value'], 'local_groupimport');
        } else {
            unset_config($name, 'local_groupimport');
        }
    }
    $restored = [];
    foreach (array_keys($manifest['previous']) as $name) {
        $restored[$name] = workspace_preferences_read($name);
    }
    $complete = $restored === $manifest['previous'];
    return ['complete' => $complete, 'restored' => $restored];
}

if ($options['action'] === 'cleanup') {
    if (!is_file($manifestpath)) {
        echo json_encode(['complete' => true, 'reason' => 'no-manifest']) . "\n";
        exit(0);
    }
    $manifest = json_decode(file_get_contents($manifestpath), true, 512, JSON_THROW_ON_ERROR);
    $cleanup = workspace_preferences_cleanup($manifest);
    $manifest['cleanup'] = $cleanup;
    workspace_preferences_manifest($manifestpath, $manifest);
    echo json_encode($cleanup, JSON_UNESCAPED_SLASHES) . "\n";
    exit($cleanup['complete'] ? 0 : 1);
}
if ($options['action'] !== 'setup' || empty($options['run-id']) ||
        !preg_match('/^[A-Za-z0-9-]+$/', $options['run-id']) || is_file($manifestpath)) {
    throw new RuntimeException('Setup needs a unique safe run-id and a new manifest.');
}

$names = ['showcompleteview', 'defaultlayoutmode'];
$manifest = [
    'schemaVersion' => 1,
    'fixture' => 'easystud-sm28-workspace-preferences',
    'runId' => $options['run-id'],
    'previous' => [],
    'applied' => [],
    'managerUrl' => $CFG->wwwroot . '/local/groupimport/manage.php?id=5',
];
foreach ($names as $name) {
    $manifest['previous'][$name] = workspace_preferences_read($name);
}
workspace_preferences_manifest($manifestpath, $manifest);
try {
    set_config('showcompleteview', 0, 'local_groupimport');
    $manifest['applied']['showcompleteview'] = '0';
    workspace_preferences_manifest($manifestpath, $manifest);
    set_config('defaultlayoutmode', 'structure', 'local_groupimport');
    $manifest['applied']['defaultlayoutmode'] = 'structure';
    workspace_preferences_manifest($manifestpath, $manifest);
    echo json_encode($manifest, JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $exception) {
    $cleanup = workspace_preferences_cleanup($manifest);
    if (!$cleanup['complete']) {
        throw new RuntimeException('Setup failed and configuration cleanup is incomplete.', 0, $exception);
    }
    throw $exception;
}
