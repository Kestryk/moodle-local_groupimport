// SM-46: shared opt-in popup only; preserve all existing setting authorities.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='01c6446';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:5000000}));
for(const f of ['scss/easyedu/_components.scss','scss/easyedu/_foundation-classes.scss','scss/easyedu/components/_color-panel.scss'])
    assert.equal(read(f),norm(fs.readFileSync(path.join(kit,f),'utf8')),f+' canonical identity');
assert.equal(read('js/easyedu_colour_picker.js'),norm(fs.readFileSync(path.join(kit,'colour-picker/colour-picker.js'),'utf8')));
const settings=read('settings.php').replace(/                'data-easyedu-color-panel-labels' => json_encode\(\[\n[\s\S]*?                \], JSON_UNESCAPED_UNICODE \| JSON_THROW_ON_ERROR\),\n/,'')
    .replace("                'data-easyedu-motion-policy' => get_config('local_groupimport', 'enableanimations') === '0'\n                    ? 'disabled' : 'enabled',\n",'')
    .replace("    $PAGE->requires->js('/local/groupimport/js/easyedu_colour_picker.js', true);\n",'');
assert.equal(settings,old('settings.php'),'native setting storage/validation/defaults unchanged');
const boot=read('js/admin_settings_loading.js').replace(/            \/\/ Kit enhancement owns drafts\/focus only;[\s\S]*?            }\n(?=        }\);\n    };)/,'');
assert.equal(boot,old('js/admin_settings_loading.js'),'existing bootstrap/Hex/reset/contrast/loading preserved');
for(const lang of ['en','fr']){
    const f=`lang/${lang}/local_groupimport.php`;
    assert.equal(read(f).replace(/^\$string\['colourpicker(?:hue|saturation|brightness|palette|panelhex|invalid|apply)'\].*\n/gm,''),old(f));
}
const fingerprint=css=>{const ast=postcss.parse(css),rows=[];ast.walkRules(n=>{
    const context=[];for(let p=n.parent;p&&p.type!=='root';p=p.parent)if(p.type==='atrule')context.unshift(p.name+' '+p.params);
    if(context.some(c=>c==='keyframes easyedu-color-panel-enter'))return;
    for(const s of n.selectors.filter(s=>!s.includes('easyedu-color-panel')&&!s.includes('easyedu-color-picker__trigger')))
        rows.push([context,s,n.nodes.filter(d=>d.type==='decl').map(d=>[d.prop,d.value,d.important])]);
});return rows;};
assert.deepEqual(fingerprint(read('styles.css')),fingerprint(old('styles.css')),'whole unrelated CSS preserved');
for(const f of cp.execFileSync('git',['ls-files','amd','motion','choices','templates','ajax.php','manage.php','index.php','lib.php',
    'scss/components','scss/responsive','scss/views'],{cwd:root,encoding:'utf8'}).trim().split('\n'))assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS SM-46 canonical SCSS/controller identity, exact enhancement, all native storage/reset/contrast/loading and unrelated CSS/Motion/business code unchanged');
