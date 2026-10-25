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

use local_groupimport\local\bulk_action;

/**
 * AJAX action: deletegroups.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class deletegroups implements ajax_action {
    /**
     * Handle the deletegroups AJAX action.
     *
     * @param \stdClass $course Course record authorised by the AJAX dispatcher.
     * @param \context_course $context Course context used for capability and membership checks.
     * @param array $response Initial AJAX response to extend with the action result.
     * @return array AJAX response containing the action result.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $groupids = required_param_array('groupids', PARAM_INT);
        bulk_action::validate_size(count($groupids));
        $deleted = 0;

        $groups = \local_groupimport\local\batch_reader::records(
            'groups',
            $groupids,
            ['courseid' => $course->id]
        );
        bulk_action::run(count($groupids), static function () use ($groupids, $groups, &$deleted) {
            foreach (array_unique($groupids) as $groupid) {
                if (!isset($groups[$groupid])) {
                    continue;
                }
                if (!groups_delete_group($groupid)) {
                    throw new \moodle_exception('ajaxunexpectederror', 'local_groupimport');
                }
                $deleted++;
            }
        });

        $response['success'] = true;
        $response['deleted'] = (int)$deleted;
        $response['message'] = \local_groupimport_count_string('groupsdeleted', (int)$deleted);

        return $response;
    }
}
