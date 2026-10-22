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
use local_groupimport\local\bulk_action;

/**
 * AJAX action: duplicategrouping.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class duplicategrouping implements ajax_action {
    /**
     * Handle the duplicategrouping AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        bulk_action::validate_size($DB->count_records('groupings_groups', ['groupingid' => $groupingid]));
        $records = $DB->get_records('groupings_groups', ['groupingid' => $groupingid], '', 'id, groupid');
        $newgrouping = (object)[
            'courseid' => $course->id,
            'name' => ajax_security::copy_name(
                'groupings',
                (int)$course->id,
                get_string('duplicatedname', 'local_groupimport', $grouping->name)
            ),
        ];
        $groupids = [];
        $searchparts = [$newgrouping->name];
        $newgroupingid = bulk_action::run(count($records), static function () use (
            $newgrouping,
            $records,
            $course,
            &$groupids,
            &$searchparts,
        ): int {
            $newgroupingid = groups_create_grouping($newgrouping);
            foreach ($records as $record) {
                $group = groups_get_group($record->groupid);
                if ($group && (int)$group->courseid === (int)$course->id) {
                    if (!groups_assign_grouping($newgroupingid, (int)$group->id)) {
                        throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
                    }
                    $groupids[] = (int)$group->id;
                    $searchparts[] = $group->name;
                }
            }
            return (int)$newgroupingid;
        });

        $response['success'] = true;
        $response['message'] = get_string('groupingduplicated', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$newgroupingid,
            'name' => format_string($newgrouping->name),
            'rawname' => $newgrouping->name,
            'description' => '',
            'idnumber' => '',
            'configdata' => '',
            'nativeurl' => (new \moodle_url('/group/grouping.php', [
                'courseid' => $course->id,
                'id' => $newgroupingid,
            ]))->out(false),
            'groupcount' => count($groupids),
            'countlabel' => \local_groupimport_count_string('groupscount', count($groupids)),
            'groupids' => $groupids,
            'searchtext' => \core_text::strtolower(trim(implode(' ', $searchparts))),
        ];

        return $response;
    }
}
