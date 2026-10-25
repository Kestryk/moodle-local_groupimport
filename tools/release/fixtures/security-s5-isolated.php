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
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace core\event {define('CLI_SCRIPT', true);
    require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
    if (!MOODLE_INTERNAL) {
        die('CLI fixtures only.');
    }


    require_once(__DIR__ . '/../../../tools/release/fixtures/source_file.php');

    require_once(__DIR__ . '/doubles/security_s5_isolated/core_event/fixture_security_s5_isolated_base.php');
    class_alias('core\\event\\fixture_security_s5_isolated_base', 'core\\event\\base');
}
namespace {
    // Source-only S5 fixture. No Moodle bootstrap, database connection or network.
    define('SQL_PARAMS_NAMED', 2);
    define('PARAM_TEXT', 1);
    define('PARAM_ALPHANUM', 2);
    define('PARAM_ALPHA', 3);
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_moodle_exception.php');
    class_alias('fixture_security_s5_isolated_moodle_exception', 'moodle_exception');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_coding_exception.php');
    class_alias('fixture_security_s5_isolated_coding_exception', 'coding_exception');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_core_php_time_limit.php');
    class_alias('fixture_security_s5_isolated_core_php_time_limit', 'core_php_time_limit');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_context_course.php');
    class_alias('fixture_security_s5_isolated_context_course', 'context_course');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_core_text.php');
    class_alias('fixture_security_s5_isolated_core_text', 'core_text');
    /**
     * Perform isolated fixture operation get_enrolled_sql.
     * @param mixed $context Fixture argument.
     * @return mixed Fixture result.
     */
    function get_enrolled_sql($context) {
        return ['SELECT userid AS id FROM {fixture_enrolments} WHERE courseid = :enrolcourse',
         ['enrolcourse' =>
         $context->instanceid]];
    }
    /**
     * Perform isolated fixture operation get_string.
     * @param mixed $key Fixture argument.
     * @param mixed $component Fixture argument.
     * @param mixed $a Fixture argument.
     * @return mixed Fixture result.
     */
    function get_string($key, $component = '', $a = null) {
        $value = $GLOBALS['translations'][$GLOBALS['language']][$key] ?? $key;
        return is_scalar($a) ? str_replace('{$a}', (string)$a, $value) : $value;
    }
    /**
     * Perform isolated fixture operation clean_param.
     * @param mixed $value Fixture argument.
     * @param mixed $type Fixture argument.
     * @return mixed Fixture result.
     */
    function clean_param($value, $type) {
        return trim($value);
    }
    /**
     * Perform isolated fixture operation is_enrolled.
     * @param mixed $context Fixture argument.
     * @param mixed $userid Fixture argument.
     * @return mixed Fixture result.
     */
    function is_enrolled($context, $userid) {
        return in_array($userid, $GLOBALS['enrolled'][$context->instanceid] ?? [], true);
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
     * Perform isolated fixture operation local_groupimport_get_allowed_import_userfields.
     * @return mixed Fixture result.
     */
    function local_groupimport_get_allowed_import_userfields() {
        return $GLOBALS['fields'];
    }
    /**
     * Perform isolated fixture operation local_groupimport_history_table_exists.
     * @return mixed Fixture result.
     */
    function local_groupimport_history_table_exists() {
        return true;
    }
    /**
     * Perform isolated fixture operation groups_get_course_data.
     * @param mixed $id Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_get_course_data($id) {
        return (object)['groups' => $GLOBALS['DB']->groups];
    }
    /**
     * Perform isolated fixture operation groups_get_group_by_name.
     * @param mixed $course Fixture argument.
     * @param mixed $name Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_get_group_by_name($course, $name) {
        foreach ($GLOBALS['DB']->groups as $g) {
            if ($g->courseid == $course && $g->name == $name) {
                return $g->id;
            }
        }return false;
    }
    /**
     * Perform isolated fixture operation groups_is_member.
     * @param mixed $gid Fixture argument.
     * @param mixed $uid Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_is_member($gid, $uid) {
        return isset($GLOBALS['DB']->members[$gid . ':' . $uid]);
    }
    /**
     * Perform isolated fixture operation groups_add_member.
     * @param mixed $gid Fixture argument.
     * @param mixed $uid Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_add_member($gid, $uid) {
        $GLOBALS['DB']->members[$gid . ':' . $uid] = ['groupid' => $gid, 'userid' => $uid];
        return true;
    }
    /**
     * Perform isolated fixture operation groups_remove_member_allowed.
     * @param mixed $gid Fixture argument.
     * @param mixed $uid Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_remove_member_allowed($gid, $uid) {
        return !isset($GLOBALS['protected'][$gid . ':' . $uid]);
    }
    /**
     * Perform isolated fixture operation groups_remove_member.
     * @param mixed $gid Fixture argument.
     * @param mixed $uid Fixture argument.
     * @return mixed Fixture result.
     */
    function groups_remove_member($gid, $uid) {
        unset($GLOBALS['DB']->members[$gid . ':' . $uid]);
        return true;
    }
    /**
     * Perform isolated fixture operation local_groupimport_count_string.
     * @param mixed $key Fixture argument.
     * @param mixed $value Fixture argument.
     * @return mixed Fixture result.
     */
    function local_groupimport_count_string($key, $value) {
        return $key . ':' . $value;
    }
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_rows.php');
    class_alias('fixture_security_s5_isolated_rows', 'rows');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_transaction.php');
    class_alias('fixture_security_s5_isolated_transaction', 'transaction');
    require_once(__DIR__ . '/doubles/security_s5_isolated/global/fixture_security_s5_isolated_memory_db.php');
    class_alias('fixture_security_s5_isolated_memory_db', 'memory_db');
    /**
     * Perform isolated fixture operation load_functions.
     * @param mixed $file Fixture argument.
     * @param mixed $names Fixture argument.
     * @return mixed Fixture result.
     */
    function load_functions($file, $names) {
        $tokens = token_get_all(file_get_contents($file));for ($i = 0; $i < count($tokens); $i++) {
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
            }if (!in_array($name, $names, true)) {
                continue;
            }
            $body = '';
            $depth = 0;
            $started = false;for ($j = $i; $j < count($tokens); $j++) {
                $t = $tokens[$j];
                $body .= is_array($t) ? $t[1] : $t;
                if ($t === '{') {
                    $depth++;
                    $started = true;
                }if ($t === '}' && --$depth === 0 && $started) {
                    break;
                }
            }require(\local_groupimport_fixture_source_file($body));
        }
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
    $root = dirname(__DIR__, 3);
    $translations = [];
    foreach (['en', 'fr'] as $language) {
        $string = [];
        require($root . '/lang/' . $language . '/local_groupimport.php');
        $translations[$language] = $string;
    }
    require($root . '/classes/local/import_user_lookup.php');
    require($root . '/classes/local/batch_reader.php');
    require($root . '/classes/local/import_execution.php');
    require($root . '/classes/event/import_applied.php');
    require($root . '/classes/event/import_rolled_back.php');
    load_functions(
        $root . '/importlib.php',
        ['local_groupimport_clean_cell',
         'local_groupimport_find_import_users_by_field',
         'local_groupimport_find_import_user',
         'local_groupimport_find_import_users',
         'local_groupimport_validate_preview_rows',
         'local_groupimport_process_import_rows',
         'local_groupimport_record_import_history',
        'local_groupimport_rollback_import']
    );
    load_functions($root . '/lib.php', ['local_groupimport_history_desired_state']);
    $DB = new memory_db();
    $closed = 0;
    $pending = [];
    $events = [];
    $commits = 0;
    $rollbacks = 0;
    $protected = [];
    $USER = (object)['id' => 777];
    $enrolled = [5 => [1, 3], 6 => [2]];
    $fields = ['email' => 'Email'];
    foreach (
        [1,
         2,
         3] as $id
    ) {
        $DB->users[$id] = (object)['id' =>
         $id,
         'email' =>
         "u$id@example.test",
         'username' =>
         "user$id",
         'idnumber' =>
         "n$id",
         'profile' =>
         "p$id",
         'deleted' =>
         0,
         'password' =>
         'NEVER-RETURN-THIS'];
    }
    $DB->groups = [10 => (object)['id' => 10, 'courseid' => 5, 'name' => 'G']];
    $context = new context_course(5);
    foreach (['en', 'fr'] as $language) {
        foreach (
            ['email' =>
            'u2@example.test',
            'username' =>
            'user2',
            'idnumber' =>
            'n2',
            'profile_field_code' =>
            'p2'] as $field => $identifier
        ) {
            $fields = [$field => $field];
            $errors = [];
            $known = match ($field) {
                'email'=>'u1@example.test', 'username'=>'user1', 'idnumber'=>'n1', default=>'p1'
            };
            $found = local_groupimport_find_import_user($known, $errors, $context);
            check($found->id === 1 && $errors === [], "$language enrolled $field");
            $knownbatch = local_groupimport_find_import_users([$known], $context);
            check(
                $knownbatch[$known]['user']->id === 1 &&
                array_keys((array)$knownbatch[$known]['user']) === ['id'],
                "$language enrolled batch $field"
            );
            $errors = [];
            $result = local_groupimport_find_import_user($identifier, $errors, $context);
            check($result === null && count($errors) === 1, "$language single outside $field");
            $outside = $errors;
            $saved = $DB->users[2];
            unset($DB->users[2]);
            $errors = [];
            local_groupimport_find_import_user($identifier, $errors, $context);
            check($errors === $outside, "$language unknown/outside same text $field");
            $DB->users[2] = $saved;
            $batch = local_groupimport_find_import_users([$identifier], $context);
            check(
                $batch[$identifier]['user'] === null &&
                $batch[$identifier]['errors'] === $outside,
                "$language batch same policy $field"
            );
        }
        $fields = ['email' => 'Email'];
        $errors = [];
        $user = local_groupimport_find_import_user('u1@example.test', $errors, $context);
        check($user->id === 1 && array_keys((array)$user) === ['id'], "$language minimal known user");
        $DB->users[2]->email = 'u1@example.test';
        $errors = [];
        $user = local_groupimport_find_import_user('u1@example.test', $errors, $context);
        check($user->id === 1, "$language outside collision irrelevant");
        $enrolled[5][] = 2;
        $errors = [];
        check(
            local_groupimport_find_import_user(
                'u1@example.test',
                $errors,
                $context
            ) === null,
            "$language in-course ambiguity fails"
        );
        check(
            $errors === [\local_groupimport\local\import_user_lookup::unavailable_message('u1@example.test')],
            "$language ambiguous common text"
        );
        $ambiguous = local_groupimport_find_import_users(['u1@example.test'], $context);
        check(
            $ambiguous['u1@example.test']['user'] === null &&
            $ambiguous['u1@example.test']['errors'] === $errors,
            "$language batch ambiguity remains course-scoped"
        );
        $enrolled[5] = [1, 3];
        $DB->users[2]->email = 'u2@example.test';
        $errors = [];
        $preview = local_groupimport_validate_preview_rows([['identifier' => 'u2@example.test', 'groupname' => 'G']], $context);
        check(
            $preview[0] === [\local_groupimport\local\import_user_lookup::unavailable_message('u2@example.test')],
            "$language preview common text"
        );
        $success = [];
        $errors = [];
        $changes = local_groupimport_process_import_rows(
            [['identifier' =>
            'u2@example.test',
            'groupname' =>
            'G']],
            (object)['id' =>
            5],
            $context,
            $success,
            $errors
        );
        check($errors === $preview[0] && $changes['addedmembers'] === [], "$language confirm common text and no writes");
    }
    $language = 'en';
    $fields = ['email' => 'Email'];
    $DB->members = ['10:1' =>
         ['id' =>
         1,
         'groupid' =>
         10,
         'userid' =>
         1],
         '10:3' =>
         ['id' =>
         2,
         'groupid' =>
         10,
         'userid' =>
         3],
         '10:9' =>
         ['id' =>
         3,
         'groupid' =>
         10,
         'userid' =>
         9]];
    $protected = ['10:9' => true];
    $input = [['identifier' => 'u1@example.test', 'groupname' => 'G', 'groupingname' => '']];
    $before = serialize($DB->members);
    $success = [];
    $errors = [];
    try {
        \local_groupimport\local\import_execution::run($input, function () use ($input, $context, &$success, &$errors) {
                local_groupimport_process_import_rows($input, (object)['id' => 5], $context, $success, $errors, 'replace');
                return 1;
        });
        throw new RuntimeException('Expected managed refusal');
    } catch (moodle_exception$e) {
        check(serialize($DB->members) === $before && $rollbacks === 1, 'Replace rolls back earlier manual removal');
    }
    check($events === [] && $DB->history === [], 'No committed failure event/history');
    $protected = [];
    unset($DB->members['10:9']);
    $id = \local_groupimport\local\import_execution::run($input, function () use ($input, $context, &$success, &$errors) {
        $changes = local_groupimport_process_import_rows($input, (object)['id' => 5], $context, $success, $errors, 'replace');
        return local_groupimport_record_import_history(
            5,
            777,
            'x.csv',
            'abc',
            1,
            count($success),
            count($errors),
            'replace',
            $changes
        );
    });
    check($id === 1 && $events === [\local_groupimport\event\import_applied::class], 'Applied event committed with history');
    $history = $DB->history[1];
    $DB->members['10:3'] = ['id' => 2, 'groupid' => 10, 'userid' => 3];
    $DB->members['10:9'] = ['id' => 3, 'groupid' => 10, 'userid' => 9];
    $protected = ['10:9' => true];
    $before = serialize($DB->members);
    $beforeevents = $events;
    try {
        local_groupimport_rollback_import($history, 777);
        throw new RuntimeException('Expected managed restore refusal');
    } catch (moodle_exception$e) {
        check(serialize($DB->members) === $before && $events === $beforeevents, 'Restore fails atomically, no event');
    }
    $protected = [];
    unset($DB->members['10:9']);
    $result = local_groupimport_rollback_import($history, 777);
    check(
        $result->removedmembers === 1 &&
         end($events) === \local_groupimport\event\import_rolled_back::class,
        'Restore event committed'
    );
    check($closed > 10, 'Batch recordsets closed');
    $DB->failhistory = true;
    $before = serialize([$DB->members, $DB->history, $events]);
    try {
        \local_groupimport\local\import_execution::run($input, function () {
                groups_add_member(10, 3);
                return local_groupimport_record_import_history(5, 777, 'x', 'abc', 1, 1, 0, 'keep', []);
        });
        throw new RuntimeException('Expected history failure');
    } catch (RuntimeException$e) {
        check(serialize([$DB->members, $DB->history, $events]) === $before, 'History failure rolls back memberships/event');
    }
    echo json_encode(['suite' =>
         'S5-isolated',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false]) . PHP_EOL;
}
