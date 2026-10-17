<?php
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
require_once($CFG->dirroot.'/course/lib.php');
require_once($CFG->dirroot.'/user/lib.php');
if($CFG->wwwroot!=='http://localhost:8051'||$CFG->dbname!=='moodle51perf')throw new RuntimeException('Own8051 only');
\core\session\manager::set_user(get_admin());
$root='C:/dev/Moodle 51 Perf/moodle/local/recette-v2-lots-20261017';$results=[];$seen=[];
$it=new RecursiveIteratorIterator(new RecursiveDirectoryIterator($root,FilesystemIterator::SKIP_DOTS));
foreach($it as $file){
 if($file->getFilename()!=='fixture-manifest.json')continue;
 $m=json_decode(file_get_contents($file->getPathname()),true);$id=(int)($m['courseId']??0);
 if(!$id||isset($seen[$id]))continue;$seen[$id]=true;
 $identity=$m['identity']??$m['shortname']??'';
 if(!str_starts_with($identity,'codex2-k16-01-')&&!str_starts_with($identity,'eed-guide-write-'))throw new RuntimeException('Unrecognized own manifest');
 $exists=$DB->record_exists('course',['id'=>$id]);
 if($exists){
  $course=get_course($id);
  if($id<=5||$course->shortname!==$identity)throw new RuntimeException('Foreign live course');
  $CFG->forced_plugin_settings['tool_recyclebin']['categorybinenable']=0;
  $CFG->forced_plugin_settings['tool_recyclebin']['coursebinenable']=0;
  ob_start();delete_course($course,false);ob_end_clean();
  foreach($m['userIds']??[] as $uid){
   $user=$DB->get_record('user',['id'=>$uid,'deleted'=>0]);
   if(!$user)continue;
   if(!str_starts_with($user->username,$identity)||!in_array($user->auth,['nologin','manual'],true))throw new RuntimeException('Foreign live user');
   delete_user($user);
  }
  $DB->delete_records('local_groupimport_history',['courseid'=>$id]);$exists=false;
 }
 $active=[];foreach($m['userIds']??[] as $uid){
  if($DB->record_exists('user',['id'=>$uid,'deleted'=>0])){$active[]=$uid;continue;}
  $ctx=$DB->get_record('context',['contextlevel'=>CONTEXT_USER,'instanceid'=>$uid]);
  if($ctx)get_file_storage()->delete_area_files($ctx->id,'user','draft');
 }
 $drafts=0;$adminctx=context_user::instance(get_admin()->id);
 foreach($DB->get_records_select('files','contextid = ? AND component = ? AND filearea = ? AND filename LIKE ?',[$adminctx->id,'user','draft','v2-'.$id.'-%']) as $row){get_file_storage()->get_file_instance($row)->delete();$drafts++;}
 $results[]=['courseId'=>$id,'courseDeleted'=>!$exists,'activeFixtureUsers'=>$active,'groupsRemaining'=>$DB->count_records('groups',['courseid'=>$id]),'groupingsRemaining'=>$DB->count_records('groupings',['courseid'=>$id]),'historyRemaining'=>$DB->count_records('local_groupimport_history',['courseid'=>$id]),'ownDraftsRemoved'=>$drafts];
}
echo json_encode(['fixtures'=>$results,'pluginVersion'=>get_config('local_groupimport','version'),'historyCount'=>$DB->count_records('local_groupimport_history'),'showcompleteview'=>get_config('local_groupimport','showcompleteview'),'retentionDays'=>get_config('local_groupimport','historyretentiondays')],JSON_PRETTY_PRINT).PHP_EOL;
