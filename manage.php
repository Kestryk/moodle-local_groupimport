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

use local_groupimport\service\course_structure;

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
$PAGE->set_title(get_string('easystudmanager', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
$animationconfig = get_config('local_groupimport', 'enableanimations');
$animationsenabled = $animationconfig === false ? true : (bool)$animationconfig;
if (!$animationsenabled) {
    $PAGE->add_body_class('local-groupimport-motion-disabled');
    $PAGE->add_body_class('easyedu-motion-disabled');
}
$PAGE->requires->js('/local/groupimport/js/loading_state_bootstrap.js', true);
$PAGE->requires->js_call_amd('local_groupimport/easyedu_guide', 'init', [
    '[data-easyedu-guide-root]',
    local_groupimport_build_easyedu_guide_js_config($course->id),
]);
$PAGE->requires->js_call_amd('local_groupimport/course_manager', 'init', [
    'local-groupimport-easystud',
    $course->id,
]);
$action = optional_param('action', '', PARAM_ALPHA);
if ($action && confirm_sesskey()) {
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
                get_string('groupscreatedcount', 'local_groupimport', $created);
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
                get_string('groupingscreatedcount', 'local_groupimport', $created);
            redirect($url, $message, null, \core\output\notification::NOTIFY_SUCCESS);
        }
    } else if ($action === 'renamegroup') {
        $groupid = required_param('groupid', PARAM_INT);
        $name = required_param('name', PARAM_TEXT);
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

$state = course_structure::get_state($course, $context);
$users = $state['users'];
$groups = $state['groups'];
$groupings = $state['groupings'];

// Build Moodle's settings navigation after the page header has initialised it.
// The participants action bar reads that server-side tree for its capability
// filtered select menu.
echo $OUTPUT->header();

$navigationdata = local_groupimport_build_navigation_context($course, $PAGE, $OUTPUT);

$templatedata = local_groupimport_build_manage_template_data(
    $course,
    $users,
    $groups,
    $groupings,
    $state['ungroupedgroupids'],
    $navigationdata
);
$templatedata['animationsenabled'] = $animationsenabled;
$templatedata['motionpolicy'] = $animationsenabled ? 'enabled' : 'disabled';
$templatedata['navigation']['hasguide'] = true;
$templatedata['navigation']['guidehtml'] = $OUTPUT->render_from_template(
    'local_groupimport/easyedu_guide',
    $templatedata['easyeduguide']
);

echo $OUTPUT->render_from_template('local_groupimport/manage', $templatedata);

echo $OUTPUT->footer();

/**
 * Build role filter options from users.
 *
 * @param array $users User records.
 * @return array
 */
function local_groupimport_role_filter_options(array $users): array {
    $roles = [];
    foreach ($users as $user) {
        foreach ($user['roles'] as $role) {
            $roles[core_text::strtolower($role)] = $role;
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
 * Build the EasyStud page template data.
 *
 * @param stdClass $course Course record.
 * @param array $users User records.
 * @param array $groups Group records.
 * @param array $groupings Grouping records.
 * @param array $ungroupedgroupids Group ids without grouping.
 * @param array $navigationdata Normalized navigation context.
 * @return array
 */
function local_groupimport_build_manage_template_data(
    stdClass $course,
    array $users,
    array $groups,
    array $groupings,
    array $ungroupedgroupids,
    array $navigationdata
): array {
    global $CFG;

    $alloweduserfields = local_groupimport_get_allowed_user_field_definitions();
    $users = local_groupimport_enrich_users_with_copy_fields($users, $alloweduserfields);
    $customuserfields = local_groupimport_get_custom_user_field_definitions();
    $participantdisplay = local_groupimport_get_participant_display_settings($customuserfields);
    $users = local_groupimport_enrich_users_with_participant_display_fields($users, $participantdisplay, $customuserfields);
    $compactparticipantsdefault = count($users) > 5;
    $context = context_course::instance($course->id);
    $canmessageparticipants = !empty($CFG->messaging) &&
        has_all_capabilities(['moodle/site:sendmessage', 'moodle/course:bulkmessaging'], $context);
    $detaillabels = [
        'ajaxerror' => get_string('ajaxactionfailed', 'local_groupimport'),
        'actioninprogress' => get_string('actioninprogress', 'local_groupimport'),
        'username' => get_string('detailusername', 'local_groupimport'),
        'idnumber' => get_string('detailidnumber', 'local_groupimport'),
        'institution' => get_string('detailinstitution', 'local_groupimport'),
        'department' => get_string('detaildepartment', 'local_groupimport'),
        'city' => get_string('detailcity', 'local_groupimport'),
        'country' => get_string('detailcountry', 'local_groupimport'),
        'language' => get_string('detaillanguage', 'local_groupimport'),
        'roles' => get_string('roleslabel', 'local_groupimport'),
        'groups' => get_string('groupslabel', 'local_groupimport'),
        'groupings' => get_string('groupingslabel', 'local_groupimport'),
        'participantdetails' => get_string('participantdetails', 'local_groupimport'),
        'groupdetails' => get_string('groupdetails', 'local_groupimport'),
        'groupingdetails' => get_string('groupingdetails', 'local_groupimport'),
        'pluginname' => get_string('pluginname', 'local_groupimport'),
        'nativedetails' => get_string('opennativeprofile', 'local_groupimport'),
        'removeuser' => str_replace('{}', '{name}', get_string('removeuserfromgroup', 'local_groupimport')),
        'selectionmode' => get_string('selectionmode', 'local_groupimport'),
        'showless' => get_string('showless', 'local_groupimport'),
        'groupswithoutgrouping' => get_string('groupswithoutgrouping', 'local_groupimport'),
        'rename' => get_string('rename', 'local_groupimport'),
        'save' => get_string('save'),
        'addemailstogroup' => get_string('addemailstogroup', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'addemails' => get_string('addemails', 'local_groupimport'),
        'addgroupstogrouping' => get_string('addgroupstogrouping', 'local_groupimport'),
        'removefromgroupinglabel' => get_string('removegroupfromgrouping', 'local_groupimport'),
        'pastegroupsplaceholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
        'addgroups' => get_string('addgroups', 'local_groupimport'),
        'duplicate' => get_string('duplicate', 'local_groupimport'),
        'nogroupmembers' => get_string('nogroupmembers', 'local_groupimport'),
        'memberscounttemplate' => get_string('memberscount', 'local_groupimport', '__count__'),
        'groupscounttemplate' => get_string('groupscount', 'local_groupimport', '__count__'),
        'groupstructuresummarytemplate' => get_string('groupstructuresummary', 'local_groupimport', (object)[
            'groupings' => '__groupings__',
            'groups' => '__groups__',
        ]),
        'removeuserscount' => get_string('membersremoved', 'local_groupimport', '__count__'),
        'groupsmovedcount' => get_string('groupsmovedcount', 'local_groupimport', '__count__'),
        'groupsremovedfromgroupingscount' => get_string('groupsremovedfromgroupingscount', 'local_groupimport', '__count__'),
        'groupsmovesummary' => get_string('groupsmovesummary', 'local_groupimport', (object)[
            'added' => '__added__',
            'existing' => '__existing__',
        ]),
        'nogroupsingrouping' => get_string('nogroupsingrouping', 'local_groupimport'),
        'nogroupsavailable' => get_string('nogroupsavailable', 'local_groupimport'),
        'nogroupsincourse' => get_string('nogroupsincourse', 'local_groupimport'),
        'searchgroupslabel' => get_string('searchgroupslabel', 'local_groupimport'),
        'searchgroupsplaceholder' => get_string('searchgroups', 'local_groupimport'),
        'searchparticipantslabel' => get_string('searchparticipantslabel', 'local_groupimport'),
        'searchparticipants' => get_string('searchparticipants', 'local_groupimport'),
        'mobilecardactions' => get_string('mobilecardactions', 'local_groupimport'),
        'moreactions' => get_string('moreactions', 'local_groupimport'),
        'nogroupingsavailable' => get_string('nogroupingsavailable', 'local_groupimport'),
        'nogroupingsincourse' => get_string('nogroupingsincourse', 'local_groupimport'),
        'nomovegroupsavailable' => get_string('nomovegroupsavailable', 'local_groupimport'),
        'nomovegroupingsavailable' => get_string('nomovegroupingsavailable', 'local_groupimport'),
        'noparticipantsstate' => get_string('noparticipantsstate', 'local_groupimport'),
        'noparticipantsfiltered' => get_string('noparticipantsfiltered', 'local_groupimport'),
        'noresultsfiltered' => get_string('noresultsfiltered', 'local_groupimport'),
        'movegroupremoveorigin' => get_string('movegroupremoveorigin', 'local_groupimport'),
        'groupdropmode' => get_string('groupdropmode', 'local_groupimport'),
        'groupdropmodedesc' => get_string('groupdropmodedesc', 'local_groupimport'),
        'groupdropcopy' => get_string('groupdropcopy', 'local_groupimport'),
        'groupdropmove' => get_string('groupdropmove', 'local_groupimport'),
        'cancel' => get_string('cancel'),
        'close' => get_string('closebuttontitle'),
        'selectall' => get_string('selectall', 'local_groupimport'),
        'deselectall' => get_string('deselectall', 'local_groupimport'),
        'selectresults' => get_string('selectresults', 'local_groupimport'),
        'deselectresults' => get_string('deselectresults', 'local_groupimport'),
        'selectioncounttemplate' => get_string('selectioncount', 'local_groupimport', '__count__'),
        'listeditemscounttemplate' => get_string('listeditemscount', 'local_groupimport', '__count__'),
        'sortitems' => get_string('sortitems', 'local_groupimport'),
        'sortalpha' => get_string('sortalpha', 'local_groupimport'),
        'sortfilledfirst' => get_string('sortfilledfirst', 'local_groupimport'),
        'sortemptyfirst' => get_string('sortemptyfirst', 'local_groupimport'),
        'sortparticipantswithgroups' => get_string('sortparticipantswithgroups', 'local_groupimport'),
        'sortparticipantswithoutgroups' => get_string('sortparticipantswithoutgroups', 'local_groupimport'),
        'groupingoverflowlabel' => get_string('groupingoverflowlabel', 'local_groupimport', '__count__'),
        'advancedsettings' => get_string('advancedsettings', 'local_groupimport'),
        'advancedsettingsintro' => get_string('advancedsettingsintro', 'local_groupimport'),
        'advancedsettingsnative' => get_string('advancedsettingsnative', 'local_groupimport'),
        'advancedsettingsimage' => get_string('advancedsettingsimage', 'local_groupimport'),
        'advancedsettingsnoimage' => get_string('advancedsettingsnoimage', 'local_groupimport'),
        'deletepicture' => get_string('deletepicture', 'local_groupimport'),
        'advancedsettingsname' => get_string('name'),
        'advancedsettingsidnumber' => get_string('idnumber'),
        'advancedsettingsdescription' => get_string('description'),
        'advancedsettingsmembers' => get_string('advancedsettingsmembers', 'local_groupimport'),
        'advancedsettingsgroups' => get_string('advancedsettingsgroups', 'local_groupimport'),
        'advancedsettingschoosefile' => get_string('advancedsettingschoosefile', 'local_groupimport'),
        'advancedsettingsnofile' => get_string('advancedsettingsnofile', 'local_groupimport'),
        'advancedsettingsenrolmentkey' => get_string('enrolmentkey', 'group'),
        'advancedsettingsenrolmentkeyhelp' => get_string('enrolmentkey_help', 'group'),
        'advancedsettingsimagehelp' => get_string('newpicture_help', 'group'),
        'advancedsettingsmembername' => get_string('fullname'),
        'advancedsettingsmemberemail' => get_string('email'),
        'advancedsettingsmemberid' => get_string('idnumber'),
        'advancedsettingsgroupname' => get_string('groupname', 'group'),
        'advancedsettingsgroupid' => get_string('idnumber'),
        'advancedsettingsgroupingname' => get_string('groupingname', 'group'),
        'advancedsettingsgroupingid' => get_string('idnumber'),
        'advancedsettingsnomembers' => get_string('advancedsettingsnomembers', 'local_groupimport'),
        'advancedsettingsnogroups' => get_string('advancedsettingsnogroups', 'local_groupimport'),
        'advancedsettingsnogroupings' => get_string('advancedsettingsnogroupings', 'local_groupimport'),
        'advancedsettingshasenrolmentkey' => get_string('yes'),
        'advancedsettingsnoenrolmentkey' => get_string('no'),
        'advancedsettingshidepicture' => get_string('advancedsettingshidepicture', 'local_groupimport'),
        'advancedsettingsconfigdata' => get_string('advancedsettingsconfigdata', 'local_groupimport'),
        'advancedsettingsnotset' => get_string('advancedsettingsnotset', 'local_groupimport'),
        'moveconfirmone' => get_string('moveconfirmone', 'local_groupimport'),
        'moveconfirmmany' => get_string('moveconfirmmany', 'local_groupimport'),
        'messagesendunavailable' => get_string('cannotsendmessages', 'core_message'),
    ];

    $rolefilteroptions = local_groupimport_role_filter_options($users);
    $groupfilteroptions = local_groupimport_group_filter_options($groups);
    $groupingfilteroptions = local_groupimport_grouping_filter_options($groupings);

    $templatedata = [
        'courseid' => $course->id,
        'detaillabelsjson' => json_encode($detaillabels),
        'navigation' => $navigationdata,
        'eyebrow' => get_string('easystudlabel', 'local_groupimport'),
        'description' => get_string('easystudmanager_desc', 'local_groupimport'),
        'loadingmanager' => get_string('loadingmanager', 'local_groupimport'),
        'managerready' => get_string('managerready', 'local_groupimport'),
        'compactparticipantsdefault' => $compactparticipantsdefault,
        'clipboardlabel' => get_string('clipboardtools', 'local_groupimport'),
        'tutoriallabel' => get_string('tutoriallabel', 'local_groupimport'),
        'tutorialtitle' => get_string('tutorialtitle', 'local_groupimport'),
        'tutorialintro' => get_string('tutorialintro', 'local_groupimport'),
        'tutorialmaptitle' => get_string('tutorialmaptitle', 'local_groupimport'),
        'tutorialprogresslabel' => get_string('tutorialprogresslabel', 'local_groupimport'),
        'tutorialparticipantlabel' => get_string('tutorialparticipantlabel', 'local_groupimport'),
        'tutorialgrouplabel' => get_string('tutorialgrouplabel', 'local_groupimport'),
        'tutorialgroupinglabel' => get_string('tutorialgroupinglabel', 'local_groupimport'),
        'tutorialprevious' => get_string('tutorialprevious', 'local_groupimport'),
        'tutorialnext' => get_string('tutorialnext', 'local_groupimport'),
        'tutorialfinish' => get_string('tutorialfinish', 'local_groupimport'),
        'tutorialnavnext' => get_string('tutorialnavnext', 'local_groupimport'),
        'tutorialnavprevious' => get_string('tutorialnavprevious', 'local_groupimport'),
        'tutorialshowinview' => get_string('tutorialshowinview', 'local_groupimport'),
        'tutorialshowinviewhint' => get_string('tutorialshowinviewhint', 'local_groupimport'),
        'tutorialreturntitle' => get_string('tutorialreturntitle', 'local_groupimport'),
        'tutorialreturndesc' => get_string('tutorialreturndesc', 'local_groupimport'),
        'tutorialreturnbutton' => get_string('tutorialreturnbutton', 'local_groupimport'),
        'tutorialreturndismiss' => get_string('tutorialreturndismiss', 'local_groupimport'),
        'tutorialguidedpaneltitle' => get_string('tutorialguidedpaneltitle', 'local_groupimport'),
        'tutorialguidedpanelclose' => get_string('tutorialguidedpanelclose', 'local_groupimport'),
        'tutorialguidedpanelminimize' => get_string('tutorialguidedpanelminimize', 'local_groupimport'),
        'tutorialguidedpanelexpand' => get_string('tutorialguidedpanelexpand', 'local_groupimport'),
        'tutorialguidedpanelprogress' => get_string('tutorialguidedpanelprogress', 'local_groupimport', (object)[
            'done' => '__done__',
            'total' => '__total__',
        ]),
        'tutorialguidedpanelhint' => get_string('tutorialguidedpanelhint', 'local_groupimport'),
        'tutorialguidedpanelcomplete' => get_string('tutorialguidedpanelcomplete', 'local_groupimport'),
        'tutorialguidedpanelfeedbackstructure' => get_string('tutorialguidedpanelfeedbackstructure', 'local_groupimport'),
        'tutorialguidedpanelfeedbackparticipants' => get_string('tutorialguidedpanelfeedbackparticipants', 'local_groupimport'),
        'tutorialguidedpanelfeedbackfilters' => get_string('tutorialguidedpanelfeedbackfilters', 'local_groupimport'),
        'tutorialguidedpaneldescstructure' => get_string('tutorialguidedpaneldescstructure', 'local_groupimport'),
        'tutorialguidedpaneldescparticipants' => get_string('tutorialguidedpaneldescparticipants', 'local_groupimport'),
        'tutorialguidedpaneldescfilters' => get_string('tutorialguidedpaneldescfilters', 'local_groupimport'),
        'tutorialguidedstart' => get_string('tutorialguidedstart', 'local_groupimport'),
        'tutorialguidedtrydrag' => get_string('tutorialguidedtrydrag', 'local_groupimport'),
        'tutorialguidedtryselection' => get_string('tutorialguidedtryselection', 'local_groupimport'),
        'tutorialguidedtrycontext' => get_string('tutorialguidedtrycontext', 'local_groupimport'),
        'tutorialguidedcreategrouping' => get_string('tutorialguidedcreategrouping', 'local_groupimport'),
        'tutorialguidedaddgrouptogrouping' => get_string('tutorialguidedaddgrouptogrouping', 'local_groupimport'),
        'tutorialguidedverifygrouping' => get_string('tutorialguidedverifygrouping', 'local_groupimport'),
        'tutorialguidedgroupingtitle' => get_string('tutorialguidedgroupingtitle', 'local_groupimport'),
        'tutorialguidedactionstitle' => get_string('tutorialguidedactionstitle', 'local_groupimport'),
        'tutorialemptycoursecontent' => get_string('tutorialemptycoursecontent', 'local_groupimport'),
        'tutorialactionscontent' => get_string('tutorialactionscontent', 'local_groupimport'),
        'tutorialguidedgroupingdesccreate' => get_string('tutorialguidedgroupingdesccreate', 'local_groupimport'),
        'tutorialguidedgroupingdescadd' => get_string('tutorialguidedgroupingdescadd', 'local_groupimport'),
        'tutorialguidedgroupingdescverify' => get_string('tutorialguidedgroupingdescverify', 'local_groupimport'),
        'tutorialguidedactionsdescdrag' => get_string('tutorialguidedactionsdescdrag', 'local_groupimport'),
        'tutorialguidedactionsdescselection' => get_string('tutorialguidedactionsdescselection', 'local_groupimport'),
        'tutorialguidedactionsdesccontext' => get_string('tutorialguidedactionsdesccontext', 'local_groupimport'),
        'tutorialguidedfeedbackgroupingcreate' => get_string('tutorialguidedfeedbackgroupingcreate', 'local_groupimport'),
        'tutorialguidedfeedbackgroupingadd' => get_string('tutorialguidedfeedbackgroupingadd', 'local_groupimport'),
        'tutorialguidedfeedbackgroupingverify' => get_string('tutorialguidedfeedbackgroupingverify', 'local_groupimport'),
        'tutorialguidedfeedbackactionsdrag' => get_string('tutorialguidedfeedbackactionsdrag', 'local_groupimport'),
        'tutorialguidedfeedbackactionsselection' => get_string('tutorialguidedfeedbackactionsselection', 'local_groupimport'),
        'tutorialguidedfeedbackactionscontext' => get_string('tutorialguidedfeedbackactionscontext', 'local_groupimport'),
        'tutorialtargetmissing' => get_string('tutorialtargetmissing', 'local_groupimport'),
        'tutorialdiscoverbutton' => get_string('tutorialdiscoverbutton', 'local_groupimport'),
        'tutorialdiscoverdismiss' => get_string('tutorialdiscoverdismiss', 'local_groupimport'),
        'tutorialdiscovertext' => get_string('tutorialdiscovertext', 'local_groupimport'),
        'tutorialdiscovertitle' => get_string('tutorialdiscovertitle', 'local_groupimport'),
        'selectresults' => get_string('selectresults', 'local_groupimport'),
        'tutorialvisualcontext' => get_string('tutorialvisualcontext', 'local_groupimport'),
        'tutorialvisualcopy' => get_string('tutorialvisualcopy', 'local_groupimport'),
        'tutorialvisualdemo' => get_string('tutorialvisualdemo', 'local_groupimport'),
        'tutorialvisualdrag' => get_string('tutorialvisualdrag', 'local_groupimport'),
        'tutorialvisualduplicate' => get_string('tutorialvisualduplicate', 'local_groupimport'),
        'tutorialvisualgroupingmeta' => get_string('tutorialvisualgroupingmeta', 'local_groupimport'),
        'tutorialvisualgroupmeta' => get_string('tutorialvisualgroupmeta', 'local_groupimport'),
        'tutorialvisualmobile' => get_string('tutorialvisualmobile', 'local_groupimport'),
        'tutorialvisualmove' => get_string('tutorialvisualmove', 'local_groupimport'),
        'tutorialvisualparticipantmeta' => get_string('tutorialvisualparticipantmeta', 'local_groupimport'),
        'tutorialvisualrecipes' => get_string('tutorialvisualrecipes', 'local_groupimport'),
        'tutorialvisualsearch' => get_string('tutorialvisualsearch', 'local_groupimport'),
        'tutorialvisualselect' => get_string('tutorialvisualselect', 'local_groupimport'),
        'tutorialvisualactionbutton' => get_string('tutorialvisualactionbutton', 'local_groupimport'),
        'tutorialvisualcontextdesc' => get_string('tutorialvisualcontextdesc', 'local_groupimport'),
        'tutorialvisualdestination' => get_string('tutorialvisualdestination', 'local_groupimport'),
        'tutorialvisualemptycoursecreate' => get_string('tutorialvisualemptycoursecreate', 'local_groupimport'),
        'tutorialvisualemptycourseexample' => get_string('tutorialvisualemptycourseexample', 'local_groupimport'),
        'tutorialvisualgroupids' => get_string('tutorialvisualgroupids', 'local_groupimport'),
        'tutorialvisualguidedone' => get_string('tutorialvisualguidedone', 'local_groupimport'),
        'tutorialvisualguidedthree' => get_string('tutorialvisualguidedthree', 'local_groupimport'),
        'tutorialvisualguidedtwo' => get_string('tutorialvisualguidedtwo', 'local_groupimport'),
        'tutorialvisualidentifierchips' => get_string('tutorialvisualidentifierchips', 'local_groupimport'),
        'tutorialvisualkeyboardspace' => get_string('tutorialvisualkeyboardspace', 'local_groupimport'),
        'tutorialvisualkeyboardtab' => get_string('tutorialvisualkeyboardtab', 'local_groupimport'),
        'tutorialkeyboardkeytab' => get_string('tutorialkeyboardkeytab', 'local_groupimport'),
        'tutorialkeyboardkeyspace' => get_string('tutorialkeyboardkeyspace', 'local_groupimport'),
        'tutorialkeyboardkeyshift' => get_string('tutorialkeyboardkeyshift', 'local_groupimport'),
        'tutorialvisualcreationformula' => get_string('tutorialvisualcreationformula', 'local_groupimport'),
        'tutorialvisualcreationresultone' => get_string('tutorialvisualcreationresultone', 'local_groupimport'),
        'tutorialvisualcreationresulttwo' => get_string('tutorialvisualcreationresulttwo', 'local_groupimport'),
        'tutorialvisualcreationresultthree' => get_string('tutorialvisualcreationresultthree', 'local_groupimport'),
        'tutorialvisualcreationresultfour' => get_string('tutorialvisualcreationresultfour', 'local_groupimport'),
        'tutorialvisualpasteids' => get_string('tutorialvisualpasteids', 'local_groupimport'),
        'tutorialvisualrightclick' => get_string('tutorialvisualrightclick', 'local_groupimport'),
        'tutorialvisualshortcutcontext' => get_string('tutorialvisualshortcutcontext', 'local_groupimport'),
        'tutorialvisualshortcutdrag' => get_string('tutorialvisualshortcutdrag', 'local_groupimport'),
        'tutorialvisualshortcutkeyboard' => get_string('tutorialvisualshortcutkeyboard', 'local_groupimport'),
        'tutorialvisualshortcutselect' => get_string('tutorialvisualshortcutselect', 'local_groupimport'),
        'tutorialvisualshortcuttext' => get_string('tutorialvisualshortcuttext', 'local_groupimport'),
        'tutorialvisualworkflowdirect' => get_string('tutorialvisualworkflowdirect', 'local_groupimport'),
        'tutorialvisualworkflowmany' => get_string('tutorialvisualworkflowmany', 'local_groupimport'),
        'tutorialvisualworkflowprecise' => get_string('tutorialvisualworkflowprecise', 'local_groupimport'),
        'tutorialvisualworkflowreview' => get_string('tutorialvisualworkflowreview', 'local_groupimport'),
        'tutorialvisualtextadd' => get_string('tutorialvisualtextadd', 'local_groupimport'),
        'tutorialvisualrolebadge' => get_string('tutorialvisualrolebadge', 'local_groupimport'),
        'tutorialvisualgroupbadge' => get_string('tutorialvisualgroupbadge', 'local_groupimport'),
        'tutorialvisualgroupingbadge' => get_string('tutorialvisualgroupingbadge', 'local_groupimport'),
        'tutorialvisualstudentone' => get_string('tutorialvisualstudentone', 'local_groupimport'),
        'tutorialvisualstudenttwo' => get_string('tutorialvisualstudenttwo', 'local_groupimport'),
        'tutorialvisualstudentthree' => get_string('tutorialvisualstudentthree', 'local_groupimport'),
        'tutorialvisualstudentfour' => get_string('tutorialvisualstudentfour', 'local_groupimport'),
        'tutorialvisualassignmentgroupa' => get_string('tutorialvisualassignmentgroupa', 'local_groupimport'),
        'tutorialvisualassignmentgroupb' => get_string('tutorialvisualassignmentgroupb', 'local_groupimport'),
        'tutorialvisualassignmentgrouping' => get_string('tutorialvisualassignmentgrouping', 'local_groupimport'),
        'tutorialvisualstructurestepone' => get_string('tutorialvisualstructurestepone', 'local_groupimport'),
        'tutorialvisualstructuresteptwo' => get_string('tutorialvisualstructuresteptwo', 'local_groupimport'),
        'tutorialvisualstructurestepthree' => get_string('tutorialvisualstructurestepthree', 'local_groupimport'),
        'tutorialvisualtakeawayone' => get_string('tutorialvisualtakeawayone', 'local_groupimport'),
        'tutorialvisualtakeawaytwo' => get_string('tutorialvisualtakeawaytwo', 'local_groupimport'),
        'tutorialvisualtakeawaythree' => get_string('tutorialvisualtakeawaythree', 'local_groupimport'),
        'tutorialvisualtakeawayfour' => get_string('tutorialvisualtakeawayfour', 'local_groupimport'),
        'tutorialvisualcompletionone' => get_string('tutorialvisualcompletionone', 'local_groupimport'),
        'tutorialvisualcompletiontwo' => get_string('tutorialvisualcompletiontwo', 'local_groupimport'),
        'tutorialvisualcompletionthree' => get_string('tutorialvisualcompletionthree', 'local_groupimport'),
        'tutorialvisualcompletionfour' => get_string('tutorialvisualcompletionfour', 'local_groupimport'),
        'tutorialvisualmistakeone' => get_string('tutorialvisualmistakeone', 'local_groupimport'),
        'tutorialvisualmistaketwo' => get_string('tutorialvisualmistaketwo', 'local_groupimport'),
        'tutorialvisualmistakethree' => get_string('tutorialvisualmistakethree', 'local_groupimport'),
        'tutorialcategoryactions' => get_string('tutorialcategoryactions', 'local_groupimport'),
        'tutorialcategorybasics' => get_string('tutorialcategorybasics', 'local_groupimport'),
        'tutorialcategorycards' => get_string('tutorialcategorycards', 'local_groupimport'),
        'tutorialcategorypractice' => get_string('tutorialcategorypractice', 'local_groupimport'),
        'tutorialstepof' => get_string('tutorialstepof', 'local_groupimport', (object)[
            'current' => '__current__',
            'total' => '__total__',
        ]),
        'tutorialsteps' => [
            [
                'icon' => 'fa-sitemap',
                'category' => get_string('tutorialcategorybasics', 'local_groupimport'),
                'title' => get_string('tutorialconceptstitle', 'local_groupimport'),
                'content' => get_string('tutorialconceptscontent', 'local_groupimport'),
                'visualconcepts' => true,
                'highlighttarget' => 'firstGrouping',
                'highlightmode' => 'structure',
                'highlightview' => 'groupings',
            ],
            [
                'icon' => 'fa-route',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialfirststructuretitle', 'local_groupimport'),
                'content' => get_string('tutorialfirststructurecontent', 'local_groupimport'),
                'visualfirststructure' => true,
                'highlighttarget' => 'groupCreateInput',
                'highlightmode' => 'structure',
                'highlightview' => 'groups',
                'highlightopen' => 'tutorial:create-group',
            ],
            [
                'icon' => 'fa-list-ol',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialguidedmodetitle', 'local_groupimport'),
                'content' => get_string('tutorialguidedmodecontent', 'local_groupimport'),
                'visualguided' => true,
            ],
            [
                'icon' => 'fa-filter',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialfilterstitle', 'local_groupimport'),
                'content' => get_string('tutorialfilterscontent', 'local_groupimport'),
                'visualfilters' => true,
                'highlighttarget' => 'advancedParticipantFilters',
                'highlightmode' => 'participants',
                'highlightview' => 'participants',
                'highlightopen' => '[data-easystud-advanced-filters-toggle="participants"]',
                'showopendelay' => 800,
                'showafteropendelay' => 600,
            ],
            [
                'icon' => 'fa-id-badge',
                'category' => get_string('tutorialcategorycards', 'local_groupimport'),
                'title' => get_string('tutorialparticipantcardtitle', 'local_groupimport'),
                'content' => get_string('tutorialparticipantcardcontent', 'local_groupimport'),
                'visualparticipantcard' => true,
                'highlighttarget' => 'participantFirstCard',
                'highlightmode' => 'participants',
                'highlightview' => 'participants',
                'highlightopen' => 'tutorial:participant-details',
            ],
            [
                'icon' => 'fa-users',
                'category' => get_string('tutorialcategorycards', 'local_groupimport'),
                'title' => get_string('tutorialgroupcardtitle', 'local_groupimport'),
                'content' => get_string('tutorialgroupcardcontent', 'local_groupimport'),
                'visualgroupcard' => true,
                'highlighttarget' => 'firstGroup',
                'highlightmode' => 'structure',
                'highlightview' => 'groups',
                'highlightopen' => 'tutorial:first-group',
            ],
            [
                'icon' => 'fa-layer-group',
                'category' => get_string('tutorialcategorycards', 'local_groupimport'),
                'title' => get_string('tutorialgroupingcardtitle', 'local_groupimport'),
                'content' => get_string('tutorialgroupingcardcontent', 'local_groupimport'),
                'visualgroupingcard' => true,
                'highlighttarget' => 'firstGrouping',
                'highlightmode' => 'structure',
                'highlightview' => 'groupings',
                'highlightopen' => 'tutorial:first-grouping',
            ],
            [
                'icon' => 'fa-graduation-cap',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialassignmentpracticetitle', 'local_groupimport'),
                'content' => get_string('tutorialassignmentpracticecontent', 'local_groupimport'),
                'visualassignment' => true,
                'highlighttarget' => 'firstGrouping',
                'highlightmode' => 'structure',
                'highlightview' => 'groupings',
                'highlightopen' => 'tutorial:first-grouping',
            ],
            [
                'icon' => 'fa-seedling',
                'category' => get_string('tutorialcategorybasics', 'local_groupimport'),
                'title' => get_string('tutorialemptycoursetitle', 'local_groupimport'),
                'content' => get_string('tutorialemptycoursecontent', 'local_groupimport'),
                'visualemptycourse' => true,
                'highlighttarget' => 'groupingCreateInput',
                'highlightmode' => 'structure',
                'highlightview' => 'groupings',
                'highlightopen' => 'tutorial:create-grouping',
            ],
            [
                'icon' => 'fa-at',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialtextaddtitle', 'local_groupimport'),
                'content' => get_string('tutorialtextaddcontent', 'local_groupimport'),
                'visualtextadd' => true,
                'highlighttarget' => 'firstGroupEmailBox',
                'highlightmode' => 'structure',
                'highlightview' => 'groups',
                'highlightopen' => 'tutorial:add-users-text',
                // The inline paste field opens with the product's slow
                // expand transition. Resolve the concrete textarea only
                // after that transition has made it available, rather than
                // falling back to the enclosing group card.
                'showopendelay' => 800,
            ],
            [
                'icon' => 'fa-mouse-pointer',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialcontextmenutitle', 'local_groupimport'),
                'content' => get_string('tutorialcontextmenucontent', 'local_groupimport'),
                'visualcontextmenu' => true,
                'highlighttarget' => 'participantCardActions',
                'highlighttargetcompact' => 'participantCardActions',
                'highlighttargetdesktop' => 'participantFirstCard',
                'highlightmode' => 'participants',
                'highlightview' => 'participants',
                'highlightopen' => 'tutorial:participant-card-actions',
            ],
            [
                'icon' => 'fa-list-check',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialselectionmodaltitle', 'local_groupimport'),
                'content' => get_string('tutorialselectionmodalcontent', 'local_groupimport'),
                'visualactionmodal' => true,
                'highlighttarget' => 'participantSelectionInput',
                'highlightmode' => 'both',
                'highlightview' => 'participants',
            ],
            [
                'icon' => 'fa-arrows-alt',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialactionstitle', 'local_groupimport'),
                'content' => get_string('tutorialactionscontent', 'local_groupimport'),
                'visualactions' => true,
                'highlighttarget' => 'participantSelectionInput',
                'highlightmode' => 'both',
                'highlightview' => 'participants',
            ],
            [
                'icon' => 'fa-keyboard',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialkeyboardtitle', 'local_groupimport'),
                'content' => get_string('tutorialkeyboardcontent', 'local_groupimport'),
                'visualkeyboard' => true,
                'highlighttarget' => 'participantFirstCard',
                'highlightmode' => 'participants',
                'highlightview' => 'participants',
            ],
            [
                'icon' => 'fa-compass',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialworkflowtitle', 'local_groupimport'),
                'content' => get_string('tutorialworkflowcontent', 'local_groupimport'),
                'visualworkflow' => true,
            ],
            [
                'icon' => 'fa-bolt',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialshortcutstitle', 'local_groupimport'),
                'content' => get_string('tutorialshortcutscontent', 'local_groupimport'),
                'visualshortcuts' => true,
            ],
            [
                'icon' => 'fa-magic',
                'category' => get_string('tutorialcategoryactions', 'local_groupimport'),
                'title' => get_string('tutorialcreationtitle', 'local_groupimport'),
                'content' => get_string('tutorialcreationcontent', 'local_groupimport'),
                'visualcreation' => true,
                'highlighttarget' => 'groupCreateInput',
                'highlightmode' => 'structure',
                'highlightview' => 'groups',
                'highlightopen' => 'tutorial:create-group',
            ],
            [
                'icon' => 'fa-exclamation-triangle',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialmistakestitle', 'local_groupimport'),
                'content' => get_string('tutorialmistakescontent', 'local_groupimport'),
                'visualmistakes' => true,
            ],
            [
                'icon' => 'fa-check-circle',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialtakeawaytitle', 'local_groupimport'),
                'content' => get_string('tutorialtakeawaycontent', 'local_groupimport'),
                'visualtakeaway' => true,
            ],
            [
                'icon' => 'fa-flag-checkered',
                'category' => get_string('tutorialcategorypractice', 'local_groupimport'),
                'title' => get_string('tutorialcompletiontitle', 'local_groupimport'),
                'content' => get_string('tutorialcompletioncontent', 'local_groupimport'),
                'visualcompletion' => true,
            ],
        ],
        'selectionmodelabel' => get_string('selectionmode', 'local_groupimport'),
        'participantstitle' => get_string('participants', 'local_groupimport'),
        'participantscountlabel' => get_string('participantscount', 'local_groupimport', count($users)),
        'layoutmodetoggles' => [
            [
                'icon' => 'fa-users',
                'label' => get_string('layoutmodeparticipants', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm local-groupimport-easystud__layout-mode-button',
                'attribute' => 'data-easystud-layout-mode="participants" aria-pressed="false"',
            ],
            [
                'icon' => 'fa-columns',
                'label' => get_string('layoutmodeoverview', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm local-groupimport-easystud__layout-mode-button',
                'attribute' => 'data-easystud-layout-mode="both" aria-pressed="true"',
            ],
            [
                'icon' => 'fa-sitemap',
                'label' => get_string('layoutmodestructure', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm local-groupimport-easystud__layout-mode-button',
                'attribute' => 'data-easystud-layout-mode="structure" aria-pressed="false"',
            ],
        ],
        'participantactions' => [
            [
                'icon' => 'fa-compress',
                'label' => get_string('compactparticipants', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm',
                'attribute' => 'data-easystud-density-toggle="1" aria-pressed="' .
                    ($compactparticipantsdefault ? 'true' : 'false') . '" ' .
                    'data-compact-label="' . s(get_string('compactparticipants', 'local_groupimport')) . '" ' .
                    'data-detailed-label="' . s(get_string('detailedparticipants', 'local_groupimport')) . '"',
                'disabled' => false,
            ],
            [
                'icon' => 'fa-comment-dots',
                'label' => get_string('messageselectadd'),
                'class' => 'btn btn-outline-secondary btn-sm',
                'attribute' => 'data-easystud-message-selected-participants="1"',
                'disabled' => true,
                'hidden' => !$canmessageparticipants,
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('moveselectedparticipants', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm local-groupimport-easystud__participant-move-action',
                'attribute' => 'data-easystud-move-selected-participants="1"',
                'disabled' => true,
            ],
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm local-groupimport-easystud__participant-group-action ' .
                    'local-groupimport-easystud__participant-group-action--first',
                'attribute' => 'data-easystud-delete-selected-groups="1"',
                'disabled' => true,
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('movegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm local-groupimport-easystud__participant-group-action',
                'attribute' => 'data-easystud-move-selected-groups="1"',
                'disabled' => true,
            ],
        ],
        'roleoptions' => local_groupimport_build_select_options($rolefilteroptions),
        'rolefilterchoices' => local_groupimport_build_select_options($rolefilteroptions),
        'groupoptions' => local_groupimport_build_select_options($groupfilteroptions),
        'groupingoptions' => local_groupimport_build_select_options($groupingfilteroptions),
        'hasroles' => !empty($rolefilteroptions),
        'hasgroups' => !empty($groupfilteroptions),
        'hasgroupings' => !empty($groupingfilteroptions),
        'searchplaceholder' => get_string('searchparticipants', 'local_groupimport'),
        'searchlabel' => get_string('searchparticipantslabel', 'local_groupimport'),
        'searchstructureplaceholder' => get_string('searchstructure', 'local_groupimport'),
        'searchstructurelabel' => get_string('searchstructurelabel', 'local_groupimport'),
        'searchgroupsplaceholder' => get_string('searchgroups', 'local_groupimport'),
        'searchgroupslabel' => get_string('searchgroupslabel', 'local_groupimport'),
        'searchgroupingsplaceholder' => get_string('searchgroupings', 'local_groupimport'),
        'searchgroupingslabel' => get_string('searchgroupingslabel', 'local_groupimport'),
        'rolesfilterlabel' => get_string('rolesfilterlabel', 'local_groupimport'),
        'groupsfilterlabel' => get_string('groupsfilterlabel', 'local_groupimport'),
        'groupingsfilterlabel' => get_string('groupingsfilterlabel', 'local_groupimport'),
        'groupscolumnlabel' => get_string('groupscolumnlabel', 'local_groupimport'),
        'groupingscolumnlabel' => get_string('groupingscolumnlabel', 'local_groupimport'),
        'groupingoccupancylabel' => get_string('groupingoccupancy', 'local_groupimport'),
        'backtotoplabel' => get_string('backtotop', 'local_groupimport'),
        'filteralllabel' => get_string('filterall', 'local_groupimport'),
        'filterwithgroupslabel' => get_string('filterwithgroups', 'local_groupimport'),
        'filteremptylabel' => get_string('filterempty', 'local_groupimport'),
        'mobileviewlabel' => get_string('mobileviewlabel', 'local_groupimport'),
        'mobileviewparticipants' => get_string('mobileviewparticipants', 'local_groupimport'),
        'mobileviewgroups' => get_string('mobileviewgroups', 'local_groupimport'),
        'mobileviewgroupings' => get_string('mobileviewgroupings', 'local_groupimport'),
        'mobilecardactions' => get_string('mobilecardactions', 'local_groupimport'),
        'mobilecontexttitle' => get_string('mobilecontexttitle', 'local_groupimport'),
        'mobilecontextclose' => get_string('mobilecontextclose', 'local_groupimport'),
        'actioninprogress' => get_string('actioninprogress', 'local_groupimport'),
        'resetfilterslabel' => get_string('resetfilters', 'local_groupimport'),
        'showungroupedlabel' => get_string('showungroupedgroups', 'local_groupimport'),
        'onlyshowungroupedlabel' => get_string('onlyshowungroupedgroups', 'local_groupimport'),
        'noparticipantsstate' => get_string('noparticipantsstate', 'local_groupimport'),
        'participants' => [],
        'groupstructuretitle' => get_string('groupsandgroupings', 'local_groupimport'),
        'groupstructuresummarylabel' => get_string('groupstructuresummary', 'local_groupimport', (object)[
            'groupings' => count($groupings),
            'groups' => count($groups),
        ]),
        'groupactions' => [
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-groups="1"',
            ],
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupingsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-groupings="1"',
            ],
            [
                'icon' => 'fa-user-minus',
                'label' => get_string('deletemembersselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-members="1"',
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('moveselectedgroups', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm',
                'attribute' => 'data-easystud-move-selected-groups="1"',
            ],
            [
                'icon' => 'fa-unlink',
                'label' => get_string('removegroupsfromgroupings', 'local_groupimport'),
                'class' => 'btn btn-outline-secondary btn-sm',
                'attribute' => 'data-easystud-remove-selected-groups-from-groupings="1"',
            ],
        ],
        'participantgroupactions' => [
            [
                'icon' => 'fa-trash',
                'label' => get_string('deletegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-groups="1"',
            ],
            [
                'icon' => 'fa-user-minus',
                'label' => get_string('deletemembersselection', 'local_groupimport'),
                'class' => 'btn btn-outline-danger btn-sm',
                'attribute' => 'data-easystud-delete-selected-members="1"',
            ],
            [
                'icon' => 'fa-arrow-right',
                'label' => get_string('movegroupsselection', 'local_groupimport'),
                'class' => 'btn btn-outline-primary btn-sm',
                'attribute' => 'data-easystud-move-selected-groups="1"',
            ],
        ],
        'quickcreateurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $course->id]))->out(false),
        'sesskey' => sesskey(),
        'newgroupplaceholder' => get_string('newgroupplaceholder', 'local_groupimport'),
        'newgroupingplaceholder' => get_string('newgroupingplaceholder', 'local_groupimport'),
        'creategrouplabel' => get_string('creategroup', 'local_groupimport'),
        'creategroupinglabel' => get_string('creategrouping', 'local_groupimport'),
        'nogroupingsavailable' => get_string('nogroupingsavailable', 'local_groupimport'),
        'groupings' => [],
        'ungroupedgroups' => [],
        'participantfocusgroups' => [],
        'structurefocusgroups' => [],
        'groupswithoutgrouping' => get_string('groupswithoutgrouping', 'local_groupimport'),
        'clipboarddesc' => get_string('clipboardtools_desc', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'participantdetailstitle' => get_string('participantdetails', 'local_groupimport'),
        'movedialogtitle' => get_string('movedialogtitle', 'local_groupimport'),
        'movedialogparticipants' => get_string('movedialogparticipants', 'local_groupimport'),
        'movedialoggroups' => get_string('movedialoggroups', 'local_groupimport'),
        'movedestinationgroup' => get_string('movedestinationgroup', 'local_groupimport'),
        'movedestinationgrouping' => get_string('movedestinationgrouping', 'local_groupimport'),
        'moveconfirm' => get_string('moveconfirm', 'local_groupimport'),
        'movegroupremoveorigin' => get_string('movegroupremoveorigin', 'local_groupimport'),
        'groupdropmode' => get_string('groupdropmode', 'local_groupimport'),
        'groupdropmodedesc' => get_string('groupdropmodedesc', 'local_groupimport'),
        'groupdropcopy' => get_string('groupdropcopy', 'local_groupimport'),
        'groupdropmove' => get_string('groupdropmove', 'local_groupimport'),
        'morefilters' => get_string('morefilters', 'local_groupimport'),
        'deleteconfirmationtitle' => get_string('deleteconfirmationtitle', 'local_groupimport'),
        'confirmdeletegroups' => get_string('confirmdeletegroups', 'local_groupimport'),
        'confirmdeletegroupings' => get_string('confirmdeletegroupings', 'local_groupimport'),
        'clearselectionlabel' => get_string('contextclearselection', 'local_groupimport'),
        'removefromgroupinglabel' => get_string('removegroupfromgrouping', 'local_groupimport'),
        'confirmlabel' => get_string('confirm', 'local_groupimport'),
        'cancellabel' => get_string('cancel'),
        'contextactions' => local_groupimport_build_context_actions_template_data($alloweduserfields, $canmessageparticipants),
    ];

    $templatedata['useeasyeduguide'] = true;
    $templatedata['easyeduguide'] = local_groupimport_build_easyedu_guide_template_data($templatedata);

    foreach ($users as $user) {
        $customsearchvalues = [];
        foreach ($user['participantdisplayfields'] ?? [] as $field) {
            $customsearchvalues[] = $field['label'];
            $customsearchvalues[] = $field['value'];
        }
        if (!empty($user['primarybadge']['value'])) {
            $customsearchvalues[] = $user['primarybadge']['label'];
            $customsearchvalues[] = $user['primarybadge']['value'];
        }
        $searchtext = core_text::strtolower($user['fullname'] . ' ' . $user['email'] . ' ' .
            implode(' ', $user['roles']) . ' ' . implode(' ', $user['groups']) . ' ' .
            implode(' ', $user['groupings'] ?? []) . ' ' . implode(' ', $customsearchvalues));
        $templatedata['participants'][] = [
            'id' => $user['id'],
            'fullname' => $user['fullname'],
            'email' => $user['email'],
            'profileimage' => $user['profileimage'],
            'primarybadge' => $user['primarybadge'] ?? null,
            'userdetailjson' => json_encode($user),
            'usercopyfieldsjson' => json_encode($user['copyfields'] ?? []),
            'searchtext' => $searchtext,
            'roletext' => core_text::strtolower(implode('|', $user['roles'])),
            'groupidscsv' => implode(',', $user['groupids']),
            'groupingidscsv' => implode(',', $user['groupingids'] ?? []),
            'rolesmeta' => local_groupimport_build_meta_tags_template_data(
                get_string('roleslabel', 'local_groupimport'),
                $user['roles'],
                'local-groupimport-easystud-token local-groupimport-easystud-token--role',
                get_string('norole', 'local_groupimport')
            ),
            'groupsmeta' => local_groupimport_build_meta_tags_template_data(
                get_string('groupslabel', 'local_groupimport'),
                $user['groups'],
                'local-groupimport-easystud-token local-groupimport-easystud-token--group',
                get_string('nogroup', 'local_groupimport')
            ),
            'groupingsmeta' => local_groupimport_build_meta_tags_template_data(
                get_string('groupingslabel', 'local_groupimport'),
                $user['groupings'] ?? [],
                'local-groupimport-easystud-token local-groupimport-easystud-token--grouping',
                get_string('nogrouping', 'local_groupimport')
            ),
            'customfieldsmeta' => $user['customfieldsmeta'] ?? [],
            'viewdetailslabel' => get_string('viewparticipantdetails', 'local_groupimport'),
            'draghint' => get_string('draghintparticipant', 'local_groupimport'),
        ];
    }

    foreach ($groupings as $grouping) {
        $templatedata['groupings'][] = local_groupimport_build_grouping_template_data(
            $course->id,
            $grouping,
            $groups,
            $users,
            $groupings
        );
    }

    foreach ($ungroupedgroupids as $groupid) {
        if (isset($groups[$groupid])) {
            $templatedata['ungroupedgroups'][] = local_groupimport_build_group_template_data(
                $course->id,
                $groups[$groupid],
                $users,
                false,
                $groupings
            );
        }
    }

    $templatedata['participantfocusgroups'] = local_groupimport_build_group_catalog_template_data(
        $course->id,
        $groups,
        $groupings,
        $users
    );
    $templatedata['structurefocusgroups'] = $templatedata['participantfocusgroups'];

    return $templatedata;
}

/**
 * Build the shared EasyEdu guide template data from the existing EasyStud tutorial data.
 *
 * @param array $templatedata EasyStud page template data.
 * @return array
 */
function local_groupimport_build_easyedu_guide_template_data(array $templatedata): array {
    $slides = [];
    foreach ($templatedata['tutorialsteps'] as $index => $step) {
        $slide = [
            'index' => $index,
            'navicon' => $step['icon'],
            'icon' => $step['icon'],
            'category' => $step['category'] ?? '',
            'title' => $step['title'],
            'content' => html_writer::tag('p', s($step['content'])),
        ];

        if (!empty($step['highlighttarget']) || !empty($step['highlightselector'])) {
            $slide['target'] = 'slide-' . $index;
            $slide['targetselector'] = $step['highlighttarget'] ?? $step['highlightselector'];
            if (!empty($step['highlighttargetcompact'])) {
                $slide['targetselectorcompact'] = $step['highlighttargetcompact'];
            }
            if (!empty($step['highlighttargetdesktop'])) {
                $slide['targetselectordesktop'] = $step['highlighttargetdesktop'];
            }
            $viewopener = [
                'groups' => 'viewGroups',
                'groupings' => 'viewGroupings',
                'participants' => 'viewParticipants',
                'both' => 'viewParticipants',
            ];
            $view = $step['highlightview'] ?? $step['highlightmode'] ?? '';
            if ($view !== '' && isset($viewopener[$view])) {
                $slide['showopen'] = $viewopener[$view];
                $slide['showopendelay'] = (int) ($step['showopendelay'] ?? 360);
            }
            if (!empty($step['highlightopen'])) {
                $slide['showafteropen'] = $step['highlightopen'];
                $slide['showafteropendelay'] = (int) ($step['showafteropendelay'] ?? 360);
            }
        }

        if (!empty($step['visualconcepts'])) {
            $slide['hasvisualflow'] = true;
        } else if (!empty($step['visualkeyboard'])) {
            $slide['visualkeys'] = [
                'items' => [
                    ['key' => 'Tab', 'label' => $templatedata['tutorialvisualkeyboardtab']],
                    ['key' => 'Space', 'label' => $templatedata['tutorialvisualkeyboardspace']],
                    ['key' => 'Shift', 'label' => $templatedata['tutorialvisualselect']],
                ],
            ];
        } else if (!empty($step['visualparticipantcard']) || !empty($step['visualgroupcard']) ||
                !empty($step['visualgroupingcard'])) {
            $cardtype = !empty($step['visualparticipantcard']) ? 'participant' :
                (!empty($step['visualgroupcard']) ? 'group' : 'grouping');
            $cardicons = [
                'participant' => 'fa-user',
                'group' => 'fa-users',
                'grouping' => 'fa-layer-group',
            ];
            $cardtitles = [
                'participant' => $templatedata['tutorialparticipantlabel'],
                'group' => $templatedata['tutorialgrouplabel'],
                'grouping' => $templatedata['tutorialgroupinglabel'],
            ];
            $cardmeta = [
                'participant' => $templatedata['tutorialvisualparticipantmeta'],
                'group' => $templatedata['tutorialvisualgroupmeta'],
                'grouping' => $templatedata['tutorialvisualgroupingmeta'],
            ];
            $carddetails = [
                'participant' => [
                    ['icon' => 'fa-user-tag', 'label' => $templatedata['tutorialvisualrolebadge'], 'type' => 'participant'],
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualgroupbadge'], 'type' => 'group'],
                ],
                'group' => [
                    ['icon' => 'fa-user', 'label' => $templatedata['tutorialvisualstudentone'], 'type' => 'participant'],
                    ['icon' => 'fa-user', 'label' => $templatedata['tutorialvisualstudenttwo'], 'type' => 'participant'],
                ],
                'grouping' => [
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualassignmentgroupa'], 'type' => 'group'],
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualassignmentgroupb'], 'type' => 'group'],
                ],
            ];
            $slide['visualcarddetail'] = [
                'card' => [
                    'type' => $cardtype,
                    'icon' => $cardicons[$cardtype],
                    'title' => $cardtitles[$cardtype],
                    'meta' => $cardmeta[$cardtype],
                ],
                'details' => $carddetails[$cardtype],
            ];
        } else if (!empty($step['visualfirststructure'])) {
            $slide['visualsteps'] = [
                'layout' => 'workflow',
                'items' => [
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualstructurestepone']],
                    ['icon' => 'fa-layer-group', 'label' => $templatedata['tutorialvisualstructuresteptwo']],
                    ['icon' => 'fa-arrow-right', 'label' => $templatedata['tutorialvisualstructurestepthree']],
                ],
            ];
        } else if (!empty($step['visualfilters'])) {
            $slide['visualfiltersdemo'] = [
                'searchlabel' => $templatedata['tutorialvisualsearch'],
                'actions' => [
                    ['label' => $templatedata['selectresults']],
                    ['label' => $templatedata['morefilters']],
                ],
                'badges' => [
                    ['label' => $templatedata['tutorialvisualrolebadge'], 'type' => 'participant'],
                    ['label' => $templatedata['tutorialvisualgroupbadge'], 'type' => 'group'],
                ],
            ];
        } else if (!empty($step['visualassignment'])) {
            $slide['visualassignment'] = [
                'rows' => [
                    ['items' => [
                        [
                            'type' => 'participant',
                            'icon' => 'fa-user',
                            'title' => $templatedata['tutorialvisualstudentone'],
                            'arrowafter' => true,
                        ],
                        [
                            'type' => 'group',
                            'icon' => 'fa-users',
                            'title' => $templatedata['tutorialvisualassignmentgroupa'],
                            'arrowafter' => true,
                        ],
                        [
                            'type' => 'grouping',
                            'icon' => 'fa-layer-group',
                            'title' => $templatedata['tutorialvisualassignmentgrouping'],
                        ],
                    ]],
                    ['items' => [
                        [
                            'type' => 'participant',
                            'icon' => 'fa-user',
                            'title' => $templatedata['tutorialvisualstudenttwo'],
                            'arrowafter' => true,
                        ],
                        [
                            'type' => 'group',
                            'icon' => 'fa-users',
                            'title' => $templatedata['tutorialvisualassignmentgroupb'],
                            'arrowafter' => true,
                        ],
                        [
                            'type' => 'grouping',
                            'icon' => 'fa-layer-group',
                            'title' => $templatedata['tutorialvisualassignmentgrouping'],
                        ],
                    ]],
                ],
            ];
        } else if (!empty($step['visualemptycourse'])) {
            $slide['visualsteps'] = [
                'layout' => 'status',
                'items' => [
                    ['icon' => 'fa-seedling', 'label' => $templatedata['tutorialvisualemptycoursecreate']],
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualemptycourseexample']],
                    ['icon' => 'fa-layer-group', 'label' => $templatedata['tutorialguidedcreategrouping']],
                ],
            ];
        } else if (!empty($step['visualtextadd'])) {
            $slide['visualpaste'] = [
                'panels' => [
                    [
                        'icon' => 'fa-at',
                        'title' => $templatedata['tutorialvisualtextadd'],
                        'input' => $templatedata['tutorialvisualpasteids'],
                        'chips' => [
                            $templatedata['tutorialvisualstudentone'],
                            $templatedata['tutorialvisualstudenttwo'],
                            $templatedata['tutorialvisualidentifierchips'],
                        ],
                        'arrowafter' => true,
                    ],
                    [
                        'icon' => 'fa-layer-group',
                        'title' => $templatedata['tutorialvisualgroupids'],
                        'input' => get_string('tutorialvisualgroupidsexample', 'local_groupimport'),
                        'chips' => [
                            $templatedata['tutorialvisualassignmentgroupa'],
                            $templatedata['tutorialvisualassignmentgroupb'],
                        ],
                    ],
                ],
            ];
        } else if (!empty($step['visualcontextmenu'])) {
            $slide['visualcontextmenu'] = [
                'cardicon' => 'fa-user',
                'cardlabel' => $templatedata['tutorialparticipantlabel'],
                'menutitle' => $templatedata['tutorialvisualrightclick'],
                'items' => [
                    ['icon' => 'fa-copy', 'label' => $templatedata['tutorialvisualcopy']],
                    ['icon' => 'fa-arrow-right', 'label' => $templatedata['tutorialvisualmove']],
                    ['icon' => 'fa-check-square', 'label' => $templatedata['tutorialvisualselect']],
                ],
                'note' => $templatedata['tutorialvisualcontextdesc'],
            ];
        } else if (!empty($step['visualactionmodal'])) {
            $slide['visualactionflow'] = [
                'selection' => [
                    $templatedata['tutorialvisualstudentone'],
                    $templatedata['tutorialvisualstudenttwo'],
                ],
                'actionicon' => 'fa-arrow-right',
                'actionlabel' => $templatedata['tutorialvisualactionbutton'],
                'destinationtitle' => $templatedata['tutorialvisualdestination'],
                'destinations' => [
                    $templatedata['tutorialvisualassignmentgroupa'],
                    $templatedata['tutorialvisualassignmentgroupb'],
                ],
            ];
        } else if (!empty($step['visualactions'])) {
            $slide['visualdragdrop'] = [
                'lanes' => [
                    [
                        'sourcetype' => 'participant',
                        'sourceicon' => 'fa-user',
                        'sourcelabel' => $templatedata['tutorialparticipantlabel'],
                        'targeticon' => 'fa-users',
                        'targetlabel' => $templatedata['tutorialgrouplabel'],
                    ],
                    [
                        'sourcetype' => 'group',
                        'sourceicon' => 'fa-users',
                        'sourcelabel' => $templatedata['tutorialgrouplabel'],
                        'targeticon' => 'fa-layer-group',
                        'targetlabel' => $templatedata['tutorialgroupinglabel'],
                    ],
                ],
                'selection' => [
                    $templatedata['tutorialvisualstudentone'],
                    $templatedata['tutorialvisualstudenttwo'],
                ],
                'menuitems' => [
                    ['icon' => 'fa-copy', 'label' => $templatedata['tutorialvisualcopy']],
                    ['icon' => 'fa-arrow-right', 'label' => $templatedata['tutorialvisualmove']],
                    ['icon' => 'fa-mouse-pointer', 'label' => $templatedata['tutorialvisualrightclick']],
                ],
            ];
        } else if (!empty($step['visualworkflow'])) {
            $slide['visualsteps'] = [
                'layout' => 'workflow',
                'items' => [
                    ['icon' => 'fa-arrows-alt', 'label' => $templatedata['tutorialvisualworkflowdirect']],
                    ['icon' => 'fa-check-square', 'label' => $templatedata['tutorialvisualworkflowmany']],
                    ['icon' => 'fa-at', 'label' => $templatedata['tutorialvisualworkflowprecise']],
                    ['icon' => 'fa-filter', 'label' => $templatedata['tutorialvisualworkflowreview']],
                ],
            ];
        } else if (!empty($step['visualshortcuts'])) {
            $slide['visualsteps'] = [
                'layout' => 'workflow',
                'items' => [
                    ['icon' => 'fa-mouse-pointer', 'label' => $templatedata['tutorialvisualshortcutcontext']],
                    ['icon' => 'fa-check-square', 'label' => $templatedata['tutorialvisualshortcutselect']],
                    ['icon' => 'fa-keyboard', 'label' => $templatedata['tutorialvisualshortcutkeyboard']],
                    ['icon' => 'fa-at', 'label' => $templatedata['tutorialvisualshortcuttext']],
                ],
            ];
        } else if (!empty($step['visualcreation'])) {
            $slide['visualformula'] = [
                'expression' => get_string('tutorialvisualcreationformula', 'local_groupimport'),
                'results' => [
                    get_string('tutorialvisualcreationresultone', 'local_groupimport'),
                    get_string('tutorialvisualcreationresulttwo', 'local_groupimport'),
                    get_string('tutorialvisualcreationresultthree', 'local_groupimport'),
                    get_string('tutorialvisualcreationresultfour', 'local_groupimport'),
                ],
            ];
        } else if (!empty($step['visualmistakes'])) {
            $slide['visualsteps'] = [
                'layout' => 'warning-grid',
                'items' => [
                    ['icon' => 'fa-ban', 'label' => $templatedata['tutorialvisualmistakeone'], 'state' => 'warning'],
                    ['icon' => 'fa-random', 'label' => $templatedata['tutorialvisualmistaketwo'], 'state' => 'warning'],
                    ['icon' => 'fa-layer-group', 'label' => $templatedata['tutorialvisualmistakethree'], 'state' => 'warning'],
                ],
            ];
        } else if (!empty($step['visualcompletion'])) {
            $slide['visualsteps'] = [
                'layout' => 'status',
                'items' => [
                    ['icon' => 'fa-check-circle', 'label' => $templatedata['tutorialvisualcompletionone']],
                    ['icon' => 'fa-users-cog', 'label' => $templatedata['tutorialvisualcompletiontwo']],
                    ['icon' => 'fa-search', 'label' => $templatedata['tutorialvisualcompletionthree']],
                    ['icon' => 'fa-broom', 'label' => $templatedata['tutorialvisualcompletionfour']],
                ],
            ];
        } else if (!empty($step['visualtakeaway'])) {
            $slide['visualsteps'] = [
                'layout' => 'workflow',
                'items' => [
                    ['icon' => 'fa-user', 'label' => $templatedata['tutorialvisualtakeawayone']],
                    ['icon' => 'fa-users', 'label' => $templatedata['tutorialvisualtakeawaytwo']],
                    ['icon' => 'fa-layer-group', 'label' => $templatedata['tutorialvisualtakeawaythree']],
                    ['icon' => 'fa-graduation-cap', 'label' => $templatedata['tutorialvisualtakeawayfour']],
                ],
            ];
        }

        if (!empty($step['visualguided'])) {
            $slide['hasguidedpath'] = true;
            $slide['guidedpath'] = 'first-structure';
            $slide['guidedpathtitle'] = $templatedata['tutorialguidedpaneltitle'];
            $slide['guidedpathcontent'] = $templatedata['tutorialguidedpanelhint'];
            $slide['guidedpathsteps'] = [
                'items' => [
                    $templatedata['tutorialvisualguidedone'],
                    $templatedata['tutorialvisualguidedtwo'],
                    $templatedata['tutorialvisualguidedthree'],
                ],
            ];
        } else if (!empty($step['visualemptycourse'])) {
            $slide['hasguidedpath'] = true;
            $slide['guidedpath'] = 'create-grouping';
            $slide['guidedpathtitle'] = $templatedata['tutorialguidedgroupingtitle'];
            $slide['guidedpathcontent'] = $templatedata['tutorialemptycoursecontent'];
            $slide['guidedpathsteps'] = [
                'items' => [
                    $templatedata['tutorialguidedcreategrouping'],
                    $templatedata['tutorialguidedaddgrouptogrouping'],
                    $templatedata['tutorialguidedverifygrouping'],
                ],
            ];
        } else if (!empty($step['visualactions'])) {
            $slide['hasguidedpath'] = true;
            $slide['guidedpath'] = 'try-actions';
            $slide['guidedpathtitle'] = $templatedata['tutorialguidedactionstitle'];
            $slide['guidedpathcontent'] = $templatedata['tutorialactionscontent'];
            $slide['guidedpathsteps'] = [
                'items' => [
                    $templatedata['tutorialguidedtrydrag'],
                    $templatedata['tutorialguidedtryselection'],
                    $templatedata['tutorialguidedtrycontext'],
                ],
            ];
        }

        $slides[] = $slide;
    }

    $slidecount = max(1, count($slides));

    return [
        'rootclass' => 'local-groupimport-easystud-easyedu-guide',
        'guideopenlabel' => $templatedata['tutoriallabel'],
        'guidehoverlabel' => get_string('tutorialhoverlabel', 'local_groupimport'),
        'guidecloselabel' => get_string('closebuttontitle', 'core'),
        'guidetitle' => $templatedata['tutorialtitle'],
        'guidesubtitle' => $templatedata['tutorialintro'],
        'guidepreviouslabel' => $templatedata['tutorialprevious'],
        'guidenextlabel' => $templatedata['tutorialnext'],
        'guidenavigationlabel' => $templatedata['tutorialtitle'],
        'guideprogresslabel' => $templatedata['tutorialprogresslabel'],
        'guidebadgelabel' => get_string('guidebadgelabel', 'local_groupimport'),
        'guideguidedpathlabel' => $templatedata['tutorialguidedpaneltitle'],
        'guiderequiresbadge' => get_string('guiderequiresbadge', 'local_groupimport'),
        'guideshowinterfacelabel' => $templatedata['tutorialshowinview'],
        'guidemapsource' => $templatedata['tutorialparticipantlabel'],
        'guidemaplayers' => $templatedata['tutorialgrouplabel'],
        'guidemapbanner' => $templatedata['tutorialgroupinglabel'],
        'guidestartpathlabel' => $templatedata['tutorialguidedstart'],
        'guidereturnlabel' => $templatedata['tutorialreturntitle'],
        'guidereturndesc' => $templatedata['tutorialreturndesc'],
        'guidereturnbutton' => $templatedata['tutorialreturnbutton'],
        'guidereturndismiss' => $templatedata['tutorialreturndismiss'],
        'guidechecklisttitle' => $templatedata['tutorialguidedpaneltitle'],
        'guideminimizelabel' => $templatedata['tutorialguidedpanelminimize'],
        'guidechecklisthint' => $templatedata['tutorialguidedpanelhint'],
        'guidechecklistdonelabel' => $templatedata['tutorialguidedpanelcomplete'],
        'guidesteplabel' => $templatedata['tutorialstepof'],
        'slides' => $slides,
        'slidecount' => $slidecount,
        'initialprogress' => 100 / $slidecount,
    ];
}

/**
 * Build the shared EasyEdu guide AMD configuration.
 *
 * @param int $courseid Course id.
 * @return array
 */
function local_groupimport_build_easyedu_guide_js_config(int $courseid): array {
    return [
        'storageKey' => 'local_groupimport.easyedu_guide.' . $courseid,
        'firstVisit' => false,
        'highlightAutoHideDelay' => 5200,
        'highlightStyle' => 'pulse-blue',
        'targets' => [
            'createRow' => '.local-groupimport-easystud-create-row',
            'groupCreateInput' => '.local-groupimport-easystud-create-row input[name="groupname"]',
            'groupingCreateInput' => '.local-groupimport-easystud-create-row input[name="groupingname"]',
            'filters' => '[data-easystud-filters]',
            'advancedParticipantFilters' => '[data-easystud-advanced-filters="participants"]',
            'layoutBoth' => [
                '[data-easystud-mobile-view="participants"]',
                '[data-easystud-layout-mode="both"]',
            ],
            'layoutParticipants' => [
                '[data-easystud-mobile-view="participants"]',
                '[data-easystud-layout-mode="participants"]',
            ],
            'layoutStructure' => [
                '[data-easystud-mobile-view="groupings"]',
                '[data-easystud-layout-mode="structure"]',
            ],
            // Each Guide destination names the real compact workspace first,
            // then retains the corresponding desktop layout as a fallback.
            'viewParticipants' => [
                '[data-easystud-mobile-view="participants"]',
                '[data-easystud-layout-mode="participants"]',
            ],
            'viewGroups' => [
                '[data-easystud-mobile-view="groups"]',
                '[data-easystud-layout-mode="structure"]',
            ],
            'viewGroupings' => [
                '[data-easystud-mobile-view="groupings"]',
                '[data-easystud-layout-mode="structure"]',
            ],
            'panelActions' => '.local-groupimport-easystud__panel-actions',
            'participantFirstCard' => [
                '[data-easystud-participant-list] [data-selectable-type="participant"]:not([hidden])',
                '[data-easystud-participant-list]',
            ],
            'participantList' => '[data-easystud-participant-list]',
            'participantSelectionInput' => [
                '[data-easystud-participant-list] [data-easystud-user]:not([hidden]) > ' .
                    '.local-groupimport-easystud-selector:not([hidden])',
                '[data-easystud-participant-list] .local-groupimport-easystud-selector:not([hidden])',
            ],
            'participantCardActions' => [
                '[data-easystud-participant-list] [data-easystud-user]:not([hidden]) > ' .
                    '[data-easystud-card-menu]',
                '[data-easystud-participant-list] [data-easystud-card-menu]',
            ],
            'participantMoveAction' => '[data-easystud-move-selected-participants]',
            'firstGroup' => [
                '[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])',
                '[data-easystud-group-id]:not([hidden])',
            ],
            'firstGroupEmailBox' => [
                '[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden]) ' .
                    '[data-easystud-group-email-box]:not([hidden])',
                '[data-easystud-group-id]:not([hidden]) [data-easystud-group-email-box]:not([hidden])',
                '[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])',
            ],
            'participantGroupCard' => [
                '[data-easystud-participant-groups-panel] [data-easystud-group-id]:not([hidden])',
                '[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])',
                '[data-easystud-structure-groups]',
            ],
            'firstGrouping' => [
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])',
                '[data-easystud-tree]',
            ],
            'firstGroupingToggle' => '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])' .
                ' [data-easystud-collapse-toggle]',
            'firstGroupingAddButton' => '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])' .
                ' [data-easystud-toggle-grouping-groups]',
            'firstGroupingAddPanel' => [
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])' .
                    ' [data-easystud-grouping-groups-panel]:not([hidden])',
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])',
            ],
            'firstGroupingAddBox' => [
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])' .
                    ' [data-easystud-grouping-groups-panel]:not([hidden]) textarea',
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])' .
                    ' [data-easystud-grouping-groups-panel]:not([hidden])',
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])',
            ],
            'structureGroups' => '[data-easystud-structure-groups]',
            'tree' => '[data-easystud-tree]',
        ],
        'pathLabels' => [
            'first-structure' => get_string('tutorialguidedpaneltitle', 'local_groupimport'),
            'create-grouping' => get_string('tutorialguidedgroupingtitle', 'local_groupimport'),
            'try-actions' => get_string('tutorialguidedactionstitle', 'local_groupimport'),
        ],
        'paths' => [
            'first-structure' => [
                [
                    'id' => 'create-structure',
                    'title' => get_string('tutorialvisualguidedone', 'local_groupimport'),
                    'description' => get_string('tutorialguidedpaneldescstructure', 'local_groupimport'),
                    'target' => 'createRow',
                    'highlightTarget' => 'groupCreateInput',
                    'open' => 'viewGroups',
                    'feedback' => get_string('tutorialguidedpanelfeedbackstructure', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'add-participants',
                    'title' => get_string('tutorialvisualguidedtwo', 'local_groupimport'),
                    'description' => get_string('tutorialguidedpaneldescparticipants', 'local_groupimport'),
                    'target' => 'participantCardActions',
                    'highlightTargetCompact' => 'participantCardActions',
                    'highlightTargetDesktop' => 'participantMoveAction',
                    'open' => 'viewParticipants',
                    'openDelay' => 360,
                    'feedback' => get_string('tutorialguidedpanelfeedbackparticipants', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'check-filters',
                    'title' => get_string('tutorialvisualguidedthree', 'local_groupimport'),
                    'description' => get_string('tutorialguidedpaneldescfilters', 'local_groupimport'),
                    'target' => 'advancedParticipantFilters',
                    'open' => [
                        ['target' => 'viewParticipants', 'delay' => 320],
                        ['target' => '[data-easystud-advanced-filters-toggle="participants"]', 'delay' => 220],
                    ],
                    'feedback' => get_string('tutorialguidedpanelfeedbackfilters', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
            ],
            'create-grouping' => [
                [
                    'id' => 'create-grouping',
                    'title' => get_string('tutorialguidedcreategrouping', 'local_groupimport'),
                    'description' => get_string('tutorialguidedgroupingdesccreate', 'local_groupimport'),
                    'target' => 'createRow',
                    'highlightTarget' => 'groupingCreateInput',
                    'open' => 'viewGroupings',
                    'feedback' => get_string('tutorialguidedfeedbackgroupingcreate', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'add-group-to-grouping',
                    'title' => get_string('tutorialguidedaddgrouptogrouping', 'local_groupimport'),
                    'description' => get_string('tutorialguidedgroupingdescadd', 'local_groupimport'),
                    'target' => 'firstGroupingAddPanel',
                    'highlightTarget' => 'firstGroupingAddBox',
                    'open' => [
                        ['target' => 'viewGroupings', 'delay' => 800],
                        ['target' => 'tutorial:first-grouping-add-groups', 'delay' => 600],
                    ],
                    'feedback' => get_string('tutorialguidedfeedbackgroupingadd', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'verify-grouping',
                    'title' => get_string('tutorialguidedverifygrouping', 'local_groupimport'),
                    'description' => get_string('tutorialguidedgroupingdescverify', 'local_groupimport'),
                    'target' => 'firstGrouping',
                    'open' => [
                        ['target' => 'viewGroupings', 'delay' => 320],
                        ['target' => 'firstGroupingToggle', 'delay' => 360],
                    ],
                    'feedback' => get_string('tutorialguidedfeedbackgroupingverify', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
            ],
            'try-actions' => [
                [
                    'id' => 'try-drag',
                    'title' => get_string('tutorialguidedtrydrag', 'local_groupimport'),
                    'description' => get_string('tutorialguidedactionsdescdrag', 'local_groupimport'),
                    'target' => 'participantFirstCard',
                    'open' => 'viewParticipants',
                    'openDelay' => 320,
                    'feedback' => get_string('tutorialguidedfeedbackactionsdrag', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'try-selection',
                    'title' => get_string('tutorialguidedtryselection', 'local_groupimport'),
                    'description' => get_string('tutorialguidedactionsdescselection', 'local_groupimport'),
                    'target' => 'participantSelectionInput',
                    'open' => 'viewParticipants',
                    'openDelay' => 320,
                    'feedback' => get_string('tutorialguidedfeedbackactionsselection', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'try-context',
                    'title' => get_string('tutorialguidedtrycontext', 'local_groupimport'),
                    'description' => get_string('tutorialguidedactionsdesccontext', 'local_groupimport'),
                    'target' => 'participantCardActions',
                    'highlightTargetCompact' => 'participantCardActions',
                    'highlightTargetDesktop' => 'participantFirstCard',
                    'open' => 'viewParticipants',
                    'openDelay' => 320,
                    'feedback' => get_string('tutorialguidedfeedbackactionscontext', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
            ],
        ],
        'labels' => [
            'hint' => get_string('tutorialguidedpanelhint', 'local_groupimport'),
            'complete' => get_string('tutorialguidedpanelcomplete', 'local_groupimport'),
            'guidedPath' => get_string('tutorialguidedpaneltitle', 'local_groupimport'),
            'visited' => get_string('visited', 'local_groupimport'),
            'completeStepFirst' => get_string('guidesteplocked', 'local_groupimport'),
        ],
    ];
}

/**
 * Build a flat group catalog for the participant focus layout.
 *
 * @param int $courseid Course id.
 * @param array $groups Groups keyed by id.
 * @param array $groupings Groupings keyed by id.
 * @param array $users Users keyed by id.
 * @return array
 */
function local_groupimport_build_group_catalog_template_data(int $courseid, array $groups, array $groupings, array $users): array {
    $groupingtitles = [];
    foreach ($groupings as $grouping) {
        foreach ($grouping['groupids'] as $groupid) {
            $groupingtitles[(int)$groupid][] = $grouping['name'];
        }
    }

    $result = [];
    foreach ($groups as $group) {
        $item = local_groupimport_build_group_template_data($courseid, $group, $users, false, $groupings);
        $groupingnames = $groupingtitles[(int)$group['id']] ?? [];
        $item['groupingidscsv'] = implode(',', $group['groupingids'] ?? []);
        $item['hasnogrouping'] = empty($group['groupingids']);
        $item['groupingtags'] = array_map(static function(string $name): array {
            return ['label' => $name];
        }, $groupingnames);
        $item['searchtext'] = core_text::strtolower(trim($item['searchtext'] . ' ' . implode(' ', $groupingnames)));
        $result[] = $item;
    }

    usort($result, static function(array $left, array $right): int {
        return strnatcasecmp($left['name'], $right['name']);
    });

    return $result;
}

/**
 * Convert a translated navigation label or URL into a stable item key.
 *
 * @param string $value Source value.
 * @param string $prefix Key prefix.
 * @return string
 */
function local_groupimport_navigation_key(string $value, string $prefix): string {
    $value = core_text::strtolower(trim($value));
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    $value = trim($value, '-');
    return $prefix . '-' . ($value !== '' ? $value : 'item');
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
        'hasitems' => !empty($sections),
        'hasparticipantdropdown' => $native && !empty($native->options),
        'participantnavigationlabel' => get_string('mobilenavigationmoodle', 'local_groupimport'),
        'participantdropdown' => $native,
        'sections' => $sections,
    ];
}

/**
 * Return the user identification fields enabled in plugin settings.
 *
 * @return array
 */
function local_groupimport_get_allowed_user_field_definitions(): array {
    global $DB;

    $definitions = [
        'username' => get_string('username'),
        'email' => get_string('email'),
        'idnumber' => get_string('idnumber'),
    ];

    $customfields = $DB->get_records('user_info_field', null, 'name ASC');
    foreach ($customfields as $field) {
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
 * Return custom user profile fields keyed like Moodle profile field form names.
 *
 * @return array Field key => field label.
 */
function local_groupimport_get_custom_user_field_definitions(): array {
    global $DB;

    $definitions = [];
    $customfields = $DB->get_records('user_info_field', null, 'name ASC', 'id, shortname, name');
    foreach ($customfields as $field) {
        $definitions['profile_field_' . $field->shortname] = format_string($field->name);
    }

    return $definitions;
}

/**
 * Normalise a stored colour value before it is injected into inline CSS variables.
 *
 * @param string|null $colour Stored colour.
 * @param string $fallback Fallback colour.
 * @return string Safe hex colour.
 */
function local_groupimport_normalise_hex_colour(?string $colour, string $fallback): string {
    $colour = trim((string)$colour);
    if (preg_match('/^#[0-9a-fA-F]{6}$/', $colour)) {
        return core_text::strtolower($colour);
    }

    return $fallback;
}

/**
 * Read participant card display settings.
 *
 * @param array $customfields Available custom fields.
 * @return array Normalised display settings.
 */
function local_groupimport_get_participant_display_settings(array $customfields): array {
    $config = get_config('local_groupimport');
    $primaryfield = !empty($config->participantprimarybadgefield) &&
        isset($customfields[$config->participantprimarybadgefield])
            ? $config->participantprimarybadgefield
            : '';

    $detailfields = [];
    foreach (['participantdetailfield1', 'participantdetailfield2'] as $settingname) {
        $fieldkey = !empty($config->{$settingname}) ? (string)$config->{$settingname} : '';
        if ($fieldkey !== '' && isset($customfields[$fieldkey]) && $fieldkey !== $primaryfield &&
                !in_array($fieldkey, $detailfields, true)) {
            $detailfields[] = $fieldkey;
        }
    }

    return [
        'primaryfield' => $primaryfield,
        'primarybgcolor' => local_groupimport_normalise_hex_colour(
            $config->participantprimarybadgebgcolor ?? '',
            '#e8f4ff'
        ),
        'primarytextcolor' => local_groupimport_normalise_hex_colour(
            $config->participantprimarybadgetextcolor ?? '',
            '#0b4f8a'
        ),
        'detailfields' => $detailfields,
    ];
}

/**
 * Load selected custom profile values for all displayed users.
 *
 * @param array $users User records.
 * @param array $fieldkeys Selected custom field keys.
 * @return array User id => field key => value.
 */
function local_groupimport_load_custom_user_field_values(array $users, array $fieldkeys): array {
    global $DB;

    if (empty($users) || empty($fieldkeys)) {
        return [];
    }

    $shortnames = [];
    foreach ($fieldkeys as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $shortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    if (empty($shortnames)) {
        return [];
    }

    [$usersql, $userparams] = $DB->get_in_or_equal(array_keys($users), SQL_PARAMS_NAMED, 'user');
    [$fieldsql, $fieldparams] = $DB->get_in_or_equal($shortnames, SQL_PARAMS_NAMED, 'field');
    $recordset = $DB->get_recordset_sql(
        "SELECT d.id, d.userid, f.shortname, d.data
           FROM {user_info_data} d
           JOIN {user_info_field} f ON f.id = d.fieldid
          WHERE d.userid $usersql
            AND f.shortname $fieldsql",
        $userparams + $fieldparams
    );

    $values = [];
    foreach ($recordset as $record) {
        $fieldkey = 'profile_field_' . $record->shortname;
        $values[(int)$record->userid][$fieldkey] =
            local_groupimport_normalise_participant_label_value($record->data);
    }
    $recordset->close();

    return $values;
}

/**
 * Add participant card badge and detail metadata configured in plugin settings.
 *
 * @param array $users User records.
 * @param array $settings Display settings.
 * @param array $customfields Available custom fields.
 * @return array Enriched users.
 */
function local_groupimport_enrich_users_with_participant_display_fields(
    array $users,
    array $settings,
    array $customfields
): array {
    $selectedfields = array_values(array_unique(array_filter(array_merge(
        [$settings['primaryfield'] ?? ''],
        $settings['detailfields'] ?? []
    ))));

    if (empty($users) || empty($selectedfields)) {
        return $users;
    }

    $values = local_groupimport_load_custom_user_field_values($users, $selectedfields);
    foreach ($users as $userid => $user) {
        $primaryfield = $settings['primaryfield'] ?? '';
        if ($primaryfield !== '') {
            $value = $values[(int)$userid][$primaryfield] ?? '';
            if ($value !== '') {
                $users[$userid]['primarybadge'] = [
                    'label' => $customfields[$primaryfield],
                    'value' => $value,
                    'style' => '--local-groupimport-participant-badge-bg: ' . $settings['primarybgcolor'] .
                        '; --local-groupimport-participant-badge-color: ' . $settings['primarytextcolor'] . ';',
                ];
            }
        }

        $displayfields = [];
        $customfieldsmeta = [];
        foreach ($settings['detailfields'] ?? [] as $fieldkey) {
            $value = $values[(int)$userid][$fieldkey] ?? '';
            if ($value === '') {
                continue;
            }

            $displayfields[] = [
                'key' => $fieldkey,
                'label' => $customfields[$fieldkey],
                'value' => $value,
            ];
            $customfieldsmeta[] = local_groupimport_build_meta_tags_template_data(
                $customfields[$fieldkey],
                [$value],
                'local-groupimport-easystud-token local-groupimport-easystud-token--custom-info',
                ''
            );
        }

        $users[$userid]['participantdisplayfields'] = $displayfields;
        $users[$userid]['customfieldsmeta'] = $customfieldsmeta;
    }

    return $users;
}

/**
 * Enrich users with the copyable field values allowed by plugin settings.
 *
 * @param array $users User records.
 * @param array $alloweduserfields Allowed fields.
 * @return array
 */
function local_groupimport_enrich_users_with_copy_fields(array $users, array $alloweduserfields): array {
    global $DB;

    if (empty($users) || empty($alloweduserfields)) {
        return $users;
    }

    $customshortnames = [];
    foreach (array_keys($alloweduserfields) as $fieldkey) {
        if (strpos($fieldkey, 'profile_field_') === 0) {
            $customshortnames[] = substr($fieldkey, strlen('profile_field_'));
        }
    }

    $customvalues = [];
    if (!empty($customshortnames)) {
        [$usersql, $userparams] = $DB->get_in_or_equal(array_keys($users), SQL_PARAMS_NAMED);
        [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
        $records = $DB->get_records_sql(
            "SELECT d.userid, f.shortname, d.data
               FROM {user_info_data} d
               JOIN {user_info_field} f ON f.id = d.fieldid
              WHERE d.userid $usersql
                AND f.shortname $fieldsql",
            $userparams + $fieldparams
        );

        foreach ($records as $record) {
            $customvalues[(int)$record->userid]['profile_field_' . $record->shortname] = (string)$record->data;
        }
    }

    foreach ($users as $userid => $user) {
        $copyfields = [];
        foreach ($alloweduserfields as $fieldkey => $label) {
            if (strpos($fieldkey, 'profile_field_') === 0) {
                $value = $customvalues[(int)$userid][$fieldkey] ?? '';
            } else {
                $value = isset($user[$fieldkey]) ? (string)$user[$fieldkey] : '';
            }

            $copyfields[] = [
                'key' => $fieldkey,
                'label' => $label,
                'value' => $value,
            ];
        }
        $users[$userid]['copyfields'] = $copyfields;
    }

    return $users;
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
 * Build participant meta tag data.
 *
 * @param string $label Label.
 * @param array $items Tag items.
 * @param string $class CSS classes.
 * @param string $empty Empty label.
 * @return array
 */
function local_groupimport_build_meta_tags_template_data(string $label, array $items, string $class, string $empty): array {
    $visiblemax = 3;
    $tokens = [];

    if (empty($items)) {
        $tokens[] = [
            'label' => $empty,
            'class' => $class . ' local-groupimport-easystud-token--empty',
            'hidden' => false,
        ];
    } else {
        foreach ($items as $index => $item) {
            $tokens[] = [
                'label' => $item,
                'class' => $class,
                'hidden' => $index >= $visiblemax,
                'extra' => $index >= $visiblemax,
            ];
        }
    }

    return [
        'label' => $label,
        'tokens' => $tokens,
        'hasmore' => count($items) > $visiblemax,
        'showless' => get_string('showless', 'local_groupimport'),
    ];
}

/**
 * Build grouping template data.
 *
 * @param int $courseid Course id.
 * @param array $grouping Grouping data.
 * @param array $groups Group data.
 * @param array $users User data.
 * @param array $allgroupings All grouping data.
 * @return array
 */
function local_groupimport_build_grouping_template_data(
    int $courseid,
    array $grouping,
    array $groups,
    array $users,
    array $allgroupings = []
): array {
    $searchparts = [$grouping['name']];
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
        'countlabel' => get_string('groupscount', 'local_groupimport', $grouping['groupcount']),
        'counttemplate' => get_string('groupscount', 'local_groupimport', '__count__'),
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
        'groups' => [],
    ];

    foreach ($grouping['groupids'] as $groupid) {
        if (isset($groups[$groupid])) {
            $groupdata = local_groupimport_build_group_template_data($courseid, $groups[$groupid], $users, true, $allgroupings);
            $result['groups'][] = $groupdata;
            $searchparts[] = $groupdata['searchtext'];
        }
    }

    $result['searchtext'] = core_text::strtolower(trim(implode(' ', $searchparts)));

    return $result;
}

/**
 * Build group template data.
 *
 * @param int $courseid Course id.
 * @param array $group Group data.
 * @param array $users User data.
 * @param bool $withingrouping True when the group is rendered inside a grouping.
 * @param array $groupings Grouping data.
 * @return array
 */
function local_groupimport_build_group_template_data(
    int $courseid,
    array $group,
    array $users,
    bool $withingrouping = false,
    array $groupings = []
): array {
    $searchparts = [$group['name']];
    $groupingnames = [];
    foreach ($group['groupingids'] ?? [] as $groupingid) {
        if (isset($groupings[$groupingid])) {
            $groupingnames[] = $groupings[$groupingid]['name'];
            $searchparts[] = $groupings[$groupingid]['name'];
        }
    }
    $result = [
        'id' => $group['id'],
        'name' => $group['name'],
        'description' => $group['description'] ?? '',
        'rawdescription' => $group['rawdescription'] ?? '',
        'idnumber' => $group['idnumber'] ?? '',
        'enrolmentkey' => !empty($group['enrolmentkey']) ? '1' : '0',
        'picture' => $group['picture'] ?? '',
        'hidepicture' => !empty($group['hidepicture']) ? '1' : '0',
        'nativeurl' => (new moodle_url('/group/group.php', [
            'courseid' => $courseid,
            'id' => $group['id'],
        ]))->out(false),
        'membercountlabel' => get_string('memberscount', 'local_groupimport', $group['membercount']),
        'sesskey' => sesskey(),
        'renameurl' => (new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]))->out(false),
        'renameaction' => 'renamegroup',
        'renameidname' => 'groupid',
        'rawname' => $group['rawname'],
        'renamelabel' => get_string('rename', 'local_groupimport'),
        'savelabel' => get_string('save'),
        'cancellabel' => get_string('cancel'),
        'addemailstolabel' => get_string('addemailstogroup', 'local_groupimport'),
        'pasteemailsplaceholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
        'addemailsbutton' => get_string('addemails', 'local_groupimport'),
        'withingrouping' => $withingrouping,
        'groupingidscsv' => implode(',', $group['groupingids'] ?? []),
        'hasnogrouping' => empty($group['groupingids']),
        'groupingtags' => array_map(static function(string $name): array {
            return ['label' => $name];
        }, $groupingnames),
        'removefromgroupinglabel' => get_string('removegroupfromgrouping', 'local_groupimport'),
        'members' => [],
        'hasmembers' => !empty($group['memberids']),
        'nomemberslabel' => get_string('nogroupmembers', 'local_groupimport'),
    ];

    foreach ($group['memberids'] as $userid) {
        if (isset($users[$userid])) {
            $searchparts[] = $users[$userid]['fullname'];
            $searchparts[] = $users[$userid]['email'] ?? '';
            $result['members'][] = [
                'groupid' => $group['id'],
                'userid' => $users[$userid]['id'],
                'fullname' => $users[$userid]['fullname'],
                'email' => $users[$userid]['email'] ?? '',
                'removeuserlabel' => get_string('removeuserfromgroup', 'local_groupimport', $users[$userid]['fullname']),
                'selectableid' => $group['id'] . ':' . $users[$userid]['id'],
            ];
        }
    }

    $result['searchtext'] = core_text::strtolower(trim(implode(' ', $searchparts)));

    return $result;
}

/**
 * Build context menu action data for Mustache.
 *
 * @param array $alloweduserfields Allowed configured fields.
 * @param bool $canmessageparticipants Whether current user can send bulk messages.
 * @return array
 */
function local_groupimport_build_context_actions_template_data(
    array $alloweduserfields = [],
    bool $canmessageparticipants = false
): array {
    $actions = [
        'participant-open-details' => [
            'contexts' => 'participant',
            'icon' => 'fa-eye',
            'label' => get_string('viewparticipantdetails', 'local_groupimport'),
        ],
        'clear-selection' => [
            'contexts' => 'participant group grouping member',
            'icon' => 'fa-times-circle',
            'label' => get_string('contextclearselection', 'local_groupimport'),
            'multilabel' => get_string('contextclearselection', 'local_groupimport'),
        ],
        'participant-move-selected' => [
            'contexts' => 'participant',
            'icon' => 'fa-arrow-right',
            'label' => get_string('contextmoveparticipant', 'local_groupimport'),
            'multilabel' => get_string('contextmoveparticipants', 'local_groupimport'),
        ],
        'participant-message-selected' => [
            'contexts' => 'participant member',
            'icon' => 'fa-comment-dots',
            'label' => get_string('sendmessage', 'core_message'),
            'multilabel' => get_string('messageselectadd'),
            'enabled' => $canmessageparticipants,
        ],
        'copy-participant-name' => [
            'contexts' => 'participant member',
            'icon' => 'fa-id-card',
            'label' => get_string('contextcopyfullname', 'local_groupimport'),
            'multilabel' => get_string('contextcopyselectedfullnames', 'local_groupimport'),
        ],
        'copy-participant-id' => [
            'contexts' => 'participant member',
            'icon' => 'fa-hashtag',
            'label' => get_string('contextcopyuserid', 'local_groupimport'),
            'multilabel' => get_string('contextcopyselecteduserids', 'local_groupimport'),
        ],
        'group-paste-emails' => [
            'contexts' => 'group',
            'icon' => 'fa-envelope-open-text',
            'label' => get_string('contextaddemails', 'local_groupimport'),
        ],
        'group-add-copied-users' => [
            'contexts' => 'group',
            'icon' => 'fa-clipboard-check',
            'label' => get_string('contextaddcopiedusers', 'local_groupimport'),
        ],
        'group-move-selected' => [
            'contexts' => 'group',
            'icon' => 'fa-arrow-right',
            'label' => get_string('movegroupsselection', 'local_groupimport'),
            'multilabel' => get_string('movegroupsselection', 'local_groupimport'),
        ],
        'group-remove-from-grouping' => [
            'contexts' => 'group',
            'icon' => 'fa-unlink',
            'label' => get_string('removegroupfromgrouping', 'local_groupimport'),
            'multilabel' => get_string('removegroupsfromgroupings', 'local_groupimport'),
        ],
        'group-delete-selected' => [
            'contexts' => 'group',
            'icon' => 'fa-trash',
            'label' => get_string('deletegroupsselection', 'local_groupimport'),
            'multilabel' => get_string('deletegroupsselection', 'local_groupimport'),
        ],
        'group-focus-rename' => [
            'contexts' => 'group',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrename', 'local_groupimport'),
        ],
        'group-open-advanced-settings' => [
            'contexts' => 'group',
            'icon' => 'fa-cog',
            'label' => get_string('advancedsettings', 'local_groupimport'),
        ],
        'copy-group-name' => [
            'contexts' => 'group',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupname', 'local_groupimport'),
            'multilabel' => get_string('contextcopyselectedgroupnames', 'local_groupimport'),
        ],
        'grouping-paste-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-layer-group',
            'label' => get_string('contextaddgroups', 'local_groupimport'),
        ],
        'grouping-add-copied-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-clipboard-check',
            'label' => get_string('contextaddcopiedgroups', 'local_groupimport'),
        ],
        'grouping-select-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-check-square',
            'label' => get_string('contextselectgroupinggroups', 'local_groupimport'),
            'multilabel' => get_string('contextselectgroupingsgroups', 'local_groupimport'),
        ],
        'grouping-focus-rename' => [
            'contexts' => 'grouping',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrenamegrouping', 'local_groupimport'),
        ],
        'copy-grouping-name' => [
            'contexts' => 'grouping',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupingname', 'local_groupimport'),
        ],
        'remove-member' => [
            'contexts' => 'member',
            'icon' => 'fa-user-minus',
            'label' => get_string('contextremovemember', 'local_groupimport'),
            'multilabel' => get_string('contextremoveselectedmembers', 'local_groupimport'),
        ],
        'paste-field' => [
            'contexts' => 'paste-field',
            'icon' => 'fa-paste',
            'label' => get_string('contextpaste', 'local_groupimport'),
        ],
    ];

    $result = [];
    foreach ($alloweduserfields as $fieldkey => $fieldlabel) {
        $result[] = [
            'action' => 'copy-participant-field',
            'contexts' => 'participant member',
            'icon' => $fieldkey === 'email' ? 'fa-at' : 'fa-copy',
            'label' => get_string('contextcopyfield', 'local_groupimport', $fieldlabel),
            'multilabel' => $fieldkey === 'email'
                ? get_string('contextcopyselectedemails', 'local_groupimport')
                : get_string('contextcopyfieldselection', 'local_groupimport', $fieldlabel),
            'fieldkey' => $fieldkey,
        ];
    }

    foreach ($actions as $action => $definition) {
        if (array_key_exists('enabled', $definition) && !$definition['enabled']) {
            continue;
        }
        $result[] = [
            'action' => $action,
            'contexts' => $definition['contexts'],
            'icon' => $definition['icon'],
            'label' => $definition['label'],
            'multilabel' => $definition['multilabel'] ?? '',
            'fieldkey' => '',
        ];
    }

    return $result;
}

/**
 * Render create group and grouping forms.
 *
 * @param int $courseid Course id.
 * @return string
 */
function local_groupimport_render_quick_create_forms(int $courseid): string {
    $url = new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
    $groupform = html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-create',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => 'creategroup']) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'groupname',
            'class' => 'form-control',
            'placeholder' => get_string('newgroupplaceholder', 'local_groupimport'),
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategroup', 'local_groupimport'),
            'title' => get_string('creategroup', 'local_groupimport'),
            ]
        ) .
        html_writer::end_tag('form');

    $groupingform = html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-create',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => 'creategrouping']) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'groupingname',
            'class' => 'form-control',
            'placeholder' => get_string('newgroupingplaceholder', 'local_groupimport'),
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-outline-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategrouping', 'local_groupimport'),
            'title' => get_string('creategrouping', 'local_groupimport'),
            ]
        ) .
        html_writer::end_tag('form');

    return html_writer::div($groupform . $groupingform, 'local-groupimport-easystud-create-row');
}

/**
 * Render a grouping tree item.
 *
 * @param int $courseid Course id.
 * @param array $grouping Grouping.
 * @param array $groups Groups.
 * @param array $users Users.
 * @return string
 */
function local_groupimport_render_grouping(int $courseid, array $grouping, array $groups, array $users): string {
    $out = html_writer::start_div('local-groupimport-easystud-tree__section', [
        'data-easystud-grouping-id' => $grouping['id'],
        'data-easystud-grouping-drop' => $grouping['id'],
        'data-selectable-type' => 'grouping',
        'data-selectable-id' => $grouping['id'],
    ]);
    $out .= html_writer::start_div('local-groupimport-easystud-grouping__header');
    $out .= html_writer::tag('button',
        html_writer::span('', 'fa fa-chevron-down', ['aria-hidden' => 'true']) .
            html_writer::span(s($grouping['name']), 'local-groupimport-easystud-grouping__name') .
            html_writer::span(
                get_string('groupscount', 'local_groupimport', $grouping['groupcount']),
                'badge bg-secondary text-white',
                ['data-count-template' => get_string('groupscount', 'local_groupimport', '__count__')]
            ),
        [
            'type' => 'button',
            'class' => 'local-groupimport-easystud-tree__toggle',
            'data-easystud-collapse-toggle' => '1',
            'aria-expanded' => 'true',
        ]
    );
    $out .= html_writer::tag('button',
        html_writer::span('', 'fa fa-layer-group', ['aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
            'data-easystud-toggle-grouping-groups' => $grouping['id'],
            'aria-label' => get_string('addgroupstogrouping', 'local_groupimport'),
            'title' => get_string('addgroupstogrouping', 'local_groupimport'),
        ]
    );
    $out .= html_writer::end_div();
    $out .= local_groupimport_render_inline_rename_form(
        $courseid,
        'renamegrouping',
        'groupingid',
        $grouping['id'],
        $grouping['rawname']
    );
    $out .= local_groupimport_render_grouping_groups_panel($grouping['id']);
    $out .= html_writer::start_div('local-groupimport-easystud-tree__children');
    foreach ($grouping['groupids'] as $groupid) {
        if (isset($groups[$groupid])) {
            $out .= local_groupimport_render_group($courseid, $groups[$groupid], $users);
        }
    }
    $out .= html_writer::end_div();
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a hidden group paste panel for a grouping.
 *
 * @param int $groupingid Grouping id.
 * @return string
 */
function local_groupimport_render_grouping_groups_panel(int $groupingid): string {
    return html_writer::start_div('local-groupimport-easystud-group-email', [
            'data-easystud-grouping-groups-panel' => $groupingid,
            'hidden' => 'hidden',
        ]) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control form-control-sm',
            'rows' => 3,
            'placeholder' => get_string('pastegroupsplaceholder', 'local_groupimport'),
            'data-easystud-grouping-groups-box' => $groupingid,
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus me-1', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('addgroups', 'local_groupimport')),
            [
                'type' => 'button',
                'class' => 'btn btn-sm btn-outline-primary mt-2',
                'data-easystud-add-grouping-groups' => $groupingid,
            ]
        ) .
        html_writer::div('', 'local-groupimport-easystud-group-email__result', [
            'data-easystud-grouping-groups-result' => $groupingid,
            'aria-live' => 'polite',
        ]) .
        html_writer::end_div();
}

/**
 * Render a group tree item.
 *
 * @param int $courseid Course id.
 * @param array $group Group.
 * @param array $users Users.
 * @return string
 */
function local_groupimport_render_group(int $courseid, array $group, array $users): string {
    $out = html_writer::start_div('local-groupimport-easystud-group', [
        'data-easystud-group-id' => $group['id'],
        'data-easystud-user-drop' => $group['id'],
        'data-selectable-type' => 'group',
        'data-selectable-id' => $group['id'],
        'draggable' => 'true',
    ]);
    $out .= html_writer::tag('div',
        html_writer::span('', 'fa fa-users local-groupimport-easystud-drag-indicator', ['aria-hidden' => 'true']) .
            html_writer::span(s($group['name']), 'local-groupimport-easystud-group__name') .
            html_writer::span(
                get_string('memberscount', 'local_groupimport', $group['membercount']),
                'badge bg-light text-dark'
            ) .
            html_writer::tag('button',
                html_writer::span('', 'fa fa-at', ['aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
                    'data-easystud-toggle-group-email' => $group['id'],
                    'aria-label' => get_string('addemailstogroup', 'local_groupimport'),
                    'title' => get_string('addemailstogroup', 'local_groupimport'),
                ]
            ),
        ['class' => 'local-groupimport-easystud-group__header']
    );
    $out .= local_groupimport_render_inline_rename_form(
        $courseid,
        'renamegroup',
        'groupid',
        $group['id'],
        $group['rawname']
    );
    $out .= html_writer::start_tag('ul', [
        'class' => 'local-groupimport-easystud-group__members',
        'data-easystud-group-members' => $group['id'],
    ]);
    foreach ($group['memberids'] as $userid) {
        if (isset($users[$userid])) {
            $out .= local_groupimport_render_group_member($group['id'], $users[$userid]);
        }
    }
    if (empty($group['memberids'])) {
        $out .= html_writer::tag('li', get_string('nogroupmembers', 'local_groupimport'), ['class' => 'text-muted']);
    }
    $out .= html_writer::end_tag('ul');
    $out .= local_groupimport_render_group_email_panel($group['id']);
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a group member row.
 *
 * @param int $groupid Group id.
 * @param array $user User data.
 * @return string
 */
function local_groupimport_render_group_member(int $groupid, array $user): string {
    return html_writer::tag('li',
        html_writer::span(s($user['fullname']), 'local-groupimport-easystud-member__name') .
        html_writer::tag('button',
            html_writer::span('&minus;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-member__remove',
                'data-easystud-remove-member' => '1',
                'data-group-id' => $groupid,
                'data-user-id' => $user['id'],
                'aria-label' => get_string('removeuserfromgroup', 'local_groupimport', $user['fullname']),
                'title' => get_string('removeuserfromgroup', 'local_groupimport', $user['fullname']),
            ]
        ),
        [
            'class' => 'local-groupimport-easystud-member',
            'data-easystud-member-id' => $user['id'],
            'data-member-key' => $groupid . ':' . $user['id'],
            'data-selectable-type' => 'member',
            'data-selectable-id' => $groupid . ':' . $user['id'],
        ]
    );
}

/**
 * Render a hidden email paste panel for a group.
 *
 * @param int $groupid Group id.
 * @return string
 */
function local_groupimport_render_group_email_panel(int $groupid): string {
    return html_writer::start_div('local-groupimport-easystud-group-email', [
            'data-easystud-group-email-panel' => $groupid,
            'hidden' => 'hidden',
        ]) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control form-control-sm',
            'rows' => 3,
            'placeholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
            'data-easystud-group-email-box' => $groupid,
        ]) .
        html_writer::tag('button',
            html_writer::span('', 'fa fa-plus me-1', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('addemails', 'local_groupimport')),
            [
                'type' => 'button',
                'class' => 'btn btn-sm btn-primary mt-2',
                'data-easystud-add-group-emails' => $groupid,
            ]
        ) .
        html_writer::div('', 'local-groupimport-easystud-group-email__result', [
            'data-easystud-group-email-result' => $groupid,
            'aria-live' => 'polite',
        ]) .
        html_writer::end_div();
}

/**
 * Render the optional clipboard validation modal.
 *
 * @return string
 */
function local_groupimport_render_clipboard_modal(): string {
    $content = html_writer::tag('p', get_string('clipboardtools_desc', 'local_groupimport'), ['class' => 'text-muted']) .
        html_writer::tag('textarea', '', [
            'class' => 'form-control',
            'rows' => 6,
            'placeholder' => get_string('pasteemailsplaceholder', 'local_groupimport'),
            'data-easystud-paste-box' => '1',
        ]) .
        html_writer::div('', 'local-groupimport-easystud__paste-results', [
            'data-easystud-paste-results' => '1',
            'aria-live' => 'polite',
        ]);

    return html_writer::start_div('local-groupimport-easystud-modal', [
            'data-easystud-clipboard-modal' => '1',
            'hidden' => 'hidden',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-easystud-clipboard-title',
        ]) .
        html_writer::start_div('local-groupimport-easystud-modal__dialog') .
        html_writer::start_div('local-groupimport-easystud-modal__header') .
        html_writer::tag('h3', get_string('clipboardtools', 'local_groupimport'), [
            'id' => 'local-groupimport-easystud-clipboard-title',
            'class' => 'h5 mb-0',
        ]) .
        html_writer::tag('button',
            html_writer::span('&times;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'local-groupimport-easystud-modal__close',
                'data-easystud-close-clipboard' => '1',
                'aria-label' => get_string('closebuttontitle'),
            ]
        ) .
        html_writer::end_div() .
        html_writer::div($content, 'local-groupimport-easystud-modal__body') .
        html_writer::end_div() .
        html_writer::end_div();
}

/**
 * Render the participant details modal.
 *
 * @return string
 */
function local_groupimport_render_participant_modal(): string {
    return html_writer::start_div('local-groupimport-easystud-modal', [
            'data-easystud-user-modal' => '1',
            'hidden' => 'hidden',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-easystud-user-title',
        ]) .
        html_writer::start_div('local-groupimport-easystud-modal__dialog local-groupimport-easystud-modal__dialog--user') .
        html_writer::start_div('local-groupimport-easystud-modal__header') .
        html_writer::start_div('local-groupimport-easystud-settings-modal__heading') .
        html_writer::span('', 'local-groupimport-easystud-settings-modal__icon fa fa-user', ['aria-hidden' => 'true']) .
        html_writer::start_div() .
        html_writer::span('EasyStud', 'local-groupimport-easystud-settings-modal__eyebrow') .
        html_writer::tag('h3', get_string('participantdetails', 'local_groupimport'), [
            'id' => 'local-groupimport-easystud-user-title',
            'class' => 'h5 mb-0',
        ]) .
        html_writer::end_div() .
        html_writer::end_div() .
        html_writer::tag('button',
            html_writer::span('&times;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'local-groupimport-easystud-modal__close',
                'data-easystud-close-user-modal' => '1',
                'aria-label' => get_string('closebuttontitle'),
            ]
        ) .
        html_writer::end_div() .
        html_writer::div('', 'local-groupimport-easystud-modal__body', [
            'data-easystud-user-modal-body' => '1',
        ]) .
        html_writer::end_div() .
        html_writer::end_div();
}

/**
 * Render the right-click context menu.
 *
 * @return string
 */
function local_groupimport_render_context_menu(): string {
    $actions = [
        'copy-email' => [
            'contexts' => 'participant',
            'icon' => 'fa-at',
            'label' => get_string('contextcopyemail', 'local_groupimport'),
        ],
        'participant-open-details' => [
            'contexts' => 'participant',
            'icon' => 'fa-eye',
            'label' => get_string('viewparticipantdetails', 'local_groupimport'),
        ],
        'copy-selected-emails' => [
            'contexts' => 'participant',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopyselectedemails', 'local_groupimport'),
        ],
        'clear-selection' => [
            'contexts' => 'participant',
            'icon' => 'fa-times-circle',
            'label' => get_string('contextclearselection', 'local_groupimport'),
        ],
        'group-paste-emails' => [
            'contexts' => 'group',
            'icon' => 'fa-envelope-open-text',
            'label' => get_string('contextaddemails', 'local_groupimport'),
        ],
        'group-focus-rename' => [
            'contexts' => 'group',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrename', 'local_groupimport'),
        ],
        'copy-group-name' => [
            'contexts' => 'group',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupname', 'local_groupimport'),
        ],
        'grouping-paste-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-layer-group',
            'label' => get_string('contextaddgroups', 'local_groupimport'),
        ],
        'grouping-focus-rename' => [
            'contexts' => 'grouping',
            'icon' => 'fa-pen',
            'label' => get_string('contextfocusrenamegrouping', 'local_groupimport'),
        ],
        'copy-grouping-name' => [
            'contexts' => 'grouping',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopygroupingname', 'local_groupimport'),
        ],
        'remove-member' => [
            'contexts' => 'member',
            'icon' => 'fa-user-minus',
            'label' => get_string('contextremovemember', 'local_groupimport'),
        ],
    ];

    $out = html_writer::start_div('local-groupimport-easystud-context-menu', [
        'data-easystud-context-menu' => '1',
        'hidden' => 'hidden',
        'role' => 'menu',
    ]);
    foreach ($actions as $action => $definition) {
        $out .= html_writer::tag('button',
            html_writer::span('', 'fa ' . $definition['icon'], ['aria-hidden' => 'true']) .
                html_writer::span($definition['label']),
            [
                'type' => 'button',
                'data-easystud-context-action' => $action,
                'data-easystud-contexts' => $definition['contexts'],
                'role' => 'menuitem',
            ]
        );
    }
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Render a small inline rename form.
 *
 * @param int $courseid Course id.
 * @param string $action Action.
 * @param string $idname Id parameter name.
 * @param int $id Item id.
 * @param string $value Current value.
 * @return string
 */
function local_groupimport_render_inline_rename_form(
    int $courseid,
    string $action,
    string $idname,
    int $id,
    string $value
): string {
    $url = new moodle_url('/local/groupimport/manage.php', ['id' => $courseid]);
    return html_writer::start_tag('form', [
            'method' => 'post',
            'action' => $url->out(false),
            'class' => 'local-groupimport-easystud-rename',
        ]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'action', 'value' => $action]) .
        html_writer::empty_tag('input', ['type' => 'hidden', 'name' => $idname, 'value' => $id]) .
        html_writer::empty_tag('input', [
            'type' => 'text',
            'name' => 'name',
            'class' => 'form-control form-control-sm',
            'value' => s($value),
            'aria-label' => get_string('rename', 'local_groupimport'),
        ]) .
        html_writer::tag('button', get_string('save'), ['type' => 'submit', 'class' => 'btn btn-sm btn-outline-secondary']) .
        html_writer::end_tag('form');
}

/**
 * Render a labelled list of participant tags with overflow toggle.
 *
 * @param string $label Section label.
 * @param array $items Items.
 * @param string $class Token CSS class.
 * @param string $empty Empty-state label.
 * @return string
 */
function local_groupimport_render_meta_tags(string $label, array $items, string $class, string $empty): string {
    $visiblemax = 3;
    $out = html_writer::start_div('local-groupimport-easystud-user__meta-group');
    $out .= html_writer::tag('span', s($label), ['class' => 'local-groupimport-easystud-user__meta-label']);
    $out .= html_writer::start_div('local-groupimport-easystud-user__meta-tags');

    if (empty($items)) {
        $out .= html_writer::tag('span', s($empty), ['class' => $class . ' local-groupimport-easystud-token--empty']);
    } else {
        foreach ($items as $index => $item) {
            $attributes = ['class' => $class];
            if ($index >= $visiblemax) {
                $attributes['hidden'] = 'hidden';
                $attributes['data-easystud-extra-tag'] = '1';
            }
            $out .= html_writer::tag('span', s($item), $attributes);
        }

        if (count($items) > $visiblemax) {
            $out .= html_writer::tag('button', '+0', [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-tags-toggle',
                'data-easystud-toggle-tags' => '1',
                'data-more-label' => '+0',
                'data-less-label' => get_string('showless', 'local_groupimport'),
            ]);
        }
    }

    $out .= html_writer::end_div();
    $out .= html_writer::end_div();

    return $out;
}

/**
 * Extract group or grouping names from a separated quick-create field.
 *
 * @param string $text Raw field value.
 * @return array
 */
function local_groupimport_extract_create_names(string $text): array {
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
            for ($index = 1; $index <= $count; $index++) {
                $suffix = $marker === '#' ? (string)$index : local_groupimport_number_to_letters($index);
                $names[] = trim($prefix . ' ' . $suffix);
            }
            continue;
        }

        $names[] = $part;
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
