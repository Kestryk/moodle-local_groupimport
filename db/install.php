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
 * Local Group Import plugin for Moodle.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @author Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Installation hook.
 *
 * K18-08: the plugin no longer installs Moodle user tours; the EasyEdu Guide replaces them.
 *
 * @return void
 */
function xmldb_local_groupimport_install(): void {
    // Fresh installations receive the complete EasyStud experience. Existing
    // installations retain the legacy import-only workflow in upgrade.php.
    set_config('enablesimplifiedview', 1, 'local_groupimport');
}
