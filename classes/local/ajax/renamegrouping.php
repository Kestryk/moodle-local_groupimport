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
 * AJAX action: renamegrouping.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class renamegrouping implements ajax_action {
    /**
     * Handle the renamegrouping AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);

        ajax_security::validate_name($name);
        if ($name === '') {
            throw new \moodle_exception('invaliddata', 'error');
        }

        if ($name !== (string)$grouping->name && groups_get_grouping_by_name($course->id, $name)) {
            throw new \moodle_exception('groupingnameexists', 'group', '', $name);
        }

        $grouping->name = $name;
        groups_update_grouping($grouping);

        $response['success'] = true;
        $response['message'] = get_string('groupingsaved', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$groupingid,
            'name' => format_string($name),
            'rawname' => $name,
        ];

        return $response;
    }
}
