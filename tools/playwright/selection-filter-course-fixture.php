<?php
// The base helper exits after cleanup; restoration must be registered before requiring it.
register_shutdown_function(static function() {
    global $action, $data;
    if (($action ?? '') !== 'cleanup') { return; }
    foreach (($data['qaPaletteBefore'] ?? []) as $key => $value) {
        if (!in_array($key, ['themeprimarycolor', 'themeaccentcolor'], true)) {
            throw new RuntimeException('Unexpected palette setting');
        }
        if ($value === null) { unset_config($key, 'local_groupimport'); }
        else { set_config($key, $value, 'local_groupimport'); }
        $current = get_config('local_groupimport', $key);
        if (($value === null && $current !== false) || ($value !== null && $current !== $value)) {
            throw new RuntimeException('Palette restoration mismatch');
        }
    }
});
require(__DIR__ . '/security-visual-course-fixture.php');
if ($action === 'setup') {
    $teacher = $DB->get_record('role', ['shortname' => 'editingteacher'], '*', MUST_EXIST);
    role_assign($teacher->id, $data['userIds'][3], context_course::instance($course->id)->id);
    $data['qaPaletteBefore'] = [];
    foreach (['themeprimarycolor' => '#0f6cbf', 'themeaccentcolor' => '#1b7f5a'] as $key => $value) {
        $previous = $DB->get_record('config_plugins', ['plugin' => 'local_groupimport', 'name' => $key]);
        $data['qaPaletteBefore'][$key] = $previous ? $previous->value : null;
        guide_fixture_save($file, $data);
        set_config($key, $value, 'local_groupimport');
    }
}
