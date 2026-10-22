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
// The Guide rules are a separate, cache-shared sheet requested by every consumer page (GMI-C1;
// K22, Kevin 22/10, option 2 of RAPPORT-I9-X6-X7-20261022.md: manage.php requests it too now).
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
// The loading implementation keeps the real frame visible while binding its controls.
$navigationdata = local_groupimport_build_mass_import_navigation_context($course);
// K21-53 Rail-anchor: the Guide launcher is a labelled capsule grouped with Display
// preferences at the end of the identity rail (no welcome bubble; Q4).
$navigationdata['hasguide'] = true;
$guidedata = \local_groupimport\local\mass_import_guide::template_data([
    'allowedfields' => array_values($allowedimportfields),
    'motionlevel' => $motionlevel,
    'motionpolicy' => $motionlevel === 'minimal' ? 'disabled' : 'enabled',
]);
$guidedata['launchershortlabel'] = get_string('guidebadgelabel', 'local_groupimport');
$navigationdata['guidehtml'] = $OUTPUT->render_from_template('local_groupimport/easyedu_guide', $guidedata);
// Opt this native launcher into the page's pending-control treatment, without
// changing the shared Guide template, content or readiness callbacks.
$navigationdata['guidehtml'] = str_replace(
    'data-easyedu-guide-open="1"',
    'data-easyedu-guide-open="1" data-easyedu-loading-control="1"',
    $navigationdata['guidehtml']
);
$themestyle = local_groupimport_get_theme_style();
$themerailroles = local_groupimport_get_theme_rail_roles();
$navigationmarkup = html_writer::tag(
    'div',
    $OUTPUT->render_from_template('local_groupimport/easyedu_navigation', $navigationdata),
    [
        'class' => 'local-groupimport-import-navigation local-groupimport-easystud local-groupimport-easystud__navigation ' .
            'easyedu-rail-anchor__rail',
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
    'data-easyedu-loading-frame' => '1',
    'data-easyedu-loading-ready-attribute' => 'data-easyedu-loading-ready',
    'data-easyedu-loading-recover-late-ready' => '1',
    'data-easyedu-action-busy-label' => get_string('actioninprogress', 'local_groupimport'),
    'data-easyedu-custom-rails' => $themerailroles,
    'data-easyedu-dialog-palette' => $themerailroles,
    'data-easyedu-report-palette' => $themerailroles,
    'style' => $themestyle,
        ]);

// The server frame stays visible; only unbound controls use Kit capsules.
echo html_writer::start_div('local-groupimport-import__content', [
    'data-easystud-real-content' => '1',
]);

// K21-53 "Rail-anchor" page structure (EasyEdu standard, Kit partial
// scss/easyedu/components/_rail-anchor.scss, as Student Management K21-51):
// floor 1 = navigation band (identity rail; Mass Import has a single layout, so no
// view tabs), floor 2 = one main content frame wrapping the head and the whole view.
// DOM order equals reading and Tab order. Dialogs and the drop overlay stay outside.
echo html_writer::tag(
    'div',
    $navigationmarkup,
    ['class' => 'local-groupimport-import__header easyedu-rail-anchor__band']
);

echo html_writer::start_div('local-groupimport-import__frame easyedu-rail-anchor__frame');
echo html_writer::tag(
    'div',
    // The product eyebrow is compact-only: on desktop the rail carries the identity.
    html_writer::span(
        get_string('easystudlabel', 'local_groupimport'),
        'local-groupimport-import__eyebrow easyedu-rail-anchor__compact-eyebrow'
    ) .
    html_writer::tag('h2', get_string('groupimport', 'local_groupimport'), [
        'class' => 'local-groupimport-import__title easyedu-page-title',
    ]) .
    html_writer::tag('p', get_string('importfile_help', 'local_groupimport'), [
        'class' => 'local-groupimport-import__intro easyedu-body',
    ]),
    ['class' => 'local-groupimport-import__head easyedu-rail-anchor__head']
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
        ['class' => 'local-groupimport-import-fields__header easyedu-information__header easyedu-information__header--small-icon easyedu-information__header--icon-title-copy']
    ) .
    html_writer::tag('p', get_string('importfieldsavailable', 'local_groupimport'), [
        'class' => 'local-groupimport-import-fields__label easyedu-information__label',
    ]) .
    html_writer::tag('div', implode("\n", $fieldtags), ['class' => 'local-groupimport-import-fields__tags easyedu-tag-list']),
    ['class' => 'local-groupimport-import-fields easyedu-information easyedu-information--deposit-aligned']
);

// Moodle form (with filepicker).
echo html_writer::start_div('local-groupimport-import-form easyedu-form--deposit easyedu-form--workspace', [
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

$hasreport = ($preview === null) && !(empty($success) && empty($errors));
if ($hasreport) {
    // K18-16: the outcome is also announced with the Kit V3 notification.
    $notificationtype = empty($errors) ? 'success' : 'error';
    $PAGE->requires->js_call_amd('local_groupimport/easyedu_notification', 'show', [[
        'type' => $notificationtype,
        'eyebrow' => get_string('pluginname', 'local_groupimport'),
        'title' => get_string('notification' . $notificationtype . 'title', 'local_groupimport'),
        'text' => get_string('importnotificationsummary', 'local_groupimport', (object)[
            'success' => count($success),
            'errors' => count($errors),
        ]),
        'closeLabel' => get_string('closebuttontitle'),
        'delay' => 6000,
    ]]);
}
// I4 (2026-10-21): the preview table / empty placeholder / success-error report used to be
// ~300 lines of html_writer here; now a single Mustache template and its context builder
// (classes\output\mass_import_preview.php) reproduce the same markup.
echo $OUTPUT->render_from_template(
    'local_groupimport/mass_import_preview',
    \local_groupimport\output\mass_import_preview::build_template_data(
        $course,
        $preview,
        $success,
        $errors,
        $currenthistoryid
    )
);

echo html_writer::end_div(); // Card.

echo html_writer::end_div(); // Grid.

echo html_writer::end_div(); // Main content frame (K21-53).

// T050/T051 (Penpot S6-D5b/c): history and restore dialogs
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
