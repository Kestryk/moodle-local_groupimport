// SM-43B: exact new roles and two class-only native catalogue compositions.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='7d37a75';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:4000000}));
for(const f of ['scss/easyedu/components/_forms.scss','scss/easyedu/_foundation-classes.scss'])
    assert.equal(read(f),norm(fs.readFileSync(path.join(kit,f),'utf8')),f+' canonical identity');
const template=read('templates/manage.mustache');
assert.equal((template.match(/class="easyedu-filter-actions"/g)||[]).length,2);
assert.equal(template.replace(/easyedu-filter-toggle--trailing /g,'')
    .replace(/(^[ \t]*)<div class="easyedu-filter-actions">\n([\s\S]*?)\n\1<\/div>/gm,
        (_,indent,body)=>body.split('\n').map(line=>{assert.ok(line.startsWith(indent+'    '));return line.slice(4);}).join('\n')),
    old('templates/manage.mustache'));
const removed=[
    '  &-group-catalog-filters &-toggle-check {\n    align-self: center;\n    grid-column: 1;\n    grid-row: 2;\n    margin: 0;\n    width: fit-content;\n  }\n\n',
    '  &-group-catalog-filters &__filters-reset--catalog {\n    align-self: center;\n    grid-column: 2;\n    grid-row: 2;\n    justify-content: center;\n    width: auto;\n  }\n\n'
];
let structure=old('scss/components/_structure.scss');
for(const block of removed){assert.ok(structure.includes(block));structure=structure.replace(block,'');}
assert.equal(read('scss/components/_structure.scss'),structure);
let mobile=old('scss/responsive/_mobile.scss');
mobile=mobile.replace('    &-group-catalog-filters > &__filter-group,\n    &-group-catalog-filters &-toggle-check,\n    &-group-catalog-filters &__filters-reset--catalog {','    &-group-catalog-filters > &__filter-group {');
for(const block of ['    &-group-catalog-filters &-toggle-check {\n      margin-top: 0.34rem;\n    }\n\n',
    '    &-group-catalog-filters &-toggle-check {\n      justify-content: center;\n      width: 100%;\n    }\n\n']){
    assert.ok(mobile.includes(block));mobile=mobile.replace(block,'');
}
assert.equal(read('scss/responsive/_mobile.scss'),mobile);
const owned=s=>s.startsWith('.easyedu-ui .easyedu-filter-toggle.easyedu-filter-toggle--trailing')||
    s.startsWith('.easyedu-ui .easyedu-filter-actions')||
    ['.local-groupimport-easystud-group-catalog-filters .local-groupimport-easystud-toggle-check',
        '.local-groupimport-easystud-group-catalog-filters .local-groupimport-easystud__filters-reset--catalog'].includes(s);
// Exact two native selectors only; descendants, legacy paint and ALL Motion remain compared.
const strip=css=>{const ast=postcss.parse(css);ast.walkComments(n=>n.remove());
    ast.walkRules(n=>{const remaining=n.selectors.filter(s=>!owned(s));
        if(!remaining.length)n.remove();else if(remaining.length!==n.selectors.length)n.selector=remaining.join(', ');});
    ast.walkAtRules(n=>{if(n.nodes&&!n.nodes.length)n.remove();});
    return ast.toString().replace(/\s+/g,' ').trim();};
const after=strip(read('styles.css')),before=strip(old('styles.css'));
if(after!==before){let i=0;while(after[i]===before[i]&&i<after.length)i++;
    throw Error('Unrelated CSS changed at '+i+'\nAFTER: '+after.slice(i-100,i+220)+'\nBEFORE: '+before.slice(i-100,i+220));}
for(const f of cp.execFileSync('git',['ls-files','amd','motion','choices','settings.php','ajax.php','manage.php','index.php',
    'scss/components/_layout.scss','scss/responsive/_desktop.scss'],{cwd:root,encoding:'utf8'}).trim().split('\n'))
    assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS SM-43B shared identity, two class-only compositions, exact private-grid removals, all unrelated CSS/commands/Motion unchanged');
