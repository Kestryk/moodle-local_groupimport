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
    local_groupimport_build_easyedu_guide_js_config($course->id),
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
            // the collapsed behaviour: only an explicit "0" switches it off.
            'metacollapsedbydefault' => get_config('local_groupimport', 'participantcardcollapsed') !== '0',
            'expandmetalabel' => get_string('participantcardexpand', 'local_groupimport'),
            'collapsemetalabel' => get_string('participantcardcollapse', 'local_groupimport'),
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
$state = \local_groupimport\service\course_state::page_data($course, $context);
$state = local_groupimport_prepare_manage_names($state, $context);
// The authenticated document and the first store share one fresh response snapshot.
// No persistent cache: every reload rebuilds it, and later refreshes still use AJAX.
$initialstatejson = false;
try {
    $initialresponse = \local_groupimport\external\get_state::execute((int)$course->id);
    $initialstatejson = json_encode(
        json_decode($initialresponse['state'], true, 512, JSON_THROW_ON_ERROR),
        JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT |
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
    );
    unset($initialresponse);
} catch (\Throwable $exception) {
    // Keep the existing AJAX error/retry path authoritative if preparation fails.
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
 * Build the shared EasyEdu guide template data from the existing EasyStud tutorial data.
 *
 * @param array $templatedata EasyStud page template data.
 * @return array
 */
function local_groupimport_build_easyedu_guide_template_data(array $templatedata): array {
    $slides = [];
    foreach ($templatedata['tutorialsteps'] as $index => $step) {
        $slide = [
            'id' => 'reference-' . $index,
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
                    ['key' => get_string('tutorialkeyboardkeyspace', 'local_groupimport'),
                        'label' => $templatedata['tutorialvisualkeyboardspace']],
                    ['key' => get_string('tutorialkeyboardkeyshift', 'local_groupimport'),
                        'label' => get_string('tutorialvisualkeyboardrange', 'local_groupimport')],
                ],
            ];
        } else if (
            !empty($step['visualparticipantcard']) || !empty($step['visualgroupcard']) ||
                !empty($step['visualgroupingcard'])
        ) {
            $cardtype = !empty($step['visualparticipantcard']) ? 'participant' :
                (!empty($step['visualgroupcard']) ? 'group' : 'grouping');
            // Reuse canonical explanation layout; preserve static card and native targets.
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::card_explanation($cardtype);
            $slide['anatomy'] = \local_groupimport\local\guide_discovery::card_anatomy($cardtype);
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
            // Illustration-only successor: retain the lesson, opener and native target.
            // Matching canonical template, engine and stylesheet are synchronized together.
            if ($cardtype !== 'participant') {
                $slide['discoveryscene'] = \local_groupimport\local\guide_discovery::card_inspection($cardtype);
                unset($slide['visualcarddetail']);
            }
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('filters');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('activity');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('identifiers');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('menu');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('destination');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('method');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('method');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('creation');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('mistakes');
            $slide['visualsteps'] = [
                'layout' => 'warning-grid',
                'items' => [
                    ['icon' => 'fa-ban', 'label' => $templatedata['tutorialvisualmistakeone'], 'state' => 'warning'],
                    ['icon' => 'fa-random', 'label' => $templatedata['tutorialvisualmistaketwo'], 'state' => 'warning'],
                    ['icon' => 'fa-layer-group', 'label' => $templatedata['tutorialvisualmistakethree'], 'state' => 'warning'],
                ],
            ];
        } else if (!empty($step['visualcompletion'])) {
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('ready');
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
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::action_explanation('recap');
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
            // This lesson explains the Guide itself, not group creation.
            // Reading order changes below through the explicit historical contract.
            $slide['id'] = 'use-this-guide';
            $slide['category'] = get_string('guideintro_category', 'local_groupimport');
            $slide['title'] = get_string('guideintro_title', 'local_groupimport');
            $slide['navtitle'] = get_string('guideintro_navtitle', 'local_groupimport');
            $slide['content'] = html_writer::tag('p', s(get_string('guideintro_description', 'local_groupimport')));
            $slide['commonintroduction'] = \local_groupimport\local\guide_discovery::common_introduction(true);
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

    $slides = \local_groupimport\local\guide_discovery::prepend($slides);
    $slides = \local_groupimport\local\guide_discovery::introduction_first($slides);
    $slides = \local_groupimport\local\guide_discovery::modern_curriculum($slides);
    $slidecount = max(1, count($slides));

    return [
        'rootclass' => 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
        'discoverypresentation' => true,
        'guideinterfacecuelabel' => get_string('guideinterfacecuelabel', 'local_groupimport'),
        'guideopenlabel' => $templatedata['tutoriallabel'],
        'guidefullscreenenter' => get_string('guidefullscreenenter', 'local_groupimport'),
        'guidefullscreenexit' => get_string('guidefullscreenexit', 'local_groupimport'),
        'guidefullscreenunavailable' => get_string('guidefullscreenunavailable', 'local_groupimport'),
        'guidehoverlabel' => get_string('tutorialhoverlabel', 'local_groupimport'),
        'guidecloselabel' => get_string('closebuttontitle', 'core'),
        'guidetitle' => $templatedata['tutorialtitle'],
        'guideeyebrow' => get_string('guideeyebrow', 'local_groupimport'),
        'guidemodaltitle' => get_string('easystudmanager', 'local_groupimport'),
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
        'guidewelcomeeyebrow' => get_string('guidewelcomeeyebrow', 'local_groupimport'),
        'guidewelcometitle' => get_string('guidewelcometitle', 'local_groupimport'),
        'guidewelcomecopy' => get_string('guidewelcomecopy', 'local_groupimport'),
        'guidewelcomeopen' => get_string('guidewelcomeopen', 'local_groupimport'),
        'guidewelcomedismiss' => get_string('guidewelcomedismiss', 'local_groupimport'),
        'guideminimizelabel' => $templatedata['tutorialguidedpanelminimize'],
        'guiderestorelabel' => get_string('discovery_restore', 'local_groupimport'),
        'guideresumetitle' => get_string('discovery_resume_title', 'local_groupimport'),
        'guideresumelabel' => get_string('guideresumepath', 'local_groupimport'),
        'guideresumeguidedlabel' => get_string('guideresumeguidedpath', 'local_groupimport'),
        'guidecancelpathlabel' => get_string('discovery_cancel_path', 'local_groupimport'),
        'guideresetpathlabel' => get_string('discovery_reset_path', 'local_groupimport'),
        'guidechecklisthint' => $templatedata['tutorialguidedpanelhint'],
        'guidechecklistdonelabel' => $templatedata['tutorialguidedpanelcomplete'],
        'guidechecklistreturnlabel' => get_string('tutorialguidedpanelreturn', 'local_groupimport'),
        'guidechecklistendclose' => get_string('tutorialguidedpanelendclose', 'local_groupimport'),
        'guidechecklistrestartlabel' => get_string('tutorialguidedpanelrestart', 'local_groupimport'),
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
    global $USER;
    // Guide progress belongs to the person, not the course: browsers can be shared.
    return \local_groupimport\local\guide_discovery::modern_reading_contract() + [
        'storageKey' => 'local_groupimport.easyedu_guide.u' . (int)$USER->id . '.c' . $courseid,
        'firstVisit' => false,
        'fullscreen' => true,
        'welcomeOffer' => \local_groupimport\local\guide_welcome::should_offer(),
        // K18-16: on compact layouts the compass lives in the closed navigation drawer.
        'welcomeCompactTarget' => '[data-easyedu-navigation-open]',
        'highlightAutoHideDelay' => 5200,
        'highlightStyle' => 'pulse-blue',
        'targets' => [
            'activityGroupingEntry' => [
                '[data-easystud-tree] [data-easystud-grouping-id]:not([hidden]) [data-easystud-collapse-toggle]',
                '.local-groupimport-easystud-create-row input[name="groupingname"]',
            ],
            'activityGroupSelection' => '[data-easystud-tree] [data-easystud-group-id]:not([hidden]) > ' .
                '.local-groupimport-easystud-selector',
            'activityGroupDestination' => '[data-easystud-move-modal][data-easystud-move-context="group"] ' .
                '.easyedu-searchable-choice',
            'activityGroupConfirm' => '[data-easystud-move-modal][data-easystud-move-context="group"] ' .
                '[data-easystud-confirm-move]',
            'activityGroupingResult' => '[data-easystud-guide-activity-destination] [data-easystud-collapse-toggle]',
            'createRow' => '.local-groupimport-easystud-create-row',
            'groupCreateInput' => '.local-groupimport-easystud-create-row input[name="groupname"]',
            'groupingCreateInput' => '.local-groupimport-easystud-create-row input[name="groupingname"]',
            'filters' => '[data-easystud-filters]',
            'advancedParticipantFilters' => '[data-easystud-advanced-filters="participants"]',
            'participantFilterToggle' => '[data-easystud-advanced-filters-toggle="participants"]',
            'participantFilterSearch' => '[data-easystud-search]',
            'participantFilteredResults' => '[data-easystud-guide-result-scope="participants"] ' .
                '[data-easystud-select-results]',
            'participantClearSelection' => [
                '[data-easystud-clear-all-selection]',
                '[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]',
            ],
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
            'participantMoveAction' => [
                '[data-easystud-move-selected-participants]',
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]',
            ],
            'participantMoveDestination' => '[data-easystud-move-modal][data-easystud-move-context="participant"] ' .
                '.easyedu-searchable-choice',
            'participantMoveConfirm' => '[data-easystud-move-modal][data-easystud-move-context="participant"] ' .
                '[data-easystud-confirm-move]',
            'groupMemberSelection' => '[data-easystud-structure-groups] [data-easystud-member-id]:not([hidden]) ' .
                '.local-groupimport-easystud-selector',
            'memberMoveAction' => [
                '[data-easystud-move-selected-members]',
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-members]"]',
            ],
            'memberMoveDestination' => '[data-easystud-move-modal][data-easystud-move-context="member"] ' .
                '.easyedu-searchable-choice',
            'memberMoveConfirm' => '[data-easystud-move-modal][data-easystud-move-context="member"] ' .
                '[data-easystud-confirm-move]',
            'groupEditorAction' => [
                '[data-easystud-structure-groups] [data-easystud-open-advanced-settings][data-easystud-advanced-target="group"]',
                '[data-easystud-context-action="group-open-advanced-settings"]:not([hidden])',
            ],
            'groupingEditorAction' => [
                '[data-easystud-tree] [data-easystud-open-advanced-settings][data-easystud-advanced-target="grouping"]',
                '[data-easystud-context-action="grouping-open-advanced-settings"]:not([hidden])',
            ],
            'groupEditorName' => '[data-easystud-editor-context="group"] input[name="name"]',
            'groupEditorDescription' => '[data-easystud-editor-context="group"] textarea[name="description"]',
            'groupEditorCancel' => '[data-easystud-editor-context="group"] .easyedu-entity-dialog__actions ' .
                '[data-easystud-close-advanced-settings]',
            'groupingEditorName' => '[data-easystud-editor-context="grouping"] input[name="name"]',
            'groupingEditorDescription' => '[data-easystud-editor-context="grouping"] textarea[name="description"]',
            'groupingEditorCancel' => '[data-easystud-editor-context="grouping"] .easyedu-entity-dialog__actions ' .
                '[data-easystud-close-advanced-settings]',
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
            'prepare-activity-grouping' => get_string('activity_path_title', 'local_groupimport'),
            'verify-with-filters' => get_string('filter_path_title', 'local_groupimport'),
            'inspect-group-settings' => get_string('editor_group_title', 'local_groupimport'),
            'inspect-grouping-settings' => get_string('editor_grouping_title', 'local_groupimport'),
            'reorganise-source-members' => get_string('member_path_title', 'local_groupimport'),
            'practice-membership' => get_string('discovery_path_title', 'local_groupimport'),
            'try-actions' => get_string('tutorialguidedactionstitle', 'local_groupimport'),
        ],
        'pathContextFields' => [
            'prepare-activity-grouping' => ['destinationId' => 'id', 'groupIds' => 'ids'],
            // Session token only; no course evidence payload is stored by this path.
            'try-actions' => [],
        ],
        'paths' => [
            'prepare-activity-grouping' => \local_groupimport\local\guide_discovery::activity_grouping_path(),
            'verify-with-filters' => \local_groupimport\local\guide_discovery::filter_verification_path(),
            'inspect-group-settings' => \local_groupimport\local\guide_discovery::editor_inspection_path('group'),
            'inspect-grouping-settings' => \local_groupimport\local\guide_discovery::editor_inspection_path('grouping'),
            'reorganise-source-members' => \local_groupimport\local\guide_discovery::source_member_path(),
            'practice-membership' => \local_groupimport\local\guide_discovery::practice_path(),
            'try-actions' => [
                [
                    'id' => 'try-drag',
                    'title' => get_string('tutorialguidedtrydrag', 'local_groupimport'),
                    'titleCompact' => get_string('tutorialguidedtrymove', 'local_groupimport'),
                    'description' => get_string('tutorialguidedactionsdescdrag', 'local_groupimport'),
                    'descriptionCompact' => get_string('tutorialguidedactionsdescmove', 'local_groupimport'),
                    'target' => 'participantFirstCard',
                    'open' => 'viewParticipants',
                    'openDelay' => 320,
                    'feedback' => get_string('tutorialguidedfeedbackactionsdrag', 'local_groupimport'),
                    'feedbackCompact' => get_string('tutorialguidedfeedbackactionsmove', 'local_groupimport'),
                    'completionMode' => 'event',
                ],
                [
                    'id' => 'try-selection',
                    'requiresStep' => 'try-drag',
                    'title' => get_string('tutorialguidedtryselection', 'local_groupimport'),
                    'description' => get_string('tutorialguidedactionsdescselection', 'local_groupimport'),
                    'target' => 'participantSelectionInput',
                    'open' => 'viewParticipants',
                    'openDelay' => 320,
                    'feedback' => get_string('tutorialguidedfeedbackactionsselection', 'local_groupimport'),
                    'completionMode' => 'event',
                    // Selecting masks nothing: the Guide can target "try-context" by itself.
                    'autoHighlightNext' => true,
                ],
                [
                    'id' => 'try-context',
                    'requiresStep' => 'try-selection',
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
            'completeTitle' => get_string('tutorialguidedpanelcompletetitle', 'local_groupimport'),
            'guidedPath' => get_string('tutorialguidedpaneltitle', 'local_groupimport'),
            'guidedPathSeparator' => get_string('tutorialguidedpanelseparator', 'local_groupimport'),
            'completedSteps' => get_string('tutorialguidedpanelcompletedsteps', 'local_groupimport'),
            'visited' => get_string('visited', 'local_groupimport'),
            'stepCompleted' => get_string('completed'),
            'stepLocked' => get_string('locked', 'grades'),
            'completeStepFirst' => get_string('guidesteplocked', 'local_groupimport'),
            'pathReset' => get_string('discovery_path_reset_feedback', 'local_groupimport'),
            'pathCancelled' => get_string('discovery_path_cancelled_feedback', 'local_groupimport'),
        ],
    ];
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
        'drawertitle' => get_string('easystudlabel', 'local_groupimport'),
        'drawersubtitle' => get_string('easystudmanager', 'local_groupimport'),
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
        if (
            $fieldkey !== '' && isset($customfields[$fieldkey]) && $fieldkey !== $primaryfield &&
                !in_array($fieldkey, $detailfields, true)
        ) {
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

    [$fieldsql, $fieldparams] = $DB->get_in_or_equal($shortnames, SQL_PARAMS_NAMED, 'field');
    $values = [];
    foreach (array_chunk(array_keys($users), 1000) as $userids) {
        [$usersql, $userparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED, 'user');
        $recordset = $DB->get_recordset_sql(
            "SELECT d.id, d.userid, f.shortname, d.data
           FROM {user_info_data} d
           JOIN {user_info_field} f ON f.id = d.fieldid
          WHERE d.userid $usersql
            AND f.shortname $fieldsql",
            $userparams + $fieldparams
        );
        try {
            foreach ($recordset as $record) {
                $fieldkey = 'profile_field_' . $record->shortname;
                $values[(int)$record->userid][$fieldkey] =
                    local_groupimport_normalise_participant_label_value($record->data);
            }
        } finally {
            $recordset->close();
        }
    }

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
        [$fieldsql, $fieldparams] = $DB->get_in_or_equal($customshortnames, SQL_PARAMS_NAMED, 'field');
        foreach (array_chunk(array_keys($users), 1000) as $userids) {
            [$usersql, $userparams] = $DB->get_in_or_equal($userids, SQL_PARAMS_NAMED);
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
 * Build context menu entry data for Mustache.
 *
 * Entries are rendered top to bottom. Each entry is exactly one of an action
 * item, a section separator or a submenu group holding its own action items.
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
            'label' => get_string('contextcopyshortfullname', 'local_groupimport'),
        ],
        'copy-participant-id' => [
            'contexts' => 'participant member',
            'icon' => 'fa-hashtag',
            'label' => get_string('contextcopyshortuserid', 'local_groupimport'),
        ],
        'group-search-members' => [
            'contexts' => 'group',
            'icon' => 'fa-search',
            'label' => get_string('searchparticipantslabel', 'local_groupimport'),
        ],
        'group-paste-emails' => [
            'contexts' => 'group',
            'icon' => 'fa-envelope-open-text',
            'label' => get_string('contextaddbyidentifiers', 'local_groupimport'),
        ],
        'group-add-copied-users' => [
            'contexts' => 'group',
            'icon' => 'fa-clipboard-check',
            'label' => get_string('contextaddcopiedparticipants', 'local_groupimport'),
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
            'label' => get_string('contextcopyshortgroupname', 'local_groupimport'),
            'multilabel' => get_string('contextcopyshortgroupnames', 'local_groupimport'),
        ],
        'copy-group-id' => [
            'contexts' => 'group',
            'icon' => 'fa-hashtag',
            'label' => get_string('contextcopyshortgroupid', 'local_groupimport'),
            'multilabel' => get_string('contextcopyshortgroupids', 'local_groupimport'),
        ],
        'grouping-paste-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-layer-group',
            'label' => get_string('contextaddbygroupnames', 'local_groupimport'),
        ],
        'grouping-add-copied-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-clipboard-check',
            'label' => get_string('contextaddcopiedgroupsshort', 'local_groupimport'),
        ],
        'grouping-search-groups' => [
            'contexts' => 'grouping',
            'icon' => 'fa-search',
            'label' => get_string('searchgroupslabel', 'local_groupimport'),
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
        'grouping-open-advanced-settings' => [
            'contexts' => 'grouping',
            'icon' => 'fa-cog',
            'label' => get_string('advancedsettings', 'local_groupimport'),
        ],
        'copy-grouping-name' => [
            'contexts' => 'grouping',
            'icon' => 'fa-copy',
            'label' => get_string('contextcopyshortgroupingname', 'local_groupimport'),
        ],
        'copy-grouping-id' => [
            'contexts' => 'grouping',
            'icon' => 'fa-hashtag',
            'label' => get_string('contextcopyshortgroupingid', 'local_groupimport'),
        ],
        'member-move-selected' => [
            'contexts' => 'member',
            'icon' => 'fa-arrow-right',
            'label' => get_string('contextmovemember', 'local_groupimport'),
            'multilabel' => get_string('contextmoveselectedmembers', 'local_groupimport'),
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

    // Every key is always present so Mustache never resolves one from a parent context.
    $entry = static function (array $values = []): array {
        return array_merge(['isitem' => false, 'isseparator' => false, 'isgroup' => false], $values);
    };
    $item = static function (string $action, array $definition, string $fieldkey = ''): array {
        return [
            'action' => $action,
            'contexts' => $definition['contexts'],
            'icon' => $definition['icon'],
            'label' => $definition['label'],
            'multilabel' => $definition['multilabel'] ?? '',
            'fieldkey' => $fieldkey,
        ];
    };
    $items = static function (array $keys) use ($actions, $item): array {
        $result = [];
        foreach ($keys as $action) {
            $definition = $actions[$action];
            if (array_key_exists('enabled', $definition) && !$definition['enabled']) {
                continue;
            }
            $result[] = $item($action, $definition);
        }
        return $result;
    };
    $group = static function (
        string $key,
        string $contexts,
        string $icon,
        string $label,
        string $multilabel,
        array $children
    ) use ($entry): array {
        return $entry(['isgroup' => true, 'group' => [
            'key' => $key,
            'contexts' => $contexts,
            'icon' => $icon,
            'label' => $label,
            'multilabel' => $multilabel,
            'actions' => $children,
        ]]);
    };

    $copychildren = $items(['copy-participant-name']);
    foreach ($alloweduserfields as $fieldkey => $fieldlabel) {
        $shortlabel = $fieldkey === 'email'
            ? get_string('contextcopyshortemail', 'local_groupimport')
            : (string)$fieldlabel;
        $copychildren[] = $item('copy-participant-field', [
            'contexts' => 'participant member',
            'icon' => $fieldkey === 'email' ? 'fa-at' : 'fa-copy',
            'label' => $shortlabel,
            'multilabel' => $shortlabel,
        ], (string)$fieldkey);
    }
    $copychildren = array_merge($copychildren, $items([
        'copy-participant-id',
        'copy-group-name',
        'copy-group-id',
        'copy-grouping-name',
        'copy-grouping-id',
    ]));

    $sections = [
        $items([
            'participant-open-details',
            'group-search-members',
            'grouping-search-groups',
            'grouping-select-groups',
        ]),
        $items([
            'participant-move-selected',
            'member-move-selected',
            'group-move-selected',
            'participant-message-selected',
            'group-focus-rename',
            'grouping-focus-rename',
            'group-open-advanced-settings',
            'grouping-open-advanced-settings',
        ]),
        [
            $group(
                'add-participants',
                'group',
                'fa-user-plus',
                get_string('contextsubmenuaddparticipants', 'local_groupimport'),
                '',
                $items(['group-paste-emails', 'group-add-copied-users'])
            ),
            $group(
                'add-groups',
                'grouping',
                'fa-layer-group',
                get_string('contextsubmenuaddgroups', 'local_groupimport'),
                '',
                $items(['grouping-paste-groups', 'grouping-add-copied-groups'])
            ),
        ],
        [
            $group(
                'copy',
                'participant member group grouping',
                'fa-copy',
                get_string('contextsubmenucopy', 'local_groupimport'),
                get_string('contextsubmenucopyselection', 'local_groupimport'),
                $copychildren
            ),
            ...$items(['paste-field']),
        ],
        $items([
            'group-remove-from-grouping',
            'remove-member',
            'group-delete-selected',
        ]),
        $items(['clear-selection']),
    ];

    $result = [];
    foreach ($sections as $section) {
        if (!$section) {
            continue;
        }
        if ($result) {
            $result[] = $entry(['isseparator' => true]);
        }
        foreach ($section as $sectionentry) {
            $result[] = isset($sectionentry['action'])
                ? $entry(['isitem' => true, 'item' => $sectionentry])
                : $sectionentry;
        }
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
        html_writer::tag(
            'button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategroup', 'local_groupimport'),
            'data-easystud-hover-help' => get_string('creategroup', 'local_groupimport'),
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
        html_writer::tag(
            'button',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']),
            [
            'type' => 'submit',
            'class' => 'btn btn-outline-primary local-groupimport-easystud-icon-button',
            'aria-label' => get_string('creategrouping', 'local_groupimport'),
            'data-easystud-hover-help' => get_string('creategrouping', 'local_groupimport'),
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
    $out .= html_writer::tag(
        'button',
        html_writer::span('', 'fa fa-chevron-down', ['aria-hidden' => 'true']) .
            html_writer::span(s($grouping['name']), 'local-groupimport-easystud-grouping__name'),
        [
            'type' => 'button',
            'class' => 'local-groupimport-easystud-tree__toggle',
            'data-easystud-collapse-toggle' => '1',
            'aria-expanded' => 'true',
        ]
    );
    $out .= html_writer::tag(
        'button',
        html_writer::span('', 'fa fa-layer-group', ['aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
            'data-easystud-toggle-grouping-groups' => $grouping['id'],
            'aria-label' => get_string('addgroupstogrouping', 'local_groupimport'),
            'data-easystud-hover-help' => get_string('addgroupstogrouping', 'local_groupimport'),
        ]
    );
    $out .= html_writer::span(
        html_writer::span('', 'fa fa-layer-group', ['aria-hidden' => 'true']) .
            html_writer::span((string)(int)$grouping['groupcount'], '', ['data-easystud-count-value' => '1']),
        'badge local-groupimport-easystud-count-badge local-groupimport-easystud-count-badge--grouping ' .
            'local-groupimport-easystud-count-badge--' . ((int)$grouping['groupcount'] ? 'filled' : 'empty'),
        [
            'data-count-template' => local_groupimport_count_template('groupscount'),
            'aria-label' => local_groupimport_count_string('groupscount', (int)$grouping['groupcount']),
            'data-easystud-hover-help' => local_groupimport_count_string('groupscount', (int)$grouping['groupcount']),
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
        html_writer::tag(
            'button',
            html_writer::span('', 'fa fa-plus easyedu-inline-icon--leading', ['aria-hidden' => 'true']) .
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
    $out .= html_writer::tag(
        'div',
        html_writer::span('', 'fa fa-users local-groupimport-easystud-drag-indicator', ['aria-hidden' => 'true']) .
            html_writer::span(s($group['name']), 'local-groupimport-easystud-group__name') .
            html_writer::span(
                html_writer::span('', 'fa fa-users', ['aria-hidden' => 'true']) .
                    html_writer::span((string)(int)$group['membercount'], '', ['data-easystud-count-value' => '1']),
                'badge local-groupimport-easystud-count-badge local-groupimport-easystud-count-badge--members ' .
                    'local-groupimport-easystud-count-badge--' . ((int)$group['membercount'] ? 'filled' : 'empty'),
                [
                    'aria-label' => local_groupimport_count_string('memberscount', (int)$group['membercount']),
                    'data-easystud-hover-help' => local_groupimport_count_string('memberscount', (int)$group['membercount']),
                ]
            ) .
            html_writer::tag(
                'button',
                html_writer::span('', 'fa fa-at', ['aria-hidden' => 'true']),
                [
                    'type' => 'button',
                    'class' => 'btn btn-link p-0 local-groupimport-easystud-group__mail-button',
                    'data-easystud-toggle-group-email' => $group['id'],
                    'aria-label' => get_string('addemailstogroup', 'local_groupimport'),
                    'data-easystud-hover-help' => get_string('addemailstogroup', 'local_groupimport'),
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
            $out .= local_groupimport_render_group_member($group['id'], $users[$userid], $group['name']);
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
 * @param string $groupname Name of the source group, when available.
 * @return string
 */
function local_groupimport_render_group_member(int $groupid, array $user, string $groupname = ''): string {
    return html_writer::tag(
        'li',
        html_writer::span(s($user['fullname']), 'local-groupimport-easystud-member__name') .
        html_writer::tag(
            'button',
            html_writer::span('&minus;', '', ['aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'btn btn-link p-0 local-groupimport-easystud-member__remove easyedu-related-person-row__remove',
                'data-easystud-remove-member' => '1',
                'data-group-id' => $groupid,
                'data-user-id' => $user['id'],
                'aria-label' => get_string('removemembernamedgroup', 'local_groupimport', (object)[
                    'member' => $user['fullname'], 'group' => $groupname !== '' ? $groupname : (string)$groupid,
                ]),
                'data-easystud-hover-help' => get_string('contextremovemember', 'local_groupimport'),
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
        html_writer::tag(
            'button',
            html_writer::span('', 'fa fa-plus easyedu-inline-icon--leading', ['aria-hidden' => 'true']) .
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
        html_writer::tag(
            'button',
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
        html_writer::tag(
            'button',
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
        $out .= html_writer::tag(
            'button',
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
