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

/**
 * AP-E7: execute both actual functions against deterministic Moodle DML doubles.
 *
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
define('SQL_PARAMS_NAMED', 2);
$options = getopt('', ['before:', 'after:']);
$checks = [];
require_once(__DIR__ . '/doubles/verify_profile_chunks/global/fixture_verify_profile_chunks_profile_chunk_db.php');
class_alias('fixture_verify_profile_chunks_profile_chunk_db', 'profile_chunk_db');
/**
 * Perform isolated fixture operation local_groupimport_normalise_participant_label_value.
 * @param mixed $value Fixture argument.
 * @return mixed Fixture result.
 */
function local_groupimport_normalise_participant_label_value($value) {
    return trim(strip_tags($value));
}
foreach (['before', 'after'] as $variant) {
    $source = file_get_contents($options[$variant]);
    foreach (['local_groupimport_load_custom_user_field_values', 'local_groupimport_enrich_users_with_copy_fields'] as $name) {
        $start = strpos($source, 'function ' . $name . '(');
        $end = strpos($source, "\n}\n", $start) + 3;
        if ($start === false || $end < $start) {
            throw new RuntimeException('Function boundary missing.');
        }
        require(\local_groupimport_fixture_source_file(str_replace(
            'function ' . $name . '(',
            'function ' . $variant . '_' . $name . '(',
            substr($source, $start, $end - $start)
        )));
    }
}
foreach ([0, 1, 999, 1000, 1001, 3000, 10000] as $size) {
    $users = [];
    for ($i = 1; $i <= $size; $i++) {
        $users[$i] = ['username' => 'u-' . $i];
    }
    foreach (
        ['local_groupimport_load_custom_user_field_values' => ['profile_field_alpha', 'profile_field_beta'],
            'local_groupimport_enrich_users_with_copy_fields' =>
                ['username' => 'Username', 'profile_field_alpha' => 'Alpha', 'profile_field_beta' => 'Beta']] as $name => $fields
    ) {
        $DB = new profile_chunk_db();
        $before = ('before_' . $name)($users, $fields);
        $DB = new profile_chunk_db();
        $after = ('after_' . $name)($users, $fields);
        $checks[$size . ':' . $name] = $before === $after &&
            (!$DB->sizes || max($DB->sizes) <= 1000) && count($DB->sizes) === (int)ceil($size / 1000);
        if ($name === 'local_groupimport_load_custom_user_field_values') {
            $checks[$size . ':recordsets-closed'] = $DB->closed === count($DB->sizes);
        }
    }
}
echo json_encode(
    ['surface' => 'AP-E7-isolated-profile-chunks', 'passed' => !in_array(false, $checks, true),
    'checks' => $checks, 'scope' => 'Actual function bodies, deterministic DML doubles; not native SQL Server proof'],
    JSON_PRETTY_PRINT
) . "\n";
exit(in_array(false, $checks, true) ? 1 : 0);
