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

namespace local_groupimport\privacy;

use context_user;
use core_privacy\local\metadata\collection;
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\writer;
use core_privacy\tests\provider_testcase;
use local_groupimport\local\motion;

/**
 * Privacy provider tests for the animation level preference.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \local_groupimport\privacy\provider
 */
final class provider_test extends provider_testcase {
    /**
     * The provider declares the history tables and user preferences it stores.
     */
    public function test_metadata_declares_history_and_user_preferences(): void {
        $metadata = provider::get_metadata(new collection('local_groupimport'))->get_collection();
        $items = [];
        foreach ($metadata as $item) {
            $items[$item->get_name()] = $item->get_summary();
            if ($item->get_name() === 'local_groupimport_jobs') {
                $fields = $item->get_privacy_fields();
                $this->assertArrayHasKey('nextrow', $fields);
                $this->assertArrayNotHasKey('cursor', $fields);
            }
        }

        $this->assertArrayHasKey('local_groupimport_history', $items);
        $this->assertArrayHasKey('local_groupimport_jobs', $items);
        $this->assertArrayHasKey(motion::PREFERENCE, $items);
        $this->assertArrayHasKey(\local_groupimport\local\guide_welcome::PREFERENCE, $items);
    }

    /**
     * The chosen level is exported with the user's preferences.
     */
    public function test_export_motion_preference(): void {
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        set_user_preference(motion::PREFERENCE, 'reduced', $user);

        provider::export_user_preferences((int)$user->id);
        $preferences = writer::with_context(\context_system::instance())->get_user_preferences('local_groupimport');
        $this->assertSame('reduced', $preferences->{motion::PREFERENCE}->value);
    }

    /**
     * The user context is listed only when a level is chosen, and deleting it removes the choice.
     */
    public function test_delete_motion_preference(): void {
        global $DB;
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $usercontext = context_user::instance($user->id);
        $this->assertNotContains($usercontext->id, array_map(
            'intval',
            provider::get_contexts_for_userid((int)$user->id)->get_contextids()
        ));

        set_user_preference(motion::PREFERENCE, 'minimal', $user);
        set_user_preference(motion::PREFERENCE, 'reduced', $other);
        // Moodle's SQL-backed context list may return numeric strings; context objects use integer ids.
        $this->assertContains($usercontext->id, array_map(
            'intval',
            provider::get_contexts_for_userid((int)$user->id)->get_contextids()
        ));
        $this->assertTrue($DB->record_exists('user_preferences', ['userid' => $user->id, 'name' => motion::PREFERENCE]));

        provider::delete_data_for_user(new approved_contextlist($user, 'local_groupimport', [$usercontext->id]));
        $this->assertFalse($DB->record_exists('user_preferences', ['userid' => $user->id, 'name' => motion::PREFERENCE]));
        // A retained user object still owns its old preference cache; query fresh state by id.
        $this->assertNull(get_user_preferences(motion::PREFERENCE, null, (int)$user->id));
        $this->assertSame('reduced', get_user_preferences(motion::PREFERENCE, null, (int)$other->id));

        provider::delete_data_for_all_users_in_context(context_user::instance($other->id));
        $this->assertFalse($DB->record_exists('user_preferences', ['userid' => $other->id, 'name' => motion::PREFERENCE]));
        $this->assertNull(get_user_preferences(motion::PREFERENCE, null, (int)$other->id));
    }

    /**
     * Generate mixed-user historic data without enrolling or modifying memberships.
     * @return array
     */
    private function history_fixture(): array {
        global $DB;
        $course = $this->getDataGenerator()->create_course();
        $owner = $this->getDataGenerator()->create_user();
        $subject = $this->getDataGenerator()->create_user();
        $peer = $this->getDataGenerator()->create_user();
        $failed = $this->getDataGenerator()->create_user();
        $changes = [
            'desiredstate' => [
                ['userid' => $subject->id, 'identifier' => 'old-subject@example.test', 'groupname' => 'G'],
                ['userid' => $peer->id, 'identifier' => $peer->email, 'groupname' => 'G'],
            ],
            'addedmembers' => [['userid' => $subject->id, 'groupid' => 1], ['userid' => $peer->id, 'groupid' => 1]],
            'removedmembers' => [['userid' => $subject->id, 'groupid' => 2]],
            'reportrows' => [
                ['identifier' => 'old-subject@example.test', 'status' => 'success'],
                ['identifier' => $peer->email, 'status' => 'success'],
                ['identifier' => strtoupper($failed->email), 'status' => 'error'],
            ],
        ];
        $record = (object)[
            'courseid' => $course->id, 'userid' => $owner->id, 'filename' => 'input.csv', 'filehash' => str_repeat('a', 64),
            'rowcount' => 3, 'successcount' => 2, 'errorcount' => 1, 'replacepolicy' => 'keep',
            'changesjson' => json_encode($changes), 'rollbackuserid' => $subject->id,
            'timerolledback' => time(), 'timecreated' => time(),
        ];
        $record->id = $DB->insert_record('local_groupimport_history', $record);
        return [$course, $owner, $subject, $peer, $failed, $record];
    }

