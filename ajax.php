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

/**
 * AJAX endpoint for EasyStud course group actions.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use local_groupimport\local\ajax_security;
use local_groupimport\local\bulk_action;

define('AJAX_SCRIPT', true);

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/gdlib.php');

$courseid = required_param('courseid', PARAM_INT);
$action = required_param('action', PARAM_ALPHA);

ajax_security::require_request((string)($_SERVER['REQUEST_METHOD'] ?? ''), $courseid);
require_sesskey();

$course = get_course($courseid);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$response = ['success' => false];

try {
    if ($action === 'userdetails') {
        $userid = required_param('userid', PARAM_INT);
        $response['details'] = \local_groupimport\service\course_structure::get_user_details(
            $course,
            $context,
            $userid
        );
        $response['success'] = true;
    } else if ($action === 'creategroup') {
        $names = local_groupimport_extract_create_names(required_param('groupname', PARAM_TEXT));
        if (!$names) {
            throw new moodle_exception('invaliddata', 'error');
        }

        foreach ($names as $name) {
            ajax_security::validate_name($name);
            if (groups_get_group_by_name($course->id, $name)) {
                throw new moodle_exception('groupnameexists', 'group', '', $name);
            }
        }

        $groups = [];
        foreach ($names as $name) {
            if (groups_get_group_by_name($course->id, $name)) {
                throw new moodle_exception('groupnameexists', 'group', '', $name);
            }

            $group = (object)[
                'courseid' => $course->id,
                'name' => $name,
            ];
            $groupid = groups_create_group($group);
            $groups[] = [
                'id' => (int)$groupid,
                'name' => format_string($name),
                'rawname' => $name,
                'description' => '',
                'idnumber' => '',
                'picture' => '',
                'enrolmentkey' => 0,
                'hidepicture' => 0,
                'nativeurl' => (new moodle_url('/group/group.php', [
                    'courseid' => $course->id,
                    'id' => $groupid,
                ]))->out(false),
                'membercount' => 0,
                'membercountlabel' => local_groupimport_count_string('memberscount', 0),
            ];
        }

        $response['success'] = true;
        $response['message'] = count($groups) === 1 ?
            get_string('groupcreated', 'local_groupimport') :
            local_groupimport_count_string('groupscreatedcount', count($groups));
        $response['group'] = $groups[0];
        $response['groups'] = $groups;
    } else if ($action === 'creategrouping') {
        $names = local_groupimport_extract_create_names(required_param('groupingname', PARAM_TEXT));
        if (!$names) {
            throw new moodle_exception('invaliddata', 'error');
        }

        foreach ($names as $name) {
            ajax_security::validate_name($name);
            if (groups_get_grouping_by_name($course->id, $name)) {
                throw new moodle_exception('groupingnameexists', 'group', '', $name);
            }
        }

        $groupings = [];
        foreach ($names as $name) {
            if (groups_get_grouping_by_name($course->id, $name)) {
                throw new moodle_exception('groupingnameexists', 'group', '', $name);
            }

            $grouping = (object)[
                'courseid' => $course->id,
                'name' => $name,
            ];
            $groupingid = groups_create_grouping($grouping);
            $groupings[] = [
                'id' => (int)$groupingid,
                'name' => format_string($name),
                'rawname' => $name,
                'description' => '',
                'idnumber' => '',
                'configdata' => '',
                'nativeurl' => (new moodle_url('/group/grouping.php', [
                    'courseid' => $course->id,
                    'id' => $groupingid,
                ]))->out(false),
                'groupcount' => 0,
                'countlabel' => local_groupimport_count_string('groupscount', 0),
            ];
        }

        $response['success'] = true;
        $response['message'] = count($groupings) === 1 ?
            get_string('groupingcreated', 'local_groupimport') :
            local_groupimport_count_string('groupingscreatedcount', count($groupings));
        $response['grouping'] = $groupings[0];
        $response['groupings'] = $groupings;
    } else if ($action === 'renamegroup') {
        $groupid = required_param('groupid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id || $name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        if ($name !== (string)$group->name && groups_get_group_by_name($course->id, $name)) {
            throw new moodle_exception('groupnameexists', 'group', '', $name);
        }

        $group->name = $name;
        groups_update_group($group);

        $response['success'] = true;
        $response['message'] = get_string('groupsaved', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$groupid,
            'name' => format_string($name),
            'rawname' => $name,
        ];
    } else if ($action === 'renamegrouping') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);

        ajax_security::validate_name($name);
        if ($name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        if ($name !== (string)$grouping->name && groups_get_grouping_by_name($course->id, $name)) {
            throw new moodle_exception('groupingnameexists', 'group', '', $name);
        }

        $grouping->name = $name;
        groups_update_grouping($grouping);

        $response['success'] = true;
        $response['message'] = get_string('groupingsaved', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$groupingid,
            'name' => format_string($name),
            'rawname' => $name,
        ];
    } else if ($action === 'updategroupadvanced') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $idnumber = optional_param('idnumber', '', PARAM_RAW_TRIMMED);
        $description = optional_param('description', '', PARAM_RAW);
        $enrolmentkey = optional_param('enrolmentkey', '', PARAM_RAW_TRIMMED);
        $deletepicture = optional_param('deletepicture', 0, PARAM_BOOL);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id || $name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        if (
            $name !== (string)$group->name &&
                ($existing = groups_get_group_by_name($course->id, $name)) && (int)$existing !== $groupid
        ) {
            throw new moodle_exception('groupnameexists', 'group', '', $name);
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

        cache_helper::invalidate_by_definition('core', 'groupdata', [], [$course->id]);
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
            'nativeurl' => (new moodle_url('/group/group.php', [
                'courseid' => $course->id,
                'id' => $groupid,
            ]))->out(false),
        ];
    } else if ($action === 'updategroupingadvanced') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $name = trim(required_param('name', PARAM_TEXT));
        $idnumber = optional_param('idnumber', '', PARAM_RAW_TRIMMED);
        $description = optional_param('description', '', PARAM_RAW);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);

        ajax_security::validate_name($name);
        if ($name === '') {
            throw new moodle_exception('invaliddata', 'error');
        }

        if (
            $name !== (string)$grouping->name &&
                ($existing = groups_get_grouping_by_name($course->id, $name)) && (int)$existing !== $groupingid
        ) {
            throw new moodle_exception('groupingnameexists', 'group', '', $name);
        }

        ajax_security::validate_entity(
            'groupings',
            (int)$course->id,
            $groupingid,
            $name,
            has_capability('moodle/course:changeidnumber', $context) ? $idnumber : null
        );

        $data = (object)[
            'id' => $groupingid,
            'courseid' => $course->id,
            'name' => $name,
            'description' => $description,
            'descriptionformat' => FORMAT_HTML,
        ];

        if (has_capability('moodle/course:changeidnumber', $context)) {
            $data->idnumber = $idnumber;
        }

        groups_update_grouping($data);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);

        $response['success'] = true;
        $response['message'] = get_string('groupingsaved', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$groupingid,
            'name' => format_string($grouping->name),
            'rawname' => (string)$grouping->name,
            'description' => format_text((string)$grouping->description, $grouping->descriptionformat ?? FORMAT_HTML, [
                'context' => $context,
            ]),
            'rawdescription' => (string)$grouping->description,
            'idnumber' => (string)($grouping->idnumber ?? ''),
            'configdata' => (string)($grouping->configdata ?? ''),
            'nativeurl' => (new moodle_url('/group/grouping.php', [
                'courseid' => $course->id,
                'id' => $groupingid,
            ]))->out(false),
        ];
    } else if ($action === 'movegroup') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $targetgroupingid = optional_param('groupingid', 0, PARAM_INT);
        $removefromorigin = optional_param('removefromorigin', 1, PARAM_BOOL);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        if ($targetgroupingid > 0) {
            $grouping = $DB->get_record(
                'groupings',
                ['id' => $targetgroupingid, 'courseid' => $course->id],
                '*',
                MUST_EXIST
            );
            $existing = $DB->record_exists('groupings_groups', ['groupingid' => $grouping->id, 'groupid' => $groupid]);
            if ($removefromorigin) {
                local_groupimport_remove_group_from_other_groupings($groupid, $course->id, $targetgroupingid);
            }
            if (!$existing) {
                groups_assign_grouping($grouping->id, $groupid);
            }
            $response['message'] = get_string('groupmovedtogrouping', 'local_groupimport', format_string($grouping->name));
            $response['existing'] = $existing;
        } else {
            local_groupimport_remove_group_from_other_groupings($groupid, $course->id);
            $response['message'] = get_string('groupremovedfromgroupings', 'local_groupimport');
            $response['existing'] = false;
        }

        $response['success'] = true;
    } else if ($action === 'duplicategroup') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        $newgroup = (object)[
            'courseid' => $course->id,
            'name' => ajax_security::copy_name(
                'groups',
                (int)$course->id,
                get_string('duplicatedname', 'local_groupimport', $group->name)
            ),
        ];
        $newgroupid = groups_create_group($newgroup);

        $members = groups_get_members($groupid, 'u.id, u.firstname, u.lastname') ?: [];
        foreach ($members as $member) {
            groups_add_member($newgroupid, $member->id);
        }
        $searchparts = [$newgroup->name];
        foreach ($members as $member) {
            $searchparts[] = fullname($member);
        }

        $groupingids = [];
        $records = $DB->get_records('groupings_groups', ['groupid' => $groupid], '', 'id, groupingid');
        $groupings = \local_groupimport\local\batch_reader::records(
            'groupings',
            array_column($records, 'groupingid'),
            ['courseid' => $course->id]
        );
        foreach ($records as $record) {
            $grouping = $groupings[$record->groupingid] ?? null;
            if ($grouping) {
                groups_assign_grouping((int)$grouping->id, $newgroupid);
                $groupingids[] = (int)$grouping->id;
            }
        }

        $response['success'] = true;
        $response['message'] = get_string('groupduplicated', 'local_groupimport');
        $response['group'] = [
            'id' => (int)$newgroupid,
            'name' => format_string($newgroup->name),
            'rawname' => $newgroup->name,
            'description' => '',
            'idnumber' => '',
            'picture' => '',
            'enrolmentkey' => 0,
            'hidepicture' => 0,
            'nativeurl' => (new moodle_url('/group/group.php', [
                'courseid' => $course->id,
                'id' => $newgroupid,
            ]))->out(false),
            'membercount' => count($members),
            'membercountlabel' => local_groupimport_count_string('memberscount', count($members)),
            'searchtext' => core_text::strtolower(trim(implode(' ', $searchparts))),
            'members' => array_map(static function ($member) use ($newgroupid): array {
                return [
                    'userid' => (int)$member->id,
                    'fullname' => fullname($member),
                    'selectableid' => $newgroupid . ':' . $member->id,
                ];
            }, array_values($members)),
            'groupingids' => $groupingids,
            'groupingidscsv' => implode(',', $groupingids),
        ];
    } else if ($action === 'duplicategrouping') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        $newgrouping = (object)[
            'courseid' => $course->id,
            'name' => ajax_security::copy_name(
                'groupings',
                (int)$course->id,
                get_string('duplicatedname', 'local_groupimport', $grouping->name)
            ),
        ];
        $newgroupingid = groups_create_grouping($newgrouping);

        $groupids = [];
        $searchparts = [$newgrouping->name];
        $records = $DB->get_records('groupings_groups', ['groupingid' => $groupingid], '', 'id, groupid');
        foreach ($records as $record) {
            $group = groups_get_group($record->groupid);
            if ($group && (int)$group->courseid === (int)$course->id) {
                groups_assign_grouping($newgroupingid, (int)$group->id);
                $groupids[] = (int)$group->id;
                $searchparts[] = $group->name;
            }
        }

        $response['success'] = true;
        $response['message'] = get_string('groupingduplicated', 'local_groupimport');
        $response['grouping'] = [
            'id' => (int)$newgroupingid,
            'name' => format_string($newgrouping->name),
            'rawname' => $newgrouping->name,
            'description' => '',
            'idnumber' => '',
            'configdata' => '',
            'nativeurl' => (new moodle_url('/group/grouping.php', [
                'courseid' => $course->id,
                'id' => $newgroupingid,
            ]))->out(false),
            'groupcount' => count($groupids),
            'countlabel' => local_groupimport_count_string('groupscount', count($groupids)),
            'groupids' => $groupids,
            'searchtext' => core_text::strtolower(trim(implode(' ', $searchparts))),
        ];
    } else if ($action === 'addusers') {
        $groupid = required_param('groupid', PARAM_INT);
        $userids = required_param_array('userids', PARAM_INT);
        bulk_action::validate_size(count($userids));
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        $enrolledusers = \local_groupimport\local\batch_reader::enrolled($context);
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
            foreach (array_unique($userids) as $userid) {
                if (!isset($enrolledusers[$userid])) {
                    $skipped++;
                    continue;
                }
                if (
                    \local_groupimport\service\membership_assignment::add_user_to_group(
                        (int)$course->id,
                        $groupid,
                        $userid
                    )
                ) {
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
    } else if ($action === 'movemembers') {
        if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
            throw new moodle_exception('invaliddata', 'error');
        }
        $destinationid = required_param('destinationid', PARAM_INT);
        $groupids = array_values(required_param_array('groupids', PARAM_INT));
        $userids = array_values(required_param_array('userids', PARAM_INT));
        if (!$groupids || count($groupids) !== count($userids)) {
            throw new moodle_exception('invaliddata', 'error');
        }
        $members = [];
        foreach ($groupids as $index => $groupid) {
            $members[] = ['groupid' => $groupid, 'userid' => $userids[$index]];
        }
        $result = \local_groupimport\service\membership_transfer::move_members(
            (int)$course->id,
            $destinationid,
            $members
        );
        $response = array_merge($response, $result);
        $response['success'] = true;
        $response['message'] = get_string('membersmovedsummary', 'local_groupimport', (object)$result);
    } else if ($action === 'addemails') {
        global $DB;

        $groupid = required_param('groupid', PARAM_INT);
        $rawemails = required_param('emails', PARAM_TEXT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        $tokens = local_groupimport_extract_user_tokens($rawemails);
        bulk_action::validate_size(count($tokens));
        $addedusers = [];
        $existing = 0;
        $missing = [];

        $resolvedusers = local_groupimport_find_users_by_identifiers($tokens);
        $enrolledusers = \local_groupimport\local\batch_reader::enrolled($context);
        bulk_action::run(count($tokens), static function () use (
            $course,
            $groupid,
            $tokens,
            $resolvedusers,
            $enrolledusers,
            &$addedusers,
            &$existing,
            &$missing,
        ) {
            foreach ($tokens as $token) {
                $user = $resolvedusers[$token] ?? null;
                if (!$user || !isset($enrolledusers[$user->id])) {
                    $missing[] = $token;
                    continue;
                }
                if (
                    \local_groupimport\service\membership_assignment::add_user_to_group(
                        (int)$course->id,
                        $groupid,
                        (int)$user->id
                    )
                ) {
                    $addedusers[] = [
                        'id' => (int)$user->id,
                        'fullname' => fullname($user),
                    ];
                } else {
                    $existing++;
                }
            }
        });

        $response['success'] = true;
        $response['users'] = $addedusers;
        $response['existing'] = $existing;
        $response['missing'] = $missing;
        $response['skipped'] = count($missing);
        $response['message'] = get_string('usersaddsummary', 'local_groupimport', (object)[
            'added' => count($addedusers),
            'existing' => $existing,
        ]);
        if ($missing) {
            $response['message'] .= ' ' . get_string('bulkitemsskipped', 'local_groupimport', count($missing));
        }
    } else if ($action === 'addgroups') {
        global $DB;

        $groupingid = required_param('groupingid', PARAM_INT);
        $rawgroups = required_param('groups', PARAM_TEXT);
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        $coursegroups = groups_get_all_groups($course->id) ?: [];
        $tokens = local_groupimport_extract_group_tokens($rawgroups, $coursegroups);

        $groupsbyid = [];
        $groupsbyname = [];
        foreach ($coursegroups as $group) {
            $groupsbyid[(int)$group->id] = $group;
            $normalizedname = core_text::strtolower(trim($group->name));
            if (!isset($groupsbyname[$normalizedname])) {
                $groupsbyname[$normalizedname] = [];
            }
            $groupsbyname[$normalizedname][] = $group;
        }

        $matchedgroups = [];
        $missing = [];
        $ambiguous = [];

        foreach ($tokens as $token) {
            if ($token === '') {
                continue;
            }

            if (ctype_digit($token) && isset($groupsbyid[(int)$token])) {
                $matchedgroups[(int)$token] = $groupsbyid[(int)$token];
                continue;
            }

            $normalizedtoken = core_text::strtolower($token);
            $namecandidates = $groupsbyname[$normalizedtoken] ?? [];
            if (count($namecandidates) === 1) {
                $group = reset($namecandidates);
                $matchedgroups[(int)$group->id] = $group;
            } else if (count($namecandidates) > 1) {
                $ambiguous[] = $token;
            } else {
                $missing[] = $token;
            }
        }

        $addedgroups = [];
        $existing = 0;
        foreach ($matchedgroups as $group) {
            if (
                \local_groupimport\service\membership_assignment::add_group_to_grouping(
                    (int)$course->id,
                    (int)$group->id,
                    $groupingid
                )
            ) {
                $addedgroups[] = [
                    'id' => (int)$group->id,
                    'name' => format_string($group->name),
                ];
            } else {
                $existing++;
            }
        }

        $response['success'] = true;
        $response['groups'] = $addedgroups;
        $response['existing'] = $existing;
        $response['missing'] = array_values(array_unique($missing));
        $response['ambiguous'] = array_values(array_unique($ambiguous));
        $response['message'] = get_string('groupsaddsummary', 'local_groupimport', (object)[
            'added' => count($addedgroups),
            'existing' => $existing,
        ]);
    } else if ($action === 'removeuser') {
        $groupid = required_param('groupid', PARAM_INT);
        $userid = required_param('userid', PARAM_INT);
        $group = groups_get_group($groupid);

        if (!$group || (int)$group->courseid !== (int)$course->id) {
            throw new moodle_exception('invalidgroupid', 'error');
        }

        ajax_security::remove_members((int)$course->id, [$groupid], [$userid]);

        $response['success'] = true;
        $response['message'] = get_string('userremovedfromgroup', 'local_groupimport');
    } else if ($action === 'removemembers') {
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
        $response['message'] = local_groupimport_count_string('membersremoved', (int)$removed);
    } else if ($action === 'deletegroups') {
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
                    throw new moodle_exception('ajaxunexpectederror', 'local_groupimport');
                }
                $deleted++;
            }
        });

        $response['success'] = true;
        $response['deleted'] = (int)$deleted;
        $response['message'] = local_groupimport_count_string('groupsdeleted', (int)$deleted);
    } else if ($action === 'deletegroupings') {
        global $DB;

        $groupingids = required_param_array('groupingids', PARAM_INT);
        $deleted = 0;

        $groupings = \local_groupimport\local\batch_reader::records(
            'groupings',
            $groupingids,
            ['courseid' => $course->id]
        );
        foreach (array_unique($groupingids) as $groupingid) {
            $grouping = $groupings[$groupingid] ?? null;
            if (!$grouping) {
                continue;
            }

            groups_delete_grouping($grouping);
            $deleted++;
        }

        $response['success'] = true;
        $response['message'] = local_groupimport_count_string('groupingsdeleted', (int)$deleted);
    }
} catch (dml_exception $exception) {
    // Database errors may carry SQL in their debug details: log them, never return them.
    debugging('local_groupimport ajax ' . $action . ': ' . $exception->getMessage() . ' ' . ($exception->debuginfo ?? ''), DEBUG_DEVELOPER);
    $response['error'] = get_string('ajaxunexpectederror', 'local_groupimport');
} catch (moodle_exception $exception) {
    $response['error'] = $exception->getMessage();
} catch (Throwable $exception) {
    // Unexpected PHP errors are logged server side and reported with a generic message.
    debugging('local_groupimport ajax ' . $action . ': ' . get_class($exception) . ': ' . $exception->getMessage(), DEBUG_DEVELOPER);
    $response['error'] = get_string('ajaxunexpectederror', 'local_groupimport');
}

header('Content-Type: application/json; charset=utf-8');
echo json_encode($response);

/**
 * Remove a group from every grouping in its course, optionally preserving one target grouping.
 *
 * @param int $groupid Group id.
 * @param int $courseid Course id.
 * @param int|null $keepgroupingid Grouping id to keep.
 * @return void
 */
