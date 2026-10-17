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
 * Standalone local_groupimport test fixture or release helper.
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
     * @var mixed Standalone fixture state.
     */
    public string $errorcode;
    /**
     * Perform isolated fixture operation __construct.
     * @param string $code Fixture argument.
     * @param string $component Fixture argument.
     * @return mixed Fixture result.
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
     * @var mixed Standalone fixture state.
     */
    public int $id;
    /**
     * Perform isolated fixture operation instance.
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
     * @var mixed Standalone fixture state.
     */
    public array $members = [1 => [10, 11], 2 => [], 3 => [10], 4 => [10], 5 => [10]];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $groups;
    /**
     * @var mixed Standalone fixture state.
     */
    public array $calls = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public bool $privileged = true;
    /**
     * @var mixed Standalone fixture state.
     */
    public array $enrolled = [10, 11];
    /**
     * @var mixed Standalone fixture state.
     */
    public array $protected = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public int $failadd = 0;
    /**
     * @var mixed Standalone fixture state.
     */
    public int $failremove = 0;
    /**
     * @var mixed Standalone fixture state.
     */
    public bool $committed = false;
    /**
     * @var mixed Standalone fixture state.
     */
    public bool $rolledback = false;
    /**
     * Perform isolated fixture operation __construct.
     * @return mixed Fixture result.
     */
    public function __construct() {
        foreach ([1, 2, 3, 4, 5] as $id) {
            $this->groups[$id] = (object)['id' => $id, 'courseid' => $id === 5 ? 99 : 20];
        }
    }
    /**
     * Perform isolated fixture operation start_delegated_transaction.
     * @return transfer_mock_transaction Fixture result.
     */
    public function start_delegated_transaction(): transfer_mock_transaction {
        return new transfer_mock_transaction($this);
    }
}
/**
 * Isolated fixture double for transfer_mock_transaction.
 */
class transfer_mock_transaction {
    /**
     * @var mixed Standalone fixture state.
     */
    private transfer_mock_database $db;
    /**
     * @var mixed Standalone fixture state.
     */
    private array $before;
    /**
     * Perform isolated fixture operation __construct.
     * @param transfer_mock_database $db Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(transfer_mock_database $db) {
        $this->db = $db;
        $this->before = $db->members;
    }
    /**
     * Perform isolated fixture operation allow_commit.
     * @return void Fixture result.
     */
    public function allow_commit(): void {
        $this->db->committed = true;
    }
    /**
     * Perform isolated fixture operation rollback.
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
 * Perform isolated fixture operation require_capability.
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
 * Perform isolated fixture operation groups_get_group.
 * @param int $groupid Fixture argument.
 * @return ?stdClass Fixture result.
 */
function groups_get_group(int $groupid): ?stdClass {
    global $DB;
    return $DB->groups[$groupid] ?? null;
}
/**
 * Perform isolated fixture operation groups_is_member.
 * @param int $groupid Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_is_member(int $groupid, int $userid): bool {
    global $DB;
    return in_array($userid, $DB->members[$groupid] ?? [], true);
}
/**
 * Perform isolated fixture operation is_enrolled.
 * @param context_course $context Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function is_enrolled(context_course $context, int $userid): bool {
    global $DB;
    return $context->id === 20 && in_array($userid, $DB->enrolled, true);
}
/**
 * Perform isolated fixture operation groups_remove_member_allowed.
 * @param stdClass $group Fixture argument.
 * @param int $userid Fixture argument.
 * @return bool Fixture result.
 */
function groups_remove_member_allowed(stdClass $group, int $userid): bool {
    global $DB;
    return !in_array($group->id . ':' . $userid, $DB->protected, true);
}
/**
 * Perform isolated fixture operation groups_add_member.
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
 * Perform isolated fixture operation groups_remove_member.
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
