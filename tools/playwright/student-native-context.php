<?php
// Read-only context for the managed course5 student recipe; no accounts created.
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
$context = context_course::instance(5);
$students = get_enrolled_users($context, '', 0, 'u.id, u.username, u.email', 'u.id');
$student = null;
foreach ($students as $candidate) {
    if (str_ends_with($candidate->email, '@example.com') &&
            !is_siteadmin($candidate->id) &&
            !has_capability('moodle/course:managegroups', $context, $candidate->id)) {
        $roles = get_user_roles($context, $candidate->id);
        foreach ($roles as $role) {
            if ($role->shortname === 'student') {
                $student = ['id' => (int)$candidate->id, 'username' => $candidate->username];
                break 2;
            }
        }
    }
}
$tours = $DB->get_records('tool_usertours_tours', [
    'name' => 'tour_groupimport_coursehome_name,local_groupimport',
    'pathmatch' => '/course/view.php%',
]);
$matches = [];
if ($student) {
    $student['fullname'] = fullname($DB->get_record('user', ['id' => $student['id']], '*', MUST_EXIST));
    $previoususer = $USER;
    foreach (['student' => $student['id'], 'admin' => get_admin()->id] as $kind => $userid) {
        $USER = $DB->get_record('user', ['id' => $userid], '*', MUST_EXIST);
        foreach ($tours as $record) {
            $matches[$kind][] = \tool_usertours\local\filter\role::filter_matches(
                \tool_usertours\tour::instance($record->id), $context);
        }
    }
    $USER = $previoususer;
}
$pending = [];
foreach (core_plugin_manager::instance()->get_plugins() as $plugins) {
    foreach ($plugins as $plugin) {
        if ($plugin->versiondisk !== null && $plugin->versiondb !== null &&
                (float)$plugin->versiondisk > (float)$plugin->versiondb) {
            $pending[] = $plugin->component;
        }
    }
}
echo json_encode([
    'student' => $student,
    'version' => get_config('local_groupimport', 'version'),
    'tours' => array_values($tours),
    'roleMatches' => $matches,
    'pendingUpgrades' => $pending,
], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
