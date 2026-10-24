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

namespace local_groupimport\service;

// phpcs:disable Generic.Classes.DuplicateClassName.Found -- Isolated worker mock of the native class.


/**
 * Controlled native boundary used only by this standalone worker test.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_transfer {
    /** @var int|null First user of a batch to reject. */
    public static ?int $failat = 501;
    /**
     * Apply an isolated batch or fail after a provisional mutation.
     */
    public static function move_members(int $courseid, int $destinationid, array $pairs): array {
        global $DB;
        foreach ($pairs as $pair) {
            $DB->moved[$pair['userid']] = true;
            if ($pair['userid'] === self::$failat) {
                throw new \RuntimeException('Injected native failure.');
            }
        }
        return ['added' => count($pairs), 'removed' => count($pairs), 'unchanged' => 0];
    }
}
