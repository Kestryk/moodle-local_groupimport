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
// Complete production Guide presentation, without Moodle bootstrap, session or database.

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
$language = ($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en';
require(__DIR__ . '/../../lang/' . $language . '/local_groupimport.php');
/**
 * Perform isolated fixture operation get_string.
 * @param mixed $key Fixture argument.
 * @param mixed $component Fixture argument.
 * @param mixed $a Fixture argument.
 * @return mixed Fixture result.
 */
function get_string($key, $component, $a = null) {
    global $string, $language;
    if ($component === 'core' && $key === 'closebuttontitle') {
        return $language === 'fr' ? 'Fermer' : 'Close';
    }
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing public Guide string: ' . $key);
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
require_once(__DIR__ . '/doubles/guide_current_curriculum_fixture/global/fixture_guide_current_curriculum_fixture_html_writer.php');
class_alias('fixture_guide_current_curriculum_fixture_html_writer', 'html_writer');
require(__DIR__ . '/../../classes/local/guide_discovery.php');
require(__DIR__ . '/../../classes/local/guide_specimen.php');
$source = file_get_contents(__DIR__ . '/../../manage.php');
$templatedata = $string;
preg_match_all(
    "/^\s+'(tutorial[^']+)' => get_string\('([^']+)', 'local_groupimport'\),?$/m",
    $source,
    $aliases,
    PREG_SET_ORDER
);
foreach ($aliases as $alias) {
    $templatedata[$alias[1]] = get_string($alias[2], 'local_groupimport');
}
$start = strpos($source, "        'tutorialsteps' => [");
$end = strpos($source, "        'selectionmodelabel' =>", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing actual tutorial definition boundary');
}
$array = substr(
    $source,
    $start + strlen("        'tutorialsteps' => "),
    $end - $start - strlen("        'tutorialsteps' => ")
);
// Only the existing literal steps array is evaluated; never bootstrap manage.php.
$templatedata['tutorialsteps'] = require(\local_groupimport_fixture_source_file('return ' . rtrim($array, ", \r\n\t") . ';'));
foreach (['local_groupimport_build_easyedu_guide_template_data'] as $name) {
    $start = strpos($source, 'function ' . $name . '(');
    if ($start === false) {
        throw new RuntimeException('Missing actual Guide adapter: ' . $name);
    }
    $tokens = token_get_all('<?php ' . substr($source, $start));
    $body = '';
    $depth = 0;
    $opened = false;
    foreach ($tokens as $token) {
        if (is_array($token) && $token[0] === T_OPEN_TAG) {
            continue;
        }
        $text = is_array($token) ? $token[1] : $token;
        $body .= $text;
        if (
            $text === '{' || (is_array($token) && in_array(
                $token[0],
                [T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES],
                true
            ))
        ) {
            $depth++;
            $opened = true;
        } else if ($text === '}') {
            $depth--;
            if ($opened && $depth === 0) {
                break;
            }
        }
    }
    if (!$opened || $depth !== 0) {
        throw new RuntimeException('Unbounded Guide function extraction');
    }
    require(\local_groupimport_fixture_source_file($body));
}
$start = strpos($source, "        'paths' => [");
$end = strpos($source, "        'labels' => [", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing actual Guide path definition boundary');
}
$array = substr(
    $source,
    $start + strlen("        'paths' => "),
    $end - $start - strlen("        'paths' => ")
);
$paths = require(\local_groupimport_fixture_source_file('return ' . rtrim($array, ", \r\n\t") . ';'));
$data = local_groupimport_build_easyedu_guide_template_data($templatedata);
$moderncontract = \local_groupimport\local\guide_discovery::modern_reading_contract();
$active = array_column($data['slides'], 'id') === $moderncontract['slideIds'];
echo json_encode(
    ['language' => $language,
    'templateData' => $data,
    'readingContract' => $active ? $moderncontract : \local_groupimport\local\guide_discovery::reading_contract(),
    'paths' => $paths,
    'modernCandidate' => [
        'slides' => $active ? $data['slides'] : \local_groupimport\local\guide_discovery::modern_curriculum($data['slides']),
        'readingContract' => $moderncontract,
        'nativeActivated' => $active,
    ],
    'scope' => 'Pure presentation and path definitions; native welcome/configuration availability not evaluated'],
    JSON_THROW_ON_ERROR
);
