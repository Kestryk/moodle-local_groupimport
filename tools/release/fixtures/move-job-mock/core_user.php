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

defined('MOODLE_INTERNAL') || die();

/**
 * Standalone identity double.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class core_user {
    /**
     * Return the native notification sender boundary.
     */
    public static function get_noreply_user(): object {
        return (object)['id' => -10];
    }
    /**
     * Return the job's enabled actor.
     */
    public static function get_user(int $id, string $fields = '*', int $strictness = 0): object {
        return (object)['id' => $id, 'deleted' => 0, 'suspended' => 0];
    }
}
