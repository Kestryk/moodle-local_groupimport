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

namespace local_groupimport\event;

/**
 * Course import audit event, without input identifiers or file content.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_rolled_back extends \core\event\base {
    /**
     * Initialize the native event schema.
     */
    protected function init(): void {
        $this->data['crud'] = 'u';
        $this->data['edulevel'] = self::LEVEL_TEACHING;
        $this->data['objecttable'] = 'local_groupimport_history';
    }

    /**
     * Return the localized event name.
     * @return string
     */
    public static function get_name(): string {
        return get_string('eventimportrolledback', 'local_groupimport');
    }

    /**
     * Describe the operation using native ids only.
     * @return string
     */
    public function get_description(): string {
        return 'The user with id ' . $this->userid . ' restored import history ' .
            $this->objectid . ' in course ' . $this->courseid . '.';
    }
}
