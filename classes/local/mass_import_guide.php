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

namespace local_groupimport\local;

/**
 * Guide of the Mass Import page: ten lessons, built directly (GMI-C1, text only).
 *
 * Same shell and same engine as the Student Management Guide, without its historical
 * four-pass curriculum pipeline. Specimens, demonstrations and the guided path come in
 * later lots; this class owns the stable slide identifiers and the page configuration.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class mass_import_guide {
    /** Stable presentation key: reading positions are only migrated when it changes. */
    public const PRESENTATION_KEY = 'mass-import-20261018';

    /** Stable identifier of the guided path (its progress is stored under this name). */
    public const PATH_ID = 'mi-review-without-importing';

    /**
     * Stable identifiers of the ten lessons, in reading order.
     *
     * @return string[]
     */
    public static function slide_ids(): array {
        return ['use-this-guide', 'mi-overview', 'mi-prepare-file', 'mi-drop-preview', 'mi-review-preview',
            'mi-reimport-strategy', 'mi-run-import', 'mi-read-report', 'mi-history-restore', 'mi-ready'];
    }

    /**
     * Lesson definitions: icon, string prefix, three explanations and the optional interface target.
     *
     * @return array[] Indexed by slide identifier (lesson 1 and 10 are described in template_data).
     */
    private static function definitions(): array {
        return [
            'mi-overview' => ['icon' => 'fa-sitemap', 'prefix' => 'overview', 'target' => 'miUploadCard'],
            'mi-prepare-file' => ['icon' => 'fa-file-excel', 'prefix' => 'file', 'target' => 'miTemplateLink'],
            'mi-drop-preview' => ['icon' => 'fa-upload', 'prefix' => 'drop', 'target' => 'miDepositZone'],
            'mi-review-preview' => ['icon' => 'fa-table', 'prefix' => 'preview', 'target' => 'miPreviewTable'],
            'mi-reimport-strategy' => ['icon' => 'fa-sliders', 'prefix' => 'strategy', 'target' => 'miStrategy'],
            'mi-run-import' => ['icon' => 'fa-check', 'prefix' => 'run', 'target' => 'miRunImport'],
            'mi-read-report' => ['icon' => 'fa-clipboard-list', 'prefix' => 'report', 'target' => 'miResultsCard'],
            'mi-history-restore' => ['icon' => 'fa-history', 'prefix' => 'history', 'target' => 'miHistoryOpen'],
        ];
    }

    /**
     * Three-explanation block shared by every lesson (dl/dt/dd reading composition).
     *
     * @param string $prefix Lesson string prefix.
     * @param string $note Note text.
     * @return array
     */
    private static function explanations(string $prefix, string $note): array {
        $topics = [];
        foreach ([1, 2, 3] as $n) {
            $topics[] = ['icon' => 'fa-info-circle',
                'title' => get_string('mi_guide_' . $prefix . '_t' . $n . '_title', 'local_groupimport'),
                'description' => get_string('mi_guide_' . $prefix . '_t' . $n . '_body', 'local_groupimport')];
        }
        return ['topics' => $topics, 'note' => $note, 'lessonreading' => true];
    }

    /**
     * Numbered legend (landmarks) of a lesson, for the later anatomy and specimen blocks.
     *
     * @param string $prefix Lesson string prefix.
     * @param int $count Number of landmarks.
     * @return array
     */
    private static function legend(string $prefix, int $count): array {
        $legend = [];
        for ($n = 1; $n <= $count; $n++) {
            $legend[] = ['n' => $n, 'label' => get_string('mi_guide_' . $prefix . '_' . $n, 'local_groupimport')];
        }
        return $legend;
    }

    /**
     * GMI-C3: scene of a Mass Import demonstration, "midrop" (3 phases) or "mipreview" (4 phases).
     *
     * Illustration only, played by the Guide engine with a manual start. The recap repeats the end state of
     * each phase with its narration: it is the lesson at the minimal animation level, and the summary after
     * the demonstration at the other levels. Example rows are those of the example file (guide_specimen).
     *
     * @param string $kind 'midrop' or 'mipreview'.
     * @return array Scene context of guide_mass_import_scene.mustache.
     */
    private static function demonstration(string $kind): array {
        $component = 'local_groupimport';
        $prefix = $kind === 'midrop' ? 'mi_guide_drop_' : 'mi_guide_preview_';
        $rows = guide_specimen::mass_import_preview_rows();
        $ready = get_string('importpreviewready', $component);
        $headers = [];
        foreach (['include', 'line', 'identifier', 'group', 'grouping', 'status'] as $column) {
            $headers[] = get_string('importpreview' . $column, $component);
        }
        $scene = [
            'kind' => $kind,
            'miscene' => true,
            $kind => true,
            'caption' => get_string('discovery_simulation', $component),
            'captionshort' => get_string('discovery_simulation_short', $component),
            'initiallabel' => get_string($prefix . 'initial', $component),
            'recaptitle' => get_string('guideinspection_recaptitle', $component),
            'filename' => get_string('mi_guide_example_filename', $component),
            'headers' => $headers,
        ];
        foreach (['pause', 'resume', 'nextphase', 'finished'] as $key) {
            $scene[$key . 'label'] = get_string('discovery_' . $key, $component);
        }
        $phases = $kind === 'midrop' ? 3 : 4;
        for ($n = 1; $n <= $phases; $n++) {
            $scene['phase' . $n] = get_string($prefix . 'phase' . $n, $component);
        }
        // Every recap view flag is explicit: Mustache would otherwise read a missing key from a parent context.
        $view = static fn(string $flag, string $text, string $value = ''): array => array_merge(
            array_fill_keys(['viewfile', 'viewsubmit', 'viewsummary', 'viewstatuses', 'viewexcluded', 'viewcorrected',
                'viewunchanged'], false),
            [$flag => true, 'text' => $text, 'value' => $value]
        );
        if ($kind === 'midrop') {
            $scene += [
                'phase2compact' => get_string('mi_guide_drop_phase2_compact', $component),
                'uploadtitle' => get_string('importfile', $component),
                'deposittitle' => get_string('filedeposittitle', $component),
                'depositsupport' => get_string('filedepositsupport', $component),
                'dropready' => get_string('csvdropready', $component),
                'formats' => get_string('filedepositformats', $component),
                'formatsdetail' => get_string('filedepositformatsdetail', $component),
                'previewlabel' => get_string('previewimport', $component),
                'resultstitle' => get_string('importresults', $component),
                'emptylabel' => get_string('noresults', $component),
                'rowscount' => count($rows),
                'rowslabel' => get_string('importpreviewrows', $component),
                'warningscount' => count(array_filter(array_column($rows, 'warning'))),
                'warningslabel' => get_string('importpreviewwarnings', $component),
                // The preview opens on its first three rows.
                'rows' => array_slice($rows, 0, 3),
                'recap' => [
                    $view('viewfile', $scene['phase1']),
                    $view('viewsubmit', $scene['phase2']),
                    $view('viewsummary', $scene['phase3']),
                ],
            ];
        } else {
            $typed = guide_specimen::mass_import_correction();
            $scene += [
                'typedvalue' => $typed,
                'selectpage' => get_string('selectpreviewpage', $component),
                'searchplaceholder' => get_string('previewsearchpageonly', $component),
                'rows' => $rows,
                'statusready' => $ready,
                'statusflagged' => $rows[3]['status'],
                'recap' => [
                    $view('viewstatuses', $scene['phase1']),
                    $view('viewexcluded', $scene['phase2'], $rows[3]['identifier']),
                    $view('viewcorrected', $scene['phase3'], $typed),
                    $view('viewunchanged', $scene['phase4'], $rows[4]['status']),
                ],
            ];
        }
        return $scene + guide_discovery::demonstration_entry();
    }

    /**
     * Build the shell and the ten lessons of the Guide.
     *
     * @param array $options 'allowedfields': labels of the user fields compared with the file;
     *                       'motionlevel' and 'motionpolicy': page animation level (optional).
     * @return array Template data of local_groupimport/easyedu_guide.
     */
    public static function template_data(array $options = []): array {
        $component = 'local_groupimport';
        $allowedfields = implode(', ', array_map('strval', $options['allowedfields'] ?? []));
        $ids = self::slide_ids();
        $definitions = self::definitions();
        $slides = [];

        foreach ($ids as $index => $id) {
            $slide = ['id' => $id, 'index' => $index, 'navnumber' => $index + 1, 'navcategorymanaged' => true];
            if ($id === 'use-this-guide') {
                $slide += [
                    'navicon' => 'fa-compass',
                    'icon' => 'fa-compass',
                    'category' => get_string('guideintro_category', $component),
                    'title' => get_string('guideintro_title', $component),
                    'navtitle' => get_string('guideintro_navtitle', $component),
                    'content' => \html_writer::tag('p', s(get_string('guideintro_description', $component))),
                    'commonintroduction' => guide_discovery::common_introduction(true),
                ];
            } else if ($id === 'mi-ready') {
                $slide += [
                    'navicon' => 'fa-check-circle',
                    'icon' => 'fa-check-circle',
                    'category' => get_string('guide_category_recap', $component),
                    'title' => get_string('mi_guide_ready_title', $component),
                    'navtitle' => get_string('mi_guide_nav_10', $component),
                    'content' => \html_writer::tag('p', s(get_string('mi_guide_ready_intro', $component))),
                    'commonintroduction' => self::explanations('ready', ''),
                    // Review tiles: reading positions 2, 4, 6 and 8 (slides 3, 5, 7 and 9).
                    'guidespecimen' => guide_specimen::ready(array_map(static function (array $tile) use ($component): array {
                        return ['icon' => $tile[0], 'index' => $tile[1],
                            'title' => get_string('mi_guide_ready_' . $tile[2] . '_title', $component),
                            'text' => get_string('mi_guide_ready_' . $tile[2] . '_text', $component)];
                    }, [['fa-file-excel', 2, 'file'], ['fa-table', 4, 'preview'],
                        ['fa-check', 6, 'run'], ['fa-history', 8, 'history']]), 'mi_guide_nav_'),
                ];
            } else {
                $definition = $definitions[$id];
                $prefix = $definition['prefix'];
                $note = $prefix === 'file'
                    ? get_string('mi_guide_file_note', $component, $allowedfields)
                    : get_string('mi_guide_' . $prefix . '_note', $component);
                $slide += [
                    'navicon' => $definition['icon'],
                    'icon' => $definition['icon'],
                    'category' => get_string('mi_guide_' . $prefix . '_category', $component),
                    'title' => get_string('mi_guide_' . $prefix . '_title', $component),
                    'navtitle' => get_string('mi_guide_nav_' . ($index + 1), $component),
                    'content' => \html_writer::tag('p', s(get_string('mi_guide_' . $prefix . '_intro', $component))),
                    'commonintroduction' => self::explanations($prefix, $note),
                    'target' => 'slide-' . $index,
                    'targetselector' => $definition['target'],
                ];
                if ($id === 'mi-overview') {
                    $slide['anatomy'] = guide_specimen::mass_import_anatomy('mipage', self::legend('overview', 5));
                    $slide['example'] = [
                        'title' => get_string('mi_guide_overview_exampletitle', $component),
                        'body' => get_string('mi_guide_overview_examplebody', $component),
                    ];
                } else if ($id === 'mi-prepare-file') {
                    $slide['guidespecimen'] = guide_specimen::mifile(self::legend('file', 3));
                } else if ($id === 'mi-reimport-strategy') {
                    $slide['guidespecimen'] = guide_specimen::mistrategy();
                } else if ($id === 'mi-run-import') {
                    $slide['guidespecimen'] = guide_specimen::mirun();
                } else if ($id === 'mi-read-report') {
                    $slide['guidespecimen'] = guide_specimen::mireport();
                } else if ($id === 'mi-history-restore') {
                    $slide['anatomy'] = guide_specimen::mass_import_anatomy('mihistory', self::legend('history', 5));
                }
                // GMI-C3: the two demonstrations (slides 4 and 5), each with its static recap.
                if ($id === 'mi-drop-preview' || $id === 'mi-review-preview') {
                    $slide['discoveryscene'] = self::demonstration($id === 'mi-drop-preview' ? 'midrop' : 'mipreview');
                }
            }
            $slide['navcategorylabel'] = $slide['category'];
            $slide['kicker'] = $slide['category'];
            $slide['navtooltip'] = get_string('guide_nav_tooltip', $component, (object) [
                'category' => $slide['category'], 'number' => $index + 1, 'title' => $slide['navtitle']]);
            $slides[] = $slide;
        }
        $slides = self::interface_cues($slides);

        $slidecount = count($slides);
        $data = [
            'rootclass' => 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery easyedu-guide--mass-import',
            'discoverypresentation' => true,
            'guideinterfacecuelabel' => get_string('guideinterfacecuelabel', $component),
            'guideopenlabel' => get_string('mi_guide_open', $component),
            'guidefullscreenenter' => get_string('guidefullscreenenter', $component),
            'guidefullscreenexit' => get_string('guidefullscreenexit', $component),
            'guidefullscreenunavailable' => get_string('guidefullscreenunavailable', $component),
            'guidehoverlabel' => get_string('tutorialhoverlabel', $component),
            'guidecloselabel' => get_string('closebuttontitle', 'core'),
            'guidetitle' => get_string('mi_guide_title', $component),
            'guideeyebrow' => get_string('guideeyebrow', $component),
            'guidemodaltitle' => get_string('groupimport', $component),
            'guidesubtitle' => get_string('tutorialintro', $component),
            'guidepreviouslabel' => get_string('tutorialprevious', $component),
            'guidenextlabel' => get_string('tutorialnext', $component),
            'guidenavigationlabel' => get_string('mi_guide_title', $component),
            'guideprogresslabel' => get_string('tutorialprogresslabel', $component),
            'guidebadgelabel' => get_string('guidebadgelabel', $component),
            'guideguidedpathlabel' => get_string('tutorialguidedpaneltitle', $component),
            'guiderequiresbadge' => get_string('guiderequiresbadge', $component),
            'guideshowinterfacelabel' => get_string('tutorialshowinview', $component),
            'guidestartpathlabel' => get_string('tutorialguidedstart', $component),
            'guidereturnlabel' => get_string('tutorialreturntitle', $component),
            'guidereturndesc' => get_string('tutorialreturndesc', $component),
            'guidereturnbutton' => get_string('tutorialreturnbutton', $component),
            'guidereturndismiss' => get_string('tutorialreturndismiss', $component),
            'guidechecklisttitle' => get_string('tutorialguidedpaneltitle', $component),
            'guideminimizelabel' => get_string('tutorialguidedpanelminimize', $component),
            'guiderestorelabel' => get_string('discovery_restore', $component),
            'guideresumetitle' => get_string('discovery_resume_title', $component),
            'guideresumelabel' => get_string('guideresumepath', $component),
            'guideresumeguidedlabel' => get_string('guideresumeguidedpath', $component),
            'guidecancelpathlabel' => get_string('discovery_cancel_path', $component),
            'guideresetpathlabel' => get_string('discovery_reset_path', $component),
            'guidechecklisthint' => get_string('tutorialguidedpanelhint', $component),
            'guidechecklistdonelabel' => get_string('tutorialguidedpanelcomplete', $component),
            'guidechecklistreturnlabel' => get_string('tutorialguidedpanelreturn', $component),
            'guidechecklistendclose' => get_string('tutorialguidedpanelendclose', $component),
            'guidechecklistrestartlabel' => get_string('tutorialguidedpanelrestart', $component),
            'guidesteplabel' => get_string('tutorialstepof', $component, (object) [
                'current' => '__current__',
                'total' => '__total__',
            ]),
            'slides' => $slides,
            'slidecount' => $slidecount,
            'initialprogress' => 100 / $slidecount,
        ];
        if (isset($options['motionlevel'])) {
            $data['motionlevel'] = $options['motionlevel'];
            $data['motionpolicy'] = $options['motionpolicy'] ?? 'enabled';
        }
        return $data;
    }

    /**
     * Guide engine configuration; kept out of Moodle's inline AMD arguments by the page.
     *
     * Interface targets, guided paths and their labels are completed in GMI-C4.
     *
     * @param int $courseid Course id.
     * @param int $userid Current user id (reading progress belongs to the person).
     * @return array
     */
    public static function js_config(int $courseid, int $userid): array {
        $component = 'local_groupimport';
        return [
            'presentationKey' => self::PRESENTATION_KEY,
            'slideIds' => self::slide_ids(),
            'storageKey' => 'local_groupimport.mi_guide.u' . $userid . '.c' . $courseid,
            'firstVisit' => false,
            'fullscreen' => true,
            'welcomeOffer' => false,
            'highlightAutoHideDelay' => 5200,
            'highlightStyle' => 'pulse-blue',
            // Interface targets of the cahier (section 1.14): the first visible selector wins, so a
            // preview-only target falls back to the results card on an empty page.
            'targets' => [
                'miUploadCard' => '.local-groupimport-import-card--upload',
                'miUploadToggle' => '[data-local-groupimport-upload-toggle]',
                'miAutoDetect' => '.local-groupimport-import-fields',
                'miDepositZone' => '#local_groupimport-form .easyedu-file-deposit',
                'miPreviewSubmit' => ['#local_groupimport-form #id_submitbutton', '#local_groupimport-form [type="submit"]'],
                'miResultsCard' => '#local_groupimport-results',
                'miPreviewTable' => ['.local-groupimport-import-preview__table-wrap', '#local_groupimport-results'],
                'miFlaggedRowInclude' => [
                    '.local-groupimport-import-preview__row--warning:not([hidden]) input[name^="rowenabled["]',
                    '[data-local-groupimport-preview-row]:not([hidden]) input[name^="rowenabled["]',
                ],
                'miStrategy' => ['.local-groupimport-import-preview__strategy', '#local_groupimport-results'],
                'miRunImport' => ['[data-local-groupimport-preview-submit]', '#local_groupimport-results'],
                'miPreviewCancel' => '[data-local-groupimport-preview-cancel]',
                // GMI-C4-FINITIONS (K18-25): avoidance-only companion for 'cancel-preview' (see
                // avoidCompanion in review_path()), so the checklist zone also covers the warning
                // above Cancel without changing what gets highlighted or what completes the step.
                'miGuidePathWarning' => '[data-local-groupimport-guide-path-warning]',
                'miJobProgress' => '[data-import-job]',
                'miExportReport' => '.local-groupimport-import__export-results',
                'miTemplateLink' => '#local-groupimport-import-navigation ' .
                    '[data-easyedu-navigation-item-id="mass-import-download-template"]',
                'miHistoryOpen' => '#local-groupimport-import-navigation ' .
                    '[data-easyedu-navigation-action="mass-import-history"]',
                'miHistoryList' => '[data-local-groupimport-history-modal] [data-local-groupimport-history-list]',
                'miNavigationTrigger' => '#local-groupimport-import-navigation [data-easyedu-navigation-open]',
            ],
            'pathLabels' => [self::PATH_ID => get_string('mi_guide_path_title', $component)],
            'pathContextFields' => new \stdClass(),
            'paths' => [self::PATH_ID => self::review_path()],
            'labels' => [
                'hint' => get_string('tutorialguidedpanelhint', $component),
                'complete' => get_string('tutorialguidedpanelcomplete', $component),
                'completeTitle' => get_string('tutorialguidedpanelcompletetitle', $component),
                'guidedPath' => get_string('tutorialguidedpaneltitle', $component),
                'guidedPathSeparator' => get_string('tutorialguidedpanelseparator', $component),
                'completedSteps' => get_string('tutorialguidedpanelcompletedsteps', $component),
                'visited' => get_string('visited', $component),
                'stepCompleted' => get_string('completed'),
                'stepLocked' => get_string('locked', 'grades'),
                'completeStepFirst' => get_string('guidesteplocked', $component),
                'pathReset' => get_string('discovery_path_reset_feedback', $component),
                'pathCancelled' => get_string('discovery_path_cancelled_feedback', $component),
            ],
        ];
    }
    /**
     * Interface cues of the lessons (GMI-C4): openers run before "Show in the interface", and the
     * guided path card of lesson 5 with the warning decided by Kevin (K18-07).
     *
     * @param array[] $slides Lessons built by template_data().
     * @return array[]
     */
    private static function interface_cues(array $slides): array {
        $component = 'local_groupimport';
        foreach ($slides as $index => $slide) {
            if ($slide['id'] === 'mi-prepare-file') {
                // Compact: the template link lives in the navigation drawer.
                $slides[$index] += ['showopen' => 'mi:open-navigation', 'showopendelay' => 360];
            } else if ($slide['id'] === 'mi-drop-preview') {
                // After a preview the file column is folded: unfold it first.
                $slides[$index] += ['showopen' => 'mi:expand-upload', 'showopendelay' => 480];
            } else if ($slide['id'] === 'mi-history-restore') {
                $slides[$index]['targetselector'] = 'miHistoryList';
                $slides[$index] += ['showopen' => 'mi:open-history', 'showopendelay' => 420];
            } else if ($slide['id'] === 'mi-review-preview') {
                $slides[$index] += [
                    'hasguidedpath' => true,
                    'guidedpath' => self::PATH_ID,
                    'guidedpathlabel' => get_string('member_path_label', $component),
                    'guidedpathtitle' => get_string('mi_guide_path_title', $component),
                    'guidedpathcontent' => get_string('mi_guide_path_content', $component),
                    'guidedpathsteps' => ['items' => array_column(self::review_path(), 'title')],
                    'guidedpathwarning' => get_string('mi_guide_path_warning', $component),
                ];
                $slides[$index]['navtooltip'] = get_string('guide_nav_tooltip_guided', $component, (object) [
                    'category' => $slide['category'], 'number' => $index + 1, 'title' => $slide['navtitle']]);
            }
        }
        return $slides;
    }

    /**
     * Guided path "Check a file without importing anything" (cahier section 1.15).
     *
     * No step changes the course: the path ends on Cancel and never targets "Run import".
     * Steps 2, 3 and 4 are completed by the Mass Import adapter (local/mi/guide).
     *
     * @return array[]
     */
    public static function review_path(): array {
        $component = 'local_groupimport';
        $steps = [
            ['id' => 'download-example', 'target' => 'miTemplateLink', 'open' => 'mi:open-navigation',
                'openDelay' => 360, 'completeOnClick' => true],
            ['id' => 'add-file', 'target' => 'miDepositZone', 'open' => 'mi:expand-upload', 'openDelay' => 480,
                'completionMode' => 'event'],
            // On the reloaded preview page this milestone is completed by Resume: never unfold the column.
            ['id' => 'preview-file', 'target' => 'miPreviewSubmit', 'open' => 'mi:close-navigation',
                'completionMode' => 'event'],
            ['id' => 'exclude-row', 'target' => 'miFlaggedRowInclude', 'open' => 'mi:close-navigation',
                'completionMode' => 'event'],
            ['id' => 'read-strategy', 'target' => 'miStrategy', 'open' => 'mi:close-navigation'],
            // GMI-C4-FINITIONS (K18-25): avoidCompanion only widens the checklist's avoidance zone
            // (the warning sits right above Cancel); it never changes the highlight or the click target.
            ['id' => 'cancel-preview', 'target' => 'miPreviewCancel', 'avoidCompanion' => 'miGuidePathWarning',
                'open' => 'mi:close-navigation', 'completeOnClick' => true],
        ];
        $path = [];
        foreach ($steps as $index => $step) {
            $step['title'] = get_string(sprintf('mi_guide_path_step%d', $index + 1), $component);
            $step['description'] = get_string(sprintf('mi_guide_path_desc%d', $index + 1), $component);
            if ($index > 0) {
                $step['requiresStep'] = $steps[$index - 1]['id'];
            }
            if ($index < count($steps) - 1) {
                // The next target is highlighted as soon as a step is done (no extra click).
                $step['autoHighlightNext'] = true;
            }
            $path[] = $step;
        }
        return $path;
    }
}
