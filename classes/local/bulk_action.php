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
 * Bounded native group writes in one delegated database transaction.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class bulk_action {
    /** Maximum submitted items, including duplicates. */
    public const MAX_ITEMS = 500;

    /**
     * Reject oversized input before lookups or mutations.
     * @param int $count Submitted item count.
     */
    public static function validate_size(int $count): void {
        if ($count < 0 || $count > self::MAX_ITEMS) {
            throw new \moodle_exception('bulkactionlimit', 'local_groupimport', '', self::MAX_ITEMS);
        }
    }

    /**
     * Keep native mutation APIs/events while committing only a complete batch.
     * @param int $count Submitted item count.
     * @param callable $operation Native operations, with existing validation.
     * @return mixed Callback result.
     */
    public static function run(int $count, callable $operation) {
        global $DB;
        self::validate_size($count);
        \core_php_time_limit::raise(180);
        $transaction = $DB->start_delegated_transaction();
        try {
            $result = $operation();
            $transaction->allow_commit();
            return $result;
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
            throw $exception;
        }
    }
}
