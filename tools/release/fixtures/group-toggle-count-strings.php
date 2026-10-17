<?php
// Isolated language/count-template adapter. No Moodle bootstrap or database.
define('MOODLE_INTERNAL', true);
$lang = $argv[1];
function current_language() { global $lang; return $lang; }
function get_string_manager() { return new class {
    public function string_exists($key, $component) { global $string; return isset($string[$key]); }
}; }
function get_string($key, $component, $a = null) {
    global $string;
    if (!isset($string[$key])) { throw new RuntimeException('Missing count string: ' . $key); }
    return str_replace('{$a}', (string)$a, $string[$key]);
}
require(__DIR__ . '/../../../lang/' . $lang . '/local_groupimport.php');
require(__DIR__ . '/../../../lib.php');
echo json_encode(['template' => local_groupimport_count_template('groupmembersshowall'),
    'native' => array_map(static function ($n) { return local_groupimport_count_string('groupmembersshowall', $n); }, [0, 1, 2, 23])], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
