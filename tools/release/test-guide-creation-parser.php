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
// Execute only the existing pure quick-create parser functions; no Moodle bootstrap.

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

require_once(__DIR__ . '/../../tools/release/fixtures/source_file.php');
require_once(__DIR__ . '/fixtures/doubles/security_s4_isolated/global/fixture_security_s4_isolated_core_text.php');
class_alias('fixture_security_s4_isolated_core_text', 'core_text');
require_once(__DIR__ . '/fixtures/doubles/security_s4_isolated/global/fixture_security_s4_isolated_moodle_exception.php');
class_alias('fixture_security_s4_isolated_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/../../classes/local/ajax_security.php');
require_once(__DIR__ . '/../../classes/local/create_names.php');
$source = file_get_contents(__DIR__ . '/../../ajax.php');
$start = strpos($source, 'function local_groupimport_extract_create_names(');
if ($start === false) {
    throw new RuntimeException('Missing creation parser');
}
require(\local_groupimport_fixture_source_file(substr($source, $start)));
$cases = [
    ['Assignment #*4', ['Assignment 1', 'Assignment 2', 'Assignment 3', 'Assignment 4']],
    ['Workshop @*3', ['Workshop A', 'Workshop B', 'Workshop C']],
    ["One, Two; Three\nFour", ['One', 'Two', 'Three', 'Four']],
    ['One,One', ['One']],
    ['Workshop @*27', array_map(static function ($index) {
        return 'Workshop ' . local_groupimport_number_to_letters($index);
    }, range(1, 27))],
];
foreach ($cases as [$input, $expected]) {
    if (local_groupimport_extract_create_names($input) !== $expected) {
        throw new RuntimeException('Quick-create example mismatch');
    }
}
echo "PASS five actual pure-parser examples, including separators, deduplication and letter rollover; no course writes.\n";
