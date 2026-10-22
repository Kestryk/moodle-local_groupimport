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
 * AJAX action: movemembers.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class movemembers implements ajax_action {
    /**
     * Handle the movemembers AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        // X3: ajax_security::require_request() already enforced POST for every action
        // before dispatch reached here, so this own check was redundant.
        $destinationid = required_param('destinationid', PARAM_INT);
        $membersjson = optional_param('membersjson', '', PARAM_RAW);
        if ($membersjson !== '') {
            if (strlen($membersjson) > 8000000) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            $members = json_decode($membersjson, true, 32, JSON_THROW_ON_ERROR);
            if (!is_array($members) || !array_is_list($members)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
        } else {
            $groupids = array_values(required_param_array('groupids', PARAM_INT));
            $userids = array_values(required_param_array('userids', PARAM_INT));
            if (!$groupids || count($groupids) !== count($userids)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            $members = [];
            foreach ($groupids as $index => $groupid) {
                $members[] = ['groupid' => $groupid, 'userid' => $userids[$index]];
            }
        }
        if (count($members) > \local_groupimport\local\move_job::BATCH_SIZE) {
            $job = \local_groupimport\local\move_job::queue(
                (int)$course->id,
                $destinationid,
                $members,
                required_param('requestid', PARAM_ALPHANUMEXT)
            );
            $response['success'] = true;
            $response['background'] = true;
            $response['job'] = \local_groupimport\local\move_job::progress($job);
            $response['message'] = $response['job']['message'];
        } else {
            $result = \local_groupimport\service\membership_transfer::move_members(
                (int)$course->id,
                $destinationid,
                $members
            );
            $response = array_merge($response, $result);
            $response['success'] = true;
            $response['message'] = get_string('membersmovedsummary', 'local_groupimport', (object)$result);
        }

        return $response;
    }
}
