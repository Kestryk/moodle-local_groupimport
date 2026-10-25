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
 * Idempotent group creation for a retried request (PERF-SRV).
 *
 * When the answer of a creation is lost (timeout, network), the page sends the same request
 * again with the same client token. The groups created by the first request are then returned
 * instead of a "name already exists" refusal, and nothing is created twice. Nothing is stored
 * in a table: a short-lived entry of an ad hoc application cache, keyed by user, course and
 * token. Without that entry (cache purged, other token, entry older than {@see self::TTL}),
 * the usual creation rules apply unchanged, including the refusal of an existing name.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class create_request_guard {
    /** @var int Seconds during which a retried token returns the groups it created. */
    public const TTL = 900;

    /**
     * Normalised client token, or '' when absent or malformed.
     *
     * @param string $token Raw token (PARAM_ALPHANUMEXT).
     * @return string
     */
    public static function clean_token(string $token): string {
        return preg_match('/^[A-Za-z0-9_-]{8,64}$/', $token) ? $token : '';
    }

    /**
     * Groups already created by this user, course and token for exactly these names.
     *
     * @param int $courseid Course id.
     * @param string $token Clean token.
     * @param string[] $names Requested names, in request order.
     * @return \stdClass[]|null Group records in name order, or null when the request is new.
     */
    public static function replay(int $courseid, string $token, array $names): ?array {
        global $DB;

        if ($token === '') {
            return null;
        }
        $entry = self::cache()->get(self::key($courseid, $token));
        if (
            !is_array($entry) || ($entry['names'] ?? null) !== array_values($names) ||
                (int)($entry['time'] ?? 0) < time() - self::TTL || empty($entry['groupids'])
        ) {
            return null;
        }
        $groupids = array_map('intval', $entry['groupids']);
        $records = batch_reader::records('groups', $groupids, ['courseid' => $courseid]);
        $groups = [];
        foreach ($groupids as $index => $groupid) {
            // A group deleted or renamed since then: this is a new request, not a replay.
            if (!isset($records[$groupid]) || (string)$records[$groupid]->name !== (string)$names[$index]) {
                return null;
            }
            $groups[] = $records[$groupid];
        }
        return $groups;
    }

    /**
     * Remember the groups created by this request.
     *
     * @param int $courseid Course id.
     * @param string $token Clean token.
     * @param string[] $names Requested names, in request order.
     * @param int[] $groupids Created group ids, in the same order.
     * @return void
     */
    public static function remember(int $courseid, string $token, array $names, array $groupids): void {
        if ($token === '' || !$groupids) {
            return;
        }
        self::cache()->set(self::key($courseid, $token), [
            'names' => array_values($names),
            'groupids' => array_values(array_map('intval', $groupids)),
            'time' => time(),
        ]);
    }

    /**
     * Cache key for the current user.
     *
     * @param int $courseid Course id.
     * @param string $token Clean token.
     * @return string
     */
    private static function key(int $courseid, string $token): string {
        global $USER;

        return sha1((int)$USER->id . ':' . $courseid . ':' . $token);
    }

    /**
     * Ad hoc application cache: shared by the web servers, no definition or upgrade needed.
     *
     * @return \cache
     */
    private static function cache(): \cache {
        return \cache::make_from_params(\cache_store::MODE_APPLICATION, 'local_groupimport', 'createrequests', [], [
            'simplekeys' => true,
            'simpledata' => true,
        ]);
    }
}
