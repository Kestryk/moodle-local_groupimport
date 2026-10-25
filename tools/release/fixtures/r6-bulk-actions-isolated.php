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
// Execute the four actual AJAX branch bodies with in-memory native adapters only.

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

require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../../tools/release/fixtures/source_file.php');
define('PARAM_INT', 1);
define('PARAM_TEXT', 2);
define('SQL_PARAMS_NAMED', 1);
require_once(__DIR__ . '/doubles/r6_bulk_actions_isolated/global/fixture_r6_bulk_actions_isolated_moodle_exception.php');
class_alias('fixture_r6_bulk_actions_isolated_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/doubles/r6_bulk_actions_isolated/global/fixture_r6_bulk_actions_isolated_context_course.php');
class_alias('fixture_r6_bulk_actions_isolated_context_course', 'context_course');
require_once(__DIR__ . '/doubles/r6_bulk_actions_isolated/global/fixture_r6_bulk_actions_isolated_core_php_time_limit.php');
class_alias('fixture_r6_bulk_actions_isolated_core_php_time_limit', 'core_php_time_limit');
require_once(__DIR__ . '/doubles/r6_bulk_actions_isolated/global/fixture_r6_bulk_actions_isolated_memory_db.php');
class_alias('fixture_r6_bulk_actions_isolated_memory_db', 'memory_db');
/**
 * Perform isolated fixture operation required_param.
 * @param mixed $key Fixture argument.
 * @param mixed $type Fixture argument.
 * @return mixed Fixture result.
 */
function required_param($key, $type) {
    return $GLOBALS['input'][$key];
}
/**
 * Perform isolated fixture operation required_param_array.
 * @param mixed $key Fixture argument.
 * @param mixed $type Fixture argument.
 * @return mixed Fixture result.
 */
function required_param_array($key, $type) {
    return $GLOBALS['input'][$key];
}
/**
 * Perform isolated fixture operation groups_get_group.
 * @param mixed $id Fixture argument.
 * @return mixed Fixture result.
 */
function groups_get_group($id) {
    return $GLOBALS['DB']->groups[$id] ?? false;
}
/**
 * Perform isolated fixture operation groups_is_member.
 * @param mixed $g Fixture argument.
 * @param mixed $u Fixture argument.
 * @return mixed Fixture result.
 */
function groups_is_member($g, $u) {
    return isset($GLOBALS['DB']->members["$g:$u"]);
}
/**
 * Perform isolated fixture operation groups_add_member.
 * @param mixed $g Fixture argument.
 * @param mixed $u Fixture argument.
 * @return mixed Fixture result.
 */
function groups_add_member($g, $u) {
    $db = $GLOBALS['DB'];
    $db->mutate();
    $db->members["$g:$u"] = true;
    $db->events[] = "add:$g:$u";
    return true;
}
/**
 * Perform isolated fixture operation groups_remove_member.
 * @param mixed $g Fixture argument.
 * @param mixed $u Fixture argument.
 * @return mixed Fixture result.
 */
function groups_remove_member($g, $u) {
    $db = $GLOBALS['DB'];
    $db->mutate();
    unset($db->members["$g:$u"]);
    $db->events[] = "remove:$g:$u";
    return true;
}
/**
 * Perform isolated fixture operation groups_remove_member_allowed.
 * @param mixed $g Fixture argument.
 * @param mixed $u Fixture argument.
 * @return mixed Fixture result.
 */
function groups_remove_member_allowed($g, $u) {
    return $u !== 99;
}
/**
 * Perform isolated fixture operation groups_delete_group.
 * @param mixed $id Fixture argument.
 * @return mixed Fixture result.
 */
function groups_delete_group($id) {
    $db = $GLOBALS['DB'];
    $db->mutate();
    unset($db->groups[$id]);
    $db->events[] = "delete:$id";
    return true;
}
/**
 * Perform isolated fixture operation get_enrolled_sql.
 * @param mixed $c Fixture argument.
 * @return mixed Fixture result.
 */
function get_enrolled_sql($c) {
    return ['SELECT id FROM enrolled', []];
}
/**
 * Perform isolated fixture operation isguestuser.
 * @param mixed $id Fixture argument.
 * @return mixed Fixture result.
 */
function isguestuser($id) {
    return false;
}
/**
 * Perform isolated fixture operation is_enrolled.
 *
 * @param mixed ...$args Fixture argument.
 * @return mixed Fixture result.
 */
