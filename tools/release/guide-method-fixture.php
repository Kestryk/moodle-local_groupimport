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
// Isolated presentation data: no Moodle session or database.

define('CLI_SCRIPT', true);
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
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function get_string($key, $component) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing string: ' . $key);
    }
    return $string[$key];
}
require(__DIR__ . '/../../classes/local/guide_discovery.php');
require(__DIR__ . '/../../classes/local/guide_specimen.php');
$manage = file_get_contents(__DIR__ . '/../../manage.php');
$marker = "        } else if (!empty(\$step['visualworkflow'])) {";
$start = strpos($manage, $marker);
$end = strpos($manage, '        } else if', $start + strlen($marker));
if ($start === false || $end === false) {
    throw new RuntimeException('Missing method presentation branch');
}
$slide = ['index' => 0, 'title' => $string['tutorialworkflowtitle'],
    'content' => '<p>' . htmlspecialchars($string['tutorialworkflowcontent'], ENT_QUOTES, 'UTF-8') . '</p>'];
$templatedata = $string;
require(\local_groupimport_fixture_source_file(substr($manage, $start + strlen($marker), $end - $start - strlen($marker))));
echo json_encode(['actionLessons' => [$slide]], JSON_THROW_ON_ERROR);
