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

namespace local_groupimport\external;

/**
 * The external functions refuse the front page course (audit F9, lot S3).
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class siteid_refusal_test extends \advanced_testcase {
    /**
     * get_state refuses SITEID, even for an administrator.
     *
     * @return void
     */
    public function test_get_state_refuses_front_page(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('invalidcourseid', 'error'));
        get_state::execute(SITEID);
    }

    /**
     * get_details refuses SITEID, even for an administrator.
     *
     * @return void
     */
    public function test_get_details_refuses_front_page(): void {
        $this->resetAfterTest();
        $this->setAdminUser();

        $this->expectException(\moodle_exception::class);
        $this->expectExceptionMessage(get_string('invalidcourseid', 'error'));
        get_details::execute(SITEID, 'user', [get_admin()->id]);
    }
}
