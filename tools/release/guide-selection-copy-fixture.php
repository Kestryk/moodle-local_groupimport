<?php
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
