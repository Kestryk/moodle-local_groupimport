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

namespace local_groupimport;

use local_groupimport\local\guide_welcome;
use local_groupimport\local\motion;

/**
 * Uninstallation removes only preferences owned exclusively by this plugin.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers ::xmldb_local_groupimport_uninstall
 */
final class uninstall_test extends \advanced_testcase {
    /**
     * Retain shared Motion choices and unrelated preferences, even after a repeated cleanup.
     */
    public function test_owned_preferences_only(): void {
        global $CFG;
        $this->resetAfterTest();
        require_once($CFG->dirroot . '/local/groupimport/db/uninstall.php');
        $users = [$this->getDataGenerator()->create_user(), $this->getDataGenerator()->create_user()];
        foreach ($users as $user) {
            set_user_preference(guide_welcome::PREFERENCE, 'generation', $user);
            set_user_preference(motion::PREFERENCE, 'reduced', $user);
            set_user_preference('another_component_preference', 'keep', $user);
        }

        $this->assertTrue(xmldb_local_groupimport_uninstall());
        $this->assertTrue(xmldb_local_groupimport_uninstall());
        foreach ($users as $user) {
            $this->assertNull(get_user_preferences(guide_welcome::PREFERENCE, null, $user));
            $this->assertSame('reduced', get_user_preferences(motion::PREFERENCE, null, $user));
            $this->assertSame('keep', get_user_preferences('another_component_preference', null, $user));
        }
    }
}
