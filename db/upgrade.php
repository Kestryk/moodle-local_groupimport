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
 * Local Group Import plugin for Moodle
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @author     Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 *
 * This plugin is developed as a personal project and is not private.
 * It is distributed under the terms of the GNU General Public License.
 */

/**
 * Upgrade hook.
 *
 * @param int $oldversion
 * @return bool
 */
function xmldb_local_groupimport_upgrade(int $oldversion): bool {
    global $DB;

    if ($oldversion < 2026010503) {
        if (class_exists('\tool_usertours\manager')) {
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
                if ($DB->record_exists('tool_usertours_tours', ['name' => $tour['name'], 'pathmatch' => $tour['pathmatch']])) {
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

        upgrade_plugin_savepoint(true, 2026010503, 'local', 'groupimport');
    }

    if ($oldversion < 2026061901) {
        $dbman = $DB->get_manager();
        $table = new xmldb_table('local_groupimport_history');

        if (!$dbman->table_exists($table)) {
            $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE);
            $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);
            $table->add_field('userid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);
            $table->add_field('filename', XMLDB_TYPE_CHAR, '255', null, XMLDB_NOTNULL);
            $table->add_field('filehash', XMLDB_TYPE_CHAR, '64', null, XMLDB_NOTNULL);
            $table->add_field('rowcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('successcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('errorcount', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
            $table->add_field('replacepolicy', XMLDB_TYPE_CHAR, '32', null, XMLDB_NOTNULL, null, 'keep');
            $table->add_field('timecreated', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL);

            $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
            $table->add_index('courseid', XMLDB_INDEX_NOTUNIQUE, ['courseid']);
            $table->add_index('userid', XMLDB_INDEX_NOTUNIQUE, ['userid']);
            $table->add_index('filehash', XMLDB_INDEX_NOTUNIQUE, ['filehash']);

            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2026061901, 'local', 'groupimport');
    }

    if ($oldversion < 2026071100) {
        // Do not replace the participant workflow on sites upgrading from the
        // historical import-only plugin until an administrator opts in.
        if (get_config('local_groupimport', 'enablesimplifiedview') === false) {
            set_config('enablesimplifiedview', 0, 'local_groupimport');
        }

        upgrade_plugin_savepoint(true, 2026071100, 'local', 'groupimport');
    }

    if ($oldversion < 2026071101) {
        $dbman = $DB->get_manager();
        $table = new xmldb_table('local_groupimport_history');

        if ($dbman->table_exists($table)) {
            $changesjson = new xmldb_field(
                'changesjson',
                XMLDB_TYPE_TEXT,
                null,
                null,
                null,
                null,
                null,
                'replacepolicy'
            );
            if (!$dbman->field_exists($table, $changesjson)) {
                $dbman->add_field($table, $changesjson);
            }

            $rollbackuserid = new xmldb_field(
                'rollbackuserid',
                XMLDB_TYPE_INTEGER,
                '10',
                null,
                null,
                null,
                null,
                'changesjson'
            );
            if (!$dbman->field_exists($table, $rollbackuserid)) {
                $dbman->add_field($table, $rollbackuserid);
            }

            $timerolledback = new xmldb_field(
                'timerolledback',
                XMLDB_TYPE_INTEGER,
                '10',
                null,
                null,
                null,
                null,
                'rollbackuserid'
            );
            if (!$dbman->field_exists($table, $timerolledback)) {
                $dbman->add_field($table, $timerolledback);
            }
        }

        upgrade_plugin_savepoint(true, 2026071101, 'local', 'groupimport');
    }

    if ($oldversion < 2026071102) {
        // No schema change: the history JSON now carries a reusable desired
        // state and annotated report rows for restoration and export.
        upgrade_plugin_savepoint(true, 2026071102, 'local', 'groupimport');
    }

    if ($oldversion < 2026071300) {
        // Replace only the unchanged legacy Mass Import tour. Administrators
        // who customised its targets keep their local version.
        if (class_exists('\tool_usertours\manager') && class_exists('\tool_usertours\tour')) {
            $dbman = $DB->get_manager();
            $tourtable = new xmldb_table('tool_usertours_tours');
            $steptable = new xmldb_table('tool_usertours_steps');
            if ($dbman->table_exists($tourtable) && $dbman->table_exists($steptable)) {
                $tour = $DB->get_record('tool_usertours_tours', [
                    'name' => 'tour_groupimport_teacher_name,local_groupimport',
                    'pathmatch' => '/local/groupimport/index.php%',
                ]);
                $legacytargets = ['#local_groupimport-page', '#id_userfield', '#id_submitbutton'];
                $steps = $tour ? $DB->get_records('tool_usertours_steps', ['tourid' => $tour->id]) : [];
                $isstale = false;
                foreach ($steps as $step) {
                    if (in_array($step->targetvalue, $legacytargets, true)) {
                        $isstale = true;
                        break;
                    }
                }

                $tourfile = __DIR__ . '/tours/local_groupimport_teacher_guide.json';
                $json = file_exists($tourfile) ? file_get_contents($tourfile) : false;
                if ($tour && $isstale && $json !== false && trim($json) !== '') {
                    \tool_usertours\tour::instance($tour->id)->remove();
                    \tool_usertours\manager::import_tour_from_json($json);
                }
            }
        }

        upgrade_plugin_savepoint(true, 2026071300, 'local', 'groupimport');
    }

    if ($oldversion < 2026101200) {
        // SM-RENDU: per-course version of the Student Management state.
        $dbman = $DB->get_manager();
        $table = new xmldb_table('local_groupimport_statever');
        $table->add_field('id', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, XMLDB_SEQUENCE, null);
        $table->add_field('courseid', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, null);
        $table->add_field('version', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_field('timemodified', XMLDB_TYPE_INTEGER, '10', null, XMLDB_NOTNULL, null, '0');
        $table->add_key('primary', XMLDB_KEY_PRIMARY, ['id']);
        $table->add_key('courseid', XMLDB_KEY_FOREIGN_UNIQUE, ['courseid'], 'course', ['id']);
        if (!$dbman->table_exists($table)) {
            $dbman->create_table($table);
        }

        upgrade_plugin_savepoint(true, 2026101200, 'local', 'groupimport');
    }

    if ($oldversion < 2026101400) {
        // SM-RENDU: On demand rendering is the only Student Management mode; its preview setting goes.
        unset_config('renderingmode', 'local_groupimport');
        upgrade_plugin_savepoint(true, 2026101400, 'local', 'groupimport');
    }

    if ($oldversion < 2026101500) {
        // The course-home invitation belongs to staff, never to students.
        // Update only its role filter: preserve targets, steps, other filters
        // and any local tour text/configuration on existing installations.
        if (class_exists('\\tool_usertours\\tour')) {
            $tours = $DB->get_records('tool_usertours_tours', [
                'name' => 'tour_groupimport_coursehome_name,local_groupimport',
                'pathmatch' => '/course/view.php%',
            ]);
            foreach ($tours as $record) {
                \tool_usertours\tour::instance($record->id)
                    ->set_filter_values('role', ['editingteacher', 'teacher', 'manager', '-1'])
                    ->persist();
            }
        }
        upgrade_plugin_savepoint(true, 2026101500, 'local', 'groupimport');
    }

    if ($oldversion < 2026101501) {
        // EasyEdu animation levels: the on/off enableanimations checkbox becomes the default
        // level (unticked = minimal, otherwise full). Users may then choose their own level.
        $level = get_config('local_groupimport', 'motionlevel');
        if (!in_array($level, ['full', 'reduced', 'minimal'], true)) {
            $legacy = get_config('local_groupimport', 'enableanimations');
            set_config('motionlevel', $legacy !== false && !(bool)$legacy ? 'minimal' : 'full', 'local_groupimport');
        }
        unset_config('enableanimations', 'local_groupimport');
        upgrade_plugin_savepoint(true, 2026101501, 'local', 'groupimport');
    }

    return true;
}
