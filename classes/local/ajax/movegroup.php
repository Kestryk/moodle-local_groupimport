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

/**
 * AJAX action: movegroup.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class movegroup implements ajax_action {
    /**
     * @inheritDoc
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $targetgroupingid = optional_param('groupingid', 0, PARAM_INT);
        $removefromorigin = optional_param('removefromorigin', 1, PARAM_BOOL);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        if ($targetgroupingid > 0) {
            $grouping = $DB->get_record(
                'groupings',
                ['id' => $targetgroupingid, 'courseid' => $course->id],
                '*',
                MUST_EXIST
            );
            $existing = $DB->record_exists('groupings_groups', ['groupingid' => $grouping->id, 'groupid' => $groupid]);
            if ($removefromorigin) {
                \local_groupimport_remove_group_from_other_groupings($groupid, $course->id, $targetgroupingid);
            }
            if (!$existing) {
                groups_assign_grouping($grouping->id, $groupid);
            }
            $response['message'] = get_string('groupmovedtogrouping', 'local_groupimport', format_string($grouping->name));
            $response['existing'] = $existing;
        } else {
            \local_groupimport_remove_group_from_other_groupings($groupid, $course->id);
            $response['message'] = get_string('groupremovedfromgroupings', 'local_groupimport');
            $response['existing'] = false;
        }

        $response['success'] = true;

        return $response;
    }
}
