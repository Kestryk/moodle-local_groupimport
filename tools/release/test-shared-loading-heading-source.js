// SM-40 successor: exact markup/include adapters, complete unrelated CSS guard.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='9aea9b6';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:4000000}));
assert.equal(read('scss/easyedu/components/_loading.scss'),norm(fs.readFileSync(path.join(kit,'scss/easyedu/components/_loading.scss'),'utf8')));
const removed="echo html_writer::tag('div',\n"+
    "    html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-action']) .\n"+
    "    html_writer::tag('span', '', ['class' => 'local-groupimport-import__loading-surface local-groupimport-import__loading-action']),\n"+
    "    ['class' => 'local-groupimport-import__loading-actions']\n);\n";
assert.equal(read('index.php'),old('index.php').replace(removed,''),'exact decorative PHP removal');
const adapters=[['scss/views/_mass-import.scss',
    '    box-sizing: border-box;\n    display: grid;\n    gap: 0.55rem;\n    max-inline-size: 100%;\n    min-width: 0;',
    '  &__loading-header {'],['scss/views/_admin-settings.scss','    display: grid;\n    gap: 0.55rem;',
    '  .local-groupimport-admin-settings__loading-header {']];
for(const [f,before,selector] of adapters) assert.equal(read(f),old(f).replace(selector+'\n'+before,
    selector+'\n    @include easyedu.skeleton-page-heading;'),f+' exact canonical adapter');
const allowed=['.local-groupimport-import__loading-header',
    '#page-admin-setting-local_groupimport .local-groupimport-admin-settings__loading-header'];
const fingerprint=css=>{const rows=[];postcss.parse(css).walkRules(n=>{
    const context=[];for(let p=n.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context.unshift(p.name+' '+p.params);
    for(const selector of n.selectors.filter(s=>!allowed.includes(s))) rows.push([context,selector,
        n.nodes.filter(d=>d.type==='decl').map(d=>[d.prop,d.value,d.important])]);
});return rows;};
assert.deepEqual(fingerprint(read('styles.css')),fingerprint(old('styles.css')),'all unrelated compiled CSS');
for(const f of cp.execFileSync('git',['ls-files','amd','motion','choices','js','templates','settings.php','ajax.php','manage.php',
    'scss/components','scss/responsive'],{cwd:root,encoding:'utf8'}).trim().split('\n'))assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS shared loading header: canonical identity, exact adapters, unchanged controllers/Motion/other CSS');
