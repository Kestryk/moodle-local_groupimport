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
class fixture_security_s5_isolated_memory_db {
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
    public array $users = [];
    /** @var mixed Isolated fixture state. */
    public array $groups = [];
    /** @var mixed Isolated fixture state. */
    public array $members = [];
    /** @var mixed Isolated fixture state. */
    public array $history = [];
    /** @var mixed Isolated fixture state. */
    public array $queries = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public bool $failhistory = false;
    /**
     * Perform isolated fixture operation start_delegated_transaction.
     * @return mixed Fixture result.
     */
    public function start_delegated_transaction() {
        return new transaction($this);
    }
    /**
     * Perform isolated fixture operation get_in_or_equal.
     * @param array $values Fixture argument.
     * @param mixed $mode Fixture argument.
     * @param mixed $prefix Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_in_or_equal(array $values, $mode, $prefix = 'value') {
        $params = [];
        foreach ($values as $i => $v) {
            $params[$prefix . $i] = $v;
        }
        return ['IN (' . implode(',', array_map(fn($k)=>':' . $k, array_keys($params))) . ')', $params];
    }
    /**
     * Perform isolated fixture operation sql_null_from_clause.
     * @return mixed Fixture result.
     */
    public function sql_null_from_clause() {
        return '';
    }
    /**
     * Perform isolated fixture operation matches.
     * @param mixed $u Fixture argument.
     * @param mixed $field Fixture argument.
     * @param mixed $value Fixture argument.
     * @param mixed $params Fixture argument.
     * @return bool Fixture result.
     */
    private function matches($u, $field, $value, $params): bool {
        if ($u->deleted || !in_array($u->id, $GLOBALS['enrolled'][$params['enrolcourse']] ?? [], true)) {
            return false;
        }
        if ($field === 'profile') {
            return ($u->profile ?? '') === $value;
        }
        return strcasecmp((string)$u->$field, (string)$value) === 0;
    }
    /**
     * Perform isolated fixture operation get_records_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @param mixed $offset Fixture argument.
     * @param mixed $limit Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_sql($sql, $params, $offset = 0, $limit = 0) {
        $this->queries[] = $sql;
        if (
            !isset($params['enrolcourse']) ||
            !str_contains(
                $sql,
                'JOIN (SELECT userid AS id'
            )
        ) {
            throw new RuntimeException('Unscoped user read');
        }
        if (
            !str_starts_with(
                $sql,
                'SELECT DISTINCT u.id '
            ) &&
            !str_starts_with(
                $sql,
                'SELECT u.id '
            )
        ) {
            throw new RuntimeException('Excess user fields');
        }
        $result = [];
        foreach ($this->users as $u) {
            $field = str_contains(
                $sql,
                'd.data'
            ) ? 'profile' : (preg_match(
                '/u\.(email|username|idnumber) = :lookupvalue/',
                $sql,
                $m
            ) ? $m[1] : '');
            $match = $field !== '' ? $this->matches(
                $u,
                $field,
                $params['lookupvalue'],
                $params
            ) : in_array(
                $u->id,
                $GLOBALS['enrolled'][$params['enrolcourse']] ?? [],
                true
            );
            if ($match && !$u->deleted) {
                $result[$u->id] = (object)['id' => $u->id];
            }
        }return $limit ? array_slice($result, 0, $limit, true) : $result;
    }
    /**
     * Perform isolated fixture operation get_recordset_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_recordset_sql($sql, $params) {
        if (str_contains($sql, 'FROM {groupings}')) {
            return new rows([]);
        }
        if (
            str_contains(
                $sql,
                'FROM {groups_members}'
            )
        ) {
            return new rows(array_values(array_map(
                fn($r)=>
                        (object)$r,
                $this->members
            )));
        }
        if (str_contains($sql, 'FROM {groupings_groups}')) {
            return new rows([]);
        }
        if (
            !str_starts_with(
                $sql,
                'SELECT r.id, inputs.inputindex'
            ) ||
            !str_contains(
                $sql,
                'JOIN (SELECT userid AS id'
            ) ||
            !isset($params['enrolcourse'])
        ) {
            throw new RuntimeException('Unscoped or excessive batch query');
        }
        $this->queries[] = $sql;
        $field = str_contains(
            $sql,
            'd.data'
        ) ? 'profile' : (preg_match(
            '/r\.(email|username|idnumber) = inputs/',
            $sql,
            $m
        ) ? $m[1] : '');
        $result = [];
        foreach ($params as $key => $value) {
            if (!preg_match('/^input(\d+)$/', $key, $m)) {
                continue;
            }
            foreach ($this->users as $u) {
                if (
                    $this->matches(
                        $u,
                        $field,
                        $value,
                        $params
                    )
                ) {
                    $result[] = (object)['id' =>
                    $u->id,
                    'batchinputindex' =>
                    (int)$m[1]];
                }
            }
        }return new rows($result);
    }
    /**
     * Perform isolated fixture operation get_records_select.
     * @param mixed $table Fixture argument.
     * @param mixed $where Fixture argument.
     * @param mixed $params Fixture argument.
     * @param mixed $sort Fixture argument.
     * @param mixed $fields Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_select($table, $where, $params, $sort, $fields) {
        $out = [];
        foreach ($this->users as $id => $u) {
            if (in_array($id, $params, true)) {
                $out[$id] = (object)['id' => $id];
            }
        }
        return $out;
    }
    /**
     * Perform isolated fixture operation get_records.
     * @param mixed $table Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @param mixed $sort Fixture argument.
     * @param mixed $fields Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records($table, $conditions, $sort = '', $fields = '*') {
        if ($table === 'groupings_groups') {
            return [];
        }
        if ($table !== 'groups_members') {
            throw new RuntimeException('Unexpected records');
        }
        $out = [];
        foreach ($this->members as $key => $row) {
            if ($row['groupid'] === $conditions['groupid']) {
                $out[$key] = (object)$row;
            }
        }
        return $out;
    }
    /**
     * Perform isolated fixture operation get_field.
     * @param mixed $table Fixture argument.
     * @param mixed $field Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_field($table, $field, $conditions) {
        return false;
    }
    /**
     * Perform isolated fixture operation record_exists.
     * @param mixed $table Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @return mixed Fixture result.
     */
    public function record_exists($table, $conditions) {
        return false;
    }
    /**
     * Perform isolated fixture operation insert_record.
     * @param mixed $table Fixture argument.
     * @param mixed $record Fixture argument.
     * @return mixed Fixture result.
     */
    public function insert_record($table, $record) {
        if ($this->failhistory) {
            throw new RuntimeException('forced history failure');
        }
        $id = count($this->history) + 1;
        $record = clone$record;
        $record->id = $id;
        $this->history[$id] = $record;
        return $id;
    }
    /**
     * Perform isolated fixture operation set_field.
     * @param mixed $table Fixture argument.
     * @param mixed $field Fixture argument.
     * @param mixed $value Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @return mixed Fixture result.
     */
    public function set_field($table, $field, $value, $conditions) {
        $this->history[$conditions['id']]->$field = $value;
    }
}
