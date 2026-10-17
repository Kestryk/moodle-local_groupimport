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
// Source-only S2 execution: no Moodle bootstrap, network or database connection.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
namespace core_privacy\local\metadata {
    define('CLI_SCRIPT', true);
    require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
    if (!MOODLE_INTERNAL) {
        die('CLI fixtures only.');
    }

    require_once(__DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_metadata/fixture_s2_privacy_isolated_provider.php');
    class_alias('core_privacy\\local\\metadata\\fixture_s2_privacy_isolated_provider', 'core_privacy\\local\\metadata\\provider');
}
namespace core_privacy\local\request\plugin {
    require_once(
        __DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request_plugin/fixture_s2_privacy_isolated_provider.php'
    );
    class_alias(
        'core_privacy\\local\\request\\plugin\\fixture_s2_privacy_isolated_provider',
        'core_privacy\\local\\request\\plugin\\provider'
    );
}
namespace core_privacy\local\request {
    require_once(
        __DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_user_preference_provider.php'
    );
    class_alias(
        'core_privacy\\local\\request\\fixture_s2_privacy_isolated_user_preference_provider',
        'core_privacy\\local\\request\\user_preference_provider'
    );
    require_once(
        __DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_core_userlist_provider.php'
    );
    class_alias(
        'core_privacy\\local\\request\\fixture_s2_privacy_isolated_core_userlist_provider',
        'core_privacy\\local\\request\\core_userlist_provider'
    );
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_contextlist.php');
    class_alias(
        'core_privacy\\local\\request\\fixture_s2_privacy_isolated_contextlist',
        'core_privacy\\local\\request\\contextlist'
    );
    require_once(
        __DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_approved_contextlist.php'
    );
    class_alias(
        'core_privacy\\local\\request\\fixture_s2_privacy_isolated_approved_contextlist',
        'core_privacy\\local\\request\\approved_contextlist'
    );
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_userlist.php');
    class_alias('core_privacy\\local\\request\\fixture_s2_privacy_isolated_userlist', 'core_privacy\\local\\request\\userlist');
    require_once(
        __DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_approved_userlist.php'
    );
    class_alias(
        'core_privacy\\local\\request\\fixture_s2_privacy_isolated_approved_userlist',
        'core_privacy\\local\\request\\approved_userlist'
    );
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/core_privacy_local_request/fixture_s2_privacy_isolated_writer.php');
    class_alias('core_privacy\\local\\request\\fixture_s2_privacy_isolated_writer', 'core_privacy\\local\\request\\writer');
}
namespace core\lock {
    require_once(__DIR__ . '/doubles/background_import/background_import_lock.php');
    require_once(__DIR__ . '/doubles/background_import/background_import_lock_config.php');
    class_alias(background_import_lock::class, lock::class);
    class_alias(background_import_lock_config::class, lock_config::class);
}
namespace core\task {
    /**
     * Isolated fixture double for scheduled_task.
     */
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/core_task/fixture_s2_privacy_isolated_scheduled_task.php');
    class_alias('core\\task\\fixture_s2_privacy_isolated_scheduled_task', 'core\\task\\scheduled_task');
}
namespace local_groupimport\local {
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/local_groupimport_local/fixture_s2_privacy_isolated_motion.php');
    class_alias('local_groupimport\\local\\fixture_s2_privacy_isolated_motion', 'local_groupimport\\local\\motion');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/local_groupimport_local/fixture_s2_privacy_isolated_guide_welcome.php');
    class_alias('local_groupimport\\local\\fixture_s2_privacy_isolated_guide_welcome', 'local_groupimport\\local\\guide_welcome');
}
namespace local_groupimport\task {
    /**
     * Perform isolated fixture operation time.
     * @return int Fixture result.
     */
    function time(): int {
        return $GLOBALS['clock'];
    }
}
namespace {
    define('IGNORE_MISSING', 0);
    define('SQL_PARAMS_NAMED', 2);
    define('CONTEXT_COURSE', 50);
    define('DAYSECS', 86400);
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_core_text.php');
    class_alias('fixture_s2_privacy_isolated_core_text', 'core_text');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_context.php');
    class_alias('fixture_s2_privacy_isolated_context', 'context');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_context_course.php');
    class_alias('fixture_s2_privacy_isolated_context_course', 'context_course');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_context_user.php');
    class_alias('fixture_s2_privacy_isolated_context_user', 'context_user');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_context_system.php');
    class_alias('fixture_s2_privacy_isolated_context_system', 'context_system');
    /**
     * Perform isolated fixture operation get_string.
     * @param string $key Fixture argument.
     * @param string $component Fixture argument.
     * @return string Fixture result.
     */
    function get_string(string $key, string $component): string {
        return $key;
    }
    /**
     * Perform isolated fixture operation get_config.
     * @param string $component Fixture argument.
     * @param string $key Fixture argument.
     * @return mixed Fixture result.
     */
    function get_config(string $component, string $key): mixed {
        return $GLOBALS['config'][$key] ?? false;
    }
    /**
     * Perform isolated fixture operation get_user_preferences.
     * @param string $key Fixture argument.
     * @param mixed $default Fixture argument.
     * @param int $userid Fixture argument.
     * @return mixed Fixture result.
     */
    function get_user_preferences(string $key, mixed $default, int $userid): mixed {
        return $GLOBALS['preferences'][$userid][$key] ?? $default;
    }
    /**
     * Perform isolated fixture operation unset_user_preference.
     * @param string $key Fixture argument.
     * @param int $userid Fixture argument.
     * @return void Fixture result.
     */
    function unset_user_preference(string $key, int $userid): void {
        unset($GLOBALS['preferences'][$userid][$key]);
    }
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_records.php');
    class_alias('fixture_s2_privacy_isolated_records', 'records');
    require_once(__DIR__ . '/doubles/s2_privacy_isolated/global/fixture_s2_privacy_isolated_memory_db.php');
    class_alias('fixture_s2_privacy_isolated_memory_db', 'memory_db');
    /**
     * Perform isolated fixture operation array_all_local.
     * @param array $values Fixture argument.
     * @param callable $predicate Fixture argument.
     * @return bool Fixture result.
     */
    function array_all_local(array $values, callable $predicate): bool {
        foreach ($values as $key => $value) {
            if (!$predicate($key, $value)) {
                return false;
            }
        } return true;
    }
    $checks = 0;
    /**
     * Perform isolated fixture operation check.
     * @param bool $condition Fixture argument.
     * @param string $label Fixture argument.
     * @return void Fixture result.
     */
    function check(bool $condition, string $label): void {
        $GLOBALS['checks']++;
        if (!$condition) {
            throw new \RuntimeException($label);
        }
    }
    $root = dirname(__DIR__, 3);
    require($root . '/classes/local/history_privacy.php');
    require($root . '/classes/privacy/provider.php');
    require($root . '/classes/task/purge_import_history.php');
    $DB = new memory_db();
    $config = [];
    $preferences = [];
    $closed = 0;
    $clock = 1800000000;
    foreach ([1, 2, 3, 4, 5] as $id) {
        $DB->users[$id] = (object)['id' => $id, 'email' => "user$id@example.test", 'username' => "u$id", 'idnumber' => "number$id"];
    }
    $payload = ['desiredstate' =>
         [['userid' =>
         2,
         'identifier' =>
         'old@example.test',
         'groupname' =>
         'G'],
         ['userid' =>
         3,
         'identifier' =>
         'user3@example.test',
         'groupname' =>
         'G']],

        'addedmembers' =>
         [['userid' =>
         2,
         'groupid' =>
         1],
         ['userid' =>
         3,
         'groupid' =>
         1]],
         'removedmembers' =>
         [['userid' =>
         2,
         'groupid' =>
         2]],

        'reportrows' =>
         [['identifier' =>
         'old@example.test',
         'status' =>
         'success'],
         ['identifier' =>
         'user3@example.test',
         'status' =>
         'success'],
         ['identifier' =>
         'USER4@EXAMPLE.TEST',
         'status' =>
         'error']],

        'createdgroups' => [1]];
    $make = fn($id,
         $course,
         $timestamp) =>
         (object)['id' =>
         $id,
         'courseid' =>
         $course,
         'userid' =>
         1,
         'rollbackuserid' =>
         2,
         'timerolledback' =>
         $clock,
         'changesjson' =>
         json_encode($payload),
         'timecreated' =>
         $timestamp,
         'filename' =>
         'input.csv',
         'filehash' =>
         str_repeat(
             'a',
             64
         ),
         'rowcount' =>
         3,
         'successcount' =>
         2,
         'errorcount' =>
         1,
         'replacepolicy' =>
         'keep'];
    $DB->history = [1 => $make(1, 10, $clock), 2 => $make(2, 11, $clock)];
    $ctx = context_course::instance(10);
    context_course::instance(11);
    $provider = \local_groupimport\privacy\provider::class;
    $helper = \local_groupimport\local\history_privacy::class;
    check($provider::get_contexts_for_userid(0)->get_contextids() === [], 'Invalid subject rejected');
    foreach ([1, 2, 3, 4] as $id) {
        check($provider::get_contexts_for_userid($id)->get_contextids() === [1010, 1011], "Contexts user$id");
    }
    check($provider::get_contexts_for_userid(5)->get_contextids() === [], 'Unrelated user has no history');
    $list = new \core_privacy\local\request\userlist($ctx);
    $provider::get_users_in_context($list);
    $ids = $list->get_userids();
    sort($ids);
    check($ids === [1, 2, 3, 4], 'Userlist includes failed identifier');
    $approved = fn($id,
         $contexts) =>
         new \core_privacy\local\request\approved_contextlist(
             $DB->users[$id],
             'local_groupimport',
             $contexts
         );
    $provider::export_user_data($approved(2, [1010]));
    $export = \core_privacy\local\request\writer::with_context($ctx)->data;
    $json = json_encode($export);
    check(str_contains($json, 'old@example.test'), 'Historical identity exported');
    check(
        !str_contains(
            $json,
            'user3@example.test'
        ) &&
         !str_contains(
             strtolower($json),
             'user4@example.test'
         ),
        'No third party identity'
    );
    check(count($export) === 1 && count($export[0]->changes['desiredstate']) === 1, 'Subject projection');
    check(!isset($export[0]->filename), 'No other uploader metadata');
    $provider::export_user_data($approved(1, [1010]));
    $json = json_encode(\core_privacy\local\request\writer::with_context($ctx)->data);
    check(
        !str_contains(
            $json,
            'old@example.test'
        ) &&
         !str_contains(
             $json,
             'user3@example.test'
         ),
        'Importer export excludes student identities'
    );
    check($helper::decode('broken-json') === [], 'Malformed JSON never exported raw');
    check(!$helper::contains(['reportrows' => [['identifier' => '']]], 2, ['']), 'Empty identifiers do not match');
    $collision = $helper::filter(['desiredstate' => [['userid' => 3, 'identifier' => 'u2']]], 2, ['u2'], true);
    check(!$collision['desiredstate'], 'Explicit foreign userid overrides identifier collision');
    check(
        $helper::userids(['reportrows' =>
         [['userid' =>
         4,
         'identifier' =>
         'renamed@example.test']]]) === [4],
        'Failed row userid indexed'
    );
    check(
        $helper::contains(
            ['reportrows' =>
            [['userid' =>
            4,
            'identifier' =>
            'renamed@example.test']]],
            4,
            []
        ),
        'Bound failed row survives identity change'
    );
    $foreign = json_encode($DB->history[2]);
    $provider::delete_data_for_user($approved(2, [1010]));
    check(!str_contains($DB->history[1]->changesjson, 'old@example.test'), 'Subject erased from all rows');
    check(str_contains($DB->history[1]->changesjson, 'user3@example.test'), 'Peer data preserved');
    check($DB->history[1]->rollbackuserid === null && $DB->history[1]->timerolledback === null, 'Rollback metadata cleared');
    check(json_encode($DB->history[2]) === $foreign, 'Foreign context unchanged');
    $provider::delete_data_for_users(new \core_privacy\local\request\approved_userlist($ctx, 'local_groupimport', [3, 4]));
    $filtered = json_decode($DB->history[1]->changesjson, true);
    check(!$filtered['desiredstate'] && !$filtered['addedmembers'] && !$filtered['reportrows'], 'Bulk erasure');
    check($filtered['createdgroups'] === [1], 'Nonpersonal restore structure preserved');
    $provider::delete_data_for_users(new \core_privacy\local\request\approved_userlist($ctx, 'local_groupimport', []));
    check(isset($DB->history[1]), 'Empty bulk request inert');
    $provider::delete_data_for_users(new \core_privacy\local\request\approved_userlist($ctx, 'local_groupimport', [1]));
    check(!isset($DB->history[1]) && isset($DB->history[2]), 'Importer deletion scoped');
    $preferences = [2 => ['motion' => 'minimal', 'welcome' => 'seen'], 3 => ['motion' => 'reduced']];
    $uc = context_user::instance(2);
    check(in_array($uc->id, $provider::get_contexts_for_userid(2)->get_contextids(), true), 'Preference context discovered');
    $provider::delete_data_for_users(new \core_privacy\local\request\approved_userlist($uc, 'local_groupimport', [3]));
    check(isset($preferences[2]['motion']), 'Foreign user cannot clear preference');
    $provider::delete_data_for_user($approved(2, [$uc->id]));
    check(empty($preferences[2]) && $preferences[3]['motion'] === 'reduced', 'Both subject preferences cleared');
    $task = new \local_groupimport\task\purge_import_history();
    check($task::retention_days() === 365, 'Default retention');
    foreach ([0, -1, 'invalid', '1.5', 36501] as $invalid) {
        $config['historyretentiondays'] = $invalid;
        check($task::retention_days() === 365, 'Invalid retention fallback');
    }
    foreach ([1, 30, 365, 730, 36500] as $valid) {
        $config['historyretentiondays'] = $valid;
        check($task::retention_days() === $valid, 'Adjustable days');
    }
    $config['historyretentiondays'] = 30;
    $DB->history = [1 =>
         $make(
             1,
             10,
             $clock - 30 * DAYSECS - 1
         ),
         2 =>
         $make(
             2,
             10,
             $clock - 30 * DAYSECS
         ),
         3 =>
         $make(
             3,
             11,
             $clock
         )];
    $task->execute();
    check(!isset($DB->history[1]) && isset($DB->history[2]) && isset($DB->history[3]), 'Strict retention boundary');
    $before = json_encode($DB->history);
    $task->execute();
    check(json_encode($DB->history) === $before, 'Purge idempotent');
    check(
        array_diff(array_unique($DB->writes), ['local_groupimport_history', 'local_groupimport_jobs']) === [],
        'No business-table writes'
    );
    check($closed > 10, 'Recordsets closed');
    echo json_encode(
        ['suite' =>
         'S2-isolated',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false],
        JSON_THROW_ON_ERROR
    ) . PHP_EOL;
}