function is_enrolled(...$args) {
    throw new RuntimeException('Unexpected per-user enrolment query');
}
/**
 * Perform isolated fixture operation get_string.
 *
 * @param mixed $key Fixture argument.
 * @param mixed ...$args Fixture argument.
 * @return mixed Fixture result.
 */
function get_string($key, ...$args) {
    return $key;
}
/**
 * Perform isolated fixture operation local_groupimport_count_string.
 * @param mixed $key Fixture argument.
 * @param mixed $count Fixture argument.
 * @return mixed Fixture result.
 */
function local_groupimport_count_string($key, $count) {
    return "$key:$count";
}
/**
 * Perform isolated fixture operation fullname.
 * @param mixed $user Fixture argument.
 * @return mixed Fixture result.
 */
function fullname($user) {
    return 'User ' . $user->id;
}
/**
 * Perform isolated fixture operation local_groupimport_extract_user_tokens.
 * @param mixed $s Fixture argument.
 * @return mixed Fixture result.
 */
function local_groupimport_extract_user_tokens($s) {
    return array_values(array_unique(preg_split('/\\s+/', trim($s), -1, PREG_SPLIT_NO_EMPTY)));
}
/**
 * Perform isolated fixture operation local_groupimport_find_users_by_identifiers.
 * @param mixed $tokens Fixture argument.
 * @return mixed Fixture result.
 */
