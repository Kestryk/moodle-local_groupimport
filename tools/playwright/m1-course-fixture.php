<?php
// Both finally and process-shutdown cleanup restore the durable M1 state.
register_shutdown_function(static function() {
    global $action, $file;
    if (($action ?? '') !== 'cleanup') { return; }
    $state = dirname($file) . '/m1-state.json';
    if (is_file($state)) {
        define('EASYEDU_M1_RECIPE_LIBRARY', true);
        require_once(__DIR__ . '/../perf/m1-recipe-state.php');
        m1_recipe_restore($state);
    }
});
require(__DIR__ . '/complement3-course-fixture.php');
