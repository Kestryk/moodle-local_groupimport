<?php
// Native Moodle APIs and SQL evidence, restricted to the supervised own8051 fixture.
define('CLI_SCRIPT', true);
$o = getopt('', ['manifest:', 'output:', 'action:', 'file:']);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
require_once($CFG->dirroot . '/group/lib.php');
require_once($CFG->dirroot . '/user/lib.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {throw new RuntimeException('Own8051 only');}
$m = json_decode(file_get_contents($o['manifest']), true, 512, JSON_THROW_ON_ERROR);
$course = get_course($m['courseId']);
if ($course->id <= 5 || !in_array($m['owner'] ?? '', ['codex2-k16-01'], true) || $course->idnumber !== $m['identity']) {throw new RuntimeException('Foreign fixture');}
\core\session\manager::set_user(get_admin());
$out = $o['output'];
if (!is_dir($out) || !str_starts_with(str_replace('\\', '/', realpath($out)), 'C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017/')) {throw new RuntimeException('External own evidence only');}
$checks = [];
function vcheck($lot, $point, $ok, $measure) {global $checks; $checks[] = ['lot' => $lot, 'point' => $point, 'status' => $ok ? 'PASS' : 'FAIL', 'measure' => $measure];}
$uid = (int)$m['userIds'][0];
$peer = (int)$m['userIds'][1];
$context = context_course::instance($course->id);
if ($o['action'] === 'maxbytes') {$DB->set_field('course', 'maxbytes', 1024, ['id' => $course->id]); echo json_encode(['maxbytes' => 1024]); exit;}
if ($o['action'] === 'restorebytes') {$DB->set_field('course', 'maxbytes', 0, ['id' => $course->id]); echo json_encode(['maxbytes' => 0]); exit;}
if ($o['action'] === 'xlsx') {
    $book = \PhpOffice\PhpSpreadsheet\IOFactory::load($o['file']); $formulas = []; $values = [];
    foreach ($book->getActiveSheet()->getRowIterator() as $row) {foreach ($row->getCellIterator() as $cell) {
        if ($cell->getDataType() === 'f') {$formulas[] = $cell->getCoordinate();}
        $values[] = $cell->getValue();
    }}
    vcheck('S7-M5', 'downloaded XLSX has no formula cells', !$formulas, ['formulas' => $formulas, 'values' => $values]);
    echo json_encode($checks, JSON_UNESCAPED_UNICODE); exit;
}
$before = $DB->get_records('local_groupimport_history', null, 'id');
$tx = $DB->start_delegated_transaction();
$setting = get_config('local_groupimport', 'historyretentiondays');
try {
    $changes = ['desiredstate' => [['userid' => $uid, 'identifier' => 'old-subject@example.invalid'], ['userid' => $peer, 'identifier' => 'peer@example.invalid']],
        'reportrows' => [['userid' => $uid, 'identifier' => 'old-subject@example.invalid', 'status' => 'success'], ['userid' => $peer, 'identifier' => 'peer@example.invalid', 'status' => 'success']]];
    $record = (object)['courseid' => $course->id, 'userid' => $peer, 'filename' => 'v2-privacy.csv', 'filehash' => str_repeat('a',64), 'rowcount' => 2, 'successcount' => 2, 'errorcount' => 0, 'replacepolicy' => 'keep', 'changesjson' => json_encode($changes), 'timecreated' => time(), 'rollbackuserid' => $uid];
    $id = $DB->insert_record('local_groupimport_history', $record);
    $approved = new \core_privacy\local\request\approved_contextlist($DB->get_record('user', ['id' => $uid]), 'local_groupimport', [$context->id]);
    \local_groupimport\privacy\provider::export_user_data($approved);
    $writer = \core_privacy\local\request\writer::with_context($context);
    $rp = new ReflectionProperty($writer, 'path'); $rp->setAccessible(true); $path = $rp->getValue($writer);
    $json = [];
    foreach (new RecursiveIteratorIterator(new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS)) as $file) {if ($file->getExtension() === 'json') {$json[] = json_decode(file_get_contents($file->getPathname()), true);}}
    $export = json_encode($json);
    vcheck('S2', 'real Privacy export isolates the subject', str_contains($export, 'old-subject@example.invalid') && !str_contains($export, 'peer@example.invalid'), ['export' => $json]);
    \local_groupimport\privacy\provider::delete_data_for_user($approved);
    $after = $DB->get_record('local_groupimport_history', ['id' => $id]);
    vcheck('S2', 'Privacy deletion preserves peer history', !str_contains($after->changesjson, 'old-subject@example.invalid') && str_contains($after->changesjson, 'peer@example.invalid') && !$after->rollbackuserid, ['changes' => json_decode($after->changesjson), 'rollbackuserid' => $after->rollbackuserid]);
    $expired = clone $record; $expired->timecreated = time() - 31 * DAYSECS; $expiredid = $DB->insert_record('local_groupimport_history', $expired);
    set_config('historyretentiondays', 30, 'local_groupimport');
    (new \local_groupimport\task\purge_import_history())->execute();
    vcheck('S2', 'manual scheduled task deletes expired only', !$DB->record_exists('local_groupimport_history', ['id' => $expiredid]) && $DB->record_exists('local_groupimport_history', ['id' => $id]), ['retentionDays' => \local_groupimport\task\purge_import_history::retention_days(), 'expiredDeleted' => !$DB->record_exists('local_groupimport_history', ['id' => $expiredid]), 'recentKept' => $DB->record_exists('local_groupimport_history', ['id' => $id])]);
    $user = $DB->get_record('user', ['id' => $uid]);
    $outsider = (object)['username' => $m['identity'].'-outsider', 'password' => '', 'auth' => 'nologin', 'confirmed' => 1, 'firstname' => 'QA Outside', 'lastname' => 'Course', 'email' => $m['identity'].'-outside@example.invalid', 'mnethostid' => $CFG->mnet_localhost_id];
    $outsideid = user_create_user($outsider, false, false);
    $inside = array_keys(\local_groupimport\local\import_user_lookup::by_field($user->email, 'email', $context));
    $outside = \local_groupimport\local\import_user_lookup::by_field($outsider->email, 'email', $context);
    vcheck('S5', 'native lookup enrolled only', $inside === [$uid] && !$outside, ['enrolledFound' => $inside, 'outsideFound' => array_keys($outside)]);
    file_put_contents($out.'/lookup-identifiers.json', json_encode(['inside' => $user->email, 'outside' => $outsider->email]));
} catch (Throwable $e) {vcheck('S2/S5', 'native API execution', false, ['exception' => get_class($e), 'message' => $e->getMessage()]);}
finally {
    try {$tx->rollback(new RuntimeException('Owned fixture rollback'));} catch (RuntimeException $e) {}
    if ($setting === false) {unset_config('historyretentiondays', 'local_groupimport');} else {set_config('historyretentiondays', $setting, 'local_groupimport');}
    $restored = $DB->get_records('local_groupimport_history', null, 'id');
    vcheck('S2', 'all pre-existing history restored', json_encode($before) === json_encode($restored), ['beforeCount' => count($before), 'afterCount' => count($restored)]);
}
// Generate real files for the native browser picker and native export endpoint.
$user = $DB->get_record('user', ['id' => $uid]);
$csv = "identifier;groupname;groupingname\r\n".$user->email.";\"Équipe été\nDeuxième ligne\";Promotion\r\n";
file_put_contents($out.'/multiline-utf8.csv', $csv);
file_put_contents($out.'/multiline-cp1252.csv', mb_convert_encoding($csv, 'Windows-1252', 'UTF-8'));
foreach (['multiline-utf8.csv','multiline-cp1252.csv'] as $filename) {
    try {$parsed=\local_groupimport\local\import_reader::csv(file_get_contents($out.'/'.$filename));vcheck('S6',$filename,count($parsed['rows'])===1&&$parsed['rows'][0][1]==="Équipe été\nDeuxième ligne",['rows'=>$parsed['rows']]);}
    catch(Throwable $e){vcheck('S6',$filename,false,['error'=>$e->getMessage()]);}
}
$book = new \PhpOffice\PhpSpreadsheet\Spreadsheet();$sheet = $book->getActiveSheet();
$sheet->fromArray([['identifier','groupname','groupingname']]);
for ($i=0;$i<3000;$i++) {$sheet->fromArray([[$user->email,'QA XLSX '. $i,'QA Formatted']], null, 'A'.($i+2));}
$sheet->getStyle('A:A')->getFont()->setBold(true);
(new \PhpOffice\PhpSpreadsheet\Writer\Xlsx($book))->save($out.'/formatted-3000.xlsx');$book->disconnectWorksheets();
try {$t=microtime(true);$parsed=\local_groupimport\local\import_reader::excel(file_get_contents($out.'/formatted-3000.xlsx'),'formatted-3000.xlsx');vcheck('R9/S6','native reader 3000 formatted rows',count($parsed['rows'])===3000,['rows'=>count($parsed['rows']),'durationMs'=>round((microtime(true)-$t)*1000),'peakMemoryBytes'=>memory_get_peak_usage(true)]);}
catch(Throwable $e){vcheck('R9/S6','native reader 3000 formatted rows',false,['error'=>$e->getMessage()]);}
$formulas = ['=1+1','+SUM(1,1)','-1+1','@SUM(1,1)'];$rows = [];
foreach ($formulas as $value) {$rows[]=['identifier'=>$value,'groupname'=>$value,'groupingname'=>$value,'status'=>'success','messages'=>[$value]];}
$history = (object)['courseid'=>$course->id,'userid'=>$uid,'filename'=>'v2-export.csv','filehash'=>str_repeat('b',64),'rowcount'=>4,'successcount'=>4,'errorcount'=>0,'replacepolicy'=>'keep','changesjson'=>json_encode(['reportrows'=>$rows,'padding'=>str_repeat('x',1000000)]),'timecreated'=>time()];
$hid=$DB->insert_record('local_groupimport_history',$history);
file_put_contents($out.'/seed.json',json_encode(['historyid'=>$hid,'courseid'=>$course->id,'userId'=>$uid,'groupIds'=>$m['groupIds']]));
echo json_encode(['checks'=>$checks,'seed'=>['historyid'=>$hid],'files'=>['multiline-utf8.csv','multiline-cp1252.csv','formatted-3000.xlsx']],JSON_UNESCAPED_UNICODE).PHP_EOL;
