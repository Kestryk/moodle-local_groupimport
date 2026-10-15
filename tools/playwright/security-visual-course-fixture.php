<?php
// Same owned fixture lifecycle, with hostile-looking labels for native export/render proof.
require(__DIR__ . '/guide-writing-course-fixture.php');
if ($action === 'setup') {
    foreach (['Three', 'Four'] as $name) {
        $id = user_create_user((object)['username' => $data['shortname'] . '-' . strtolower($name),
            'firstname' => 'QA Guided', 'lastname' => $name, 'email' => $data['shortname'] . '-' . strtolower($name) . '@example.invalid',
            'auth' => 'nologin', 'confirmed' => 1, 'mnethostid' => $CFG->mnet_localhost_id], false, false);
        $data['userIds'][] = (int)$id;
        guide_fixture_save($file, $data);
        enrol_get_plugin('manual')->enrol_user($manual, $id, $role->id);
        groups_add_member($data['groupIds'][0], $id);
    }
    groups_add_member($data['groupIds'][0], $data['userIds'][1]);
    groups_update_group((object)['id' => $data['groupIds'][1], 'courseid' => $course->id, 'name' => '=1+1']);
    groups_update_group((object)['id' => $data['groupIds'][2], 'courseid' => $course->id, 'name' => 'QA & < > " \'']);
}
