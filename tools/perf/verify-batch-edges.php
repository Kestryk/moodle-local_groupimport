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
 * AP-E5 native equality edge cases on the exact owned Perf fixture only.
 * Temporary profile/user/enrolment changes are rolled back, not persisted.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../tools/release/fixtures/source_file.php');
if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$options = getopt('', ['moodle-root:', 'manifest:', 'before-root:', 'after-root:', 'output:']);
foreach (['moodle-root', 'manifest', 'before-root', 'after-root', 'output'] as $key) {
    if (empty($options[$key])) {
        throw new RuntimeException('Explicit roots, manifest and output required.');
    }
}
require($options['moodle-root'] . '/config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
easystud_perf_require_local();
if ($CFG->dbname !== 'moodle51perf' || parse_url($CFG->wwwroot, PHP_URL_PORT) !== 8051) {
    throw new RuntimeException('Edge mutations are restricted to the dedicated Perf copy.');
}
$manifest = easystud_perf_manifest($options['manifest']);
easystud_perf_validate($manifest);
require_once($options['after-root'] . '/classes/local/batch_reader.php');
\core\session\manager::set_user(get_admin());

/**
 * Load actual pure helpers under distinct names; business logic is unchanged.
 */
function perf_edge_load(string $root, string $entry, string $prefix): void {
    $source = file_get_contents($root . '/' . $entry);
    $start = strpos($source, "\nfunction ");
    $end = $entry === 'index.php' ? strpos($source, '// Try to retrieve the course id via GET or POST.') : strlen($source);
    if ($start === false || $end === false) {
        throw new RuntimeException('Pure helper boundaries changed.');
    }
    $code = '';
    foreach (token_get_all('<?php ' . substr($source, $start, $end - $start)) as $token) {
        if (is_array($token) && $token[0] === T_OPEN_TAG) {
            continue;
        }
        if (is_array($token) && $token[0] === T_STRING && str_starts_with($token[1], 'local_groupimport_')) {
            $code .= $prefix . $token[1];
        } else if (
            is_array($token) && $token[0] === T_CONSTANT_ENCAPSED_STRING &&
                preg_match('/^[\'"]local_groupimport_[a-z_]+[\'"]$/', $token[1])
        ) {
            $code .= $token[1][0] . $prefix . substr($token[1], 1);
        } else {
            $code .= is_array($token) ? $token[1] : $token;
        }
    }
    require(\local_groupimport_fixture_source_file($code));
}
foreach (['before', 'after'] as $variant) {
    foreach (['ajax.php', 'index.php'] as $entry) {
        perf_edge_load($options[$variant . '-root'], $entry, 'perf_' . $variant . '_');
    }
}
$checks = [];
$error = null;
$rolledback = false;
$relationships = $DB->get_records_sql(
    'SELECT m.id, m.groupid, m.userid FROM {groups_members} m ' .
    'JOIN {groups} g ON g.id = m.groupid WHERE g.courseid = :courseid ORDER BY m.id',
    ['courseid' => $manifest['courseId']]
);
$relationshash = hash('sha256', json_encode($relationships));
$transaction = $DB->start_delegated_transaction();
try {
    $users = [];
    foreach (array_slice($manifest['userIds'], 0, 6) as $id) {
        $users[] = $DB->get_record('user', ['id' => $id, 'deleted' => 0], '*', MUST_EXIST);
    }
    $fieldname = 'perfe5' . substr(hash('sha256', $manifest['runId']), 0, 16);
    if ($DB->record_exists('user_info_field', ['shortname' => $fieldname])) {
        throw new RuntimeException('Profile field ownership collision.');
    }
    $fieldid = $DB->insert_record('user_info_field', (object)[
        'shortname' => $fieldname, 'name' => 'AP-E5 disposable fixture field', 'datatype' => 'text',
        'categoryid' => 0, 'sortorder' => 9999,
    ]);
    foreach ([$users[0], $users[1]] as $user) {
        $DB->insert_record('user_info_data', (object)[
            'userid' => $user->id, 'fieldid' => $fieldid, 'data' => 'duplicate-profile-value', 'dataformat' => FORMAT_PLAIN,
        ]);
    }
    $DB->set_field('user', 'email', $users[1]->username, ['id' => $users[0]->id]);
    $enrol = $DB->get_record('enrol', ['courseid' => $manifest['courseId'], 'enrol' => 'manual'], '*', MUST_EXIST);
    enrol_get_plugin('manual')->unenrol_user($enrol, $users[4]->id);
    $DB->set_field('user', 'deleted', 1, ['id' => $users[5]->id]);
    $context = context_course::instance($manifest['courseId']);
    $tokens = [(string)$users[0]->id, '000' . $users[0]->id, $users[0]->username,
        strtoupper($users[0]->username), $users[1]->username, $users[2]->email, $users[3]->idnumber,
        '', ' ', $users[0]->username, 'no-such-user', (string)$users[4]->id, (string)$users[5]->id,
        'duplicate-profile-value', $users[0]->firstname, $users[0]->lastname];
    foreach (['email,username,idnumber,profile_field_' . $fieldname, 'username', 'profile_field_' . $fieldname, ''] as $setting) {
        $CFG->forced_plugin_settings['local_groupimport']['alloweduserfields'] = $setting;
        $bulk = perf_after_local_groupimport_find_users_by_identifiers($tokens);
        foreach ($tokens as $index => $token) {
            $old = perf_before_local_groupimport_find_user_by_identifier($token);
            $new = $bulk[trim($token)] ?? null;
            $checks['paste-' . $setting . '-' . $index] = json_encode($old) === json_encode($new);
        }
        $bulk = perf_after_local_groupimport_find_import_users($tokens);
        foreach ($tokens as $index => $token) {
            $messages = [];
            $old = perf_before_local_groupimport_find_import_user($token, $messages);
            $checks['import-' . $setting . '-' . $index] =
                json_encode(['user' => $old, 'errors' => $messages]) === json_encode($bulk[$token]);
        }
    }
    $CFG->forced_plugin_settings['local_groupimport']['alloweduserfields'] = 'username,email';
    $groupname = $DB->get_field('groups', 'name', ['id' => $manifest['groupIds'][0]], MUST_EXIST);
    $rows = [];
    foreach ($tokens as $token) {
        foreach ([$groupname, strtoupper($groupname), '', 'no-such-group'] as $name) {
            $rows[] = ['identifier' => $token, 'groupname' => $name, 'groupingname' => ''];
        }
    }
    $checks['preview-edge-messages-exact'] = perf_before_local_groupimport_validate_preview_rows($rows, $context) ===
        perf_after_local_groupimport_validate_preview_rows($rows, $context);
    $enrolled = \local_groupimport\local\batch_reader::enrolled($context);
    foreach ($users as $user) {
        $checks['enrolment-' . $user->id] = isset($enrolled[$user->id]) === is_enrolled($context, $user->id);
    }
    // Probe both sides of the 1,000-value boundary without creating more users.
    $tokens = array_map(static fn(int $i): string => 'nonexistent-' . $i, range(0, 1000));
    $tokens[] = $users[2]->username;
    $found = perf_after_local_groupimport_find_users_by_identifiers($tokens);
    $checks['1002-values-chunk-boundary'] = count(array_filter($found)) === 1 &&
        (int)$found[$users[2]->username]->id === (int)$users[2]->id;
    $shortnames = array_map(static fn(int $i): string => 'nonexistent-' . $i, range(0, 999));
    $shortnames[] = $fieldname;
    $matches = \local_groupimport\local\batch_reader::users(['duplicate-profile-value'], 'profile', $shortnames);
    $checks['1001-profile-fields-chunk-boundary'] = count($matches['duplicate-profile-value']) === 2;
} catch (Throwable $exception) {
    $error = get_class($exception) . ': ' . $exception->getMessage();
} finally {
    try {
        $transaction->rollback(new RuntimeException('AP-E5 expected exact temporary edge-fixture rollback'));
    } catch (RuntimeException $exception) {
        if ($exception->getMessage() !== 'AP-E5 expected exact temporary edge-fixture rollback') {
            $error = 'Rollback failed: ' . get_class($exception);
        } else {
            $rolledback = true;
        }
    }
}
$checks['rollback-profile-field-removed'] = !isset($fieldid) || !$DB->record_exists('user_info_field', ['id' => $fieldid]);
$checks['rollback-deleted-flag-restored'] = !isset($users[5]) || !$DB->get_field('user', 'deleted', ['id' => $users[5]->id]);
$checks['rollback-enrolment-restored'] = !isset($users[4]) || is_enrolled($context, $users[4]->id);
$relationships = $DB->get_records_sql(
    'SELECT m.id, m.groupid, m.userid FROM {groups_members} m ' .
    'JOIN {groups} g ON g.id = m.groupid WHERE g.courseid = :courseid ORDER BY m.id',
    ['courseid' => $manifest['courseId']]
);
$checks['rollback-fixture-memberships-restored'] = hash('sha256', json_encode($relationships)) === $relationshash;
$result = ['surface' => 'AP-E5-edges', 'level' => 0, 'passed' => $error === null && !in_array(false, $checks, true),
    'checks' => $checks, 'failure' => $error, 'temporaryMutationsRolledBack' => $rolledback];
easystud_perf_write($options['output'], $result);
echo json_encode(['passed' => $result['passed'], 'checks' => count($checks),
    'failed' => array_keys(array_filter($checks, static fn(bool $value): bool => !$value)), 'error' => $error]) . "\n";
exit($result['passed'] ? 0 : 1);
