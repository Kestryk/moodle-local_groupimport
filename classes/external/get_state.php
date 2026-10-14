<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\external;

use core_external\external_api;
use core_external\external_function_parameters;
use core_external\external_single_structure;
use core_external\external_value;
use local_groupimport\service\course_state;

/**
 * Return the compact Student Management state of a course (SM-RENDU step 1).
 *
 * The state is returned as one JSON string: its identification keys depend on the plugin
 * settings, and validating thousands of nested items through a declared structure would
 * cost more than building them. The schema is documented in course_state::build().
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_state extends external_api {

    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
        ]);
    }

    /**
     * Build the state.
     *
     * @param int $courseid Course id.
     * @return array
     */
    public static function execute(int $courseid): array {
        ['courseid' => $courseid] = self::validate_parameters(self::execute_parameters(), ['courseid' => $courseid]);

        $course = get_course($courseid);
        $context = \context_course::instance($course->id);
        self::validate_context($context);
        if ((int)$course->id === (int)SITEID) {
            // The front page (SITEID) is not a course whose groups EasyStud manages.
            throw new \moodle_exception('invalidcourseid', 'error');
        }
        require_capability('moodle/course:managegroups', $context);

        $state = course_state::build($course, $context);
        $json = json_encode($state, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) {
            throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
        }

        return [
            'version' => $state['meta']['version'],
            'state' => $json,
        ];
    }

    /**
     * Return description.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'version' => new external_value(PARAM_INT, 'Course state version'),
            'state' => new external_value(PARAM_RAW, 'Compact state, JSON encoded'),
        ]);
    }
}
