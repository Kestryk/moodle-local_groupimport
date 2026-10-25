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
 * Retires (disables, never deletes) the user tours that earlier versions installed.
 *
 * K18-08: the EasyEdu Guide replaces the Moodle user tours shipped by the plugin, so
 * the plugin no longer installs any tour. On existing sites, a tour is disabled only
 * when it is proven to be a plugin import that the institution never changed.
 *
 * Identification (a tour is never matched on its name alone), either:
 *  1. Baseline marker: the plugin stored tourbaseline_KEY when it imported the tour
 *     itself (tour id plus a hash of every persisted tour, step and file field). The
 *     tour is retired if that hash still matches, so nothing was edited since; or
 *  2. Identical definition (marked or not): the tour must have the exact shipped name
 *     and path match AND its definition (description, path match, configuration, every
 *     step title, content, target and configuration) must equal a definition shipped by
 *     the plugin (db/tours/*.json and db/tours/legacy/*.json). Any difference leaves it.
 * Tours created or modified by the institution are never touched; modified plugin tours
 * are reported through mtrace so the administrator can decide.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class tour_retirement {
    /** @var array Shipped definition key => tour name, path match and known definitions. */
    private const TOURS = [
        'teacher' => [
            'name' => 'tour_groupimport_teacher_name,local_groupimport',
            'pathmatch' => '/local/groupimport/index.php%',
            'files' => ['local_groupimport_teacher_guide.json', 'legacy/teacher-v1.json'],
        ],
        'coursehome' => [
            'name' => 'tour_groupimport_coursehome_name,local_groupimport',
            'pathmatch' => '/course/view.php%',
            'files' => ['local_groupimport_course_home_hint.json', 'legacy/coursehome-v1.json'],
        ],
    ];

    /**
     * Disable every unmodified plugin tour and forget the provenance markers.
     *
     * @return array Outcome per shipped key and tour id.
     */
    public static function retire_all(): array {
        global $DB;

        $result = [];
        if (!class_exists('\\tool_usertours\\tour') || !class_exists('\\tool_usertours\\step')) {
            return $result;
        }
        foreach (self::TOURS as $key => $info) {
            $result[$key] = [];
            $baseline = json_decode((string)get_config('local_groupimport', 'tourbaseline_' . $key));
            $records = $DB->get_records('tool_usertours_tours', ['name' => $info['name'], 'pathmatch' => $info['pathmatch']]);
            foreach ($records as $record) {
                $outcome = self::retire($key, $record, $baseline);
                $result[$key][(int)$record->id] = $outcome;
                mtrace("local_groupimport tour {$record->id} ({$key}): {$outcome}");
            }
            unset_config('tourbaseline_' . $key, 'local_groupimport');
        }
        return $result;
    }

    /**
     * Retire one tour when its provenance and unchanged state are proven.
     *
     * @param string $key Shipped definition key.
     * @param \stdClass $record Tour record.
     * @param mixed $baseline Decoded marker or null.
     * @return string Outcome: disabled, already-disabled or modified.
     */
    private static function retire(string $key, \stdClass $record, $baseline): string {
        if (is_object($baseline) && isset($baseline->id, $baseline->fingerprint)) {
            // Marked import: only the exact tour the plugin imported, and only if unchanged.
            $proven = (int)$baseline->id === (int)$record->id &&
                self::fingerprint((int)$record->id) === $baseline->fingerprint;
        } else {
            $proven = false;
        }
        // Moodle itself may touch a tour (reset for all users, timestamps): an identical definition is unmodified.
        $proven = $proven || self::matches_shipped($key, (int)$record->id);
        if (!$proven) {
            return 'modified';
        }
        if (empty($record->enabled)) {
            return 'already-disabled';
        }
        \tool_usertours\tour::instance((int)$record->id)->set_enabled(false)->persist();
        return 'disabled';
    }

    /**
     * Decode a configuration, ignoring the core majorupdatetime stamp (reset for all users).
     *
     * @param string $json Configuration JSON.
     * @return mixed Decoded configuration.
     */
    private static function config(string $json) {
        $data = json_decode($json);
        if (is_object($data)) {
            unset($data->majorupdatetime);
        }
        return $data;
    }

    /**
     * Whether a stored tour equals one shipped definition (ignoring enabled and ordering).
     *
     * @param string $key Shipped definition key.
     * @param int $id Tour ID.
     * @return bool
     */
    private static function matches_shipped(string $key, int $id): bool {
        global $DB;

        $record = $DB->get_record('tool_usertours_tours', ['id' => $id]);
        if (!$record) {
            return false;
        }
        $steps = array_values($DB->get_records('tool_usertours_steps', ['tourid' => $id], 'sortorder ASC, id ASC'));
        foreach (self::TOURS[$key]['files'] as $file) {
            $path = __DIR__ . '/../../db/tours/' . $file;
            $data = is_readable($path) ? json_decode((string)file_get_contents($path)) : null;
            if (
                !is_object($data) || !isset($data->name, $data->description, $data->pathmatch, $data->configdata) ||
                !isset($data->steps) || !is_array($data->steps) || count($data->steps) !== count($steps)
            ) {
                continue;
            }
            if (
                $data->name !== $record->name || $data->description !== $record->description ||
                $data->pathmatch !== $record->pathmatch ||
                self::config($data->configdata) != self::config((string)$record->configdata)
            ) {
                continue;
            }
            $expected = $data->steps;
            usort($expected, static fn($a, $b) => (int)$a->sortorder <=> (int)$b->sortorder);
            $same = true;
            foreach ($expected as $index => $step) {
                $actual = $steps[$index];
                if (
                    $step->title !== $actual->title || $step->content !== $actual->content ||
                    (int)$step->targettype !== (int)$actual->targettype || $step->targetvalue !== $actual->targetvalue ||
                    self::config($step->configdata) != self::config((string)$actual->configdata)
                ) {
                    $same = false;
                    break;
                }
            }
            if ($same) {
                return true;
            }
        }
        return false;
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
