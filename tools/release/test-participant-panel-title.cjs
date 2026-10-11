const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8').replace(/\r\n/g,'\n');
const old=file=>execFileSync('git',['show','bc9946cc6f691a2ff7819f7a39e0f9522790af67:'+file],
    {cwd:root,encoding:'utf8',maxBuffer:32*1024*1024}).replace(/\r\n/g,'\n');
const source=read('manage.php');
assert.ok(source.replace("'participantstitle' => get_string('layoutmodeparticipants', 'local_groupimport')",
    "'participantstitle' => get_string('participants', 'local_groupimport')")===old('manage.php'),
    'Only panel copy mapping changes');
for(const file of ['templates/manage.mustache','styles.css','amd/src/course_manager.js',
    'amd/src/easyedu_guide.js','amd/src/motion.js','settings.php','version.php'])
    assert.ok(read(file)===old(file),file+' unchanged');
for(const [locale,label] of [['en','Participants & groups'],['fr','Participants & groupes']]) {
    assert.ok(read('lang/'+locale+'/local_groupimport.php').includes("$string['layoutmodeparticipants'] = '"+label+"';"));
    assert.match(read('lang/'+locale+'/local_groupimport.php'), /\['mobileviewparticipants'\]/);
}
assert.match(source, /'mobileviewparticipants' => get_string\('mobileviewparticipants', 'local_groupimport'\)/);
console.log('PASS one view-model mapping, EN/FR existing labels, untouched compact navigation/type/styles/commands');
