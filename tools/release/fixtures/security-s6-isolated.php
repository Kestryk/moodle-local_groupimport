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
// No Moodle bootstrap, runtime request or database connection.

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
require_once(__DIR__ . '/doubles/security_s6_isolated/global/fixture_security_s6_isolated_moodle_exception.php');
class_alias('fixture_security_s6_isolated_moodle_exception', 'moodle_exception');
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
use local_groupimport\local\import_reader as reader;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Writer\Xls;
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
/**
 * Perform isolated fixture operation rejects.
 * @param mixed $call Fixture argument.
 * @param mixed $label Fixture argument.
 * @return mixed Fixture result.
 */
function rejects($call, $label) {
    try {
        $call();
    } catch (moodle_exception$e) {
        check(true, $label);
        return;
    }throw new RuntimeException($label);
}
$requestdir = sys_get_temp_dir() . '/easystud-s6-' . bin2hex(random_bytes(8));
mkdir($requestdir);
$owned = [];
/**
 * Perform isolated fixture operation workbook.
 * @param Spreadsheet $book Fixture argument.
 * @param string $extension Fixture argument.
 * @return string Fixture result.
 */
function workbook(Spreadsheet $book, string $extension = 'xlsx'): string {
    $path = $GLOBALS['requestdir'] . '/fixture-' . bin2hex(random_bytes(5)) . '.' . $extension;
    $GLOBALS['owned'][] = $path;
    $writer = $extension === 'xlsx' ? new Xlsx($book) : new Xls($book);
    $writer->setPreCalculateFormulas(false);
    $writer->save($path);
    $content = file_get_contents($path);
    $book->disconnectWorksheets();
    return $content;
}
try {
    $csv = "identifier;groupname;groupingname\r\nu@example.test;Équipe été;Promotion\r\n";
    foreach (
        ['utf8' =>
         $csv,
         'bom' =>
         "\xEF\xBB\xBF" . $csv,
         'cp1252' =>
         mb_convert_encoding(
             $csv,
             'Windows-1252',
             'UTF-8'
         ),
         'utf16le' =>
         "\xFF\xFE" . mb_convert_encoding(
             $csv,
             'UTF-16LE',
             'UTF-8'
         ),
         'utf16be' =>
         "\xFE\xFF" . mb_convert_encoding(
             $csv,
             'UTF-16BE',
             'UTF-8'
         )] as $encoding => $data
    ) {
        $parsed = reader::csv($data);
        check($parsed['rows'][0] === ['u@example.test', 'Équipe été', 'Promotion'], $encoding . ' accents preserved');
    }
    $parsed = reader::csv("identifier;groupname;groupingname\nu@example.test;\"First\nSecond\";X\n");
    check(count($parsed['rows']) === 1 && $parsed['rows'][0][1] === "First\nSecond", 'Quoted multiline is one record');
    check(reader::csv("a,b,c\n1,\"G, H\",3\n")['rows'][0] === ['1', 'G, H', '3'], 'Quoted comma');
    check(reader::csv("a;b;c\n1;\"He said \"\"yes\"\"\";3\n")['rows'][0][1] === 'He said "yes"', 'Escaped quotes');
    check(reader::csv("a\tb\tc\n1\t2\t3\n")['rows'][0] === ['1', '2', '3'], 'TSV');
    check(reader::csv("\n\n a;b;c\r1;2;3\r")['header'] === ['a', 'b', 'c'], 'Blank preamble and CR newlines');
    $many = "identifier;groupname;groupingname\n";for ($i = 0; $i < 3000; $i++) {
        $many .= "u$i@example.test;G$i;X\n";
    }
    check(count(reader::csv($many)['rows']) === 3000, '3000 rows retained');
    $max = "a;b;c\n" . str_repeat("1;2;3\n", 5000);
    check(count(reader::csv($max)['rows']) === 5000, '5000 parser boundary');
    rejects(fn()=>reader::csv($max . "1;2;3\n"), '5001 data rows fail closed');
    rejects(fn()=>reader::csv("a;b;c\n1;\"unclosed\n"), 'Unclosed CSV rejected');
    rejects(fn()=>reader::csv("a;b;c\n1;x\"bad;3\n"), 'Invalid quote rejected');
    rejects(fn()=>reader::csv("a;b\n1;\x00binary"), 'Binary rejected');
    rejects(fn()=>reader::csv("\xFF\xFEA"), 'Broken UTF16 rejected');
    rejects(fn()=>reader::csv(str_repeat('a', 5242881)), 'Raw byte limit');
    rejects(fn()=>reader::csv(implode(';', array_fill(0, 65, 'a')) . "\n"), 'Column bound');
    rejects(fn()=>reader::csv(str_repeat(implode(';', array_fill(0, 64, 'x')) . "\n", 800)), 'CSV cell bound');
    rejects(fn()=>reader::csv("\n\n"), 'Empty rejected');
    check(
        reader::max_bytes(0) === 5242880 &&
         reader::max_bytes(1000) === 1000 &&
         reader::max_bytes(99999999) === 5242880,
        'Site/course/plugin byte cap'
    );
    $formats = ['xlsx'];
    if (class_exists(Xls::class)) {
        $formats[] = 'xls';
    } else {
        rejects(
            fn()=>
            reader::excel(
                'legacy placeholder',
                'legacy.xls'
            ),
            'Omitted native legacy XLS reader reports controlled failure'
        );
    }
    foreach ($formats as $extension) {
        $book = new Spreadsheet();
        $book->getActiveSheet()->fromArray([['identifier', 'groupname', 'groupingname'], ['u@example.test', 'Équipe été', 'X']]);
        $data = workbook($book, $extension);
        $before = glob($requestdir . '/import_*');
        $parsed = reader::excel($data, 'sample.' . $extension);
        check($parsed['rows'][0] === ['u@example.test', 'Équipe été', 'X'], 'Real ' . $extension . ' reader');
        check(glob($requestdir . '/import_*') === $before, $extension . ' request file cleanup');
    }
    $book = new Spreadsheet();
    $book->getActiveSheet()->setTitle('Unused')->fromArray([['wrong'], ['ignore']]);
    $sheet = $book->createSheet();
    $sheet->setTitle('Active')->fromArray([['a', 'b'], ['kept', 'value']]);
    $book->setActiveSheetIndex(1);
    $data = workbook($book);
    $nativepath = $requestdir . '/native.xlsx';
    $owned[] = $nativepath;
    file_put_contents($nativepath, $data);
    $native = \PhpOffice\PhpSpreadsheet\IOFactory::createReader('Xlsx');
    $native->setReadDataOnly(true);
    $baseline = $native->load($nativepath);
    $expected = $baseline->getActiveSheet()->toArray('', false, false, false);
    $baseline->disconnectWorksheets();
    check(
        reader::excel(
            $data,
            'active.xlsx'
        )['rows'][0] === array_map(
            'strval',
            $expected[1]
        ),
        'Native data-only active-sheet selection preserved'
    );
    $book = new Spreadsheet();
    $book->getActiveSheet()->fromArray([['a', 'b'], ['u', '=1+1']]);
    $parsed = reader::excel(workbook($book), 'formula.xlsx');
    check($parsed['rows'][0][1] === '=1+1', 'Formula not evaluated');
    rejects(fn()=>reader::excel('<html><table><tr><td>fake</td></tr></table></html>', 'fake.xls'), 'HTML-as-XLS rejected');
    rejects(fn()=>reader::excel('a;b\n1;2', 'fake.xlsx'), 'CSV-as-XLSX rejected');
    rejects(fn()=>reader::excel('anything', 'fake.ods'), 'Other reader formats rejected');
    check(glob($requestdir . '/import_*') === [], 'Exception cleanup');
    $book = new Spreadsheet();
    $book->getActiveSheet()->setCellValue('A1', 'header')->setCellValue('A5002', 'overflow');
    rejects(fn()=>reader::excel(workbook($book), 'rows.xlsx'), 'Excel row bound');
    $book = new Spreadsheet();
    $book->getActiveSheet()->setCellValue('BM1', 'too-wide');
    rejects(fn()=>reader::excel(workbook($book), 'cols.xlsx'), 'Excel column bound');
    $book = new Spreadsheet();
    $book->getActiveSheet()->setCellValue('A1', 'a')->setCellValue('BL1001', 'too-dense');
    rejects(fn()=>reader::excel(workbook($book), 'cells.xlsx'), 'Excel aggregate cell bound');
    foreach (['large', 'entries'] as $kind) {
        $path = $requestdir . '/zip-' . $kind . '.xlsx';
        $owned[] = $path;
        $zip = new ZipArchive();
        $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE);
        if ($kind === 'large') {
            $zip->addFromString(
                'oversized.xml',
                str_repeat(
                    'a',
                    10485761
                )
            );
        } else {
            for ($i = 0; $i < 257; $i++) {
                $zip->addFromString(
                    'entry' . $i,
                    'x'
                );
            }
        }
            $zip->close();
            rejects(fn()=>reader::excel(file_get_contents($path), 'bomb.xlsx'), 'XLSX ' . $kind . ' limit');
    }
    check(glob($requestdir . '/import_*') === [], 'All request input temporaries cleaned');
    echo json_encode(['suite' =>
         'S6-isolated-real-spreadsheets',
         'passed' =>
         true,
         'checks' =>
         $checks,
         'csvRows' =>
         3000,
         'confirmationCeilingUnchanged' =>
         1000,
         'realFormats' =>
         $formats,
         'legacyXlsReaderAvailable' =>
         class_exists('PhpOffice\\PhpSpreadsheet\\Reader\\Xls'),
         'databaseConnections' =>
         0,
         'runtimeAccess' =>
         false]) . PHP_EOL;
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
