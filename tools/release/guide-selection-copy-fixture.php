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
// Isolated production presentation adapter; no Moodle bootstrap or database.

define('MOODLE_INTERNAL', true);
require(__DIR__ . '/../../lang/' . (($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en') . '/local_groupimport.php');
function get_string($key, $component) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing string: ' . $key);
    }
    return $string[$key];
}
$manage = file_get_contents(__DIR__ . '/../../manage.php');
$start = strpos($manage, "            \$slide['visualkeys'] = [");
$end = strpos($manage, '        } else if', $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing keyboard presentation branch');
}
$slide = ['index' => 0, 'title' => $string['tutorialkeyboardtitle'],
    'description' => $string['tutorialkeyboardcontent']];
$templatedata = $string;
eval(substr($manage, $start, $end - $start));
echo json_encode(['slides' => [$slide], 'slidecount' => 1,
    'discoverypresentation' => true,
    'rootclass' => 'local-groupimport-easystud-easyedu-guide easyedu-guide--discovery',
    'guideopenlabel' => 'Open', 'guidecloselabel' => 'Close', 'guidetitle' => 'EasyStud guide',
    'guidesubtitle' => 'Student Management', 'guidepreviouslabel' => 'Previous',
    'guidenextlabel' => 'Next'], JSON_THROW_ON_ERROR);
