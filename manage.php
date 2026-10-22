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
 * EasyStud simplified course group manager.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php');

$id = required_param('id', PARAM_INT);
$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

if (!local_groupimport_is_simplified_view_enabled()) {
    redirect(
        new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
        get_string('simplifiedviewdisabled', 'local_groupimport'),
        null,
        \core\output\notification::NOTIFY_INFO
    );
}

$url = new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]);
$PAGE->set_url($url);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_pagetype('course-view-participants');
$PAGE->set_secondary_active_tab('participants');
if (local_groupimport_is_moodle53()) {
    $PAGE->add_body_class('local-groupimport-host-moodle53');
}
$PAGE->set_title(get_string('easystudmanager', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
// Animation level (user choice, else administrator default): root attributes and body classes.
$motionlevel = \local_groupimport\local\motion::apply_to_page($PAGE);
$animationsenabled = $motionlevel !== 'minimal';
$PAGE->requires->css('/local/groupimport/styles/student-management.css');
// The Guide rules are a separate, cache-shared sheet requested by every consumer page (K22, Kevin
// 22/10, option 2 of RAPPORT-I9-X6-X7-20261022.md): same mechanism index.php already uses.
$PAGE->requires->css('/local/groupimport/styles/guide.css');
$PAGE->requires->js('/local/groupimport/js/loading_state_bootstrap.js', true);
$PAGE->requires->js_call_amd('local_groupimport/guide_welcome', 'init', [
    '[data-easyedu-guide-root]', [
        'eligible' => \local_groupimport\local\guide_welcome::should_offer(),
        'generation' => \local_groupimport\local\guide_welcome::generation(),
        'endpoint' => (new moodle_url('/local/groupimport/guide_welcome.php'))->out(false),
        'courseid' => $course->id,
        'sesskey' => sesskey(),
    ],
]);
$guideinitargs = [
    '[data-easyedu-guide-root]',
    \local_groupimport\output\guide_config::build_js_config($course->id),
];
$managerinitargs = [
    'local-groupimport-easystud',
    $course->id,
    [
        // Labels of the cards rendered in the browser: the on-demand lists and the Guide specimens
        // (amd/src/local/sm/specimen.js). Participant card (templates/sm/participant_card).
        'cardstrings' => [
            'selectionmodelabel' => get_string('selectionmode', 'local_groupimport'),
            'viewdetailslabel' => get_string('viewparticipantdetails', 'local_groupimport'),
            'roleslabel' => get_string('roleslabel', 'local_groupimport'),
            'groupslabel' => get_string('groupslabel', 'local_groupimport'),
            'groupingslabel' => get_string('groupingslabel', 'local_groupimport'),
            'norole' => get_string('norole', 'local_groupimport'),
            'nogroup' => get_string('nogroup', 'local_groupimport'),
            'nogrouping' => get_string('nogrouping', 'local_groupimport'),
            'showless' => get_string('showless', 'local_groupimport'),
            // Shown in the list when the course state cannot be loaded.
            'loaderror' => get_string('smstateloaderror', 'local_groupimport'),
            'reload' => get_string('reload'),
            // K21-16: participant cards collapse their meta details by default (admin setting).
            // Unset config (fresh install, before the settings page defaults are applied) keeps
            // the collapsed behaviour: only an explicit "0" switches it off. K21-37: there is no
            // fold control any more, selecting the card is what expands it (restored pre-K21-16
            // behaviour); this setting only affects the state of an unselected card.
            'metacollapsedbydefault' => get_config('local_groupimport', 'participantcardcollapsed') !== '0',
        ],
        // Labels of the catalog group card rendered in the browser (templates/sm/group_card).
        'groupstrings' => [
            'memberscount' => local_groupimport_count_template('memberscount'),
            'removeuserfromgroup' => get_string('removeuserfromgroup', 'local_groupimport', '__name__'),
            'removemembernamedgroup' => get_string('removemembernamedgroup', 'local_groupimport', (object)[
                'member' => '__member__', 'group' => '__group__',
            ]),
            'removefromgrouplabel' => get_string('contextremovemember', 'local_groupimport'),
            'nomemberslabel' => get_string('nogroupmembers', 'local_groupimport'),
            'nomembershelplabel' => get_string('emptygrouphelp', 'local_groupimport'),
            'nomembershelptouchlabel' => get_string('emptygrouphelptouch', 'local_groupimport'),
            'removefromgroupinglabel' => get_string('removegroupfromgrouping', 'local_groupimport'),
            'addemailstolabel' => get_string('addemailstogroup', 'local_groupimport'),
            'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
            'addemailsbutton' => get_string('addemails', 'local_groupimport'),
            // R10-05: member "Select all" of a card; __name__ is the group name.
            'selectallmembers' => get_string('selectall', 'local_groupimport'),
            'deselectallmembers' => get_string('deselectall', 'local_groupimport'),
            'selectallmembersof' => get_string('selectallmembersof', 'local_groupimport', '__name__'),
            'deselectallmembersof' => get_string('deselectallmembersof', 'local_groupimport', '__name__'),
            'renamelabel' => get_string('rename', 'local_groupimport'),
            'savelabel' => get_string('save'),
            'cancellabel' => get_string('cancel'),
            'sesskey' => sesskey(),
            'renameurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]))->out(false),
            'groupnativeurl' => (new moodle_url('/group/group.php', ['courseid' => $course->id]))->out(false),
        ],
    ],
];
$PAGE->requires->js_call_amd('local_groupimport/page_bootstrap', 'init', ['easystud-page-config']);
$action = optional_param('action', '', PARAM_ALPHA);
// Create/rename write course data: only accept them from the plugin's POST forms, and fail loudly on a bad session key.
if ($action && data_submitted()) {
    require_sesskey();
    if ($action === 'creategroup') {
        $names = local_groupimport_extract_create_names(required_param('groupname', PARAM_TEXT));
        $created = 0;
        foreach ($names as $name) {
            if (groups_get_group_by_name($course->id, $name)) {
                redirect($url, get_string('groupnameexists', 'group', $name), null, \core\output\notification::NOTIFY_ERROR);
            }
            $group = (object)[
                'courseid' => $course->id,
                'name' => $name,
            ];
            groups_create_group($group);
            $created++;
        }
        if ($created) {
            $message = $created === 1 ? get_string('groupcreated', 'local_groupimport') :
                local_groupimport_count_string('groupscreatedcount', (int)$created);
            redirect($url, $message, null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'creategrouping') {
        $names = local_groupimport_extract_create_names(required_param('groupingname', PARAM_TEXT));
        $created = 0;
        foreach ($names as $name) {
            if (groups_get_grouping_by_name($course->id, $name)) {
                redirect($url, get_string('groupingnameexists', 'group', $name), null, \core\output\notification::NOTIFY_ERROR);
            }
            $grouping = (object)[
                'courseid' => $course->id,
                'name' => $name,
            ];
            groups_create_grouping($grouping);
            $created++;
        }
        if ($created) {
            $message = $created === 1 ? get_string('groupingcreated', 'local_groupimport') :
                local_groupimport_count_string('groupingscreatedcount', (int)$created);
            redirect($url, $message, null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'renamegroup') {
        $groupid = required_param('groupid', PARAM_INT);
        $name = required_param('name', PARAM_TEXT);
        \local_groupimport\local\ajax_security::validate_name(trim($name));
        $group = groups_get_group($groupid);
        if ($group && (int)$group->courseid === (int)$course->id && trim($name) !== '') {
            $name = trim($name);
            if ($name !== (string)$group->name && groups_get_group_by_name($course->id, $name)) {
                redirect($url, get_string('groupnameexists', 'group', $name), null, \core\output\notification::NOTIFY_ERROR);
            }
            $group->name = $name;
            groups_update_group($group);
            redirect($url, get_string('groupsaved', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'renamegrouping') {
        global $DB;
        $groupingid = required_param('groupingid', PARAM_INT);
        $name = required_param('name', PARAM_TEXT);
        \local_groupimport\local\ajax_security::validate_name(trim($name));
        $grouping = $DB->get_record('groupings', ['id' => $groupingid, 'courseid' => $course->id], '*', MUST_EXIST);
        if (trim($name) !== '') {
            $name = trim($name);
            if ($name !== (string)$grouping->name && groups_get_grouping_by_name($course->id, $name)) {
                redirect($url, get_string('groupingnameexists', 'group', $name), null, \core\output\notification::NOTIFY_ERROR);
            }
            $grouping->name = $name;
            groups_update_grouping($grouping);
            redirect($url, get_string('groupingsaved', 'local_groupimport'), null, \core\output\notification::NOTIFY_SUCCESS);
        }
    }
}

// SM-RENDU on-demand mode: the browser renders the cards from local_groupimport_get_state, so the
// page only loads the lean data it still needs (filters, counts, grouping headers).
//
// I8 (AUDIT-REFACTORING-CODE-20261021): page_data() and get_state::execute() used to be called
// separately here, each rebuilding enrolled users, roles, groups and grouping memberships from
// scratch (enrolled users/roles/groups/groupings/grouping-memberships read twice). build() is now
// called once; page_data_from_build() derives the lean page shape from that same result in memory
// (plus one light query scoped to the known grouping ids, for the description/configdata fields
// build() deliberately omits from its per-card payload). The authenticated document and the first
// store still share one fresh response snapshot; no persistent cache, every reload rebuilds it.
// require_capability('moodle/course:managegroups', $context) already ran unconditionally above
// (line 34); course_state::build()/page_data() only assert_context() internally, as before.
$initialstatejson = false;
try {
    $builtstate = \local_groupimport\service\course_state::build($course, $context);
    $state = \local_groupimport\service\course_state::page_data_from_build($builtstate, $course, $context);
    $state = local_groupimport_prepare_manage_names($state, $context);
    $initialstatejson = json_encode(
        $builtstate,
        JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT |
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    unset($builtstate);
} catch (\Throwable $exception) {
    // Keep the existing AJAX error/retry path authoritative if preparation fails: fall back to the
    // lean page data alone, exactly as before this change, and omit the initial-state script.
    $state = \local_groupimport\service\course_state::page_data($course, $context);
    $state = local_groupimport_prepare_manage_names($state, $context);
    $initialstatejson = false;
}

$users = $state['users'];
$groups = $state['groups'];
$groupings = $state['groupings'];

// Build Moodle's settings navigation after the page header has initialised it.
// The participants action bar reads that server-side tree for its capability
// filtered select menu.
echo $OUTPUT->header();
// Keep large translated configurations out of Moodle's inline AMD call arguments.
// Hex escaping prevents course text or translations from terminating this JSON element.
echo html_writer::tag('script', json_encode([
    'guide' => $guideinitargs,
    'manager' => $managerinitargs,
], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR), [
    'type' => 'application/json',
    'id' => 'easystud-page-config',
]);

if ($initialstatejson !== false) {
    echo html_writer::tag('script', $initialstatejson, [
        'type' => 'application/json',
        'id' => 'easystud-initial-state',
    ]);
    unset($initialstatejson);
}

$navigationdata = local_groupimport_build_navigation_context($course, $PAGE, $OUTPUT);

$templatedata = \local_groupimport\output\manage_page::build_template_data(
    $course,
    $users,
    $groups,
    $groupings,
    $navigationdata
);
$templatedata['animationsenabled'] = $animationsenabled;
$templatedata['motionlevel'] = $motionlevel;
$templatedata['motionpolicy'] = $animationsenabled ? 'enabled' : 'disabled';
// The Guide is portalled out of the root on compact layouts: it carries the level itself.
$templatedata['easyeduguide']['motionlevel'] = $motionlevel;
$templatedata['easyeduguide']['motionpolicy'] = $templatedata['motionpolicy'];
// K21-51 Rail-anchor: the desktop rail shows the Guide as a labelled capsule.
$templatedata['easyeduguide']['launchershortlabel'] = get_string('guidebadgelabel', 'local_groupimport');
$templatedata['themestyle'] = local_groupimport_get_theme_style();
$templatedata['themerailroles'] = local_groupimport_get_theme_rail_roles();
$templatedata['navigation']['hasguide'] = true;
$templatedata['navigation']['guidehtml'] = $OUTPUT->render_from_template(
    'local_groupimport/easyedu_guide',
    $templatedata['easyeduguide']
);

echo $OUTPUT->render_from_template('local_groupimport/manage', $templatedata);

echo $OUTPUT->footer();

/**
 * Build role filter options from users: one option per course role, valued by its role id.
 *
 * The browser matches these ids against the course role ids of the state (V2 n°6), never
 * role names: two roles can share a name (custom role, course role renaming).
 *
 * @param array $users User records, 'roles' being role id => name.
 * @return array Role id => name, sorted by name.
 */
function local_groupimport_role_filter_options(array $users): array {
    $roles = [];
    foreach ($users as $user) {
        foreach ($user['roles'] as $roleid => $role) {
            $roles[(int)$roleid] = $role;
        }
    }
    natcasesort($roles);
    return $roles;
}

/**
 * Build group filter options.
 *
 * @param array $groups Groups.
 * @return array
 */
function local_groupimport_group_filter_options(array $groups): array {
    $options = [];
    foreach ($groups as $group) {
        $options[(string)$group['id']] = $group['name'];
    }
    natcasesort($options);
    return $options;
}

/**
 * Build grouping filter options.
 *
 * @param array $groupings Groupings.
 * @return array
 */
function local_groupimport_grouping_filter_options(array $groupings): array {
    $options = [
        '__none__' => get_string('nogroupingfilteroption', 'local_groupimport'),
    ];
    foreach ($groupings as $grouping) {
        $options[(string)$grouping['id']] = $grouping['name'];
    }
    natcasesort($options);
    return $options;
}



/**
 * Build one destination item for the shared navigation contract.
 *
 * @param string $id Stable item id.
 * @param string $label Translated item label.
 * @param string $url Destination URL.
 * @param bool $current Whether this is the current destination.
 * @param string $icon Optional Font Awesome icon class.
 * @return array
 */
function local_groupimport_navigation_destination(
    string $id,
    string $label,
    string $url,
    bool $current = false,
    string $icon = ''
): array {
    return [
        'id' => $id,
        'kind' => 'destination',
        'label' => $label,
        'accessiblelabel' => $label,
        'url' => $url,
        'icon' => $icon,
        'islink' => true,
        'isbutton' => false,
        'isdisclosure' => false,
        'current' => $current,
        'disabled' => false,
        'destructive' => false,
        'badge' => '',
        'haschildren' => false,
    ];
}

/**
 * Build the normalized EasyStud navigation from Moodle's server-side export.
 *
 * Moodle's participants action bar owns permission resolution and third-party
 * node visibility. EasyStud only maps that export into the shared UI Kit
 * context; it does not parse rendered HTML or rebuild a second menu in JS.
 *
 * @param stdClass $course Course record.
 * @param moodle_page $page Current Moodle page.
 * @param renderer_base $output Current renderer.
 * @return array
 */
function local_groupimport_build_navigation_context(
    stdClass $course,
    moodle_page $page,
    renderer_base $output
): array {
    $actionbar = new \core\output\participants_action_bar($course, $page, null);
    $exported = $actionbar->export_for_template($output);
    $native = $exported['navigation'] ?? null;
    if ($native instanceof \stdClass) {
        // Keep Moodle's native options and accessible label. The EasyStud
        // route is the current destination, so present it as the menu title.
        $native->inlinelabel = false;
        $native->selectedoption = get_string('easystudmanager', 'local_groupimport');
    }
    $sections = [];

    $productitems = [
        local_groupimport_navigation_destination(
            'easystud-manager',
            get_string('easystudmanager', 'local_groupimport'),
            (new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]))->out(false),
            true,
            'fa fa-users'
        ),
        local_groupimport_navigation_destination(
            'easystud-import',
            get_string('csvimportlink', 'local_groupimport'),
            (new moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(false),
            false,
            'fa fa-file-import'
        ),
        [
            'id' => 'easystud-clipboard',
            'kind' => 'utility',
            'label' => get_string('clipboardtools', 'local_groupimport'),
            'accessiblelabel' => get_string('clipboardtools', 'local_groupimport'),
            'action' => 'open-clipboard',
            'icon' => 'fa fa-clipboard-list',
            'islink' => false,
            'isbutton' => true,
            'isdisclosure' => false,
            'current' => false,
            'disabled' => false,
            'destructive' => false,
            'badge' => '',
            'haschildren' => false,
        ],
    ];
    $sections[] = [
        'id' => 'easystud-tools',
        'label' => get_string('easystudlabel', 'local_groupimport'),
        'items' => $productitems,
    ];

    return [
        'rootid' => 'local-groupimport-easystud-navigation',
        'panelid' => 'local-groupimport-easystud-navigation-panel',
        'anchorselector' => '[data-region="drawer-toggle"]',
        'navigationlabel' => get_string('participantsnavigation', 'course'),
        'triggerlabel' => get_string('mobilemenu', 'local_groupimport'),
        'closelabel' => get_string('mobilenavigationclose', 'local_groupimport'),
        'triggericon' => 'fa fa-bars',
        'closeicon' => 'fa fa-times',
        'emptylabel' => get_string('navigationempty', 'local_groupimport'),
        'drawertitle' => get_string('easystudlabel', 'local_groupimport'),
        'drawersubtitle' => get_string('easystudmanager', 'local_groupimport'),
        // K21-51: the desktop rail carries the product identity and the active view.
        'identityrail' => true,
        'identitysubtitle' => get_string('participants'),
        'spaceslabel' => get_string('mobilenavigationspaces', 'local_groupimport'),
        'hasitems' => !empty($sections),
        'hasparticipantdropdown' => $native && !empty($native->options),
        'participantnavigationlabel' => get_string('mobilenavigationmoodle', 'local_groupimport'),
        'participantdropdown' => $native,
        'sections' => $sections,
        'drawersections' => local_groupimport_build_drawer_sections($sections),
    ];
}

/**
 * Return the user identification fields enabled in plugin settings.
 *
 * @return array
 */
function local_groupimport_get_allowed_user_field_definitions(): array {
    return \local_groupimport\local\participant_fields::identifier_field_definitions();
}













/**
 * Build select options for Mustache.
 *
 * @param array $options Key => label.
 * @return array
 */
function local_groupimport_build_select_options(array $options): array {
    $result = [];
    foreach ($options as $value => $label) {
        $result[] = [
            'value' => $value,
            'label' => $label,
        ];
    }
    return $result;
}



/**
 * Build the template data of a grouping header (its group cards are rendered in the browser).
 *
 * @param int $courseid Course id.
 * @param array $grouping Grouping data.
 * @return array
 */
function local_groupimport_build_grouping_template_data(int $courseid, array $grouping): array {
    $result = [
        'id' => $grouping['id'],
        'name' => $grouping['name'],
        'description' => $grouping['description'] ?? '',
        'rawdescription' => $grouping['rawdescription'] ?? '',
        'idnumber' => $grouping['idnumber'] ?? '',
        'configdata' => $grouping['configdata'] ?? '',
        'nativeurl' => (new moodle_url('/group/grouping.php', [
            'courseid' => $courseid,
            'id' => $grouping['id'],
        ]))->out(false),
        'groupcount' => (int)$grouping['groupcount'],
        'countlabel' => local_groupimport_count_string('groupscount', (int)$grouping['groupcount']),
        'countbadgeclass' => 'local-groupimport-easystud-count-badge local-groupimport-easystud-count-badge--grouping ' .
            'local-groupimport-easystud-count-badge--' . ((int)$grouping['groupcount'] ? 'filled' : 'empty'),
        'counttemplate' => local_groupimport_count_template('groupscount'),
        'sesskey' => sesskey(),
        'renameurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]))->out(false),
        'renameaction' => 'renamegrouping',
        'renameidname' => 'groupingid',
        'rawname' => $grouping['rawname'],
        'renamelabel' => get_string('rename', 'local_groupimport'),
        'savelabel' => get_string('save'),
        'cancellabel' => get_string('cancel'),
        'addgroupslabel' => get_string('addgroupstogrouping', 'local_groupimport'),
        'pastegroupsplaceholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
        'addgroupsbutton' => get_string('addgroups', 'local_groupimport'),
    ];

    $result['searchtext'] = core_text::strtolower(trim($grouping['name']));

    return $result;
}























/**
 * Extract group or grouping names from a separated quick-create field.
 *
 * @param string $text Raw field value.
 * @return array
 */
function local_groupimport_extract_create_names(string $text): array {
    return \local_groupimport\local\create_names::extract($text);
}

/**
 * Convert a 1-based number into A, B, ..., Z, AA, AB...
 *
 * @param int $number Number.
 * @return string
 */
function local_groupimport_number_to_letters(int $number): string {
    return \local_groupimport\local\create_names::number_to_letters($number);
}
