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
use core_privacy\local\request\approved_contextlist;
use core_privacy\local\request\writer;
use core_privacy\tests\provider_testcase;
use local_groupimport\local\motion;

defined('MOODLE_INTERNAL') || die();

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
        $this->resetAfterTest();
        $user = $this->getDataGenerator()->create_user();
        $other = $this->getDataGenerator()->create_user();
        $usercontext = context_user::instance($user->id);
        $this->assertNotContains($usercontext->id, provider::get_contexts_for_userid((int)$user->id)->get_contextids());

        set_user_preference(motion::PREFERENCE, 'minimal', $user);
        set_user_preference(motion::PREFERENCE, 'reduced', $other);
        $this->assertContains($usercontext->id, provider::get_contexts_for_userid((int)$user->id)->get_contextids());

        provider::delete_data_for_user(new approved_contextlist($user, 'local_groupimport', [$usercontext->id]));
        $this->assertNull(get_user_preferences(motion::PREFERENCE, null, $user));
        $this->assertSame('reduced', get_user_preferences(motion::PREFERENCE, null, $other));

        provider::delete_data_for_all_users_in_context(context_user::instance($other->id));
        $this->assertNull(get_user_preferences(motion::PREFERENCE, null, $other));
    }
}
