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
class fixture_security_s7_m5_isolated_memory_db {
    /**
     * @var mixed Standalone fixture state.
     */
    public object $record;
    /**
     * Perform isolated fixture operation get_record.
     * @param mixed $table Fixture argument.
     * @param mixed $conditions Fixture argument.
     * @param mixed $fields Fixture argument.
     * @param mixed $strict Fixture argument.
     * @return mixed Fixture result.
     */
    public function get_record($table, $conditions, $fields, $strict) {
        if ($GLOBALS['auth'] !== ['login', 'moodle/course:managegroups']) {
            throw new RuntimeException('Lookup before auth');
        }
        if (
            $table !== 'local_groupimport_history' ||
            $conditions !== ['id' =>
            7,
            'courseid' =>
            5]
        ) {
            throw new RuntimeException('Unscoped history read');
        }
        return clone $this->record;
    }
}
