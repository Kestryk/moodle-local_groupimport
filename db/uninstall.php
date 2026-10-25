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

/**
 * Remove preferences owned exclusively by this plugin during uninstallation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Clean up plugin-owned preferences without changing shared EasyEdu settings or tours.
 *
 * @return bool
 */
function xmldb_local_groupimport_uninstall(): bool {
    global $DB;

    // Moodle removes plugin tables, configuration, files and tasks in its uninstall pipeline.
    // User tours belong to core: do not delete a site's edited or independently created tour.
    // easyedu_motion_level is explicitly shared by the EasyEdu family, so retain it.
    $preference = \local_groupimport\local\guide_welcome::PREFERENCE;
    $records = $DB->get_recordset('user_preferences', ['name' => $preference], '', 'id, userid');
    try {
        foreach ($records as $record) {
            unset_user_preference($preference, (int)$record->userid);
        }
    } finally {
        $records->close();
    }

    return true;
}
