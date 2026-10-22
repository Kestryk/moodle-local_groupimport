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
 * AJAX action: addusers.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class addusers implements ajax_action {
    /**
     * Handle the addusers AJAX action.
     */
    public static function handle(\stdClass $course, \context_course $context, array $response): array {
        $groupid = required_param('groupid', PARAM_INT);
        $userids = required_param_array('userids', PARAM_INT);
        bulk_action::validate_size(count($userids));
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        // Enrolment is read for the selected users only, not for the whole course.
        $enrolledusers = \local_groupimport\local\batch_reader::enrolled($context, $userids);
        $added = 0;
        $skipped = 0;
        $existing = 0;
        bulk_action::run(count($userids), static function () use (
            $course,
            $groupid,
            $userids,
            $enrolledusers,
            &$added,
            &$skipped,
            &$existing,
        ) {
            $eligible = [];
            foreach (array_unique($userids) as $userid) {
                if (!isset($enrolledusers[$userid])) {
                    $skipped++;
                    continue;
                }
                $eligible[] = $userid;
            }
            $results = \local_groupimport\service\membership_assignment::add_users_to_group(
                (int)$course->id,
                $groupid,
                $eligible
            );
            foreach ($results as $wasadded) {
                if ($wasadded) {
                    $added++;
                } else {
                    $existing++;
                }
            }
        });

        $response['success'] = true;
        $response['added'] = $added;
        $response['existing'] = $existing;
        $response['skipped'] = $skipped;
        $response['message'] = get_string('usersaddsummary', 'local_groupimport', (object)[
            'added' => $added,
            'existing' => $existing,
        ]);
        if ($skipped > 0) {
            $response['message'] .= ' ' . get_string('bulkitemsskipped', 'local_groupimport', $skipped);
        }

        return $response;
    }
}
