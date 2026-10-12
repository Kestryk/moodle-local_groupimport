<?php
// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.

/**
 * Measure unmodified served PHP entry points in separate local processes.
 * Web bootstrap/renderer is used; PHP SAPI remains CLI and is reported as such.
 * Authentication is process-local; no session, rendered HTML or credentials persist.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}
$options = getopt('', ['moodle-root:', 'manifest:', 'output:', 'case:', 'help']);
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
if (!in_array($case, ['manage', 'course-state', 'addemails', 'duplicategroup', 'deletegroupings',
        'movemembers', 'import-preview', 'rollback'], true)) {
    throw new RuntimeException('Unknown measurement case.');
}
$root = realpath($options['moodle-root']);
if (!$root || !is_file($root . '/config.php')) {
    throw new RuntimeException('Invalid Moodle root.');
}
// Follow actual web output instead of cli_renderer. This script is CLI-only.
define('CLI_SCRIPT', false);
define('NO_MOODLE_COOKIES', true);
$_SERVER['HTTP_HOST'] = 'localhost';
$_SERVER['SERVER_PORT'] = '80';
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

if ($case === 'manage' || $case === 'course-state') {
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

if ($case !== 'manage' && $case !== 'course-state') {
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
register_shutdown_function(static function() use (&$outcome, &$failure, $start, $reads, $writes, $querytime,
        $bufferlevel, $options, $case, &$cleanup, $manifest, $expected, $cache): void {
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
        $outcome = ['passed' => count($state['users']) === count($manifest['userIds']), 'users' => count($state['users'])];
        echo json_encode($state, JSON_THROW_ON_ERROR);
    } else {
        require($CFG->dirroot . '/local/groupimport/' . $entry);
        if ($case === 'manage') {
            $outcome = ['passed' => true];
        } else if ($case === 'import-preview') {
            $outcome = ['passed' => isset($preview['rows']), 'rows' => count($preview['rows'] ?? [])];
        } else if ($case === 'rollback') {
            $outcome = ['passed' => empty($errors), 'restored' => $DB->count_records('groups_members',
                ['groupid' => $cleanup['groups'][0]])];
        }
    }
} catch (Throwable $exception) {
    $failure = get_class($exception) . ': ' . $exception->getMessage();
}
