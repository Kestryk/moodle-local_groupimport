<?php
/** Read-only native timing probes and explicitly authorized cache/upgrade operations. */
define('CLI_SCRIPT',true);$o=getopt('', ['action:', 'course:', 'manifest:']);$start=microtime(true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if($CFG->wwwroot!=='http://localhost:8051'||$CFG->dbname!=='moodle51perf')throw new RuntimeException('Own8051 only');
\core\session\manager::set_user(get_admin());$action=$o['action'];
if($action==='purge'){purge_all_caches();echo json_encode(['purged'=>true]);exit;}
if($action==='upgrade'){
 require_once($CFG->libdir.'/upgradelib.php');$plugin=new stdClass();require($CFG->dirroot.'/local/groupimport/version.php');$before=get_config('local_groupimport','version');
 if((int)$before<(int)$plugin->version){require_once($CFG->dirroot.'/local/groupimport/db/upgrade.php');xmldb_local_groupimport_upgrade((int)$before);upgrade_component_updated('local_groupimport');upgrade_finished();purge_all_caches();}
 echo json_encode(['before'=>$before,'after'=>get_config('local_groupimport','version'),'disk'=>$plugin->version]);exit;
}
$m=json_decode(file_get_contents($o['manifest']),true);$id=(int)($o['course']??71);if(!in_array($id,array_merge([71],$m['courseIds']),true))throw new RuntimeException('Course outside measured allowlist');
if($action==='inspect'&&!$DB->record_exists('course',['id'=>$id])){echo json_encode(['courseId'=>$id,'available'=>false]);exit;}
$c=get_course($id);$ctx=context_course::instance($id);$count=count_enrolled_users($ctx);
if($action==='inspect'){echo json_encode(['courseId'=>$id,'participants'=>$count,'groups'=>$DB->count_records('groups',['courseid'=>$id]),'groupings'=>$DB->count_records('groupings',['courseid'=>$id]),'memberships'=>$DB->count_records_sql('SELECT COUNT(1) FROM {groups_members} gm JOIN {groups} g ON g.id=gm.groupid WHERE g.courseid=?',[$id]),'cachejs'=>$CFG->cachejs??true,'cachetemplates'=>$CFG->cachetemplates??true,'themedesignermode'=>$CFG->themedesignermode??false,'bootstrapMs'=>round((microtime(true)-$start)*1000,3),'phpSapi'=>PHP_SAPI,'xdebug'=>extension_loaded('xdebug')]);exit;}
if($action!=='server')throw new RuntimeException('Unknown action');
$bootstrap=(microtime(true)-$start)*1000;$reads=$DB->perf_get_reads();$sql=$DB->perf_get_queries_time();$t=microtime(true);$result=\local_groupimport\external\get_state::execute($id);$ms=(microtime(true)-$t)*1000;
echo json_encode(['courseId'=>$id,'participants'=>$count,'phpSapi'=>PHP_SAPI,'bootstrapMs'=>round($bootstrap,3),'getStateMs'=>round($ms,3),'stateBytes'=>strlen($result['state']),'responseBytes'=>strlen(json_encode($result)),'sqlReads'=>$DB->perf_get_reads()-$reads,'sqlMs'=>round(($DB->perf_get_queries_time()-$sql)*1000,3),'peakMemoryBytes'=>memory_get_peak_usage(true),'xdebug'=>extension_loaded('xdebug')]);
