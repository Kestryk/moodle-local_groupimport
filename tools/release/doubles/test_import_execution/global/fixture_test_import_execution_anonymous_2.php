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
 * Named fixture double preserving the previous anonymous implementation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Isolated test double.
 */
class fixture_test_import_execution_anonymous_2 {
            /**
             * @var mixed Standalone fixture state.
             */
            private $events;
            /**
             * Perform isolated fixture operation __construct.
             * @param mixed $events Fixture argument.
             * @return mixed Fixture result.
             */
    public function __construct(&$events) {
        $this->events =& $events;
    }
            /**
             * Perform isolated fixture operation allow_commit.
             * @return mixed Fixture result.
             */
    public function allow_commit() {
        $this->events[] = 'commit';
    }
            /**
             * Perform isolated fixture operation rollback.
             * @param mixed $exception Fixture argument.
             * @return mixed Fixture result.
             */
    public function rollback($exception) {
        $this->events[] = 'rollback';
        throw $exception;
    }
}
