// Source-only CSS cascade proof; no browser, runtime, Moodle bootstrap or service.
'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {execFileSync}=require('node:child_process');const {pathToFileURL}=require('node:url');
const sass=require(path.resolve(process.argv[2])),postcss=require(path.resolve(process.argv[3]));
const root=path.resolve(__dirname,'../..');const read=p=>fs.readFileSync(path.join(root,p),'utf8').replace(/\r\n/g,'\n');
const original=p=>execFileSync('git',['-C',root,'show','4110785e:'+p],{encoding:'utf8',maxBuffer:8*1024*1024}).replace(/\r\n/g,'\n');
assert(sass.info.includes('1.79.1'));
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'easystud-p2-'));const prior=path.join(tmp,'_tutorial.scss');
let checks=0;const check=(ok,label)=>{checks++;assert(ok,label);};
const obsolete=s=>/local-groupimport-easystud(?:-(?:tutorial|guided-panel|discovery)|--tutorial)|data-easystud-(?:tutorial|discovery|guided-panel)|\.is-tutorial-/.test(s);
function projection(css){
    const rows=[];postcss.parse(css).walkRules(rule=>{
        const selectors=postcss.list.comma(rule.selector).filter(s=>!obsolete(s));if(!selectors.length)return;
        const parents=[];for(let p=rule.parent;p;p=p.parent)if(p.type==='atrule')parents.unshift([p.name,p.params]);
        rows.push({parents,selectors,body:rule.nodes.map(n=>n.toString())});
    });return rows;
}
try {
    fs.writeFileSync(prior,original('scss/components/_tutorial.scss').replace('@use "../easyedu"','@use "easyedu"'));
    const opts={charset:false,sourceMap:false,style:'expanded',loadPaths:[tmp,path.join(root,'scss')],logger:sass.Logger.silent,url:pathToFileURL(path.join(root,'scss/easystud.scss'))};
    const source=original('scss/easystud.scss').replace('@use "components/tutorial";','@use "tutorial";');
    const before=sass.compileString(source,opts).css;const after=sass.compile(path.join(root,'scss/easystud.scss'),opts).css;
    const a=projection(before),b=projection(after);
    if(JSON.stringify(a)!==JSON.stringify(b)){
        let i=0;while(i<Math.min(a.length,b.length)&&JSON.stringify(a[i])===JSON.stringify(b[i]))i++;
        throw Error('Active rule difference at '+i+' before='+JSON.stringify(a[i]).slice(0,600)+' after='+JSON.stringify(b[i]).slice(0,600));
    }
    check(a.length===b.length,'all active ordered selectors/declarations/media identical');
    check(before.length-after.length>40000,'obsolete CSS removed, not hidden');
    check(!fs.existsSync(path.join(root,'scss/components/_tutorial.scss')),'old partial removed');
    check(!read('scss/easystud.scss').includes('components/tutorial'),'old import removed');
    check(!read('templates/manage.mustache').includes('data-easystud-tutorial-modal'),'old modal markup removed');
    check(!read('templates/manage.mustache').includes('{{^useeasyeduguide}}'),'no fallback sections');
    check(read('templates/manage.mustache').includes('{{> local_groupimport/easyedu_navigation}}') && read('manage.php').includes("'local_groupimport/easyedu_guide',"),'shared Guide still rendered');
    check(read('manage.php').includes("$templatedata['useeasyeduguide'] = true;"),'current server always chooses shared Guide');
    check(original('amd/src/local/cm/guide.js')===read('amd/src/local/cm/guide.js'),'reserved Guide resolver/binder unchanged');
    const oldPage=projection(original('styles/student-management.css'));
    const newPage=projection(read('styles/student-management.css'));
    check(JSON.stringify(oldPage)===JSON.stringify(newPage),'generated Student Management active cascade unchanged');
    for(const file of ['styles.css','styles/mass-import.css','styles/administration.css']) {
        check(original(file)===read(file),file+' byte-identical apart from line endings');
    }
    const pageRemoved=Buffer.byteLength(original('styles/student-management.css'))-Buffer.byteLength(read('styles/student-management.css'));
    console.log(JSON.stringify({surface:'P2-css-cascade',passed:true,checks,activeRules:a.length,beforeBytes:Buffer.byteLength(before),afterBytes:Buffer.byteLength(after),removedBytes:Buffer.byteLength(before)-Buffer.byteLength(after),pageRemovedBytes:pageRemoved,runtimeAccess:false}));
} finally {fs.unlinkSync(prior);fs.rmdirSync(tmp);}
