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
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\service;

/**
 * Data minimisation of the Student Management state (audit M1, lot S3).
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class course_state_test extends \advanced_testcase {

    /**
     * Create a course, a student with personal data and a group manager without identity rights.
     *
     * @return array [course, context, student, viewer, role id]
     */
    private function create_course_with_group_manager(): array {
        $this->resetAfterTest();

        set_config('showuseridentity', 'email,idnumber');
        set_config('hiddenuserfields', 'city,description');
        set_config('alloweduserfields', 'username,email,idnumber', 'local_groupimport');

        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $context = \context_course::instance($course->id);
        $student = $generator->create_user([
            'email' => 'student.private@example.com',
            'idnumber' => 'STU-001',
            'city' => 'Paris',
            'description' => '<p>Private biography</p>',
            'descriptionformat' => FORMAT_HTML,
        ]);
        $generator->enrol_user($student->id, $course->id, 'student');

        // A course role that may manage groups, and nothing about user identity.
        $roleid = create_role('Group manager', 'easystudgroupmanager', '');
        set_role_contextlevels($roleid, [CONTEXT_COURSE]);
        assign_capability('moodle/course:managegroups', CAP_ALLOW, $roleid, \context_system::instance()->id, true);
        $viewer = $generator->create_user();
        $generator->enrol_user($viewer->id, $course->id, $roleid);

        return [$course, $context, $student, $viewer, $roleid];
    }

    /**
     * Find one participant in the compact state.
     *
     * @param array $state Result of course_state::build().
     * @param int $userid User id.
     * @return array
     */
    private function find_user(array $state, int $userid): array {
        foreach ($state['users'] as $item) {
            if ($item['id'] === $userid) {
                return $item;
            }
        }
        $this->fail('User ' . $userid . ' missing from the state.');
    }

    /**
     * Managing groups without moodle/site:viewuseridentity sends no e-mail and no identity field.
     *
     * @return void
     */
    public function test_group_manager_without_viewuseridentity_receives_no_email(): void {
        [$course, $context, $student, $viewer] = $this->create_course_with_group_manager();
        $this->setUser($viewer);

        $this->assertTrue(has_capability('moodle/course:managegroups', $context));
        $this->assertFalse(has_capability('moodle/site:viewuseridentity', $context));

        $state = course_state::build($course, $context);
        $item = $this->find_user($state, (int)$student->id);
        $this->assertSame('', $item['email']);
        $this->assertArrayNotHasKey('identifiers', $item);
        $this->assertSame([], $state['meta']['identifierfields']);
        $this->assertStringNotContainsString('student.private@example.com', json_encode($state));

        [$details] = course_state::get_details($course, $context, 'user', [(int)$student->id]);
        $this->assertSame('', $details['email']);
        $this->assertSame('', $details['username']);
        $this->assertSame('', $details['idnumber']);
        $this->assertSame('', $details['city']);
        $this->assertSame('', $details['lang']);
        $this->assertSame('', $details['description']);
        $this->assertSame([], $details['copyfields']);
        $this->assertStringNotContainsString('student.private@example.com', json_encode($details));
        $this->assertStringNotContainsString('Private biography', json_encode($details));
    }

    /**
     * With moodle/site:viewuseridentity, only the fields listed in showuseridentity come back.
     *
     * @return void
     */
    public function test_group_manager_with_viewuseridentity_receives_showuseridentity_fields(): void {
        [$course, $context, $student, $viewer, $roleid] = $this->create_course_with_group_manager();
        assign_capability('moodle/site:viewuseridentity', CAP_ALLOW, $roleid, \context_system::instance()->id, true);
        accesslib_clear_all_caches_for_unit_testing();
        $this->setUser($viewer);

        $state = course_state::build($course, $context);
        $item = $this->find_user($state, (int)$student->id);
        $this->assertSame('student.private@example.com', $item['email']);
        $this->assertSame(['email' => 'student.private@example.com', 'idnumber' => 'STU-001'], $item['identifiers']);
        // Username is a plugin identification field, but not in showuseridentity.
        $this->assertSame(['email', 'idnumber'], array_column($state['meta']['identifierfields'], 'key'));

        [$details] = course_state::get_details($course, $context, 'user', [(int)$student->id]);
        $this->assertSame('student.private@example.com', $details['email']);
        $this->assertSame('STU-001', $details['idnumber']);
        $this->assertSame('', $details['username']);
        // Still hidden by hiddenuserfields: the role lacks moodle/course:viewhiddenuserfields.
        $this->assertSame('', $details['city']);
        $this->assertSame('', $details['description']);
    }

    /**
     * moodle/course:viewhiddenuserfields reveals the hidden profile fields, with a formatted description.
     *
     * @return void
     */
    public function test_viewhiddenuserfields_reveals_hidden_profile_fields(): void {
        [$course, $context, $student, $viewer, $roleid] = $this->create_course_with_group_manager();
        assign_capability('moodle/course:viewhiddenuserfields', CAP_ALLOW, $roleid, \context_system::instance()->id, true);
        accesslib_clear_all_caches_for_unit_testing();
        $this->setUser($viewer);

        [$details] = course_state::get_details($course, $context, 'user', [(int)$student->id]);
        $this->assertSame('Paris', $details['city']);
        $this->assertStringContainsString('Private biography', $details['description']);
        $this->assertSame('', $details['email']);
    }
}
