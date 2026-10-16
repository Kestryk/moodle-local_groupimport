const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const root=path.resolve(__dirname,'../..'),evidence='C:/dev/Moodle 51 Perf/moodle/local/recette-soir-20261016';
const manifest=JSON.parse(fs.readFileSync(evidence+'/sync/manifest.json','utf8').replace(/^\uFEFF/,''));
const digest=b=>crypto.createHash('sha256').update(b).digest('hex').toUpperCase();
const differences=[],drift=[];
const referenceCommit='44b33f2f';
const tree=new Map(cp.execFileSync('git',['ls-tree','-r',referenceCommit],{cwd:root,encoding:'utf8'}).trim().split('\n').map(line=>{
 const m=line.match(/^\d+ blob ([a-f0-9]+)\t(.+)$/);return m?[m[2],m[1]]:['',''];
}));
const referenceMismatches=[];
for(const entry of manifest.files){
 const own=fs.readFileSync(path.join(root,entry.file)),runtime=fs.readFileSync(path.join(manifest.runtime,entry.file));
 if(digest(runtime)!==entry.sourceHash)drift.push(entry.file);
 const normalized=Buffer.from(runtime.toString('utf8').replace(/\r\n/g,'\n'));
 const gitHash=b=>crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex');
 if(gitHash(runtime)!==tree.get(entry.file)&&gitHash(normalized)!==tree.get(entry.file))referenceMismatches.push(entry.file);
 if(digest(own)!==entry.sourceHash){
  const diff=cp.spawnSync('git',['diff','--no-index','--ignore-all-space','--',path.join(root,entry.file),path.join(manifest.runtime,entry.file)],{encoding:'utf8'});
  differences.push({file:entry.file,ownHash:digest(own),runtimeHash:digest(runtime),whitespaceOnly:diff.status===0,diff:diff.stdout});
 }
}
fs.writeFileSync(evidence+'/pin-source-differences.json',JSON.stringify({claimedCommit:manifest.commit,referenceCommit,referenceMismatches,differences,drift},null,2));
console.log(JSON.stringify({claimedCommit:manifest.commit,differentFiles:differences.length,referenceCommit,referenceMismatches,drift}));
