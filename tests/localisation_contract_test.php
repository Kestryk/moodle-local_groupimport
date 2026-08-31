<?php
// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

/**
 * Static English/French localisation contract for EasyStud.
 *
 * Run from the plugin root with:
 * php tests/localisation_contract_test.php
 *
 * @package    local_groupimport
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

declare(strict_types=1);

define('MOODLE_INTERNAL', true);

/**
 * Load one Moodle language pack in an isolated function scope.
 *
 * @param string $path Language file path.
 * @return array<string, string>
 */
function local_groupimport_test_load_language_pack(string $path): array {
    $string = [];
    require $path;
    return $string;
}

/**
 * Return sorted interpolation placeholders from one language value.
 *
 * @param string $value Language value.
 * @return string[]
 */
function local_groupimport_test_placeholders(string $value): array {
    preg_match_all('/\{\$a(?:->[^}]+)?\}|__[A-Za-z0-9_]+__/', $value, $matches);
    $placeholders = $matches[0];
    sort($placeholders);
    return $placeholders;
}

/**
 * Fail the contract with a readable message.
 *
 * @param string $message Failure message.
 * @return never
 */
function local_groupimport_test_fail(string $message): never {
    fwrite(STDERR, "FAIL: {$message}\n");
    exit(1);
}

$pluginroot = dirname(__DIR__);
$paths = [
    'en' => $pluginroot . '/lang/en/local_groupimport.php',
    'fr' => $pluginroot . '/lang/fr/local_groupimport.php',
];
$contents = [];
$packs = [];

foreach ($paths as $language => $path) {
    $contents[$language] = file_get_contents($path);
    if ($contents[$language] === false) {
        local_groupimport_test_fail("cannot read {$language} language pack");
    }
    if (str_starts_with($contents[$language], "\xEF\xBB\xBF")) {
        local_groupimport_test_fail("{$language} language pack contains a UTF-8 BOM");
    }
    if (preg_match('//u', $contents[$language]) !== 1) {
        local_groupimport_test_fail("{$language} language pack is not valid UTF-8");
    }
    foreach (["\u{FFFD}", 'Ã©', 'Ã¨', 'Ãª', 'â€™', 'ï¿½'] as $marker) {
        if (str_contains($contents[$language], $marker)) {
            local_groupimport_test_fail("{$language} language pack contains mojibake marker {$marker}");
        }
    }
    preg_match_all('/^\$string\[\'([^\']+)\'\]\s*=/m', $contents[$language], $matches);
    if (count($matches[1]) !== count(array_unique($matches[1]))) {
        local_groupimport_test_fail("{$language} language pack contains duplicate keys");
    }
    $packs[$language] = local_groupimport_test_load_language_pack($path);
}

$englishkeys = array_keys($packs['en']);
$frenchkeys = array_keys($packs['fr']);
sort($englishkeys);
sort($frenchkeys);
if ($englishkeys !== $frenchkeys) {
    $missing = array_diff($englishkeys, $frenchkeys);
    $orphaned = array_diff($frenchkeys, $englishkeys);
    local_groupimport_test_fail(
        'language-key parity differs; missing FR: ' . implode(', ', $missing) .
        '; FR-only: ' . implode(', ', $orphaned)
    );
}

foreach ($packs['en'] as $key => $englishvalue) {
    if (local_groupimport_test_placeholders($englishvalue) !==
            local_groupimport_test_placeholders($packs['fr'][$key])) {
        local_groupimport_test_fail("placeholder parity differs for {$key}");
    }
}

if (!str_contains($packs['fr']['advancedsettingsnotset'], 'é') ||
        !str_contains($packs['fr']['moreactions'], '’')) {
    local_groupimport_test_fail('representative French accents or apostrophes are missing');
}

echo 'PASS: strict UTF-8 without BOM or mojibake' . PHP_EOL;
echo 'PASS: ' . count($englishkeys) . ' English/French keys with placeholder parity' . PHP_EOL;
echo 'PASS: representative French accents and apostrophes' . PHP_EOL;