    /**
     * Legacy JSON and failed rows participate in both Privacy discovery APIs.
     */
    public function test_history_discovery_and_subject_export(): void {
        $this->resetAfterTest();
        [$course, $owner, $subject, $peer, $failed] = $this->history_fixture();
        $context = \context_course::instance($course->id);
        foreach ([$subject, $peer, $failed] as $user) {
            $this->assertContains($context->id, array_map(
                'intval',
                provider::get_contexts_for_userid((int)$user->id)->get_contextids()
            ));
        }
        $list = new \core_privacy\local\request\userlist($context, 'local_groupimport');
        provider::get_users_in_context($list);
        $this->assertEqualsCanonicalizing([$owner->id, $subject->id, $peer->id, $failed->id], $list->get_userids());
        provider::export_user_data(new approved_contextlist($subject, 'local_groupimport', [$context->id]));
        $data = writer::with_context($context)->get_data([get_string('privacy:historypath', 'local_groupimport')]);
        $json = json_encode($data);
        $this->assertStringContainsString('old-subject@example.test', $json);
        $this->assertStringNotContainsString($peer->email, $json);
        $this->assertStringNotContainsString($failed->email, strtolower($json));
        $this->assertCount(1, $data->imports[0]->changes['desiredstate']);
    }

    /**
     * Single deletion preserves other subjects and course boundaries.
     */
    public function test_history_subject_erasure(): void {
        global $DB;
        $this->resetAfterTest();
        [$course, $owner, $subject, $peer, $failed, $record] = $this->history_fixture();
        $othercourse = $this->getDataGenerator()->create_course();
        $foreign = clone $record;
        unset($foreign->id);
        $foreign->courseid = $othercourse->id;
        $foreignid = $DB->insert_record('local_groupimport_history', $foreign);
        $context = \context_course::instance($course->id);
        provider::delete_data_for_user(new approved_contextlist($subject, 'local_groupimport', [$context->id]));
        $stored = $DB->get_record('local_groupimport_history', ['id' => $record->id], '*', MUST_EXIST);
        $this->assertNull($stored->rollbackuserid);
        $this->assertNull($stored->timerolledback);
        $this->assertStringNotContainsString('old-subject@example.test', $stored->changesjson);
        $this->assertStringContainsString($peer->email, $stored->changesjson);
        $this->assertSame($foreign->changesjson, $DB->get_field('local_groupimport_history', 'changesjson', ['id' => $foreignid]));
        $approved = new \core_privacy\local\request\approved_userlist($context, 'local_groupimport', [$peer->id, $failed->id]);
        provider::delete_data_for_users($approved);
        $changes = json_decode($DB->get_field('local_groupimport_history', 'changesjson', ['id' => $record->id]), true);
        $this->assertEmpty(array_filter($changes));
        $owners = new \core_privacy\local\request\approved_userlist($context, 'local_groupimport', [$owner->id]);
        provider::delete_data_for_users($owners);
        $this->assertFalse($DB->record_exists('local_groupimport_history', ['id' => $record->id]));
        $this->assertTrue($DB->record_exists('local_groupimport_history', ['id' => $foreignid]));
    }

    /**
     * Retention is configurable and affects history only, not course data.
     */
    public function test_history_retention(): void {
        global $DB;
        $this->resetAfterTest();
        [, , , , , $record] = $this->history_fixture();
        $task = new \local_groupimport\task\purge_import_history();
        $this->assertSame(365, $task::retention_days());
        set_config('historyretentiondays', 30, 'local_groupimport');
        $this->assertSame(30, $task::retention_days());
        $expired = clone $record;
        unset($expired->id);
        $expired->timecreated = time() - 31 * DAYSECS;
        $expiredid = $DB->insert_record('local_groupimport_history', $expired);
        $task->execute();
        $this->assertFalse($DB->record_exists('local_groupimport_history', ['id' => $expiredid]));
        $this->assertTrue($DB->record_exists('local_groupimport_history', ['id' => $record->id]));
        foreach ([0, -1, 'invalid', 36501] as $invalid) {
            set_config('historyretentiondays', $invalid, 'local_groupimport');
            $this->assertSame(365, $task::retention_days());
        }
    }
}
