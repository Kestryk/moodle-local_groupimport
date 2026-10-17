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
 * Measure unmodified served PHP entry points in separate local processes.
 * Web bootstrap/renderer is used; PHP SAPI remains CLI and is reported as such.
 * Authentication is process-local; no session, rendered HTML or credentials persist.
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
$options = getopt('', ['moodle-root:', 'manifest:', 'output:', 'case:', 'service-root:', 'entry-root:', 'defer-details', 'help']);
if (isset($options['help'])) {
    echo "--moodle-root PATH --manifest EXTERNAL.json --output EXTERNAL.json --case " .
        "manage|course-state|addemails|duplicategroup|deletegroupings|movemembers|import-preview|rollback\n";
    exit;
}
foreach (['moodle-root', 'manifest', 'output', 'case'] as $key) {
    if (empty($options[$key])) {
        fwrite(STDERR, "Required: --moodle-root --manifest --output --case.\n");
        exit(2);
    }
}
$case = $options['case'];
if (
    !in_array($case, ['manage', 'course-state', 'addemails', 'duplicategroup', 'deletegroupings',
        'movemembers', 'import-preview', 'rollback', 'userdetails-checks'], true)
) {
    throw new RuntimeException('Unknown measurement case.');
}
$root = realpath($options['moodle-root']);
if (!$root || !is_file($root . '/config.php')) {
    throw new RuntimeException('Invalid Moodle root.');
}
// Follow actual web output instead of cli_renderer. This script is CLI-only.
define('CLI_SCRIPT', false);
define('NO_MOODLE_COOKIES', true);
$measurementurl = getenv('EASYEDU_MOODLE_URL') ?: 'http://localhost';
$measurementhost = parse_url($measurementurl, PHP_URL_HOST);
if (!in_array($measurementhost, ['localhost', '127.0.0.1', '::1'], true)) {
    throw new RuntimeException('Measurements require an explicit local URL.');
}
$measurementport = parse_url($measurementurl, PHP_URL_PORT) ?: 80;
$_SERVER['HTTP_HOST'] = $measurementhost . ($measurementport === 80 ? '' : ':' . $measurementport);
$_SERVER['SERVER_PORT'] = (string)$measurementport;
$_SERVER['REMOTE_ADDR'] = '127.0.0.1';
$_SERVER['SERVER_PROTOCOL'] = 'HTTP/1.1';
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['SCRIPT_NAME'] = '/local/groupimport/manage.php';
$_SERVER['SCRIPT_FILENAME'] = $root . '/local/groupimport/manage.php';
$_SERVER['REQUEST_URI'] = $_SERVER['SCRIPT_NAME'];
require($root . '/config.php');
require_once(__DIR__ . '/lib.php');
require_once($CFG->dirroot . '/group/lib.php');
$cache = easystud_perf_require_local();
$manifest = easystud_perf_manifest($options['manifest']);
easystud_perf_validate($manifest);
if (!$manifest['complete']) {
    throw new RuntimeException('The fixture is incomplete.');
}
// Load a source candidate into this owned process only. The served files and
// persisted configuration remain untouched; these are native API candidate
// measurements, never claimed as a deployed localhost implementation.
$candidate = null;
$entrycandidate = null;
if (isset($options['entry-root'])) {
    $entrycandidate = realpath($options['entry-root']);
    if (!$entrycandidate || !is_file($entrycandidate . '/ajax.php') || !is_file($entrycandidate . '/index.php')) {
        throw new RuntimeException('Invalid explicit entry-point source.');
    }
    if (is_file($entrycandidate . '/classes/local/batch_reader.php')) {
        require_once($entrycandidate . '/classes/local/batch_reader.php');
    }
    require_once($entrycandidate . '/classes/service/membership_transfer.php');
}
if (isset($options['service-root'])) {
    $candidate = realpath($options['service-root']);
    if (
        !$candidate || !is_file($candidate . '/version.php') ||
            !is_file($candidate . '/classes/service/course_structure.php')
    ) {
        throw new RuntimeException('Invalid source service checkout.');
    }
    require_once($candidate . '/classes/service/course_structure.php');
}
if (isset($options['defer-details'])) {
    if ($candidate === null) {
        throw new RuntimeException('The defer diagnostic requires an explicit source candidate.');
    }
    $CFG->forced_plugin_settings['local_groupimport']['deferparticipantdetails'] = 1;
}
\core\session\manager::set_user(get_admin());
$courseid = (int)$manifest['courseId'];
$course = get_course($courseid);
$context = context_course::instance($courseid);
$PAGE->set_context($context);
$PAGE->set_course($course);
$PAGE->set_url('/local/groupimport/manage.php', ['id' => $courseid]);
require_capability('moodle/course:managegroups', $context);
$_GET = ['id' => $courseid];
$_POST = [];
$cleanup = ['groups' => [], 'groupings' => [], 'history' => [], 'draft' => []];
$samples = array_slice(array_values($manifest['userIds']), 0, 50);
$post = ['courseid' => $courseid, 'sesskey' => sesskey()];
$expected = [];
$entry = 'ajax.php';

