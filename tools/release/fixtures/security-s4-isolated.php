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
// Executes only isolated policy/functions; no Moodle bootstrap or database connection.

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
define('SITEID', 1);
require_once(__DIR__ . '/doubles/security_s4_isolated/global/fixture_security_s4_isolated_moodle_exception.php');
class_alias('fixture_security_s4_isolated_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/doubles/security_s4_isolated/global/fixture_security_s4_isolated_coding_exception.php');
class_alias('fixture_security_s4_isolated_coding_exception', 'coding_exception');
require_once(__DIR__ . '/doubles/security_s4_isolated/global/fixture_security_s4_isolated_core_text.php');
class_alias('fixture_security_s4_isolated_core_text', 'core_text');
require_once(__DIR__ . '/doubles/security_s4_isolated/global/fixture_security_s4_isolated_memory_db.php');
class_alias('fixture_security_s4_isolated_memory_db', 'memory_db');
/**
 * Perform isolated fixture operation check_password_policy.
 * @param mixed $key Fixture argument.
 * @param mixed $message Fixture argument.
 * @return mixed Fixture result.
 */
function check_password_policy($key, &$message) {
    return $key === 'Strong-key-12!';
}
/**
 * Perform isolated fixture operation groups_get_group.
 * @param mixed $id Fixture argument.
 * @return mixed Fixture result.
 */
function groups_get_group($id) {
    return $GLOBALS['groups'][$id] ?? false;
}
/**
 * Perform isolated fixture operation groups_remove_member_allowed.
 * @param mixed $group Fixture argument.
 * @param mixed $userid Fixture argument.
 * @return mixed Fixture result.
 */
function groups_remove_member_allowed($group, $userid) {
    return ($GLOBALS['components'][$group->id . ':' . $userid] ?? '') !== 'enrol_meta';
}
/**
 * Perform isolated fixture operation groups_is_member.
 * @param mixed $groupid Fixture argument.
 * @param mixed $userid Fixture argument.
 * @return mixed Fixture result.
 */
function groups_is_member($groupid, $userid) {
    return isset($GLOBALS['members'][$groupid . ':' . $userid]);
}
/**
 * Perform isolated fixture operation groups_remove_member.
 * @param mixed $groupid Fixture argument.
 * @param mixed $userid Fixture argument.
 * @return mixed Fixture result.
 */
function groups_remove_member($groupid, $userid) {
    // Native API: a group record or its id.
    $groupid = is_object($groupid) ? $groupid->id : $groupid;
    unset($GLOBALS['members'][$groupid . ':' . $userid]);
    $GLOBALS['removals']++;
    return true;
}
$root = dirname(__DIR__, 3);
require($root . '/classes/local/ajax_security.php');
use local_groupimport\local\ajax_security as policy;
$checks = 0;
/**
 * Perform isolated fixture operation check.
 * @param mixed $value Fixture argument.
 * @param mixed $label Fixture argument.
 * @return mixed Fixture result.
 */
function check($value, $label) {
    $GLOBALS['checks']++;
    if (!$value) {
        throw new RuntimeException($label);
    }
}
/**
 * Perform isolated fixture operation rejects.
 * @param callable $call Fixture argument.
 * @param string $label Fixture argument.
 * @return mixed Fixture result.
 */
function rejects(callable $call, string $label) {
    try {
        $call();
    } catch (moodle_exception $e) {
        check(true, $label);
        return;
    }throw new RuntimeException($label);
}
// Load only named pure functions from an owned source file, never its page bootstrap.
/**
 * Perform isolated fixture operation load_functions.
 * @param string $file Fixture argument.
 * @param array $names Fixture argument.
 * @return void Fixture result.
 */
