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
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * One text-only report cell policy, including headers and translated details.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class report_export {
    /**
     * Neutralize executable prefixes without numeric conversion or lost zeroes.
     * @param string $value Cell content.
     * @return string Literal text, with a leading apostrophe for unsafe prefixes.
     */
    public static function text(string $value): string {
        if (preg_match('/^(?:[\t\r\n]|[\p{Z}\s\x{FEFF}]*[=+\-@＝＋－＠])/u', $value) === 1) {
            return "'" . $value;
        }
        return $value;
    }

    /**
     * Write every cell explicitly as text; never invoke the automatic binder.
     * @param Worksheet $sheet Report sheet.
     * @param int $rownumber One-based row.
     * @param array $values Ordered report values.
     */
    public static function write_row(Worksheet $sheet, int $rownumber, array $values): void {
        foreach (array_values($values) as $index => $value) {
            $coordinate = Coordinate::stringFromColumnIndex($index + 1) . $rownumber;
            $sheet->setCellValueExplicit($coordinate, self::text((string)$value), DataType::TYPE_STRING);
        }
    }
}
