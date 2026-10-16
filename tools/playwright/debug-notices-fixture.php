<?php
// This file is part of Moodle - http://moodle.org/
/**
 * Reversible developer-debug probe, exclusively for the isolated :8051 copy.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
$options = getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:']);
$expected = 'C:/dev/Moodle 51 Perf/moodle';
if (empty($options['manifest']) || empty($options['moodle-root']) ||
        str_replace('\\', '/', realpath($options['moodle-root'])) !== $expected) {
    throw new RuntimeException('Only the exact Perf Moodle root is authorised.');
}
require($expected . '/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051') {
    throw new RuntimeException('Only :8051 is authorised.');
}
$path = $options['manifest'];
$manifest = is_file($path) ? json_decode(file_get_contents($path), true, 512, JSON_THROW_ON_ERROR) : null;
if ($manifest && ($manifest['owner'] ?? '') !== 'codex1-debug-notices') {
    throw new RuntimeException('Foreign manifest.');
}
$write = static function() use ($path, &$manifest) {
    file_put_contents($path, json_encode($manifest, JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR));
};
if (($options['action'] ?? '') === 'cleanup') {
    $complete = true;
    foreach ($manifest['settings'] ?? [] as $name => $value) {
        if ($value === null) {
            unset_config($name);
        } else {
            set_config($name, $value);
        }
        $actual = $DB->get_record('config', ['name' => $name]);
        $complete = $complete && ($actual ? $actual->value : null) === $value;
    }
    if ($manifest) {
        $manifest['cleanup'] = ['complete' => $complete, 'debugSettingsRestored' => $complete];
        $write();
    }
    echo json_encode(['complete' => $complete]) . PHP_EOL;
    exit($complete ? 0 : 1);
}
if (($options['action'] ?? '') !== 'setup' || $manifest) {
    throw new RuntimeException('Fresh setup required.');
}
$manifest = ['owner' => 'codex1-debug-notices', 'settings' => [], 'probes' => []];
try {
    foreach (['debug' => DEBUG_DEVELOPER, 'debugdisplay' => 1, 'debug_developer_debugging_as_error' => 0] as $name => $value) {
        $record = $DB->get_record('config', ['name' => $name]);
        $manifest['settings'][$name] = $record ? $record->value : null;
        $write();
        set_config($name, $value);
    }
    $CFG->debug = DEBUG_DEVELOPER;
    $CFG->debugdeveloper = true;
    $CFG->debugdisplay = true;
    $CFG->debug_developer_debugging_as_error = false;
    \core\session\manager::set_user(get_admin());
    $capture = static function(callable $action): string {
        ob_start();
        try {
            $action();
            return ob_get_contents();
        } finally {
            ob_end_clean();
        }
    };
    // Exercise Moodle's real magic_get_url(), without modifying any product file.
    $legacy = $capture(static function() {
        $page = new moodle_page();
        $url = $page->url;
    });
    $guarded = $capture(static function() {
        $page = new moodle_page();
        if ($page->has_set_url()) {
            $url = $page->url;
        }
    });
    // Exercise the actual core 1024-character AMD argument warning and the current transport.
    $oversized = $capture(static function() {
        $page = new moodle_page();
        $page->requires->js_call_amd('local_groupimport/easyedu_guide', 'init', [str_repeat('x', 1025)]);
    });
    $transport = $capture(static function() {
        $page = new moodle_page();
        $page->requires->js_call_amd('local_groupimport/page_bootstrap', 'init', ['easystud-page-config']);
    });
    $manifest['probes'] = [
        'legacyUnsetUrlNotice' => strpos($legacy, 'did not call $PAGE->set_url') !== false,
        'guardedUnsetUrlNotices' => trim($guarded) === '' ? 0 : 1,
        'legacyLargeAmdNotice' => strpos($oversized, 'Too much data passed as arguments to js_call_amd') !== false,
        'jsonTransportNotices' => trim($transport) === '' ? 0 : 1,
    ];
    $write();
    if (!$manifest['probes']['legacyUnsetUrlNotice'] || !$manifest['probes']['legacyLargeAmdNotice'] ||
            $manifest['probes']['guardedUnsetUrlNotices'] || $manifest['probes']['jsonTransportNotices']) {
        throw new RuntimeException('Core developer-debug probes failed; cleanup is required.');
    }
    echo json_encode(['managerUrl' => $CFG->wwwroot . '/local/groupimport/manage.php?id=5']) . PHP_EOL;
} catch (\Throwable $error) {
    foreach ($manifest['settings'] as $name => $value) {
        if ($value === null) {
            unset_config($name);
        } else {
            set_config($name, $value);
        }
    }
    $manifest['setupFailure'] = $error->getMessage();
    $write();
    throw $error;
}
