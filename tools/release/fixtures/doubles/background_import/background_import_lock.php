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

namespace core\lock;

/**
 * Isolated background import lock double.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class background_import_lock {
        /** @var string Exact owned resource. */
    private string $resource;
        /**
         * Retain the exact owned lock key.
         * @param string $resource Owned resource.
         */
    public function __construct(string $resource) {
        $this->resource = $resource;
    }

        /**
         * Release exactly once, detecting leaked or duplicate ownership.
         */
    public function release(): void {
        if (!isset(lock_config::$held[$this->resource])) {
            throw new \RuntimeException('Unowned or duplicate lock release');
        }
        unset(lock_config::$held[$this->resource]);
        lock_config::$released++;
    }
}
