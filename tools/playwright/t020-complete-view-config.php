<?php
// Bounded reversible configuration for the explicitly requested complete-view recipe.
define('CLI_SCRIPT', true);
require($argv[1] . '/config.php');
$action = $argv[2] ?? 'read';
if ($action === 'enable') {
    set_config('showcompleteview', '1', 'local_groupimport');
} else if ($action === 'restore') {
    $saved = json_decode($argv[3], true, 8, JSON_THROW_ON_ERROR);
    if ($saved['exists']) {
        set_config('showcompleteview', $saved['value'], 'local_groupimport');
    } else {
        unset_config('showcompleteview', 'local_groupimport');
    }
} else if ($action !== 'read') {
    throw new InvalidArgumentException('Unsupported recipe action');
}
$value = get_config('local_groupimport', 'showcompleteview');
echo json_encode(['exists' => $value !== false, 'value' => $value === false ? null : $value]);
