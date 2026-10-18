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
 * Isolated schema manager: records DDL without connecting to any database.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Records creation and lets the upgrade contract simulate a DDL failure.
 */
final class upgrade_manager {
    /** @var xmldb_table|null Table created by the hook. */
    public $table = null;
    /** @var int Successful create calls. */
    public $creates = 0;
    /** @var bool Whether the next create must fail. */
    public $failcreate = false;

    /**
     * Stand in for the DB manager accessor only.
     * @return self
     */
    public function get_manager(): self {
        return $this;
    }

    /**
     * Check the recorded schema.
     * @param xmldb_table $table Requested table.
     * @return bool
     */
    public function table_exists(xmldb_table $table): bool {
        return $this->table !== null && $this->table->getName() === $table->getName();
    }

    /**
     * Record creation or simulate an interrupted DDL operation.
     * @param xmldb_table $table Requested table.
     */
    public function create_table(xmldb_table $table): void {
        if ($this->failcreate) {
            throw new RuntimeException('Simulated DDL failure');
        }
        if ($this->table_exists($table)) {
            throw new RuntimeException('Unexpected duplicate create');
        }
        $this->table = $table;
        $this->creates++;
    }
}