function local_groupimport_find_users_by_identifiers($tokens) {
    $out = [];
    foreach ($tokens as $t) {
        if (preg_match('/^user([0-9]+)$/', $t, $m)) {
            $out[$t] = (object)['id' => (int)$m[1]];
        }
    }return $out;
}
$root = dirname(__DIR__, 3);
require($root . '/classes/local/bulk_action.php');
require($root . '/classes/local/batch_reader.php');
require($root . '/classes/local/ajax_security.php');
$assignment = file_get_contents($root . '/classes/service/membership_assignment.php');
$bootstrap = "require_once(\$CFG->dirroot . '/group/lib.php');";
if (substr_count($assignment, $bootstrap) !== 1) {
    throw new RuntimeException('Review changed native bootstrap');
}
require(\local_groupimport_fixture_source_file(substr(str_replace($bootstrap, '', $assignment), 5)));
use local_groupimport\local\bulk_action;
use local_groupimport\local\ajax_security;
require($root . '/classes/local/ajax/ajax_action.php');
foreach (['addusers', 'addemails', 'removemembers', 'deletegroups'] as $name) {
    require($root . '/classes/local/ajax/' . $name . '.php');
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
/**
 * Perform isolated fixture operation reset_state.
 * @return mixed Fixture result.
 */
function reset_state() {
    $GLOBALS['DB'] = new memory_db();
    $db = $GLOBALS['DB'];
    $db->groups = [10 =>
         (object)['id' =>
         10,
         'courseid' =>
         5],
         11 =>
         (object)['id' =>
         11,
         'courseid' =>
         5],
         12 =>
         (object)['id' =>
         12,
         'courseid' =>
         6]];
    for ($i = 1; $i <= 500; $i++) {
        $db->enrolled[$i] = (object)['id' => $i];
    }
    $GLOBALS['USER'] = (object)['id' => 0];
    core_php_time_limit::$calls = [];
}
/**
 * Perform isolated fixture operation action.
 * @param mixed $name Fixture argument.
 * @param mixed $input Fixture argument.
 * @return mixed Fixture result.
 */
function action($name, $input) {
    global $DB;
    $context = new context_course();
    $course = (object)['id' => 5];
    $response = ['success' => false];
    $GLOBALS['input'] = $input;
    $handler = '\\local_groupimport\\local\\ajax\\' . $name;
    return $handler::handle($course, $context, $response);
}
/**
 * Perform isolated fixture operation rejection.
 * @param mixed $name Fixture argument.
 * @param mixed $input Fixture argument.
 * @param mixed $message Fixture argument.
 * @return mixed Fixture result.
 */
function rejection($name, $input, $message) {
    try {
        action($name, $input);
    } catch (Throwable $e) {
        check($e->getMessage() === $message, $name . ' expected ' . $message);
        return;
    }throw new RuntimeException('Expected rejection');
}
reset_state();
$r = action('addusers', ['groupid' => 10, 'userids' => range(1, 500)]);
check($r['added'] === 500 && count($DB->members) === 500, '500 native writes');
check($DB->queries === 1, 'one enrolment snapshot');
check($DB->commits === 1 && $DB->rollbacks === 0, 'commit once');
check(core_php_time_limit::$calls === [180], 'raise once');
reset_state();
rejection('addusers', ['groupid' => 10, 'userids' => array_fill(0, 501, 1)], 'bulkactionlimit');
check($DB->writes === 0 && $DB->starts === 0 && $DB->queries === 0, 'oversize before lookups/transaction');
reset_state();
$r = action('addusers', ['groupid' => 10, 'userids' => [1, 1, 999]]);
check($r['added'] === 1 && count($DB->members) === 1, 'duplicate and unenrolled skipped');
check($r['skipped'] === 1 && str_contains($r['message'], 'bulkitemsskipped'), 'explicit partial add summary');
$r = action('addusers', ['groupid' => 10, 'userids' => [1]]);
check($r['existing'] === 1, 'existing count retained');
reset_state();
$DB->failat = 3;
rejection('addusers', ['groupid' => 10, 'userids' => [1, 2, 3]], 'native-failure');
check(!$DB->members && !$DB->events && $DB->rollbacks === 1 && $DB->commits === 0, 'add rollback and event buffering');
reset_state();
$r = action('addemails', ['groupid' => 10, 'emails' => 'user1 unknown user999 user2']);
check(count($r['users']) === 2 && $r['missing'] === ['unknown', 'user999'], 'email partial matching response retained');
check($r['skipped'] === 2 && str_contains($r['message'], 'bulkitemsskipped'), 'explicit email partial summary');
check($DB->queries === 1 && $DB->commits === 1, 'email grouped enrolment/commit');
reset_state();
rejection(
    'addemails',
    ['groupid' =>
         10,
         'emails' =>
         implode(
             ' ',
             array_map(
                 fn($i)=>
                 'user' . $i,
                 range(
                     1,
                     501
                 )
             )
         )],
    'bulkactionlimit'
);
check($DB->writes === 0 && $DB->starts === 0, 'email cap no writes');
reset_state();
$DB->failat = 2;
rejection('addemails', ['groupid' => 10, 'emails' => 'user1 user2'], 'native-failure');
check(!$DB->members && !$DB->events && $DB->rollbacks === 1, 'email atomic');
reset_state();
$DB->members = ['10:1' => true, '10:2' => true];
$r = action('removemembers', ['groupids' => [10, 10], 'userids' => [1, 2]]);
check(!$DB->members && $DB->commits === 1, 'remove success');
reset_state();
$DB->members = ['10:1' => true, '10:2' => true];
$DB->failat = 2;
rejection('removemembers', ['groupids' => [10, 10], 'userids' => [1, 2]], 'native-failure');
check(count($DB->members) === 2 && !$DB->events && $DB->rollbacks === 1, 'remove atomic');
reset_state();
rejection('removemembers', ['groupids' => array_fill(0, 501, 10), 'userids' => array_fill(0, 501, 1)], 'bulkactionlimit');
check($DB->writes === 0 && $DB->starts === 0, 'remove cap');
reset_state();
$DB->members = ['10:1' => true, '10:99' => true];
rejection('removemembers', ['groupids' => [10, 10], 'userids' => [1, 99]], 'invaliddata');
check(count($DB->members) === 2 && $DB->writes === 0, 'component protection preflight');
reset_state();
$r = action('deletegroups', ['groupids' => [10, 10, 11, 12, 999]]);
check(!isset($DB->groups[10]) && !isset($DB->groups[11]) && isset($DB->groups[12]), 'course scope/dedupe');
check($DB->queries === 1 && $DB->commits === 1, 'one group lookup/commit');
reset_state();
$DB->failat = 2;
rejection('deletegroups', ['groupids' => [10, 11]], 'native-failure');
check(count($DB->groups) === 3 && !$DB->events && $DB->rollbacks === 1, 'delete DB atomic');
reset_state();
rejection('deletegroups', ['groupids' => range(1, 501)], 'bulkactionlimit');
check($DB->writes === 0 && $DB->queries === 0 && $DB->starts === 0, 'delete cap before reads/writes');
$string = [];
require($root . '/lang/fr/local_groupimport.php');
check(
    $string['bulkactionlimit'] === 'Cette requête dépasse la limite de {$a} éléments. Aucune modification n’a ' .
    'été effectuée. Sélectionnez moins d’éléments et réessayez.',
    'exact UTF-8 FR bulkactionlimit'
);
check($string['bulkitemsskipped'] === 'Éléments non ajoutés : {$a}.', 'exact UTF-8 FR bulkitemsskipped');
check(!str_contains($string['bulkactionlimit'] . $string['bulkitemsskipped'], '?'), 'no encoding replacement');
echo json_encode(['surface' =>
         'r6-server',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false]),
         "\n";
