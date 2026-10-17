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
// Isolated semantic-role audit. Never load Moodle config or touch its database.

define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$roleconfig = [];
/**
 * Perform isolated fixture operation get_config.
 * @param string $component Fixture argument.
 * @param string $key Fixture argument.
 * @return mixed Fixture result.
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
function get_config(string $component, string $key) {
    global $roleconfig;
    if ($component !== 'local_groupimport') {
        throw new RuntimeException('Unexpected configuration component.');
    }
    return $roleconfig[$key] ?? false;
}

require(dirname(__DIR__, 2) . '/lib.php');

$defaults = [
    'primary' => ['themeprimarycolor', '#0f6cbf'],
    'accent' => ['themeaccentcolor', '#1b7f5a'],
    'participant' => ['themeparticipantcolor', '#4873ad'],
    'group' => ['themegroupcolor', '#29724d'],
    'grouping' => ['themegroupingcolor', '#6a7f98'],
];
$distinct = [
    'primary' => '#124567',
    'accent' => '#234578',
    'participant' => '#345689',
    'group' => '#45679a',
    'grouping' => '#5678ab',
];
$cases = 0;
foreach (['absent', 'exact-defaults', 'distinct-custom', 'malformed'] as $mode) {
    $roleconfig = [];
    foreach ($defaults as $role => [$key, $hex]) {
        if ($mode === 'exact-defaults') {
            $roleconfig[$key] = strtoupper($hex);
        } else if ($mode === 'distinct-custom') {
            $roleconfig[$key] = $distinct[$role];
        } else if ($mode === 'malformed') {
            $roleconfig[$key] = 'red;display:none';
        }
    }
    $colours = local_groupimport_get_theme_colours();
    $style = local_groupimport_get_theme_style();
    foreach ($defaults as $role => [$key, $hex]) {
        $expected = $mode === 'distinct-custom' ? $distinct[$role] : $hex;
        if (
            $colours[$role] !== $expected ||
                !str_contains($style, '--easyedu-' . $role . '-chosen: ' . $expected . ';')
        ) {
            throw new RuntimeException('Semantic role changed identity: ' . $mode . '/' . $role);
        }
        $cases++;
    }
    if (str_contains($style, 'display:none')) {
        throw new RuntimeException('Malformed configuration leaked into CSS.');
    }
}
// Independent changed-role probes expose a swap that all-roles-same tests miss.
foreach ($defaults as $changedrole => [$changedkey, $ignored]) {
    $roleconfig = [$changedkey => $distinct[$changedrole]];
    $colours = local_groupimport_get_theme_colours();
    foreach ($defaults as $role => [$key, $hex]) {
        if ($colours[$role] !== ($role === $changedrole ? $distinct[$role] : $hex)) {
            throw new RuntimeException('Independent role leaked into another identity.');
        }
        $cases++;
    }
}
echo 'PASS ' . $cases . " semantic-role identities: defaults, distinct/custom, malformed and independent roles; no DB/Save.\n";
