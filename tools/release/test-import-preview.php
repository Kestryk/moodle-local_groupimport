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

// Isolated transport tests: no Moodle/database/session fixture writes.
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/doubles/test_import_preview/global/fixture_test_import_preview_moodle_exception.php');
class_alias('fixture_test_import_preview_moodle_exception', 'moodle_exception');
require(__DIR__ . '/../../classes/local/import_preview.php');
use local_groupimport\local\import_preview;
$checks = 0;
$check = function ($condition) use (&$checks) {
    if (!$condition) {
        throw new RuntimeException('Check ' . ($checks + 1) . ' failed');
    }
    $checks++;
};
$reject = function ($callback) use ($check) {
    try {
        $callback();
    } catch (moodle_exception $exception) {
        $check(true);
        return;
    }
    $check(false);
};
$SESSION = new stdClass();
$rows = [];
for ($i = 0; $i < 1500; $i++) {
    $rows[] = ['line' => $i + 2, 'identifier' => 'person' . $i, 'groupname' => 'A', 'groupingname' => ''];
}
$preview = ['rows' => $rows, 'filename' => 'test.csv', 'filehash' => 'hash'];
$token = import_preview::store(5, $preview);
$check(import_preview::load(5, $token) === $preview);
$reject(fn() => import_preview::load(6, $token));
$reject(fn() => import_preview::load(5, 'foreign'));
$data = ['count' => 1500, 'edits' => [['index' => 1499, 'identifier' => 'édition@example.invalid',
    'groupname' => 'Edited < & "', 'groupingname' => 'B']], 'excluded' => [0, 12]];
$result = import_preview::confirm($preview, json_encode($data), []);
$check(count($result) === 1498 && $result[1497]['groupname'] === 'Edited < & "');
$check($result[0]['identifier'] === 'person1');
foreach (
    ['{', '{}', json_encode(array_replace($data, ['count' => 1499])),
        json_encode(array_replace($data, ['excluded' => [0, 0]])),
        json_encode(array_replace($data, ['excluded' => [-1]])),
        json_encode(array_replace($data, ['edits' => [['index' => 1500]]]))] as $bad
) {
    $reject(fn() => import_preview::confirm($preview, $bad, []));
}
$fallback = ['complete' => 1500, 'enabled' => array_fill(0, 1500, 1),
    'identifier' => array_column($rows, 'identifier'), 'groupname' => array_column($rows, 'groupname'),
    'groupingname' => array_column($rows, 'groupingname')];
$fallback['groupname'][1499] = 'No JS edit';
unset($fallback['enabled'][1]);
$result = import_preview::confirm($preview, '', $fallback);
$check(count($result) === 1499 && $result[1498]['groupname'] === 'No JS edit');
$truncated = $fallback;
unset($truncated['complete']);
$reject(fn() => import_preview::confirm($preview, '', $truncated));
$truncated = $fallback;
array_pop($truncated['groupname']);
$reject(fn() => import_preview::confirm($preview, '', $truncated));
import_preview::consume($token);
$reject(fn() => import_preview::load(5, $token));
$token = import_preview::store(5, $preview);
$SESSION->local_groupimport_previews[$token]['created'] = time() - 3601;
$reject(fn() => import_preview::load(5, $token));
$reject(fn() => import_preview::store(5, ['rows' => array_fill(0, 5001, $rows[0])]));
echo json_encode(['passed' => true, 'checks' => $checks, 'largeEditedPreview' => 1500]) . PHP_EOL;
