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
 * AJAX action: removeuser.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class removeuser implements ajax_action {
    /**
     * Handle the removeuser AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $groupid = required_param('groupid', PARAM_INT);
        $userid = required_param('userid', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        ajax_security::remove_members((int)$course->id, [$groupid], [$userid]);

        $response['success'] = true;
        $response['message'] = get_string('userremovedfromgroup', 'local_groupimport');

        return $response;
    }
}
