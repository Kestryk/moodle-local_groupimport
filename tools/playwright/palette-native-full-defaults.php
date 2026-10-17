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
// Full default palette projection; compute only, never change plugin settings.

define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
require_once($argv[1] . '/local/groupimport/lib.php');
$chosen = ['primary' => '#0f6cbf', 'accent' => '#1b7f5a', 'participant' => '#4873ad',
    'group' => '#29724d', 'grouping' => '#6a7f98'];
$shares = ['primary' => 0.10, 'accent' => 0.09, 'participant' => 0.11, 'group' => 0.11, 'grouping' => 0.11];
$properties = [];
foreach ($chosen as $role => $hex) {
    $readable = local_groupimport_colour_for_soft_contrast($hex, $shares[$role]);
    $properties['--easyedu-' . $role . '-chosen'] = $hex;
    $properties['--easyedu-' . $role] = $readable;
    $share = (int)round($shares[$role] * 100);
    $properties['--easyedu-' . $role . '-soft'] =
        'color-mix(in srgb, ' . $hex . ' ' . $share . '%, #fff ' . (100 - $share) . '%)';
    if (in_array($role, ['participant', 'group', 'grouping'], true)) {
        $properties['--easyedu-' . $role . '-rail'] = 'color-mix(in srgb, ' . $readable . ' 68%, #fff 32%)';
    }
}
$properties['--easyedu-primary-strong'] =
    'color-mix(in srgb, ' . $properties['--easyedu-primary'] . ' 82%, #000 18%)';
$properties['--easyedu-info'] = $properties['--easyedu-primary'];
$properties['--easyedu-info-soft'] = $properties['--easyedu-primary-soft'];
$properties['--easyedu-success'] = $properties['--easyedu-accent'];
$properties['--easyedu-success-soft'] = $properties['--easyedu-accent-soft'];
echo json_encode($properties);
