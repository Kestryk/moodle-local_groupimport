<?php
/** Native owned performance fixtures; existing course71 is never mutated. */
define('CLI_SCRIPT', true);
$o=getopt('', ['moodle-root:', 'manifest:', 'action:', 'run-id:']);
require($o['moodle-root'].'/config.php');
require_once($CFG->dirroot.'/course/lib.php');require_once($CFG->dirroot.'/user/lib.php');require_once($CFG->dirroot.'/group/lib.php');require_once($CFG->libdir.'/testing/generator/lib.php');
if($CFG->wwwroot!=='http://localhost:8051'||$CFG->dbname!=='moodle51perf')throw new RuntimeException('Own8051 only');
\core\session\manager::set_user(get_admin());$file=$o['manifest'];ini_set('error_log',$file.'.php-errors.log');
$save=static function($m)use($file){file_put_contents($file,json_encode($m,JSON_PRETTY_PRINT|JSON_THROW_ON_ERROR));};
$m=is_file($file)?json_decode(file_get_contents($file),true):null;
if($o['action']==='cleanup'){
 if(!$m){echo json_encode(['complete'=>true,'reason'=>'no-manifest']);exit;}
 if(($m['owner']??'')!=='codex2-perf-v2')throw new RuntimeException('Foreign fixture');
 $CFG->forced_plugin_settings['tool_recyclebin']['categorybinenable']=0;$CFG->forced_plugin_settings['tool_recyclebin']['coursebinenable']=0;
 foreach($m['courseIds'] as $id){$c=$DB->get_record('course',['id'=>$id]);if($c){if($id<=71||!in_array($c->shortname,[$m['identity'].'-large',$m['identity'].'-small',$m['identity'].'-medium'],true))throw new RuntimeException('Foreign course');ob_start();delete_course($c,false);ob_end_clean();}$DB->delete_records('local_groupimport_history',['courseid'=>$id]);}
 foreach($m['userIds'] as $id){$u=$DB->get_record('user',['id'=>$id,'deleted'=>0]);if($u){if($u->auth!=='nologin'||$u->idnumber!==$m['identity'])throw new RuntimeException('Foreign user');delete_user($u);}}
 $live=0;foreach($m['courseIds'] as $id)$live+=$DB->count_records('course',['id'=>$id]);foreach($m['userIds'] as $id)$live+=$DB->count_records('user',['id'=>$id,'deleted'=>0]);
 $m['cleanup']=['complete'=>$live===0,'remainingOwnedObjects'=>$live,'course71GroupsUnchanged'=>$m['course71GroupsHash']===hash('sha256',json_encode($DB->get_records('groups',['courseid'=>71],'id','id,name')))];$save($m);echo json_encode($m['cleanup']);exit;
}
if($m)throw new RuntimeException('Fresh fixture manifest required');
$identity='perfv2-'.substr(hash('sha256',$o['run-id']),0,12);$m=['owner'=>'codex2-perf-v2','identity'=>$identity,'userIds'=>[],'courseIds'=>[],'course71GroupsHash'=>hash('sha256',json_encode($DB->get_records('groups',['courseid'=>71],'id','id,name')))];$save($m);
$g=new testing_data_generator();
foreach(['large','small','medium'] as $name){$c=$g->create_course(['fullname'=>'QA Perf V2 '.$name,'shortname'=>$identity.'-'.$name,'idnumber'=>$identity.'-'.$name,'visible'=>0,'numsections'=>0]);$m[$name.'CourseId']=(int)$c->id;$m['courseIds'][]=(int)$c->id;$save($m);}
$m['courseId']=$m['smallCourseId'];
for($i=0;$i<3000;$i++){
 $u=$g->create_user(['username'=>$identity.'-'.sprintf('%04d',$i),'email'=>$identity.'-'.$i.'@example.invalid','firstname'=>'Perf','lastname'=>'User '.sprintf('%04d',$i),'idnumber'=>$identity,'auth'=>'nologin']);$m['userIds'][]=(int)$u->id;$save($m);$g->enrol_user($u->id,$m['largeCourseId'],'student');if($i<30)$g->enrol_user($u->id,$m['smallCourseId'],'student');if($i<800)$g->enrol_user($u->id,$m['mediumCourseId'],'student');
}
foreach(['large'=>[300,60],'small'=>[4,2],'medium'=>[150,40]] as $name=>[$ng,$nGrouping]){
 $cid=$m[$name.'CourseId'];$groupings=[];$groups=[];
 for($i=0;$i<$nGrouping;$i++)$groupings[]=groups_create_grouping((object)['courseid'=>$cid,'name'=>'Perf Grouping '.sprintf('%03d',$i)]);
 for($i=0;$i<$ng;$i++){$id=groups_create_group((object)['courseid'=>$cid,'name'=>'Perf Group '.sprintf('%03d',$i)]);$groups[]=$id;groups_assign_grouping($groupings[$i%$nGrouping],$id);}
 foreach(array_slice($m['userIds'],0,$name==='large'?3000:($name==='medium'?800:30)) as $i=>$uid)foreach([0,1,2] as $offset)groups_add_member($groups[($i+$offset)%$ng],$uid);
}
$m['complete']=true;$save($m);echo json_encode(['complete'=>true,'managerUrl'=>$CFG->wwwroot.'/local/groupimport/manage.php?id='.$m['smallCourseId'],'small'=>$m['smallCourseId'],'large'=>$m['largeCourseId']]);
