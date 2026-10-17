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

/**
 * Standalone CLI test fixture and release validation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Isolated language/count-template adapter. No Moodle bootstrap or database.
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$lang = $argv[1];
/**
 * Execute isolated fixture operation current_language.
 * @return mixed Fixture result.
 */
function current_language() {
    global $lang;
    return $lang;
}
/**
 * Execute isolated fixture operation get_string_manager.
 * @return mixed Fixture result.
 */
function get_string_manager() {
    return new class {
        /**
         * Execute isolated fixture operation string_exists.
         * @param mixed $key Fixture input.
         * @param mixed $component Fixture input.
         * @return mixed Fixture result.
         */
        public function string_exists($key, $component) {
            global $string;
            return isset($string[$key]);
        }
    };
}
/**
 * Execute isolated fixture operation get_string.
 * @param mixed $key Fixture input.
 * @param mixed $component Fixture input.
 * @param mixed $a Fixture input.
 * @return mixed Fixture result.
 */
function get_string($key, $component, $a = null) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing count string: ' . $key);
    }
    return str_replace('{$a}', (string)$a, $string[$key]);
}
require(__DIR__ . '/../../../lang/' . $lang . '/local_groupimport.php');
require(__DIR__ . '/../../../lib.php');
echo json_encode(['template' => local_groupimport_count_template('groupmembersshowall'),
    'native' => array_map(static function ($n) {
        return local_groupimport_count_string('groupmembersshowall', $n);
    }, [0, 1, 2, 23])], JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
