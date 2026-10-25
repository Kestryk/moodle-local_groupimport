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
 * Portable filtering of historical import data, including pre-S2 records.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class history_privacy {
    /** @var string[] Lists whose entries carry a participant id. */
    private const MEMBERLISTS = ['desiredstate', 'addedmembers', 'removedmembers'];

    /**
     * Decode only a JSON object; malformed data must never be exported raw.
     * @param string $json Stored changes.
     * @return array
     */
    public static function decode(string $json): array {
        $value = json_decode($json, true);
        return is_array($value) ? $value : [];
    }

    /**
     * Normalize an import identifier for privacy matching, not authentication.
     * @param string $value Identifier.
     * @return string
     */
    public static function normalize(string $value): string {
        return \core_text::strtolower(trim($value));
    }

    /**
     * Collect explicit participant ids from every supported historical shape.
     * @param array $changes Decoded changes.
     * @return int[]
     */
    public static function userids(array $changes): array {
        $ids = [];
        foreach (array_merge(self::MEMBERLISTS, ['reportrows']) as $key) {
            foreach ((array)($changes[$key] ?? []) as $row) {
                if (is_array($row) && (int)($row['userid'] ?? 0) > 0) {
                    $ids[(int)$row['userid']] = (int)$row['userid'];
                }
            }
        }
        return array_values($ids);
    }

    /**
     * Collect identifiers, including failed report rows without a userid.
     * @param array $changes Decoded changes.
     * @return string[]
     */
    public static function identifiers(array $changes): array {
        $values = [];
        foreach (['desiredstate', 'reportrows'] as $key) {
            foreach ((array)($changes[$key] ?? []) as $row) {
                $value = is_array($row) ? self::normalize((string)($row['identifier'] ?? '')) : '';
                if ($value !== '') {
                    $values[$value] = $value;
                }
            }
        }
        return array_values($values);
    }

    /**
     * Project or redact a subject without copying another participant's rows.
     * Historical identifiers stored beside a userid remain matchable after renaming.
     * @param array $changes Decoded history.
     * @param int $userid Subject.
     * @param string[] $identifiers Current account identifiers.
     * @param bool $keep True exports only the subject, false removes the subject.
     * @return array
     */
    public static function filter(array $changes, int $userid, array $identifiers, bool $keep): array {
        $identifiers = array_map([self::class, 'normalize'], $identifiers);
        foreach ((array)($changes['desiredstate'] ?? []) as $row) {
            if (is_array($row) && (int)($row['userid'] ?? 0) === $userid) {
                $identifiers[] = self::normalize((string)($row['identifier'] ?? ''));
            }
        }
        $identifiers = array_filter(array_unique($identifiers), static fn($value) => $value !== '');
        $result = $keep ? [] : $changes;
        foreach (array_merge(self::MEMBERLISTS, ['reportrows']) as $key) {
            $rows = array_filter((array)($changes[$key] ?? []), static function ($row) use (
                $userid,
                $identifiers,
                $keep
            ): bool {
                if (!is_array($row)) {
                    return false;
                }
                $rowuserid = (int)($row['userid'] ?? 0);
                $matches = $rowuserid > 0 ? $rowuserid === $userid :
                    in_array(self::normalize((string)($row['identifier'] ?? '')), $identifiers, true);
                return $keep ? $matches : !$matches;
            });
            if ($rows || array_key_exists($key, $changes)) {
                $result[$key] = array_values($rows);
            }
        }
        return $result;
    }

    /**
     * Whether the historical payload contains data for this subject.
     * @param array $changes History.
     * @param int $userid Subject.
     * @param string[] $identifiers Current identifiers.
     * @return bool
     */
    public static function contains(array $changes, int $userid, array $identifiers): bool {
        return (bool)array_filter(self::filter($changes, $userid, $identifiers, true));
    }
}
