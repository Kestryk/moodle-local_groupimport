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
 * Local Group Import plugin main page.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php'); // Fonctions groups_*.

use local_groupimport\form\import_form;

require_once(__DIR__ . '/importlib.php');

// Try to retrieve the course id via GET or POST.
$id = optional_param('id', 0, PARAM_INT);
if (!$id) {
    throw new moodle_exception('missingparam', 'error', '', 'id');
}

$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);

// Only users who can manage groups may use this tool.
require_capability('moodle/course:managegroups', $context);

$PAGE->set_url(new moodle_url('/local/groupimport/index.php', ['id' => $course->id]));
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_pagelayout('incourse');
$PAGE->set_title(get_string('groupimport', 'local_groupimport'));
$PAGE->set_heading(format_string($course->fullname));
// Animation level (user choice, else administrator default): root attributes and body classes.
$motionlevel = \local_groupimport\local\motion::apply_to_page($PAGE);
$PAGE->requires->css('/local/groupimport/styles/mass-import.css');
// The Guide rules are a separate sheet, requested on this page only (GMI-C1, Kevin 18/10).
$PAGE->requires->css('/local/groupimport/styles/guide.css');
$PAGE->requires->js('/local/groupimport/js/loading_state_bootstrap.js', true);
$PAGE->requires->js_call_amd('local_groupimport/easyedu_navigation', 'init', [
    '#local-groupimport-import-navigation',
]);
$PAGE->requires->js_call_amd('local_groupimport/guide_bootstrap', 'init', ['mass-import-guide-config']);
// Mass Import Guide adapter: compact launcher, interface openers and guided path milestones (GMI-C4).
$PAGE->requires->js_call_amd('local_groupimport/local/mi/guide', 'init', ['local-groupimport-import']);
$PAGE->requires->js_call_amd('local_groupimport/csv_import', 'init', [
    'local-groupimport-import',
    [
        'dropready' => get_string('csvdropready', 'local_groupimport'),
        'dropsubtitle' => get_string('csvdropsubtitle', 'local_groupimport'),
    ],
]);

$maximportbytes = \local_groupimport\local\import_reader::max_bytes(
    get_max_upload_file_size($CFG->maxbytes, $course->maxbytes ?? 0)
);
$mform = new import_form(null, ['courseid' => $course->id, 'maxbytes' => $maximportbytes]);
$allowedimportfields = local_groupimport_get_allowed_import_userfields();

$success = [];
$errors = [];
$preview = null;
$currenthistoryid = 0;
$backgroundjobid = optional_param('jobid', 0, PARAM_INT);

$rollbackhistoryid = optional_param('rollbackhistoryid', 0, PARAM_INT);
// Rollback rewrites course memberships: accept it only from the POST confirmation form, never from a link.
if ($rollbackhistoryid && data_submitted()) {
    global $USER, $DB;

    require_sesskey();
    $history = $DB->get_record('local_groupimport_history', [
        'id' => $rollbackhistoryid,
        'courseid' => $course->id,
    ], '*', MUST_EXIST);

    try {
        $rollback = local_groupimport_rollback_import($history, (int)$USER->id);
        $success[] = get_string('importrollbacksuccess', 'local_groupimport', $rollback);
    } catch (moodle_exception $exception) {
        $errors[] = $exception->getMessage();
    }
}

$confirmimport = optional_param('confirmimport', 0, PARAM_BOOL);

