<?php
/** Remove only orphan SM version rows of already-cleaned, manifest-owned Perf courses. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
define('CLI_SCRIPT', true);
$options = getopt('', ['moodle-root:', 'manifest:', 'output:']);
require($options['moodle-root'] . '/config.php');
require_once(__DIR__ . '/lib.php');
if ($CFG->dbname !== 'moodle51perf' || parse_url($CFG->wwwroot, PHP_URL_PORT) !== 8051) {
    throw new RuntimeException('Dedicated Perf copy only.');
}
$fixture = easystud_perf_manifest($options['manifest']);
if (empty($fixture['cleanup']['complete']) || empty($fixture['cleanup']['preExistingRelationshipsUnchanged']) ||
        empty($fixture['courseId']) || $DB->record_exists('course', ['id' => $fixture['courseId']])) {
    throw new RuntimeException('Refuse metadata cleanup until the exact owned course is fully cleaned.');
}
$table = 'local_groupimport_statever';
$exists = $DB->get_manager()->table_exists(new xmldb_table($table));
$removed = 0;
if ($exists) {
    $removed = $DB->count_records($table, ['courseid' => $fixture['courseId']]);
    $DB->delete_records($table, ['courseid' => $fixture['courseId']]);
}
$result = ['courseId' => $fixture['courseId'], 'ownedOrphanVersionRowsRemoved' => $removed,
    'passed' => !$exists || !$DB->record_exists($table, ['courseid' => $fixture['courseId']])];
easystud_perf_write($options['output'], $result);
echo json_encode($result) . "\n";
