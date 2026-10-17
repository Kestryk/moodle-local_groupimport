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
 * A report was generated for download without logging its personal content.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class report_exported extends \core\event\base {
    /**
     * Initialize the native read-event schema.
     */
    protected function init(): void {
        $this->data['crud'] = 'r';
        $this->data['edulevel'] = self::LEVEL_TEACHING;
        $this->data['objecttable'] = 'local_groupimport_history';
    }

    /**
     * Return the localized event name.
     * @return string
     */
    public static function get_name(): string {
        return get_string('eventreportexported', 'local_groupimport');
    }

    /**
     * Describe report generation with native ids only, not a completed download.
     * @return string
     */
    public function get_description(): string {
        return 'The user with id ' . $this->userid . ' generated the report for import history ' .
            $this->objectid . ' in course ' . $this->courseid . '.';
    }
}
