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
 * Durable member transfers: native mutations and progress commit together.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class move_job {
    /** Maximum pairs in the direct request and each atomic worker batch. */
    public const BATCH_SIZE = 500;

    /**
     * Validate the whole selection with grouped reads before enqueuing anything.
     * Managed-membership callbacks are the same ones used by Moodle's removal API.
     * @param int $courseid Course id.
     * @param int $destinationid Destination group.
     * @param array $members Source group/user pairs.
     * @return array Deduplicated and sorted pairs.
     */
    public static function validate(int $courseid, int $destinationid, array $members): array {
        global $DB;
        $context = \context_course::instance($courseid);
        require_capability('moodle/course:managegroups', $context);
        if (!$members || count($members) > import_job::max_rows()) {
            throw new \moodle_exception('importrowlimit', 'local_groupimport', '', import_job::max_rows());
        }
        $pairs = [];
        foreach ($members as $pair) {
            if (!is_array($pair)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            foreach (['groupid', 'userid'] as $key) {
                $value = $pair[$key] ?? null;
                if ((!is_int($value) && (!is_string($value) || !ctype_digit($value))) || (int)$value <= 0) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
            }
            $groupid = (int)$pair['groupid'];
            $userid = (int)$pair['userid'];
            $pairs[$groupid . ':' . $userid] = ['groupid' => $groupid, 'userid' => $userid];
        }
        $groups = batch_reader::records(
            'groups',
            array_merge([$destinationid], array_column($pairs, 'groupid')),
            ['courseid' => $courseid]
        );
        if (!isset($groups[$destinationid])) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }
        $enrolled = batch_reader::enrolled($context);
        $memberships = $DB->get_records_sql(
            'SELECT m.* FROM {groups_members} m JOIN {groups} g ON g.id = m.groupid WHERE g.courseid = ?',
            [$courseid]
        );
        $bygroup = [];
        foreach ($memberships as $entry) {
            $bygroup[(int)$entry->groupid][(int)$entry->userid] = $entry;
        }
        foreach ($pairs as $pair) {
            $groupid = $pair['groupid'];
            $userid = $pair['userid'];
            $entry = $bygroup[$groupid][$userid] ?? null;
            if (!isset($groups[$groupid]) || !$entry || !isset($enrolled[$userid])) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            if (
                $groupid !== $destinationid && !empty($entry->component) && !component_callback(
                    $entry->component,
                    'allow_group_member_remove',
                    [$entry->itemid, $groupid, $userid],
                    true
                )
            ) {
                throw new \moodle_exception('invaliddata', 'error');
            }
        }
        ksort($pairs, SORT_STRING);
        return array_values($pairs);
    }

    /**
     * Queue once per action token and coalesce identical active selections.
     * @param int $courseid Course.
     * @param int $destinationid Destination.
     * @param array $members Selected pairs.
     * @param string $requestid Stable client retry token.
     * @return \stdClass Durable job.
     */
    public static function queue(int $courseid, int $destinationid, array $members, string $requestid): \stdClass {
        global $DB, $USER;
        if (!preg_match('/^[a-zA-Z0-9-]{16,80}$/D', $requestid)) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        $key = hash('sha256', $USER->id . ':' . $courseid . ':' . $requestid);
        $factory = \core\lock\lock_config::get_lock_factory('local_groupimport');
        $lock = $factory->get_lock('movecourse_' . $courseid, 0);
        if (!$lock) {
            throw new \moodle_exception('movejobbusy', 'local_groupimport');
        }
        try {
            $existing = $DB->get_record('local_groupimport_moves', ['requestkey' => $key]);
            if ($existing) {
                return $existing;
            }
            $pairs = self::validate($courseid, $destinationid, $members);
            $payload = json_encode($pairs, JSON_THROW_ON_ERROR);
            $fingerprint = hash('sha256', $USER->id . ':' . $courseid . ':' . $destinationid . ':' . $payload);
            $existing = $DB->get_record_select(
                'local_groupimport_moves',
                'fingerprint = ? AND status IN (?, ?, ?)',
                [$fingerprint, 'queued', 'running', 'retry']
            );
            if ($existing) {
                return $existing;
            }
            $transaction = $DB->start_delegated_transaction();
            try {
                $job = (object)['courseid' => $courseid, 'userid' => (int)$USER->id, 'destinationid' => $destinationid,
                    'requestkey' => $key, 'fingerprint' => $fingerprint, 'payload' => $payload,
                    'status' => 'queued', 'nextitem' => 0, 'total' => count($pairs), 'added' => 0, 'removed' => 0,
                    'unchanged' => 0, 'failcount' => 0, 'timenotified' => 0, 'timecreated' => time(), 'timemodified' => time()];
                $job->id = (int)$DB->insert_record('local_groupimport_moves', $job);
                $task = new \local_groupimport\task\background_move();
                $task->set_userid((int)$USER->id);
                $task->set_custom_data(['jobid' => $job->id]);
                \core\task\manager::queue_adhoc_task($task, true);
                $transaction->allow_commit();
                return $job;
            } catch (\Throwable $exception) {
                $transaction->rollback($exception);
                throw $exception;
            }
        } finally {
            $lock->release();
        }
    }

    /**
     * Execute bounded native transactions, retrying from the last committed pair.
     * @param int $jobid Job.
     */
    public static function execute(int $jobid): void {
        global $DB, $CFG;
        require_once($CFG->dirroot . '/group/lib.php');
        $job = $DB->get_record('local_groupimport_moves', ['id' => $jobid]);
        if (!$job) {
            return;
        }
        $factory = \core\lock\lock_config::get_lock_factory('local_groupimport');
        $lock = $factory->get_lock('movecourse_' . $job->courseid, 0);
        if (!$lock) {
            throw new \moodle_exception('movejobbusy', 'local_groupimport');
        }
        try {
            // Privacy may erase a queued job while its task waits for the lock.
            $job = $DB->get_record('local_groupimport_moves', ['id' => $jobid]);
            if (!$job || $job->status === 'cancelled') {
                return;
            }
            $course = get_course((int)$job->courseid);
            $user = \core_user::get_user((int)$job->userid, '*', MUST_EXIST);
            if ($user->deleted || $user->suspended) {
                $DB->set_field('local_groupimport_moves', 'status', 'cancelled', ['id' => $jobid]);
                return;
            }
            \core\cron::setup_user($user, $course);
            require_capability('moodle/course:managegroups', \context_course::instance($course->id));
            $pairs = json_decode($job->payload, true, 512, JSON_THROW_ON_ERROR);
            while ($job->nextitem < $job->total) {
                $transaction = $DB->start_delegated_transaction();
                try {
                    $batch = array_slice($pairs, (int)$job->nextitem, self::BATCH_SIZE);
                    $result = \local_groupimport\service\membership_transfer::move_members(
                        (int)$job->courseid,
                        (int)$job->destinationid,
                        $batch
                    );
                    $job->nextitem += count($batch);
                    foreach (['added', 'removed', 'unchanged'] as $key) {
                        $job->{$key} += $result[$key];
                    }
                    $job->status = $job->nextitem === (int)$job->total ? 'completed' : 'running';
                    $job->timemodified = time();
                    $DB->update_record('local_groupimport_moves', $job);
                    $transaction->allow_commit();
                } catch (\Throwable $exception) {
                    $transaction->rollback($exception);
                    throw $exception;
                }
            }
            self::notify($job);
        } catch (\Throwable $exception) {
            $DB->execute(
                'UPDATE {local_groupimport_moves} SET failcount = failcount + 1, timemodified = ? WHERE id = ?',
                [time(), $jobid]
            );
            if ($DB->get_field('local_groupimport_moves', 'status', ['id' => $jobid]) !== 'completed') {
                $DB->set_field('local_groupimport_moves', 'status', 'retry', ['id' => $jobid]);
            }
            throw $exception;
        } finally {
            $lock->release();
        }
    }

    /**
     * Return counters only; callers must enforce owner and course capability.
     * @param \stdClass $job Stored job.
     * @return array Safe progress.
     */
    public static function progress(\stdClass $job): array {
        $key = $job->status === 'completed' ? 'movejobcomplete' :
            ($job->status === 'retry' ? 'movejobretry' : ($job->status === 'cancelled' ? 'movejobcancelled' : 'movejobprogress'));
        return ['id' => (int)$job->id, 'status' => $job->status, 'done' => (int)$job->nextitem,
            'total' => (int)$job->total, 'message' => get_string(
                $key,
                'local_groupimport',
                (object)['done' => $job->nextitem, 'total' => $job->total]
            )];
    }

    /**
     * Send the same native Moodle notification family as background imports.
     * @param \stdClass $job Completed job.
     */
    private static function notify(\stdClass $job): void {
        global $DB;
        if ($job->status !== 'completed' || $job->timenotified) {
            return;
        }
        $transaction = $DB->start_delegated_transaction();
        try {
            $message = new \core\message\message();
            $message->component = 'local_groupimport';
            $message->name = 'movecomplete';
            $message->userfrom = \core_user::get_noreply_user();
            $message->userto = \core_user::get_user((int)$job->userid);
            $message->subject = get_string('movejobtitle', 'local_groupimport');
            $message->fullmessage = self::progress($job)['message'];
            $message->fullmessageformat = FORMAT_PLAIN;
            $message->fullmessagehtml = '';
            $message->smallmessage = $message->fullmessage;
            $message->notification = 1;
            $message->contexturl = (new \moodle_url('/local/groupimport/manage.php', ['id' => $job->courseid]))->out(false);
            $message->contexturlname = get_string('movejobtitle', 'local_groupimport');
            if (!message_send($message)) {
                throw new \moodle_exception('importjobnotificationfailed', 'local_groupimport');
            }
            $DB->set_field('local_groupimport_moves', 'timenotified', time(), ['id' => $job->id]);
        } catch (\Throwable $exception) {
            $transaction->rollback($exception);
            throw $exception;
        }
        // Message processors run after commit; their failures cannot roll back a disposed transaction.
        $transaction->allow_commit();
    }
}
