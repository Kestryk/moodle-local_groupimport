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
 * Download an annotated, reimport-compatible EasyStud import report.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');
require_once(__DIR__ . '/lib.php');

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$id = required_param('id', PARAM_INT);
$historyid = required_param('historyid', PARAM_INT);

$course = get_course($id);
require_login($course);
$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$history = $DB->get_record('local_groupimport_history', [
    'id' => $historyid,
    'courseid' => $course->id,
], '*', MUST_EXIST);
$changes = json_decode((string)$history->changesjson, true);
if (!is_array($changes)) {
    throw new moodle_exception('importexportunavailable', 'local_groupimport');
}

$reportrows = $changes['reportrows'] ?? [];
if (empty($reportrows)) {
    $reportrows = array_map(static function (array $row): array {
        return [
            'identifier' => (string)($row['identifier'] ?? ''),
            'groupname' => (string)($row['groupname'] ?? ''),
            'groupingname' => (string)($row['groupingname'] ?? ''),
            'status' => 'success',
            'messages' => [get_string('importexportlegacydetail', 'local_groupimport')],
        ];
    }, local_groupimport_history_desired_state($changes, (int)$course->id));
}
if (empty($reportrows)) {
    throw new moodle_exception('importexportunavailable', 'local_groupimport');
}

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheet->setTitle(core_text::substr(get_string('importexportsheet', 'local_groupimport'), 0, 31));
$sheet->fromArray([[
    get_string('templatecolumnidentifier', 'local_groupimport'),
    get_string('templatecolumngroup', 'local_groupimport'),
    get_string('templatecolumngrouping', 'local_groupimport'),
    get_string('importexportstatus', 'local_groupimport'),
    get_string('importexportdetails', 'local_groupimport'),
]], null, 'A1');

$statuslabels = [
    'success' => get_string('importexportstatussuccess', 'local_groupimport'),
    'warning' => get_string('importexportstatuswarning', 'local_groupimport'),
    'error' => get_string('importexportstatuserror', 'local_groupimport'),
];
$rowcolours = [
    'success' => 'EDF8F1',
    'warning' => 'FFF7E8',
    'error' => 'FFF0EE',
];

$rownumber = 2;
foreach ($reportrows as $row) {
    $status = in_array(($row['status'] ?? ''), ['success', 'warning', 'error'], true)
        ? $row['status'] : 'success';
    $messages = $row['messages'] ?? [];
    if (!is_array($messages)) {
        $messages = [(string)$messages];
    }
    $sheet->fromArray([[
        (string)($row['identifier'] ?? ''),
        (string)($row['groupname'] ?? ''),
        (string)($row['groupingname'] ?? ''),
        $statuslabels[$status],
        implode(' | ', array_filter(array_map('strval', $messages))),
    ]], null, 'A' . $rownumber);
    $sheet->getStyle('A' . $rownumber . ':E' . $rownumber)->getFill()
        ->setFillType(Fill::FILL_SOLID)
        ->getStartColor()->setRGB($rowcolours[$status]);
    $rownumber++;
}

$lastrow = max(2, $rownumber - 1);
$sheet->freezePane('A2');
$sheet->setAutoFilter('A1:E' . $lastrow);
$sheet->getColumnDimension('A')->setWidth(31);
$sheet->getColumnDimension('B')->setWidth(27);
$sheet->getColumnDimension('C')->setWidth(31);
$sheet->getColumnDimension('D')->setWidth(16);
$sheet->getColumnDimension('E')->setWidth(58);
$sheet->getRowDimension(1)->setRowHeight(28);
$sheet->getStyle('A1:E1')->applyFromArray([
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '176FB8']],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
]);
$sheet->getStyle('A2:E' . $lastrow)->applyFromArray([
    'alignment' => ['vertical' => Alignment::VERTICAL_TOP, 'wrapText' => true],
    'borders' => [
        'bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'D8E3EC']],
    ],
]);

$basename = pathinfo((string)$history->filename, PATHINFO_FILENAME);
$filename = clean_filename(($basename !== '' ? $basename : 'easystud_import') . '_report.xlsx');
$tempdir = make_temp_directory('local_groupimport');
$tempfile = $tempdir . DIRECTORY_SEPARATOR . uniqid('report_', true) . '.xlsx';
$writer = new Xlsx($spreadsheet);
$writer->save($tempfile);
$spreadsheet->disconnectWorksheets();
$content = file_get_contents($tempfile);
if (file_exists($tempfile)) {
    unlink($tempfile);
}
if ($content === false) {
    throw new moodle_exception('cannotcreatetempfile', 'error');
}

send_file(
    $content,
    $filename,
    0,
    0,
    true,
    false,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);
