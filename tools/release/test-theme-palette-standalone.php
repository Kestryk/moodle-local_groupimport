<?php
// Isolated colour-settings contract: no Moodle database, settings write or cache.

define('MOODLE_INTERNAL', true);
$hassiteconfig = false;
$testconfig = [];

class admin_setting_configtext {
    public function __construct(...$arguments) {
    }
}

function get_string(string $key, string $component = ''): string {
    return $key;
}

function get_config(string $component, string $key): string {
    global $testconfig;
    return $testconfig[$key] ?? '';
}

require dirname(__DIR__, 2) . '/lib.php';
require dirname(__DIR__, 2) . '/settings.php';

$setting = new local_groupimport_admin_setting_configcolor(
    'local_groupimport/themeprimarycolor', 'Primary', '', '#0f6cbf', 0, null, 4.5
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
if (local_groupimport_colour_contrast_against_white($adapted) /
        local_groupimport_colour_contrast_against_white('#ffe2e2') < 4.5) {
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
if (!str_contains($style, '--easyedu-primary-chosen: #ffffff;') ||
        !str_contains($style, '--easyedu-primary: #767676;') ||
        str_contains($style, 'display:none')) {
    throw new RuntimeException('Unsafe or incorrect semantic style output.');
}

// Export the real server adapter for browser/CSS contrast checks. These are
// process-local get_config stubs, not a persisted Moodle configuration fixture.
$palettes = [];
foreach (['#ffffff', '#fff3a5', '#b9ebd0', '#ccddea', '#ff0000', '#00ff00', '#0000ff', '#000000'] as $hex) {
    $testconfig = array_fill_keys([
        'themeprimarycolor', 'themeaccentcolor', 'themeparticipantcolor', 'themegroupcolor', 'themegroupingcolor',
    ], $hex);
    $palettes[] = ['name' => $hex, 'style' => local_groupimport_get_theme_style()];
}
$testconfig = [];
$palettes[] = ['name' => 'defaults', 'style' => local_groupimport_get_theme_style()];
$testconfig = ['themeprimarycolor' => '#ff0000', 'themeaccentcolor' => '#b9ebd0', 'themegroupcolor' => '#0000ff'];
$palettes[] = ['name' => 'mixed', 'style' => local_groupimport_get_theme_style()];

if (in_array('--json', $argv, true)) {
    echo json_encode($palettes, JSON_THROW_ON_ERROR) . "\n";
} else {
    echo "PASS: valid light Hex accepted, malformed input rejected, saved shade preserved, readable role derived.\n";
}
