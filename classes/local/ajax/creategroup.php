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
 * AJAX action: creategroup.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class creategroup implements ajax_action {
    /**
     * Handle the creategroup AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $names = \local_groupimport_extract_create_names(required_param('groupname', PARAM_TEXT));
        if (!$names) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        // PERF-SRV: a retried request (lost answer) carries the same token and gets its groups back.
        $requesttoken = \local_groupimport\local\create_request_guard::clean_token(
            optional_param('requesttoken', '', PARAM_ALPHANUMEXT)
        );
        $groupitem = static function (int $groupid, string $name, int $membercount) use ($course): array {
            return [
                'id' => $groupid,
                'name' => format_string($name),
                'rawname' => $name,
                'description' => '',
                'idnumber' => '',
                'picture' => '',
                'enrolmentkey' => 0,
                'hidepicture' => 0,
                'nativeurl' => (new \moodle_url('/group/group.php', [
                    'courseid' => $course->id,
                    'id' => $groupid,
                ]))->out(false),
                'membercount' => $membercount,
                'membercountlabel' => \local_groupimport_count_string('memberscount', $membercount),
            ];
        };

        $groups = [];
        // A replay only matches names of a request that already passed every check below.
        $replayed = \local_groupimport\local\create_request_guard::replay((int)$course->id, $requesttoken, $names);
        if ($replayed !== null) {
            foreach ($replayed as $group) {
                $groups[] = $groupitem(
                    (int)$group->id,
                    (string)$group->name,
                    $DB->count_records('groups_members', ['groupid' => $group->id])
                );
            }
        } else {
            foreach ($names as $name) {
                ajax_security::validate_name($name);
                if (groups_get_group_by_name($course->id, $name)) {
                    throw new \moodle_exception('groupnameexists', 'group', '', $name);
                }
            }

            $createdids = [];
            foreach ($names as $name) {
                if (groups_get_group_by_name($course->id, $name)) {
                    throw new \moodle_exception('groupnameexists', 'group', '', $name);
                }

                $group = (object)[
                    'courseid' => $course->id,
                    'name' => $name,
                ];
                $groupid = groups_create_group($group);
                $createdids[] = (int)$groupid;
                $groups[] = $groupitem((int)$groupid, $name, 0);
            }
            \local_groupimport\local\create_request_guard::remember((int)$course->id, $requesttoken, $names, $createdids);
        }

        $response['success'] = true;
        $response['message'] = count($groups) === 1 ?
            get_string('groupcreated', 'local_groupimport') :
            \local_groupimport_count_string('groupscreatedcount', count($groups));
        $response['group'] = $groups[0];
        $response['groups'] = $groups;

        return $response;
    }
}
