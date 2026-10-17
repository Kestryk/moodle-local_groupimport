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
// Isolated fatal-failure ordering test; fake DB, no Moodle records/configuration.

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

require_once(__DIR__ . '/doubles/test_import_execution/global/fixture_test_import_execution_moodle_exception.php');
class_alias('fixture_test_import_execution_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/doubles/test_import_execution/global/fixture_test_import_execution_core_php_time_limit.php');
class_alias('fixture_test_import_execution_core_php_time_limit', 'core_php_time_limit');
require(__DIR__ . '/../../classes/local/import_execution.php');
use local_groupimport\local\import_execution;
$events = [];
require_once(__DIR__ . '/doubles/test_import_execution/global/fixture_test_import_execution_anonymous_1.php');
$DB = new fixture_test_import_execution_anonymous_1($events);
$check = function ($condition) {
    if (!$condition) {
        throw new RuntimeException('Import execution check failed');
    }
};
$id = import_execution::run([[]], function () use (&$events) {
    $events[] = 'memberships';
    $events[] = 'history';
    return 42;
});
$check($id === 42 && $events === ['begin', 'memberships', 'history', 'commit']);
$check(core_php_time_limit::$seconds === 120);
$events = [];
try {
    import_execution::run([[]], function () use (&$events) {
        $events[] = 'memberships';
        throw new RuntimeException('history write failed');
    });
    throw new LogicException('Failure swallowed');
} catch (RuntimeException $exception) {
    $check($exception->getMessage() === 'history write failed');
}
$check($events === ['begin', 'memberships', 'rollback']);
$events = [];
try {
    import_execution::run([[]], fn() => 0);
    throw new LogicException('Missing history committed');
} catch (moodle_exception $exception) {
    $check($events === ['begin', 'rollback']);
}
$events = [];
try {
    import_execution::run(array_fill(0, 1001, []), fn() => 5);
    throw new LogicException('Limit not enforced');
} catch (moodle_exception $exception) {
    $check($events === []);
}
echo json_encode(['passed' => true, 'atomicCommitAndRollback' => true, 'limitBeforeWrites' => 1000]) . PHP_EOL;
