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
// Reuse the exact-owner setup and cleanup of the existing sorting fixture.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('EASYSTUD_K16_SMALL_FIXTURE', true);
define('EASYSTUD_K16_COPY_GROUP_NAMES', [
    'QA Source Alpha', 'QA Destination Beta', 'QA Activity Gamma', 'QA Unrelated Delta',
]);
require(__DIR__ . '/k16-sort-copy-fixture.php');
