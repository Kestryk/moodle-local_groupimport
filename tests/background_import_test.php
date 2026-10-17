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

use local_groupimport\local\history_privacy;
use local_groupimport\local\import_preview;

/**
 * Session page isolation and pending-row erasure contracts.
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
final class background_import_test extends \advanced_testcase {
    /**
     * Edits survive page changes; fabricated indexes cannot edit another page.
     * @return void
     */
    public function test_preview_page_isolation(): void {
        global $SESSION;
        $this->resetAfterTest();
        $SESSION = new \stdClass();
        $rows = [];
        for ($i = 0; $i < 10001; $i++) {
            $rows[] = ['identifier' => 'user' . $i, 'groupname' => 'G', 'groupingname' => 'A'];
        }
        $token = import_preview::store(5, ['rows' => $rows]);
        $preview = import_preview::save_page(5, $token, json_encode([
            'count' => 10001,
            'edits' => [['index' => 99, 'identifier' => 'user99', 'groupname' => 'Edited', 'groupingname' => 'A']],
            'excluded' => [0],
        ]), [], 1);
        $this->assertEquals(1, $preview['page']);
        $preview = import_preview::save_page(5, $token, json_encode([
            'count' => 10001, 'edits' => [], 'excluded' => [101],
        ]), [], 0);
        $selected = import_preview::selected_rows($preview);
        $this->assertCount(9999, $selected);
        $this->assertEquals('Edited', $selected[98]['groupname']);
        $this->assertEquals('user100', $selected[99]['identifier']);
        $this->assertEquals('user102', $selected[100]['identifier']);
        $this->expectException(\moodle_exception::class);
        import_preview::save_page(5, $token, json_encode([
            'count' => 10001,
            'edits' => [['index' => 100, 'identifier' => 'forged', 'groupname' => 'G', 'groupingname' => 'A']],
            'excluded' => [],
        ]), []);
    }

    /**
     * Erasing a pending subject preserves immutable positions for other subjects.
     * @return void
     */
    public function test_pending_history_subject_erasure(): void {
        $data = ['reportrows' => [
            ['userid' => 10, 'position' => 99, 'identifier' => 'a', 'status' => 'pending'],
            ['userid' => 20, 'position' => 100, 'identifier' => 'b', 'status' => 'pending'],
        ]];
        $filtered = history_privacy::filter($data, 10, ['a'], false);
        $this->assertCount(1, $filtered['reportrows']);
        $this->assertEquals(100, array_values($filtered['reportrows'])[0]['position']);
        $this->assertFalse(history_privacy::contains($filtered, 10, ['a']));
    }
}
