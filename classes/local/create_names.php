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

namespace local_groupimport\local;

/**
 * Single bounded quick-create name parser for POST and AJAX.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class create_names {
    /**
     * Extract group or grouping names from a separated quick-create field.
     *
     * @param string $text Raw field value.
     * @return array
     */
    public static function extract(string $text): array {
        if (\core_text::strlen($text) > 131072) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        $total = 0;
        $parts = preg_split('/[\r\n,;|]+/u', $text);
        $names = [];
        foreach ($parts ?: [] as $part) {
            $part = trim($part);
            if ($part === '') {
                continue;
            }

            if (preg_match('/^(.*?)([#@])\s*\*\s*(\d+)$/u', $part, $matches)) {
                $prefix = rtrim($matches[1]);
                $marker = $matches[2];
                $count = max(0, min(200, (int)$matches[3]));
                $total += $count;
                if ($total > \local_groupimport\local\ajax_security::MAX_NAMES) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                for ($index = 1; $index <= $count; $index++) {
                    $suffix = $marker === '#' ? (string)$index : self::number_to_letters($index);
                    $names[] = trim($prefix . ' ' . $suffix);
                }
                continue;
            }

            if (++$total > \local_groupimport\local\ajax_security::MAX_NAMES) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            $names[] = $part;
        }

        foreach ($names as $name) {
            \local_groupimport\local\ajax_security::validate_name($name);
        }
        return array_values(array_unique($names));
    }

    /**
     * Convert a 1-based number into A, B, ..., Z, AA, AB...
     *
     * @param int $number Number.
     * @return string
     */
    public static function number_to_letters(int $number): string {
        $letters = '';
        while ($number > 0) {
            $number--;
            $letters = chr(65 + ($number % 26)) . $letters;
            $number = intdiv($number, 26);
        }
        return $letters;
    }
}
