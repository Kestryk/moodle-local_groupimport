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
 * Isolated fixture double for userlist.
 */
class fixture_s2_privacy_isolated_userlist {
    /**
     * @var mixed Standalone fixture state.
     */
    private array $ids = [];
    /** @var \context Fixture context. */
    private \context $context;
    /**
     * Perform isolated fixture operation __construct.
     * @param \context $context Fixture argument.
     * @param string $component Fixture argument.
     * @return mixed Fixture result.
     */
    public function __construct(\context $context, string $component = '') {
        $this->context = $context;
    }
    /**
     * Perform isolated fixture operation get_context.
     * @return \context Fixture result.
     */
    public function get_context(): \context {
        return $this->context;
    }
    /**
     * Perform isolated fixture operation add_users.
     * @param array $ids Fixture argument.
     * @return self Fixture result.
     */
    public function add_users(array $ids): self {
        $this->ids = array_values(array_unique(array_merge($this->ids, $ids)));
        return $this;
    }
    /**
     * Perform isolated fixture operation get_userids.
     * @return array Fixture result.
     */
    public function get_userids(): array {
        return $this->ids;
    }
}
