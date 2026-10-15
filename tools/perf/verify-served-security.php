<?php
// Integration evidence on a manifested disposable8051 course; never a real enrolment.
define('CLI_SCRIPT', true);
$options = getopt('', ['manifest:']);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Dedicated8051 only');
}
$manifest = $options['manifest'] ?? '';
if (!is_file($manifest) || !str_starts_with(str_replace('\\', '/', realpath($manifest)), 'C:/dev/artifacts/')) {
    throw new RuntimeException('External owned fixture manifest required');
}
$data = json_decode(ltrim(file_get_contents($manifest), "\xEF\xBB\xBF"), true, 512, JSON_THROW_ON_ERROR);
$course = get_course($data['courseId']);
if ($course->id == SITEID || $course->id == 5 || $course->shortname !== $data['shortname'] ||
        !str_starts_with($course->shortname, 'eed-guide-write-') || count($data['userIds']) !== 2) {
    throw new RuntimeException('Disposable course identity mismatch');
}
require_once($CFG->libdir . '/accesslib.php');
$context = context_course::instance($course->id);
[$studentid, $viewerid] = $data['userIds'];
foreach ([$studentid, $viewerid] as $id) {
    $u = $DB->get_record('user', ['id' => $id], '*', MUST_EXIST);
    if ($u->auth !== 'nologin' || !str_starts_with($u->username, 'eed-guide-write-')) {
        throw new RuntimeException('Synthetic user required');
    }
}
$CFG->showuseridentity = 'email,idnumber';
$CFG->hiddenuserfields = 'city,description';
$CFG->forced_plugin_settings['local_groupimport']['alloweduserfields'] = 'username,email,idnumber';
$DB->set_field('user', 'idnumber', 'QA-S3-' . $course->id, ['id' => $studentid]);
$student = $DB->get_record('user', ['id' => $studentid], '*', MUST_EXIST);
$roleid = 0;
$report = ['course' => $course->id, 'checks' => [], 'phpunit' => false];
function security_check($condition, $label) {
    global $report;
    $report['checks'][] = ['label' => $label, 'pass' => (bool)$condition];
    if (!$condition) { throw new RuntimeException($label); }
}
try {
    $roleid = create_role('Disposable EasyStud S3', 'eeds3qa' . $course->id, 'Owned disposable QA');
    set_role_contextlevels($roleid, [CONTEXT_COURSE]);
    assign_capability('moodle/course:managegroups', CAP_ALLOW, $roleid, $context->id, true);
    role_assign($roleid, $viewerid, $context->id);
    foreach ([false, true] as $identity) {
        assign_capability('moodle/site:viewuseridentity', $identity ? CAP_ALLOW : CAP_PROHIBIT, $roleid, $context->id, true);
        $USER = $DB->get_record('user', ['id' => $viewerid], '*', MUST_EXIST);
        reload_all_capabilities();
        security_check(has_capability('moodle/course:managegroups', $context), 'managegroups allowed');
        security_check(has_capability('moodle/site:viewuseridentity', $context) === $identity, 'identity capability ' . (int)$identity);
        $state = \local_groupimport\service\course_state::build($course, $context);
        $item = array_values(array_filter($state['users'], static fn($u) => $u['id'] === (int)$studentid))[0];
        [$details] = \local_groupimport\service\course_state::get_details($course, $context, 'user', [(int)$studentid]);
        if (!$identity) {
            security_check($item['email'] === '' && !isset($item['identifiers']) && $state['meta']['identifierfields'] === [], 'S3 compact identity absent');
            security_check($details['email'] === '' && $details['username'] === '' && $details['idnumber'] === '' && $details['copyfields'] === [], 'S3 details identity absent');
            security_check(!str_contains(json_encode([$state, $details]), $student->email), 'S3 email not serialized');
        } else {
            security_check($item['email'] === $student->email && $item['identifiers'] === ['username' => $student->username, 'email' => $student->email, 'idnumber' => $student->idnumber], 'S3 configured plugin fields restored');
            security_check(array_column($state['meta']['identifierfields'], 'key') === ['username', 'email', 'idnumber'], 'S3 field metadata restored');
        }
    }
    $USER = get_admin(); reload_all_capabilities();
    foreach (['get_state', 'get_details'] as $name) {
        $rejected = false;
        try {
            if ($name === 'get_state') { \local_groupimport\external\get_state::execute(SITEID); }
            else { \local_groupimport\external\get_details::execute(SITEID, 'user', [(int)$studentid]); }
        } catch (moodle_exception $e) { $rejected = $e->errorcode === 'invalidcourseid'; }
        security_check($rejected, $name . ' rejects SITEID');
    }
} finally {
    $USER = get_admin();
    if ($roleid) { delete_role($roleid); }
    $report['roleRemoved'] = !$roleid || !$DB->record_exists('role', ['id' => $roleid]);
    echo json_encode($report, JSON_PRETTY_PRINT) . PHP_EOL;
}
