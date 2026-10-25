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
 * AJAX action: removemembers.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class removemembers implements ajax_action {
    /**
     * Handle the removemembers AJAX action.
     *
     * @param \stdClass $course Course record authorised by the AJAX dispatcher.
     * @param \context_course $context Course context used for capability and membership checks.
     * @param array $response Initial AJAX response to extend with the action result.
     * @return array AJAX response containing the action result.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $groupids = required_param_array('groupids', PARAM_INT);
        $userids = required_param_array('userids', PARAM_INT);
        $removed = bulk_action::run(
            max(count($groupids), count($userids)),
            static function () use ($course, $groupids, $userids) {
                return ajax_security::remove_members((int)$course->id, $groupids, $userids);
            }
        );

        $response['success'] = true;
        $response['removed'] = (int)$removed;
        $response['message'] = \local_groupimport_count_string('membersremoved', (int)$removed);

        return $response;
    }
}
