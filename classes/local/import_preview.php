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
 * Session-owned editable preview and fail-closed confirmation transport.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class import_preview {
    /** Explicit preview bound, independent of PHP max_input_vars. */
    public const MAX_ROWS = 100000;
    /** Maximum uploaded file size. */
    public const MAX_BYTES = 5242880;
    /** Session previews expire after an hour. */
    private const TTL = 3600;

    /**
     * Save a bounded preview under an unpredictable, session-owned token.
     *
     * @param int $courseid Course owning the preview.
     * @param array $preview Preview data containing the editable rows.
     * @param int $maxrows Caller row limit, bounded by the global preview limit.
     * @return string Unpredictable token identifying this session-owned preview.
     * @throws \moodle_exception If the preview exceeds the permitted row count.
     */
    public static function store(int $courseid, array $preview, int $maxrows = self::MAX_ROWS): string {
        global $SESSION;
        if (count($preview['rows']) > min(self::MAX_ROWS, $maxrows)) {
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
     *
     * @param int $courseid Authorised course owning the preview.
     * @param string $token Session-owned preview token.
     * @return array Saved preview data.
     * @throws \moodle_exception If the token is absent, expired or belongs to another course.
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
     *
     * @param string $token Session-owned preview token to discard after a successful commit.
     * @return void
     */
    public static function consume(string $token): void {
        global $SESSION;
        unset($SESSION->local_groupimport_previews[$token]);
    }

    /**
     * Apply edited cells and excluded indexes to the saved preview.
     * No-JS forms require all three complete cell arrays and an end sentinel.
     *
     * @param array $preview Saved session-owned preview to update.
     * @param string $payload Compact JSON edit payload, or an empty string for the no-JS form.
     * @param array $fallback Complete no-JS cell arrays and end sentinel.
     * @return array Preview with validated cell edits and excluded row indexes.
     * @throws \moodle_exception If the submitted preview is incomplete or invalid.
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
    /**
     * Save edits for the server-selected page; unseen rows cannot be overwritten.
     * @param int $courseid Authorised course.
     * @param string $token Session-owned token.
     * @param string $payload Compact browser payload.
     * @param array $fallback Complete controls of the current page, for no JS.
     * @param int $nextpage Requested next page, or minus one to stay.
     * @return array Updated preview with its token.
     */
    public static function save_page(
        int $courseid,
        string $token,
        string $payload,
        array $fallback,
        int $nextpage = -1
    ): array {
        global $SESSION;
        $preview = self::load($courseid, $token);
        $count = count($preview['rows']);
        $start = (int)($preview['page'] ?? 0) * 100;
        $indexes = range($start, min($count, $start + 100) - 1);
        $fail = static function (): void {
            throw new \moodle_exception('importpreviewincomplete', 'local_groupimport');
        };
        if ($payload !== '') {
            if (strlen($payload) > self::MAX_BYTES) {
                $fail();
            }
            $data = json_decode($payload, true);
            if (
                !is_array($data) || ($data['count'] ?? null) !== $count ||
                    !is_array($data['edits'] ?? null) || !is_array($data['excluded'] ?? null)
            ) {
                $fail();
            }
        } else {
            if (($fallback['complete'] ?? null) !== $count) {
                $fail();
            }
            $data = ['count' => $count, 'edits' => [], 'excluded' => []];
            foreach (['identifier', 'groupname', 'groupingname'] as $field) {
                if (array_keys($fallback[$field] ?? []) !== $indexes) {
                    $fail();
                }
            }
            if (array_diff(array_keys($fallback['enabled'] ?? []), $indexes)) {
                $fail();
            }
            foreach ($indexes as $index) {
                $data['edits'][] = [
                    'index' => $index,
                    'identifier' => $fallback['identifier'][$index],
                    'groupname' => $fallback['groupname'][$index],
                    'groupingname' => $fallback['groupingname'][$index],
                ];
                if (($fallback['enabled'][$index] ?? 0) !== 1) {
                    $data['excluded'][] = $index;
                }
            }
        }
        foreach ($data['edits'] as $edit) {
            if (!is_array($edit) || !in_array($edit['index'] ?? null, $indexes, true)) {
                $fail();
            }
        }
        foreach ($data['excluded'] as $index) {
            if (!in_array($index, $indexes, true)) {
                $fail();
            }
        }
        // Reuse the strict S6 decoder, including lengths/types/duplicate checks.
        $edits = $data;
        $edits['excluded'] = [];
        $preview['rows'] = self::confirm($preview, json_encode($edits, JSON_THROW_ON_ERROR), []);
        self::confirm($preview, json_encode($data, JSON_THROW_ON_ERROR), []);
        $excluded = $preview['excluded'] ?? [];
        foreach ($indexes as $index) {
            unset($excluded[$index]);
        }
        foreach ($data['excluded'] as $index) {
            $excluded[$index] = true;
        }
        $preview['excluded'] = $excluded;
        if ($nextpage >= 0) {
            $preview['page'] = min((int)ceil($count / 100) - 1, $nextpage);
        }
        $SESSION->local_groupimport_previews[$token]['preview'] = $preview;
        $preview['token'] = $token;
        return $preview;
    }

    /**
     * Confirm every page's saved edits and exclusions, without loading the DOM.
     * @param array $preview Session-owned preview.
     * @return array Selected rows.
     */
    public static function selected_rows(array $preview): array {
        $data = ['count' => count($preview['rows']), 'edits' => [],
            'excluded' => array_keys($preview['excluded'] ?? [])];
        return self::confirm($preview, json_encode($data, JSON_THROW_ON_ERROR), []);
    }
}
