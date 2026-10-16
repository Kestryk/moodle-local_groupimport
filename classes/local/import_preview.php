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

defined('MOODLE_INTERNAL') || die();

/**
 * Session-owned editable preview and fail-closed confirmation transport.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_preview {
    /** Explicit preview bound, independent of PHP max_input_vars. */
    public const MAX_ROWS = 5000;
    /** Maximum uploaded file size. */
    public const MAX_BYTES = 5242880;
    /** Session previews expire after an hour. */
    private const TTL = 3600;

    /**
     * Save a bounded preview under an unpredictable, session-owned token.
     */
    public static function store(int $courseid, array $preview): string {
        global $SESSION;
        if (count($preview['rows']) > self::MAX_ROWS) {
            throw new \moodle_exception('importrowlimit', 'local_groupimport', '', self::MAX_ROWS);
        }
        $previews = $SESSION->local_groupimport_previews ?? [];
        $previews = array_filter($previews, static function ($entry): bool {
            return $entry['created'] >= time() - self::TTL;
        });
        while (count($previews) >= 5) {
            array_shift($previews);
        }
        $token = bin2hex(random_bytes(16));
        $previews[$token] = ['courseid' => $courseid, 'created' => time(), 'preview' => $preview];
        $SESSION->local_groupimport_previews = $previews;
        return $token;
    }

    /**
     * Resolve only this user's unexpired preview in this course.
     */
    public static function load(int $courseid, string $token): array {
        global $SESSION;
        $entry = $SESSION->local_groupimport_previews[$token] ?? null;
        if (!$entry || $entry['courseid'] !== $courseid || $entry['created'] < time() - self::TTL) {
            throw new \moodle_exception('importpreviewexpired', 'local_groupimport');
        }
        return $entry['preview'];
    }

    /**
     * Consume only after memberships and history have committed.
     */
    public static function consume(string $token): void {
        global $SESSION;
        unset($SESSION->local_groupimport_previews[$token]);
    }

    /**
     * Apply edited cells and excluded indexes to the saved preview.
     * No-JS forms require all three complete cell arrays and an end sentinel.
     */
    public static function confirm(array $preview, string $payload, array $fallback): array {
        $rows = $preview['rows'];
        $count = count($rows);
        $invalid = static function (): void {
            throw new \moodle_exception('importpreviewincomplete', 'local_groupimport');
        };
        if (!$count || $count > self::MAX_ROWS) {
            $invalid();
        }
        $fields = ['identifier', 'groupname', 'groupingname'];
        $excluded = [];
        if ($payload !== '') {
            if (strlen($payload) > self::MAX_BYTES) {
                $invalid();
            }
            try {
                $data = json_decode($payload, true, 16, JSON_THROW_ON_ERROR);
            } catch (\JsonException $exception) {
                $invalid();
            }
            if (
                !is_array($data) || ($data['count'] ?? null) !== $count ||
                    !is_array($data['edits'] ?? null) || !is_array($data['excluded'] ?? null) ||
                    count($data['edits']) > $count || count($data['excluded']) > $count
            ) {
                $invalid();
            }
            $seen = [];
            foreach ($data['edits'] as $edit) {
                if (
                    !is_array($edit) || !is_int($edit['index'] ?? null) || $edit['index'] < 0 ||
                        $edit['index'] >= $count || isset($seen[$edit['index']])
                ) {
                    $invalid();
                }
                $index = $edit['index'];
                $seen[$index] = true;
                foreach ($fields as $field) {
                    if (!is_string($edit[$field] ?? null) || strlen($edit[$field]) > 4096) {
                        $invalid();
                    }
                    $rows[$index][$field] = trim($edit[$field]);
                }
            }
            foreach ($data['excluded'] as $index) {
                if (!is_int($index) || $index < 0 || $index >= $count || isset($excluded[$index])) {
                    $invalid();
                }
                $excluded[$index] = true;
            }
        } else {
            if (($fallback['complete'] ?? 0) !== $count) {
                $invalid();
            }
            foreach ($fields as $field) {
                if (!is_array($fallback[$field] ?? null) || array_keys($fallback[$field]) !== range(0, $count - 1)) {
                    $invalid();
                }
                foreach ($fallback[$field] as $index => $value) {
                    if (!is_string($value) || strlen($value) > 4096) {
                        $invalid();
                    }
                    $rows[$index][$field] = trim($value);
                }
            }
            $enabled = $fallback['enabled'] ?? [];
            foreach ($enabled as $index => $value) {
                if (!is_int($index) || $index < 0 || $index >= $count || $value !== 1) {
                    $invalid();
                }
            }
            foreach ($rows as $index => $row) {
                if (!isset($enabled[$index])) {
                    $excluded[$index] = true;
                }
            }
        }
        return array_values(array_diff_key($rows, $excluded));
    }
}
