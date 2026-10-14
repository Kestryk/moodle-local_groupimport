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

global $CFG;
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/filelib.php');
require_once($CFG->dirroot . '/user/profile/lib.php');
require_once($CFG->dirroot . '/local/groupimport/lib.php');

use local_groupimport\local\state_version;

/**
 * Compact, normalised course state for the on-demand Student Management renderer (SM-RENDU).
 *
 * Every participant, group and grouping is sent exactly once and relations are id lists,
 * so the payload grows linearly with the course instead of with the number of rendered
 * copies. No HTML and no precomputed search text: the browser renders and indexes it.
 * Heavy, rarely displayed fields are served by {@see self::get_details()}.
 *
 * The legacy page still uses {@see course_structure::get_state()}; both coexist until
 * the parity milestone (ARCHITECTURE-SM-RENDU, step 6).
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class course_state {

    /** @var int Maximum values per IN () clause; keeps SQL Server under its parameter limit. */
    const CHUNK_SIZE = 1000;

    /** @var int Maximum ids accepted by one details request. */
    const MAX_DETAIL_IDS = 200;

    /** @var int Size of the participant picture, identical to the legacy card. */
    const PICTURE_SIZE = 100;

    /**
     * Build the compact state of a course.
     *
     * The caller is responsible for login, context validation and capability checks.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Matching course context.
     * @return array
     */
    public static function build(\stdClass $course, \context_course $context): array {
        global $CFG, $OUTPUT;

        self::assert_context($course, $context);

        // Same population and order as the legacy page (course_structure::get_state()).
        $users = get_enrolled_users(
            $context,
            '',
            0,
            'u.id, u.firstname, u.lastname, u.firstnamephonetic, u.lastnamephonetic, u.middlename, u.alternatename, ' .
                'u.username, u.email, u.picture, u.imagealt, u.idnumber',
            'u.lastname ASC, u.firstname ASC, u.id ASC'
        );
        $userids = array_map('intval', array_keys($users));

        $groups = groups_get_all_groups(
            $course->id,
            0,
            0,
            'g.id, g.courseid, g.idnumber, g.name, g.description, g.picture, g.hidepicture, g.enrolmentkey'
        );
        $groupings = groups_get_all_groupings($course->id);
        $memberships = self::get_group_memberships((int)$course->id);
        $groupingmemberships = self::get_grouping_memberships(array_map('intval', array_keys($groupings)));
        [$roles, $userroles] = self::get_roles($context);

        $access = self::get_field_access($context);
        $identifierfields = self::get_visible_identifier_fields($access);
        $display = self::get_display_settings($context);
        $customkeys = array_values(array_unique(array_filter(array_merge(
            array_keys($identifierfields),
            [$display['primary']['key'] ?? ''],
            array_column($display['details'], 'key')
        ), static function(string $key): bool {
            return strpos($key, 'profile_field_') === 0;
        })));
        $customvalues = self::get_custom_field_values($userids, $customkeys);

        $canviewfullnames = has_capability('moodle/site:viewfullnames', $context);
        $usepictures = !empty($CFG->enablegravatar);
        foreach ($users as $user) {
            if (!empty($user->picture)) {
                $usepictures = true;
                break;
            }
        }
        if ($usepictures) {
            self::preload_user_contexts($userids);
        }

        $useritems = [];
        foreach ($users as $user) {
            $userid = (int)$user->id;
            $item = [
                'id' => $userid,
                'fullname' => fullname($user),
                // Empty unless Moodle lets this viewer see e-mails (showuseridentity + viewuseridentity).
                'email' => isset($access['identity']['email']) ? (string)$user->email : '',
                'roleids' => array_values($userroles[$userid] ?? []),
                'groupids' => array_values($memberships['byuser'][$userid] ?? []),
            ];

            $identifiers = [];
            foreach (array_keys($identifierfields) as $fieldkey) {
                $value = strpos($fieldkey, 'profile_field_') === 0
                    ? (string)($customvalues[$userid][$fieldkey] ?? '')
                    : (string)($user->{$fieldkey} ?? '');
                if ($value !== '') {
                    $identifiers[$fieldkey] = $value;
                }
            }
            if ($identifiers) {
                $item['identifiers'] = $identifiers;
            }

            $displayvalues = [];
            foreach (array_merge([$display['primary']['key'] ?? ''], array_column($display['details'], 'key')) as $fieldkey) {
                if ($fieldkey === '') {
                    continue;
                }
                $value = local_groupimport_normalise_participant_label_value($customvalues[$userid][$fieldkey] ?? '');
                if ($value !== '') {
                    $displayvalues[$fieldkey] = $value;
                }
            }
            if ($displayvalues) {
                $item['display'] = $displayvalues;
            }

            // Avatar exactly as the legacy card renders it: the picture markup when there is
            // one (rare), otherwise only the initials, from which the browser rebuilds Moodle's
            // initials markup (identical in 4.5 and 5.1).
            if (!empty($user->picture) || !empty($CFG->enablegravatar) || defined('BEHAT_SITE_RUNNING')) {
                $item['avatarhtml'] = $OUTPUT->user_picture($user, [
                    'courseid' => $course->id,
                    'size' => self::PICTURE_SIZE,
                    'link' => false,
                ]);
            } else {
                $item['initials'] = \core_user::get_initials($user);
                $avatarname = fullname($user, $canviewfullnames);
                if ($avatarname !== $item['fullname']) {
                    $item['avatarname'] = $avatarname;
                }
            }

            $useritems[] = $item;
        }

        $groupitems = [];
        foreach ($groups as $group) {
            $groupid = (int)$group->id;
            $pictureurl = get_group_picture_url($group, $course->id, true);
            $groupitems[] = [
                'id' => $groupid,
                'name' => format_string($group->name, true, ['context' => $context]),
                'rawname' => (string)$group->name,
                'idnumber' => (string)($group->idnumber ?? ''),
                'memberids' => array_values($memberships['bygroup'][$groupid] ?? []),
                'groupingids' => array_values($groupingmemberships['bygroup'][$groupid] ?? []),
                'hasdescription' => trim((string)($group->description ?? '')) !== '',
                'enrolmentkey' => !empty($group->enrolmentkey),
                'pictureurl' => !empty($pictureurl) ? $pictureurl->out(false) : '',
                'hidepicture' => !empty($group->hidepicture),
            ];
        }

        $groupingitems = [];
        foreach ($groupings as $grouping) {
            $groupingid = (int)$grouping->id;
            $groupingitems[] = [
                'id' => $groupingid,
                'name' => format_string($grouping->name, true, ['context' => $context]),
                'rawname' => (string)$grouping->name,
                'idnumber' => (string)($grouping->idnumber ?? ''),
                'groupids' => array_values($groupingmemberships['bygrouping'][$groupingid] ?? []),
                'hasdescription' => trim((string)($grouping->description ?? '')) !== '',
            ];
        }

        return [
            'meta' => [
                'schema' => 1,
                'courseid' => (int)$course->id,
                'version' => state_version::get((int)$course->id),
                'counts' => [
                    'users' => count($useritems),
                    'groups' => count($groupitems),
                    'groupings' => count($groupingitems),
                    'memberships' => $memberships['count'],
                ],
                'identifierfields' => self::to_label_list($identifierfields),
                'display' => $display,
            ],
            'roles' => $roles,
            'users' => $useritems,
            'groups' => $groupitems,
            'groupings' => $groupingitems,
        ];
    }

    /**
     * What manage.php still needs in on-demand mode, in the course_structure::get_state() shape.
     *
     * The browser renders every card from build(); the page itself only needs the role names
     * of the enrolled users (role filter), the participant count, the group names (group
     * filter) and the grouping headers. No picture, description or profile field is loaded,
     * so the page cost no longer grows with the participants' data (10 000 users exhausted
     * 512 MB in the legacy page).
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Matching course context.
     * @return array {users, groups, groupings, ungroupedgroupids}
     */
    public static function page_data(\stdClass $course, \context_course $context): array {
        global $DB;

        self::assert_context($course, $context);

        [$enrolsql, $enrolparams] = get_enrolled_sql($context);
        $userids = array_map('intval', $DB->get_fieldset_sql("SELECT je.id FROM ($enrolsql) je", $enrolparams));
        [$roles, $userroles] = self::get_roles($context);
        $rolenames = array_column($roles, 'name', 'id');
        $users = [];
        foreach ($userids as $userid) {
            $users[$userid] = [
                'id' => $userid,
                'roles' => array_values(array_map(static function(int $roleid) use ($rolenames): string {
                    return $rolenames[$roleid];
                }, $userroles[$userid] ?? [])),
            ];
        }

        $groupings = groups_get_all_groupings($course->id);
        $groupingmemberships = self::get_grouping_memberships(array_map('intval', array_keys($groupings)));
        $groups = [];
        foreach (groups_get_all_groups($course->id, 0, 0, 'g.id, g.name, g.idnumber') as $group) {
            $groups[(int)$group->id] = [
                'id' => (int)$group->id,
                'name' => format_string($group->name),
                'rawname' => (string)$group->name,
                'idnumber' => (string)($group->idnumber ?? ''),
                'groupingids' => array_values($groupingmemberships['bygroup'][(int)$group->id] ?? []),
            ];
        }

        // Same grouping data as course_structure::get_state(): it feeds the grouping headers.
        $groupingitems = [];
        foreach ($groupings as $grouping) {
            $groupids = $groupingmemberships['bygrouping'][(int)$grouping->id] ?? [];
            $groupingitems[(int)$grouping->id] = [
                'id' => (int)$grouping->id,
                'name' => format_string($grouping->name),
                'rawname' => (string)$grouping->name,
                'idnumber' => (string)($grouping->idnumber ?? ''),
                'description' => self::format_description($grouping, $context, 'grouping', 'description'),
                'rawdescription' => (string)($grouping->description ?? ''),
                'configdata' => (string)($grouping->configdata ?? ''),
                'groupids' => array_values(array_map('intval', $groupids)),
                'groupcount' => count($groupids),
            ];
        }

        return [
            'users' => $users,
            'groups' => $groups,
            'groupings' => $groupingitems,
            'ungroupedgroupids' => [],
        ];
    }

    /**
     * Load the heavy fields of a few entities, for a modal or a detail panel.
     *
     * Ids outside the course (or users not enrolled in it) are refused as a whole,
     * so a request never mixes visible and hidden records.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Matching course context.
     * @param string $type user, group or grouping.
     * @param int[] $ids Entity ids.
     * @return array Items in the requested order.
     */
    public static function get_details(\stdClass $course, \context_course $context, string $type, array $ids): array {
        self::assert_context($course, $context);

        $ids = array_values(array_unique(array_filter(array_map('intval', $ids), static function(int $id): bool {
            return $id > 0;
        })));
        if (!$ids) {
            return [];
        }
        if (count($ids) > self::MAX_DETAIL_IDS) {
            throw new \invalid_parameter_exception('Too many ids: at most ' . self::MAX_DETAIL_IDS . ' per request.');
        }

        switch ($type) {
            case 'user':
                return self::get_user_details($course, $context, $ids);
            case 'group':
                return self::get_group_details($course, $context, $ids);
            case 'grouping':
                return self::get_grouping_details($course, $context, $ids);
        }
        throw new \invalid_parameter_exception('Unknown details type: ' . $type);
    }

    /**
     * Participant details: the fields the legacy card exposed in data-user-detail, without memberships.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Course context.
     * @param int[] $ids User ids.
     * @return array
     */
    protected static function get_user_details(\stdClass $course, \context_course $context, array $ids): array {
        global $DB, $OUTPUT;

        [$enrolsql, $enrolparams] = get_enrolled_sql($context);
        [$insql, $inparams] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'detailuser');
        $users = $DB->get_records_sql(
            "SELECT u.*
               FROM {user} u
               JOIN ($enrolsql) je ON je.id = u.id
              WHERE u.id $insql AND u.deleted = 0",
            $enrolparams + $inparams
        );
        if (count($users) !== count($ids)) {
            throw new \moodle_exception('invaliduser', 'error');
        }

        self::preload_user_contexts($ids);
        $access = self::get_field_access($context);
        $identifierfields = self::get_visible_identifier_fields($access);
        $customvalues = self::get_custom_field_values($ids, array_values(array_filter(
            array_keys($identifierfields),
            static function(string $key): bool {
                return strpos($key, 'profile_field_') === 0;
            }
        )));

        $items = [];
        foreach ($ids as $userid) {
            $user = $users[$userid];
            $copyfields = [];
            foreach ($identifierfields as $fieldkey => $label) {
                $copyfields[] = [
                    'key' => $fieldkey,
                    'label' => $label,
                    'value' => strpos($fieldkey, 'profile_field_') === 0
                        ? (string)($customvalues[$userid][$fieldkey] ?? '')
                        : (string)($user->{$fieldkey} ?? ''),
                ];
            }
            // Same rules as user_get_user_details(): identity fields per showuseridentity and
            // viewuseridentity (or viewalldetails), profile fields per hiddenuserfields unless the
            // viewer has course:viewhiddenuserfields. A field the viewer may not see is sent empty.
            $items[] = [
                'id' => (int)$userid,
                'fullname' => fullname($user),
                'email' => isset($access['identity']['email']) ? (string)$user->email : '',
                'profileimage' => $OUTPUT->user_picture($user, [
                    'courseid' => $course->id,
                    'size' => self::PICTURE_SIZE,
                    'link' => false,
                ]),
                'profileurl' => (new \moodle_url('/user/profile.php', ['id' => $userid, 'course' => $course->id]))->out(false),
                'username' => self::identity_value($access, 'username', $user),
                'idnumber' => self::identity_value($access, 'idnumber', $user),
                'institution' => self::identity_value($access, 'institution', $user),
                'department' => self::identity_value($access, 'department', $user),
                'city' => isset($access['hidden']['city']) ? '' : (string)$user->city,
                'country' => isset($access['hidden']['country']) ? '' : (string)$user->country,
                'lang' => $access['viewalldetails'] ? clean_param((string)$user->lang, PARAM_LANG) : '',
                'description' => self::format_user_description($user, $access),
                'copyfields' => $copyfields,
            ];
        }

        return $items;
    }

    /**
     * Group details used by the advanced settings modal.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Course context.
     * @param int[] $ids Group ids.
     * @return array
     */
    protected static function get_group_details(\stdClass $course, \context_course $context, array $ids): array {
        global $DB;

        [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'detailgroup');
        $params['courseid'] = $course->id;
        $groups = $DB->get_records_select('groups', "id $insql AND courseid = :courseid", $params);
        if (count($groups) !== count($ids)) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        $items = [];
        foreach ($ids as $groupid) {
            $group = $groups[$groupid];
            $pictureurl = get_group_picture_url($group, $course->id, true);
            $items[] = [
                'id' => (int)$groupid,
                'description' => self::format_description($group, $context, 'group', 'description'),
                'rawdescription' => (string)($group->description ?? ''),
                'idnumber' => (string)($group->idnumber ?? ''),
                'enrolmentkey' => !empty($group->enrolmentkey),
                'pictureurl' => !empty($pictureurl) ? $pictureurl->out(false) : '',
                'hidepicture' => !empty($group->hidepicture),
            ];
        }

        return $items;
    }

    /**
     * Grouping details used by the advanced settings modal.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Course context.
     * @param int[] $ids Grouping ids.
     * @return array
     */
    protected static function get_grouping_details(\stdClass $course, \context_course $context, array $ids): array {
        global $DB;

        [$insql, $params] = $DB->get_in_or_equal($ids, SQL_PARAMS_NAMED, 'detailgrouping');
        $params['courseid'] = $course->id;
        $groupings = $DB->get_records_select('groupings', "id $insql AND courseid = :courseid", $params);
        if (count($groupings) !== count($ids)) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }

        $items = [];
        foreach ($ids as $groupingid) {
            $grouping = $groupings[$groupingid];
            $items[] = [
                'id' => (int)$groupingid,
                'description' => self::format_description($grouping, $context, 'grouping', 'description'),
                'rawdescription' => (string)($grouping->description ?? ''),
                'idnumber' => (string)($grouping->idnumber ?? ''),
                'configdata' => (string)($grouping->configdata ?? ''),
            ];
        }

        return $items;
    }

    /**
     * Identification fields enabled in the plugin settings (AP-A5: Moodle id + these fields only).
     *
     * Mirrors local_groupimport_get_allowed_user_field_definitions() in manage.php,
     * which cannot be loaded from a class. Remove the legacy copy at step 7.
     *
     * @return array Field key => label, in settings order.
     */
    public static function get_identifier_field_definitions(): array {
        global $DB;

        $definitions = [
            'username' => get_string('username'),
            'email' => get_string('email'),
            'idnumber' => get_string('idnumber'),
        ];
        foreach ($DB->get_records('user_info_field', null, 'name ASC', 'id, shortname, name') as $field) {
            $definitions['profile_field_' . $field->shortname] = format_string($field->name);
        }

        $config = get_config('local_groupimport');
        $allowed = !empty($config->alloweduserfields)
            ? array_map('trim', explode(',', $config->alloweduserfields))
            : ['username', 'email'];

        $result = [];
        foreach ($allowed as $fieldkey) {
            if (isset($definitions[$fieldkey])) {
                $result[$fieldkey] = $definitions[$fieldkey];
            }
        }

        return $result;
    }

    /**
     * What the current user may see of other participants in this course, under Moodle's rules.
     *
     * - identity: the fields of \core_user\fields::get_identity_fields() (showuseridentity, with
     *   moodle/site:viewuseridentity, hiddenuserfields and the custom profile field visibility),
     *   lowercased as Moodle returns them;
     * - hidden: $CFG->hiddenuserfields, empty when the user has moodle/course:viewhiddenuserfields;
     * - viewalldetails: moodle/user:viewalldetails, which core also requires for the username,
     *   the language and the identity fields outside showuseridentity.
     *
     * @param \context_course $context Course context.
     * @return array {identity: array, hidden: array, viewalldetails: bool}
     */
    public static function get_field_access(\context_course $context): array {
        global $CFG;

        $hidden = [];
        if (!has_capability('moodle/course:viewhiddenuserfields', $context)) {
            $hidden = array_filter(array_map('trim', explode(',', (string)($CFG->hiddenuserfields ?? ''))));
        }

        return [
            'identity' => array_flip(\core_user\fields::get_identity_fields($context, true)),
            'hidden' => array_flip($hidden),
            'viewalldetails' => has_capability('moodle/user:viewalldetails', $context),
            'viewidentity' => has_capability('moodle/site:viewuseridentity', $context),
        ];
    }

    /**
     * The plugin identification fields that Moodle also lets the current user see.
     *
     * @param array $access Result of {@see self::get_field_access()}.
     * @return array Field key => label, in settings order.
     */
    public static function get_visible_identifier_fields(array $access): array {
        // The site administrator explicitly chose these identification fields in the plugin
        // settings, so a standard field is available to anyone allowed to see user identity
        // (moodle/site:viewuseridentity), even when showuseridentity does not list it.
        // Custom profile fields keep Moodle's identity listing, which applies their own visibility.
        return array_filter(self::get_identifier_field_definitions(), static function(string $fieldkey) use ($access): bool {
            $key = \core_text::strtolower($fieldkey);
            if (isset($access['identity'][$key])) {
                return true;
            }
            return !empty($access['viewidentity']) && strpos($key, 'profile_field_') !== 0;
        }, ARRAY_FILTER_USE_KEY);
    }

    /**
     * A standard identity field, as user_get_user_details() returns it.
     *
     * @param array $access Result of {@see self::get_field_access()}.
     * @param string $field username, idnumber, institution or department.
     * @param \stdClass $user User record.
     * @return string The value, or '' when the current user may not see it.
     */
    protected static function identity_value(array $access, string $field, \stdClass $user): string {
        if (!isset($access['identity'][$field]) && !$access['viewalldetails']) {
            return '';
        }
        return (string)($user->{$field} ?? '');
    }

    /**
     * Participant description in its own format, with its files served from the user context.
     *
     * @param \stdClass $user User record with description and descriptionformat.
     * @param array $access Result of {@see self::get_field_access()}.
     * @return string Formatted HTML, or '' when hiddenuserfields hides it from the current user.
     */
    public static function format_user_description(\stdClass $user, array $access): string {
        $description = (string)($user->description ?? '');
        if ($description === '' || isset($access['hidden']['description'])) {
            return '';
        }
        $usercontext = \context_user::instance((int)$user->id, IGNORE_MISSING);
        if (!$usercontext) {
            return '';
        }
        $description = file_rewrite_pluginfile_urls($description, 'pluginfile.php', $usercontext->id, 'user', 'profile', null);
        return format_text($description, $user->descriptionformat ?? FORMAT_HTML, ['context' => $usercontext]);
    }

    /**
     * Group or grouping description in its own format, with its files served from the course context.
     *
     * @param \stdClass $record Group or grouping record.
     * @param \context_course $context Course context.
     * @param string $component group or grouping.
     * @param string $filearea File area.
     * @return string Formatted HTML.
     */
    protected static function format_description(\stdClass $record, \context_course $context, string $component,
            string $filearea): string {
        $description = (string)($record->description ?? '');
        if ($description === '') {
            return '';
        }
        $description = file_rewrite_pluginfile_urls($description, 'pluginfile.php', $context->id, $component, $filearea,
            (int)$record->id);
        return format_text($description, $record->descriptionformat ?? FORMAT_HTML, ['context' => $context]);
    }

    /**
     * Participant card badge and detail fields configured in the plugin settings.
     *
     * Mirrors local_groupimport_get_participant_display_settings() in manage.php, minus the
     * profile fields whose visibility setting hides them from the current user in this course.
     *
     * @param \context_course $context Course context.
     * @return array {primary: ?array, details: array}
     */
    protected static function get_display_settings(\context_course $context): array {
        global $DB;

        $customfields = [];
        foreach ($DB->get_records('user_info_field', null, 'name ASC') as $field) {
            // Field-level check, as core_userields::get_identity_fields() does. The signup flag is
            // cleared: with no user id, is_visible() would otherwise treat it as a signup form.
            $fielddata = clone $field;
            $fielddata->signup = 0;
            if (profile_get_user_field($field->datatype, (int)$field->id, 0, $fielddata)->is_visible($context)) {
                $customfields['profile_field_' . $field->shortname] = format_string($field->name);
            }
        }

        $config = get_config('local_groupimport');
        $primarykey = !empty($config->participantprimarybadgefield) && isset($customfields[$config->participantprimarybadgefield])
            ? (string)$config->participantprimarybadgefield
            : '';

        $details = [];
        foreach (['participantdetailfield1', 'participantdetailfield2'] as $settingname) {
            $fieldkey = !empty($config->{$settingname}) ? (string)$config->{$settingname} : '';
            if ($fieldkey !== '' && isset($customfields[$fieldkey]) && $fieldkey !== $primarykey &&
                    !in_array($fieldkey, array_column($details, 'key'), true)) {
                $details[] = ['key' => $fieldkey, 'label' => $customfields[$fieldkey]];
            }
        }

        return [
            'primary' => $primarykey === '' ? null : [
                'key' => $primarykey,
                'label' => $customfields[$primarykey],
                'bgcolor' => self::normalise_hex_colour($config->participantprimarybadgebgcolor ?? '', '#e8f4ff'),
                'textcolor' => self::normalise_hex_colour($config->participantprimarybadgetextcolor ?? '', '#0b4f8a'),
            ],
            'details' => $details,
        ];
    }

    /**
     * Custom profile values for many users, read in chunks.
     *
     * @param int[] $userids User ids.
     * @param string[] $fieldkeys Keys of the form profile_field_<shortname>.
     * @return array User id => field key => raw value.
     */
    protected static function get_custom_field_values(array $userids, array $fieldkeys): array {
        global $DB;

        $shortnames = [];
        foreach ($fieldkeys as $fieldkey) {
            if (strpos($fieldkey, 'profile_field_') === 0) {
                $shortnames[] = substr($fieldkey, strlen('profile_field_'));
            }
        }
        if (!$userids || !$shortnames) {
            return [];
        }

        [$fieldsql, $fieldparams] = $DB->get_in_or_equal($shortnames, SQL_PARAMS_NAMED, 'field');
        $values = [];
        foreach (array_chunk($userids, self::CHUNK_SIZE) as $chunk) {
            [$usersql, $userparams] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'user');
            $recordset = $DB->get_recordset_sql(
                "SELECT d.id, d.userid, f.shortname, d.data
                   FROM {user_info_data} d
                   JOIN {user_info_field} f ON f.id = d.fieldid
                  WHERE d.userid $usersql
                    AND f.shortname $fieldsql",
                $userparams + $fieldparams
            );
            foreach ($recordset as $record) {
                $values[(int)$record->userid]['profile_field_' . $record->shortname] = (string)$record->data;
            }
            $recordset->close();
        }

        return $values;
    }

    /**
     * Group memberships of the course, indexed both ways, in one query.
     *
     * @param int $courseid Course id.
     * @return array {byuser, bygroup, count}
     */
    protected static function get_group_memberships(int $courseid): array {
        global $DB;

        $recordset = $DB->get_recordset_sql(
            "SELECT gm.id, gm.userid, gm.groupid
               FROM {groups_members} gm
               JOIN {groups} g ON g.id = gm.groupid
              WHERE g.courseid = :courseid
           ORDER BY gm.userid ASC, gm.groupid ASC",
            ['courseid' => $courseid]
        );
        $byuser = [];
        $bygroup = [];
        $count = 0;
        foreach ($recordset as $record) {
            $byuser[(int)$record->userid][] = (int)$record->groupid;
            $bygroup[(int)$record->groupid][] = (int)$record->userid;
            $count++;
        }
        $recordset->close();

        return ['byuser' => $byuser, 'bygroup' => $bygroup, 'count' => $count];
    }

    /**
     * Grouping memberships indexed both ways, read in chunks.
     *
     * @param int[] $groupingids Grouping ids.
     * @return array {bygroup, bygrouping}
     */
    protected static function get_grouping_memberships(array $groupingids): array {
        global $DB;

        $bygroup = [];
        $bygrouping = [];
        foreach (array_chunk($groupingids, self::CHUNK_SIZE) as $chunk) {
            [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED);
            $recordset = $DB->get_recordset_select('groupings_groups', "groupingid $insql", $params,
                'groupingid ASC, groupid ASC', 'id, groupingid, groupid');
            foreach ($recordset as $record) {
                $bygroup[(int)$record->groupid][] = (int)$record->groupingid;
                $bygrouping[(int)$record->groupingid][] = (int)$record->groupid;
            }
            $recordset->close();
        }

        return ['bygroup' => $bygroup, 'bygrouping' => $bygrouping];
    }

    /**
     * Course role names (sent once) and role ids per user, in the legacy order.
     *
     * @param \context_course $context Course context.
     * @return array [roles list, user id => role ids]
     */
    protected static function get_roles(\context_course $context): array {
        global $DB;

        $recordset = $DB->get_recordset_sql(
            "SELECT ra.id, ra.userid, r.id AS roleid, r.name, r.shortname, r.sortorder
               FROM {role_assignments} ra
               JOIN {role} r ON r.id = ra.roleid
              WHERE ra.contextid = :contextid
           ORDER BY r.sortorder ASC, r.shortname ASC",
            ['contextid' => $context->id]
        );
        $roles = [];
        $userroles = [];
        foreach ($recordset as $record) {
            $roleid = (int)$record->roleid;
            if (!isset($roles[$roleid])) {
                $roles[$roleid] = [
                    'id' => $roleid,
                    'name' => role_get_name((object)[
                        'id' => $roleid,
                        'name' => $record->name,
                        'shortname' => $record->shortname,
                    ], $context),
                ];
            }
            $userroles[(int)$record->userid][$roleid] = $roleid;
        }
        $recordset->close();

        return [array_values($roles), $userroles];
    }

    /**
     * Load user contexts in chunks so user_picture does not query them one by one.
     *
     * @param int[] $userids User ids.
     */
    protected static function preload_user_contexts(array $userids): void {
        global $DB;

        $select = \context_helper::get_preload_record_columns_sql('ctx');
        foreach (array_chunk($userids, self::CHUNK_SIZE) as $chunk) {
            [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'ctxuser');
            $params['contextlevel'] = CONTEXT_USER;
            $recordset = $DB->get_recordset_sql(
                "SELECT $select
                   FROM {context} ctx
                  WHERE ctx.contextlevel = :contextlevel AND ctx.instanceid $insql",
                $params
            );
            foreach ($recordset as $record) {
                \context_helper::preload_from_record($record);
            }
            $recordset->close();
        }
    }

    /**
     * Normalise a stored colour before the browser injects it into inline CSS variables.
     *
     * Mirrors local_groupimport_normalise_hex_colour() in manage.php.
     *
     * @param string|null $colour Stored colour.
     * @param string $fallback Fallback colour.
     * @return string Safe lowercase hex colour.
     */
    protected static function normalise_hex_colour(?string $colour, string $fallback): string {
        $colour = trim((string)$colour);
        return preg_match('/^#[0-9a-fA-F]{6}$/', $colour) ? \core_text::strtolower($colour) : $fallback;
    }

    /**
     * Convert a key => label map to a list, preserving order.
     *
     * @param array $map Key => label.
     * @return array
     */
    protected static function to_label_list(array $map): array {
        $list = [];
        foreach ($map as $key => $label) {
            $list[] = ['key' => (string)$key, 'label' => (string)$label];
        }
        return $list;
    }

    /**
     * Refuse a course/context mismatch early.
     *
     * @param \stdClass $course Course record.
     * @param \context_course $context Course context.
     */
    protected static function assert_context(\stdClass $course, \context_course $context): void {
        if ((int)$course->id !== (int)$context->instanceid) {
            throw new \coding_exception('Course and context must match.');
        }
    }
}