// Applying an import writes enrolment data: accept it only from the POST preview form.
if ($confirmimport && data_submitted()) {
    global $USER;

    require_sesskey();

    $previewtoken = optional_param('previewtoken', '', PARAM_ALPHANUM);
    $replacepolicy = optional_param('replacepolicy', 'keep', PARAM_ALPHA);
    if (!in_array($replacepolicy, ['keep', 'replace'], true)) {
        $replacepolicy = 'keep';
    }

    $confirmedrows = [];
    try {
        $savedpreview = \local_groupimport\local\import_preview::save_page(
            (int)$course->id,
            $previewtoken,
            optional_param('previewpayload', '', PARAM_RAW),
            [
                'complete' => optional_param('previewcomplete', 0, PARAM_INT),
                'enabled' => optional_param_array('rowenabled', [], PARAM_INT),
                'identifier' => optional_param_array('identifier', [], PARAM_RAW_TRIMMED),
                'groupname' => optional_param_array('groupname', [], PARAM_RAW_TRIMMED),
                'groupingname' => optional_param_array('groupingname', [], PARAM_RAW_TRIMMED),
            ],
            optional_param('previewpage', -1, PARAM_INT)
        );
        $confirmedrows = \local_groupimport\local\import_preview::selected_rows($savedpreview);
        $importfilename = $savedpreview['filename'];
        $importhash = $savedpreview['filehash'];
    } catch (moodle_exception $exception) {
        $errors[] = $exception->getMessage();
    }

    if (optional_param('previewpage', -1, PARAM_INT) >= 0 && empty($errors)) {
        $preview = $savedpreview;
    } else if (empty($confirmedrows) && empty($errors)) {
        $errors[] = get_string('importnorowsselected', 'local_groupimport');
    } else if (!empty($confirmedrows) && empty($errors)) {
        try {
            if (count($confirmedrows) > \local_groupimport\local\import_execution::MAX_ROWS) {
                $backgroundjobid = \local_groupimport\local\import_job::queue(
                    $confirmedrows,
                    $course,
                    (int)$USER->id,
                    $importfilename,
                    $importhash,
                    $replacepolicy
                );
            } else {
                $currenthistoryid = \local_groupimport\local\import_execution::run(
                    $confirmedrows,
                    static function () use (
                        $confirmedrows,
                        $course,
                        $context,
                        &$success,
                        &$errors,
                        $replacepolicy,
                        $USER,
                        $importfilename,
                        $importhash
                    ): int {
                        $changes = local_groupimport_process_import_rows(
                            $confirmedrows,
                            $course,
                            $context,
                            $success,
                            $errors,
                            $replacepolicy
                        );
                        return local_groupimport_record_import_history(
                            (int)$course->id,
                            (int)$USER->id,
                            $importfilename !== '' ? $importfilename : get_string('unknownfile', 'local_groupimport'),
                            $importhash,
                            count($confirmedrows),
                            count($success),
                            count($errors),
                            $replacepolicy,
                            $changes
                        );
                    }
                );
            }
            \local_groupimport\local\import_preview::consume($previewtoken);
            if ($backgroundjobid) {
                redirect(new moodle_url('/local/groupimport/index.php', ['id' => $course->id, 'jobid' => $backgroundjobid]));
            }
        } catch (Throwable $exception) {
            $success = [];
            $currenthistoryid = 0;
            $errors = [$exception instanceof moodle_exception && $exception->errorcode === 'importrowlimit'
                ? $exception->getMessage() : get_string('importatomicfailed', 'local_groupimport')];
        }
    }
} else if ($mform->is_cancelled()) {
    redirect(course_get_url($course));
} else if ($data = $mform->get_data()) {
    // Retrieve uploaded file content.
    $content = $mform->get_file_content('importfile');
    $filename = $mform->get_new_filename('importfile');
    if (empty($filename)) {
        $filename = 'import.csv';
    }

    // Global BOM cleanup at the beginning of the file (if present).
    if (is_string($content) && substr($content, 0, 3) === "\xEF\xBB\xBF") {
        $content = substr($content, 3);
    }

    if ($content === false || $content === null || $content === '') {
        $errors[] = get_string('csvloaderror', 'local_groupimport', get_string('csvemptyfiledetail', 'local_groupimport'));
    } else if (strlen($content) > $maximportbytes) {
        $errors[] = get_string('importeffectivefilelimit', 'local_groupimport', display_size($maximportbytes));
    } else {
        $filehash = hash('sha256', $content);
        $parsed = local_groupimport_parse_import_content($content, $filename, $errors);
        $previewrows = local_groupimport_build_preview_rows($parsed, $errors);

        if (count($previewrows) > \local_groupimport\local\import_job::max_rows()) {
            $errors[] = get_string(
                'importrowlimit',
                'local_groupimport',
                \local_groupimport\local\import_job::max_rows()
            );
        } else if (!empty($previewrows)) {
            $preview = [
                'filename' => $filename,
                'filehash' => $filehash,
                'previousimport' => local_groupimport_get_matching_import_history((int)$course->id, $filehash),
                'rows' => $previewrows,
                'messages' => local_groupimport_validate_preview_rows($previewrows, $context),
            ];
            $preview['token'] = \local_groupimport\local\import_preview::store(
                (int)$course->id,
                $preview,
                \local_groupimport\local\import_job::max_rows()
            );
        } else if (empty($errors)) {
            $errors[] = get_string('importnorowsdetected', 'local_groupimport');
        }
    }
}

$mform = new import_form(null, [
    'maxbytes' => $maximportbytes,
    'courseid' => $course->id,
    'submitlabel' => $preview !== null
        ? get_string('replacefile', 'local_groupimport')
        : get_string('previewimport', 'local_groupimport'),
]);
$historyrecords = local_groupimport_get_import_history((int)$course->id);

// Output.
echo $OUTPUT->header();

// Keep the Guide configuration out of Moodle's inline AMD call arguments (K16-21).
// Hex escaping prevents translations from terminating this JSON element.
echo html_writer::tag('script', json_encode([
    'guide' => [
        '[data-easyedu-guide-root]',
        \local_groupimport\local\mass_import_guide::js_config((int)$course->id, (int)$USER->id),
    ],
], JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR), [
    'type' => 'application/json',
    'id' => 'mass-import-guide-config',
]);

// The shared navigation replaces the legacy Mass Import action row only. The
// Skeleton lifecycle, its root attributes and real-content wrapper stay owned
// by the loading implementation.
$navigationdata = local_groupimport_build_mass_import_navigation_context($course);
// The Guide launcher sits first in the navigation (compass only, no welcome bubble: Kevin 18/10, Q4).
$navigationdata['hasguide'] = true;
$navigationdata['guidehtml'] = $OUTPUT->render_from_template(
    'local_groupimport/easyedu_guide',
    \local_groupimport\local\mass_import_guide::template_data([
        'allowedfields' => array_values($allowedimportfields),
        'motionlevel' => $motionlevel,
        'motionpolicy' => $motionlevel === 'minimal' ? 'disabled' : 'enabled',
    ])
);
$themestyle = local_groupimport_get_theme_style();
$themerailroles = local_groupimport_get_theme_rail_roles();
$navigationmarkup = html_writer::tag(
    'div',
    $OUTPUT->render_from_template('local_groupimport/easyedu_navigation', $navigationdata),
    [
        'class' => 'local-groupimport-import-navigation local-groupimport-easystud local-groupimport-easystud__navigation',
        'data-region' => 'local-groupimport-import-navigation',
        'style' => $themestyle,
    ]
);

