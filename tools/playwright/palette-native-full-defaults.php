<?php
// Full default palette projection; compute only, never change plugin settings.
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
require_once($argv[1] . '/local/groupimport/lib.php');
$chosen = ['primary' => '#0f6cbf', 'accent' => '#1b7f5a', 'participant' => '#4873ad',
    'group' => '#29724d', 'grouping' => '#6a7f98'];
$shares = ['primary' => 0.10, 'accent' => 0.09, 'participant' => 0.11, 'group' => 0.11, 'grouping' => 0.11];
$properties = [];
foreach ($chosen as $role => $hex) {
    $readable = local_groupimport_colour_for_soft_contrast($hex, $shares[$role]);
    $properties['--easyedu-' . $role . '-chosen'] = $hex;
    $properties['--easyedu-' . $role] = $readable;
    $share = (int)round($shares[$role] * 100);
    $properties['--easyedu-' . $role . '-soft'] =
        'color-mix(in srgb, ' . $hex . ' ' . $share . '%, #fff ' . (100 - $share) . '%)';
    if (in_array($role, ['participant', 'group', 'grouping'], true)) {
        $properties['--easyedu-' . $role . '-rail'] = 'color-mix(in srgb, ' . $readable . ' 68%, #fff 32%)';
    }
}
$properties['--easyedu-primary-strong'] =
    'color-mix(in srgb, ' . $properties['--easyedu-primary'] . ' 82%, #000 18%)';
$properties['--easyedu-info'] = $properties['--easyedu-primary'];
$properties['--easyedu-info-soft'] = $properties['--easyedu-primary-soft'];
$properties['--easyedu-success'] = $properties['--easyedu-accent'];
$properties['--easyedu-success-soft'] = $properties['--easyedu-accent-soft'];
echo json_encode($properties);
