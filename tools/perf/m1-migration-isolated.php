<?php
// Executes the actual served upgrade function with in-memory config only. No Moodle config/DB.
$source = $argv[1] ?? '';
if (!is_file($source) || basename($source) !== 'upgrade.php') { throw new RuntimeException('Explicit upgrade source required'); }
$code = file_get_contents($source);
preg_match_all('/if\s*\(\$oldversion\s*<\s*(\d+)\)\s*\{/', $code, $matches, PREG_OFFSET_CAPTURE);
$version = null;
foreach ($matches[0] as $index => [$head, $offset]) {
    $tokens = token_get_all('<?php ' . substr($code, $offset + strlen($head)));
    $depth = 1; $body = '';
    foreach ($tokens as $token) {
        if (is_array($token) && $token[0] === T_OPEN_TAG) { continue; }
        if ($token === '{') { $depth++; }
        if ($token === '}' && --$depth === 0) { break; }
        $body .= is_array($token) ? $token[1] : $token;
    }
    if (str_contains($body, 'enableanimations') && str_contains($body, 'motionlevel')) {
        if ($version !== null) { throw new RuntimeException('Ambiguous motion migration blocks; review exact source'); }
        $version = (int)$matches[1][$index][0];
    }
}
if ($version === null) { throw new RuntimeException('M1 migration not published'); }
define('MOODLE_INTERNAL', true);
final class m1_no_database {
    public function __call($name, $arguments) { throw new RuntimeException('Unexpected database access in isolated upgrade: ' . $name); }
}
$DB = new m1_no_database();
$memory = []; $savepoints = [];
function get_config($plugin, $name) {
    global $memory;
    if ($plugin !== 'local_groupimport') { throw new RuntimeException('Unexpected plugin read'); }
    return $memory[$name] ?? false;
}
function set_config($name, $value, $plugin) {
    global $memory;
    if ($plugin !== 'local_groupimport' || !in_array($name, ['motionlevel', 'enableanimations'], true)) { throw new RuntimeException('Unexpected config write'); }
    $memory[$name] = (string)$value; return true;
}
function unset_config($name, $plugin) {
    global $memory;
    if ($plugin !== 'local_groupimport' || $name !== 'enableanimations') { throw new RuntimeException('Unexpected config deletion'); }
    unset($memory[$name]); return true;
}
function upgrade_plugin_savepoint($result, $version, $type, $plugin) {
    global $savepoints;
    if (!$result || $type !== 'local' || $plugin !== 'groupimport') { throw new RuntimeException('Unexpected savepoint'); }
    $savepoints[] = $version;
}
require($source);
$rows = [];
foreach ([['0', 'minimal'], ['1', 'full'], [null, 'full']] as [$legacy, $expected]) {
    $memory = $legacy === null ? [] : ['enableanimations' => $legacy]; $savepoints = [];
    $result = xmldb_local_groupimport_upgrade($version - 1);
    $actual = $memory['motionlevel'] ?? null;
    if (!$result || $actual !== $expected || !in_array($version, $savepoints, true)) { throw new RuntimeException('Served M1 migration failed'); }
    $rows[] = ['legacy' => $legacy, 'expected' => $expected, 'actual' => $actual, 'pass' => true];
}
echo json_encode(['scope' => 'actual upgrade function, isolated config service doubles, no database',
    'sourceHash' => hash_file('sha256', $source), 'version' => $version, 'rows' => $rows], JSON_PRETTY_PRINT);
