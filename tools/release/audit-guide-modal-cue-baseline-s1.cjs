// Offline current-payload inventory. No Moodle bootstrap, DB, auth or native proof.
const assert=require('node:assert/strict'),path=require('node:path'),{execFileSync}=require('node:child_process');
const php=process.argv[2];assert.ok(php,'Supply the PHP executable');
const fixture=path.join(__dirname,'guide-current-curriculum-fixture.php');
const expected={
 'prepare-activity-grouping':['activityGroupDestination','activityGroupConfirm'],
 'inspect-group-settings':['groupEditorName','groupEditorDescription','groupEditorCancel'],
 'inspect-grouping-settings':['groupingEditorName','groupingEditorDescription','groupingEditorCancel'],
 'reorganise-source-members':['memberMoveDestination','memberMoveConfirm'],
 'practice-membership':['participantMoveDestination','participantMoveConfirm']
};
const rows=[];
for(const language of ['en','fr']){
 const data=JSON.parse(execFileSync(php,[fixture,language],{encoding:'utf8'}));
 assert.equal(Object.keys(data.paths).length,9,'Current nine retained path definitions');
 const actual=Object.fromEntries(Object.entries(data.paths).map(([name,steps])=>[name,steps.filter(s=>s.open?.includes('dialog')&&s.id!=='open-editor').map(s=>s.target)]).filter(([,targets])=>targets.length));
 assert.deepEqual(actual,expected,'All twelve modal targets preserved');
 rows.push({language,pathDefinitions:9,modalTargets:Object.values(actual).flat().length});
}
console.log(JSON.stringify({rows,nativeVerified:false,humanAccepted:false,courseWrites:false}));
