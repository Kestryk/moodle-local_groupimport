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
 * AJAX action: duplicategroup.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class duplicategroup implements ajax_action {
    /**
     * Handle the duplicategroup AJAX action.
     *
     * @param \stdClass $course Course record authorised by the AJAX dispatcher.
     * @param \context_course $context Course context used for capability and membership checks.
     * @param array $response Initial AJAX response to extend with the action result.
     * @return array AJAX response containing the action result.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        // Bound all copied relationships before loading them or creating the new group.
        bulk_action::validate_size(
            $DB->count_records('groups_members', ['groupid' => $groupid]) +
            $DB->count_records('groupings_groups', ['groupid' => $groupid])
        );
        $members = groups_get_members($groupid, 'u.id, u.firstname, u.lastname') ?: [];
        $records = $DB->get_records('groupings_groups', ['groupid' => $groupid], '', 'id, groupingid');
        $newgroup = (object)[
            'courseid' => $course->id,
            'name' => ajax_security::copy_name(
                'groups',
                (int)$course->id,
                get_string('duplicatedname', 'local_groupimport', $group->name)
            ),
        ];
        $searchparts = [$newgroup->name];
        foreach ($members as $member) {
            $searchparts[] = fullname($member);
        }

        $groupingids = [];
        $groupings = \local_groupimport\local\batch_reader::records(
            'groupings',
            array_column($records, 'groupingid'),
            ['courseid' => $course->id]
        );
        $newgroupid = bulk_action::run(count($members) + count($records), static function () use (
            $newgroup,
            $members,
            $records,
            $groupings,
            &$groupingids,
        ): int {
            $newgroupid = groups_create_group($newgroup);
            foreach ($members as $member) {
                if (!groups_add_member($newgroupid, $member->id)) {
                    throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
                }
            }
            foreach ($records as $record) {
                $grouping = $groupings[$record->groupingid] ?? null;
                if ($grouping) {
                    if (!groups_assign_grouping((int)$grouping->id, $newgroupid)) {
                        throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
                    }
                    $groupingids[] = (int)$grouping->id;
                }
            }
            return (int)$newgroupid;
        });

        $response['success'] = true;
        $response['message'] = get_string('groupduplicated', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$newgroupid,
            'name' => format_string($newgroup->name),
            'rawname' => $newgroup->name,
            'description' => '',
            'idnumber' => '',
            'picture' => '',
            'enrolmentkey' => 0,
            'hidepicture' => 0,
            'nativeurl' => (new \moodle_url('/group/group.php', [
                'courseid' => $course->id,
                'id' => $newgroupid,
            ]))->out(false),
            'membercount' => count($members),
            'membercountlabel' => \local_groupimport_count_string('memberscount', count($members)),
            'searchtext' => \core_text::strtolower(trim(implode(' ', $searchparts))),
            'members' => array_map(static function ($member) use ($newgroupid): array {
                return [
                    'userid' => (int)$member->id,
                    'fullname' => fullname($member),
                    'selectableid' => $newgroupid . ':' . $member->id,
                ];
            }, array_values($members)),
            'groupingids' => $groupingids,
            'groupingidscsv' => implode(',', $groupingids),
        ];

        return $response;
    }
}
