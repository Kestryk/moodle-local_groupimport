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

defined('EASYEDU_TEST_MEMBER_TRANSFER') || die();

class moodle_exception extends Exception {
    public string $errorcode;
    public function __construct(string $code, string $component = 'error') {
        $this->errorcode = $code;
        parent::__construct($code);
    }
}
class required_capability_exception extends moodle_exception {
}
class context_course {
    public int $id;
    public static function instance(int $id): self {
        $context = new self();
        $context->id = $id;
        return $context;
    }
}
class transfer_mock_database {
    public array $members = [1 => [10, 11], 2 => [], 3 => [10], 4 => [10], 5 => [10]];
    public array $groups;
    public array $calls = [];
    public bool $privileged = true;
    public array $enrolled = [10, 11];
    public array $protected = [];
    public int $failadd = 0;
    public int $failremove = 0;
    public bool $committed = false;
    public bool $rolledback = false;
    public function __construct() {
        foreach ([1, 2, 3, 4, 5] as $id) {
            $this->groups[$id] = (object)['id' => $id, 'courseid' => $id === 5 ? 99 : 20];
        }
    }
    public int $closed = 0;
    public function get_records_sql(string $sql, array $params): array {
        if (!str_contains($sql, 'SELECT u.id FROM {user}')) {
            throw new RuntimeException('Unexpected enrolled-user query.');
        }
        return array_combine($this->enrolled, array_map(static fn($id) => (object)['id' => $id], $this->enrolled));
    }
    public function get_recordset_sql(string $sql, array $params): transfer_mock_recordset {
        $rows = [];
        if (str_contains($sql, '{groups_members}')) {
            foreach ($this->members as $groupid => $users) {
                if ($this->groups[$groupid]->courseid !== $params['courseid']) {
                    continue;
                }
                foreach ($users as $userid) {
                    $rows[] = (object)['groupid' => $groupid, 'userid' => $userid];
                }
            }
        } else if (!str_contains($sql, '{groupings_groups}')) {
            throw new RuntimeException('Unexpected relationship query.');
        }
        return new transfer_mock_recordset($rows, $this);
    }
    public function start_delegated_transaction(): transfer_mock_transaction {
        return new transfer_mock_transaction($this);
    }
}
class transfer_mock_recordset extends ArrayIterator {
    public function __construct(array $rows, private transfer_mock_database $db) {
        parent::__construct($rows);
    }
    public function close(): void {
        $this->db->closed++;
    }
}
function get_enrolled_sql(context_course $context): array {
    return ['isolated_enrolments', ['courseid' => $context->id]];
}
function isguestuser(int $userid): bool {
    return false;
}
class transfer_mock_transaction {
    private transfer_mock_database $db;
    private array $before;
    public function __construct(transfer_mock_database $db) {
        $this->db = $db;
        $this->before = $db->members;
    }
    public function allow_commit(): void {
        $this->db->committed = true;
    }
    public function rollback(Throwable $exception): void {
        $this->db->members = $this->before;
        $this->db->rolledback = true;
        throw $exception;
    }
}
function require_capability(string $capability, context_course $context): void {
    global $DB;
    if ($capability !== 'moodle/course:managegroups' || $context->id !== 20 || !$DB->privileged) {
        throw new required_capability_exception('nopermissions');
    }
}
function groups_get_group(int $groupid): ?stdClass {
    global $DB;
    return $DB->groups[$groupid] ?? null;
}
function groups_is_member(int $groupid, int $userid): bool {
    global $DB;
    return in_array($userid, $DB->members[$groupid] ?? [], true);
}
function is_enrolled(context_course $context, int $userid): bool {
    global $DB;
    return $context->id === 20 && in_array($userid, $DB->enrolled, true);
}
function groups_remove_member_allowed(stdClass $group, int $userid): bool {
    global $DB;
    return !in_array($group->id . ':' . $userid, $DB->protected, true);
}
function groups_add_member(stdClass $group, int $userid): bool {
    global $DB;
    $DB->calls[] = ['add', $group->id, $userid];
    if ($DB->failadd === $userid) {
        return false;
    }
    $DB->members[$group->id][] = $userid;
    return true;
}
function groups_remove_member(int $groupid, int $userid): bool {
    global $DB;
    $DB->calls[] = ['remove', $groupid, $userid];
    if ($DB->failremove === $userid) {
        return false;
    }
    $DB->members[$groupid] = array_values(array_filter($DB->members[$groupid], fn($id) => $id !== $userid));
    return true;
}
