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
// Test doubles only: never include from a Moodle request or production service.

/**
 * Isolated membership-transfer doubles with real batched-reader support.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
defined('MOODLE_INTERNAL') || die();

defined('EASYEDU_TEST_MEMBER_TRANSFER') || die();

defined('SQL_PARAMS_NAMED') || define('SQL_PARAMS_NAMED', 1);

require_once(__DIR__ . '/doubles/lib/global/fixture_lib_moodle_exception.php');
class_alias('fixture_lib_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/doubles/lib/global/fixture_lib_required_capability_exception.php');
class_alias('fixture_lib_required_capability_exception', 'required_capability_exception');
require_once(__DIR__ . '/doubles/lib/global/fixture_lib_context_course.php');
class_alias('fixture_lib_context_course', 'context_course');
require_once(__DIR__ . '/doubles/lib/global/fixture_lib_transfer_mock_database.php');
class_alias('fixture_lib_transfer_mock_database', 'transfer_mock_database');
require_once(__DIR__ . '/doubles/lib/global/fixture_lib_transfer_mock_recordset.php');
class_alias('fixture_lib_transfer_mock_recordset', 'transfer_mock_recordset');
/**
 * Perform the isolated get_enrolled_sql fixture operation.
 *
 * @param context_course $context Fixture argument.
 * @return array Fixture result.
 */
function get_enrolled_sql(context_course $context): array {
    return ['isolated_enrolments', ['courseid' => $context->id]];
}
/**
 * Perform the isolated isguestuser fixture operation.
 *
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function isguestuser(int $userid): bool {
    return false;
}
require_once(__DIR__ . '/doubles/lib/global/fixture_lib_transfer_mock_transaction.php');
class_alias('fixture_lib_transfer_mock_transaction', 'transfer_mock_transaction');
/**
 * Perform the isolated require_capability fixture operation.
 *
 * @param string $capability Fixture argument.
 * @param context_course $context Fixture argument.
 * @return void Fixture result.
 */
function require_capability(string $capability, context_course $context): void {
    global $DB;
    if ($capability !== 'moodle/course:managegroups' || $context->id !== 20 || !$DB->privileged) {
        throw new required_capability_exception('nopermissions');
    }
}
/**
 * Perform the isolated groups_get_group fixture operation.
 *
 * @param int $groupid Fixture argument.
 * @return ?stdClass Fixture result.
 */
function groups_get_group(int $groupid): ?stdClass {
    global $DB;
    return $DB->groups[$groupid] ?? null;
}
/**
 * Perform the isolated groups_is_member fixture operation.
 *
 * @param int $groupid Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_is_member(int $groupid, int $userid): bool {
    global $DB;
    return in_array($userid, $DB->members[$groupid] ?? [], true);
}
/**
 * Perform the isolated is_enrolled fixture operation.
 *
 * @param context_course $context Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function is_enrolled(context_course $context, int $userid): bool {
    global $DB;
    return $context->id === 20 && in_array($userid, $DB->enrolled, true);
}
/**
 * Perform the isolated groups_remove_member_allowed fixture operation.
 *
 * @param stdClass $group Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_remove_member_allowed(stdClass $group, int $userid): bool {
    global $DB;
    return !in_array($group->id . ':' . $userid, $DB->protected, true);
}
/**
 * Perform the isolated groups_add_member fixture operation.
 *
 * @param stdClass $group Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_add_member(stdClass $group, int $userid): bool {
    global $DB;
    $DB->calls[] = ['add', $group->id, $userid];
    if ($DB->failadd === $userid) {
        return false;
    }
    $DB->members[$group->id][] = $userid;
    return true;
}
/**
 * Perform the isolated groups_remove_member fixture operation.
 *
 * @param int|stdClass $groupid Fixture argument (native API: group record or id).
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_remove_member(int|stdClass $groupid, int $userid): bool {
    global $DB;
    $groupid = is_object($groupid) ? (int)$groupid->id : $groupid;
    $DB->calls[] = ['remove', $groupid, $userid];
    if ($DB->failremove === $userid) {
        return false;
    }
    $DB->members[$groupid] = array_values(array_filter($DB->members[$groupid], fn($id) => $id !== $userid));
    return true;
}
