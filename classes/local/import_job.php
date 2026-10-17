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
 * Resumable imports: nextrow, memberships and reversible history commit together.
 *
 * Pending personal data lives in the existing Privacy-aware history report rows.
 * Each row has an immutable position, so erasing a subject cannot shift a nextrow.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_job {
    /** Number of rows committed in one transaction. */
    public const BATCH_SIZE = 100;

    /**
     * Return the configurable safety ceiling, still bounded by file/cell limits.
     * @return int
     */
    public static function max_rows(): int {
        $configured = get_config('local_groupimport', 'importmaxrows');
        return min(100000, max(1, $configured === false ? 50000 : (int)$configured));
    }

    /**
     * Persist an owner-authorised preview and enqueue its native adhoc task.
     * @param array $rows Confirmed rows.
     * @param \stdClass $course Course.
     * @param int $userid Requesting user.
     * @param string $filename Original filename.
     * @param string $filehash Original content hash.
     * @param string $policy Keep or replace.
     * @return int Job id.
     */
    public static function queue(
        array $rows,
        \stdClass $course,
        int $userid,
        string $filename,
        string $filehash,
        string $policy
    ): int {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/local/groupimport/importlib.php');
        require_capability('moodle/course:managegroups', \context_course::instance($course->id), $userid);
        if (!$rows || count($rows) > self::max_rows() || !in_array($policy, ['keep', 'replace'], true)) {
            throw new \moodle_exception('importrowlimit', 'local_groupimport', '', self::max_rows());
        }
        // Populate the batched lookup cache before assigning Privacy subject IDs.
        $subjects = local_groupimport_find_import_users(
            array_column($rows, 'identifier'),
            \context_course::instance($course->id)
        );
        $pending = [];
        foreach (array_values($rows) as $position => $row) {
            $subject = $subjects[$row['identifier']]['user'] ?? null;
            $pending[] = [
                'position' => $position,
                'identifier' => (string)$row['identifier'],
                'groupname' => (string)$row['groupname'],
                'groupingname' => (string)$row['groupingname'],
                'userid' => $subject ? (int)$subject->id : 0,
                'status' => 'pending',
                'messages' => [],
            ];
        }
        $transaction = $DB->start_delegated_transaction();
        try {
            $historyid = local_groupimport_record_import_history(
                (int)$course->id,
                $userid,
                $filename,
                $filehash,
                count($rows),
                0,
                0,
                $policy,
                ['reportrows' => $pending],
                false
            );
            if (!$historyid) {
                throw new \moodle_exception('importatomicfailed', 'local_groupimport');
            }
            $jobid = (int)$DB->insert_record('local_groupimport_jobs', (object)[
            'historyid' => $historyid,
            'status' => 'queued',
            'nextrow' => 0,
            'timecreated' => time(),
            'timemodified' => time(),
            ]);
            $task = new \local_groupimport\task\background_import();
            $task->set_userid($userid);
            $task->set_custom_data(['jobid' => $jobid]);
            \core\task\manager::queue_adhoc_task($task, true);
            $transaction->allow_commit();
            return $jobid;
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
            throw $exception;
        }
    }

    /**
     * Execute committed batches; Moodle retries failures from the stored nextrow.
     * @param int $jobid Job id.
     * @return void
     */
    public static function execute(int $jobid): void {
        global $CFG, $DB;
        require_once($CFG->dirroot . '/group/lib.php');
        require_once($CFG->dirroot . '/local/groupimport/importlib.php');
        $job = $DB->get_record('local_groupimport_jobs', ['id' => $jobid]);
        if (!$job) {
            return;
        }
        $history = $DB->get_record('local_groupimport_history', ['id' => $job->historyid]);
        if (!$history) {
            $DB->delete_records('local_groupimport_jobs', ['id' => $jobid]);
            return;
        }
        $factory = \core\lock\lock_config::get_lock_factory('local_groupimport');
        $lock = $factory->get_lock('importcourse_' . $history->courseid, 0);
        if (!$lock) {
            throw new \moodle_exception('importjobbusy', 'local_groupimport');
        }
        $started = microtime(true);
        try {
            $course = get_course((int)$history->courseid);
            $user = \core_user::get_user((int)$history->userid, '*', MUST_EXIST);
            if ($user->deleted || $user->suspended || $history->timerolledback) {
                $DB->set_field('local_groupimport_jobs', 'status', 'cancelled', ['id' => $jobid]);
                return;
            }
            \core\cron::setup_user($user, $course);
            $context = \context_course::instance($course->id);
            require_capability('moodle/course:managegroups', $context);
            if ($job->status === 'completed') {
                self::notify($job, $history);
                return;
            }
            if ($job->status === 'cancelled') {
                return;
            }
            $DB->set_field('local_groupimport_jobs', 'status', 'running', ['id' => $jobid]);
            do {
                $remaining = self::batch($jobid, $context, $course);
            } while ($remaining);
            $job = $DB->get_record('local_groupimport_jobs', ['id' => $jobid], '*', MUST_EXIST);
            $history = $DB->get_record('local_groupimport_history', ['id' => $job->historyid], '*', MUST_EXIST);
            self::notify($job, $history);
        } catch (\Throwable $exception) {
            // Do not persist exception text or personal identifiers in a progress response.
            if ($DB->get_field('local_groupimport_jobs', 'status', ['id' => $jobid]) !== 'completed') {
                $DB->set_field('local_groupimport_jobs', 'status', 'retry', ['id' => $jobid]);
            }
            $DB->execute('UPDATE {local_groupimport_jobs} SET failcount = failcount + 1 WHERE id = ?', [$jobid]);
            throw $exception;
        } finally {
            $DB->execute(
                'UPDATE {local_groupimport_jobs} SET elapsedms = elapsedms + ?, peakbytes = ?, timemodified = ? WHERE id = ?',
                [(int)round((microtime(true) - $started) * 1000), memory_get_peak_usage(true), time(), $jobid]
            );
            $lock->release();
        }
    }

    /**
     * Apply one bounded batch, with history and nextrow in the same transaction.
     * @param int $jobid Job id.
     * @param \context_course $context Course context.
     * @param \stdClass $course Course record.
     * @return bool Whether another batch remains.
     */
    private static function batch(int $jobid, \context_course $context, \stdClass $course): bool {
        global $DB;
        $transaction = $DB->start_delegated_transaction();
        try {
            $job = $DB->get_record('local_groupimport_jobs', ['id' => $jobid], '*', MUST_EXIST);
            $history = $DB->get_record('local_groupimport_history', ['id' => $job->historyid], '*', MUST_EXIST);
            $changes = history_privacy::decode($history->changesjson);
            if ($job->status === 'cancelled' || $history->timerolledback) {
                $transaction->allow_commit();
                return false;
            }
            $rows = [];
            $positions = [];
            foreach ($changes['reportrows'] ?? [] as $row) {
                if (($row['position'] ?? -1) >= $job->nextrow && $row['status'] === 'pending') {
                    $positions[] = (int)$row['position'];
                    $rows[] = $row;
                    if (count($rows) === self::BATCH_SIZE) {
                        break;
                    }
                }
            }
            if (!$rows) {
                if ($history->replacepolicy === 'replace') {
                    self::replace($changes, $course);
                }
                $history->changesjson = json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                $DB->update_record('local_groupimport_history', $history);
                $DB->update_record('local_groupimport_jobs', (object)[
                'id' => $jobid, 'status' => 'completed', 'nextrow' => $history->rowcount, 'timemodified' => time(),
                ]);
                \local_groupimport\event\import_applied::create([
                'objectid' => (int)$history->id,
                'context' => $context,
                ])->trigger();
                $transaction->allow_commit();
                return false;
            }
            $success = [];
            $errors = [];
            local_groupimport_find_import_users(array_column($rows, 'identifier'), $context);
            $effective = [];
            $effectivepositions = [];
            foreach ($rows as $offset => $row) {
                if (
                    local_groupimport_clean_cell($row['identifier']) !== '' ||
                    local_groupimport_clean_cell($row['groupname']) !== ''
                ) {
                    $effective[] = $row;
                    $effectivepositions[] = $positions[$offset];
                }
            }
            $applied = local_groupimport_process_import_rows($effective, $course, $context, $success, $errors, 'keep');
            $reports = [];
            foreach ($effectivepositions as $offset => $position) {
                $reports[$position] = $applied['reportrows'][$offset];
            }
            foreach ($changes['reportrows'] as &$stored) {
                $offset = array_search((int)($stored['position'] ?? -1), $positions, true);
                if ($offset !== false) {
                    $position = $positions[$offset];
                    $stored = ($reports[$position] ?? [
                    'identifier' => '', 'groupname' => '', 'groupingname' => '',
                    'status' => 'warning', 'messages' => [get_string('importnorowsselected', 'local_groupimport')],
                    ]) + ['position' => $position];
                }
            }
            unset($stored);
            foreach ($applied as $key => $values) {
                if ($key !== 'reportrows') {
                    $changes[$key] = array_merge($changes[$key] ?? [], $values);
                }
            }
            $history->successcount += count($success);
            $history->errorcount += count($errors);
            $history->changesjson = json_encode($changes, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
            $DB->update_record('local_groupimport_history', $history);
            $DB->update_record('local_groupimport_jobs', (object)[
            'id' => $jobid, 'nextrow' => max($positions) + 1, 'timemodified' => time(),
            ]);
            $transaction->allow_commit();
            return true;
        } catch (\Throwable $exception) {
            try {
                $transaction->rollback($exception);
            } finally {
                \cache_helper::invalidate_by_definition('core', 'groupdata', [], [(int)$course->id]);
            }
            throw $exception;
        }
    }

    /**
     * Apply replacement only after every row contributed to the target union.
     * @param array $changes Committed desired state and reversible changes.
     * @param \stdClass $course Course.
     * @return void
     */
    private static function replace(array &$changes, \stdClass $course): void {
        global $DB;
        $targets = [];
        $groups = [];
        $groupings = [];
        foreach ($changes['desiredstate'] ?? [] as $row) {
            $name = $row['groupname'];
            if (!array_key_exists($name, $groups)) {
                $groups[$name] = $DB->get_record('groups', ['courseid' => $course->id, 'name' => $name]);
            }
            $group = $groups[$name];
            if (!$group) {
                continue;
            }
            $groupid = (int)$group->id;
            $targets[$groupid]['members'][(int)$row['userid']] = true;
            if ($row['groupingname'] !== '') {
                $name = $row['groupingname'];
                if (!array_key_exists($name, $groupings)) {
                    $groupings[$name] = $DB->get_record('groupings', ['courseid' => $course->id, 'name' => $name]);
                }
                $grouping = $groupings[$name];
                if ($grouping) {
                    $targets[$groupid]['groupings'][(int)$grouping->id] = true;
                }
            }
        }
        foreach ($targets as $groupid => $target) {
            $members = $DB->get_recordset('groups_members', ['groupid' => $groupid]);
            try {
                foreach ($members as $member) {
                    if (isset($target['members'][(int)$member->userid])) {
                        continue;
                    }
                    if (
                        !groups_remove_member_allowed($groupid, $member->userid) ||
                            !groups_remove_member($groupid, $member->userid)
                    ) {
                        throw new \moodle_exception('invaliddata', 'error');
                    }
                    $changes['removedmembers'][] = ['groupid' => $groupid, 'userid' => (int)$member->userid];
                }
            } finally {
                $members->close();
            }
            foreach ($DB->get_records('groupings_groups', ['groupid' => $groupid]) as $assignment) {
                if (!isset($target['groupings'][(int)$assignment->groupingid])) {
                    groups_unassign_grouping($assignment->groupingid, $groupid);
                    $changes['unassignedgroupings'][] = [
                        'groupid' => $groupid, 'groupingid' => (int)$assignment->groupingid,
                    ];
                }
            }
        }
    }

    /**
     * Send a Moodle notification after completion; retry an undelivered message.
     * @param \stdClass $job Completed job.
     * @param \stdClass $history History record.
     * @return void
     */
    private static function notify(\stdClass $job, \stdClass $history): void {
        global $DB;
        if ($job->status !== 'completed' || $job->timenotified) {
            return;
        }
        $transaction = $DB->start_delegated_transaction();
        try {
            $message = new \core\message\message();
            $message->component = 'local_groupimport';
            $message->name = 'importcomplete';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = \core_user::get_user((int)$history->userid);
            $message->subject = get_string('importjobcomplete', 'local_groupimport');
            $message->fullmessage = get_string('importjobcompletemessage', 'local_groupimport', (object)[
            'rows' => $history->rowcount, 'errors' => $history->errorcount,
            ]);
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '';
            $message->smallmessage = $message->fullmessage;
            $message->notification = 1;
            $message->contexturl = (new \moodle_url('/local/groupimport/index.php', ['id' => $history->courseid]))->out(false);
            $message->contexturlname = get_string('groupimport', 'local_groupimport');
            if (!message_send($message)) {
                throw new \moodle_exception('importjobnotificationfailed', 'local_groupimport');
            }
            $DB->set_field('local_groupimport_jobs', 'timenotified', time(), ['id' => $job->id]);
            $transaction->allow_commit();
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
            throw $exception;
        }
    }
}
