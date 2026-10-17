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
class fixture_security_s4_isolated_memory_db {
    /**
     * @var mixed Standalone fixture state.
     */
    public array $rows = [];
    /**
     * Perform isolated fixture operation record_exists.
     * @param string $table Fixture argument.
     * @param array $conditions Fixture argument.
     * @return bool Fixture result.
     */
    public function record_exists(string $table, array $conditions): bool {
        foreach ($this->rows[$table] ?? [] as $row) {
            $ok = true;
            foreach ($conditions as $key => $value) {
                $ok = $ok && ($row->$key ?? null) === $value;
            }if ($ok) {
                return true;
            }
        }return false;
    }
    /**
     * Perform isolated fixture operation record_exists_select.
     * @param string $table Fixture argument.
     * @param string $sql Fixture argument.
     * @param array $params Fixture argument.
     * @return bool Fixture result.
     */
    public function record_exists_select(string $table, string $sql, array $params): bool {
        $field = str_contains($sql, 'enrolmentkey') ? 'enrolmentkey' : 'idnumber';
        foreach ($this->rows[$table] ?? [] as $row) {
            if (
                $row->courseid === $params['course'] &&
                $row->id !== $params['id'] &&
                ($row->$field ?? '') === $params['value']
            ) {
                return true;
            }
        }return false;
    }
}
