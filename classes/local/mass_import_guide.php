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
                    // Review tiles (lesson indexes 2, 4, 6, 8): rendered by the parametrised
                    // ready() specimen of lot GMI-C2.
                    'readytiles' => array_map(static function (array $tile) use ($component): array {
                        return ['icon' => $tile[0], 'review' => $tile[1],
                            'title' => get_string('mi_guide_ready_' . $tile[2] . '_title', $component),
                            'text' => get_string('mi_guide_ready_' . $tile[2] . '_text', $component)];
                    }, [['fa-file-excel', 2, 'file'], ['fa-table', 4, 'preview'],
                        ['fa-check', 6, 'run'], ['fa-history', 8, 'history']]),
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
                    $slide['legend'] = self::legend('overview', 5);
                    $slide['example'] = [
                        'title' => get_string('mi_guide_overview_exampletitle', $component),
                        'body' => get_string('mi_guide_overview_examplebody', $component),
                    ];
                } else if ($id === 'mi-prepare-file') {
                    $slide['legend'] = self::legend('file', 3);
                    $slide['specimenlabel'] = get_string('mi_guide_file_label', $component);
                } else if ($id === 'mi-read-report') {
                    $slide['specimenlabel'] = get_string('mi_guide_report_label', $component);
                } else if ($id === 'mi-history-restore') {
                    $slide['legend'] = self::legend('history', 5);
                }
            }
            $slide['navcategorylabel'] = $slide['category'];
            $slide['kicker'] = $slide['category'];
            $slide['navtooltip'] = get_string('guide_nav_tooltip', $component, (object) [
                'category' => $slide['category'], 'number' => $index + 1, 'title' => $slide['navtitle']]);
            $slides[] = $slide;
        }

        $slidecount = count($slides);
        $data = [
            'rootclass' => 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
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
            'targets' => [
                'miUploadCard' => '.local-groupimport-import-card--upload',
                'miDepositZone' => '#local_groupimport-form .easyedu-file-deposit',
                'miResultsCard' => '#local_groupimport-results',
                'miPreviewTable' => ['.local-groupimport-import-preview__table-wrap', '#local_groupimport-results'],
                'miStrategy' => ['.local-groupimport-import-preview__strategy', '#local_groupimport-results'],
                'miRunImport' => ['[data-local-groupimport-preview-submit]', '#local_groupimport-results'],
                'miTemplateLink' => '#local-groupimport-import-navigation ' .
                    '[data-easyedu-navigation-item-id="mass-import-download-template"]',
                'miHistoryOpen' => '#local-groupimport-import-navigation ' .
                    '[data-easyedu-navigation-action="mass-import-history"]',
            ],
            'pathLabels' => new \stdClass(),
            'pathContextFields' => new \stdClass(),
            'paths' => new \stdClass(),
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
}
