<?php
// Execute only the existing pure quick-create parser functions; no Moodle bootstrap.
$source = file_get_contents(__DIR__ . '/../../ajax.php');
$start = strpos($source, 'function local_groupimport_extract_create_names(');
if ($start === false) {
    throw new RuntimeException('Missing creation parser');
}
eval(substr($source, $start));
$cases = [
    ['Assignment #*4', ['Assignment 1', 'Assignment 2', 'Assignment 3', 'Assignment 4']],
    ['Workshop @*3', ['Workshop A', 'Workshop B', 'Workshop C']],
    ["One, Two; Three\nFour", ['One', 'Two', 'Three', 'Four']],
    ['One,One', ['One']],
    ['Workshop @*27', array_map(static function($index) {
        return 'Workshop ' . local_groupimport_number_to_letters($index);
    }, range(1, 27))],
];
foreach ($cases as [$input, $expected]) {
    if (local_groupimport_extract_create_names($input) !== $expected) {
        throw new RuntimeException('Quick-create example mismatch');
    }
}
echo "PASS five actual pure-parser examples, including separators, deduplication and letter rollover; no course writes.\n";
