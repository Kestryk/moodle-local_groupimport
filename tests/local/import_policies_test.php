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
 * Runtime-independent policies under Moodle's own PHPUnit autoloading.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 * @covers \local_groupimport\local\bulk_action
 * @covers \local_groupimport\local\import_reader
 * @covers \local_groupimport\local\report_export
 */
final class import_policies_test extends \basic_testcase {
    /**
     * Test that the bulk cap rejects before any transaction/time-limit calls.
     */
    public function test_bulk_size_policy_without_database(): void {
        foreach ([0, 1, 499, 500] as $count) {
            bulk_action::validate_size($count);
        }
        $this->expectException(\moodle_exception::class);
        bulk_action::validate_size(501);
    }

    /**
     * Preserve identifiers while neutralizing executable spreadsheet prefixes.
     */
    public function test_literal_export_policy(): void {
        foreach (['00123', '12345678901234567890', '2026-10-17', 'Équipe été', "'=1+1", ''] as $safe) {
            $this->assertSame($safe, report_export::text($safe));
        }
        foreach (["=1+1", '+SUM(A1)', '-1+1', '@A1', "\tname", "\rname", "\nname", '  =1', '＝1'] as $unsafe) {
            $this->assertSame("'" . $unsafe, report_export::text($unsafe));
        }
    }

    /**
     * Real CSV parsing keeps quoted multiline values and course byte bounds.
     */
    public function test_bounded_multiline_reader(): void {
        $csv = "identifier;groupname;groupingname\nu@example.test;\"Équipe\nété\";X\n";
        $expected = ['header' => ['identifier', 'groupname', 'groupingname'],
            'rows' => [['u@example.test', "Équipe\nété", 'X']]];
        $this->assertSame($expected, import_reader::csv($csv));
        $this->assertSame($expected, import_reader::csv("\xEF\xBB\xBF" . $csv));
        $this->assertSame(1024, import_reader::max_bytes(1024));
        $this->assertSame(5242880, import_reader::max_bytes(0));
        $this->expectException(\moodle_exception::class);
        import_reader::csv("a;b\n1;\"unclosed\n");
    }
}
