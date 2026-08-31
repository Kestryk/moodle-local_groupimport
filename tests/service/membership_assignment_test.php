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
 * Tests for additive EasyStud copy and paste membership mutations.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_assignment_test extends \advanced_testcase {

    /**
     * Copying a participant adds the destination group and preserves the origin.
     *
     * @return void
     */
    public function test_add_user_to_group_preserves_existing_memberships(): void {
        $this->resetAfterTest();

        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $user = $generator->create_user();
        $generator->enrol_user($user->id, $course->id);
        $origin = $generator->create_group(['courseid' => $course->id]);
        $destination = $generator->create_group(['courseid' => $course->id]);
        $generator->create_group_member(['groupid' => $origin->id, 'userid' => $user->id]);

        $this->assertTrue(membership_assignment::add_user_to_group(
            (int)$course->id,
            (int)$destination->id,
            (int)$user->id
        ));
        $this->assertTrue(groups_is_member($origin->id, $user->id));
        $this->assertTrue(groups_is_member($destination->id, $user->id));

        $this->assertFalse(membership_assignment::add_user_to_group(
            (int)$course->id,
            (int)$destination->id,
            (int)$user->id
        ));
    }

    /**
     * Copying a group adds the destination grouping and preserves the origin.
     *
     * @return void
     */
    public function test_add_group_to_grouping_preserves_existing_assignments(): void {
        global $DB;

        $this->resetAfterTest();

        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $group = $generator->create_group(['courseid' => $course->id]);
        $origin = $generator->create_grouping(['courseid' => $course->id]);
        $destination = $generator->create_grouping(['courseid' => $course->id]);
        $generator->create_grouping_group(['groupingid' => $origin->id, 'groupid' => $group->id]);

        $this->assertTrue(membership_assignment::add_group_to_grouping(
            (int)$course->id,
            (int)$group->id,
            (int)$destination->id
        ));
        $this->assertTrue($DB->record_exists('groupings_groups', [
            'groupingid' => $origin->id,
            'groupid' => $group->id,
        ]));
        $this->assertTrue($DB->record_exists('groupings_groups', [
            'groupingid' => $destination->id,
            'groupid' => $group->id,
        ]));

        $this->assertFalse(membership_assignment::add_group_to_grouping(
            (int)$course->id,
            (int)$group->id,
            (int)$destination->id
        ));
    }
}
