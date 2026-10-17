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

/**
 * Isolated, rolled-back real user-tour API preservation matrix.
 *
 * Run only while owning the matching pool lease; no source/runtime deployment.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

use local_groupimport\local\tour_preservation;

define('CLI_SCRIPT', true);
define('TOUR_PRESERVATION_POOL_ROOT', match ($argv[1] ?? '') {
    'C:/dev/Moodle 51 Claude/moodle' => 'C:/dev/Moodle 51 Claude/moodle',
    'C:/dev/Moodle 51 Claude 2/moodle' => 'C:/dev/Moodle 51 Claude 2/moodle',
    'C:/dev/Moodle 51 Claude 3/moodle' => 'C:/dev/Moodle 51 Claude 3/moodle',
    default => throw new RuntimeException('Explicit allowed pool root required.'),
});
require(TOUR_PRESERVATION_POOL_ROOT . '/config.php');
$moodleroot = TOUR_PRESERVATION_POOL_ROOT;
$reportpath = $argv[2] ?? '';
$allowed = [
    'C:/dev/Moodle 51 Claude/moodle' => 'http://localhost:8052',
    'C:/dev/Moodle 51 Claude 2/moodle' => 'http://localhost:8054',
    'C:/dev/Moodle 51 Claude 3/moodle' => 'http://localhost:8055',
];
if ($CFG->wwwroot !== $allowed[$moodleroot] || $reportpath === '') {
    throw new RuntimeException('Pool wwwroot mismatch or missing external report.');
}
if (!str_starts_with(str_replace('\\', '/', $reportpath), 'C:/dev/artifacts/easystud-tour-preservation-20261017/')) {
    throw new RuntimeException('Use the dedicated external evidence directory.');
}
if (file_exists($reportpath)) {
    throw new RuntimeException('Preserve existing reports; choose a new run filename.');
}
$pluginroot = dirname(__DIR__, 2);
require_once($pluginroot . '/classes/local/tour_preservation.php');

/**
 * Exact database state digest, including pre-existing tours and progress.
 *
 * @return array Per-table hashes; never disclose row contents.
 */
function tour_preservation_state(): array {
    global $DB;
    $state = [];
    foreach (['tool_usertours_tours', 'tool_usertours_steps', 'user_preferences'] as $table) {
        $state[$table] = hash('sha256', json_encode($DB->get_records($table, null, 'id ASC')));
    }
    $state['files'] = hash('sha256', json_encode($DB->get_records('files', [
        'component' => 'tool_usertours',
    ], 'id ASC')));
    $state['config'] = hash('sha256', json_encode($DB->get_records('config_plugins', [
        'plugin' => 'local_groupimport',
    ], 'id ASC')));
    return $state;
}

/**
 * Fail loudly without allowing a success report after partial assertions.
 *
 * @param bool $condition Required invariant.
 * @param string $message Failure description.
 * @return void
 */
