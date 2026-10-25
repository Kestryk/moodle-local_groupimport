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
 * AJAX action: updategroupadvanced.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class updategroupadvanced implements ajax_action {
    /**
     * Handle the updategroupadvanced AJAX action.
     *
     * @param \stdClass $course Course record authorised by the AJAX dispatcher.
     * @param \context_course $context Course context used for capability and membership checks.
     * @param array $response Initial AJAX response to extend with the action result.
     * @return array AJAX response containing the action result.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $idnumber = optional_param('idnumber', '', PARAM_RAW_TRIMMED);
        $description = optional_param('description', '', PARAM_RAW);
        $enrolmentkey = optional_param('enrolmentkey', '', PARAM_RAW_TRIMMED);
        $deletepicture = optional_param('deletepicture', 0, PARAM_BOOL);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id || $name === '') {
            throw new \moodle_exception('invaliddata', 'error');
        }

        if (
            $name !== (string)$group->name &&
                ($existing = groups_get_group_by_name($course->id, $name)) && (int)$existing !== $groupid
        ) {
            throw new \moodle_exception('groupnameexists', 'group', '', $name);
        }

        ajax_security::validate_entity(
            'groups',
            (int)$course->id,
            $groupid,
            $name,
            has_capability('moodle/course:changeidnumber', $context) ? $idnumber : null,
            $enrolmentkey,
            (string)($group->enrolmentkey ?? '')
        );
        $imagepath = $deletepicture ? null : ajax_security::image_upload($_FILES['imagefile'] ?? null, $course);

        $data = (object)[
            'id' => $groupid,
            'courseid' => $course->id,
            'name' => $name,
            'description' => $description,
            'descriptionformat' => FORMAT_HTML,
        ];

        if ($enrolmentkey !== '') {
            $data->enrolmentkey = $enrolmentkey;
        }

        if (has_capability('moodle/course:changeidnumber', $context)) {
            $data->idnumber = $idnumber;
        }

        groups_update_group($data);

        $group = groups_get_group($groupid);
        $fs = get_file_storage();
        if ($deletepicture) {
            $fs->delete_area_files($context->id, 'group', 'icon', $groupid);
            $DB->set_field('groups', 'picture', 0, ['id' => $groupid]);
            $group->picture = 0;
        } else if ($imagepath !== null) {
            if ($rev = process_new_icon($context, 'group', 'icon', $groupid, $imagepath)) {
                $DB->set_field('groups', 'picture', $rev, ['id' => $groupid]);
                $group->picture = $rev;
            }
        }

        \cache_helper::invalidate_by_definition('core', 'groupdata', [], [$course->id]);
        $group = groups_get_group($groupid);
        $pictureurl = get_group_picture_url($group, $course->id, true);

        $response['success'] = true;
        $response['message'] = get_string('groupsaved', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$groupid,
            'name' => format_string($group->name),
            'rawname' => (string)$group->name,
            'description' => format_text((string)$group->description, $group->descriptionformat ?? FORMAT_HTML, [
                'context' => $context,
            ]),
            'rawdescription' => (string)$group->description,
            'idnumber' => (string)($group->idnumber ?? ''),
            'enrolmentkey' => !empty($group->enrolmentkey) ? 1 : 0,
            'picture' => !empty($pictureurl) ? $pictureurl->out(false) : '',
            'nativeurl' => (new \moodle_url('/group/group.php', [
                'courseid' => $course->id,
                'id' => $groupid,
            ]))->out(false),
        ];

        return $response;
    }
}
