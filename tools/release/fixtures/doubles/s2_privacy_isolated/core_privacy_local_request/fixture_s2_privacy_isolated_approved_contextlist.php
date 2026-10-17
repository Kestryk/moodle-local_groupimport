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

namespace core_privacy\local\request;

/**
 * Isolated fixture double for approved_contextlist.
 */
class fixture_s2_privacy_isolated_approved_contextlist {
    /**
     * Perform isolated fixture operation __construct.
     * @param object $user Fixture argument.
     * @param string $component Fixture argument.
     * @param array $ids Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(
        /**
         * @var mixed Standalone fixture state.
         */
        /**
         * @var mixed Standalone fixture state.
         */
        /**
         * @var mixed Standalone fixture state.
         */
        private object $user,
        /** @var mixed Isolated fixture state. */
        private string $component,
        /** @var mixed Isolated fixture state. */
        private array $ids
    ) {
    }
    /**
     * Perform isolated fixture operation get_user.
     * @return object Fixture result.
     */
    public function get_user(): object {
        return $this->user;
    }
    /**
     * Perform isolated fixture operation get_contexts.
     * @return array Fixture result.
     */
    public function get_contexts(): array {
        return array_map(fn($id) => \context::$registry[$id], $this->ids);
    }
}
