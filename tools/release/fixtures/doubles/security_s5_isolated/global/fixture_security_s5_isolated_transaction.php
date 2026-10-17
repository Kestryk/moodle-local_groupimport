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
 * Isolated fixture double for transaction.
 */
class fixture_security_s5_isolated_transaction {
    /**
     * @var mixed Standalone fixture state.
     */
    private array $state;
    /**
     * Perform isolated fixture operation __construct.
     * @param object $db Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(
        /**
         * @var mixed Standalone fixture state.
         */
        private object $db
    ) {
        $this->state = unserialize(serialize([$db->members, $db->history, $GLOBALS['pending'], $GLOBALS['events']]));
    }
    /**
     * Perform isolated fixture operation allow_commit.
     * @return mixed Fixture result.
     */
    public function allow_commit() {
        array_push($GLOBALS['events'], ...$GLOBALS['pending']);
        $GLOBALS['pending'] = [];
        $GLOBALS['commits']++;
    }
    /**
     * Perform isolated fixture operation rollback.
     * @param mixed $e Fixture argument.
     * @return mixed Fixture result.
     */
    public function rollback($e) {
        [$this->db->members, $this->db->history, $GLOBALS['pending'], $GLOBALS['events']] = $this->state;
        $GLOBALS['rollbacks']++;
        throw $e;
    }
}