function local_groupimport_remove_group_from_other_groupings(
    int $groupid,
    int $courseid,
    ?int $keepgroupingid = null
): void {
    global $DB;

    $sql = "SELECT gg.id, gg.groupingid
              FROM {groupings_groups} gg
              JOIN {groupings} g ON g.id = gg.groupingid
             WHERE gg.groupid = :groupid
               AND g.courseid = :courseid";
    $records = $DB->get_records_sql($sql, [
        'groupid' => $groupid,
        'courseid' => $courseid,
    ]);

    foreach ($records as $record) {
        if ($keepgroupingid !== null && (int)$record->groupingid === $keepgroupingid) {
            continue;
        }
        // Moodle API: also triggers grouping_group_unassigned and clears the course group cache.
        groups_unassign_grouping((int)$record->groupingid, $groupid);
    }
}

/**
 * Extract normalised email addresses from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_emails(string $text): array {
    preg_match_all('/[^\s,;<>]+@[^\s,;<>]+/u', core_text::strtolower($text), $matches);
    return array_values(array_unique($matches[0] ?? []));
}

/**
 * Extract user identifier tokens from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_user_tokens(string $text): array {
    $parts = preg_split('/[\s,;|]+/u', $text);
    $tokens = array_map(static function (string $part): string {
        return trim($part);
    }, $parts ?: []);

    return array_values(array_unique(array_filter($tokens, static function (string $token): bool {
        return $token !== '';
    })));
}

/**
 * Find a non-deleted user by Moodle id or by one of the identifier fields enabled in the plugin settings.
 *
 * @param string $token Identifier token.
 * @return \stdClass|null
 */
