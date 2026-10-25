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
 * Isolated fixture double for transfer_mock_transaction.
 */
class fixture_lib_transfer_mock_transaction {
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
