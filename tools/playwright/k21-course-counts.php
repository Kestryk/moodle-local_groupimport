<?php
// Read-only expected model counts for the managed principal course5 recipe.
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
echo json_encode([
    'groups' => $DB->count_records('groups', ['courseid' => 5]),
    'groupings' => $DB->count_records('groupings', ['courseid' => 5]),
]);