function local_groupimport_find_user_by_identifier(string $token): ?\stdClass {
    global $DB;

    $token = trim($token);
    if ($token === '') {
        return null;
    }

    if (ctype_digit($token)) {
        $user = $DB->get_record('user', ['id' => (int)$token, 'deleted' => 0], 'id, firstname, lastname, email');
        if ($user) {
            return $user;
        }
    }

    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields))
        : ['username', 'email'];

    foreach (['email', 'username', 'idnumber'] as $field) {
        if (in_array($field, $allowed, true)) {
            $user = $DB->get_record('user', [$field => $token, 'deleted' => 0], 'id, firstname, lastname, email');
            if ($user) {
                return $user;
            }
        }
    }

    // Only the Moodle id (copied with "Copy Moodle ID") and the fields enabled in the plugin settings are
    // used: a bare first name or last name is not an identifier and is no longer matched.
    $customshortnames = [];
    foreach ($allowed as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $customshortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    if (empty($customshortnames)) {
        return null;
    }

    [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
    $params = $fieldparams + ['data' => $token];
    $sql = "SELECT u.id, u.firstname, u.lastname, u.email
              FROM {user} u
              JOIN {user_info_data} d ON d.userid = u.id
              JOIN {user_info_field} f ON f.id = d.fieldid
             WHERE u.deleted = 0
               AND d.data = :data
               AND f.shortname $fieldsql";
    $matches = $DB->get_records_sql($sql, $params, 0, 2);

    return count($matches) === 1 ? reset($matches) : null;
}

/**
 * Resolve a paste in bulk, retaining numeric ID, core priority and custom ambiguity.
 */
function local_groupimport_find_users_by_identifiers(array $tokens): array {
    $pending = array_fill_keys(array_values(array_unique(array_map('trim', $tokens))), null);
    $result = [];
    $numericids = [];
    foreach ($pending as $token => $unused) {
        if (ctype_digit((string)$token)) {
            $numericids[] = (int)$token;
        }
    }
    $users = \local_groupimport\local\batch_reader::records(
        'user',
        $numericids,
        ['deleted' => 0],
        'id, firstname, lastname, email'
    );
    foreach ($pending as $token => $unused) {
        if (isset($users[(int)$token]) && ctype_digit((string)$token)) {
            $result[$token] = $users[(int)$token];
            unset($pending[$token]);
        } else if ((string)$token === '') {
            unset($pending[$token]);
        }
    }
    $config = get_config('local_groupimport');
    $allowed = !empty($config->alloweduserfields)
        ? array_map('trim', explode(',', $config->alloweduserfields)) : ['username', 'email'];
    foreach (['email', 'username', 'idnumber'] as $field) {
        if (!$pending || !in_array($field, $allowed, true)) {
            continue;
        }
        $matches = \local_groupimport\local\batch_reader::users(array_keys($pending), $field);
        foreach ($matches as $token => $records) {
            if (!$records) {
                continue;
            }
            // Historical core get_record returns its first row and emits a debug
            // notice for duplicates. Keep that API for this exceptional case.
            $result[$token] = count($records) > 1 ? local_groupimport_find_user_by_identifier((string)$token) :
                (object)array_intersect_key((array)$records[0], array_flip(['id', 'firstname', 'lastname', 'email']));
            unset($pending[$token]);
        }
    }
    $shortnames = [];
    foreach ($allowed as $field) {
        if (strpos($field, 'profile_field_') === 0) {
            $shortnames[] = substr($field, strlen('profile_field_'));
        }
    }
    if ($pending && $shortnames) {
        $matches = \local_groupimport\local\batch_reader::users(array_keys($pending), 'profile', $shortnames);
        foreach ($matches as $token => $records) {
            if (count($records) === 1) {
                $result[$token] = (object)array_intersect_key(
                    (array)$records[0],
                    array_flip(['id', 'firstname', 'lastname', 'email'])
                );
            } else if (count($records) > 1) {
                // Preserve the legacy two-row limit even across duplicate profile rows.
                $result[$token] = local_groupimport_find_user_by_identifier((string)$token);
            }
        }
    }
    return $result;
}

/**
 * Extract normalised group tokens from pasted text.
 *
 * @param string $text Pasted text.
 * @return array
 */
function local_groupimport_extract_group_tokens(string $text, array $coursegroups = []): array {
    $known = [];
    foreach ($coursegroups as $group) {
        $id = isset($group->id) ? (string)$group->id : '';
        $name = isset($group->name) ? trim((string)$group->name) : '';
        if ($id !== '') {
            $known[core_text::strtolower($id)] = true;
        }
        if ($name !== '') {
            $known[core_text::strtolower($name)] = true;
        }
    }
    $knownkeys = array_keys($known);
    usort($knownkeys, static function (string $left, string $right): int {
        $leftwords = preg_split('/\s+/u', $left) ?: [];
        $rightwords = preg_split('/\s+/u', $right) ?: [];
        $wordcomparison = count($rightwords) <=> count($leftwords);
        return $wordcomparison !== 0 ? $wordcomparison : core_text::strlen($right) <=> core_text::strlen($left);
    });

    $tokens = [];
    $parts = preg_split('/[\r\n,;|]+/u', $text) ?: [];
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === '') {
            continue;
        }

        $normalised = core_text::strtolower($part);
        if (isset($known[$normalised])) {
            $tokens[] = $normalised;
            continue;
        }

        $words = array_values(array_filter(array_map(static function (string $word): string {
            return core_text::strtolower(trim($word));
        }, preg_split('/\s+/u', $part) ?: []), static function (string $word): bool {
            return $word !== '';
        }));

        for ($index = 0; $index < count($words);) {
            $matched = '';
            foreach ($knownkeys as $knownkey) {
                $knownwords = preg_split('/\s+/u', $knownkey) ?: [];
                $knownwordcount = count($knownwords);
                if ($knownwordcount > count($words) - $index) {
                    continue;
                }
                $candidate = implode(' ', array_slice($words, $index, $knownwordcount));
                if ($candidate === $knownkey) {
                    $matched = $knownkey;
                    break;
                }
            }

            if ($matched !== '') {
                $tokens[] = $matched;
                $index += count(preg_split('/\s+/u', $matched) ?: []);
            } else {
                $tokens[] = $words[$index];
                $index++;
            }
        }
    }

    return array_values(array_unique(array_filter($tokens, static function (string $token): bool {
        return $token !== '';
    })));
}

