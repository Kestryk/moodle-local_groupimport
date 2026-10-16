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
 * Event observers for Local Group Import.
 *
 * Every change that alters what Student Management shows bumps the course state version
 * (SM-RENDU). Observers run after the transaction commits, so a rolled back change
 * does not bump it.
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

defined('MOODLE_INTERNAL') || die();

$observers = [];
foreach (
    [
    '\core\event\group_created',
    '\core\event\group_updated',
    '\core\event\group_deleted',
    '\core\event\group_member_added',
    '\core\event\group_member_removed',
    '\core\event\grouping_created',
    '\core\event\grouping_updated',
    '\core\event\grouping_deleted',
    '\core\event\grouping_group_assigned',
    '\core\event\grouping_group_unassigned',
    '\core\event\user_enrolment_created',
    '\core\event\user_enrolment_updated',
    '\core\event\user_enrolment_deleted',
    '\core\event\role_assigned',
    '\core\event\role_unassigned',
    ] as $eventname
) {
    $observers[] = [
        'eventname' => $eventname,
        'callback' => '\local_groupimport\local\state_version::observe',
        'internal' => false,
    ];
}
