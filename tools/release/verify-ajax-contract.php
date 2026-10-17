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

/** Isolated AJAX surface verification: actual dispatch, no Moodle bootstrap or database.  * @copyright 2026 Kevin Jarniac
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
define('PARAM_INT', 'int');
define('MUST_EXIST', true);
define('SQL_PARAMS_NAMED', true);

$root = dirname(__DIR__, 2);
require_once($root . '/classes/local/batch_reader.php');
$source = file_get_contents($root . '/ajax.php');
$start = strpos($source, "\ntry {");
$end = strpos($source, "\nheader('Content-Type:", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('AJAX dispatch boundary changed.');
}
$dispatch = substr($source, $start, $end - $start);
$checks = [];
$injected = null;
$created = null;
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_moodle_exception.php');
class_alias('fixture_verify_ajax_contract_moodle_exception', 'moodle_exception');
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_dml_exception.php');
class_alias('fixture_verify_ajax_contract_dml_exception', 'dml_exception');
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_moodle_url.php');
class_alias('fixture_verify_ajax_contract_moodle_url', 'moodle_url');
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_core_text.php');
class_alias('fixture_verify_ajax_contract_core_text', 'core_text');
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_fixture_database.php');
class_alias('fixture_verify_ajax_contract_fixture_database', 'fixture_database');
require_once(__DIR__ . '/doubles/verify_ajax_contract/global/fixture_verify_ajax_contract_identifier_database.php');
class_alias('fixture_verify_ajax_contract_identifier_database', 'identifier_database');
/**
 * Perform isolated fixture operation get_config.
 * @param mixed $component Fixture argument.
 * @return mixed Fixture result.
 */
function get_config($component) {
    global $allowedfields;
    return (object)['alloweduserfields' => $allowedfields];
}
/**
 * Perform isolated fixture operation required_param.
 * @param mixed $name Fixture argument.
 * @param mixed $type Fixture argument.
 * @return mixed Fixture result.
 */
function required_param($name, $type) {
    return 11;
}
/**
 * Perform isolated fixture operation groups_get_group.
 * @param mixed $id Fixture argument.
 * @return mixed Fixture result.
 */
function groups_get_group($id) {
    global $injected;
    if ($injected) {
        throw $injected;
    }
    return (object)['id' => $id, 'courseid' => 123, 'name' => 'Synthetic group'];
}
/**
 * Perform isolated fixture operation groups_create_group.
 * @param mixed $record Fixture argument.
 * @return mixed Fixture result.
 */
function groups_create_group($record) {
    global $created;
    $created = $record;
    return 12;
}
/**
 * Perform isolated fixture operation groups_create_grouping.
 * @param mixed $record Fixture argument.
 * @return mixed Fixture result.
 */
function groups_create_grouping($record) {
    global $created;
    $created = $record;
    return 12;
}
/**
 * Perform isolated fixture operation groups_get_members.
 * @param mixed $id Fixture argument.
 * @param mixed $fields Fixture argument.
 * @return mixed Fixture result.
 */
function groups_get_members($id, $fields) {
    return [];
}
/**
 * Perform isolated fixture operation format_string.
 * @param mixed $value Fixture argument.
 * @return mixed Fixture result.
 */
function format_string($value) {
    return $value;
}
/**
 * Perform isolated fixture operation get_string.
 * @param mixed $key Fixture argument.
 * @param mixed $component Fixture argument.
 * @param mixed $a Fixture argument.
 * @return mixed Fixture result.
 */
function get_string($key, $component, $a = null) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing string: ' . $key);
    }
    return is_scalar($a) ? str_replace('{$a}', (string)$a, $string[$key]) : $string[$key];
}
/**
 * Perform isolated fixture operation check.
 * @param mixed $name Fixture argument.
 * @param mixed $condition Fixture argument.
 * @return mixed Fixture result.
 */
