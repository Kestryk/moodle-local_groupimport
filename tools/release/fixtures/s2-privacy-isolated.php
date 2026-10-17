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
    /**
     * Isolated fixture double for provider.
     */
    interface provider {
    }
}
namespace core_privacy\local\request\plugin {
    /**
     * Isolated fixture double for provider.
     */
    interface provider {
    }
}
namespace core_privacy\local\request {
    /**
     * Isolated fixture double for user_preference_provider.
     */
    interface user_preference_provider {
    }
    /**
     * Isolated fixture double for core_userlist_provider.
     */
    interface core_userlist_provider {
        /**
         * Perform isolated fixture operation get_users_in_context.
         * @param userlist $userlist Fixture argument.
         * @return mixed Fixture result.
         */
        public static function get_users_in_context(userlist $userlist);
        /**
         * Perform isolated fixture operation delete_data_for_users.
         * @param approved_userlist $userlist Fixture argument.
         * @return mixed Fixture result.
         */
        public static function delete_data_for_users(approved_userlist $userlist);
    }
    /**
     * Isolated fixture double for contextlist.
     */
    class contextlist {
        /**
         * @var mixed Standalone fixture state.
         */
        private array $ids = [];
        /**
         * Perform isolated fixture operation add_from_sql.
         * @param string $sql Fixture argument.
         * @param array $params Fixture argument.
         * @return self Fixture result.
         */
        public function add_from_sql(string $sql, array $params): self {
            foreach ($params as $key => $value) {
                if ($key !== 'contextlevel') {
                    $this->ids[] = \context_course::instance((int)$value)->id;
                }
            }
            return $this;
        }
        /**
         * Perform isolated fixture operation add_user_context.
         * @param int $userid Fixture argument.
         * @return self Fixture result.
         */
        public function add_user_context(int $userid): self {
            $this->ids[] = \context_user::instance($userid)->id;
            return $this;
        }
        /**
         * Perform isolated fixture operation get_contextids.
         * @return array Fixture result.
         */
        public function get_contextids(): array {
            return array_values(array_unique($this->ids));
        }
    }
    /**
     * Isolated fixture double for approved_contextlist.
     */
    class approved_contextlist {
        /**
         * Perform isolated fixture operation __construct.
         * @param object $user Fixture argument.
         * @param string $component Fixture argument.
         * @param array $ids Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct(
            /**
             * @var mixed Standalone fixture state.
             */
            /**
             * @var mixed Standalone fixture state.
             */
            /**
             * @var mixed Standalone fixture state.
             */
            private object $user,
            private string $component,
            private array $ids
        ) {
        }
        /**
         * Perform isolated fixture operation get_user.
         * @return object Fixture result.
         */
        public function get_user(): object {
            return $this->user;
        }
        /**
         * Perform isolated fixture operation get_contexts.
         * @return array Fixture result.
         */
        public function get_contexts(): array {
            return array_map(fn($id) => \context::$registry[$id], $this->ids);
        }
    }
    /**
     * Isolated fixture double for userlist.
     */
    class userlist {
        /**
         * @var mixed Standalone fixture state.
         */
        private array $ids = [];
        /**
         * Perform isolated fixture operation __construct.
         * @param \context $context Fixture argument.
         * @param string $component Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct(private \context
        $context, string $component = '') {
        }
        /**
         * Perform isolated fixture operation get_context.
         * @return \context Fixture result.
         */
        public function get_context(): \context {
            return $this->context;
        }
        /**
         * Perform isolated fixture operation add_users.
         * @param array $ids Fixture argument.
         * @return self Fixture result.
         */
        public function add_users(array $ids): self {
            $this->ids = array_values(array_unique(array_merge($this->ids, $ids)));
            return $this;
        }
        /**
         * Perform isolated fixture operation get_userids.
         * @return array Fixture result.
         */
        public function get_userids(): array {
            return $this->ids;
        }
    }
    /**
     * Isolated fixture double for approved_userlist.
     */
    class approved_userlist extends userlist {
        /**
         * Perform isolated fixture operation __construct.
         * @param \context $context Fixture argument.
         * @param string $component Fixture argument.
         * @param array $ids Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct(\context $context, string $component, array $ids) {
            parent::__construct($context, $component);
            $this->add_users($ids);
        }
    }
    /**
     * Isolated fixture double for writer.
     */
    class writer {
        /**
         * @var mixed Standalone fixture state.
         */
        public static array $writers = [];
        /**
         * @var mixed Standalone fixture state.
         */
        public array $data = [];
        /**
         * Perform isolated fixture operation with_context.
         * @param \context $context Fixture argument.
         * @return self Fixture result.
         */
        public static function with_context(\context $context): self {
            return self::$writers[$context->id] ??= new self();
        }
        /**
         * Perform isolated fixture operation export_data.
         * @param array $path Fixture argument.
         * @param object $data Fixture argument.
         * @return void Fixture result.
         */
        public function export_data(array $path, object $data): void {
            $this->data = $data->imports;
        }
    }
}
namespace core\task {
    /**
     * Isolated fixture double for scheduled_task.
     */
    abstract class scheduled_task {
    }
}
namespace local_groupimport\local {
    /**
     * Isolated fixture double for motion.
     */
    class motion { const PREFERENCE = 'motion';
    }
    /**
     * Isolated fixture double for guide_welcome.
     */
    class guide_welcome { const PREFERENCE = 'welcome';
    }
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
    define('MOODLE_INTERNAL', true);
    define('IGNORE_MISSING', 0);
    define('SQL_PARAMS_NAMED', 2);
    define('CONTEXT_COURSE', 50);
    define('DAYSECS', 86400);
    /**
     * Isolated fixture double for core_text.
     */
    class core_text {
        /**
         * Perform isolated fixture operation strtolower.
         * @param string $s Fixture argument.
         * @return string Fixture result.
         */
        public static function strtolower(string $s): string {
            return mb_strtolower($s);
        }
    }
    /**
     * Isolated fixture double for context.
     */
    class context {
        /**
         * @var mixed Standalone fixture state.
         */
        public static array $registry = [];
        /**
         * Perform isolated fixture operation __construct.
         * @param int $id Fixture argument.
         * @param int $instanceid Fixture argument.
         * @return mixed Fixture result.
         */
        public function __construct(
            /**
             * @var mixed Standalone fixture state.
             */
            /**
             * @var mixed Standalone fixture state.
             */
            public int $id,
            public int $instanceid
        ) {
            self::$registry[$id] = $this;
        }
    }
    /**
     * Isolated fixture double for context_course.
     */
    class context_course extends context {
        /**
         * Perform isolated fixture operation instance.
         * @param int $id Fixture argument.
         * @param int $mode Fixture argument.
         * @return self Fixture result.
         */
        public static function instance(int $id, int $mode = 0): self {
            return self::$registry[$id + 1000] ?? new self($id + 1000, $id);
        }
    }
    /**
     * Isolated fixture double for context_user.
     */
    class context_user extends context {
        /**
         * Perform isolated fixture operation instance.
         * @param int $id Fixture argument.
         * @return self Fixture result.
         */
        public static function instance(int $id): self {
            return self::$registry[$id + 2000] ?? new self($id + 2000, $id);
        }
    }
    /**
     * Isolated fixture double for context_system.
     */
    class context_system extends context {
    }
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
    /**
     * Isolated fixture double for records.
     */
    class records extends \ArrayIterator {
        /**
         * Perform isolated fixture operation close.
         * @return void Fixture result.
         */
        public function close(): void {
            $GLOBALS['closed']++;
        }
    }
    /**
     * Isolated fixture double for memory_db.
     */
    class memory_db {
        /**
         * @var mixed Standalone fixture state.
         */
        public array $users = [];
        /**
         * @var mixed Standalone fixture state.
         */
        public array $history = [];
        /**
         * @var mixed Standalone fixture state.
         */
        public array $writes = [];
        /**
         * Perform isolated fixture operation get_record.
         * @param string $table Fixture argument.
         * @param array $conditions Fixture argument.
         * @param string $fields Fixture argument.
         * @param int $strict Fixture argument.
         * @return mixed Fixture result.
         */
        public function get_record(string $table, array $conditions, string $fields, int $strict): mixed {
            if ($table !== 'user') {
                throw new \RuntimeException('Unexpected read');
            }
            return $this->users[$conditions['id']] ?? false;
        }
        /**
         * Perform isolated fixture operation get_recordset.
         * @param string $table Fixture argument.
         * @param array $conditions Fixture argument.
         * @param string $sort Fixture argument.
         * @return records Fixture result.
         */
        public function get_recordset(string $table, array $conditions = [], string $sort = ''): records {
            if ($table !== 'local_groupimport_history') {
                throw new \RuntimeException('Unexpected read');
            }
            return new records(array_map(fn($r) => clone $r, array_filter(
                $this->history,
                fn($r) => !isset($conditions['courseid']) || $r->courseid === $conditions['courseid']
            )));
        }
        /**
         * Perform isolated fixture operation get_in_or_equal.
         * @param array $values Fixture argument.
         * @param int $mode Fixture argument.
         * @param string $prefix Fixture argument.
         * @return array Fixture result.
         */
        public function get_in_or_equal(array $values, int $mode, string $prefix = 'param'): array {
            $params = [];
            foreach ($values as $i => $v) {
                $params[$prefix . $i] = $v;
            }
            return ['IN (' . implode(',', array_map(fn($k) => ':' . $k, array_keys($params))) . ')', $params];
        }
        /**
         * Perform isolated fixture operation get_records_select.
         * @param string $table Fixture argument.
         * @param string $select Fixture argument.
         * @param array $params Fixture argument.
         * @param string $sort Fixture argument.
         * @param string $fields Fixture argument.
         * @return array Fixture result.
         */
        public function get_records_select(string $table, string $select, array $params, string $sort, string $fields): array {
            if ($table !== 'user' || !preg_match('/LOWER\((email|username|idnumber)\)/', $select, $m)) {
                throw new \RuntimeException('Unexpected SQL');
            }
            return array_filter($this->users, fn($u) => in_array(core_text::strtolower($u->{$m[1]}), $params, true));
        }
        /**
         * Perform isolated fixture operation delete_records.
         * @param string $table Fixture argument.
         * @param array $conditions Fixture argument.
         * @return void Fixture result.
         */
        public function delete_records(string $table, array $conditions): void {
            $this->writes[] = $table;
            foreach ($this->history as $id => $row) {
                if (array_all_local($conditions, fn($key, $value) => $row->$key == $value)) {
                    unset($this->history[$id]);
                }
            }
        }
        /**
         * Perform isolated fixture operation update_record.
         * @param string $table Fixture argument.
         * @param object $row Fixture argument.
         * @return void Fixture result.
         */
        public function update_record(string $table, object $row): void {
            $this->writes[] = $table;
            foreach ((array)$row as $key => $value) {
                $this->history[$row->id]->$key = $value;
            }
        }
        /**
         * Perform isolated fixture operation delete_records_select.
         * @param string $table Fixture argument.
         * @param string $sql Fixture argument.
         * @param array $params Fixture argument.
         * @return void Fixture result.
         */
        public function delete_records_select(string $table, string $sql, array $params): void {
            if ($sql !== 'timecreated < :cutoff') {
                throw new \RuntimeException('Unexpected cutoff');
            }
            $this->writes[] = $table;
            $this->history = array_filter($this->history, fn($r) => $r->timecreated >= $params['cutoff']);
        }
    }
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
    require $root . '/classes/local/history_privacy.php';
    require $root . '/classes/privacy/provider.php';
    require $root . '/classes/task/purge_import_history.php';
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
    check(array_unique($DB->writes) === ['local_groupimport_history'], 'No business-table writes');
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
