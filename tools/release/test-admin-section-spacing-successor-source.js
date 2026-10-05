// SM-45: only inter-section start margin, preserving every existing control.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='74df12a';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:4000000}));
for(const f of ['scss/easyedu/_tokens.scss','scss/easyedu/_foundation-classes.scss','scss/easyedu/components/_forms.scss'])
    assert.equal(read(f),norm(fs.readFileSync(path.join(kit,f),'utf8')),f+' canonical identity');
const adapter='  // Shared section flow adapts Moodle\'s native fieldset, not individual rows.\n'+
    '  #adminsettings .settingsform {\n    @include easyedu.moodle-admin-section-spacing;\n  }\n\n';
assert.equal(read('scss/views/_admin-settings.scss').replace(adapter,''),old('scss/views/_admin-settings.scss'));
const selectors=['.easyedu-ui .easyedu-admin-section-flow > h3.main','.easyedu-ui .easyedu-admin-section-flow > fieldset > h3.main',
    '#page-admin-setting-local_groupimport #adminsettings .settingsform > h3.main',
    '#page-admin-setting-local_groupimport #adminsettings .settingsform > fieldset > h3.main'];
const tokens=['--easyedu-admin-section-gap','--easyedu-admin-section-gap-narrow'];
const fingerprint=css=>{const ast=postcss.parse(css),rows=[];ast.walkRules(n=>{
    const context=[];for(let p=n.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context.unshift(p.name+' '+p.params);
    for(const s of n.selectors.filter(s=>!selectors.includes(s)))rows.push([context,s,n.nodes.filter(d=>d.type==='decl'&&!tokens.includes(d.prop)).map(d=>[d.prop,d.value,d.important])]);
});return rows;};
assert.deepEqual(fingerprint(read('styles.css')),fingerprint(old('styles.css')),'all unrelated compiled CSS');
for(const f of cp.execFileSync('git',['ls-files','amd','motion','choices','templates','settings.php','ajax.php','manage.php','index.php',
    'scss/components','scss/responsive','scss/views/_mass-import.scss'],{cwd:root,encoding:'utf8'}).trim().split('\n'))assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS SM-45 canonical identity, exact one-include adapter, all unrelated CSS/controls/settings/Motion unchanged');
