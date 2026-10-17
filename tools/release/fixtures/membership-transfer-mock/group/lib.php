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
defined('EASYEDU_TEST_MEMBER_TRANSFER') || die();

/**
 * Isolated fixture double for moodle_exception.
 */
class moodle_exception extends Exception {
    /**
     * @var string In-memory fixture state.
     */
    public string $errorcode;
    /**
     * Perform the isolated __construct fixture operation.
     *
     * @param string $code Fixture argument.
     * @param string $component Fixture argument.
     */
    public function __construct(string $code, string $component = 'error') {
        $this->errorcode = $code;
        parent::__construct($code);
    }
}
/**
 * Isolated fixture double for required_capability_exception.
 */
class required_capability_exception extends moodle_exception {
}
/**
 * Isolated fixture double for context_course.
 */
class context_course {
    /**
     * @var int In-memory fixture state.
     */
    public int $id;
    /**
     * Perform the isolated instance fixture operation.
     *
     * @param int $id Fixture argument.
     * @return self Fixture result.
     */
    public static function instance(int $id): self {
        $context = new self();
        $context->id = $id;
        return $context;
    }
}
/**
 * Isolated fixture double for transfer_mock_database.
 */
class transfer_mock_database {
    /**
     * @var array In-memory fixture state.
     */
    public array $members = [1 => [10, 11], 2 => [], 3 => [10], 4 => [10], 5 => [10]];
    /**
     * @var array In-memory fixture state.
     */
    public array $groups;
    /**
     * @var array In-memory fixture state.
     */
    public array $calls = [];
    /**
     * @var bool In-memory fixture state.
     */
    public bool $privileged = true;
    /**
     * @var array In-memory fixture state.
     */
    public array $enrolled = [10, 11];
    /**
     * @var array In-memory fixture state.
     */
    public array $protected = [];
    /**
     * @var int In-memory fixture state.
     */
    public int $failadd = 0;
    /**
     * @var int In-memory fixture state.
     */
    public int $failremove = 0;
    /**
     * @var bool In-memory fixture state.
     */
    public bool $committed = false;
    /**
     * @var bool In-memory fixture state.
     */
    public bool $rolledback = false;
    /**
     * Perform the isolated __construct fixture operation.
     *
     */
    public function __construct() {
        foreach ([1, 2, 3, 4, 5] as $id) {
            $this->groups[$id] = (object)['id' => $id, 'courseid' => $id === 5 ? 99 : 20];
        }
    }
    /**
     * @var int In-memory fixture state.
     */
    public int $closed = 0;
    /**
     * Perform the isolated get_records_sql fixture operation.
     *
     * @param string $sql Fixture argument.
     * @param array $params Fixture argument.
     * @return array Fixture result.
     */
    public function get_records_sql(string $sql, array $params): array {
        if (!str_contains($sql, 'SELECT u.id FROM {user}')) {
            throw new RuntimeException('Unexpected enrolled-user query.');
        }
        return array_combine($this->enrolled, array_map(static fn($id) => (object)['id' => $id], $this->enrolled));
    }
    /**
     * Perform the isolated get_recordset_sql fixture operation.
     *
     * @param string $sql Fixture argument.
     * @param array $params Fixture argument.
     * @return transfer_mock_recordset Fixture result.
     */
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
    /**
     * Perform the isolated start_delegated_transaction fixture operation.
     *
     * @return transfer_mock_transaction Fixture result.
     */
    public function start_delegated_transaction(): transfer_mock_transaction {
        return new transfer_mock_transaction($this);
    }
}
/**
 * Isolated fixture double for transfer_mock_recordset.
 */
class transfer_mock_recordset extends ArrayIterator {
    /**
     * Perform the isolated __construct fixture operation.
     *
     * @param array $rows Fixture argument.
     * @param transfer_mock_database $db Fixture argument.
     */
    public function __construct(
        array $rows,
        /** @var transfer_mock_database In-memory recordset owner. */
        private transfer_mock_database $db
    ) {
        parent::__construct($rows);
    }
    /**
     * Perform the isolated close fixture operation.
     *
     * @return void Fixture result.
     */
    public function close(): void {
        $this->db->closed++;
    }
}
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
/**
 * Isolated fixture double for transfer_mock_transaction.
 */
class transfer_mock_transaction {
    /**
     * @var transfer_mock_database In-memory fixture state.
     */
    private transfer_mock_database $db;
    /**
     * @var array In-memory fixture state.
     */
    private array $before;
    /**
     * Perform the isolated __construct fixture operation.
     *
     * @param transfer_mock_database $db Fixture argument.
     */
    public function __construct(transfer_mock_database $db) {
        $this->db = $db;
        $this->before = $db->members;
    }
    /**
     * Perform the isolated allow_commit fixture operation.
     *
     * @return void Fixture result.
     */
    public function allow_commit(): void {
        $this->db->committed = true;
    }
    /**
     * Perform the isolated rollback fixture operation.
     *
     * @param Throwable $exception Fixture argument.
     * @return void Fixture result.
     */
    public function rollback(Throwable $exception): void {
        $this->db->members = $this->before;
        $this->db->rolledback = true;
        throw $exception;
    }
}
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
 * @param int $groupid Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_remove_member(int $groupid, int $userid): bool {
    global $DB;
    $DB->calls[] = ['remove', $groupid, $userid];
    if ($DB->failremove === $userid) {
        return false;
    }
    $DB->members[$groupid] = array_values(array_filter($DB->members[$groupid], fn($id) => $id !== $userid));
    return true;
}
