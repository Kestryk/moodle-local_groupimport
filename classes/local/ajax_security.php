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
 * Shared native validation before EasyStud AJAX writes.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class ajax_security {
    /** Maximum generated names per request, across every segment. */
    public const MAX_NAMES = 500;

    /**
     * Reject URL writes and the site front page before action dispatch.
     * @param string $method HTTP method.
     * @param int $courseid Requested course.
     */
    public static function require_request(string $method, int $courseid): void {
        if ($method !== 'POST' || $courseid <= 0 || $courseid === SITEID) {
            throw new \moodle_exception('invaliddata', 'error');
        }
    }

    /**
     * Apply the native name field's 254-character limit.
     * @param string $name Entity name.
     */
    public static function validate_name(string $name): void {
        if (trim($name) === '' || \core_text::strlen($name) > 254) {
            throw new \moodle_exception('invaliddata', 'error');
        }
    }

    /**
     * Validate native idnumbers and changed enrolment keys before updates.
     * @param string $table groups or groupings.
     * @param int $courseid Course.
     * @param int $id Existing entity.
     * @param string $name Name.
     * @param string|null $idnumber Authorized idnumber, null if not editable.
     * @param string $key New nonempty key, or empty to retain the existing key.
     * @param string $oldkey Existing key.
     */
    public static function validate_entity(
        string $table,
        int $courseid,
        int $id,
        string $name,
        ?string $idnumber = null,
        string $key = '',
        string $oldkey = ''
    ): void {
        global $DB, $CFG;
        if (!in_array($table, ['groups', 'groupings'], true)) {
            throw new \coding_exception('Unsupported group table.');
        }
        self::validate_name($name);
        if (
            $idnumber !== null && (\core_text::strlen($idnumber) > 100 || ($idnumber !== '' &&
                $DB->record_exists_select($table, 'courseid = :course AND id <> :id AND idnumber = :value', [
                    'course' => $courseid, 'id' => $id, 'value' => $idnumber,
                ])))
        ) {
            throw new \moodle_exception('idnumbertaken', 'moodle');
        }
        if ($table !== 'groups' || $key === '') {
            return;
        }
        if (\core_text::strlen($key) > 254) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        $message = '';
        if ($key !== $oldkey && !empty($CFG->groupenrolmentkeypolicy) && !check_password_policy($key, $message)) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        if (
            $DB->record_exists_select('groups', 'courseid = :course AND id <> :id AND enrolmentkey = :value', [
            'course' => $courseid, 'id' => $id, 'value' => $key,
            ])
        ) {
            throw new \moodle_exception('enrolmentkeyalreadyinuse', 'group');
        }
    }

    /**
     * Allocate a bounded unique copy name, using the database's name comparison.
     * @param string $table Allowed entity table.
     * @param int $courseid Course.
     * @param string $base Localized copy name.
     * @return string
     */
    public static function copy_name(string $table, int $courseid, string $base): string {
        global $DB;
        if (!in_array($table, ['groups', 'groupings'], true)) {
            throw new \coding_exception('Unsupported group table.');
        }
        for ($attempt = 0; $attempt <= self::MAX_NAMES; $attempt++) {
            $suffix = $attempt === 0 ? '' : ' (' . ($attempt + 1) . ')';
            $name = rtrim(\core_text::substr($base, 0, 254 - \core_text::strlen($suffix))) . $suffix;
            self::validate_name($name);
            if (!$DB->record_exists($table, ['courseid' => $courseid, 'name' => $name])) {
                return $name;
            }
        }
        throw new \moodle_exception('invaliddata', 'error');
    }

    /**
     * Preflight every pair, then remove only manually removable memberships.
     * @param int $courseid Course.
     * @param int[] $groupids Origins.
     * @param int[] $userids Subjects.
     * @return int Number removed.
     */
    public static function remove_members(int $courseid, array $groupids, array $userids): int {
        if (count($groupids) !== count($userids)) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        $userids = array_values($userids);
        $pairs = [];
        // Each origin group is read once, then handed to the native API (no re-read per member).
        $groups = [];
        foreach (array_values($groupids) as $index => $groupid) {
            $userid = $userids[$index];
            if (!array_key_exists((int)$groupid, $groups)) {
                $groups[(int)$groupid] = groups_get_group((int)$groupid);
            }
            $group = $groups[(int)$groupid];
            if (!$group || (int)$group->courseid !== $courseid || (int)$userid <= 0) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            if (!groups_remove_member_allowed($group, (int)$userid)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            $pairs[(int)$groupid . ':' . (int)$userid] = [(int)$groupid, (int)$userid];
        }
        $removed = 0;
        foreach ($pairs as [$groupid, $userid]) {
            if (groups_is_member($groupid, $userid)) {
                if (!groups_remove_member($groups[$groupid], $userid)) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
                $removed++;
            }
        }
        return $removed;
    }

    /**
     * Validate actual bytes and decoded image format, never the browser MIME.
     * @param string $path Local uploaded file.
     * @param int $maxbytes Effective Moodle/course limit, zero means unlimited.
     */
    public static function validate_image_file(string $path, int $maxbytes): void {
        $size = is_file($path) ? filesize($path) : false;
        $info = $size ? @getimagesize($path) : false;
        if (
            !$size || ($maxbytes > 0 && $size > $maxbytes) || !$info ||
                !in_array($info[2], [IMAGETYPE_GIF, IMAGETYPE_JPEG, IMAGETYPE_PNG, IMAGETYPE_WEBP], true) ||
                $info[0] > 8192 || $info[1] > 8192 || $info[0] * $info[1] > 16777216
        ) {
            throw new \moodle_exception('invaliddata', 'error');
        }
    }

    /**
     * Validate the multipart transport before any group update.
     * @param array|null $file PHP upload metadata.
     * @param object $course Course record.
     * @return string|null Validated path.
     */
    public static function image_upload(?array $file, object $course): ?string {
        global $CFG;
        if ($file === null || ($file['error'] ?? null) === UPLOAD_ERR_NO_FILE) {
            return null;
        }
        if (
            ($file['error'] ?? null) !== UPLOAD_ERR_OK || !is_string($file['tmp_name'] ?? null) ||
                !is_uploaded_file($file['tmp_name'])
        ) {
            throw new \moodle_exception('invaliddata', 'error');
        }
        self::validate_image_file($file['tmp_name'], get_max_upload_file_size($CFG->maxbytes, $course->maxbytes ?? 0));
        return $file['tmp_name'];
    }
}
