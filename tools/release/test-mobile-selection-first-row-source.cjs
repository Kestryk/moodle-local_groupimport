const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..');
const baseline='0add69293d982f24db9fa9d9e7c2231960860b5e';
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show',`${baseline}:${f}`],{cwd:root}).toString().replace(/\r\n/g,'\n');
const selector='.local-groupimport-easystud--responsive-workspace:not(.local-groupimport-easystud--compact-users) '+
    '.local-groupimport-easystud-user > .local-groupimport-easystud-selector';
let css=read('styles.css');
for(const [width,padding]of[[1024,'0.45rem'],[768,'0.72rem']]){
    const block=`@media (max-width: ${width}px) {\n  ${selector} {\n`+
        `    top: calc(${padding} + (1.85rem - var(--easyedu-touch-target-min)) / 2);\n    transform: none;\n  }\n}\n`;
    assert.equal(css.split(block).length,2,'Exact one full-card first-row formula');css=css.replace(block,'');
}
assert.ok(css===old('styles.css'),'All other generated CSS unchanged');
for(const f of['templates/manage.mustache','amd/src/course_manager.js','amd/build/course_manager.min.js',
    'amd/build/course_manager.min.js.map','amd/src/motion.js','amd/build/motion.min.js',
    'js/loading_state_bootstrap.js','templates/easyedu_navigation.mustache']){
    assert.ok(read(f)===old(f),`${f}: complete identity`);
}
const shared=read('scss/easyedu/components/_cards.scss');
const mixin=`\n// Centre the full touch target on a measured first header row, not total card\n`+
    `// height. Both inputs come from the existing composition's padding/row size.\n`+
    `// Owns no breakpoint, title lane, checkbox paint, card height or disclosure.\n`+
    `@mixin card-selection-first-row-anchor($content-padding, $first-row-height) {\n`+
    `  @include card-selection-header-anchor(\n`+
    `    calc(#{$content-padding} + (#{$first-row-height} - var(--easyedu-touch-target-min)) / 2)\n  );\n}\n`;
assert.equal(shared.split(mixin).length,2);assert.ok(shared.replace(mixin,'')===old('scss/easyedu/components/_cards.scss'));
console.log('PASS exactly two shared first-row rules; all other CSS/markup/controllers/Motion/loading/Guide preserved.');
