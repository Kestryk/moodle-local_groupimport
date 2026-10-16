<?php
// This file is part of Moodle - http://moodle.org/
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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\local;

/**
 * Monotonic per-course version of the group structure (SM-RENDU).
 *
 * The browser keeps a copy of the course state; this counter tells it whether that copy
 * is still current. It is bumped from core group, grouping, enrolment and role events,
 * so changes made outside EasyStud (native group pages, imports, enrolment sync) count too.
 *
 * A request that triggers many events (a Mass Import) writes at most twice: once on the
 * first event, once at shutdown if more events followed.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
class state_version {
    /** @var string Table holding one row per course. */
    const TABLE = 'local_groupimport_statever';

    /** @var array Course id => true once bumped in this request. */
    protected static $bumped = [];

    /** @var array Course id => true when events followed the first bump. */
    protected static $dirty = [];

    /** @var bool Whether the shutdown handler is registered. */
    protected static $shutdownregistered = false;

    /**
     * Current version of a course; 0 when nothing was recorded yet.
     *
     * @param int $courseid Course id.
     * @return int
     */
    public static function get(int $courseid): int {
        global $DB;

        return (int)$DB->get_field(self::TABLE, 'version', ['courseid' => $courseid]);
    }

    /**
     * Increment the version of a course and return the new value.
     *
     * @param int $courseid Course id.
     * @return int
     */
    public static function bump(int $courseid): int {
        global $DB;

        if ($courseid <= SITEID) {
            return 0;
        }
        $now = time();
        $DB->execute(
            'UPDATE {' . self::TABLE . '} SET version = version + 1, timemodified = :now WHERE courseid = :courseid',
            ['now' => $now, 'courseid' => $courseid]
        );
        if (!$DB->record_exists(self::TABLE, ['courseid' => $courseid])) {
            try {
                $DB->insert_record(self::TABLE, (object)[
                    'courseid' => $courseid,
                    'version' => 1,
                    'timemodified' => $now,
                ]);
            } catch (\dml_write_exception $e) {
                // A concurrent request created the row first: increment it instead.
                $DB->execute(
                    'UPDATE {' . self::TABLE . '} SET version = version + 1, timemodified = :now WHERE courseid = :courseid',
                    ['now' => $now, 'courseid' => $courseid]
                );
            }
        }

        return self::get($courseid);
    }

    /**
     * Event observer: any change to the group structure, enrolments or course roles.
     *
     * @param \core\event\base $event Event.
     */
    public static function observe(\core\event\base $event): void {
        $courseid = (int)($event->courseid ?? 0);
        if ($event instanceof \core\event\role_assigned || $event instanceof \core\event\role_unassigned) {
            // Only course-level role assignments are shown by EasyStud.
            if ($event->get_context()->contextlevel != CONTEXT_COURSE) {
                return;
            }
        }
        if ($courseid <= SITEID) {
            return;
        }

        if (empty(self::$bumped[$courseid])) {
            self::bump($courseid);
            self::$bumped[$courseid] = true;
            if (!self::$shutdownregistered) {
                \core_shutdown_manager::register_function([self::class, 'flush']);
                self::$shutdownregistered = true;
            }
            return;
        }
        self::$dirty[$courseid] = true;
    }

    /**
     * Shutdown handler: one final bump for courses that changed again after the first one.
     */
    public static function flush(): void {
        foreach (array_keys(self::$dirty) as $courseid) {
            self::bump((int)$courseid);
        }
        self::$dirty = [];
    }
}
