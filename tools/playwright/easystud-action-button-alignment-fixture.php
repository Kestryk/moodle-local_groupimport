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
// Deterministic, disposable fixture for the supervised 0035 visual review.
// It never accepts credentials and records every mutable id in its manifest.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$options = ['moodle-root' => null, 'action' => null, 'manifest' => null, 'run-id' => null, 'help' => false];
for ($index = 1; $index < count($argv); $index++) {
    $argument = $argv[$index];
    if ($argument === '--help' || $argument === '-h') {
        $options['help'] = true;
        continue;
    }
    if (!str_starts_with($argument, '--')) {
        continue;
    }
    $key = substr($argument, 2);
    if (!array_key_exists($key, $options) || $index + 1 >= count($argv)) {
        continue;
    }
    $options[$key] = $argv[++$index];
}

if ($options['help'] || !$options['moodle-root'] || !$options['action'] || !$options['manifest']) {
    fwrite(
        STDERR,
        "Usage: php easystud-action-button-alignment-fixture.php " .
        "--moodle-root=<root> --action=setup|cleanup --manifest=<external-json> [--run-id=<id>]\n"
    );
    exit(2);
}

$moodleroot = realpath($options['moodle-root']);
if (!$moodleroot || !is_file($moodleroot . DIRECTORY_SEPARATOR . 'config.php')) {
    fwrite(STDERR, "Invalid Moodle root.\n");
    exit(2);
}
require($moodleroot . DIRECTORY_SEPARATOR . 'config.php');
require_once($CFG->dirroot . '/course/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->libdir . '/enrollib.php');
$USER = get_admin();
/**
 * Perform isolated fixture operation output_fixture_json.
 * @param array $value Fixture argument.
 * @return void Fixture result.
 */
function output_fixture_json(array $value): void {
    echo json_encode($value, JSON_UNESCAPED_SLASHES) . PHP_EOL;
}
/**
 * Perform isolated fixture operation fixture_fail.
 * @param string $message Fixture argument.
 * @return void Fixture result.
 */
function fixture_fail(string $message): void {
    fwrite(STDERR, $message . PHP_EOL);
    exit(1);
}
/**
 * Perform isolated fixture operation fixture_write_manifest.
 * @param string $path Fixture argument.
 * @param array $manifest Fixture argument.
 * @return void Fixture result.
 */
function fixture_write_manifest(string $path, array $manifest): void {
    $directory = dirname($path);
    if (!is_dir($directory) || !is_writable($directory)) {
        fixture_fail('Fixture manifest directory is not writable.');
    }
    file_put_contents($path, json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) . PHP_EOL, LOCK_EX);
}
/**
 * Perform isolated fixture operation fixture_cleanup_course.
 * @param int $courseid Fixture argument.
 * @return array Fixture result.
 */
function fixture_cleanup_course(int $courseid): array {
    global $DB;
    $cleanuperror = null;
    if ($DB->record_exists('course', ['id' => $courseid])) {
        try {
            delete_course($courseid, false);
        } catch (Throwable $exception) {
            // Moodle's backup/controller teardown can throw after the course
            // has already been removed. Re-check the exact fixture before
            // reporting failure, and preserve the error when it persists.
            $cleanuperror = $exception->getMessage();
        }
    }
    $complete = !$DB->record_exists('course', ['id' => $courseid]);
    return [
        'complete' => $complete,
        'courseId' => $courseid,
        'error' => $complete ? null : $cleanuperror,
    ];
}

if ($options['action'] === 'setup') {
    if (!$options['run-id'] || !preg_match('/^[A-Za-z0-9-]+$/', $options['run-id'])) {
        fixture_fail('A safe run-id is required for setup.');
    }

    $courseid = null;
    try {
        $categoryid = (int)$DB->get_field_sql('SELECT id FROM {course_categories} ORDER BY id ASC', [], IGNORE_MULTIPLE);
        if (!$categoryid) {
            fixture_fail('No Moodle course category is available for the fixture.');
        }
        $suffix = strtolower(substr(hash('sha256', $options['run-id']), 0, 10));
        $course = create_course((object)[
            'fullname' => 'EasyStud action alignment ' . $suffix,
            'shortname' => 'eed-ui-0035-' . $suffix,
            'category' => $categoryid,
            'visible' => 1,
        ]);
        $courseid = (int)$course->id;
        $admin = get_admin();
        if (!$admin) {
            throw new RuntimeException('No Moodle administrator is available for the fixture.');
        }
        $manualinstances = enrol_get_instances($course->id, true);
        $manualinstance = null;
        foreach ($manualinstances as $instance) {
            if ($instance->enrol === 'manual') {
                $manualinstance = $instance;
                break;
            }
        }
        if (!$manualinstance) {
            throw new RuntimeException('The fixture course has no manual enrolment instance.');
        }
        $manualplugin = enrol_get_plugin('manual');
        $manualplugin->enrol_user($manualinstance, $admin->id, 5);

        $groups = [];
        foreach (['Alpha group', 'Beta group'] as $name) {
            $groupid = groups_create_group((object)['courseid' => $course->id, 'name' => $name]);
            groups_add_member($groupid, $admin->id);
            $groups[] = $groupid;
        }
        $manifest = [
            'schemaVersion' => 1,
            'courseId' => $courseid,
            'groupIds' => $groups,
            'managerUrl' => $CFG->wwwroot . '/local/groupimport/manage.php?id=' . $courseid,
        ];
        fixture_write_manifest($options['manifest'], $manifest);
        output_fixture_json($manifest);
        exit(0);
    } catch (Throwable $exception) {
        if ($courseid && $DB->record_exists('course', ['id' => $courseid])) {
            $cleanup = fixture_cleanup_course($courseid);
            if (!$cleanup['complete']) {
                fixture_fail('Fixture setup failed and cleanup is incomplete: ' .
                    ($cleanup['error'] ?: 'course still exists.'));
            }
        }
        throw $exception;
    }
}

if ($options['action'] === 'cleanup') {
    if (!is_file($options['manifest'])) {
        output_fixture_json(['complete' => true, 'reason' => 'no-manifest']);
        exit(0);
    }
    $manifest = json_decode(file_get_contents($options['manifest']), true);
    if (!is_array($manifest) || empty($manifest['courseId'])) {
        fixture_fail('Fixture manifest is invalid.');
    }
    $courseid = (int)$manifest['courseId'];
    $cleanup = fixture_cleanup_course($courseid);
    output_fixture_json($cleanup);
    exit($cleanup['complete'] ? 0 : 1);
}

fixture_fail('Unsupported fixture action.');
