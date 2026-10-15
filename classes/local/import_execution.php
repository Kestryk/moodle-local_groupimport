<?php
// This file is part of Moodle - https://moodle.org/
// Moodle is distributed under the GNU GPL v3 or later.

namespace local_groupimport\local;

defined('MOODLE_INTERNAL') || die();

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

    /** Execute the complete course mutation and history operation atomically. */
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
