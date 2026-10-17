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
 * Standalone CLI test fixture and release validation.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Bounded reversible configuration for the explicitly requested complete-view recipe.

require($argv[1] . '/config.php');
$action = $argv[2] ?? 'read';
if ($action === 'enable') {
    set_config('showcompleteview', '1', 'local_groupimport');
} else if ($action === 'restore') {
    $saved = json_decode($argv[3], true, 8, JSON_THROW_ON_ERROR);
    if ($saved['exists']) {
        set_config('showcompleteview', $saved['value'], 'local_groupimport');
    } else {
        unset_config('showcompleteview', 'local_groupimport');
    }
} else if ($action !== 'read') {
    throw new InvalidArgumentException('Unsupported recipe action');
}
$value = get_config('local_groupimport', 'showcompleteview');
echo json_encode(['exists' => $value !== false, 'value' => $value === false ? null : $value]);
