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

namespace local_groupimport\task;

/**
 * Expire personal import history without changing course memberships.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class purge_import_history extends \core\task\scheduled_task {
    /**
     * Localized scheduled-task name.
     * @return string
     */
    public function get_name(): string {
        return get_string('taskpurgeimporthistory', 'local_groupimport');
    }

    /**
     * A missing or invalid setting never causes an unexpectedly short retention.
     * @return int Days, one year by default.
     */
    public static function retention_days(): int {
        $value = get_config('local_groupimport', 'historyretentiondays');
        return ctype_digit((string)$value) && (int)$value >= 1 && (int)$value <= 36500 ? (int)$value : 365;
    }

    /**
     * Delete only expired history. Rollback and course data are not executed.
     * @return void
     */
    public function execute(): void {
        global $DB;
        $cutoff = time() - self::retention_days() * DAYSECS;
        $expired = $DB->get_recordset_select('local_groupimport_history', 'timecreated < :cutoff', ['cutoff' => $cutoff]);
        try {
            foreach ($expired as $history) {
                $lock = \core\lock\lock_config::get_lock_factory('local_groupimport')->get_lock(
                    'importcourse_' . $history->courseid,
                    5
                );
                if (!$lock) {
                    continue;
                }
                try {
                    $DB->delete_records('local_groupimport_jobs', ['historyid' => $history->id]);
                    $DB->delete_records('local_groupimport_history', ['id' => $history->id]);
                } finally {
                    $lock->release();
                }
            }
        } finally {
            $expired->close();
        }
        $DB->delete_records_select(
            'local_groupimport_jobs',
            'NOT EXISTS (SELECT 1 FROM {local_groupimport_history} h WHERE h.id = historyid)'
        );
    }
}
