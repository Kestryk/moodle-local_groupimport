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
 * Isolated CLI fixture definitions for the existing test contracts.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Isolated fixture double for transfer_mock_database.
 */
class fixture_lib_transfer_mock_database {
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
        $this->boundedreads += str_contains($sql, 'u.id IN') ? 1 : 0;
        $enrolled = array_values(array_filter($this->enrolled, fn($id) => $this->within($params, 'enrolleduser', $id)));
        return $enrolled ? array_combine($enrolled, array_map(static fn($id) => (object)['id' => $id], $enrolled)) : [];
    }
    /**
     * @var int Bounded (selection-only) reads observed.
     */
    public int $boundedreads = 0;
    /**
     * Perform the isolated get_in_or_equal fixture operation.
     *
     * @param array $values Fixture argument.
     * @param int $type Fixture argument.
     * @param string $prefix Fixture argument.
     * @return array Fixture result.
     */
    public function get_in_or_equal(array $values, int $type, string $prefix): array {
        $params = [];
        foreach (array_values($values) as $index => $value) {
            $params[$prefix . $index] = $value;
        }
        return ['IN (:' . implode(', :', array_keys($params)) . ')', $params];
    }
    /**
     * Whether a value passes the optional IN restriction carried by prefixed parameters.
     *
     * @param array $params Fixture argument.
     * @param string $prefix Fixture argument.
     * @param int $value Fixture argument.
     * @return bool Fixture result.
     */
    private function within(array $params, string $prefix, int $value): bool {
        $bound = array_filter($params, static fn($key) => str_starts_with((string)$key, $prefix), ARRAY_FILTER_USE_KEY);
        return !$bound || in_array($value, array_map('intval', $bound), true);
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
                if (!$this->within($params, 'relgroup', $groupid)) {
                    continue;
                }
                foreach ($users as $userid) {
                    if ($this->within($params, 'reluser', $userid)) {
                        $rows[] = (object)['groupid' => $groupid, 'userid' => $userid];
                    }
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