function load_functions(string $file, array $names): void {
    $tokens = token_get_all(file_get_contents($file));
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
        if (!in_array($name, $names, true)) {
            continue;
        }
        $body = '';
        $depth = 0;
        $started = false;
        for ($j = $i; $j < count($tokens); $j++) {
            $t = $tokens[$j];
            $body .= is_array($t) ? $t[1] : $t;
            if ($t === '{') {
                $depth++;
                $started = true;
            }if ($t === '}' && --$depth === 0 && $started) {
                break;
            }
        }
        require(\local_groupimport_fixture_source_file($body));
    }
}
$file = ($argv[1] ?? 'ajax') === 'manage' ? 'manage.php' : 'ajax.php';
load_functions($root . '/' . $file, ['local_groupimport_extract_create_names', 'local_groupimport_number_to_letters']);
$DB = new memory_db();
$CFG = (object)['groupenrolmentkeypolicy' => false];
policy::require_request('POST', 5);
check(true, 'POST accepted');
foreach (['GET', 'HEAD', 'PUT', 'DELETE', ''] as $method) {
    rejects(fn()=>policy::require_request($method, 5), 'Non-POST blocked');
}
foreach ([0, -1, 1] as $id) {
    rejects(fn()=>policy::require_request('POST', $id), 'Invalid/site course');
}
policy::validate_name(str_repeat('é', 254));
check(true, 'Unicode name boundary');
rejects(fn()=>policy::validate_name(str_repeat('é', 255)), 'Overlong name');
rejects(fn()=>policy::validate_name(' '), 'Empty name');
$DB->rows['groups'] = [(object)['id' => 2, 'courseid' => 5, 'idnumber' => 'taken', 'enrolmentkey' => 'used']];
rejects(fn()=>policy::validate_entity('groups', 5, 3, 'G', 'taken'), 'Duplicate group idnumber');
rejects(fn()=>policy::validate_entity('groups', 5, 3, 'G', str_repeat('i', 101)), 'Idnumber length');
policy::validate_entity('groups', 5, 2, 'G', 'taken', 'used', 'used');
check(true, 'Own values retained');
rejects(fn()=>policy::validate_entity('groups', 5, 3, 'G', null, 'used'), 'Duplicate enrolment key');
policy::validate_entity('groups', 6, 3, 'G', 'taken', 'used');
check(true, 'Other course values allowed');
$CFG->groupenrolmentkeypolicy = true;
rejects(fn()=>policy::validate_entity('groups', 5, 3, 'G', null, 'weak'), 'Password policy');
policy::validate_entity('groups', 5, 3, 'G', null, 'Strong-key-12!');
check(true, 'Valid new key');
$DB->rows['groupings'] = [(object)['id' => 4, 'courseid' => 5, 'idnumber' => 'grouping-id']];
rejects(fn()=>policy::validate_entity('groupings', 5, 7, 'GG', 'grouping-id'), 'Grouping idnumber');
$long = str_repeat('é', 270);
$name = policy::copy_name('groups', 5, $long);
check(mb_strlen($name) === 254, 'Bounded copy');
$DB->rows['groups'][] = (object)['id' => 8, 'courseid' => 5, 'name' => $name];
$copy = policy::copy_name('groups', 5, $long);
check(mb_strlen($copy) === 254 && str_ends_with($copy, ' (2)'), 'Collision suffix within boundary');
check(count(local_groupimport_extract_create_names('A #*200; B #*200; C #*100')) === 500, 'Global creation boundary');
rejects(fn()=>local_groupimport_extract_create_names('A #*200; B #*200; C #*101'), 'Global cap');
rejects(fn()=>local_groupimport_extract_create_names(implode(';', array_fill(0, 501, 'a'))), 'Segment cap');
rejects(fn()=>local_groupimport_extract_create_names(str_repeat('a', 255)), 'Parser name limit');
check(local_groupimport_extract_create_names('G @*2') === ['G A', 'G B'], 'Letter expansion');
$groups = [1 => (object)['id' => 1, 'courseid' => 5], 2 => (object)['id' => 2, 'courseid' => 6]];
$members = ['1:10' => true, '1:11' => true];
$components = ['1:11' => 'enrol_meta'];
$removals = 0;
rejects(fn()=>policy::remove_members(5, [1, 1], [10, 11]), 'Managed member blocks whole batch');
check($removals === 0, 'Preflight before any removal');
rejects(fn()=>policy::remove_members(5, [1, 2], [10, 11]), 'Foreign group blocks whole batch');
check($removals === 0, 'Foreign group no side effects');
rejects(fn()=>policy::remove_members(5, [1], []), 'Pair count mismatch');
check(policy::remove_members(5, [1, 1], [10, 10]) === 1 && $removals === 1, 'Manual removal deduplicated');
check(policy::remove_members(5, [1], [10]) === 0, 'Absent membership idempotent');
check(policy::image_upload(null, (object)[]) === null, 'No upload');
rejects(fn()=>policy::image_upload(['error' => UPLOAD_ERR_INI_SIZE], (object)[]), 'Upload transport error');
rejects(fn()=>policy::image_upload(['error' => UPLOAD_ERR_OK, 'tmp_name' => __FILE__], (object)[]), 'Not an HTTP upload');
$tmp = tempnam(sys_get_temp_dir(), 's4-image-');
try {
    file_put_contents(
        $tmp,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/qcAAAAASUVORK5CYII=')
    );
    policy::validate_image_file($tmp, 1000);
    check(true, 'Decoded PNG');
    rejects(fn()=>policy::validate_image_file($tmp, 1), 'Actual byte limit');
    file_put_contents($tmp, '<svg xmlns="http://www.w3.org/2000/svg"><script>bad()</script></svg>');
    rejects(fn()=>policy::validate_image_file($tmp, 1000), 'SVG/script rejected');
    file_put_contents($tmp, 'pretend jpg');
    rejects(fn()=>policy::validate_image_file($tmp, 1000), 'Fake image');
} finally {
    unlink($tmp);
}
$source = file_get_contents($root . '/ajax.php');
check(
    strpos(
        $source,
        'ajax_security::require_request'
    ) < strpos(
        $source,
        'require_sesskey();'
    ),
    'Method/site check before dispatch'
);
check(substr_count($source, 'ajax_security::remove_members(') === 2, 'Both removal actions guarded');
check(!str_contains($source, '$searchparts[] = $member->email'), 'No email search leak');
echo json_encode(['suite' =>
         'S4-isolated',
         'parser' =>
         $file,
         'passed' =>
         true,
         'checks' =>
         $checks,
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false]) . PHP_EOL;
