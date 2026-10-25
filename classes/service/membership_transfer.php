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
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

namespace local_groupimport\service;

defined('MOODLE_INTERNAL') || die();

require_once($CFG->dirroot . '/group/lib.php');

/**
 * Atomic transfer of selected group membership pairs, not course enrolments.
 *
 * The eventual AJAX adapter must also enforce login and sesskey. This service
 * enforces course capability, validates the complete selection, uses native
 * group APIs and never removes a membership outside an explicit source pair.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_transfer {
    /**
     * Number of (groupid, userid) pairs mutated per delegated transaction.
     *
     * Measured on the course-71 synthetic fixture (800 enrolled users, 150
     * groups): a single all-in-one transaction took ~19.2s for 800 pairs and
     * ~43.2s for 3000 pairs, growing with the size of one giant transaction's
     * lock/undo footprint. Chunking to 250 pairs per commit bounds that growth
     * (each batch is a short-lived, independent transaction) while keeping
     * batches large enough that per-batch overhead (transaction start/commit)
     * stays a small fraction of total time; see
     * tools/perf/README.md for the before/after figures.
     */
    private const BATCH_SIZE = 250;

    /**
     * Move source memberships to one destination in the same course.
     *
     * Duplicate pairs from responsive copies are processed once. Existing
     * destination membership is retained; a source equal to destination is a
     * no-op. Other groups and enrolments are untouched. Native managed-membership
     * removal restrictions are respected.
     *
     * The full selection is validated upfront, before any native mutation, so a
     * malformed or unauthorized pair rejects the whole request untouched (see
     * self::BATCH_SIZE). Mutations are then applied in fixed-size batches, each
     * one its own delegated transaction: a batch is all-or-nothing, but a
     * failure in one batch does not roll back batches already committed before
     * it, and the operation never holds a single giant transaction across
     * thousands of pairs. Any exception aborts the remaining, not-yet-processed
     * batches.
     *
     * @param int $courseid Course id.
     * @param int $destinationid Destination group id.
     * @param array $members Selected arrays containing groupid and userid.
     * @return array Counts of added destination, removed source and unchanged pairs.
     */
    public static function move_members(int $courseid, int $destinationid, array $members): array {
        global $DB;

        $context = \context_course::instance($courseid);
        require_capability('moodle/course:managegroups', $context);
        $destination = groups_get_group($destinationid);
        if (!$destination || (int)$destination->courseid !== $courseid) {
            throw new \moodle_exception('invalidgroupid', 'error');
        }
        if (!$members) {
            throw new \moodle_exception('invaliddata', 'error');
        }

        $pairs = [];
        // Read only the selected users and groups (plus the destination), not the whole course.
        // Malformed entries are still rejected by the validation loop below.
        $selectedusers = [];
        $selectedgroups = [$destinationid];
        foreach ($members as $member) {
            if (is_array($member)) {
                $selectedusers[] = (int)($member['userid'] ?? 0);
                $selectedgroups[] = (int)($member['groupid'] ?? 0);
            }
        }
        $enrolled = \local_groupimport\local\batch_reader::enrolled($context, $selectedusers);
        [$memberships] = \local_groupimport\local\batch_reader::relationships(
            $courseid,
            $selectedgroups,
            $selectedusers
        );
        $origins = [];
        // Validate the whole request before emitting any native membership mutation,
        // across every batch: this loop runs outside any transaction and never mutates.
        foreach ($members as $member) {
            if (!is_array($member)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            foreach (['groupid', 'userid'] as $key) {
                $value = $member[$key] ?? null;
                if (!is_int($value) && (!is_string($value) || !ctype_digit($value))) {
                    throw new \moodle_exception('invaliddata', 'error');
                }
            }
            $groupid = (int)($member['groupid'] ?? 0);
            $userid = (int)($member['userid'] ?? 0);
            if ($groupid <= 0 || $userid <= 0) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            if (!array_key_exists($groupid, $origins)) {
                $origins[$groupid] = groups_get_group($groupid);
            }
            $origin = $origins[$groupid];
            if (!$origin || (int)$origin->courseid !== $courseid) {
                throw new \moodle_exception('invalidgroupid', 'error');
            }
            if (!isset($memberships[$groupid][$userid]) || !isset($enrolled[$userid])) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            if ($groupid !== $destinationid && !groups_remove_member_allowed($origin, $userid)) {
                throw new \moodle_exception('invaliddata', 'error');
            }
            $pairs[$groupid . ':' . $userid] = ['groupid' => $groupid, 'userid' => $userid];
        }

        $result = ['added' => 0, 'removed' => 0, 'unchanged' => 0];
        // Each batch is an independent, atomic delegated transaction: never one
        // giant transaction for the whole request, and a batch failure does not
        // undo batches already committed before it (only its own pairs rollback).
        foreach (array_chunk($pairs, self::BATCH_SIZE) as $batch) {
            $transaction = $DB->start_delegated_transaction();
            try {
                foreach ($batch as $pair) {
                    if ($pair['groupid'] === $destinationid) {
                        $result['unchanged']++;
                        continue;
                    }
                    if (!isset($memberships[$destinationid][$pair['userid']])) {
                        // Moodle may return false without throwing (for example, unenrolment).
                        // Never remove the origin unless native destination creation succeeded.
                        if (!groups_add_member($destination, $pair['userid'])) {
                            throw new \moodle_exception('invaliddata', 'error');
                        }
                        $result['added']++;
                        $memberships[$destinationid][$pair['userid']] = true;
                    }
                    // The origin record read during validation, so the native API does not read it again.
                    if (!groups_remove_member($origins[$pair['groupid']], $pair['userid'])) {
                        throw new \moodle_exception('invaliddata', 'error');
                    }
                    $result['removed']++;
                }
                $transaction->allow_commit();
            } catch (\Throwable $exception) {
                // Rolls back only this batch; rethrows, aborting any later batches.
                $transaction->rollback($exception);
            }
        }
        return $result;
    }
}
