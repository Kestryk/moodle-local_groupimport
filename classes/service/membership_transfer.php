<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\service;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/group/lib.php');

/**
 * Atomic transfer of selected group membership pairs, not course enrolments.
 *
 * The eventual AJAX adapter must also enforce login and sesskey. This service
 * enforces course capability, validates the complete selection, uses native
 * group APIs and never removes a membership outside an explicit source pair.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_transfer {

    /**
     * Move source memberships to one destination in the same course.
     *
     * Duplicate pairs from responsive copies are processed once. Existing
     * destination membership is retained; a source equal to destination is a
     * no-op. Other groups and enrolments are untouched. Native managed-membership
     * removal restrictions are respected. Any exception rolls back this batch.
     *
     * @param int $courseid Course id.
     * @param int $destinationid Destination group id.
     * @param array $members Selected arrays containing groupid and userid.
     * @return array Counts of added destination, removed source and unchanged pairs.
     */
    public static function move_members(int $courseid, int $destinationid, array $members): array {
        global $DB;

        $context = \context_course::instance($courseid);
        require_capability('moodle/course:managegroups', $context);
        $destination = groups_get_group($destinationid);
        if (!$destination || (int)$destination->courseid !== $courseid) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }
        if (!$members) {
            throw new \moodle_exception('invaliddata', 'error');
        }

        $transaction = $DB->start_delegated_transaction();
        try {
            $pairs = [];
            // Validate the whole request before emitting any native membership mutation.
            foreach ($members as $member) {
                if (!is_array($member)) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                foreach (['groupid', 'userid'] as $key) {
                    $value = $member[$key] ?? null;
                    if (!is_int($value) && (!is_string($value) || !ctype_digit($value))) {
                        throw new \moodle_exception('invaliddata', 'error');
                    }
                }
                $groupid = (int)($member['groupid'] ?? 0);
                $userid = (int)($member['userid'] ?? 0);
                if ($groupid <= 0 || $userid <= 0) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                $origin = groups_get_group($groupid);
                if (!$origin || (int)$origin->courseid !== $courseid) {
                    throw new \moodle_exception('invalidgroupid', 'error');
                }
                if (!groups_is_member($groupid, $userid) || !is_enrolled($context, $userid)) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                if ($groupid !== $destinationid && !groups_remove_member_allowed($origin, $userid)) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                $pairs[$groupid . ':' . $userid] = ['groupid' => $groupid, 'userid' => $userid];
            }

            $result = ['added' => 0, 'removed' => 0, 'unchanged' => 0];
            foreach ($pairs as $pair) {
                if ($pair['groupid'] === $destinationid) {
                    $result['unchanged']++;
                    continue;
                }
                if (!groups_is_member($destinationid, $pair['userid'])) {
                    // Moodle may return false without throwing (for example, unenrolment).
                    // Never remove the origin unless native destination creation succeeded.
                    if (!groups_add_member($destination, $pair['userid'])) {
                        throw new \moodle_exception('invaliddata', 'error');
                    }
                    $result['added']++;
                }
                if (!groups_remove_member($pair['groupid'], $pair['userid'])) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                $result['removed']++;
            }
            $transaction->allow_commit();
            return $result;
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
        }
    }
}