function check($name, $condition) {
    global $checks;
    $checks[$name] = (bool)$condition;
    if (!$condition) {
        throw new RuntimeException('Failed: ' . $name);
    }
}
require($root . '/classes/local/guide_discovery.php');
$DB = new fixture_database();
$course = (object)['id' => 123];
check(
    'AJAX_SCRIPT precedes config',
    strpos($source, "define('AJAX_SCRIPT', true);") < strpos($source, "require_once(__DIR__ . '/../../config.php')")
);
foreach (['en', 'fr'] as $language) {
    $string = [];
    $langsource = file_get_contents($root . '/lang/' . $language . '/local_groupimport.php');
    preg_match_all('/^\$string\[\x27([^\x27]+)\x27\]\s*=/m', $langsource, $keys);
    check($language . ' unique language keys', count($keys[1]) === count(array_unique($keys[1])));
    require($root . '/lang/' . $language . '/local_groupimport.php');
    foreach (
        ['discovery_addselect',
         'discovery_adddrop',
         'discovery_mobileaddselect',
         'discovery_mobileaddmenu',
         'discovery_mobileaddvalidate',
         'guideinspection_group_open',
         'guideinspection_group_enter',
         'guideinspection_group_review',
         'guideinspection_grouping_open',
         'guideinspection_grouping_enter',
         'guideinspection_grouping_review',
         'guideinspection_grouping_return'] as $key
    ) {
        check($language . ' concise phase ' . $key, mb_strlen($string[$key]) <= 110);
    }
    check($language . ' participant action says Add', $string['moveselectedparticipants'] ===
        ($language === 'fr' ? 'Ajouter à un groupe' : 'Add to group'));
    check($language . ' core Add caption retained', $string['discovery_demo_add'] ===
        ($language === 'fr' ? 'Ajouter' : 'Add'));
    check($language . ' group members named correctly', $string['guideinspection_group_cardmeta'] ===
        ($language === 'fr' ? '2 membres' : '2 members'));
    for ($index = 1; $index <= 12; $index++) {
        check($language . ' short navigation ' . $index, isset($string['guide_nav_' . $index]) &&
            mb_strlen($string['guide_nav_' . $index]) <= 16);
    }
    if ($language === 'fr') {
        check(
            'French Guide glossary has no old borrowed terms',
            !preg_match('/\\b(?:checklist|desktop|slides?|Practice)\\b/i', implode("\\n", $string))
        );
        check('French lock uses angle quotes', $string['guidesteplocked'] === 'Terminer « {$a} » d’abord');
    }
    $keysets[$language] = array_keys($string);
    foreach (['duplicategroup' => 'group', 'duplicategrouping' => 'grouping'] as $action => $kind) {
        $response = ['success' => false];
        $created = null;
        require(\local_groupimport_fixture_source_file($dispatch));
        $suffix = $language === 'fr' ? ' (copie)' : ' (copy)';
        check($language . ' ' . $action, $response['success'] &&
            $created->name === 'Synthetic ' . $kind . $suffix &&
            $response[$kind]['rawname'] === $created->name);
    }
    foreach (
        [new dml_exception('synthetic database failure'), new RuntimeException('synthetic PHP failure'),
            new moodle_exception('Synthetic human-readable error')] as $injected
    ) {
        $action = 'duplicategroup';
        $response = ['success' => false];
        require(\local_groupimport_fixture_source_file($dispatch));
        $human = $injected instanceof moodle_exception && !($injected instanceof dml_exception);
        check($language . ' safe ' . get_class($injected), !$response['success'] &&
            $response['error'] === ($human ? $injected->getMessage() : $string['ajaxunexpectederror']));
    }
    $injected = null;
    check(
        $language . ' path and demo resume distinct',
        $string['guideresumepath'] !== $string['discovery_resume']
    );
    foreach (['group', 'grouping'] as $kind) {
        $scene = \local_groupimport\local\guide_discovery::card_inspection($kind);
        check($language . ' inspection ' . $kind . ' Add', $scene['addlabel'] === $string['discovery_demo_add']);
        check($language . ' inspection ' . $kind . ' resume', $scene['resumelabel'] === $string['discovery_resume']);
    }
}
sort($keysets['en']);
sort($keysets['fr']);
check('EN FR key parity', $keysets['en'] === $keysets['fr']);
$manage = file_get_contents($root . '/manage.php');
check('Path adapter uses distinct resume', strpos(
    $manage,
    "'guideresumelabel' => get_string('guideresumepath', 'local_groupimport')"
) !== false);
$index = file_get_contents($root . '/index.php');
// Execute the actual three guard expressions, not a copied policy predicate.
foreach (['rollbackhistoryid' => $index, 'confirmimport' => $index, 'action' => $manage] as $variable => $text) {
    $pattern = '/if \((\$' . $variable . ' && data_submitted\(\))\) \{\s*(?:global [^;]+;\s*)?require_sesskey\(\);/';
    check($variable . ' POST guard and explicit sesskey', preg_match($pattern, $text, $match) === 1);
    foreach ([false, true] as $submitted) {
        foreach ([false, true] as $validkey) {
            $guardcalls = 0;
            $$variable = 1;
            try {
                require(\local_groupimport_fixture_source_file('if (' . $match[1] . ') { require_sesskey(); }'));
                check(
                    $variable . ' ' . ($submitted ? 'POST' : 'GET') . ' key' . (int)$validkey,
                    $guardcalls === (int)$submitted && (!$submitted || $validkey)
                );
            } catch (moodle_exception $error) {
                check($variable . ' invalid POST rejected', $submitted && !$validkey && $guardcalls === 1);
            }
        }
    }
}
$resolverstart = strpos($source, 'function local_groupimport_find_user_by_identifier(');
$resolverend = strpos($source, "\n/**", $resolverstart);
check('Bounded actual identifier resolver', $resolverstart !== false && $resolverend > $resolverstart);
require(\local_groupimport_fixture_source_file(substr($source, $resolverstart, $resolverend - $resolverstart)));
$DB = new identifier_database();
foreach (['email', 'username', 'idnumber', 'profile_field_School', ''] as $allowedfields) {
    $DB->fields = [];
    check(
        'Moodle ID retained under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('42')->id === 42
    );
    check(
        'Bare first name rejected under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('SyntheticFirst') === null
    );
    check(
        'Bare last name rejected under ' . ($allowedfields ?: 'defaults'),
        local_groupimport_find_user_by_identifier('SyntheticLast') === null
    );
    check(
        'Name fields never queried under ' . ($allowedfields ?: 'defaults'),
        !array_intersect(['firstname', 'lastname'], $DB->fields)
    );
    foreach (
        ['email' => 'synthetic@example.test', 'username' => 'synthetic-user', 'idnumber' => 'SYN-42',
            'profile_field_School' => 'SyntheticSchool'] as $field => $token
    ) {
        $enabled = $allowedfields === $field || ($allowedfields === '' && in_array($field, ['email', 'username']));
        check(
            $field . ' respects setting ' . ($allowedfields ?: 'defaults'),
            (local_groupimport_find_user_by_identifier($token) !== null) === $enabled
        );
    }
}
check('Empty identifier rejected', local_groupimport_find_user_by_identifier('  ') === null);
$report = json_encode(
    ['surface' => 'ajax-and-language', 'level' => 0, 'passed' => count($checks), 'failed' => 0,
    'checks' => $checks, 'scope' => 'Actual dispatch with isolated service doubles; no native course writes'],
    JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR
) . PHP_EOL;
if (!empty($argv[1])) {
    file_put_contents($argv[1], $report);
}
echo $report;
/**
 * Perform isolated fixture operation data_submitted.
 * @return mixed Fixture result.
 */
function data_submitted() {
    global $submitted;
    return $submitted;
}
/**
 * Perform isolated fixture operation require_sesskey.
 * @return mixed Fixture result.
 */
function require_sesskey() {
    global $validkey, $guardcalls;
    $guardcalls++;
    if (!$validkey) {
        throw new moodle_exception('Invalid session key');
    }
}
