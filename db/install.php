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

/**
 * Installation hook for Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Installation hook: import Moodle user tours shipped with the plugin.
 *
 * @return void
 */
function xmldb_local_groupimport_install(): void {
    global $DB;

    // Fresh installations receive the complete EasyStud experience. Existing
    // installations retain the legacy import-only workflow in upgrade.php.
    set_config('enablesimplifiedview', 1, 'local_groupimport');

    if (!class_exists('\tool_usertours\manager')) {
        return;
    }

    $tours = [
        [
            'name' => 'tour_groupimport_teacher_name,local_groupimport',
            'pathmatch' => '/local/groupimport/index.php%',
            'json' => __DIR__ . '/tours/local_groupimport_teacher_guide.json',
        ],
        [
            'name' => 'tour_groupimport_coursehome_name,local_groupimport',
            'pathmatch' => '/course/view.php%',
            'json' => __DIR__ . '/tours/local_groupimport_course_home_hint.json',
        ],
    ];

    foreach ($tours as $tour) {
        if (
            $DB->record_exists('tool_usertours_tours', [
            'name' => $tour['name'],
            'pathmatch' => $tour['pathmatch'],
            ])
        ) {
            continue;
        }

        if (!file_exists($tour['json'])) {
            continue;
        }

        $json = file_get_contents($tour['json']);
        if ($json === false || trim($json) === '') {
            continue;
        }

        \tool_usertours\manager::import_tour_from_json($json);
    }
}
