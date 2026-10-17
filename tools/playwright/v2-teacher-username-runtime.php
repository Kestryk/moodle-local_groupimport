<?php
define('CLI_SCRIPT', true);
$o=getopt('', ['manifest:', 'output:', 'action:']);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
require_once($CFG->dirroot.'/group/lib.php');
require_once($CFG->dirroot.'/user/lib.php');
$m=json_decode(file_get_contents($o['manifest']),true,512,JSON_THROW_ON_ERROR);
$c=get_course($m['courseId']);
if($CFG->wwwroot!=='http://localhost:8051'||$CFG->dbname!=='moodle51perf'||$c->id<=5||$c->idnumber!==$m['identity']||$m['owner']!=='codex2-k16-01')throw new RuntimeException('Foreign fixture');
$uid=$m['userIds'][0];$outsider=end($m['userIds']);
if($o['action']==='setup'){
 $u=$DB->get_record('user',['id'=>$uid],'*',MUST_EXIST);
 if($u->auth!=='nologin'||$u->idnumber!==$m['identity'])throw new RuntimeException('Foreign user');
 $password=bin2hex(random_bytes(18)).'!Aa7';
 $DB->set_field('user','auth','manual',['id'=>$uid]);update_internal_user_password($u,$password);
 $manual=enrol_get_plugin('manual');$role=$DB->get_record('role',['shortname'=>'editingteacher']);
 foreach(enrol_get_instances($c->id,true) as $instance)if($instance->enrol==='manual'){$manual->enrol_user($instance,$uid,$role->id);$manual->unenrol_user($instance,$outsider);}
 $outside=$DB->get_record('user',['id'=>$outsider]);
 file_put_contents($o['output'].'/scope.csv',"identifier;groupname;groupingname\r\n".$u->username.";QA Teacher Applied;\r\n".$outside->username.";QA Outsider Refused;\r\n");
 echo json_encode(['username'=>$u->username,'password'=>$password,'userId'=>$uid,'outsideId'=>$outsider]);
}elseif($o['action']==='limit'){
 $DB->set_field('course','maxbytes',1024,['id'=>$c->id]);echo json_encode(['maxbytes'=>1024]);
}elseif($o['action']==='proof'){
 $groups=$DB->get_records('groups',['courseid'=>$c->id],'id','id,name');$rows=[];
 foreach($groups as $g)if(str_starts_with($g->name,'QA Teacher Applied')||str_starts_with($g->name,'QA Outsider Refused'))$rows[]=['name'=>$g->name,'members'=>array_keys(groups_get_members($g->id,'u.id'))];
 echo json_encode(['groups'=>$rows,'outsideEnrolled'=>is_enrolled(context_course::instance($c->id),$outsider)]);
}elseif($o['action']==='restore'){
 $DB->set_field('course','maxbytes',0,['id'=>$c->id]);$DB->set_field('user','auth','nologin',['id'=>$uid]);echo json_encode(['restored'=>true]);
}
