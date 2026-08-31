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
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\service;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/group/lib.php');

/**
 * Additive membership mutations used by EasyStud copy and paste actions.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_assignment {

    /**
     * Add a user to one group without changing any other group membership.
     *
     * @param int $courseid Course id.
     * @param int $groupid Destination group id.
     * @param int $userid User id.
     * @return bool True when a membership was added, false when it already existed.
     */
    public static function add_user_to_group(int $courseid, int $groupid, int $userid): bool {
        $group = groups_get_group($groupid);
        if (!$group || (int)$group->courseid !== $courseid) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        if (groups_is_member($groupid, $userid)) {
            return false;
        }

        groups_add_member($groupid, $userid);
        return true;
    }

    /**
     * Add a group to one grouping without changing any other grouping assignment.
     *
     * @param int $courseid Course id.
     * @param int $groupid Group id.
     * @param int $groupingid Destination grouping id.
     * @return bool True when an assignment was added, false when it already existed.
     */
    public static function add_group_to_grouping(int $courseid, int $groupid, int $groupingid): bool {
        global $DB;

        $group = groups_get_group($groupid);
        if (!$group || (int)$group->courseid !== $courseid) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        $DB->get_record('groupings', [
            'id' => $groupingid,
            'courseid' => $courseid,
        ], '*', MUST_EXIST);

        if ($DB->record_exists('groupings_groups', [
            'groupingid' => $groupingid,
            'groupid' => $groupid,
        ])) {
            return false;
        }

        groups_assign_grouping($groupingid, $groupid);
        return true;
    }
}
