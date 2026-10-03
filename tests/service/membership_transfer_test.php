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
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <http://www.gnu.org/licenses/>.

namespace local_groupimport\service;

/**
 * Selected-member transfers. Run only against an isolated Moodle PHPUnit DB.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class membership_transfer_test extends \advanced_testcase {

    /**
     * Create a private enrolled fixture; resetAfterTest owns all its data.
     *
     * @return array Course, user, origin, destination and unrelated group.
     */
    private function fixture(): array {
        $this->resetAfterTest();
        $this->setAdminUser();
        $generator = $this->getDataGenerator();
        $course = $generator->create_course();
        $user = $generator->create_user();
        $generator->enrol_user($user->id, $course->id);
        $groups = [];
        for ($index = 0; $index < 3; $index++) {
            $groups[] = $generator->create_group(['courseid' => $course->id]);
        }
        $generator->create_group_member(['groupid' => $groups[0]->id, 'userid' => $user->id]);
        $generator->create_group_member(['groupid' => $groups[2]->id, 'userid' => $user->id]);
        return [$course, $user, $groups[0], $groups[1], $groups[2]];
    }

    /** Transfer affects only explicit origins, despite repeated responsive pairs. */
    public function test_transfer_preserves_unrelated_memberships_and_enrolment(): void {
        [$course, $user, $origin, $destination, $unrelated] = $this->fixture();
        $pair = ['groupid' => $origin->id, 'userid' => $user->id];
        $result = membership_transfer::move_members((int)$course->id, (int)$destination->id, [$pair, $pair]);
        $this->assertSame(['added' => 1, 'removed' => 1, 'unchanged' => 0], $result);
        $this->assertFalse(groups_is_member($origin->id, $user->id));
        $this->assertTrue(groups_is_member($destination->id, $user->id));
        $this->assertTrue(groups_is_member($unrelated->id, $user->id));
        $this->assertTrue(is_enrolled(\context_course::instance($course->id), $user->id));
    }

    /** Existing destination membership and same-group selection are safe. */
    public function test_existing_destination_is_retained_and_same_group_is_unchanged(): void {
        [$course, $user, $origin, $destination] = $this->fixture();
        $this->getDataGenerator()->create_group_member(['groupid' => $destination->id, 'userid' => $user->id]);
        $result = membership_transfer::move_members((int)$course->id, (int)$destination->id, [
            ['groupid' => $destination->id, 'userid' => $user->id],
            ['groupid' => $origin->id, 'userid' => $user->id],
        ]);
        $this->assertSame(['added' => 0, 'removed' => 1, 'unchanged' => 1], $result);
        $this->assertTrue(groups_is_member($destination->id, $user->id));
        $this->assertFalse(groups_is_member($origin->id, $user->id));
    }

    /** One learner may be selected in two origins, without duplicate destination. */
    public function test_two_selected_origins_are_removed_without_duplicate_destination(): void {
        [$course, $user, $origin, $destination, $other] = $this->fixture();
        $result = membership_transfer::move_members((int)$course->id, (int)$destination->id, [
            ['groupid' => $origin->id, 'userid' => $user->id],
            ['groupid' => $other->id, 'userid' => $user->id],
        ]);
        $this->assertSame(['added' => 1, 'removed' => 2, 'unchanged' => 0], $result);
        $this->assertTrue(groups_is_member($destination->id, $user->id));
        $this->assertFalse(groups_is_member($origin->id, $user->id));
        $this->assertFalse(groups_is_member($other->id, $user->id));
    }

    /** Validate every pair before mutating even the first valid membership. */
    public function test_foreign_origin_rejects_the_whole_batch(): void {
        [$course, $user, $origin, $destination] = $this->fixture();
        $foreigncourse = $this->getDataGenerator()->create_course();
        $foreign = $this->getDataGenerator()->create_group(['courseid' => $foreigncourse->id]);
        try {
            membership_transfer::move_members((int)$course->id, (int)$destination->id, [
                ['groupid' => $origin->id, 'userid' => $user->id],
                ['groupid' => $foreign->id, 'userid' => $user->id],
            ]);
            $this->fail('Foreign origin must be rejected.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('invalidgroupid', $exception->errorcode);
        }
        $this->assertTrue(groups_is_member($origin->id, $user->id));
        $this->assertFalse(groups_is_member($destination->id, $user->id));
    }

    /** A missing or stale source membership must not become a course-wide move. */
    public function test_stale_source_is_rejected_without_destination_addition(): void {
        [$course, $user, $origin, $destination] = $this->fixture();
        $unknownuser = $this->getDataGenerator()->create_user();
        try {
            membership_transfer::move_members((int)$course->id, (int)$destination->id, [
                ['groupid' => $origin->id, 'userid' => $unknownuser->id],
            ]);
            $this->fail('A stale source must be rejected.');
        } catch (\moodle_exception $exception) {
            $this->assertSame('invaliddata', $exception->errorcode);
        }
        $this->assertTrue(groups_is_member($origin->id, $user->id));
        $this->assertFalse(groups_is_member($destination->id, $unknownuser->id));
    }

    /** Course management capability is mandatory, not just a valid membership. */
    public function test_unprivileged_member_cannot_transfer_memberships(): void {
        [$course, $user, $origin, $destination] = $this->fixture();
        $this->setUser($user);
        $this->expectException(\required_capability_exception::class);
        membership_transfer::move_members((int)$course->id, (int)$destination->id, [
            ['groupid' => $origin->id, 'userid' => $user->id],
        ]);
    }
}
