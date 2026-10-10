<?php
// Actual consumer presentation fixture; no Moodle session, DB or business action.
ob_start();
require(__DIR__ . '/guide-current-curriculum-fixture.php');
$data = json_decode(ob_get_clean(), true, 512, JSON_THROW_ON_ERROR);
foreach ($data['templateData']['slides'] as $slide) {
    if (isset($slide['discoveryscene']) &&
            in_array($slide['discoveryscene']['kind'], ['membership', 'actions', 'inspection'], true)) {
        if (empty($slide['discoveryscene']['manualstart'])) {
            throw new \RuntimeException('Timed consumer scene is missing explicit demonstration entry.');
        }
    }
}
$data['productionPresentationOnly'] = true;
echo json_encode($data, JSON_THROW_ON_ERROR);
