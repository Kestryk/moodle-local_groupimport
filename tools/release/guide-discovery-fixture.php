<?php
// Isolated renderer input: no Moodle bootstrap, session or database.
define('MOODLE_INTERNAL', true);
require(__DIR__ . '/../../lang/' . (($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en') . '/local_groupimport.php');
function get_string($key, $component) {
    global $string;
    if (!isset($string[$key])) { throw new RuntimeException('Missing string: ' . $key); }
    return $string[$key];
}
function s($value) { return htmlspecialchars($value, ENT_QUOTES, 'UTF-8'); }
class html_writer {
    public static function tag($name, $value) { return '<' . $name . '>' . $value . '</' . $name . '>'; }
}
require(__DIR__ . '/../../classes/local/guide_discovery.php');
echo json_encode(['slides' => \local_groupimport\local\guide_discovery::prepend([]),
    'practicePath' => \local_groupimport\local\guide_discovery::practice_path()], JSON_THROW_ON_ERROR);
