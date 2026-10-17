const {test}=require('@playwright/test'),fs=require('node:fs'),path=require('node:path');
const run=require('./guide-refonte-paths-helper-v4.cjs');
test('Guide refonte root drag targeted successor native',async({page,browser},info)=>{
 const root='C:/dev/Moodle 51 Perf/moodle/local/recette-guide-20261017/actions-desktop-v3';
 const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]);
 const failures=walk(root).filter(p=>/guide-paths\.json$/.test(p)).flatMap(p=>JSON.parse(fs.readFileSync(p,'utf8')).checks).filter(c=>c.status==='FAIL'&&/user__avatar/.test(c.error||''));
 for(const c of failures){if(!['fr','en'].includes(c.lang)||![1600,1280].includes(c.width)||!['full','reduced','minimal'].includes(c.level))throw Error('Unexpected targeted cell');
  const scoped={outputDir:info.outputDir,outputPath:name=>info.outputPath(c.lang+'-'+c.width+'-'+c.level+'-'+name),setTimeout:ms=>info.setTimeout(ms)};
  await run({page,browser},scoped,[[c.lang,c.width]],['actions'],[c.level]);
 }
});
