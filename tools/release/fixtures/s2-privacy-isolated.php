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

namespace core_privacy\local\metadata { interface provider {
}
}
namespace core_privacy\local\request\plugin { interface provider {
}
}
namespace core_privacy\local\request {
    interface user_preference_provider {
    }
    interface core_userlist_provider {
        public static function get_users_in_context(userlist $userlist);
        public static function delete_data_for_users(approved_userlist $userlist);
    }
    class contextlist {
        private array $ids = [];
        public function add_from_sql(string $sql, array $params): self {
            foreach ($params as $key => $value) {
                if ($key !== 'contextlevel') {
                    $this->ids[] = \context_course::instance((int)$value)->id;
                }
            }
            return $this;
        }
        public function add_user_context(int $userid): self {
            $this->ids[] = \context_user::instance($userid)->id;
            return $this;
        }
        public function get_contextids(): array {
            return array_values(array_unique($this->ids));
        }
    }
    class approved_contextlist {
        public function __construct(private object $user, private string $component, private array $ids) {
        }
        public function get_user(): object {
            return $this->user;
        }
        public function get_contexts(): array {
            return array_map(fn($id) => \context::$registry[$id], $this->ids);
        }
    }
    class userlist {
        private array $ids = [];
        public function __construct(private \context $context, string $component = '') {
        }
        public function get_context(): \context {
            return $this->context;
        }
        public function add_users(array $ids): self {
            $this->ids = array_values(array_unique(array_merge($this->ids, $ids)));
            return $this;
        }
        public function get_userids(): array {
            return $this->ids;
        }
    }
    class approved_userlist extends userlist {
        public function __construct(\context $context, string $component, array $ids) {
            parent::__construct($context, $component);
            $this->add_users($ids);
        }
    }
    class writer {
        public static array $writers = [];
        public array $data = [];
        public static function with_context(\context $context): self {
            return self::$writers[$context->id] ??= new self();
        }
        public function export_data(array $path, object $data): void {
            $this->data = $data->imports;
        }
    }
}
namespace core\task { abstract class scheduled_task {
}
}
namespace local_groupimport\local {
    class motion { const PREFERENCE = 'motion';
    }
    class guide_welcome { const PREFERENCE = 'welcome';
    }
}
namespace local_groupimport\task { function time(): int {
        return $GLOBALS['clock'];
}
}
namespace {
    define('MOODLE_INTERNAL', true);
    define('IGNORE_MISSING', 0);
    define('SQL_PARAMS_NAMED', 2);
    define('CONTEXT_COURSE', 50);
    define('DAYSECS', 86400);
    class core_text { public static function strtolower(string $s): string {
            return mb_strtolower($s);
    }
    }
    class context {
        public static array $registry = [];
        public function __construct(public int $id, public int $instanceid) {
            self::$registry[$id] = $this;
        }
    }
    class context_course extends context { public static function instance(int $id, int $mode = 0): self {
            return self::$registry[$id + 1000] ?? new self($id + 1000, $id);
    }
    }
    class context_user extends context { public static function instance(int $id): self {
            return self::$registry[$id + 2000] ?? new self($id + 2000, $id);
    }
    }
    class context_system extends context {
    }
    function get_string(string $key, string $component): string {
        return $key;
    }
    function get_config(string $component, string $key): mixed {
        return $GLOBALS['config'][$key] ?? false;
    }
    function get_user_preferences(string $key, mixed $default, int $userid): mixed {
        return $GLOBALS['preferences'][$userid][$key] ?? $default;
    }
    function unset_user_preference(string $key, int $userid): void {
        unset($GLOBALS['preferences'][$userid][$key]);
    }
    class records extends \ArrayIterator { public function close(): void {
            $GLOBALS['closed']++;
    }
    }
    class memory_db {
        public array $users = [];
        public array $history = [];
        public array $writes = [];
        public function get_record(string $table, array $conditions, string $fields, int $strict): mixed {
            if ($table !== 'user') {
                throw new \RuntimeException('Unexpected read');
            }
            return $this->users[$conditions['id']] ?? false;
        }
        public function get_recordset(string $table, array $conditions = [], string $sort = ''): records {
            if ($table !== 'local_groupimport_history') {
                throw new \RuntimeException('Unexpected read');
            }
            return new records(array_map(fn($r) => clone $r, array_filter(
                $this->history,
                fn($r) => !isset($conditions['courseid']) || $r->courseid === $conditions['courseid']
            )));
        }
        public function get_in_or_equal(array $values, int $mode, string $prefix = 'param'): array {
            $params = [];
            foreach ($values as $i => $v) {
                $params[$prefix . $i] = $v;
            }
            return ['IN (' . implode(',', array_map(fn($k) => ':' . $k, array_keys($params))) . ')', $params];
        }
        public function get_records_select(string $table, string $select, array $params, string $sort, string $fields): array {
            if ($table !== 'user' || !preg_match('/LOWER\((email|username|idnumber)\)/', $select, $m)) {
                throw new \RuntimeException('Unexpected SQL');
            }
            return array_filter($this->users, fn($u) => in_array(core_text::strtolower($u->{$m[1]}), $params, true));
        }
        public function delete_records(string $table, array $conditions): void {
            $this->writes[] = $table;
            foreach ($this->history as $id => $row) {
                if (array_all_local($conditions, fn($key, $value) => $row->$key == $value)) {
                    unset($this->history[$id]);
                }
            }
        }
        public function update_record(string $table, object $row): void {
            $this->writes[] = $table;
            foreach ((array)$row as $key => $value) {
                $this->history[$row->id]->$key = $value;
            }
        }
        public function delete_records_select(string $table, string $sql, array $params): void {
            if ($sql !== 'timecreated < :cutoff') {
                throw new \RuntimeException('Unexpected cutoff');
            }
            $this->writes[] = $table;
            $this->history = array_filter($this->history, fn($r) => $r->timecreated >= $params['cutoff']);
        }
    }
    function array_all_local(array $values, callable $predicate): bool {
        foreach ($values as $key => $value) {
            if (!$predicate($key, $value)) {
                return false;
            }
        } return true;
    }
    $checks = 0;
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
    $payload = ['desiredstate' => [['userid' => 2, 'identifier' => 'old@example.test', 'groupname' => 'G'], ['userid' => 3, 'identifier' => 'user3@example.test', 'groupname' => 'G']],
        'addedmembers' => [['userid' => 2, 'groupid' => 1], ['userid' => 3, 'groupid' => 1]], 'removedmembers' => [['userid' => 2, 'groupid' => 2]],
        'reportrows' => [['identifier' => 'old@example.test', 'status' => 'success'], ['identifier' => 'user3@example.test', 'status' => 'success'], ['identifier' => 'USER4@EXAMPLE.TEST', 'status' => 'error']],
        'createdgroups' => [1]];
    $make = fn($id, $course, $timestamp) => (object)['id' => $id, 'courseid' => $course, 'userid' => 1, 'rollbackuserid' => 2, 'timerolledback' => $clock, 'changesjson' => json_encode($payload), 'timecreated' => $timestamp, 'filename' => 'input.csv', 'filehash' => str_repeat('a', 64), 'rowcount' => 3, 'successcount' => 2, 'errorcount' => 1, 'replacepolicy' => 'keep'];
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
    $approved = fn($id, $contexts) => new \core_privacy\local\request\approved_contextlist($DB->users[$id], 'local_groupimport', $contexts);
    $provider::export_user_data($approved(2, [1010]));
    $export = \core_privacy\local\request\writer::with_context($ctx)->data;
    $json = json_encode($export);
    check(str_contains($json, 'old@example.test'), 'Historical identity exported');
    check(!str_contains($json, 'user3@example.test') && !str_contains(strtolower($json), 'user4@example.test'), 'No third party identity');
    check(count($export) === 1 && count($export[0]->changes['desiredstate']) === 1, 'Subject projection');
    check(!isset($export[0]->filename), 'No other uploader metadata');
    $provider::export_user_data($approved(1, [1010]));
    $json = json_encode(\core_privacy\local\request\writer::with_context($ctx)->data);
    check(!str_contains($json, 'old@example.test') && !str_contains($json, 'user3@example.test'), 'Importer export excludes student identities');
    check($helper::decode('broken-json') === [], 'Malformed JSON never exported raw');
    check(!$helper::contains(['reportrows' => [['identifier' => '']]], 2, ['']), 'Empty identifiers do not match');
    $collision = $helper::filter(['desiredstate' => [['userid' => 3, 'identifier' => 'u2']]], 2, ['u2'], true);
    check(!$collision['desiredstate'], 'Explicit foreign userid overrides identifier collision');
    check($helper::userids(['reportrows' => [['userid' => 4, 'identifier' => 'renamed@example.test']]]) === [4], 'Failed row userid indexed');
    check($helper::contains(['reportrows' => [['userid' => 4, 'identifier' => 'renamed@example.test']]], 4, []), 'Bound failed row survives identity change');
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
    $DB->history = [1 => $make(1, 10, $clock - 30 * DAYSECS - 1), 2 => $make(2, 10, $clock - 30 * DAYSECS), 3 => $make(3, 11, $clock)];
    $task->execute();
    check(!isset($DB->history[1]) && isset($DB->history[2]) && isset($DB->history[3]), 'Strict retention boundary');
    $before = json_encode($DB->history);
    $task->execute();
    check(json_encode($DB->history) === $before, 'Purge idempotent');
    check(array_unique($DB->writes) === ['local_groupimport_history'], 'No business-table writes');
    check($closed > 10, 'Recordsets closed');
    echo json_encode(['suite' => 'S2-isolated', 'passed' => true, 'checks' => $checks, 'databaseConnections' => 0, 'runtimeAccess' => false], JSON_THROW_ON_ERROR) . PHP_EOL;
}
