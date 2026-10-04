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

echo "PASS: valid light Hex accepted, malformed input rejected, saved shade preserved, readable role derived.\n";
