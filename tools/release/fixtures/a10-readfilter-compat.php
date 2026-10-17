<?php
// Native-library interface compatibility only; no Moodle bootstrap or database.
namespace local_groupimport\local;

define('MOODLE_INTERNAL', true);
$native = $argv[1];
require($native . '/Reader/IReadFilter.php');
require($native . '/Cell/Coordinate.php');
require(__DIR__ . '/../../../classes/local/import_preview.php');
require(__DIR__ . '/../../../classes/local/import_reader.php');
$source = file_get_contents($argv[2] ?? (__DIR__ . '/../../../classes/local/import_reader.php'));
$start = strpos($source, '$reader->setReadFilter(') + strlen('$reader->setReadFilter(');
$end = strpos($source, '});', $start);
if (!$start || $end === false) {
    throw new \RuntimeException('Read-filter boundary not found.');
}
$body = substr($source, $start, $end - $start + 1);
$create = static function (&$overflow) use ($body) {
    return eval('namespace local_groupimport\\local; use PhpOffice\\PhpSpreadsheet\\Reader\\IReadFilter; '
        . 'use PhpOffice\\PhpSpreadsheet\\Cell\\Coordinate; return ' . $body . ';');
};
$cases = 0;
foreach ([['A', 1, true], ['BL', import_preview::MAX_ROWS + 1, true], ['BM', 1, false], ['A', import_preview::MAX_ROWS + 2, false], ['A', '1', true]] as $test) {
    $overflow = false;
    $filter = $create($overflow);
    if ($filter->readCell($test[0], $test[1], '') !== $test[2] || $overflow !== !$test[2]) {
        throw new \RuntimeException('Wrong read policy.');
    }
    $cases++;
}
foreach ([[[], 1, ''], ['A', [], ''], ['A', 1, []]] as $args) {
    $overflow = false;
    try {
        $create($overflow)->readCell(...$args);
        throw new \RuntimeException('Expected typed scalar validation.');
    } catch (\TypeError $e) {
        $cases++;
    }
}
echo json_encode(['passed' => true, 'cases' => $cases, 'nativeInterface' => $native, 'runtimeAccess' => false]) . PHP_EOL;
