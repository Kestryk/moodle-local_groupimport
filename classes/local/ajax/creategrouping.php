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

namespace local_groupimport\local\ajax;

use local_groupimport\local\ajax_security;

/**
 * AJAX action: creategrouping.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class creategrouping implements ajax_action {
    /**
     * Handle the creategrouping AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $names = \local_groupimport_extract_create_names(required_param('groupingname', PARAM_TEXT));
        if (!$names) {
            throw new \moodle_exception('invaliddata', 'error');
        }

        foreach ($names as $name) {
            ajax_security::validate_name($name);
            if (groups_get_grouping_by_name($course->id, $name)) {
                throw new \moodle_exception('groupingnameexists', 'group', '', $name);
            }
        }

        $groupings = [];
        foreach ($names as $name) {
            if (groups_get_grouping_by_name($course->id, $name)) {
                throw new \moodle_exception('groupingnameexists', 'group', '', $name);
            }

            $grouping = (object)[
                'courseid' => $course->id,
                'name' => $name,
            ];
            $groupingid = groups_create_grouping($grouping);
            $groupings[] = [
                'id' => (int)$groupingid,
                'name' => format_string($name),
                'rawname' => $name,
                'description' => '',
                'idnumber' => '',
                'configdata' => '',
                'nativeurl' => (new \moodle_url('/group/grouping.php', [
                    'courseid' => $course->id,
                    'id' => $groupingid,
                ]))->out(false),
                'groupcount' => 0,
                'countlabel' => \local_groupimport_count_string('groupscount', 0),
            ];
        }

        $response['success'] = true;
        $response['message'] = count($groupings) === 1 ?
            get_string('groupingcreated', 'local_groupimport') :
            \local_groupimport_count_string('groupingscreatedcount', count($groupings));
        $response['grouping'] = $groupings[0];
        $response['groupings'] = $groupings;

        return $response;
    }
}
