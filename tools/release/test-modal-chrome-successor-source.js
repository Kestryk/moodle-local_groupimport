// SM-44: only canonical header/footer recipes and three History class adapters.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='3bfe9e2';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:4000000}));
for(const f of ['scss/easyedu/components/_modals.scss','scss/easyedu/_dialog-classes.scss','scss/easyedu/adapters/_moodle-message-dialog.scss'])
    assert.equal(read(f),norm(fs.readFileSync(path.join(kit,f),'utf8')),f+' canonical identity');
assert.equal(read('index.php').replace("'class' => 'easyedu-modal-title',","'class' => 'h5 mb-0',")
    .replace("'class' => 'easyedu-dialog-close',","'class' => 'local-groupimport-import-modal__close',")
    .replace("['class' => 'easyedu-dialog-header']","['class' => 'local-groupimport-import-modal__header']"),old('index.php'));
assert.equal(read('scss/easyedu/adapters/_moodle-message-dialog.scss')
    .replace('.modal-content .modal-header {','.modal-header {')
    .replace('@include modals.dialog-header;','@include modals.modal-header;')
    .replace('@include foundations.foundation-dialog-actions;','@include foundations.foundation-dialog-actions($density: compact);'),
    old('scss/easyedu/adapters/_moodle-message-dialog.scss'));
const owned=s=>s.startsWith('.easyedu-ui .easyedu-dialog-header')||s.startsWith('.easyedu-ui .easyedu-dialog-close')||
    s==='.local-groupimport-easystud-message-modal .modal-header'||
    s==='.local-groupimport-easystud-message-modal .modal-content .modal-header'||
    s.startsWith('.local-groupimport-easystud-message-modal .modal-footer >');
// Expand selector lists: adding a shared role must not mask existing entity declarations.
const fingerprint=css=>{const ast=postcss.parse(css),rows=[];ast.walkRules(n=>{
    const context=[];for(let p=n.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context.unshift(p.name+' '+p.params);
    for(const s of n.selectors.filter(s=>!owned(s)))rows.push([context,s,n.nodes.filter(d=>d.type==='decl').map(d=>[d.prop,d.value,d.important])]);
});return rows;};
assert.deepEqual(fingerprint(read('styles.css')),fingerprint(old('styles.css')),'all unrelated compiled CSS including rollback and loading');
for(const f of cp.execFileSync('git',['ls-files','amd','motion','choices','templates','settings.php','ajax.php','manage.php',
    'scss/components','scss/responsive','scss/views'],{cwd:root,encoding:'utf8'}).trim().split('\n'))assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS SM-44 canonical identity, exact History class adapters, unchanged commands/Motion/body/rollback and unrelated CSS');
