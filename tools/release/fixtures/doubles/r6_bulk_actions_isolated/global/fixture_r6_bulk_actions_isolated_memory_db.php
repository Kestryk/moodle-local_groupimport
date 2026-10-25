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
 * Isolated fixture double for memory_db.
 */
class fixture_r6_bulk_actions_isolated_memory_db {
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /** @var mixed Isolated fixture state. */
    public array $members = [];
    /** @var mixed Isolated fixture state. */
    public array $groups = [];
    /** @var mixed Isolated fixture state. */
    public array $enrolled = [];
    /** @var mixed Isolated fixture state. */
    public array $events = [];
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /**
     * @var mixed Standalone fixture state.
     */
    /** @var mixed Isolated fixture state. */
    public int $starts = 0;
    /** @var mixed Isolated fixture state. */
    public int $commits = 0;
    /** @var mixed Isolated fixture state. */
    public int $rollbacks = 0;
    /** @var mixed Isolated fixture state. */
    public int $queries = 0;
    /** @var mixed Isolated fixture state. */
    public int $writes = 0;
    /** @var mixed Isolated fixture state. */
    public int $failat = 0;
    /**
     * Perform isolated fixture operation start_delegated_transaction.
     * @return mixed Fixture result.
     */
    public function start_delegated_transaction() {
        $this->starts++;
        $saved = [$this->members, $this->groups, $this->events];
        return new class ($this, $saved) {
            /**
             * Perform isolated fixture operation __construct.
             * @param private $db Fixture argument.
             * @param private $saved Fixture argument.
             * @return mixed Fixture result.
             */
            public function __construct(
                /**
                 * @var mixed Standalone fixture state.
                 */
                /**
                 * @var mixed Standalone fixture state.
                 */
                private $db,
                /** @var mixed Isolated fixture state. */
                private $saved
            ) {
            }
            /**
             * Perform isolated fixture operation allow_commit.
             * @return mixed Fixture result.
             */
            public function allow_commit() {
                $this->db->commits++;
            }
            /**
             * Perform isolated fixture operation rollback.
             * @param mixed $e Fixture argument.
             * @return mixed Fixture result.
             */
            public function rollback($e) {
                [$this->db->members, $this->db->groups, $this->db->events] = $this->saved;
                $this->db->rollbacks++;
                throw $e;
            }
        };
    }
    /**
     * Perform isolated fixture operation mutate.
     * @return mixed Fixture result.
     */
    public function mutate() {
        if (++$this->writes === $this->failat) {
            throw new RuntimeException('native-failure');
        }
    }
    /**
     * Perform isolated fixture operation get_records_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_sql($sql, $params) {
        $this->queries++;
        return $this->enrolled;
    }
    /**
     * Perform isolated fixture operation get_in_or_equal.
     *
     * @param mixed $ids Fixture argument.
     * @param mixed ...$rest Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_in_or_equal($ids, ...$rest) {
        return ['IN (...)', array_values($ids)];
    }
    /**
     * Perform isolated fixture operation get_records_select.
     *
     * @param mixed $table Fixture argument.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @param mixed ...$rest Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_select($table, $sql, $params, ...$rest) {
        $this->queries++;
        $course = $params['courseid'];
        unset($params['courseid']);
        $out = [];
        foreach ($params as $id) {
            if (isset($this->groups[$id]) && $this->groups[$id]->courseid === $course) {
                $out[$id] = $this->groups[$id];
            }
        }return $out;
    }
}
