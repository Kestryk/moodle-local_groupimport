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
// Read-only default semantic roles for a browser-local palette specimen.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
require_once($argv[1] . '/local/groupimport/lib.php');
$primary = local_groupimport_colour_for_soft_contrast('#0f6cbf', 0.10);
$accent = local_groupimport_colour_for_soft_contrast('#1b7f5a', 0.09);
echo json_encode([
    '--easyedu-primary-chosen' => '#0f6cbf',
    '--easyedu-primary' => $primary,
    '--easyedu-primary-strong' => 'color-mix(in srgb, ' . $primary . ' 82%, #000 18%)',
    '--easyedu-accent-chosen' => '#1b7f5a',
    '--easyedu-accent' => $accent,
    '--easyedu-success' => $accent,
]);
