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
// Isolated colour-settings contract: no Moodle database, settings write or cache.

/**
 * Standalone local_groupimport test fixture or release helper.
 *
 * @package local_groupimport
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define('CLI_SCRIPT', true);
require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

require_once(__DIR__ . '/../../tools/release/fixtures/standalone/config.php');
if (!MOODLE_INTERNAL) {
    die('CLI fixtures only.');
}

$hassiteconfig = false;
$testconfig = [];
require_once(__DIR__ . '/doubles/test_theme_palette_standalone/global/fixture_test_theme_palette_standalone_admin_setting_configtext.php');
class_alias('fixture_test_theme_palette_standalone_admin_setting_configtext', 'admin_setting_configtext');
/**
 * Perform isolated fixture operation get_string.
 * @param string $key Fixture argument.
 * @param string $component Fixture argument.
 * @return string Fixture result.
 */
function get_string(string $key, string $component = ''): string {
    return $key;
}
/**
 * Perform isolated fixture operation get_config.
 * @param string $component Fixture argument.
 * @param string $key Fixture argument.
 * @return string Fixture result.
 */
function get_config(string $component, string $key): string {
    global $testconfig;
    return $testconfig[$key] ?? '';
}

require(dirname(__DIR__, 2) . '/lib.php');
require(dirname(__DIR__, 2) . '/settings.php');

$setting = new local_groupimport_admin_setting_configcolor(
    'local_groupimport/themeprimarycolor',
    'Primary',
    '',
    '#0f6cbf',
    0,
    null,
    4.5
);
foreach (['#ffffff', '#fff3a5', '#b9ebd0', '#0f6cbf'] as $value) {
    if ($setting->validate($value) !== true) {
        throw new RuntimeException("Valid palette was rejected: $value");
    }
    $adapted = local_groupimport_colour_for_white_contrast($value);
    if (local_groupimport_colour_contrast_against_white($adapted) < 4.5) {
        throw new RuntimeException("Unreadable derived shade: $adapted");
    }
}
if ($setting->validate('red; display:none') === true) {
    throw new RuntimeException('Malformed Hex was accepted.');
}

// Regression: #ff0000 adapted for white still fails on #ffe2e2, its
// conservative 11%-red surface. Check the independent fixed background.
$adapted = local_groupimport_colour_for_soft_contrast('#ff0000', 0.11);
if (
    local_groupimport_colour_contrast_against_white($adapted) /
        local_groupimport_colour_contrast_against_white('#ffe2e2') < 4.5
) {
    throw new RuntimeException('Semantic text is unreadable on the chosen soft surface.');
}
if (local_groupimport_colour_for_soft_contrast('#0f6cbf', 0.10) !== '#0f6cbf') {
    throw new RuntimeException('Already readable primary default was needlessly changed.');
}

$testconfig = [
    'themeprimarycolor' => '#ffffff',
    'themeaccentcolor' => 'red; display:none',
];
$colours = local_groupimport_get_theme_colours();
if ($colours['primary'] !== '#ffffff' || $colours['accent'] !== '#1b7f5a') {
    throw new RuntimeException('Configuration fallback or valid light colour failed.');
}
$style = local_groupimport_get_theme_style();
if (
    !str_contains($style, '--easyedu-primary-chosen: #ffffff;') ||
        !str_contains($style, '--easyedu-primary: #767676;') ||
        str_contains($style, 'display:none')
) {
    throw new RuntimeException('Unsafe or incorrect semantic style output.');
}
if (local_groupimport_get_theme_rail_roles() !== 'primary') {
    throw new RuntimeException('Malformed accent must not opt into custom rails.');
}
foreach (
    [
    [[], ''],
    [['themeprimarycolor' => '#0F6CBF', 'themeaccentcolor' => '#1B7F5A'], ''],
    [['themeprimarycolor' => 'bad', 'themeaccentcolor' => 'bad'], ''],
    [['themeaccentcolor' => '#ccddea'], 'success'],
    [['themeprimarycolor' => '#000000', 'themeaccentcolor' => '#ffffff'], 'primary success'],
    ] as [$config, $expected]
) {
    $testconfig = $config;
    if (local_groupimport_get_theme_rail_roles() !== $expected) {
        throw new RuntimeException('Incorrect custom rail role selection.');
    }
}

// Export the real server adapter for browser/CSS contrast checks. These are
// process-local get_config stubs, not a persisted Moodle configuration fixture.
$palettes = [];
foreach (['#ffffff', '#fff3a5', '#b9ebd0', '#ccddea', '#ff0000', '#00ff00', '#0000ff', '#000000'] as $hex) {
    $testconfig = array_fill_keys([
        'themeprimarycolor', 'themeaccentcolor', 'themeparticipantcolor', 'themegroupcolor', 'themegroupingcolor',
    ], $hex);
    $palettes[] = ['name' => $hex, 'style' => local_groupimport_get_theme_style(),
        'railRoles' => local_groupimport_get_theme_rail_roles()];
}
$testconfig = [];
$palettes[] = ['name' => 'defaults', 'style' => local_groupimport_get_theme_style(),
    'railRoles' => local_groupimport_get_theme_rail_roles()];
$testconfig = ['themeprimarycolor' => '#ff0000', 'themeaccentcolor' => '#b9ebd0', 'themegroupcolor' => '#0000ff'];
$palettes[] = ['name' => 'mixed', 'style' => local_groupimport_get_theme_style(),
    'railRoles' => local_groupimport_get_theme_rail_roles()];

if (in_array('--json', $argv, true)) {
    echo json_encode($palettes, JSON_THROW_ON_ERROR) . "\n";
} else {
    echo "PASS: valid light Hex accepted, malformed input rejected, saved shade preserved, readable role derived.\n";
}
