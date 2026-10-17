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
 * Isolated fixture double for core_userlist_provider.
 */
interface fixture_s2_privacy_isolated_core_userlist_provider {
    /**
     * Perform isolated fixture operation get_users_in_context.
     * @param userlist $userlist Fixture argument.
     * @return mixed Fixture result.
     */
    public static function get_users_in_context(userlist $userlist);
    /**
     * Perform isolated fixture operation delete_data_for_users.
     * @param approved_userlist $userlist Fixture argument.
     * @return mixed Fixture result.
     */
    public static function delete_data_for_users(approved_userlist $userlist);
}
