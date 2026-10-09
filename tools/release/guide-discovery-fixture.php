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
$reference = [];
for ($index = 0; $index < 20; $index++) {
    $reference[] = ['id' => $index === 2 ? 'use-this-guide' : 'reference-' . $index,
        'target' => 'retained-native-target-' . $index];
}
$historicalslides = \local_groupimport\local\guide_discovery::prepend($reference);
$cardlessons = [];
foreach (['participant', 'group', 'grouping'] as $type) {
    $cardlessons[] = ['type' => $type,
        'title' => get_string('tutorial' . $type . 'cardtitle', 'local_groupimport'),
        'description' => get_string('tutorial' . $type . 'cardcontent', 'local_groupimport'),
        'commonintroduction' => \local_groupimport\local\guide_discovery::card_explanation($type)];
}
echo json_encode(['slides' => \local_groupimport\local\guide_discovery::prepend([]),
    'actionLessons' => array_map(static function($type) {
        return ['id' => 'explanation-' . $type, 'type' => $type,
            'commonintroduction' => \local_groupimport\local\guide_discovery::action_explanation($type)];
    }, ['filters', 'identifiers', 'destination']),
    'welcomeCopy' => get_string('guidewelcomecopy', 'local_groupimport'),
    'cardLessons' => $cardlessons,
    'commonIntroduction' => \local_groupimport\local\guide_discovery::common_introduction(),
    'commonIntroductionSpecimens' => \local_groupimport\local\guide_discovery::common_introduction(true),
    'readingContract' => \local_groupimport\local\guide_discovery::reading_contract(),
    'historicalSlides' => $historicalslides,
    'readingSlides' => \local_groupimport\local\guide_discovery::introduction_first($historicalslides),
    'commonIntroductionTitle' => get_string('guideintro_title', 'local_groupimport'),
    'commonIntroductionDescription' => get_string('guideintro_description', 'local_groupimport'),
    'welcomeReset' => ['title' => get_string('guidewelcomereset', 'local_groupimport'),
        'description' => get_string('guidewelcomeresetconfirm', 'local_groupimport'),
        'confirm' => get_string('guidewelcomereset', 'local_groupimport'),
        'cancel' => ($argv[1] ?? 'en') === 'fr' ? 'Annuler' : 'Cancel'],
    'practicePath' => \local_groupimport\local\guide_discovery::practice_path()], JSON_THROW_ON_ERROR);
