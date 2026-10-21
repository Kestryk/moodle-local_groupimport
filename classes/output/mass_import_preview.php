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
 * Builds the Mass Import preview table / results report context for Mustache.
 *
 * Extracted from index.php (I4, 2026-10-21): reproduces exactly the markup
 * previously produced inline with html_writer at index.php:485-876 (the
 * preview table, the "no results yet" placeholder and the success/error
 * report), so moving it here changes neither the output nor the behaviour.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class mass_import_preview {

    /**
     * Build the template context for the Mass Import results card body.
     *
     * Exactly one of the three states is active at a time: a preview to
     * confirm, the "no results yet" placeholder, or the success/error report
     * of a completed import.
     *
     * @param \stdClass $course Current course.
     * @param array|null $preview Preview data built by index.php, or null.
     * @param array $success Success messages of a completed import.
     * @param array $errors Error messages of a completed import.
     * @param int $currenthistoryid History id of a completed import, 0 if none.
     * @return array
     */
    public static function build_template_data(
        \stdClass $course,
        ?array $preview,
        array $success,
        array $errors,
        int $currenthistoryid
    ): array {
        if ($preview !== null) {
            return [
                'haspreview' => true,
                'preview' => self::build_preview_context($course, $preview),
            ];
        }

        if (empty($success) && empty($errors)) {
            return [
                'isemptystate' => true,
                'noresultslabel' => get_string('noresults', 'local_groupimport'),
            ];
        }

        return [
            'hasreport' => true,
            'report' => self::build_report_context($course, $success, $errors, $currenthistoryid),
        ];
    }

    /**
     * Build the preview-table part of the context (the confirmation form).
     *
     * @param \stdClass $course Current course.
     * @param array $preview Preview data.
     * @return array
     */
    private static function build_preview_context(\stdClass $course, array $preview): array {
        $rowcount = count($preview['rows']);
        $warningcount = count(array_filter($preview['messages'], static function (array $messages): bool {
            return !empty($messages);
        }));

        $previewpage = (int)($preview['page'] ?? 0);
        $pagecount = (int)ceil(count($preview['rows']) / 100);

        $rows = [];
        foreach (array_slice($preview['rows'], $previewpage * 100, 100, true) as $index => $row) {
            $messages = $preview['messages'][$index] ?? [];
            $haswarning = !empty($messages);
            $rows[] = [
                'index' => $index,
                'line' => (string)$row['line'],
                'identifier' => $row['identifier'],
                'groupname' => $row['groupname'],
                'groupingname' => $row['groupingname'],
                'checked' => !isset($preview['excluded'][$index]),
                'haswarning' => $haswarning,
                'rowclass' => $haswarning ? 'local-groupimport-import-preview__row--warning is-warning' : '',
                'readylabel' => get_string('importpreviewready', 'local_groupimport'),
                'statustext' => $haswarning ? implode(' ', array_map('s', $messages)) : '',
            ];
        }

        $context = [
            'rowcount' => $rowcount,
            'warningcount' => $warningcount,
            'importpreviewrowslabel' => get_string('importpreviewrows', 'local_groupimport'),
            'importpreviewwarningslabel' => get_string('importpreviewwarnings', 'local_groupimport'),
            'formaction' => (new \moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(),
            'rowstotal' => $rowcount,
            'courseid' => $course->id,
            'sesskey' => sesskey(),
            'previewtoken' => $preview['token'],
            'filename' => $preview['filename'],
            'filehash' => $preview['filehash'],
            'importpreviewtitle' => get_string('importpreviewtitle', 'local_groupimport'),
            'previewintro' => get_string('importpreviewintro', 'local_groupimport', s($preview['filename'])),
            'hasprevious' => !empty($preview['previousimport']),
            'previouslabel' => !empty($preview['previousimport'])
                ? get_string('previewpreviousimport', 'local_groupimport', userdate((int)$preview['previousimport']->timecreated))
                : '',
            'reimportstrategylabel' => get_string('reimportstrategy', 'local_groupimport'),
            'reimportkeeptitle' => get_string('reimportkeeptitle', 'local_groupimport'),
            'reimportkeepdesc' => get_string('reimportkeepdesc', 'local_groupimport'),
            'reimportreplacetitle' => get_string('reimportreplacetitle', 'local_groupimport'),
            'reimportreplacedesc' => get_string('reimportreplacedesc', 'local_groupimport'),
            'selectpreviewpagelabel' => get_string('selectpreviewpage', 'local_groupimport'),
            'deselectpreviewpagelabel' => get_string('deselectpreviewpage', 'local_groupimport'),
            'selectpreviewresultslabel' => get_string('selectpreviewresults', 'local_groupimport'),
            'deselectpreviewresultslabel' => get_string('deselectpreviewresults', 'local_groupimport'),
            'previewsearchlabel' => get_string('previewsearchlabel', 'local_groupimport'),
            'previewsearchpageonly' => get_string('previewsearchpageonly', 'local_groupimport'),
            'th_include' => get_string('importpreviewinclude', 'local_groupimport'),
            'th_line' => get_string('importpreviewline', 'local_groupimport'),
            'th_identifier' => get_string('importpreviewidentifier', 'local_groupimport'),
            'th_group' => get_string('importpreviewgroup', 'local_groupimport'),
            'th_grouping' => get_string('importpreviewgrouping', 'local_groupimport'),
            'th_status' => get_string('importpreviewstatus', 'local_groupimport'),
            'rows' => $rows,
            'haspagination' => $pagecount > 1,
            'previewpagedisplay' => $previewpage + 1,
            'pagecount' => $pagecount,
            'prevvalue' => $previewpage - 1,
            'nextvalue' => $previewpage + 1,
            'prevdisabled' => ($previewpage - 1 < 0 || $previewpage - 1 >= $pagecount),
            'nextdisabled' => ($previewpage + 1 < 0 || $previewpage + 1 >= $pagecount),
            'previousarialabel' => get_string('previous'),
            'nextarialabel' => get_string('next'),
            'nopreviewmatches' => get_string('nopreviewmatches', 'local_groupimport'),
            'guidewarning' => s(get_string('mi_guide_path_warning', 'local_groupimport')),
            'submitimportlabel' => get_string('submitimport', 'local_groupimport'),
            'cancelurl' => (new \moodle_url('/local/groupimport/index.php', ['id' => $course->id]))->out(),
            'cancellabel' => get_string('cancel', 'local_groupimport'),
        ];

        return $context;
    }

    /**
     * Build the success/error report part of the context.
     *
     * @param \stdClass $course Current course.
     * @param array $success Success messages.
     * @param array $errors Error messages.
     * @param int $currenthistoryid History id of the completed import, 0 if none.
     * @return array
     */
    private static function build_report_context(
        \stdClass $course,
        array $success,
        array $errors,
        int $currenthistoryid
    ): array {
        $successitems = array_map(static function (string $msg): string {
            return s($msg);
        }, $success);
        $erroritems = array_map(static function (string $msg): string {
            return s($msg);
        }, $errors);

        return [
            'successcount' => count($success),
            'errorcount' => count($errors),
            'successheaderlabel' => get_string('successheader', 'local_groupimport'),
            'errorheaderlabel' => get_string('errorheader', 'local_groupimport'),
            'importsummarylabel' => get_string('importsummary', 'local_groupimport'),
            'hassuccess' => !empty($success),
            'successitems' => array_map(static function (string $item): array {
                return ['text' => $item];
            }, $successitems),
            'haserrors' => !empty($errors),
            'erroritems' => array_map(static function (string $item): array {
                return ['text' => $item];
            }, $erroritems),
            'hasexport' => (bool)$currenthistoryid,
            'exporturl' => $currenthistoryid
                ? (new \moodle_url('/local/groupimport/export.php', [
                    'id' => $course->id,
                    'historyid' => $currenthistoryid,
                ]))->out()
                : '',
            'importexportresultslabel' => get_string('importexportresults', 'local_groupimport'),
        ];
    }
}
