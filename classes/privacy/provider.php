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
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\contextlist;
use core_privacy\local\request\writer;
use local_groupimport\local\motion;

/**
 * Privacy provider for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class provider implements
        \core_privacy\local\metadata\provider,
        \core_privacy\local\request\plugin\provider,
        \core_privacy\local\request\user_preference_provider {
    /**
     * Describe personal data stored by EasyStud.
     *
     * @param collection $collection Metadata collection.
     * @return collection
     */
    public static function get_metadata(collection $collection): collection {
        $collection->add_user_preference(\local_groupimport\local\guide_welcome::PREFERENCE,
            'privacy:metadata:guidewelcomeseen');
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
            writer::with_context(\context_system::instance())->export_user_preference('local_groupimport',
                \local_groupimport\local\guide_welcome::PREFERENCE, (string)$value,
                get_string('privacy:metadata:guidewelcomeseen', 'local_groupimport'));
        }
        $level = get_user_preferences(motion::PREFERENCE, null, $userid);
        if ($level !== null) {
            writer::with_context(\context_system::instance())->export_user_preference('local_groupimport',
                motion::PREFERENCE, (string)$level, get_string('privacy:metadata:motionlevel', 'local_groupimport'));
        }
    }

    /**
     * Delete the animation level chosen by a user (user context deletion).
     *
     * @param int $userid User id.
     * @return void
     */
    protected static function delete_user_motion_preference(int $userid): void {
        unset_user_preference(motion::PREFERENCE, $userid);
    }

    /**
     * Get course contexts containing import history for a user.
     *
     * @param int $userid User id.
     * @return contextlist
     */
    public static function get_contexts_for_userid(int $userid): contextlist {
        $sql = "SELECT ctx.id
                  FROM {context} ctx
                  JOIN {local_groupimport_history} h
                    ON h.courseid = ctx.instanceid
                 WHERE ctx.contextlevel = :contextlevel
                   AND (h.userid = :importuserid OR h.rollbackuserid = :rollbackuserid)";

        $contextlist = (new contextlist())->add_from_sql($sql, [
            'contextlevel' => CONTEXT_COURSE,
            'importuserid' => $userid,
            'rollbackuserid' => $userid,
        ]);
        // The chosen animation level belongs to the user context, so it can be deleted on request.
        if (get_user_preferences(motion::PREFERENCE, null, $userid) !== null) {
            $contextlist->add_user_context($userid);
        }
        return $contextlist;
    }

    /**
     * Export import history associated with the approved user.
     *
     * @param approved_contextlist $contextlist Approved contexts.
     * @return void
     */
    public static function export_user_data(approved_contextlist $contextlist): void {
        global $DB;

        foreach ($contextlist->get_contexts() as $context) {
            if (!$context instanceof context_course) {
                continue;
            }
            $select = 'courseid = :courseid AND (userid = :userid OR rollbackuserid = :rollbackuserid)';
            $records = $DB->get_records_select('local_groupimport_history', $select, [
                'courseid' => $context->instanceid,
                'userid' => $contextlist->get_user()->id,
                'rollbackuserid' => $contextlist->get_user()->id,
            ], 'timecreated ASC');

            if ($records) {
                writer::with_context($context)->export_data(
                    [get_string('privacy:historypath', 'local_groupimport')],
                    (object)['imports' => array_values($records)]
                );
            }
        }
    }

    /**
     * Delete all EasyStud history in a course context.
     *
     * @param context $context Context to clear.
     * @return void
     */
    public static function delete_data_for_all_users_in_context(context $context): void {
        global $DB;

        if ($context instanceof context_course) {
            $DB->delete_records('local_groupimport_history', ['courseid' => $context->instanceid]);
        } else if ($context instanceof context_user) {
            self::delete_user_motion_preference((int)$context->instanceid);
        }
    }

    /**
     * Delete import history owned by the approved user and anonymise rollback attribution.
     *
     * @param approved_contextlist $contextlist Approved contexts.
     * @return void
     */
    public static function delete_data_for_user(approved_contextlist $contextlist): void {
        global $DB;

        foreach ($contextlist->get_contexts() as $context) {
            if ($context instanceof context_user && (int)$context->instanceid === (int)$contextlist->get_user()->id) {
                self::delete_user_motion_preference((int)$context->instanceid);
                continue;
            }
            if (!$context instanceof context_course) {
                continue;
            }
            $DB->delete_records('local_groupimport_history', [
                'courseid' => $context->instanceid,
                'userid' => $contextlist->get_user()->id,
            ]);
            $DB->set_field_select('local_groupimport_history', 'rollbackuserid', null,
                'courseid = :courseid AND rollbackuserid = :userid', [
                    'courseid' => $context->instanceid,
                    'userid' => $contextlist->get_user()->id,
                ]);
        }
    }
}
