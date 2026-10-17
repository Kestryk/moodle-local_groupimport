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

namespace local_groupimport\local;

/**
 * Provenance and exact-state guard for plugin-installed user tours.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class tour_preservation {
    /** @var array Shipped definitions; never infer ownership from name or target. */
    private const DEFINITIONS = [
        'teacher' => 'local_groupimport_teacher_guide.json',
        'coursehome' => 'local_groupimport_course_home_hint.json',
    ];

    /**
     * Remember only an ID just returned by our own successful import.
     *
     * Never call this to adopt a pre-existing tour, even an identical copy.
     *
     * @param string $key Shipped definition key.
     * @param int $id Newly imported tour ID.
     * @return void
     */
    public static function remember_import(string $key, int $id): void {
        $json = self::definition($key);
        $fingerprint = self::fingerprint($id);
        if ($json === null || $fingerprint === null) {
            return;
        }
        set_config('tourbaseline_' . $key, json_encode([
            'id' => $id,
            'fingerprint' => $fingerprint,
            'definition' => hash('sha256', $json),
        ]), 'local_groupimport');
    }

    /**
     * Update an unchanged, proven plugin import without deleting its tour ID.
     *
     * Old unmarked imports cannot be distinguished from institution-created
     * copies. Preserve them. Do not establish a baseline during an upgrade.
     *
     * @param string $key Shipped definition key.
     * @return bool Whether the tour was updated.
     */
    public static function upgrade(string $key): bool {
        global $DB;

        if (!class_exists('\\tool_usertours\\tour') || !class_exists('\\tool_usertours\\step')) {
            return false;
        }
        $json = self::definition($key);
        $baseline = json_decode((string)get_config('local_groupimport', 'tourbaseline_' . $key));
        if (
            $json === null || !is_object($baseline) || empty($baseline->id) ||
            !isset($baseline->fingerprint, $baseline->definition) ||
            $baseline->definition === hash('sha256', $json)
        ) {
            return false;
        }

        $transaction = $DB->start_delegated_transaction();
        if (self::fingerprint((int)$baseline->id) !== $baseline->fingerprint) {
            $transaction->allow_commit();
            return false;
        }

        $record = $DB->get_record('tool_usertours_tours', ['id' => $baseline->id], '*', MUST_EXIST);
        $definition = json_decode($json);
        $steps = $definition->steps;
        unset($definition->steps, $definition->version);
        $definition->id = $record->id;
        $definition->sortorder = $record->sortorder;
        // Keep the same tour and user preferences. tour::remove() would also
        // renumber unrelated tours, which is forbidden by K17-11.
        $tour = \tool_usertours\tour::instance($record->id);
        foreach ($tour->get_steps() as $step) {
            $step->remove();
        }
        \tool_usertours\tour::load_from_record($definition, true)->persist(true);
        \core_collator::asort_objects_by_property($steps, 'sortorder', \core_collator::SORT_NUMERIC);
        foreach ($steps as $step) {
            $step->id = null;
            $step->tourid = $record->id;
            \tool_usertours\step::load_from_record($step, true, true)->persist(true);
        }
        self::remember_import($key, (int)$record->id);
        $transaction->allow_commit();
        return true;
    }

    /**
     * Read a complete, valid shipped definition before any database mutation.
     *
     * @param string $key Shipped definition key.
     * @return string|null JSON or null on unknown/unreadable/invalid data.
     */
    private static function definition(string $key): ?string {
        if (!isset(self::DEFINITIONS[$key])) {
            return null;
        }
        $path = __DIR__ . '/../../db/tours/' . self::DEFINITIONS[$key];
        $json = is_readable($path) ? file_get_contents($path) : false;
        $data = $json === false ? null : json_decode($json);
        if (
            !is_object($data) || !isset($data->name, $data->description, $data->pathmatch, $data->enabled, $data->configdata) ||
            !isset($data->steps) || !is_array($data->steps) || !$data->steps
        ) {
            return null;
        }
        if (!is_string($data->configdata) || !is_object(json_decode($data->configdata))) {
            return null;
        }
        foreach ($data->steps as $step) {
            if (
                !is_object($step) || !isset(
                    $step->title,
                    $step->content,
                    $step->targettype,
                    $step->targetvalue,
                    $step->sortorder,
                    $step->configdata
                ) || !is_string($step->configdata) ||
                !is_object(json_decode($step->configdata))
            ) {
                return null;
            }
        }
        return $json;
    }

    /**
     * Hash every persisted tour/step field and attachment, including identities.
     *
     * Numeric DB driver representation is normalized; JSON/text is byte exact.
     * Unknown/new columns are deliberately included and thus fail closed.
     *
     * @param int $id Proven imported ID.
     * @return string|null Fingerprint or null when the tour no longer exists.
     */
    private static function fingerprint(int $id): ?string {
        global $DB;

        $dbman = $DB->get_manager();
        foreach (['tool_usertours_tours', 'tool_usertours_steps', 'files'] as $table) {
            if (!$dbman->table_exists(new \xmldb_table($table))) {
                return null;
            }
        }
        $tour = $DB->get_record('tool_usertours_tours', ['id' => $id]);
        if (!$tour) {
            return null;
        }
        $records = [self::record_values($tour)];
        foreach ($DB->get_records('tool_usertours_steps', ['tourid' => $id], 'id ASC') as $step) {
            $records[] = self::record_values($step);
            foreach (
                $DB->get_records('files', [
                'component' => 'tool_usertours',
                'filearea' => 'stepcontent',
                'itemid' => $step->id,
                ], 'id ASC') as $file
            ) {
                $records[] = self::record_values($file);
            }
        }
        return hash('sha256', json_encode($records, JSON_THROW_ON_ERROR));
    }

    /**
     * Normalize driver scalar types while preserving null and every column.
     *
     * @param \stdClass $record Database record.
     * @return array Sorted values.
     */
    private static function record_values(\stdClass $record): array {
        $values = (array)$record;
        ksort($values);
        foreach ($values as &$value) {
            if ($value !== null) {
                $value = (string)$value;
            }
        }
        return $values;
    }
}
