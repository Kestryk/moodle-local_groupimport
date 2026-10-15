<?php
// Supervised E5 save/restore: only declared plugin setting keys, own8051.
define('CLI_SCRIPT', true);
require('C:/dev/Moodle 51 Perf/moodle/config.php');
if ($CFG->wwwroot !== 'http://localhost:8051' || $CFG->dbname !== 'moodle51perf') {
    throw new RuntimeException('Own8051 only');
}
[$script, $action, $file] = $argv;
if (!in_array($action, ['begin','restore','verify'], true) || !str_starts_with(str_replace('\\','/',$file), 'C:/dev/artifacts/e5-')) {
    throw new RuntimeException('Explicit E5 external state required');
}
preg_match_all('~[\'\"]local_groupimport/([a-z0-9_]+)[\'\"]~', file_get_contents(__DIR__.'/../../settings.php'), $matches);
$keys=array_values(array_unique($matches[1]));
$read=static function() use ($DB, $keys) {
    $state=[];
    foreach ($keys as $key) {
        $row=$DB->get_record('config_plugins',['plugin'=>'local_groupimport','name'=>$key]);
        $state[$key]=$row ? $row->value : null;
    }
    return $state;
};
if ($action==='begin') {
    if (file_exists($file)) { throw new RuntimeException('Fresh state file required'); }
    file_put_contents($file,json_encode(['before'=>$read()],JSON_PRETTY_PRINT));
    echo 'E5 settings snapshot saved',PHP_EOL;
} else {
    $saved=json_decode(file_get_contents($file),true,512,JSON_THROW_ON_ERROR);
    if ($action==='restore') {
        foreach ($saved['before'] as $key=>$value) {
            if (!in_array($key,$keys,true)) { throw new RuntimeException('Unexpected setting key'); }
            if ($value===null) { unset_config($key,'local_groupimport'); } else { set_config($key,$value,'local_groupimport'); }
        }
    }
    $saved['restored']=$read();
    $saved['verified']=$saved['restored']===$saved['before'];
    if ($action==='restore') { file_put_contents($file,json_encode($saved,JSON_PRETTY_PRINT)); }
    if (!$saved['verified']) { throw new RuntimeException('Exact setting restoration failed'); }
    echo 'E5 exact settings restoration PASS',PHP_EOL;
}
