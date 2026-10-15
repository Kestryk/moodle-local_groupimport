<?php
// Own8051 fixture; enable the requested complete view and restore its exact setting.
register_shutdown_function(static function() {
    global $action, $data;
    if (($action ?? '') !== 'cleanup' || !array_key_exists('qaCompleteViewBefore', $data)) { return; }
    $value = $data['qaCompleteViewBefore'];
    if ($value === null) { unset_config('showcompleteview', 'local_groupimport'); }
    else { set_config('showcompleteview', $value, 'local_groupimport'); }
    $current = get_config('local_groupimport', 'showcompleteview');
    if (($value === null && $current !== false) || ($value !== null && $current !== $value)) {
        throw new RuntimeException('Complete-view restoration mismatch');
    }
});
require(__DIR__ . '/security-visual-course-fixture.php');
if ($action === 'setup') {
    $previous = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => 'showcompleteview']);
    $data['qaCompleteViewBefore'] = $previous ? $previous->value : null;
    guide_fixture_save($file, $data);
    set_config('showcompleteview', '1', 'local_groupimport');
    groups_update_grouping((object)['id' => $data['groupingIds'][0], 'courseid' => $course->id,
        'name' => 'QA Grouping & < > " \'']);
    // Exercise an existing name-bearing hover action, without injecting a tooltip into the DOM.
    user_update_user((object)['id' => $data['userIds'][3], 'firstname' => 'QA & < > " \''], false, false);
}
