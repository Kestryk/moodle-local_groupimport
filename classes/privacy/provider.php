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

namespace local_groupimport\privacy;

use context;
use context_course;
use context_user;
use core_privacy\local\metadata\collection;
use core_privacy\local\metadata\provider as metadata_provider;
use core_privacy\local\request\plugin\provider as plugin_provider;
use core_privacy\local\request\core_userlist_provider;
use core_privacy\local\request\user_preference_provider;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\writer;
use local_groupimport\local\motion;
use local_groupimport\local\history_privacy;

/**
 * Privacy provider for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements core_userlist_provider, metadata_provider, plugin_provider, user_preference_provider {
    /**
     * Describe personal data stored by EasyStud.
     *
     * @param collection $collection Metadata collection.
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_user_preference(
            \local_groupimport\local\guide_welcome::PREFERENCE,
            'privacy:metadata:guidewelcomeseen'
        );
        $collection->add_user_preference(motion::PREFERENCE, 'privacy:metadata:motionlevel');
        $collection->add_database_table('local_groupimport_history', [
            'courseid' => 'privacy:metadata:history:courseid',
            'userid' => 'privacy:metadata:history:userid',
            'filename' => 'privacy:metadata:history:filename',
            'filehash' => 'privacy:metadata:history:filehash',
            'rowcount' => 'privacy:metadata:history:rowcount',
            'successcount' => 'privacy:metadata:history:successcount',
            'errorcount' => 'privacy:metadata:history:errorcount',
            'replacepolicy' => 'privacy:metadata:history:replacepolicy',
            'changesjson' => 'privacy:metadata:history:changesjson',
            'rollbackuserid' => 'privacy:metadata:history:rollbackuserid',
            'timerolledback' => 'privacy:metadata:history:timerolledback',
            'timecreated' => 'privacy:metadata:history:timecreated',
        ], 'privacy:metadata:history');

        $collection->add_database_table('local_groupimport_jobs', [
            'historyid' => 'privacy:metadata:importjobs',
            'status' => 'privacy:metadata:importjobs',
            'cursor' => 'privacy:metadata:importjobs',
            'failcount' => 'privacy:metadata:importjobs',
            'elapsedms' => 'privacy:metadata:importjobs',
            'peakbytes' => 'privacy:metadata:importjobs',
            'timecreated' => 'privacy:metadata:history:timecreated',
            'timemodified' => 'privacy:metadata:history:timecreated',
            'timenotified' => 'privacy:metadata:history:timecreated',
        ], 'privacy:metadata:importjobs');
        return $collection;
    }

    /**
     * Export the global welcome preference and the chosen animation level.
     *
     * @param int $userid User id.
     * @return void
     */
    public static function export_user_preferences(int $userid) {
        $value = get_user_preferences(\local_groupimport\local\guide_welcome::PREFERENCE, null, $userid);
        if ($value !== null) {
            writer::with_context(\context_system::instance())->export_user_preference(
                'local_groupimport',
                \local_groupimport\local\guide_welcome::PREFERENCE,
                (string)$value,
                get_string('privacy:metadata:guidewelcomeseen', 'local_groupimport')
            );
        }
        $level = get_user_preferences(motion::PREFERENCE, null, $userid);
        if ($level !== null) {
            writer::with_context(\context_system::instance())->export_user_preference(
                'local_groupimport',
                motion::PREFERENCE,
                (string)$level,
                get_string('privacy:metadata:motionlevel', 'local_groupimport')
            );
        }
    }

    /**
     * Delete both preferences declared by this provider (user context deletion).
     *
     * @param int $userid User id.
     * @return void
     */
    protected static function delete_user_preferences(int $userid): void {
        unset_user_preference(motion::PREFERENCE, $userid);
        unset_user_preference(\local_groupimport\local\guide_welcome::PREFERENCE, $userid);
    }

    /**
     * Get course contexts containing import history for a user.
     *
     * @param int $userid User id.
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        global $DB;
        $contexts = new contextlist();
        if ($userid <= 0) {
            return $contexts;
        }
        $identifiers = self::user_identifiers($userid);
        $courseids = [];
        $records = $DB->get_recordset('local_groupimport_history');
        try {
            foreach ($records as $record) {
                if (
                    (int)$record->userid === $userid || (int)$record->rollbackuserid === $userid ||
                        history_privacy::contains(history_privacy::decode((string)$record->changesjson), $userid, $identifiers)
                ) {
                    $courseids[(int)$record->courseid] = (int)$record->courseid;
                }
            }
        } finally {
            $records->close();
        }
        foreach (array_chunk(array_values($courseids), 500) as $chunk) {
            [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED, 'courseid');
            $params['contextlevel'] = CONTEXT_COURSE;
            $contexts->add_from_sql(
                "SELECT id FROM {context} WHERE contextlevel = :contextlevel AND instanceid $insql",
                $params
            );
        }
        if (self::has_preferences($userid)) {
            $contexts->add_user_context($userid);
        }
        return $contexts;
    }

    /**
     * Current identifiers supplement old identifiers bound to ids in the payload.
     * @param int $userid Subject id.
     * @return string[]
     */
    protected static function user_identifiers(int $userid): array {
        global $DB;
        $user = $DB->get_record('user', ['id' => $userid], 'id,email,username,idnumber', IGNORE_MISSING);
        return $user ? [(string)$user->email, (string)$user->username, (string)$user->idnumber] : [];
    }

    /**
     * Whether the subject has preferences declared by this provider.
     * @param int $userid Subject id.
     * @return bool
     */
    protected static function has_preferences(int $userid): bool {
        return get_user_preferences(motion::PREFERENCE, null, $userid) !== null ||
            get_user_preferences(\local_groupimport\local\guide_welcome::PREFERENCE, null, $userid) !== null;
    }

    /**
     * Discover importers, rollback actors and imported/failed-row subjects.
     * @param \core_privacy\local\request\userlist $userlist Context request.
     * @return void
     */
    public static function get_users_in_context(\core_privacy\local\request\userlist $userlist): void {
        global $DB;
        $context = $userlist->get_context();
        if ($context instanceof context_user) {
            if (self::has_preferences((int)$context->instanceid)) {
                $userlist->add_users([(int)$context->instanceid]);
            }
            return;
        }
        if (!$context instanceof context_course) {
            return;
        }
        $identifiers = [];
        $records = $DB->get_recordset('local_groupimport_history', ['courseid' => $context->instanceid]);
        try {
            foreach ($records as $record) {
                $changes = history_privacy::decode((string)$record->changesjson);
                $ids = array_merge([(int)$record->userid, (int)$record->rollbackuserid], history_privacy::userids($changes));
                $userlist->add_users(array_values(array_filter($ids, static fn($id) => $id > 0)));
                foreach (history_privacy::identifiers($changes) as $identifier) {
                    $identifiers[$identifier] = $identifier;
                }
            }
        } finally {
            $records->close();
        }
        // Portable bounded queries also find failed legacy report rows lacking a userid.
        foreach (array_chunk(array_values($identifiers), 500) as $chunk) {
            foreach (['email', 'username', 'idnumber'] as $field) {
                [$insql, $params] = $DB->get_in_or_equal($chunk, SQL_PARAMS_NAMED);
                $users = $DB->get_records_select('user', "LOWER($field) $insql", $params, '', 'id');
                $userlist->add_users(array_map('intval', array_keys($users)));
            }
        }
    }

    /**
     * Export subject rows only, plus their own import/rollback metadata.
     * @param approved_contextlist $contextlist Approved contexts.
     * @return void
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;
        $userid = (int)$contextlist->get_user()->id;
        $identifiers = self::user_identifiers($userid);
        foreach ($contextlist->get_contexts() as $context) {
            if (!$context instanceof context_course) {
                continue;
            }
            $exports = [];
            $records = $DB->get_recordset('local_groupimport_history', ['courseid' => $context->instanceid], 'timecreated ASC');
            try {
                foreach ($records as $record) {
                    $changes = history_privacy::filter(
                        history_privacy::decode((string)$record->changesjson),
                        $userid,
                        $identifiers,
                        true
                    );
                    $owner = (int)$record->userid === $userid;
                    $rollback = (int)$record->rollbackuserid === $userid;
                    if (!$owner && !$rollback && !array_filter($changes)) {
                        continue;
                    }
                    $export = (object)[
                        'historyid' => (int)$record->id,
                        'timecreated' => (int)$record->timecreated,
                        'importedbyself' => $owner,
                        'rolledbackbyself' => $rollback,
                        'changes' => $changes,
                    ];
                    if ($owner) {
                        $export->filename = $record->filename;
                        $export->filehash = $record->filehash;
                        $export->rowcount = (int)$record->rowcount;
                        $export->successcount = (int)$record->successcount;
                        $export->errorcount = (int)$record->errorcount;
                        $export->replacepolicy = $record->replacepolicy;
                    }
                    if ($rollback) {
                        $export->timerolledback = (int)$record->timerolledback;
                    }
                    $exports[] = $export;
                }
            } finally {
                $records->close();
            }
            if ($exports) {
                writer::with_context($context)->export_data(
                    [get_string('privacy:historypath', 'local_groupimport')],
                    (object)['imports' => $exports]
                );
            }
        }
    }

    /**
     * Remove history, never course memberships, in the approved context.
     * @param context $context Approved context.
     * @return void
     */
    public static function delete_data_for_all_users_in_context(context $context): void {
        global $DB;
        if ($context instanceof context_course) {
            $lock = self::import_lock((int)$context->instanceid);
            try {
                $DB->delete_records('local_groupimport_history', ['courseid' => $context->instanceid]);
                self::delete_orphan_jobs();
            } finally {
                $lock->release();
            }
        } else if ($context instanceof context_user) {
            self::delete_user_preferences((int)$context->instanceid);
        }
    }

    /**
     * Remove one subject's data only in their approved contexts.
     * @param approved_contextlist $contextlist Approved request.
     * @return void
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        $userid = (int)$contextlist->get_user()->id;
        foreach ($contextlist->get_contexts() as $context) {
            self::delete_subjects($context, [$userid]);
        }
    }

    /**
     * Remove the approved users in one approved context.
     * @param \core_privacy\local\request\approved_userlist $userlist Approved users.
     * @return void
     */
    public static function delete_data_for_users(\core_privacy\local\request\approved_userlist $userlist): void {
        self::delete_subjects($userlist->get_context(), $userlist->get_userids());
    }

    /**
     * Redact shared records; deleting an importer removes their entire record.
     * @param context $context Approved context.
     * @param int[] $userids Approved subjects.
     * @return void
     */
    protected static function delete_subjects(context $context, array $userids): void {
        global $DB;
        $userids = array_values(array_unique(array_filter(array_map('intval', $userids), static fn($id) => $id > 0)));
        if (!$userids) {
            return;
        }
        if ($context instanceof context_user) {
            if (in_array((int)$context->instanceid, $userids, true)) {
                self::delete_user_preferences((int)$context->instanceid);
            }
            return;
        }
        if (!$context instanceof context_course) {
            return;
        }
        $identifiers = [];
        foreach ($userids as $userid) {
            $identifiers[$userid] = self::user_identifiers($userid);
        }
        $lock = self::import_lock((int)$context->instanceid);
        try {
            $records = $DB->get_recordset('local_groupimport_history', ['courseid' => $context->instanceid]);
            try {
                foreach ($records as $record) {
                    if (in_array((int)$record->userid, $userids, true)) {
                        $DB->delete_records('local_groupimport_history', ['id' => $record->id]);
                        continue;
                    }
                    $changes = history_privacy::decode((string)$record->changesjson);
                    $filtered = $changes;
                    foreach ($userids as $userid) {
                        $filtered = history_privacy::filter($filtered, $userid, $identifiers[$userid], false);
                    }
                    $update = (object)['id' => $record->id];
                    if ($filtered !== $changes) {
                        $update->changesjson = json_encode($filtered, JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);
                    }
                    if (in_array((int)$record->rollbackuserid, $userids, true)) {
                        $update->rollbackuserid = null;
                        $update->timerolledback = null;
                    }
                    if (count((array)$update) > 1) {
                        $DB->update_record('local_groupimport_history', $update);
                    }
                }
            } finally {
                $records->close();
            }
            self::delete_orphan_jobs();
        } finally {
            $lock->release();
        }
    }

    /**
     * Serialize Privacy erasure with resumable import commits in this course.
     * @param int $courseid Course id.
     * @return \core\lock\lock
     */
    private static function import_lock(int $courseid): \core\lock\lock {
        $lock = \core\lock\lock_config::get_lock_factory('local_groupimport')->get_lock('importcourse_' . $courseid, 5);
        if (!$lock) {
            throw new \moodle_exception('importjobbusy', 'local_groupimport');
        }
        return $lock;
    }

    /**
     * Erased history must not leave identifiable progress rows behind.
     * @return void
     */
    private static function delete_orphan_jobs(): void {
        global $DB;
        $DB->delete_records_select(
            'local_groupimport_jobs',
            'NOT EXISTS (SELECT 1 FROM {local_groupimport_history} h WHERE h.id = historyid)'
        );
    }
}
