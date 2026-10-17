<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.
// Isolated renderer input: no Moodle bootstrap, session or database.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../tools/release/fixtures/source_file.php');
require(__DIR__ . '/../../lang/' . (($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en') . '/local_groupimport.php');
/**
 * Perform isolated fixture operation get_string.
 * @param mixed $key Fixture argument.
 * @param mixed $component Fixture argument.
 * @return mixed Fixture result.
 */
function get_string($key, $component) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing string: ' . $key);
    }
    return $string[$key];
}
/**
 * Perform isolated fixture operation s.
 * @param mixed $value Fixture argument.
 * @return mixed Fixture result.
 */
function s($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
require_once(__DIR__ . '/doubles/guide_discovery_fixture/global/fixture_guide_discovery_fixture_html_writer.php');
class_alias('fixture_guide_discovery_fixture_html_writer', 'html_writer');
require(__DIR__ . '/../../classes/local/guide_discovery.php');
require(__DIR__ . '/../../classes/local/guide_specimen.php');
$reference = [];
for ($index = 0; $index < 20; $index++) {
    $reference[] = ['id' => $index === 2 ? 'use-this-guide' : 'reference-' . $index,
        'target' => 'retained-native-target-' . $index];
}
$historicalslides = \local_groupimport\local\guide_discovery::prepend($reference);
$cardlessons = [];
$manage = file_get_contents(__DIR__ . '/../../manage.php');
$start = strpos($manage, '            // Illustration-only successor:');
$end = strpos($manage, '        } else if (!empty($step[\'visualfirststructure\']))', $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing production card illustration adapter.');
}
$inspectionadapter = substr($manage, $start, $end - $start);
foreach (['participant', 'group', 'grouping'] as $type) {
    $slide = ['type' => $type,
        'title' => get_string('tutorial' . $type . 'cardtitle', 'local_groupimport'),
        'description' => get_string('tutorial' . $type . 'cardcontent', 'local_groupimport'),
        'commonintroduction' => \local_groupimport\local\guide_discovery::card_explanation($type),
        'visualcarddetail' => ['retainedStaticFixture' => true]];
    $cardtype = $type;
    // Execute only the exact bounded presentation branch; never bootstrap manage.php.
    require(\local_groupimport_fixture_source_file($inspectionadapter));
    $cardlessons[] = $slide;
}
$cardlessonsbytype = array_column($cardlessons, null, 'type');
echo json_encode(['slides' => \local_groupimport\local\guide_discovery::prepend([]),
    'inspectionScenes' => [
        'group' => $cardlessonsbytype['group']['discoveryscene'],
        'grouping' => $cardlessonsbytype['grouping']['discoveryscene'],
    ],
    'actionLessons' => array_map(static function ($type) {
        return ['id' => 'explanation-' . $type, 'type' => $type,
            'commonintroduction' => \local_groupimport\local\guide_discovery::action_explanation($type)];
    }, ['filters', 'identifiers', 'destination', 'menu', 'activity', 'ready']),
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
