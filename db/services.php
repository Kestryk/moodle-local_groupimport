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
 * External functions of Local Group Import.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$functions = [
    'local_groupimport_get_state' => [
        'classname' => 'local_groupimport\external\get_state',
        'description' => 'Compact Student Management state of a course: participants, groups, groupings and roles, each once.',
        'type' => 'read',
        'ajax' => true,
        'loginrequired' => true,
        'capabilities' => 'moodle/course:managegroups',
    ],
    'local_groupimport_get_details' => [
        'classname' => 'local_groupimport\external\get_details',
        'description' => 'Heavy fields of a few participants, groups or groupings, loaded when a modal opens.',
        'type' => 'read',
        'ajax' => true,
        'loginrequired' => true,
        'capabilities' => 'moodle/course:managegroups',
    ],
];