function tour_preservation_assert(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

/**
 * Seed only a newly created fixture, modelling a prior package's own import.
 *
 * @param string $key Shipped tour key.
 * @return int Owned fixture ID.
 */
function tour_preservation_seed(string $key): int {
    global $DB, $pluginroot;
    $filename = $key === 'teacher' ? 'teacher' : 'coursehome';
    $oldjson = file_get_contents($pluginroot . '/tests/fixtures/tours/' . $filename . '-v1.json');
    $tour = \tool_usertours\manager::import_tour_from_json($oldjson);
    $id = (int)$tour->get_id();
    tour_preservation::remember_import($key, $id);
    // Model the original package's definition digest, while the actual state
    // fingerprint and imported ID are obtained from the real native importer.
    $baseline = json_decode(get_config('local_groupimport', 'tourbaseline_' . $key));
    $baseline->definition = hash('sha256', $oldjson);
    set_config('tourbaseline_' . $key, json_encode($baseline), 'local_groupimport');
    return $id;
}

/**
 * Exact rows of one fixture, independent of the production guard algorithm.
 *
 * @param int $id Owned tour ID.
 * @return string Serialized database state.
 */
function tour_preservation_owned(int $id): string {
    global $DB;
    return json_encode([
        $DB->get_record('tool_usertours_tours', ['id' => $id]),
        $DB->get_records('tool_usertours_steps', ['tourid' => $id], 'id ASC'),
        $DB->get_records('files', ['component' => 'tool_usertours'], 'id ASC'),
        $DB->get_records('user_preferences', null, 'id ASC'),
    ]);
}

/**
 * Compare to an independent native import of the destination package.
 *
 * @param int $id Owned fixture ID.
 * @return array All persisted definition fields except generated identities/order.
 */
function tour_preservation_definition(int $id): array {
    global $DB;
    $tour = $DB->get_record('tool_usertours_tours', ['id' => $id]);
    unset($tour->id, $tour->sortorder);
    $steps = array_values($DB->get_records('tool_usertours_steps', ['tourid' => $id], 'sortorder ASC, id ASC'));
    foreach ($steps as $step) {
        unset($step->id, $step->tourid);
    }
    return [$tour, $steps];
}

$before = tour_preservation_state();
$transaction = $DB->start_delegated_transaction();
$cases = [];
$failure = null;
try {
    foreach (['en', 'fr'] as $language) {
        force_current_language($language);
        foreach (['teacher', 'coursehome'] as $key) {
            $filename = $key === 'teacher' ? 'local_groupimport_teacher_guide' : 'local_groupimport_course_home_hint';
            $currentjson = file_get_contents($pluginroot . '/db/tours/' . $filename . '.json');
            $expected = \tool_usertours\manager::import_tour_from_json($currentjson);
            $id = tour_preservation_seed($key);
            $prefid = $DB->insert_record('user_preferences', (object)[
                'userid' => get_admin()->id,
                'name' => \tool_usertours\tour::TOUR_LAST_COMPLETED_BY_USER . $id,
                'value' => '1234567890',
            ]);
            $pref = $DB->get_record('user_preferences', ['id' => $prefid]);
            $DB->insert_record('user_preferences', (object)[
                'userid' => get_admin()->id,
                'name' => \tool_usertours\tour::TOUR_REQUESTED_BY_USER . $id,
                'value' => '1234567891',
            ]);
            $preferences = json_encode($DB->get_records('user_preferences', null, 'id ASC'));
            $sortorder = $DB->get_field('tool_usertours_tours', 'sortorder', ['id' => $id]);
            $unrelated = [];
            foreach ($DB->get_records('tool_usertours_tours', null, 'id ASC') as $row) {
                if ((int)$row->id !== $id) {
                    $unrelated[$row->id] = $row;
                }
            }
            tour_preservation_assert(tour_preservation::upgrade($key), 'Intact proven fixture must update.');
            tour_preservation_assert(
                tour_preservation_definition($id) == tour_preservation_definition((int)$expected->get_id()),
                'Updated definition differs from independently imported current package.'
            );
            tour_preservation_assert($DB->get_record('user_preferences', ['id' => $prefid]) == $pref, 'Progress changed.');
            tour_preservation_assert(
                json_encode($DB->get_records('user_preferences', null, 'id ASC')) === $preferences,
                'User preferences changed.'
            );
            tour_preservation_assert(
                $DB->get_field('tool_usertours_tours', 'sortorder', ['id' => $id]) == $sortorder,
                'Owned tour order changed.'
            );
            foreach ($unrelated as $row) {
                tour_preservation_assert(
                    $DB->get_record('tool_usertours_tours', ['id' => $row->id]) == $row,
                    'Unrelated tour changed.'
                );
            }
            tour_preservation_assert(!tour_preservation::upgrade($key), 'Repeated update must be inert.');
            $cases[] = $language . ':' . $key . ':intact-updated-id-order-progress-preserved-idempotent';
        }

        $mutations = [
            'name' => ['tour', 'name', 'Institution tour'],
            'description' => ['tour', 'description', 'Institution description'],
            'path' => ['tour', 'pathmatch', '/institution/%'],
            'disabled' => ['tour', 'enabled', 0],
            'tour-order' => ['tour', 'sortorder', 997],
            'tour-config' => ['tour', 'configdata', '{"placement":"top","filtervalues":{"role":["student"]}}'],
            'end-label' => ['tour', 'endtourlabel', 'Institution end'],
            'step-numbers' => ['tour', 'displaystepnumbers', 1],
            'step-title' => ['step', 'title', 'Institution title'],
            'step-content' => ['step', 'content', 'Institution content with unchanged old target'],
            'step-format' => ['step', 'contentformat', FORMAT_PLAIN],
            'step-target-type' => ['step', 'targettype', 1],
            'step-target' => ['step', 'targetvalue', '#institution'],
            'step-order' => ['step', 'sortorder', 997],
            'step-config' => ['step', 'configdata', '{"placement":"left","orphan":true}'],
        ];
        foreach ($mutations as $name => [$kind, $field, $value]) {
            $id = tour_preservation_seed('teacher');
            $table = $kind === 'tour' ? 'tool_usertours_tours' : 'tool_usertours_steps';
            $conditions = $kind === 'tour' ? ['id' => $id] : ['tourid' => $id];
            $rows = $DB->get_records($table, $conditions, 'id ASC');
            $row = reset($rows);
            tour_preservation_assert($row->$field != $value, 'Mutation must differ: ' . $name);
            $DB->set_field($table, $field, $value, ['id' => $row->id]);
            $state = tour_preservation_owned($id);
            tour_preservation_assert(!tour_preservation::upgrade('teacher'), 'Modified fixture updated: ' . $name);
            tour_preservation_assert(tour_preservation_owned($id) === $state, 'Modified fixture changed: ' . $name);
            $cases[] = $language . ':modified-' . $name . ':untouched';
        }

        $othercases = ['added-step', 'removed-step', 'identical-unmarked', 'copied-unmarked', 'third-party', 'corrupt-baseline'];
        foreach ($othercases as $name) {
            $id = tour_preservation_seed('teacher');
            $steps = $DB->get_records('tool_usertours_steps', ['tourid' => $id], 'id ASC');
            $step = reset($steps);
            if ($name === 'added-step') {
                unset($step->id);
                $DB->insert_record('tool_usertours_steps', $step);
            } else if ($name === 'removed-step') {
                $DB->delete_records('tool_usertours_steps', ['id' => $step->id]);
            } else if ($name === 'corrupt-baseline') {
                set_config('tourbaseline_teacher', '{broken', 'local_groupimport');
            } else {
                unset_config('tourbaseline_teacher', 'local_groupimport');
                if ($name === 'third-party') {
                    $DB->set_field('tool_usertours_tours', 'name', 'Institution tour', ['id' => $id]);
                }
                if ($name === 'copied-unmarked') {
                    $oldjson = file_get_contents($pluginroot . '/tests/fixtures/tours/teacher-v1.json');
                    $copy = \tool_usertours\manager::import_tour_from_json($oldjson);
                    $id = (int)$copy->get_id();
                }
            }
            $state = tour_preservation_owned($id);
            tour_preservation_assert(!tour_preservation::upgrade('teacher'), 'Unsafe update: ' . $name);
            tour_preservation_assert(tour_preservation_owned($id) === $state, 'Unsafe mutation: ' . $name);
            $cases[] = $language . ':' . $name . ':untouched';
        }
    }
} catch (Throwable $error) {
    $failure = get_class($error) . ': ' . $error->getMessage();
} finally {
    try {
        $transaction->rollback(new RuntimeException('Expected fixture rollback.'));
    } catch (RuntimeException $rollback) {
        if ($rollback->getMessage() !== 'Expected fixture rollback.') {
            $failure = 'Rollback failed: ' . $rollback->getMessage();
        }
    }
    // Set_config() invalidates this shared cache; do so again after rollback.
    \cache_helper::invalidate_by_definition('core', 'config', [], ['local_groupimport']);
    \tool_usertours\cache::notify_tour_change();
    force_current_language(null);
}
$after = tour_preservation_state();
$clean = $before === $after;
$report = [
    'status' => $failure === null && $clean ? 'PASS' : 'FAIL',
    'moodlebranch' => $CFG->branch,
    'php' => PHP_VERSION,
    'cases' => $cases,
    'failure' => $failure,
    'before' => $before,
    'after' => $after,
    'fixture_cleanup_exact' => $clean,
    'scope' => 'Real core importer and guarded replacement, rolled-back DB fixtures; no HTTP or full plugin upgrade.',
];
file_put_contents($reportpath, json_encode($report, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
echo $report['status'] . ': ' . count($cases) . ' cases; exact cleanup=' . ($clean ? 'yes' : 'no') . PHP_EOL;
exit($report['status'] === 'PASS' ? 0 : 1);