// Main container.
echo html_writer::start_div('local-groupimport-import easyedu-ui' . ($preview !== null ? ' has-preview is-upload-collapsed' : '') .
        ($motionlevel === 'minimal' ? ' is-easyedu-motion-off' : ''), [
    'id' => 'local-groupimport-import',
    'data-region' => 'local-groupimport-import',
    'data-easyedu-motion-level' => $motionlevel,
    'data-easyedu-motion-policy' => $motionlevel === 'minimal' ? 'disabled' : 'enabled',
    'data-easystud-loading-state' => 'loading',
    'data-easyedu-loading-bootstrap' => '1',
    'data-easyedu-loading-ready-attribute' => 'data-easyedu-loading-ready',
    'data-easyedu-loading-recover-late-ready' => '1',
    'data-easyedu-action-busy-label' => get_string('actioninprogress', 'local_groupimport'),
    'data-easyedu-custom-rails' => $themerailroles,
    'data-easyedu-dialog-palette' => $themerailroles,
    'data-easyedu-report-palette' => $themerailroles,
    'style' => $themestyle,
        ]);

echo html_writer::start_div('local-groupimport-import__loading-skeleton', [
    'data-easystud-loading-skeleton' => '1',
    'data-easyedu-navigation-skeleton' => '1',
    'aria-hidden' => 'true',
]);
echo html_writer::start_div('local-groupimport-import__loading-header');
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
    'local-groupimport-import__loading-eyebrow']);
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-title']);
echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-intro']);
echo html_writer::end_div();
echo html_writer::start_div('local-groupimport-import__loading-navigation', [
    'aria-hidden' => 'true',
]);
echo html_writer::tag(
    'div',
    html_writer::tag('span', '', [
        'class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-navigation-guide',
    ]) .
    html_writer::tag(
        'div',
        html_writer::tag('span', '', [
            'class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-navigation-cue',
        ]),
        ['class' => 'local-groupimport-import__loading-navigation-cues']
    ),
    ['class' => 'local-groupimport-import__loading-navigation-frame']
);
echo html_writer::end_div();
echo html_writer::start_div('local-groupimport-import__loading-grid');
for ($skeletoncard = 0; $skeletoncard < 2; $skeletoncard++) {
    echo html_writer::start_div('local-groupimport-import__loading-card');
    echo html_writer::tag(
        'div',
        html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
            'local-groupimport-import__loading-icon']) .
        html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
            'local-groupimport-import__loading-card-title']),
        ['class' => 'local-groupimport-import__loading-card-header']
    );
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
        'local-groupimport-import__loading-field']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
        'local-groupimport-import__loading-field local-groupimport-import__loading-field--short']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
        'local-groupimport-import__loading-row']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
        'local-groupimport-import__loading-row']);
    echo html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface ' .
        'local-groupimport-import__loading-button']);
    echo html_writer::end_div();
}
echo html_writer::end_div();
echo html_writer::end_div();

// Without JavaScript the classic bootstrap cannot release the loading state.
// Reveal the already server-rendered form and navigation instead of leaving a
// decorative Skeleton as the only visible Mass Import surface.
echo html_writer::tag('noscript', html_writer::tag(
    'style',
    '#local-groupimport-import[data-easystud-loading-state="loading"] > [data-easystud-loading-skeleton] { display: none ' .
        '!important; }' .
        '#local-groupimport-import[data-easystud-loading-state="loading"] > [data-easystud-real-content] { display: block ' .
            '!important; }'
));

echo html_writer::start_div('local-groupimport-import__content', [
    'data-easystud-real-content' => '1',
]);

echo html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        html_writer::span(get_string('easystudlabel', 'local_groupimport'), 'local-groupimport-import__eyebrow') .
        html_writer::tag('h2', get_string('groupimport', 'local_groupimport'), [
            'class' => 'local-groupimport-import__title easyedu-page-title',
        ]) .
        html_writer::tag('p', get_string('importfile_help', 'local_groupimport'), [
            'class' => 'local-groupimport-import__intro easyedu-body',
        ])
    ) .
    $navigationmarkup,
    ['class' => 'local-groupimport-import__header easyedu-page-header']
);

echo html_writer::start_div('local-groupimport-import__grid');

$uploadtoggle = '';
if ($preview !== null) {
    $uploadtoggle = html_writer::tag(
        'button',
        html_writer::tag('span', '', ['class' => 'fa fa-chevron-right', 'aria-hidden' => 'true']),
        [
            'type' => 'button',
            'class' => 'easyedu-button easyedu-button--icon local-groupimport-import-card__toggle',
            'data-local-groupimport-upload-toggle' => '1',
            'data-expand-label' => get_string('expanduploadpanel', 'local_groupimport'),
            'data-collapse-label' => get_string('collapseuploadpanel', 'local_groupimport'),
            'aria-expanded' => 'false',
            'aria-label' => get_string('expanduploadpanel', 'local_groupimport'),
        ]
    );
}

// Form card.
echo html_writer::start_div('local-groupimport-import-card local-groupimport-import-card--upload easyedu-panel');
echo html_writer::tag(
    'div',
    html_writer::tag('span', '', [
        'class' => 'fa fa-file-csv easyedu-icon-tile easyedu-icon-tile--compact',
        'aria-hidden' => 'true',
    ]) .
    html_writer::tag(
        'div',
        html_writer::tag('h3', get_string('importfile', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__title easyedu-panel__title',
        ]) .
        html_writer::tag('p', get_string('csvimportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description easyedu-panel__description',
        ]),
        ['class' => 'easyedu-panel__copy']
    ) .
    $uploadtoggle,
    ['class' => 'local-groupimport-import-card__header easyedu-panel__header easyedu-panel__header--compact-icon']
);

$fieldtags = [];
foreach ($allowedimportfields as $fieldlabel) {
    $fieldtags[] = html_writer::tag('span', s($fieldlabel), [
        'class' => 'local-groupimport-import-fields__tag easyedu-tag',
    ]);
}

