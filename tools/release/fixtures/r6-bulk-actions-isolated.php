<?php
// Execute the four actual AJAX branch bodies with in-memory native adapters only.
define('MOODLE_INTERNAL', true);
define('PARAM_INT', 1); define('PARAM_TEXT', 2); define('SQL_PARAMS_NAMED', 1);
class moodle_exception extends RuntimeException {public function __construct($key, ...$rest) {parent::__construct($key);}}
class context_course {}
class core_php_time_limit {public static array $calls=[]; public static function raise($s){self::$calls[]=$s;}}
class memory_db {
    public array $members=[],$groups=[],$enrolled=[],$events=[];
    public int $starts=0,$commits=0,$rollbacks=0,$queries=0,$writes=0,$failat=0;
    public function start_delegated_transaction(){
        $this->starts++; $saved=[$this->members,$this->groups,$this->events];
        return new class($this,$saved) {
            public function __construct(private $db,private $saved){}
            public function allow_commit(){$this->db->commits++;}
            public function rollback($e){[$this->db->members,$this->db->groups,$this->db->events]=$this->saved;$this->db->rollbacks++;throw $e;}
        };
    }
    public function mutate(){if(++$this->writes===$this->failat)throw new RuntimeException('native-failure');}
    public function get_records_sql($sql,$params){$this->queries++;return $this->enrolled;}
    public function get_in_or_equal($ids,...$rest){return ['IN (...)',array_values($ids)];}
    public function get_records_select($table,$sql,$params,...$rest){
        $this->queries++;$course=$params['courseid'];unset($params['courseid']);$out=[];
        foreach($params as $id){if(isset($this->groups[$id])&&$this->groups[$id]->courseid===$course)$out[$id]=$this->groups[$id];}return $out;
    }
}
function required_param($key,$type){return $GLOBALS['input'][$key];}
function required_param_array($key,$type){return $GLOBALS['input'][$key];}
function groups_get_group($id){return $GLOBALS['DB']->groups[$id]??false;}
function groups_is_member($g,$u){return isset($GLOBALS['DB']->members["$g:$u"]);}
function groups_add_member($g,$u){$db=$GLOBALS['DB'];$db->mutate();$db->members["$g:$u"]=true;$db->events[]="add:$g:$u";return true;}
function groups_remove_member($g,$u){$db=$GLOBALS['DB'];$db->mutate();unset($db->members["$g:$u"]);$db->events[]="remove:$g:$u";return true;}
function groups_remove_member_allowed($g,$u){return $u!==99;}
function groups_delete_group($id){$db=$GLOBALS['DB'];$db->mutate();unset($db->groups[$id]);$db->events[]="delete:$id";return true;}
function get_enrolled_sql($c){return ['SELECT id FROM enrolled',[]];}
function isguestuser($id){return false;}
function is_enrolled(...$args){throw new RuntimeException('Unexpected per-user enrolment query');}
function get_string($key,...$args){return $key;}
function local_groupimport_count_string($key,$count){return "$key:$count";}
function fullname($user){return 'User '.$user->id;}
function local_groupimport_extract_user_tokens($s){return array_values(array_unique(preg_split('/\\s+/',trim($s),-1,PREG_SPLIT_NO_EMPTY)));}
function local_groupimport_find_users_by_identifiers($tokens){$out=[];foreach($tokens as $t){if(preg_match('/^user([0-9]+)$/',$t,$m))$out[$t]=(object)['id'=>(int)$m[1]];}return $out;}
$root=dirname(__DIR__,3);
require $root.'/classes/local/bulk_action.php';
require $root.'/classes/local/batch_reader.php';
require $root.'/classes/local/ajax_security.php';
$assignment=file_get_contents($root.'/classes/service/membership_assignment.php');
$bootstrap="require_once(\$CFG->dirroot . '/group/lib.php');";
if(substr_count($assignment,$bootstrap)!==1)throw new RuntimeException('Review changed native bootstrap');
eval(substr(str_replace($bootstrap,'',$assignment),5));
use local_groupimport\local\bulk_action;
use local_groupimport\local\ajax_security;
$source=file_get_contents($root.'/ajax.php');$bodies=[];
foreach(['addusers','addemails','removemembers','deletegroups'] as $name){
    $marker="} else if (\$action === '$name') {";$start=strpos($source,$marker)+strlen($marker);
    $end=strpos($source,"} else if (\$action === '",$start);$bodies[$name]=substr($source,$start,$end-$start);
}
$checks=0;function check($ok,$label){$GLOBALS['checks']++;if(!$ok)throw new RuntimeException($label);}
function reset_state(){
    $GLOBALS['DB']=new memory_db();$db=$GLOBALS['DB'];$db->groups=[10=>(object)['id'=>10,'courseid'=>5],11=>(object)['id'=>11,'courseid'=>5],12=>(object)['id'=>12,'courseid'=>6]];
    for($i=1;$i<=500;$i++)$db->enrolled[$i]=(object)['id'=>$i];
    $GLOBALS['USER']=(object)['id'=>0];core_php_time_limit::$calls=[];
}
function action($name,$input){
    global $DB;$context=new context_course();$course=(object)['id'=>5];$response=['success'=>false];$GLOBALS['input']=$input;
    eval('use local_groupimport\\local\\bulk_action; use local_groupimport\\local\\ajax_security; '.$GLOBALS['bodies'][$name]);return $response;
}
function rejection($name,$input,$message){try{action($name,$input);}catch(Throwable $e){check($e->getMessage()===$message,$name.' expected '.$message);return;}throw new RuntimeException('Expected rejection');}
reset_state();$r=action('addusers',['groupid'=>10,'userids'=>range(1,500)]);
check($r['added']===500&&count($DB->members)===500,'500 native writes');check($DB->queries===1,'one enrolment snapshot');check($DB->commits===1&&$DB->rollbacks===0,'commit once');check(core_php_time_limit::$calls===[180],'raise once');
reset_state();rejection('addusers',['groupid'=>10,'userids'=>array_fill(0,501,1)],'bulkactionlimit');check($DB->writes===0&&$DB->starts===0&&$DB->queries===0,'oversize before lookups/transaction');
reset_state();$r=action('addusers',['groupid'=>10,'userids'=>[1,1,999]]);check($r['added']===1&&count($DB->members)===1,'duplicate and unenrolled skipped');check($r['skipped']===1&&str_contains($r['message'],'bulkitemsskipped'),'explicit partial add summary');$r=action('addusers',['groupid'=>10,'userids'=>[1]]);check($r['existing']===1,'existing count retained');
reset_state();$DB->failat=3;rejection('addusers',['groupid'=>10,'userids'=>[1,2,3]],'native-failure');check(!$DB->members&&!$DB->events&&$DB->rollbacks===1&&$DB->commits===0,'add rollback and event buffering');
reset_state();$r=action('addemails',['groupid'=>10,'emails'=>'user1 unknown user999 user2']);check(count($r['users'])===2&&$r['missing']===['unknown','user999'],'email partial matching response retained');check($r['skipped']===2&&str_contains($r['message'],'bulkitemsskipped'),'explicit email partial summary');check($DB->queries===1&&$DB->commits===1,'email grouped enrolment/commit');
reset_state();rejection('addemails',['groupid'=>10,'emails'=>implode(' ',array_map(fn($i)=>'user'.$i,range(1,501)))],'bulkactionlimit');check($DB->writes===0&&$DB->starts===0,'email cap no writes');
reset_state();$DB->failat=2;rejection('addemails',['groupid'=>10,'emails'=>'user1 user2'],'native-failure');check(!$DB->members&&!$DB->events&&$DB->rollbacks===1,'email atomic');
reset_state();$DB->members=['10:1'=>true,'10:2'=>true];$r=action('removemembers',['groupids'=>[10,10],'userids'=>[1,2]]);check(!$DB->members&&$DB->commits===1,'remove success');
reset_state();$DB->members=['10:1'=>true,'10:2'=>true];$DB->failat=2;rejection('removemembers',['groupids'=>[10,10],'userids'=>[1,2]],'native-failure');check(count($DB->members)===2&&!$DB->events&&$DB->rollbacks===1,'remove atomic');
reset_state();rejection('removemembers',['groupids'=>array_fill(0,501,10),'userids'=>array_fill(0,501,1)],'bulkactionlimit');check($DB->writes===0&&$DB->starts===0,'remove cap');
reset_state();$DB->members=['10:1'=>true,'10:99'=>true];rejection('removemembers',['groupids'=>[10,10],'userids'=>[1,99]],'invaliddata');check(count($DB->members)===2&&$DB->writes===0,'component protection preflight');
reset_state();$r=action('deletegroups',['groupids'=>[10,10,11,12,999]]);check(!isset($DB->groups[10])&&!isset($DB->groups[11])&&isset($DB->groups[12]),'course scope/dedupe');check($DB->queries===1&&$DB->commits===1,'one group lookup/commit');
reset_state();$DB->failat=2;rejection('deletegroups',['groupids'=>[10,11]],'native-failure');check(count($DB->groups)===3&&!$DB->events&&$DB->rollbacks===1,'delete DB atomic');
reset_state();rejection('deletegroups',['groupids'=>range(1,501)],'bulkactionlimit');check($DB->writes===0&&$DB->queries===0&&$DB->starts===0,'delete cap before reads/writes');
echo json_encode(['surface'=>'r6-server','passed'=>true,'checks'=>$checks,'databaseConnections'=>0,'runtimeAccess'=>false]),"\n";
