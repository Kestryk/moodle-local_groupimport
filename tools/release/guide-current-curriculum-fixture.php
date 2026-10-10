<?php
// Complete production Guide presentation, without Moodle bootstrap, session or database.
define('MOODLE_INTERNAL', true);
$language = ($argv[1] ?? 'en') === 'fr' ? 'fr' : 'en';
require(__DIR__ . '/../../lang/' . $language . '/local_groupimport.php');
function get_string($key, $component, $a = null) {
    global $string, $language;
    if ($component === 'core' && $key === 'closebuttontitle') {
        return $language === 'fr' ? 'Fermer' : 'Close';
    }
    if (!isset($string[$key])) {
        throw new RuntimeException('Missing public Guide string: ' . $key);
    }
    return $string[$key];
}
function s($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}
class html_writer {
    public static function tag($name, $value) {
        return '<' . $name . '>' . $value . '</' . $name . '>';
    }
}
require(__DIR__ . '/../../classes/local/guide_discovery.php');
$source = file_get_contents(__DIR__ . '/../../manage.php');
$templatedata = $string;
preg_match_all("/^\s+'(tutorial[^']+)' => get_string\('([^']+)', 'local_groupimport'\),?$/m",
    $source, $aliases, PREG_SET_ORDER);
foreach ($aliases as $alias) {
    $templatedata[$alias[1]] = get_string($alias[2], 'local_groupimport');
}
$start = strpos($source, "        'tutorialsteps' => [");
$end = strpos($source, "        'selectionmodelabel' =>", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing actual tutorial definition boundary');
}
$array = substr($source, $start + strlen("        'tutorialsteps' => "),
    $end - $start - strlen("        'tutorialsteps' => "));
// Only the existing literal steps array is evaluated; never bootstrap manage.php.
$templatedata['tutorialsteps'] = eval('return ' . rtrim($array, ", \r\n\t") . ';');
foreach (['local_groupimport_build_easyedu_guide_template_data'] as $name) {
    $start = strpos($source, 'function ' . $name . '(');
    if ($start === false) {
        throw new RuntimeException('Missing actual Guide adapter: ' . $name);
    }
    $tokens = token_get_all('<?php ' . substr($source, $start));
    $body = '';
    $depth = 0;
    $opened = false;
    foreach ($tokens as $token) {
        if (is_array($token) && $token[0] === T_OPEN_TAG) {
            continue;
        }
        $text = is_array($token) ? $token[1] : $token;
        $body .= $text;
        if ($text === '{' || (is_array($token) && in_array($token[0],
                [T_CURLY_OPEN, T_DOLLAR_OPEN_CURLY_BRACES], true))) {
            $depth++;
            $opened = true;
        } else if ($text === '}') {
            $depth--;
            if ($opened && $depth === 0) {
                break;
            }
        }
    }
    if (!$opened || $depth !== 0) {
        throw new RuntimeException('Unbounded Guide function extraction');
    }
    eval($body);
}
$start = strpos($source, "        'paths' => [");
$end = strpos($source, "        'labels' => [", $start);
if ($start === false || $end === false) {
    throw new RuntimeException('Missing actual Guide path definition boundary');
}
$array = substr($source, $start + strlen("        'paths' => "),
    $end - $start - strlen("        'paths' => "));
$paths = eval('return ' . rtrim($array, ", \r\n\t") . ';');
$data = local_groupimport_build_easyedu_guide_template_data($templatedata);
$moderncontract = \local_groupimport\local\guide_discovery::modern_reading_contract();
$active = array_column($data['slides'], 'id') === $moderncontract['slideIds'];
echo json_encode(['language' => $language,
    'templateData' => $data,
    'readingContract' => $active ? $moderncontract : \local_groupimport\local\guide_discovery::reading_contract(),
    'paths' => $paths,
    'modernCandidate' => [
        'slides' => $active ? $data['slides'] : \local_groupimport\local\guide_discovery::modern_curriculum($data['slides']),
        'readingContract' => $moderncontract,
        'nativeActivated' => $active,
    ],
    'scope' => 'Pure presentation and path definitions; native welcome/configuration availability not evaluated'],
    JSON_THROW_ON_ERROR);
