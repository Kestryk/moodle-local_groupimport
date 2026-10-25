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
 * Standalone lock boundary.
 *
 * @package local_groupimport
 */
final class lock_config {
    /**
     * Return a standalone lock factory.
     *
     * @param string $type Lock factory type.
     */
    public static function get_lock_factory(string $type): object {
        return new class {
            /**
             * Acquire an owned test lock.
             *
             * @param string $key Requested field or string key.
             * @param int $timeout Requested lock timeout.
             */
            public function get_lock(string $key, int $timeout): object {
                return new class {
                    /**
                     * Release the owned test lock.
                     */
                    public function release(): void {
                    }
                };
            }
        };
    }
}
