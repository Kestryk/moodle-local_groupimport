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
 * Isolated fixture double for identifier_database.
 */
class fixture_verify_ajax_contract_identifier_database {
    /**
     * @var mixed Standalone fixture state.
     */
    public $fields = [];
    /**
     * @var mixed Standalone fixture state.
     */
    public $users;
    /**
     * Perform isolated fixture operation __construct.
     * @return mixed Fixture result.
     */
    public function __construct() {
        $this->users = [(object)['id' => 42, 'deleted' => 0, 'firstname' => 'SyntheticFirst',
            'lastname' => 'SyntheticLast', 'username' => 'synthetic-user', 'email' => 'synthetic@example.test',
            'idnumber' => 'SYN-42']];
    }
    /**
     * Perform isolated fixture operation get_record.
     * @param mixed $table Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @param mixed $fields Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_record($table, $conditions, $fields) {
        $this->fields[] = array_keys($conditions)[0];
        foreach ($this->users as $user) {
            if (
                count(array_filter($conditions, static fn($value, $field) =>
                    !isset($user->$field) || $user->$field != $value, ARRAY_FILTER_USE_BOTH)) === 0
            ) {
                return $user;
            }
        }
        return null;
    }
    /**
     * Perform isolated fixture operation get_in_or_equal.
     * @param mixed $fields Fixture argument.
     * @param mixed $style Fixture argument.
     * @param mixed $prefix Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_in_or_equal($fields, $style, $prefix) {
        return ['IN (:field0)', ['field0' => $fields[0]]];
    }
    /**
     * Perform isolated fixture operation get_records_sql.
     * @param mixed $sql Fixture argument.
     * @param mixed $params Fixture argument.
     * @param mixed $start Fixture argument.
     * @param mixed $limit Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_records_sql($sql, $params, $start, $limit) {
        $this->fields[] = 'profile_field_' . $params['field0'];
        return $params['data'] === 'SyntheticSchool' && $params['field0'] === 'School' ? $this->users : [];
    }
}
