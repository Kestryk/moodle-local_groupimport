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
    'commonIntroduction' => \local_groupimport\local\guide_discovery::common_introduction(),
    'commonIntroductionTitle' => get_string('guideintro_title', 'local_groupimport'),
    'commonIntroductionDescription' => get_string('guideintro_description', 'local_groupimport'),
    'welcomeReset' => ['title' => get_string('guidewelcomereset', 'local_groupimport'),
        'description' => get_string('guidewelcomeresetconfirm', 'local_groupimport'),
        'confirm' => get_string('guidewelcomereset', 'local_groupimport'),
        'cancel' => ($argv[1] ?? 'en') === 'fr' ? 'Annuler' : 'Cancel'],
    'practicePath' => \local_groupimport\local\guide_discovery::practice_path()], JSON_THROW_ON_ERROR);
