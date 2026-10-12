<?php
/** Dedicated Perf-only opt-in Apache request meter; no cookies, parameters or HTML logged. */
if (($_SERVER['SERVER_PORT'] ?? '') !== '8051' ||
        !preg_match('/^smperf-[a-f0-9]{32}$/', $_SERVER['HTTP_X_EASYEDU_PERF_ID'] ?? '')) {
    return;
}
$perfrequestid = $_SERVER['HTTP_X_EASYEDU_PERF_ID'];
$perfstart = microtime(true);
$perfreserve = str_repeat('x', 262144);
register_shutdown_function(static function() use ($perfrequestid, $perfstart, &$perfreserve): void {
    global $DB, $CFG;
    $perfreserve = null;
    if (($CFG->dbname ?? '') !== 'moodle51perf') { return; }
    $last = error_get_last();
    $result = ['requestId' => $perfrequestid, 'serverMs' => (microtime(true) - $perfstart) * 1000,
        'sqlReadsTotal' => isset($DB) ? $DB->perf_get_reads() : null,
        'sqlWritesTotal' => isset($DB) ? $DB->perf_get_writes() : null,
        'peakMemoryBytes' => memory_get_peak_usage(true),
        'fatalType' => $last && in_array($last['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR], true)
            ? $last['type'] : null];
    file_put_contents(dirname($CFG->dataroot) . '/sm-http-meter.jsonl', json_encode($result) . "\n", FILE_APPEND | LOCK_EX);
});