echo html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        html_writer::tag(
            'span',
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']),
            ['class' => 'local-groupimport-import-fields__icon easyedu-icon-tile easyedu-icon-tile--small', 'aria-hidden' => 'true']
        ) .
        html_writer::tag(
            'div',
            html_writer::tag(
                'strong',
                get_string('importautodetecttitle', 'local_groupimport'),
                ['class' => 'easyedu-information__title']
            ) .
            html_writer::tag(
                'p',
                get_string('importautodetectintro', 'local_groupimport'),
                ['class' => 'easyedu-information__description']
            )
        ),
        ['class' => 'local-groupimport-import-fields__header easyedu-information__header easyedu-information__header--small-icon']
    ) .
    html_writer::tag('p', get_string('importfieldsavailable', 'local_groupimport'), [
        'class' => 'local-groupimport-import-fields__label easyedu-information__label',
    ]) .
    html_writer::tag('div', implode("\n", $fieldtags), ['class' => 'local-groupimport-import-fields__tags easyedu-tag-list']),
    ['class' => 'local-groupimport-import-fields easyedu-information easyedu-information--deposit-aligned']
);

// Moodle form (with filepicker).
echo html_writer::start_div('local-groupimport-import-form easyedu-form--deposit', [
    'id' => 'local_groupimport-form',
    'data-local-groupimport-import-form' => '1',
]);
$mform->display();
echo html_writer::end_div();

echo html_writer::end_div(); // Card.

// Results card.
echo html_writer::start_div(
    'local-groupimport-import-card local-groupimport-import-card--results easyedu-panel easyedu-panel--success',
    ['id' => 'local_groupimport-results']
);
echo html_writer::tag(
    'div',
    html_writer::tag('span', '', [
        'class' => 'fa fa-clipboard-check easyedu-icon-tile easyedu-icon-tile--compact easyedu-icon-tile--success',
        'aria-hidden' => 'true',
    ]) .
    html_writer::tag(
        'div',
        html_writer::tag('h3', get_string('importresults', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__title easyedu-panel__title',
        ]) .
        html_writer::tag('p', get_string('csvreportintro', 'local_groupimport'), [
            'class' => 'local-groupimport-import-card__description easyedu-panel__description',
        ]),
        ['class' => 'easyedu-panel__copy']
    ),
    ['class' => 'local-groupimport-import-card__header easyedu-panel__header easyedu-panel__header--compact-icon']
);

if ($backgroundjobid) {
    $job = $DB->get_record('local_groupimport_jobs', ['id' => $backgroundjobid], '*', MUST_EXIST);
    $jobhistory = $DB->get_record('local_groupimport_history', [
        'id' => $job->historyid, 'courseid' => $course->id, 'userid' => $USER->id,
    ], '*', MUST_EXIST);
    echo html_writer::div(
        html_writer::tag('p', get_string('importjobqueued', 'local_groupimport')) .
        html_writer::tag(
            'p',
            get_string('importjob' . $job->status, 'local_groupimport') . ' ' . $job->nextrow . ' / ' . $jobhistory->rowcount,
            [
                'data-import-job-state' => '1',
                'aria-live' => 'polite',
            ]
        ),
        'easyedu-panel__description',
        ['data-import-job' => $backgroundjobid, 'data-course-id' => $course->id]
    );
    $progresslabels = [];
    foreach (['queued', 'running', 'retry', 'completed', 'cancelled', 'unavailable'] as $state) {
        $progresslabels[$state] = get_string('importjob' . $state, 'local_groupimport');
    }
    $PAGE->requires->js_call_amd('local_groupimport/import_progress', 'init', [$progresslabels]);
}

