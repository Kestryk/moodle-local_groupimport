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
// Actual production list query against request-only in-memory SQLite, never Moodle/MariaDB.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../../tools/release/fixtures/source_file.php');
$root = dirname(__DIR__, 3);
$source = file_get_contents($root . '/index.php') . file_get_contents($root . '/importlib.php');
/**
 * Perform isolated fixture operation local_groupimport_history_table_exists.
 * @return mixed Fixture result.
 */
function local_groupimport_history_table_exists() {
    return $GLOBALS['historyexists'];
}
$tokens = token_get_all($source);
for ($i = 0; $i < count($tokens); $i++) {
    if (!is_array($tokens[$i]) || $tokens[$i][0] !== T_FUNCTION) {
        continue;
    }
    $name = '';for ($j = $i + 1; $j < count($tokens); $j++) {
        if (is_array($tokens[$j]) && $tokens[$j][0] === T_STRING) {
            $name = $tokens[$j][1];
            break;
        }if ($tokens[$j] === '(') {
            break;
        }
    }
    if ($name !== 'local_groupimport_get_import_history') {
        continue;
    }
    $code = '';
    $depth = 0;
    $started = false;
    for ($j = $i; $j < count($tokens); $j++) {
        $tok = $tokens[$j];
        $code .= is_array($tok) ? $tok[1] : $tok;
        if ($tok === '{') {
            $depth++;
            $started = true;
        }if ($tok === '}' && --$depth === 0 && $started) {
            break;
        }
    }
    require(\local_groupimport_fixture_source_file($code));
}
$checks = 0;
/**
 * Perform isolated fixture operation check.
 * @param mixed $ok Fixture argument.
 * @param mixed $label Fixture argument.
 * @return mixed Fixture result.
 */
function check($ok, $label) {
    $GLOBALS['checks']++;
    if (!$ok) {
        throw new RuntimeException($label);
    }
}
require_once(__DIR__ . '/doubles/r8_history_list_isolated/global/fixture_r8_history_list_isolated_anonymous_1.php');
$DB = new fixture_r8_history_list_isolated_anonymous_1();
$insert = $DB->pdo->prepare('INSERT INTO local_groupimport_history VALUES (?,?,?,?,?,?,?,?,?,?,?)');
$detail = json_encode(['large' => str_repeat('x', 512 * 1024)]);
$original = [];
for ($i = 1; $i <= 25; $i++) {
    $changes = $i % 3 === 0 ? null : ($i % 3 === 1 ? '' : $detail);
    $original[$i] = $changes;
    $insert->execute([$i, 5, 'Import ' . $i . '.csv', 1000 + $i, 3000, 2990, 10, $i % 2 ? 1234 : null, $changes, $detail, 'hash']);
}
$insert->execute([26, 6, 'foreign.csv', 9999, 1, 1, 0, null, $detail, $detail, 'foreign']);
$historyexists = false;
check(local_groupimport_get_import_history(5) === [] && $DB->calls === 0, 'missing table no query');
$historyexists = true;
$rows = local_groupimport_get_import_history(5);
check(count($rows) === 20 && array_keys($rows) === range(25, 6), 'newest 20 scoped to course');
foreach ($rows as $id => $r) {
    check(
        array_keys(get_object_vars($r)) === ['id',
         'filename',
         'timecreated',
         'rowcount',
         'successcount',
         'errorcount',
         'timerolledback',
         'haschanges'],
        'eight scalar columns only'
    );
    check((bool)$r->haschanges === !empty($original[$id]), 'null/empty/valid detail availability unchanged');
    check(
        $r->filename === 'Import ' . $id . '.csv' &&
         $r->rowcount === 3000 &&
         $r->errorcount === 10,
        'display metadata unchanged'
    );
}
check(strlen(serialize($rows)) < 10000, 'large payloads absent from list serialization');
check(count(local_groupimport_get_import_history(5, 3)) === 3, 'custom limit retained');
check(local_groupimport_get_import_history(999) === [], 'unknown course empty');
check(str_contains($source, '$restorable = !empty($record->haschanges);'), 'renderer uses computed bit');
check(str_contains($source, "\$history->changesjson"), 'restore still reads detail record');
check(str_contains($source, "'filehash' => \$filehash"), 'matching-import detail path preserved');
echo json_encode(['surface' =>
         'r8-history-list',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'rowsReturned' =>
         20,
         'projectedFields' =>
         8,
         'serializedBytes' =>
         strlen(serialize($rows)),
         'moodleConnections' =>
         0,
         'runtimeAccess' =>
         false]),
         "\n";
