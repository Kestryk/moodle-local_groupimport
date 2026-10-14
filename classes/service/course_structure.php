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
 * Read-only course structure data used by the EasyStud course manager.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class course_structure {

    /**
     * Return course participants, groups and groupings in a UI-friendly shape.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Course context.
     * @param bool|null $includedetails Explicit diagnostic override; null follows the default-off defer option.
     * @return array
     */
    public static function get_state(\stdClass $course, \context_course $context, ?bool $includedetails = null): array {
        global $DB, $OUTPUT;

        // No setting/JS activation is shipped here. Missing or false preserves
        // the complete historical payload until the consumer is ready.
        $includedetails = $includedetails ?? !get_config('local_groupimport', 'deferparticipantdetails');

        $users = get_enrolled_users(
            $context,
            '',
            0,
            'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename, ' .
                'u.username, u.email, u.picture, u.imagealt, u.idnumber, u.institution, u.department, ' .
                'u.city, u.country, u.lang' . ($includedetails ? ', u.description' : ''),
            'u.lastname ASC, u.firstname ASC, u.id ASC'
        );

        $groups = groups_get_all_groups(
            $course->id,
            0,
            0,
            'g.id, g.courseid, g.idnumber, g.name, g.description, g.descriptionformat, g.enrolmentkey, g.picture, g.hidepicture'
        );
        $groupings = groups_get_all_groupings($course->id);
        $memberships = self::get_group_memberships($course->id);
        $roles = self::get_user_roles($context);
        $groupingmemberships = self::get_grouping_memberships(array_keys($groupings));

        $useritems = [];
        foreach ($users as $user) {
            $usergroups = $memberships['byuser'][$user->id] ?? [];
            $usergroupings = [];
            foreach ($usergroups as $groupid) {
                foreach ($groupingmemberships['bygroup'][$groupid] ?? [] as $groupingid) {
                    if (isset($groupings[$groupingid])) {
                        $usergroupings[$groupingid] = format_string($groupings[$groupingid]->name);
                    }
                }
            }
            $useritems[$user->id] = [
                'id' => (int)$user->id,
                'fullname' => fullname($user),
                'email' => (string)$user->email,
                'profileimage' => $includedetails ? $OUTPUT->user_picture($user, [
                    'courseid' => $course->id,
                    'size' => 100,
                    'link' => false,
                ]) : '',
                'profileurl' => (new \moodle_url('/user/profile.php', ['id' => $user->id, 'course' => $course->id]))->out(false),
                'username' => (string)$user->username,
                'idnumber' => (string)$user->idnumber,
                'institution' => (string)$user->institution,
                'department' => (string)$user->department,
                'city' => (string)$user->city,
                'country' => (string)$user->country,
                'lang' => (string)$user->lang,
                'description' => $includedetails
                    ? format_text((string)$user->description, FORMAT_HTML, ['context' => $context]) : '',
                'roles' => array_values($roles[$user->id] ?? []),
                'groups' => array_values(array_map(static function($groupid) use ($groups): string {
                    return isset($groups[$groupid]) ? format_string($groups[$groupid]->name) : '';
                }, $usergroups)),
                'groupids' => array_values(array_map('intval', $usergroups)),
                'groupings' => array_values($usergroupings),
                'groupingids' => array_values(array_map('intval', array_keys($usergroupings))),
            ];
            if (!$includedetails) {
                $useritems[$user->id]['detailsdeferred'] = true;
            }
        }

        $groupitems = [];
        foreach ($groups as $group) {
            $memberids = $memberships['bygroup'][$group->id] ?? [];
            $pictureurl = get_group_picture_url($group, $course->id, true);
            $groupitems[$group->id] = [
                'id' => (int)$group->id,
                'name' => format_string($group->name),
                'rawname' => (string)$group->name,
                'idnumber' => (string)($group->idnumber ?? ''),
                'description' => format_text((string)($group->description ?? ''), $group->descriptionformat ?? FORMAT_HTML, [
                    'context' => $context,
                ]),
                'rawdescription' => (string)($group->description ?? ''),
                'enrolmentkey' => !empty($group->enrolmentkey),
                'picture' => !empty($pictureurl) ? $pictureurl->out(false) : '',
                'hidepicture' => !empty($group->hidepicture),
                'memberids' => array_values(array_map('intval', $memberids)),
                'membercount' => count($memberids),
                'groupingids' => array_values(array_map('intval', $groupingmemberships['bygroup'][$group->id] ?? [])),
            ];
        }

        $groupingitems = [];
        foreach ($groupings as $grouping) {
            $groupids = $groupingmemberships['bygrouping'][$grouping->id] ?? [];
            $groupingitems[$grouping->id] = [
                'id' => (int)$grouping->id,
                'name' => format_string($grouping->name),
                'rawname' => (string)$grouping->name,
                'idnumber' => (string)($grouping->idnumber ?? ''),
                'description' => format_text((string)($grouping->description ?? ''), $grouping->descriptionformat ?? FORMAT_HTML, [
                    'context' => $context,
                ]),
                'rawdescription' => (string)($grouping->description ?? ''),
                'configdata' => (string)($grouping->configdata ?? ''),
                'groupids' => array_values(array_map('intval', $groupids)),
                'groupcount' => count($groupids),
            ];
        }

        return [
            'users' => $useritems,
            'groups' => $groupitems,
            'groupings' => $groupingitems,
            'ungroupedgroupids' => self::get_ungrouped_group_ids($groupitems),
        ];
    }

    /**
     * Load deferred heavy fields for exactly one enrolled course participant.
     *
     * Merge these fields into the existing light payload; memberships, card
     * metadata, allowed copy fields and selection remain consumer-owned.
     * The API uses the same course permission as the existing full-state page.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Matching course context.
     * @param int $userid Enrolled user id.
     * @return array Deferred profile fields with the existing HTML formatting.
     */
    public static function get_user_details(\stdClass $course, \context_course $context, int $userid): array {
        global $DB, $OUTPUT;

        if ((int)$course->id !== (int)$context->instanceid) {
            throw new \coding_exception('Course and context must match.');
        }
        require_capability('moodle/course:managegroups', $context);
        if ($userid < 1 || !is_enrolled($context, $userid)) {
            throw new \moodle_exception('invaliduser', 'error');
        }
        $user = $DB->get_record('user', ['id' => $userid, 'deleted' => 0], '*', MUST_EXIST);
        return [
            'id' => $userid,
            'profileimage' => $OUTPUT->user_picture($user, [
                'courseid' => $course->id,
                'size' => 100,
                'link' => false,
            ]),
            'description' => course_state::format_user_description($user, course_state::get_field_access($context)),
            'detailsdeferred' => false,
        ];
    }

    /**
     * Return group memberships indexed by user and by group.
     *
     * @param int $courseid Course id.
     * @return array
     */
    protected static function get_group_memberships(int $courseid): array {
        global $DB;

        $sql = "SELECT gm.id, gm.userid, gm.groupid
                  FROM {groups_members} gm
                  JOIN {groups} g ON g.id = gm.groupid
                 WHERE g.courseid = :courseid
              ORDER BY gm.userid ASC, gm.groupid ASC";
        $records = $DB->get_records_sql($sql, ['courseid' => $courseid]);
        $byuser = [];
        $bygroup = [];

        foreach ($records as $record) {
            $byuser[(int)$record->userid][] = (int)$record->groupid;
            $bygroup[(int)$record->groupid][] = (int)$record->userid;
        }

        return [
            'byuser' => $byuser,
            'bygroup' => $bygroup,
        ];
    }

    /**
     * Return course role labels indexed by user.
     *
     * @param \context_course $context Course context.
     * @return array
     */
    protected static function get_user_roles(\context_course $context): array {
        global $DB;

        $sql = "SELECT ra.id, ra.userid, r.id AS roleid, r.name, r.shortname
                  FROM {role_assignments} ra
                  JOIN {role} r ON r.id = ra.roleid
                 WHERE ra.contextid = :contextid
              ORDER BY r.sortorder ASC, r.shortname ASC";
        $records = $DB->get_records_sql($sql, ['contextid' => $context->id]);
        $roles = [];

        foreach ($records as $record) {
            $role = (object)[
                'id' => (int)$record->roleid,
                'name' => $record->name,
                'shortname' => $record->shortname,
            ];
            $roles[(int)$record->userid][(int)$record->roleid] = role_get_name($role, $context);
        }

        return $roles;
    }

    /**
     * Return grouping memberships indexed both ways.
     *
     * @param array $groupingids Grouping ids.
     * @return array
     */
    protected static function get_grouping_memberships(array $groupingids): array {
        global $DB;

        if (empty($groupingids)) {
            return [
                'bygroup' => [],
                'bygrouping' => [],
            ];
        }

        [$insql, $params] = $DB->get_in_or_equal($groupingids, SQL_PARAMS_NAMED);
        $records = $DB->get_records_select('groupings_groups', "groupingid $insql", $params, 'groupingid ASC, groupid ASC');
        $bygroup = [];
        $bygrouping = [];

        foreach ($records as $record) {
            $bygroup[(int)$record->groupid][] = (int)$record->groupingid;
            $bygrouping[(int)$record->groupingid][] = (int)$record->groupid;
        }

        return [
            'bygroup' => $bygroup,
            'bygrouping' => $bygrouping,
        ];
    }

    /**
     * Groups without a grouping still need an obvious place in the tree.
     *
     * @param array $groups Group data.
     * @return array
     */
    protected static function get_ungrouped_group_ids(array $groups): array {
        $ids = [];
        foreach ($groups as $group) {
            if (empty($group['groupingids'])) {
                $ids[] = (int)$group['id'];
            }
        }

        return $ids;
    }
}
