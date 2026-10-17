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
 * Isolated fixture double for contextlist.
 */
class fixture_s2_privacy_isolated_contextlist {
    /**
     * @var mixed Standalone fixture state.
     */
    private array $ids = [];
    /**
     * Perform isolated fixture operation add_from_sql.
     * @param string $sql Fixture argument.
     * @param array $params Fixture argument.
     * @return self Fixture result.
     */
    public function add_from_sql(string $sql, array $params): self {
        foreach ($params as $key => $value) {
            if ($key !== 'contextlevel') {
                $this->ids[] = \context_course::instance((int)$value)->id;
            }
        }
        return $this;
    }
    /**
     * Perform isolated fixture operation add_user_context.
     * @param int $userid Fixture argument.
     * @return self Fixture result.
     */
    public function add_user_context(int $userid): self {
        $this->ids[] = \context_user::instance($userid)->id;
        return $this;
    }
    /**
     * Perform isolated fixture operation get_contextids.
     * @return array Fixture result.
     */
    public function get_contextids(): array {
        return array_values(array_unique($this->ids));
    }
}
