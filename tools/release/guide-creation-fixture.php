<?php
// Isolated presentation data: no Moodle session or database.
define('MOODLE_INTERNAL', true);
require(__DIR__ . '/../../lang/' . (($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en') . '/local_groupimport.php');
function get_string($key, $component) {
    global $string;
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing string: ' . $key);
    }
    return $string[$key];
}
require(__DIR__ . '/../../classes/local/guide_discovery.php');
$manage = file_get_contents(__DIR__ . '/../../manage.php');
$marker = "        } else if (!empty(\$step['visualcreation'])) {";
$start = strpos($manage, $marker);
$end = strpos($manage, '        } else if', $start + strlen($marker));
if ($start === false || $end === false) {
    throw new RuntimeException('Missing creation presentation branch');
}
$slide = ['index' => 0, 'title' => $string['tutorialcreationtitle'],
    'content' => '<p>' . htmlspecialchars($string['tutorialcreationcontent'], ENT_QUOTES, 'UTF-8') . '</p>'];
$templatedata = $string;
eval(substr($manage, $start + strlen($marker), $end - $start - strlen($marker)));
echo json_encode(['actionLessons' => [$slide]], JSON_THROW_ON_ERROR);
