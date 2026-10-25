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
 * Personal data of queued membership transfers, independent of import history.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class move_privacy {
    /**
     * List the actor and every subject of the immutable selected pairs.
     * @param \stdClass $job Job.
     * @return int[] User ids.
     */
    public static function userids(\stdClass $job): array {
        $pairs = json_decode($job->payload, true, 512, JSON_THROW_ON_ERROR);
        return array_values(array_unique(array_merge([(int)$job->userid], array_map('intval', array_column($pairs, 'userid')))));
    }

    /**
     * Find course contexts containing this subject's job data.
     * @param int $userid User.
     * @return int[] Course ids.
     */
    public static function courses(int $userid): array {
        global $DB;
        $result = [];
        $records = $DB->get_recordset('local_groupimport_moves');
        try {
            foreach ($records as $job) {
                if (in_array($userid, self::userids($job), true)) {
                    $result[(int)$job->courseid] = (int)$job->courseid;
                }
            }
        } finally {
            $records->close();
        }
        return $result;
    }

    /**
     * Export only the requested person's pairs and actor metadata.
     * @param int $courseid Approved course.
     * @param int $userid Approved subject.
     * @return array Export records.
     */
    public static function export(int $courseid, int $userid): array {
        global $DB;
        $result = [];
        $records = $DB->get_recordset('local_groupimport_moves', ['courseid' => $courseid]);
        try {
            foreach ($records as $job) {
                if (!in_array($userid, self::userids($job), true)) {
                    continue;
                }
                $pairs = json_decode($job->payload, true, 512, JSON_THROW_ON_ERROR);
                $result[] = ['id' => (int)$job->id, 'requestedbyyou' => (int)$job->userid === $userid,
                    'destinationid' => (int)$job->destinationid, 'status' => $job->status,
                    'done' => (int)$job->nextitem, 'total' => (int)$job->total, 'timecreated' => (int)$job->timecreated,
                    'pairs' => array_values(array_filter($pairs, static fn($pair) => (int)$pair['userid'] === $userid))];
            }
        } finally {
            $records->close();
        }
        return $result;
    }

    /**
     * Erasure cancels affected pending work; never renumber an active cursor.
     * Already committed native memberships are not changed by a Privacy request.
     * @param int $courseid Approved course.
     * @param int[]|null $userids Subjects, or everyone in this course.
     * @param int|null $cutoff Optional retention cutoff.
     */
    public static function erase(int $courseid, ?array $userids = null, ?int $cutoff = null): void {
        global $DB;
        $lock = \core\lock\lock_config::get_lock_factory('local_groupimport')->get_lock('movecourse_' . $courseid, 5);
        if (!$lock) {
            throw new \moodle_exception('movejobbusy', 'local_groupimport');
        }
        try {
            $records = $DB->get_records('local_groupimport_moves', ['courseid' => $courseid]);
            foreach ($records as $job) {
                if (
                    ($cutoff !== null && $job->timecreated >= $cutoff) ||
                        ($userids !== null && !array_intersect($userids, self::userids($job)))
                ) {
                    continue;
                }
                $DB->delete_records('local_groupimport_moves', ['id' => $job->id]);
            }
        } finally {
            $lock->release();
        }
    }
}
