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
 * Excel example download endpoint for EasyStud Mass Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

require_once(__DIR__ . '/../../config.php');

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

$id = required_param('id', PARAM_INT); // Course id.

$course = get_course($id);
require_login($course);

$context = context_course::instance($course->id);
require_capability('moodle/course:managegroups', $context);

$filename = 'easyStud_mass_import_example.xlsx';
if (get_string_manager()->string_exists('templatename', 'local_groupimport')) {
    $filename = clean_filename(get_string('templatename', 'local_groupimport'));
    if (strtolower(substr($filename, -5)) !== '.xlsx') {
        $filename = preg_replace('/\.[^.]+$/', '', $filename) . '.xlsx';
    }
}

$spreadsheet = new Spreadsheet();
$sheet = $spreadsheet->getActiveSheet();
$sheettitle = preg_replace('/[\\\\\/\?\*\[\]:]+/u', ' ', get_string('templatesheetdata', 'local_groupimport'));
$sheet->setTitle(core_text::substr(trim($sheettitle), 0, 31));
$sheet->fromArray([
    [get_string('templatecolumnidentifier', 'local_groupimport'),
        get_string('templatecolumngroup', 'local_groupimport'),
        get_string('templatecolumngrouping', 'local_groupimport')],
    ['student.01@example.com', 'Project team A', 'Mathematics assignment'],
    ['student.02', 'Project team A', 'Mathematics assignment'],
    ['STUDENT-0003', 'Project team B', 'Mathematics assignment'],
], null, 'A1');

$sheet->freezePane('A2');
$sheet->setAutoFilter('A1:C4');
$sheet->getColumnDimension('A')->setWidth(31);
$sheet->getColumnDimension('B')->setWidth(25);
$sheet->getColumnDimension('C')->setWidth(31);
$sheet->getRowDimension(1)->setRowHeight(28);
$sheet->getStyle('A1:C1')->applyFromArray([
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 11],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '176FB8']],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
]);
$sheet->getStyle('A2:C4')->applyFromArray([
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F7FAFC']],
    'borders' => ['bottom' => ['borderStyle' => Border::BORDER_HAIR, 'color' => ['rgb' => 'D8E3EC']]],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
]);

$instructions = $spreadsheet->createSheet();
$instructionstitle = preg_replace(
    '/[\\\\\/\?\*\[\]:]+/u',
    ' ',
    get_string('templatesheetinstructions', 'local_groupimport')
);
$instructions->setTitle(core_text::substr(trim($instructionstitle), 0, 31));
$instructions->fromArray([
    [get_string('templateinstructionstitle', 'local_groupimport')],
    [get_string('templateinstructionsidentifier', 'local_groupimport')],
    [get_string('templateinstructionsmix', 'local_groupimport')],
    [get_string('templateinstructionsgroup', 'local_groupimport')],
    [get_string('templateinstructionsgrouping', 'local_groupimport')],
    [get_string('templateinstructionsreview', 'local_groupimport')],
], null, 'A1');
$instructions->getColumnDimension('A')->setWidth(105);
$instructions->getRowDimension(1)->setRowHeight(30);
$instructions->getStyle('A1')->applyFromArray([
    'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF'], 'size' => 14],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => '287A57']],
    'alignment' => ['vertical' => Alignment::VERTICAL_CENTER],
]);
$instructions->getStyle('A2:A6')->applyFromArray([
    'alignment' => ['wrapText' => true, 'vertical' => Alignment::VERTICAL_TOP],
    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => 'F3FAF6']],
]);
for ($row = 2; $row <= 6; $row++) {
    $instructions->getRowDimension($row)->setRowHeight(34);
}

$spreadsheet->setActiveSheetIndex(0);
$tempdir = make_temp_directory('local_groupimport');
$tempfile = $tempdir . DIRECTORY_SEPARATOR . uniqid('example_', true) . '.xlsx';
$writer = new Xlsx($spreadsheet);
$writer->save($tempfile);
$spreadsheet->disconnectWorksheets();
$content = file_get_contents($tempfile);
@unlink($tempfile);

if ($content === false) {
    throw new moodle_exception('cannotcreatetempfile', 'error');
}

// Send file via Moodle API.
send_file(
    $content,
    $filename,
    0,
    0,
    true,
    false,
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
);