if ($case === 'manage' || $case === 'course-state' || $case === 'userdetails-checks') {
    $entry = 'manage.php';
} else if ($case === 'addemails' || $case === 'movemembers') {
    $destination = groups_create_group((object)[
        'courseid' => $courseid, 'name' => $manifest['prefix'] . 'probe-destination',
    ]);
    $cleanup['groups'][] = $destination;
    if ($case === 'addemails') {
        // Moodle IDs remain allowed even when the administrator disables email/username.
        $post += ['action' => 'addemails', 'groupid' => $destination, 'emails' => implode("\n", $samples)];
        $expected = ['added' => 50, 'missing' => 0];
    } else {
        $source = groups_create_group((object)[
            'courseid' => $courseid, 'name' => $manifest['prefix'] . 'probe-source',
        ]);
        $cleanup['groups'][] = $source;
        foreach ($samples as $userid) {
            groups_add_member($source, $userid);
        }
        $post += ['action' => 'movemembers', 'destinationid' => $destination,
            'groupids' => array_fill(0, 50, $source), 'userids' => $samples];
        $expected = ['added' => 50, 'removed' => 50];
    }
} else if ($case === 'duplicategroup') {
    $post += ['action' => 'duplicategroup', 'groupid' => $manifest['groupIds'][0]];
    $expected = ['members' => $DB->count_records('groups_members', ['groupid' => $manifest['groupIds'][0]])];
} else if ($case === 'deletegroupings') {
    for ($i = 0; $i < 10; $i++) {
        $id = groups_create_grouping((object)[
            'courseid' => $courseid, 'name' => $manifest['prefix'] . 'probe-delete-' . $i,
        ]);
        $cleanup['groupings'][] = $id;
        groups_assign_grouping($id, $manifest['groupIds'][$i]);
    }
    $post += ['action' => 'deletegroupings', 'groupingids' => $cleanup['groupings']];
    $expected = ['deleted' => 10];
} else if ($case === 'import-preview') {
    $entry = 'index.php';
    $allowed = get_config('local_groupimport', 'alloweduserfields');
    $fields = $allowed === false || $allowed === '' ? ['username', 'email'] : explode(',', $allowed);
    $field = in_array('username', $fields, true) ? 'username' : (in_array('email', $fields, true) ? 'email' : null);
    if ($field === null) {
        throw new RuntimeException('T052 CSV requires an already-enabled username/email field; no setting was changed.');
    }
    $csv = "student,group,grouping\n";
    for ($i = 0; $i < 2000; $i++) {
        $identifier = $manifest['prefix'] . sprintf('%04d', $i % 800) . ($field === 'email' ? '@example.invalid' : '');
        $csv .= $identifier . ',' . $manifest['prefix'] . 'group-' . sprintf('%03d', $i % 150) . ',' .
            $manifest['prefix'] . 'grouping-' . sprintf('%03d', $i % 40) . "\n";
    }
    $draftid = file_get_unused_draft_itemid();
    $usercontext = context_user::instance($USER->id);
    get_file_storage()->create_file_from_string([
        'contextid' => $usercontext->id, 'component' => 'user', 'filearea' => 'draft',
        'itemid' => $draftid, 'filepath' => '/', 'filename' => 'perffixture-2000.csv',
    ], $csv);
    $cleanup['draft'] = [$usercontext->id, $draftid];
    $post = ['id' => $courseid, 'sesskey' => sesskey(), 'importfile' => $draftid,
        '_qf__local_groupimport_form_import_form' => 1, 'submitbutton' => 'Preview'];
    $expected = ['rows' => 2000];
} else if ($case === 'rollback') {
    $entry = 'index.php';
    $groupname = $manifest['prefix'] . 'probe-restore';
    $group = groups_create_group((object)['courseid' => $courseid, 'name' => $groupname]);
    $cleanup['groups'][] = $group;
    $desired = [];
    foreach ($samples as $userid) {
        $desired[] = ['userid' => $userid, 'identifier' => (string)$userid, 'groupname' => $groupname,
            'groupingname' => ''];
    }
    $historyid = $DB->insert_record('local_groupimport_history', (object)[
        'courseid' => $courseid, 'userid' => $USER->id, 'filename' => 'perffixture-restore.csv',
        'filehash' => hash('sha256', json_encode($desired)), 'rowcount' => 50, 'successcount' => 50,
        'errorcount' => 0, 'replacepolicy' => 'keep', 'changesjson' => json_encode(['desiredstate' => $desired]),
        'timecreated' => time(),
    ]);
    $cleanup['history'][] = $historyid;
    $post = ['id' => $courseid, 'rollbackhistoryid' => $historyid, 'sesskey' => sesskey()];
    $expected = ['restored' => 50];
}