/**
 * Extract group or grouping names from a separated quick-create field.
 *
 * @param string $text Raw field value.
 * @return array
 */
function local_groupimport_extract_create_names(string $text): array {
    if (core_text::strlen($text) > 131072) {
        throw new moodle_exception('invaliddata', 'error');
    }
    $total = 0;
    $parts = preg_split('/[\r\n,;|]+/u', $text);
    $names = [];
    foreach ($parts ?: [] as $part) {
        $part = trim($part);
        if ($part === '') {
            continue;
        }

        if (preg_match('/^(.*?)([#@])\s*\*\s*(\d+)$/u', $part, $matches)) {
            $prefix = rtrim($matches[1]);
            $marker = $matches[2];
            $count = max(0, min(200, (int)$matches[3]));
            $total += $count;
            if ($total > \local_groupimport\local\ajax_security::MAX_NAMES) {
                throw new moodle_exception('invaliddata', 'error');
            }
            for ($index = 1; $index <= $count; $index++) {
                $suffix = $marker === '#' ? (string)$index : local_groupimport_number_to_letters($index);
                $names[] = trim($prefix . ' ' . $suffix);
            }
            continue;
        }

        if (++$total > \local_groupimport\local\ajax_security::MAX_NAMES) {
            throw new moodle_exception('invaliddata', 'error');
        }
        $names[] = $part;
    }

    foreach ($names as $name) {
        \local_groupimport\local\ajax_security::validate_name($name);
    }
    return array_values(array_unique($names));
}

/**
 * Convert a 1-based number into A, B, ..., Z, AA, AB...
 *
 * @param int $number Number.
 * @return string
 */
function local_groupimport_number_to_letters(int $number): string {
    $letters = '';
    while ($number > 0) {
        $number--;
        $letters = chr(65 + ($number % 26)) . $letters;
        $number = intdiv($number, 26);
    }
    return $letters;
}
