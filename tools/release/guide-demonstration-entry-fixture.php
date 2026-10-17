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
// Actual consumer presentation fixture; no Moodle session, DB or business action.

ob_start();
require(__DIR__ . '/guide-current-curriculum-fixture.php');
$data = json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
foreach ($data['templateData']['slides'] as $slide) {
    if (
        isset($slide['discoveryscene']) &&
            in_array($slide['discoveryscene']['kind'], ['membership', 'actions', 'inspection'], true)
    ) {
        if (empty($slide['discoveryscene']['manualstart'])) {
            throw new \RuntimeException('Timed consumer scene is missing explicit demonstration entry.');
        }
    }
}
$data['productionPresentationOnly'] = true;
echo json_encode($data, JSON_THROW_ON_ERROR);