if (!in_array($case, ['manage', 'course-state', 'userdetails-checks'], true)) {
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_POST = $post;
}
$_SERVER['SCRIPT_NAME'] = '/local/groupimport/' . $entry;
$_SERVER['SCRIPT_FILENAME'] = $CFG->dirroot . $_SERVER['SCRIPT_NAME'];
$_SERVER['REQUEST_URI'] = $_SERVER['SCRIPT_NAME'] . '?id=' . $courseid;
$start = microtime(true);
$reads = $DB->perf_get_reads();
$writes = $DB->perf_get_writes();
$querytime = $DB->perf_get_queries_time();
$bufferlevel = ob_get_level();
ob_start();
$outcome = ['passed' => false];
$failure = null;
register_shutdown_function(static function () use (
    &$outcome,
    &$failure,
    $start,
    $reads,
    $writes,
    $querytime,
    $bufferlevel,
    $options,
    $case,
    &$cleanup,
    $manifest,
    $expected,
    $cache,
    $candidate,
    $entrycandidate
): void {
    global $DB;
    $elapsed = (microtime(true) - $start) * 1000;
    $measuredreads = $DB->perf_get_reads() - $reads;
    $measuredwrites = $DB->perf_get_writes() - $writes;
    $measuredquerytime = ($DB->perf_get_queries_time() - $querytime) * 1000;
    $output = '';
    while (ob_get_level() > $bufferlevel) {
        $output = ob_get_clean() . $output;
    }
    $last = error_get_last();
    if ($last && in_array($last['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)) {
        $failure = 'Fatal PHP error; inspect the external process log.';
    }
    if (in_array($case, ['addemails', 'duplicategroup', 'deletegroupings', 'movemembers'], true)) {
        $response = json_decode($output, true);
        $outcome['passed'] = !empty($response['success']);
        if ($case === 'duplicategroup' && !empty($response['group']['id'])) {
            $cleanup['groups'][] = (int)$response['group']['id'];
            $outcome['members'] = count($response['group']['members'] ?? []);
            $generatedid = $response['group']['id'];
            $response['group']['id'] = 'generated-group';
            $response['group']['nativeurl'] = preg_replace(
                '/([?&]id=)' . $generatedid . '(?=&|$)/',
                '$1generated-group',
                $response['group']['nativeurl']
            );
            foreach ($response['group']['members'] as &$member) {
                $member['selectableid'] = 'generated-group:' . $member['userid'];
            }
            unset($member);
        } else if ($case === 'addemails') {
            $outcome['added'] = count($response['users'] ?? []);
            $outcome['missing'] = count($response['missing'] ?? []);
        } else if ($case === 'movemembers') {
            $outcome['added'] = (int)($response['added'] ?? 0);
            $outcome['removed'] = (int)($response['removed'] ?? 0);
        } else if ($case === 'deletegroupings') {
            $outcome['deleted'] = 0;
            foreach ($cleanup['groupings'] as $id) {
                $outcome['deleted'] += !$DB->record_exists('groupings', ['id' => $id]);
            }
        }
    }
    if (in_array($case, ['addemails', 'duplicategroup', 'deletegroupings', 'movemembers'], true)) {
        $outcome['functional'] = ['response' => $response];
        if (in_array($case, ['addemails', 'movemembers', 'duplicategroup'], true) && $outcome['passed']) {
            $destinationid = $case === 'duplicategroup' ? $generatedid : $cleanup['groups'][0];
            $memberids = $DB->get_fieldset_select(
                'groups_members',
                'userid',
                'groupid = :groupid',
                ['groupid' => $destinationid]
            );
            sort($memberids, SORT_NUMERIC);
            $outcome['functional']['destinationMembers'] = array_map('intval', $memberids);
            if ($case === 'movemembers') {
                $memberids = $DB->get_fieldset_select(
                    'groups_members',
                    'userid',
                    'groupid = :groupid',
                    ['groupid' => $cleanup['groups'][1]]
                );
                sort($memberids, SORT_NUMERIC);
                $outcome['functional']['sourceMembers'] = array_map('intval', $memberids);
            }
        }
    }
    foreach ($expected as $key => $value) {
        $outcome['passed'] = $outcome['passed'] && ($outcome[$key] ?? null) === $value;
    }
    try {
        foreach ($cleanup['groups'] as $id) {
            if ($DB->record_exists('groups', ['id' => $id, 'courseid' => $manifest['courseId']])) {
                groups_delete_group($id);
            }
        }
        foreach ($cleanup['groupings'] as $id) {
            if ($DB->record_exists('groupings', ['id' => $id, 'courseid' => $manifest['courseId']])) {
                groups_delete_grouping($id);
            }
        }
        foreach ($cleanup['history'] as $id) {
            $DB->delete_records('local_groupimport_history', ['id' => $id, 'courseid' => $manifest['courseId']]);
        }
        if ($cleanup['draft']) {
            get_file_storage()->delete_area_files($cleanup['draft'][0], 'user', 'draft', $cleanup['draft'][1]);
        }
    } catch (Throwable $exception) {
        $failure = 'Probe cleanup failed: ' . get_class($exception);
    }
    $result = [
        'surface' => $case, 'level' => 0, 'passed' => $outcome['passed'] && $failure === null,
        'environment' => 'CLI process with native web bootstrap; excludes config/fixture preparation/cleanup',
        'generationMs' => round($elapsed, 3), 'sqlReads' => $measuredreads, 'sqlWrites' => $measuredwrites,
        'sqlMs' => round($measuredquerytime, 3), 'htmlBytes' => strlen($output),
        'peakMemoryBytes' => memory_get_peak_usage(true), 'outcome' => $outcome,
        'cacheSettings' => $cache, 'failure' => $failure,
        'sourceCandidate' => $candidate !== null, 'detailsDeferredInProcess' => isset($options['defer-details']),
        'entryCandidate' => $entrycandidate !== null,
    ];
    if ($case === 'manage') {
        require_once(__DIR__ . '/decompose.php');
        $result['decomposition'] = easystud_perf_decompose($output);
    }
    easystud_perf_write($options['output'], $result);
    echo json_encode($result, JSON_THROW_ON_ERROR) . "\n";
});
try {
    if ($case === 'course-state') {
        $state = \local_groupimport\service\course_structure::get_state($course, $context);
        $outcome = ['passed' => count($state['users']) === count($manifest['userIds']), 'users' => count($state['users']),
            'payloadHash' => hash('sha256', json_encode($state))];
        echo json_encode($state, JSON_THROW_ON_ERROR);
    } else if ($case === 'userdetails-checks') {
        if ($candidate === null) {
            throw new RuntimeException('Userdetails checks require the explicit source candidate.');
        }
        $full = \local_groupimport\service\course_structure::get_state($course, $context, true);
        $light = \local_groupimport\service\course_structure::get_state($course, $context, false);
        $checks = ['default-payload-unchanged' =>
            \local_groupimport\service\course_structure::get_state($course, $context) === $full,
            'group-structure-unchanged' => $light['groups'] === $full['groups'] &&
                $light['groupings'] === $full['groupings'] && $light['ungroupedgroupids'] === $full['ungroupedgroupids']];
        $checks['all-light-identities-memberships-roles-preserved'] = true;
        foreach ($full['users'] as $id => $item) {
            $other = $light['users'][$id];
            if ($other['profileimage'] !== '' || $other['description'] !== '' || empty($other['detailsdeferred'])) {
                $checks['all-light-identities-memberships-roles-preserved'] = false;
            }
            unset(
                $item['profileimage'],
                $item['description'],
                $other['profileimage'],
                $other['description'],
                $other['detailsdeferred']
            );
            $checks['all-light-identities-memberships-roles-preserved'] =
                $checks['all-light-identities-memberships-roles-preserved'] && $item === $other;
        }
        $userid = (int)$manifest['userIds'][0];
        $details = \local_groupimport\service\course_structure::get_user_details($course, $context, $userid);
        $checks['one-participant-original-heavy-fields'] = $details['id'] === $userid &&
            $details['profileimage'] === $full['users'][$userid]['profileimage'] &&
            $details['description'] === $full['users'][$userid]['description'] && !$details['detailsdeferred'];
        $source = file_get_contents($candidate . '/ajax.php');
        $start = strpos($source, "\ntry {");
        $end = strpos($source, "\nheader('Content-Type:", $start);
        if ($start === false || $end === false) {
            throw new RuntimeException('AJAX dispatch boundaries changed.');
        }
        $_POST = ['userid' => $userid];
        $action = 'userdetails';
        $response = ['success' => false];
        require(\local_groupimport_fixture_source_file(substr($source, $start, $end - $start)));
        $checks['native-source-dispatch'] = !empty($response['success']) && $response['details'] === $details;
        $checks['existing-sesskey-course-capability-gates-retained'] =
            str_contains(substr($source, 0, $start), 'require_sesskey();') &&
            str_contains(substr($source, 0, $start), "require_capability('moodle/course:managegroups', \$context);");
        try {
            \local_groupimport\service\course_structure::get_user_details($course, $context, 0);
            $checks['invalid-user-rejected'] = false;
        } catch (\moodle_exception $exception) {
            $checks['invalid-user-rejected'] = true;
        }
        $actor = $USER;
        try {
            \core\session\manager::set_user($DB->get_record('user', ['id' => $userid], '*', MUST_EXIST));
            \local_groupimport\service\course_structure::get_user_details($course, $context, $userid);
            $checks['student-without-managegroups-rejected'] = false;
        } catch (\required_capability_exception $exception) {
            $checks['student-without-managegroups-rejected'] = true;
        } finally {
            \core\session\manager::set_user($actor);
        }
        $outcome = ['passed' => !in_array(false, $checks, true), 'checks' => $checks];
        echo json_encode($outcome, JSON_THROW_ON_ERROR);
    } else {
        if ($entrycandidate === null) {
            require($CFG->dirroot . '/local/groupimport/' . $entry);
        } else {
            // Actual candidate entry in an isolated worker; only magic paths
            // point to the already bootstrapped native runtime. No file writes.
            $rewritten = '';
            foreach (token_get_all(file_get_contents($entrycandidate . '/' . $entry)) as $token) {
                if (is_array($token) && $token[0] === T_OPEN_TAG) {
                    continue;
                }
                if (is_array($token) && $token[0] === T_DIR) {
                    $rewritten .= var_export($CFG->dirroot . '/local/groupimport', true);
                } else if (is_array($token) && $token[0] === T_FILE) {
                    $rewritten .= var_export($CFG->dirroot . '/local/groupimport/' . $entry, true);
                } else {
                    $rewritten .= is_array($token) ? $token[1] : $token;
                }
            }
            require(\local_groupimport_fixture_source_file($rewritten));
        }
        if ($case === 'manage') {
            $outcome = ['passed' => true];
        } else if ($case === 'import-preview') {
            $outcome = ['passed' => isset($preview['rows']), 'rows' => count($preview['rows'] ?? []),
                'functional' => ['rows' => $preview['rows'] ?? [], 'messages' => $preview['messages'] ?? [],
                    'errors' => $errors, 'success' => $success]];
        } else if ($case === 'rollback') {
            $outcome = ['passed' => empty($errors), 'restored' => $DB->count_records(
                'groups_members',
                ['groupid' => $cleanup['groups'][0]]
            )];
            $memberids = $DB->get_fieldset_select(
                'groups_members',
                'userid',
                'groupid = :groupid',
                ['groupid' => $cleanup['groups'][0]]
            );
            sort($memberids, SORT_NUMERIC);
            $outcome['functional'] = ['errors' => $errors, 'success' => $success,
                'members' => array_map('intval', $memberids)];
        }
    }
} catch (Throwable $exception) {
    $failure = get_class($exception) . ': ' . $exception->getMessage();
}
