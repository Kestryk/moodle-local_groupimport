// Exact extraction boundary; controllers, other CSS and original arrow Motion stay pinned.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),kit=path.resolve(process.argv[2]),postcss=require(process.argv[3]),base='64d5bf5';
const norm=s=>s.replace(/\r\n/g,'\n'),read=f=>norm(fs.readFileSync(path.join(root,f),'utf8'));
const old=f=>norm(cp.execFileSync('git',['show',base+':'+f],{cwd:root,encoding:'utf8',maxBuffer:4000000}));
for(const f of ['scss/easyedu/components/_forms.scss','scss/easyedu/_foundation-classes.scss'])
  assert.equal(read(f),norm(fs.readFileSync(path.join(kit,f),'utf8')),f+' canonical identity');
assert.equal((read('templates/manage.mustache').match(/easyedu-filter-disclosure-row /g)||[]).length,4);
assert.equal(read('templates/manage.mustache').replace(/easyedu-filter-disclosure-row /g,''),old('templates/manage.mustache'));
const blocks={
  'scss/components/_layout.scss':'  &-advanced-filters__control {\n    align-items: center;\n    align-self: stretch;\n    display: flex;\n    justify-content: center;\n    margin-top: 0.6rem;\n    width: 100%;\n  }\n\n',
  'scss/responsive/_mobile.scss':'    &-advanced-filters__control {\n      background: transparent;\n      border: 0;\n      border-radius: 0;\n      box-shadow: none;\n      justify-self: center;\n      margin-top: 0.44rem;\n      padding: 0;\n    }\n\n'
};
for(const [f,b]of Object.entries(blocks)){assert.ok(old(f).includes(b));assert.equal(read(f),old(f).replace(b,''));}
const owned=selector=>{
  if(selector.includes('.fa'))return false; // Chevron size, timing and rotation are NEVER excluded.
  return selector.startsWith('.easyedu-ui :where(.easyedu-filter-disclosure)')||
    selector==='.easyedu-ui :where(.easyedu-filter-disclosure-row)'||
    selector==='.local-groupimport-easystud-advanced-filters__control'||
    /^(?:\.local-groupimport-easystud-advanced-filters__control )?\.local-groupimport-easystud-advanced-filters__toggle(?=[:.\s,\[]|$)/.test(selector);
};
const strip=css=>{
  const ast=postcss.parse(css);ast.walkComments(n=>n.remove());
  ast.walkRules(n=>{if(owned(n.selector))n.remove();});
  ast.walkAtRules(n=>{if(n.nodes&&!n.nodes.length)n.remove();});
  return ast.toString().replace(/\s+/g,' ').trim();
};
const after=strip(read('styles.css')),before=strip(old('styles.css'));
if(after!==before){let i=0;while(after[i]===before[i]&&i<after.length)i++;
  throw Error('Unrelated CSS changed at '+i+'\nAFTER: '+after.slice(i-100,i+220)+'\nBEFORE: '+before.slice(i-100,i+220));}
for(const f of cp.execFileSync('git',['ls-files','amd','motion','settings.php','ajax.php','manage.php','index.php',
  'classes/form/import_form.php','scss/views/_structure.scss','scss/responsive/_desktop.scss'],{cwd:root,encoding:'utf8'}).trim().split('\n'))
  assert.equal(read(f),old(f),f+' unchanged');
console.log('PASS SM-43A canonical identity; four class-only rows; equal-height/commands/Motion and all unrelated CSS preserved');
