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
// Real XLSX serialization/read, private request fixtures, no Moodle bootstrap/runtime/DB.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require(__DIR__ . '/spreadsheet-libraries.php');
require_once(__DIR__ . '/doubles/r9_formatted_xlsx_isolated/global/fixture_r9_formatted_xlsx_isolated_moodle_exception.php');
class_alias('fixture_r9_formatted_xlsx_isolated_moodle_exception', 'moodle_exception');
/**
 * Perform isolated fixture operation make_request_directory.
 * @return mixed Fixture result.
 */
function make_request_directory() {
    return $GLOBALS['requestdir'];
}
$root = dirname(__DIR__, 3);
require($root . '/classes/local/import_preview.php');
require($root . '/classes/local/import_reader.php');
use local_groupimport\local\import_reader;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
$checks = 0;
/**
 * Perform isolated fixture operation check.
 * @param mixed $ok Fixture argument.
 * @param mixed $label Fixture argument.
 * @return mixed Fixture result.
 */
function check($ok, $label) {
    $GLOBALS['checks']++;
    if (!$ok) {
        throw new RuntimeException($label);
    }
}
$requestdir = sys_get_temp_dir() . '/easystud-r9-' . bin2hex(random_bytes(8));
mkdir($requestdir);
$owned = [];
/**
 * Perform isolated fixture operation amended.
 * @param string $bytes Fixture argument.
 * @param callable $patch Fixture argument.
 * @return string Fixture result.
 */
function amended(string $bytes, callable $patch): string {
    $path = $GLOBALS['requestdir'] . '/fixture-' . bin2hex(random_bytes(5)) . '.xlsx';
    $GLOBALS['owned'][] = $path;
    file_put_contents($path, $bytes);
    $zip = new ZipArchive();
    if ($zip->open($path) !== true) {
        throw new RuntimeException('ZIP open');
    }
    $xml = $zip->getFromName('xl/worksheets/sheet1.xml');
    $changed = $patch($xml);
    check($changed !== $xml, 'fixture amendment applied');
    $zip->addFromString('xl/worksheets/sheet1.xml', $changed);
    $zip->close();
    return file_get_contents($path);
}
/**
 * Perform isolated fixture operation rejected.
 * @param string $bytes Fixture argument.
 * @param string $name Fixture argument.
 * @param string $expected Fixture argument.
 * @return void Fixture result.
 */
function rejected(string $bytes, string $name, string $expected): void {
    try {
        import_reader::excel($bytes, $name);
    } catch (moodle_exception $e) {
        check($e->getMessage() === $expected, 'controlled ' . $expected);
        check(glob($GLOBALS['requestdir'] . '/import_*') === [], 'request cleanup after rejection');
        return;
    }
    throw new RuntimeException('Expected rejection ' . $name);
}
try {
    $book = new Spreadsheet();
    $sheet = $book->getActiveSheet();
    $sheet->fromArray([['identifier', 'groupname', 'groupingname'], ['u@example.test', 'Équipe', 'X']]);
    $sheet->getStyle('A1:C1')->getFont()->setBold(true);
    $path = $requestdir . '/seed.xlsx';
    $owned[] = $path;
    $writer = new Xlsx($book);
    $writer->setPreCalculateFormulas(false);
    $writer->save($path);
    $book->disconnectWorksheets();
    unset($writer, $book, $sheet);
    $seed = file_get_contents($path);
    $expected = ['header' => ['identifier', 'groupname', 'groupingname'], 'rows' => [['u@example.test', 'Équipe', 'X']]];
    check(import_reader::excel($seed, 'normal.xlsx') === $expected, 'normal workbook');
    $column = amended(
        $seed,
        static fn($xml)=>
        str_replace(
            '<sheetData>',
            '<cols><col min="1" max="16384" style="1"/></cols><sheetData>',
            $xml
        )
    );
    check(
        import_reader::excel(
            $column,
            'all-columns-styled.xlsx'
        ) === $expected,
        'entire column formatting does not materialize cells'
    );
    $dimension = amended(
        $column,
        static fn($xml)=>
        preg_replace(
            '/<dimension ref="[^"]*"\/>/',
            '<dimension ref="A1:XFD1048576"/>',
            $xml
        )
    );
    check(
        import_reader::excel(
            $dimension,
            'huge-dimension.xlsx'
        ) === $expected,
        'huge reported dimension with no cells stays bounded'
    );
    $blank = amended(
        $seed,
        static fn($xml)=>
        str_replace(
            '</sheetData>',
            '<row r="4000"><c r="A4000" s="1"/></row></sheetData>',
            $xml
        )
    );
    check(import_reader::excel($blank, 'styled-blank.xlsx') === $expected, 'within-bound empty formatted row skipped');
    $far = amended(
        $seed,
        static fn($xml)=>
        str_replace(
            '</sheetData>',
            '<row r="1048576"><c r="A1048576" s="1"/></row></sheetData>',
            $xml
        )
    );
    rejected($far, 'millionth-row.xlsx', 'importstructurelimit');
    $wide = amended($seed, static fn($xml)=>str_replace('</sheetData>', '<row r="3"><c r="XFD3" s="1"/></row></sheetData>', $xml));
    rejected($wide, 'far-column.xlsx', 'importstructurelimit');
    rejected(
        '<html><table><tr><td>x</td></tr></table></html>',
        'fake.xls',
        class_exists('PhpOffice\\PhpSpreadsheet\\Reader\\Xls') ? 'importformatinvalid' : 'importlegacyxlsunavailable'
    );
    rejected($seed, 'bad.ods', 'importformatinvalid');
    check(import_reader::max_bytes(1024) === 1024 && import_reader::max_bytes(0) === 5242880, 'course/site/plugin bytes bounded');
    $source = file_get_contents($root . '/classes/local/import_reader.php');
    check(
        str_contains(
            $source,
            '$reader->setReadEmptyCells(false);'
        ) &&
         str_contains(
             $source,
             '$reader->setReadDataOnly(true);'
         ),
        'native empty/data-only flags retained'
    );
    check(!str_contains($source, 'createReaderForFile'), 'no reader auto-detection');
    check(glob($requestdir . '/import_*') === [], 'successful request cleanup');
    echo json_encode(['surface' =>
         'r9-formatted-xlsx',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'maxTestedRow' =>
         1048576,
         'maxTestedColumn' =>
         16384,
         'peakMemoryBytes' =>
         memory_get_peak_usage(true),
         'runtimeAccess' =>
         false,
         'databaseConnections' =>
         0]),
         "\n";
} finally {
    foreach ($owned as $path) {
        if (is_file($path)) {
            unlink($path);
        }
    }
    foreach (glob($requestdir . '/import_*') as $path) {
        if (is_file($path)) {
            unlink($path);
        }
    }
    rmdir($requestdir);
}