if ($preview !== null) {
    $rowcount = count($preview['rows']);
    $warningcount = count(array_filter($preview['messages'], static function (array $messages): bool {
        return !empty($messages);
    }));

    echo html_writer::tag(
        'div',
        html_writer::tag(
            'span',
            html_writer::tag('strong', $rowcount) . ' ' . get_string('importpreviewrows', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success ' .
                'easyedu-report-summary--success']
        ) .
        html_writer::tag(
            'span',
            html_writer::tag('strong', $warningcount) . ' ' . get_string('importpreviewwarnings', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        ['class' => 'local-groupimport-import-summary']
    );

    echo html_writer::start_tag('form', [
        'method' => 'post',
        'action' => new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
        'class' => 'local-groupimport-import-preview',
        'data-preview-total' => count($preview['rows']),
    ]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'id', 'value' => $course->id]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'sesskey', 'value' => sesskey()]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'confirmimport', 'value' => 1]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'previewtoken', 'value' => $preview['token']]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'previewpayload', 'value' => '']);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importfilename', 'value' => $preview['filename']]);
    echo html_writer::empty_tag('input', ['type' => 'hidden', 'name' => 'importhash', 'value' => $preview['filehash']]);

    echo html_writer::tag(
        'div',
        html_writer::tag('span', '', ['class' => 'fa fa-magic', 'aria-hidden' => 'true']) .
        html_writer::tag(
            'div',
            html_writer::tag('strong', get_string('importpreviewtitle', 'local_groupimport')) .
            html_writer::tag('p', get_string('importpreviewintro', 'local_groupimport', s($preview['filename'])), [
                'class' => 'mb-0',
            ])
        ),
        ['class' => 'local-groupimport-import-preview__notice easyedu-notice']
    );

    if (!empty($preview['previousimport'])) {
        echo html_writer::tag(
            'div',
            html_writer::tag('span', '', ['class' => 'fa fa-history', 'aria-hidden' => 'true']) .
            html_writer::tag(
                'p',
                get_string(
                    'previewpreviousimport',
                    'local_groupimport',
                    userdate((int)$preview['previousimport']->timecreated)
                ),
                ['class' => 'mb-0']
            ),
            ['class' => 'local-groupimport-import-preview__reimport-alert']
        );
    }

    $strategyoptions = html_writer::tag(
        'label',
        html_writer::empty_tag('input', [
            'type' => 'radio',
            'name' => 'replacepolicy',
            'value' => 'keep',
            'checked' => 'checked',
            'class' => 'easyedu-segmented-choice__input',
        ]) .
        html_writer::tag(
            'span',
            html_writer::span('', 'fa fa-plus', ['aria-hidden' => 'true']) .
            html_writer::tag(
                'span',
                html_writer::tag('strong', get_string('reimportkeeptitle', 'local_groupimport')) .
                html_writer::tag('small', get_string('reimportkeepdesc', 'local_groupimport'))
            ),
            ['class' => 'easyedu-segmented-choice__surface']
        ),
        ['class' => 'easyedu-segmented-choice__option']
    );
    $strategyoptions .= html_writer::tag(
        'label',
        html_writer::empty_tag('input', [
            'type' => 'radio',
            'name' => 'replacepolicy',
            'value' => 'replace',
            'class' => 'easyedu-segmented-choice__input',
        ]) .
        html_writer::tag(
            'span',
            html_writer::span('', 'fa fa-sync-alt', ['aria-hidden' => 'true']) .
            html_writer::tag(
                'span',
                html_writer::tag('strong', get_string('reimportreplacetitle', 'local_groupimport')) .
                html_writer::tag('small', get_string('reimportreplacedesc', 'local_groupimport'))
            ),
            ['class' => 'easyedu-segmented-choice__surface']
        ),
        ['class' => 'easyedu-segmented-choice__option']
    );
    $strategylabel = get_string('reimportstrategy', 'local_groupimport');
    $strategybody = html_writer::div(
        html_writer::div($strategylabel, 'easyedu-segmented-choice__label', ['aria-hidden' => 'true']) .
        html_writer::div($strategyoptions, 'easyedu-segmented-choice__options'),
        'easyedu-segmented-choice__body'
    );
    echo html_writer::tag(
        'fieldset',
        html_writer::tag('legend', $strategylabel, [
            'class' => 'easyedu-segmented-choice__legend',
        ]) . $strategybody,
        [
            'class' => 'local-groupimport-import-preview__strategy easyedu-segmented-choice--contained easyedu-choice',
        ]
    );

    echo html_writer::tag(
        'div',
        html_writer::tag(
            'div',
            html_writer::tag('button', get_string('selectpreviewpage', 'local_groupimport'), [
                'type' => 'button',
                'class' => 'easyedu-button easyedu-button--neutral',
                'data-local-groupimport-preview-toggle-all' => '1',
                'data-select-all-label' => get_string('selectpreviewpage', 'local_groupimport'),
                'data-deselect-all-label' => get_string('deselectpreviewpage', 'local_groupimport'),
                'data-select-results-label' => get_string('selectpreviewresults', 'local_groupimport'),
                'data-deselect-results-label' => get_string('deselectpreviewresults', 'local_groupimport'),
            ]),
            ['class' => 'local-groupimport-import-preview__bulk-actions']
        ) .
        html_writer::tag(
            'label',
            html_writer::span(get_string('previewsearchlabel', 'local_groupimport'), 'accesshide') .
            html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
            html_writer::empty_tag('input', [
                'type' => 'search',
                'class' => 'form-control local-groupimport-import-preview__search',
                'placeholder' => get_string('previewsearchpageonly', 'local_groupimport'),
                'data-local-groupimport-preview-search' => '1',
            ]),
            [
                'class' => 'local-groupimport-import-preview__search-field easyedu-search',
                'aria-label' => get_string('previewsearchlabel', 'local_groupimport'),
            ]
        ),
        ['class' => 'local-groupimport-import-preview__toolbar easyedu-table-toolbar']
    );

    echo html_writer::start_tag('div', ['class' => 'local-groupimport-import-preview__table-wrap']);
    echo html_writer::start_tag('table', ['class' => 'table-reboot easyedu-data-table local-groupimport-import-preview__table']);
    echo html_writer::tag(
        'thead',
        html_writer::tag(
            'tr',
            html_writer::tag('th', get_string('importpreviewinclude', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewline', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewidentifier', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgroup', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewgrouping', 'local_groupimport')) .
            html_writer::tag('th', get_string('importpreviewstatus', 'local_groupimport'))
        )
    );
    echo html_writer::start_tag('tbody');

    $previewpage = (int)($preview['page'] ?? 0);
    foreach (array_slice($preview['rows'], $previewpage * 100, 100, true) as $index => $row) {
        $messages = $preview['messages'][$index] ?? [];
        $status = empty($messages)
            ? html_writer::tag('span', get_string('importpreviewready', 'local_groupimport'), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--ready ' .
                    'easyedu-status',
            ])
            : html_writer::tag('span', implode(' ', array_map('s', $messages)), [
                'class' => 'local-groupimport-import-preview__status local-groupimport-import-preview__status--warning ' .
                    'easyedu-status easyedu-status--warning',
            ]);

        echo html_writer::tag(
            'tr',
            html_writer::tag(
                'td',
                html_writer::empty_tag('input', [
                    'type' => 'checkbox',
                    'name' => 'rowenabled[' . $index . ']',
                    'value' => 1,
                    'checked' => isset($preview['excluded'][$index]) ? null : 'checked',
                    'aria-label' => get_string('importpreviewinclude', 'local_groupimport'),
                ])
            ) .
            html_writer::tag('td', (string)$row['line']) .
            html_writer::tag(
                'td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'identifier[' . $index . ']',
                    'value' => $row['identifier'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag(
                'td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupname[' . $index . ']',
                    'value' => $row['groupname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag(
                'td',
                html_writer::empty_tag('input', [
                    'type' => 'text',
                    'name' => 'groupingname[' . $index . ']',
                    'value' => $row['groupingname'],
                    'class' => 'form-control',
                ])
            ) .
            html_writer::tag('td', $status),
            [
                'class' => empty($messages) ? '' : 'local-groupimport-import-preview__row--warning is-warning',
                'data-local-groupimport-preview-row' => '1',
                'data-preview-index' => $index,
            ]
        );
    }

    echo html_writer::end_tag('tbody');
    echo html_writer::end_tag('table');
    $pagecount = (int)ceil(count($preview['rows']) / 100);
    if ($pagecount > 1) {
        echo html_writer::start_div('easyedu-pagination local-groupimport-import-pagination');
        foreach ([-1 => 'previous', 1 => 'next'] as $offset => $direction) {
            echo html_writer::tag('button', html_writer::span('', 'fa fa-chevron-' .
                ($offset === -1 ? 'left' : 'right'), ['aria-hidden' => 'true']), [
                'type' => 'submit', 'name' => 'previewpage', 'value' => $previewpage + $offset,
                'class' => 'easyedu-button easyedu-button--secondary',
                'aria-label' => get_string($direction),
                'disabled' => ($previewpage + $offset < 0 || $previewpage + $offset >= $pagecount) ? 'disabled' : null,
                ]);
            if ($offset === -1) {
                echo html_writer::span(($previewpage + 1) . ' / ' . $pagecount, 'easyedu-pagination__count');
            }
        }
        echo html_writer::end_div();
    }
    // Last after all row controls: PHP input truncation cannot silently authorize a partial import.
    echo html_writer::empty_tag('input', [
        'type' => 'hidden', 'name' => 'previewcomplete', 'value' => count($preview['rows']),
    ]);
    echo html_writer::end_tag('div');
    echo html_writer::tag(
        'div',
        html_writer::tag('span', '', ['class' => 'fa fa-search', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('nopreviewmatches', 'local_groupimport'), ['class' => 'mb-0']),
        [
            'class' => 'local-groupimport-import-empty local-groupimport-import-empty--preview-search easyedu-empty',
            'data-local-groupimport-preview-empty' => '1',
            'hidden' => 'hidden',
        ]
    );

    // Guided path warning (K18-07), right before the only button that changes the course: shown by
    // the Guide adapter while the "check a file without importing" path is running.
    echo html_writer::tag(
        'div',
        html_writer::tag('span', '', ['class' => 'fa fa-exclamation-triangle', 'aria-hidden' => 'true']) .
        html_writer::tag('p', s(get_string('mi_guide_path_warning', 'local_groupimport'))),
        [
            'class' => 'easyedu-notice easyedu-notice--warning',
            'role' => 'note',
            'data-local-groupimport-guide-path-warning' => '1',
            'hidden' => 'hidden',
        ]
    );
    echo html_writer::tag(
        'div',
        html_writer::tag(
            'button',
            html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
            get_string('submitimport', 'local_groupimport'),
            ['type' => 'submit', 'class' => 'easyedu-button', 'data-local-groupimport-preview-submit' => '1']
        ) .
        html_writer::link(
            new moodle_url('/local/groupimport/index.php', ['id' => $course->id]),
            get_string('cancel', 'local_groupimport'),
            ['class' => 'easyedu-button easyedu-button--neutral', 'data-local-groupimport-preview-cancel' => '1']
        ),
        ['class' => 'local-groupimport-import-preview__actions']
    );
    echo html_writer::end_tag('form');
} else if (empty($success) && empty($errors)) {
    echo html_writer::tag(
        'div',
        html_writer::tag('svg', html_writer::tag('rect', '', [
            'width' => '100%', 'height' => '100%', 'rx' => '13.6',
        ]), ['class' => 'easyedu-empty__boundary', 'aria-hidden' => 'true', 'focusable' => 'false']) .
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('p', get_string('noresults', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-empty easyedu-empty']
    );
} else {
    echo html_writer::tag(
        'div',
        html_writer::tag(
            'span',
            html_writer::tag('strong', count($success)) . ' ' . get_string('successheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--success ' .
                'easyedu-report-summary--success']
        ) .
        html_writer::tag(
            'span',
            html_writer::tag('strong', count($errors)) . ' ' . get_string('errorheader', 'local_groupimport'),
            ['class' => 'local-groupimport-import-summary__item local-groupimport-import-summary__item--error']
        ),
        [
            'class' => 'local-groupimport-import-summary',
            'aria-label' => get_string('importsummary', 'local_groupimport'),
        ]
    );

    if (!empty($success)) {
        echo html_writer::tag('h4', get_string('successheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--success ' .
                'easyedu-report-title--success',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--success easyedu-report-list--success',
        ]);
        foreach ($success as $msg) {
            echo html_writer::tag(
                'li',
                html_writer::tag('span', '', ['class' => 'fa fa-check', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }

    if (!empty($errors)) {
        echo html_writer::tag('h4', get_string('errorheader', 'local_groupimport'), [
            'class' => 'local-groupimport-import-report__title local-groupimport-import-report__title--error',
        ]);
        echo html_writer::start_tag('ul', [
            'class' => 'local-groupimport-import-report local-groupimport-import-report--error',
        ]);
        foreach ($errors as $msg) {
            echo html_writer::tag(
                'li',
                html_writer::tag('span', '', ['class' => 'fa fa-exclamation-triangle', 'aria-hidden' => 'true']) .
                html_writer::tag('span', s($msg))
            );
        }
        echo html_writer::end_tag('ul');
    }

    if ($currenthistoryid) {
        echo html_writer::div(
            html_writer::link(
                new moodle_url('/local/groupimport/export.php', [
                    'id' => $course->id,
                    'historyid' => $currenthistoryid,
                ]),
                html_writer::span('', 'fa fa-file-excel', ['aria-hidden' => 'true']) .
                    html_writer::span(get_string('importexportresults', 'local_groupimport')),
                ['class' => 'btn btn-outline-primary easyedu-action-with-icon local-groupimport-import__export-results ' .
                    'easyedu-button--outline-primary']
            ),
            'local-groupimport-import-preview__result-actions'
        );
    }
}

echo html_writer::end_div(); // Card.

echo html_writer::end_div(); // Grid.

// T050/T051 (Kevin 16/10/2026 decision 6, Penpot S6-D5b/c): history and restore dialogs
// join the T045 dialog family (tile + EASYSTUD eyebrow + title + Kit close, sticky footer
// with Kit buttons). Rows keep every action: restore (or restore again), annotated Excel
// report, legacy notice and the last restoration date.
$historytitle = static function (
    string $titleid,
    string $title,
    string $icon,
    string $closeattribute,
    string $tilemodifier = ''
): string {
    return html_writer::tag(
        'div',
        html_writer::tag(
            'div',
            html_writer::span('', 'easyedu-entity-dialog__icon local-groupimport-import-modal__tile fa ' . $icon .
                $tilemodifier, ['aria-hidden' => 'true']) .
            html_writer::tag(
                'div',
                html_writer::span(get_string('pluginname', 'local_groupimport'), 'easyedu-entity-dialog__eyebrow') .
                html_writer::tag('h3', $title, ['id' => $titleid, 'class' => 'easyedu-modal-title'])
            ),
            ['class' => 'easyedu-entity-dialog__heading']
        ) .
        html_writer::tag(
            'button',
            html_writer::tag('span', '', ['class' => 'fa fa-times', 'aria-hidden' => 'true']),
            [
                'type' => 'button',
                'class' => 'easyedu-dialog-close',
                $closeattribute => '1',
                'aria-label' => get_string('closebuttontitle'),
            ]
        ),
        ['class' => 'easyedu-dialog-header easyedu-entity-dialog__header local-groupimport-import-modal__header']
    );
};

$historyitems = '';
$historycount = 0;
if (!empty($historyrecords)) {
    foreach ($historyrecords as $record) {
        $historycount++;
        $restored = !empty($record->timerolledback);
        $restorable = !empty($record->haschanges);
        $meta = [
            userdate((int)$record->timecreated, get_string('strftimedatetimeshort', 'langconfig')),
            local_groupimport_count_string('importhistoryrowscount', (int)$record->rowcount),
            local_groupimport_count_string('importhistorysuccesscount', (int)$record->successcount),
            local_groupimport_count_string('importhistoryerrorscount', (int)$record->errorcount),
        ];
        $main = html_writer::tag('strong', s($record->filename), ['class' => 'local-groupimport-import-history__file']) .
            html_writer::tag(
                'span',
                implode(' &middot; ', array_map('s', $meta)),
                ['class' => 'local-groupimport-import-history__meta']
            );
        if ($restored) {
            $main .= html_writer::tag(
                'span',
                s(get_string('importhistoryrolledback', 'local_groupimport', userdate((int)$record->timerolledback))),
                ['class' => 'local-groupimport-import-history__meta local-groupimport-import-history__meta--restored']
            );
        }

        $historyactions = '';
        if ($restorable) {
            $historyactions .= html_writer::tag(
                'button',
                s(get_string($restored ? 'importhistoryrestoreagain' : 'importhistoryrollback', 'local_groupimport')),
                [
                    'type' => 'button',
                    'class' => 'local-groupimport-import-history__action local-groupimport-import-history__rollback',
                    'data-local-groupimport-rollback-open' => (int)$record->id,
                    'data-local-groupimport-rollback-filename' => $record->filename,
                ]
            );
            $historyactions .= html_writer::link(
                new moodle_url('/local/groupimport/export.php', [
                    'id' => $course->id,
                    'historyid' => (int)$record->id,
                ]),
                html_writer::span('', 'fa fa-file-excel', ['aria-hidden' => 'true']) .
                    html_writer::span(s(get_string('importhistoryexportshort', 'local_groupimport'))),
                [
                    'class' => 'local-groupimport-import-history__action local-groupimport-import-history__export',
                    'aria-label' => get_string('importexportresults', 'local_groupimport') . ' (' . $record->filename . ')',
                ]
            );
        } else {
            $historyactions .= html_writer::tag('span', s(get_string('importhistorylegacy', 'local_groupimport')), [
                'class' => 'local-groupimport-import-history__state--legacy',
            ]);
        }

        $statekey = $restored ? 'restored' : 'applied';
        $historyitems .= html_writer::tag(
            'li',
            html_writer::div($main, 'local-groupimport-import-history__item-main') .
            html_writer::tag('span', s(get_string('importhistory' . $statekey, 'local_groupimport')), [
                'class' => 'local-groupimport-import-history__state local-groupimport-import-history__state--' . $statekey,
            ]) .
            html_writer::div($historyactions, 'local-groupimport-import-history__actions'),
            ['class' => 'local-groupimport-import-history__item local-groupimport-import-history__item--' . $statekey .
                ($restorable ? '' : ' local-groupimport-import-history__item--legacy')]
        );
    }
} else {
    $historyitems = html_writer::tag(
        'li',
        html_writer::tag('span', '', ['class' => 'fa fa-inbox', 'aria-hidden' => 'true']) .
        html_writer::tag('span', get_string('importhistoryempty', 'local_groupimport')),
        ['class' => 'local-groupimport-import-history__empty']
    );
}

echo html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        $historytitle(
            'local-groupimport-import-history-title',
            get_string('importhistory', 'local_groupimport'),
            'fa-file-import',
            'data-local-groupimport-history-close'
        ) .
        html_writer::tag(
            'div',
            html_writer::tag(
                'div',
                html_writer::tag('span', '', ['class' => 'fa fa-info-circle', 'aria-hidden' => 'true']) .
                html_writer::tag('p', s(get_string('importhistorynotice', 'local_groupimport'))),
                ['class' => 'easyedu-notice local-groupimport-import-history__notice']
            ) .
            html_writer::tag('h4', get_string('importhistoryrecent', 'local_groupimport'), [
                'class' => 'local-groupimport-import-history__caption',
            ]) .
            html_writer::tag('ul', $historyitems, [
                'class' => 'local-groupimport-import-history',
                'data-local-groupimport-history-list' => '1',
            ]),
            ['class' => 'local-groupimport-import-modal__body']
        ) .
        html_writer::tag(
            'div',
            html_writer::tag('span', local_groupimport_count_string('importhistorycount', $historycount), [
                'class' => 'local-groupimport-import-history__summary',
            ]) .
            html_writer::tag('button', get_string('closebuttontitle'), [
                'type' => 'button',
                'class' => 'btn easyedu-button',
                'data-local-groupimport-history-dismiss' => '1',
            ]),
            ['class' => 'local-groupimport-import-modal__footer local-groupimport-import-modal__footer--summary ' .
                'easyedu-dialog-actions']
        ),
        [
            'class' => 'local-groupimport-import-modal__dialog local-groupimport-import-modal__dialog--history ' .
                'easyedu-entity-dialog',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-import-history-title',
        ]
    ),
    [
        'class' => 'local-groupimport-import-modal',
        'data-local-groupimport-history-modal' => '1',
        'hidden' => 'hidden',
    ]
);

$rollbackform = html_writer::start_tag('form', [
    'method' => 'post',
    'action' => (new moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(false),
    'class' => 'local-groupimport-import-modal__form',
    'data-local-groupimport-rollback-form' => '1',
]);
$rollbackform .= html_writer::empty_tag('input', [
    'type' => 'hidden',
    'name' => 'sesskey',
    'value' => sesskey(),
]);
$rollbackform .= html_writer::empty_tag('input', [
    'type' => 'hidden',
    'name' => 'rollbackhistoryid',
    'value' => '',
    'data-local-groupimport-rollback-id' => '1',
]);
$rollbackform .= html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        html_writer::tag('p', get_string('importrollbackconfirm', 'local_groupimport'), ['class' => 'easyedu-dialog-description']) .
            html_writer::tag(
                'p',
                html_writer::span('', 'fa fa-file-alt', ['aria-hidden' => 'true']) .
                html_writer::tag('strong', '', ['data-local-groupimport-rollback-name' => '1']),
                ['class' => 'local-groupimport-import-rollback__file']
            ),
        ['class' => 'local-groupimport-import-rollback__message']
    ),
    ['class' => 'local-groupimport-import-modal__body']
);
$rollbackform .= html_writer::tag(
    'div',
    html_writer::tag('button', get_string('cancel', 'local_groupimport'), [
        'type' => 'button',
        'class' => 'btn easyedu-button--secondary',
        'data-local-groupimport-rollback-close' => '1',
    ]) .
    html_writer::tag(
        'button',
        html_writer::span('', 'fa fa-undo-alt', ['aria-hidden' => 'true']) .
            html_writer::span(get_string('importrollbackconfirmbutton', 'local_groupimport')),
        ['type' => 'submit', 'class' => 'btn easyedu-button--danger easyedu-action-with-icon']
    ),
    ['class' => 'local-groupimport-import-modal__footer easyedu-dialog-actions']
);
$rollbackform .= html_writer::end_tag('form');

echo html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        $historytitle(
            'local-groupimport-import-rollback-title',
            get_string('importrollbacktitle', 'local_groupimport'),
            'fa-undo-alt',
            'data-local-groupimport-rollback-close',
            ' local-groupimport-import-modal__tile--danger'
        ) .
        $rollbackform,
        [
            'class' => 'local-groupimport-import-modal__dialog local-groupimport-import-modal__dialog--confirm ' .
                'easyedu-entity-dialog',
            'role' => 'dialog',
            'aria-modal' => 'true',
            'aria-labelledby' => 'local-groupimport-import-rollback-title',
        ]
    ),
    [
        'class' => 'local-groupimport-import-modal',
        'data-local-groupimport-rollback-modal' => '1',
        'hidden' => 'hidden',
    ]
);

echo html_writer::tag(
    'div',
    html_writer::tag(
        'div',
        html_writer::tag('span', '', ['class' => 'fa fa-plus', 'aria-hidden' => 'true']) .
        html_writer::tag('strong', get_string('csvdropready', 'local_groupimport')) .
        html_writer::tag('p', get_string('csvdropsubtitle', 'local_groupimport'), ['class' => 'mb-0']),
        ['class' => 'local-groupimport-import-drop__panel']
    ),
    [
        'class' => 'local-groupimport-import-drop',
        'data-local-groupimport-drop-overlay' => '1',
        'hidden' => 'hidden',
        'aria-hidden' => 'true',
    ]
);

echo html_writer::end_div(); // Real content.
echo html_writer::end_div(); // Container.

echo $OUTPUT->footer();
