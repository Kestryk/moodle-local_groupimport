const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'../..'),baseline='04070b069a622a367449025e0d67c7958cc9f913';
const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const old=f=>execFileSync('git',['show',`${baseline}:${f}`],{cwd:root}).toString().replace(/\r\n/g,'\n');
const dormant='  .local-groupimport-easystud--responsive-workspace .local-groupimport-easystud-group__header > '+
 '.local-groupimport-easystud-rename:not(:has(> .local-groupimport-easystud-rename__edit:not([hidden]))) {\n    display: none;\n  }\n';
const wide='@media (min-width: 769px) and (max-width: 1024px) {\n'+
 '  .local-groupimport-easystud--responsive-workspace .local-groupimport-easystud-group__header {\n    padding-inline-start: 3.27rem;\n  }\n'+
 '  .local-groupimport-easystud--responsive-workspace .local-groupimport-easystud-group > .local-groupimport-easystud-selector {\n'+
 '    top: calc(0.6rem + (1.95rem - var(--easyedu-touch-target-min)) / 2);\n    transform: none;\n  }\n}\n';
let css=read('styles.css');for(const block of[dormant,wide]){assert.equal(css.split(block).length,2);css=css.replace(block,'');}
assert.ok(css===old('styles.css'),'All other CSS including Participant/Groupings/Motion retained');
for(const f of['templates/manage.mustache','js/loading_state_bootstrap.js','amd/src/course_manager.js',
 'amd/build/course_manager.min.js','amd/build/course_manager.min.js.map','amd/src/motion.js',
 'amd/build/motion.min.js','scss/easyedu/components/_cards.scss','templates/easyedu_navigation.mustache']){
 assert.ok(read(f)===old(f),`${f}: whole identity`);
}
console.log('PASS exactly dormant Group wrapper and wider-touch lane/anchor; whole other CSS/commands/Motion/Guide retained.');
