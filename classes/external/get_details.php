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
use core_external\external_multiple_structure;
use core_external\external_single_structure;
use core_external\external_value;
use local_groupimport\service\course_state;

/**
 * Return the heavy fields of a few participants, groups or groupings (SM-RENDU step 1).
 *
 * Used when a modal or a detail panel opens. Replaces the data-user-detail and
 * advanced description attributes of the legacy page.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class get_details extends external_api {

    /**
     * Parameters.
     *
     * @return external_function_parameters
     */
    public static function execute_parameters(): external_function_parameters {
        return new external_function_parameters([
            'courseid' => new external_value(PARAM_INT, 'Course id'),
            'type' => new external_value(PARAM_ALPHA, 'user, group or grouping'),
            'ids' => new external_multiple_structure(
                new external_value(PARAM_INT, 'Entity id'),
                'Entity ids, at most ' . course_state::MAX_DETAIL_IDS
            ),
        ]);
    }

    /**
     * Load the details.
     *
     * @param int $courseid Course id.
     * @param string $type Entity type.
     * @param int[] $ids Entity ids.
     * @return array
     */
    public static function execute(int $courseid, string $type, array $ids): array {
        $params = self::validate_parameters(self::execute_parameters(), [
            'courseid' => $courseid,
            'type' => $type,
            'ids' => $ids,
        ]);

        $course = get_course($params['courseid']);
        $context = \context_course::instance($course->id);
        self::validate_context($context);
        require_capability('moodle/course:managegroups', $context);

        $items = course_state::get_details($course, $context, $params['type'], $params['ids']);
        $json = json_encode($items, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
        if ($json === false) {
            throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
        }

        return [
            'type' => $params['type'],
            'items' => $json,
        ];
    }

    /**
     * Return description.
     *
     * @return external_single_structure
     */
    public static function execute_returns(): external_single_structure {
        return new external_single_structure([
            'type' => new external_value(PARAM_ALPHA, 'Entity type'),
            'items' => new external_value(PARAM_RAW, 'Detail items in request order, JSON encoded'),
        ]);
    }
}
