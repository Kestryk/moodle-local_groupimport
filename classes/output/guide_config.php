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

namespace local_groupimport\output;

defined('MOODLE_INTERNAL') || die();

/**
 * Builds the shared EasyEdu guide's template data and AMD configuration.
 *
 * Extracted from manage.php (I3, 2026-10-21): two function bodies moved verbatim
 * (local_groupimport_build_easyedu_guide_template_data and
 * local_groupimport_build_easyedu_guide_js_config) into one dedicated class.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class guide_config {

    /**
     * Build the shared EasyEdu guide template data from the existing EasyStud tutorial data.
     *
     * @param array $templatedata EasyStud page template data.
     * @return array
     */
    public static function build_template_data(array $templatedata): array {
        $slides = [];
        foreach ($templatedata['tutorialsteps'] as $index => $step) {
            $slide = [
                'id' => 'reference-' . $index,
                'index' => $index,
                'navicon' => $step['icon'],
                'icon' => $step['icon'],
                'category' => $step['category'] ?? '',
                'title' => $step['title'],
                'content' => \html_writer::tag('p', s($step['content'])),
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
                $slide['content'] = \html_writer::tag('p', s(get_string('guideintro_description', 'local_groupimport')));
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
    public static function build_js_config(int $courseid): array {
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
}
