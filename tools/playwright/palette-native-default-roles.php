<?php
// Read-only default semantic roles for a browser-local palette specimen.
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
require_once($argv[1] . '/local/groupimport/lib.php');
$primary = local_groupimport_colour_for_soft_contrast('#0f6cbf', 0.10);
$accent = local_groupimport_colour_for_soft_contrast('#1b7f5a', 0.09);
echo json_encode([
    '--easyedu-primary-chosen' => '#0f6cbf',
    '--easyedu-primary' => $primary,
    '--easyedu-primary-strong' => 'color-mix(in srgb, ' . $primary . ' 82%, #000 18%)',
    '--easyedu-accent-chosen' => '#1b7f5a',
    '--easyedu-accent' => $accent,
    '--easyedu-success' => $accent,
]);
