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

/**
 * Bound synchronous imports and commit memberships together with their history.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_execution {
    /** Temporary synchronous ceiling; larger imports must be split. */
    public const MAX_ROWS = 1000;

    /**
     * Execute the complete course mutation and history operation atomically.
     *
     * @param array $rows Confirmed import rows checked against the synchronous limit.
     * @param callable $operation Atomic mutation callback returning a positive import history id.
     * @return int Committed import history id.
     * @throws \moodle_exception If the row limit is exceeded or the callback returns no history id.
     */
    public static function run(array $rows, callable $operation): int {
        global $DB;
        if (count($rows) > self::MAX_ROWS) {
            throw new \moodle_exception('importrowlimit', 'local_groupimport', '', self::MAX_ROWS);
        }
        \core_php_time_limit::raise(120);
        $transaction = $DB->start_delegated_transaction();
        try {
            $historyid = $operation();
            if ($historyid <= 0) {
                throw new \moodle_exception('importatomicfailed', 'local_groupimport');
            }
            $transaction->allow_commit();
            return $historyid;
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
            throw $exception;
        }
    }
}
