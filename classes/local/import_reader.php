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

use PhpOffice\PhpSpreadsheet\Cell\Coordinate;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Reader\IReadFilter;

/**
 * Bounded import decoding; never silently truncate a file or calculate formulas.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_reader {
    /** Maximum source columns. */
    public const MAX_COLUMNS = 64;
    /** Maximum cells across a workbook/CSV including its header. */
    public const MAX_CELLS = 50000;

    /**
     * Combine the existing plugin cap with Moodle's effective course limit.
     * @param int $moodlelimit Effective upload limit, zero means unlimited.
     * @return int
     */
    public static function max_bytes(int $moodlelimit): int {
        return $moodlelimit > 0 ? min($moodlelimit, import_preview::MAX_BYTES) : import_preview::MAX_BYTES;
    }

    /**
     * Check raw and decoded byte bounds before constructing row/cell arrays.
     * @param string $content Input.
     */
    private static function check_bytes(string $content): void {
        if (strlen($content) > import_preview::MAX_BYTES) {
            throw new \moodle_exception('importfilelimit', 'local_groupimport', '', 5);
        }
    }

    /**
     * Decode UTF-8, BOM UTF-16, or valid Windows-1252 without replacement bytes.
     * @param string $content Raw text.
     * @return string UTF-8 text with normalized newlines.
     */
    public static function decode_csv(string $content): string {
        self::check_bytes($content);
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }
        if (str_starts_with($content, "\xFF\xFE") || str_starts_with($content, "\xFE\xFF")) {
            $encoding = str_starts_with($content, "\xFF\xFE") ? 'UTF-16LE' : 'UTF-16BE';
            $content = substr($content, 2);
            if (!mb_check_encoding($content, $encoding)) {
                throw new \moodle_exception('importencodingerror', 'local_groupimport');
            }
            $content = mb_convert_encoding($content, 'UTF-8', $encoding);
        } else if (!mb_check_encoding($content, 'UTF-8')) {
            if (!mb_check_encoding($content, 'Windows-1252')) {
                throw new \moodle_exception('importencodingerror', 'local_groupimport');
            }
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        }
        if (preg_match('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', $content)) {
            throw new \moodle_exception('importencodingerror', 'local_groupimport');
        }
        self::check_bytes($content);
        return str_replace(["\r\n", "\r"], "\n", $content);
    }

    /**
     * Fail closed on unterminated/invalid quoted fields and excessive columns.
     * @param string $content Decoded CSV.
     * @param string $delimiter Separator.
     */
    private static function validate_quotes(string $content, string $delimiter): void {
        $state = 'start';
        $columns = 1;
        for ($i = 0, $length = strlen($content); $i < $length; $i++) {
            $char = $content[$i];
            if ($state === 'quoted') {
                if ($char === '"') {
                    $state = 'closed';
                }
            } else if ($state === 'closed' && $char === '"') {
                $state = 'quoted';
            } else if ($char === $delimiter || $char === "\n") {
                $columns = $char === "\n" ? 1 : $columns + 1;
                if ($columns > self::MAX_COLUMNS) {
                    throw new \moodle_exception('importstructurelimit', 'local_groupimport');
                }
                $state = 'start';
            } else if ($state === 'start' && $char === '"') {
                $state = 'quoted';
            } else if ($char !== ' ' && $char !== "\t") {
                if ($state === 'closed' || $char === '"') {
                    throw new \moodle_exception('importcsvinvalid', 'local_groupimport');
                }
                $state = 'plain';
            }
        }
        if ($state === 'quoted') {
            throw new \moodle_exception('importcsvinvalid', 'local_groupimport');
        }
    }

    /**
     * Parse logical CSV records, including quoted embedded newlines.
     * @param string $content Raw content.
     * @return array Header and all data rows.
     */
    public static function csv(string $content): array {
        $content = self::decode_csv($content);
        $stream = fopen('php://temp/maxmemory:1048576', 'w+b');
        if (!$stream) {
            throw new \moodle_exception('cannotcreatetempfile', 'error');
        }
        try {
            if (fwrite($stream, $content) !== strlen($content)) {
                throw new \moodle_exception('cannotcreatetempfile', 'error');
            }
            rewind($stream);
            $first = '';
            while (($line = fgets($stream)) !== false) {
                if (trim($line) !== '') {
                    $first = $line;
                    break;
                }
            }
            $delimiter = ';';
            $width = 0;
            foreach ([';', ',', "\t"] as $candidate) {
                $count = count(str_getcsv($first, $candidate, '"', ''));
                if ($count > $width) {
                    $delimiter = $candidate;
                    $width = $count;
                }
            }
            self::validate_quotes($content, $delimiter);
            rewind($stream);
            $header = [];
            $rows = [];
            $cells = 0;
            while (($row = fgetcsv($stream, 0, $delimiter, '"', '')) !== false) {
                $row = array_map(static fn($value) => trim((string)$value), $row);
                if (!array_filter($row, static fn($value) => $value !== '')) {
                    continue;
                }
                $cells += count($row);
                if ($cells > self::MAX_CELLS || count($row) > self::MAX_COLUMNS) {
                    throw new \moodle_exception('importstructurelimit', 'local_groupimport');
                }
                if (!$header) {
                    $header = $row;
                } else {
                    $rows[] = $row;
                    if (count($rows) > import_preview::MAX_ROWS) {
                        throw new \moodle_exception('importrowlimit', 'local_groupimport', '', import_preview::MAX_ROWS);
                    }
                }
            }
            if (!$header) {
                throw new \moodle_exception('csvempty', 'local_groupimport');
            }
            return ['header' => $header, 'rows' => $rows];
        } finally {
            fclose($stream);
        }
    }

    /**
     * Bound expanded XLSX entries before any XML/worksheet reader is invoked.
     * @param string $path Request-owned workbook.
     */
    private static function validate_zip(string $path): void {
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            throw new \moodle_exception('importformatinvalid', 'local_groupimport');
        }
        try {
            $total = 0;
            if ($zip->numFiles > 256) {
                throw new \moodle_exception('importstructurelimit', 'local_groupimport');
            }
            for ($i = 0; $i < $zip->numFiles; $i++) {
                $entry = $zip->statIndex($i);
                if (!$entry || $entry['size'] > 10485760 || ($total += $entry['size']) > 20971520) {
                    throw new \moodle_exception('importstructurelimit', 'local_groupimport');
                }
            }
        } finally {
            $zip->close();
        }
    }

    /**
     * Read only genuine XLS/XLSX through explicit readers with bounded sheets/cells.
     * @param string $content Uploaded bytes.
     * @param string $filename Original name (extension only).
     * @return array Header and data rows; formulas are never evaluated.
     */
    public static function excel(string $content, string $filename): array {
        self::check_bytes($content);
        $extension = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (!in_array($extension, ['xls', 'xlsx'], true)) {
            throw new \moodle_exception('importformatinvalid', 'local_groupimport');
        }
        $path = tempnam(make_request_directory(), 'import_');
        $spreadsheet = null;
        try {
            if ($path === false || file_put_contents($path, $content) !== strlen($content)) {
                throw new \moodle_exception('cannotcreatetempfile', 'error');
            }
            if ($extension === 'xlsx') {
                self::validate_zip($path);
            }
            // Some Moodle packages deliberately omit the legacy XLS reader.
            if ($extension === 'xls' && !class_exists('PhpOffice\\PhpSpreadsheet\\Reader\\Xls')) {
                throw new \moodle_exception('importlegacyxlsunavailable', 'local_groupimport');
            }
            $reader = IOFactory::createReader($extension === 'xlsx' ? 'Xlsx' : 'Xls');
            if (!$reader->canRead($path)) {
                throw new \moodle_exception('importformatinvalid', 'local_groupimport');
            }
            $info = $reader->listWorksheetInfo($path);
            $cells = 0;
            if (!$info || count($info) > 16) {
                throw new \moodle_exception('importstructurelimit', 'local_groupimport');
            }
            foreach ($info as $sheet) {
                $cells += $sheet['totalRows'] * $sheet['totalColumns'];
                if (
                    $sheet['totalRows'] > import_preview::MAX_ROWS + 1 || $sheet['totalColumns'] > self::MAX_COLUMNS ||
                        $cells > self::MAX_CELLS
                ) {
                    throw new \moodle_exception('importstructurelimit', 'local_groupimport');
                }
            }
            $overflow = false;
            $reader->setReadFilter(new class ($overflow) implements IReadFilter {
                /** @var bool Native reader attempted data beyond validated bounds. */
                private $overflow;
                /**
                 * Keep a fail-closed signal for the parent reader.
                 * @param bool $overflow Overflow signal.
                 */
                public function __construct(bool &$overflow) {
                    $this->overflow =& $overflow;
                }
                // phpcs:disable moodle.NamingConventions.ValidFunctionName.LowercaseMethod -- IReadFilter API.
                /**
                 * Apply the bounded native reader interface.
                 * @param string $columnaddress Column.
                 * @param int $row Row.
                 * @param string $worksheetname Sheet.
                 * @return bool
                 */
                public function readCell(string $columnaddress, int $row, string $worksheetname = ''): bool {
                    if (
                        $row > import_preview::MAX_ROWS + 1 ||
                            Coordinate::columnIndexFromString($columnaddress) > import_reader::MAX_COLUMNS
                    ) {
                        $this->overflow = true;
                        return false;
                    }
                    return true;
                }
                // phpcs:enable moodle.NamingConventions.ValidFunctionName.LowercaseMethod
            });
            $reader->setReadDataOnly(true);
            $reader->setReadEmptyCells(false);
            $spreadsheet = $reader->load($path);
            if ($overflow) {
                throw new \moodle_exception('importstructurelimit', 'local_groupimport');
            }
            $rawrows = $spreadsheet->getActiveSheet()->toArray('', false, false, false);
            $header = [];
            $rows = [];
            foreach ($rawrows as $rawrow) {
                $row = array_map(static fn($value) => trim((string)$value), $rawrow);
                if (!array_filter($row, static fn($value) => $value !== '')) {
                    continue;
                }
                if (!$header) {
                    $header = $row;
                } else {
                    $rows[] = $row;
                }
            }
            if (!$header) {
                throw new \moodle_exception('csvempty', 'local_groupimport');
            }
            return ['header' => $header, 'rows' => $rows];
        } finally {
            if ($spreadsheet !== null) {
                $spreadsheet->disconnectWorksheets();
            }
            if (is_string($path) && is_file($path)) {
                unlink($path);
            }
        }
    }
}
