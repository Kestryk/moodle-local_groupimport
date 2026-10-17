<?php
// This file is part of Moodle - https://moodle.org/
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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_groupimport\local;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

/**
 * Tests for bounded CSV and spreadsheet import reading.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \local_groupimport\local\import_reader
 */
final class import_reader_test extends \basic_testcase {
    /**
     * CSV headers and rows are parsed without changing identifiers.
     */
    public function test_csv_rows_are_parsed(): void {
        $csv = "identifier;groupname\n00123;Group A\nu@example.test;\"Group; B\"\n";
        $this->assertSame([
            'header' => ['identifier', 'groupname'],
            'rows' => [['00123', 'Group A'], ['u@example.test', 'Group; B']],
        ], import_reader::csv($csv));
    }

    /**
     * The untyped implementation can satisfy both the Moodle 4.5 and newer interfaces.
     */
    public function test_read_cell_declaration_remains_compatible_with_both_interfaces(): void {
        $source = file_get_contents(__DIR__ . '/../../classes/local/import_reader.php');
        $this->assertNotFalse($source);
        $this->assertSame(1, preg_match(
            '/function\s+readCell\s*\(\s*\$columnaddress\s*,\s*\$row\s*,\s*\$worksheetname\s*=\s*\'\'\s*\)\s*:\s*bool/',
            $source
        ));
    }

    /**
     * An XLSX workbook is read through the active PhpSpreadsheet IReadFilter contract.
     */
    public function test_xlsx_workbook_is_read_with_bounded_filter(): void {
        $path = tempnam(make_request_directory(), 'tri19_');
        if ($path === false) {
            $this->fail('Could not create a temporary workbook.');
        }

        $spreadsheet = new Spreadsheet();
        try {
            $spreadsheet->getActiveSheet()->fromArray([
                ['identifier', 'groupname'],
                ['00123', 'Group A'],
            ], null, 'A1');
            (new Xlsx($spreadsheet))->save($path);
            $content = file_get_contents($path);
            $this->assertNotFalse($content);
            $this->assertSame([
                'header' => ['identifier', 'groupname'],
                'rows' => [['00123', 'Group A']],
            ], import_reader::excel($content, 'tri19.xlsx'));
        } finally {
            $spreadsheet->disconnectWorksheets();
            if (is_file($path)) {
                unlink($path);
            }
        }
    }

    /**
     * XLS input is rejected with a documented plugin error when it cannot be read.
     */
    public function test_xls_input_is_rejected_explicitly(): void {
        try {
            import_reader::excel('not an Excel workbook', 'tri19.xls');
        } catch (\moodle_exception $exception) {
            $this->assertContains($exception->errorcode, ['importlegacyxlsunavailable', 'importformatinvalid']);
            return;
        }

        $this->fail('Invalid XLS data must be refused.');
    }
}
