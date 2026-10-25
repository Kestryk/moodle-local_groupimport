// T053: browser-normalized declaration/order proof; optional T058 color-only gate.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),zlib=require('node:zlib');
const assert=require('node:assert/strict');
(async()=>{
    const [beforePath,afterPath,outPath]=process.argv.slice(2);
    if(!beforePath||!afterPath||!outPath)throw Error('Explicit before/after CSS and external JSON required');
    const browserApi=require(process.env.EASYEDU_PLAYWRIGHT_MODULE||path.resolve(__dirname,'../playwright/node_modules/playwright'));
    const texts=[beforePath,afterPath].map(file=>fs.readFileSync(file,'utf8'));
    const browser=await browserApi.chromium.launch({headless:true});
    let parsed;
    try{
        const page=await browser.newPage();
        parsed=await page.evaluate(texts=>texts.map(css=>{
            const sheet=new CSSStyleSheet();sheet.replaceSync(css);
            const walk=rules=>[...rules].map(rule=>({type:rule.type,selector:rule.selectorText||null,
                condition:rule.conditionText||null,key:rule.keyText||null,name:rule.name||null,
                style:rule.style?[...rule.style].map(p=>({property:p,value:rule.style.getPropertyValue(p),priority:rule.style.getPropertyPriority(p)})):null,
                children:rule.cssRules?walk(rule.cssRules):null}));
            return walk(sheet.cssRules);
        }),texts);
    }finally{await browser.close();}
    const differences=[];
    const compare=(a,b,where='root')=>{
        assert.equal(a.length,b.length,'Rule count '+where);
        a.forEach((rule,i)=>{
            const other=b[i],id=where+'/'+i;
            for(const key of ['type','selector','condition','key','name'])assert.deepEqual(rule[key],other[key],key+' '+id);
            if(rule.style){
                assert.equal(rule.style.length,other.style.length,'Declaration count '+id);
                rule.style.forEach((decl,j)=>{
                    assert.equal(decl.property,other.style[j].property,'Declaration order '+id);
                    assert.equal(decl.priority,other.style[j].priority,'Priority '+id);
                    if(decl.value!==other.style[j].value)differences.push({selector:rule.selector,where:id,property:decl.property,before:decl.value,after:other.style[j].value});
                });
            }else assert.equal(other.style,null);
            if(rule.children)compare(rule.children,other.children,id);else assert.equal(other.children,null);
        });
    };
    compare(parsed[0],parsed[1]);
    const colorOnly=process.argv.includes('--t058-colors');
    const oldColors=new Set(['rgb(106, 122, 138)','rgb(98, 120, 142)','rgb(138, 155, 173)','rgb(113, 134, 155)']);
    const allowed=colorOnly?differences.every(d=>d.property==='color'&&oldColors.has(d.before)&&d.after==='var(--easyedu-text-muted)'):differences.length===0;
    const stats=texts.map(css=>({bytes:Buffer.byteLength(css),gzip:zlib.gzipSync(css).length,sha256:crypto.createHash('sha256').update(css).digest('hex')}));
    const report={surface:colorOnly?'T058-color-only-preservation':'T053-css-format-equivalence',niveau:0,
        passed:allowed,ruleOrderAndSelectorsIdentical:true,declarationOrderAndPriorityIdentical:true,
        before:stats[0],after:stats[1],differences,browserParser:'Chromium CSSOM; no Moodle, auth, native styles or network',
        scope:'Supported CSS parsed equally; native bundle/paint gate remains separate'};
    fs.writeFileSync(outPath,JSON.stringify(report,null,2)+'\n');
    assert(allowed,'Unapproved semantic CSS difference; see external JSON');
    console.log(JSON.stringify({...report,differences:report.differences.length}));
})().catch(e=>{
    const out=process.argv[4];
    if(out&&!fs.existsSync(out))fs.writeFileSync(out,JSON.stringify({surface:'CSS-equivalence',niveau:0,passed:false,
        error:e.message,actual:e.actual,expected:e.expected},null,2)+'\n');
    console.error(e);process.exitCode=1;
});
