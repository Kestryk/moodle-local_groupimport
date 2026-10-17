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

namespace local_groupimport\local;

/**
 * Native SQL integration coverage for the import-only account lookup.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \local_groupimport\local\import_user_lookup
 */
final class import_user_lookup_test extends \advanced_testcase {
    /**
     * Core identifiers and duplicate emails never expose an account outside the course.
     */
    public function test_core_lookup_is_enrolled_and_minimal(): void {
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $othercourse = $this->getDataGenerator()->create_course();
        $known = $this->getDataGenerator()->create_user(['idnumber' => 'S5-known']);
        $outside = $this->getDataGenerator()->create_user(['email' => $known->email, 'idnumber' => 'S5-outside']);
        $this->getDataGenerator()->enrol_user($known->id, $course->id);
        $this->getDataGenerator()->enrol_user($outside->id, $othercourse->id);
        $context = \context_course::instance($course->id);
        foreach (['email', 'username', 'idnumber'] as $field) {
            $found = import_user_lookup::by_field($known->$field, $field, $context);
            $this->assertEquals([$known->id], array_keys($found));
            $this->assertSame(['id'], array_keys((array)reset($found)));
        }
        foreach (['username', 'idnumber'] as $field) {
            $this->assertSame([], import_user_lookup::by_field($outside->$field, $field, $context));
        }
        $this->assertSame([], import_user_lookup::by_field('s5-unknown@example.test', 'email', $context));
        $this->getDataGenerator()->enrol_user($outside->id, $course->id);
        $this->assertCount(2, import_user_lookup::by_field($known->email, 'email', $context));
    }

    /**
     * Custom identifiers use the same enrollment restriction.
     */
    public function test_profile_lookup_is_enrolled(): void {
        global $DB;
        $this->resetAfterTest();
        $course = $this->getDataGenerator()->create_course();
        $known = $this->getDataGenerator()->create_user();
        $outside = $this->getDataGenerator()->create_user();
        $this->getDataGenerator()->enrol_user($known->id, $course->id);
        $categoryid = $DB->insert_record('user_info_category', (object)['name' => 'S5', 'sortorder' => 1]);
        $fieldid = $DB->insert_record('user_info_field', (object)[
            'shortname' => 's5code', 'name' => 'S5 code', 'datatype' => 'text', 'categoryid' => $categoryid,
            'description' => '', 'defaultdata' => '', 'param1' => '30', 'param2' => '2048',
            'param3' => '0', 'param4' => '', 'param5' => '',
        ]);
        foreach ([$known, $outside] as $user) {
            $DB->insert_record('user_info_data', (object)[
                'userid' => $user->id, 'fieldid' => $fieldid, 'data' => 'shared-profile-code',
            ]);
        }
        $context = \context_course::instance($course->id);
        $found = import_user_lookup::by_field('shared-profile-code', 'profile_field_s5code', $context);
        $this->assertEquals([$known->id], array_keys($found));
        $batch = batch_reader::users(['shared-profile-code'], 'profile', ['s5code'], $context);
        $this->assertCount(1, $batch['shared-profile-code']);
        $this->assertEquals($known->id, $batch['shared-profile-code'][0]->id);
    }
}
