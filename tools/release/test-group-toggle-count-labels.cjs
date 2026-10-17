/* eslint-env node */
'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..');const read=f=>fs.readFileSync(path.join(root,f),'utf8').replace(/\r\n/g,'\n');
const source=read('amd/src/local/sm/index.js');const a=source.indexOf('export const countLabel ='),b=source.indexOf('\n};',a)+3;assert(a>=0&&b>a);
let count=0;for(const lang of ['fr','en']){
 const labels=JSON.parse(cp.execFileSync(process.argv[2]||'C:/xampp/php/php.exe',[path.join(__dirname,'fixtures/group-toggle-count-strings.php'),lang],{encoding:'utf8'}));
 assert(labels.template.includes('|'));
 const format=vm.runInNewContext(source.slice(a,b).replace('export ', '')+'\ncountLabel;', {Intl,document:{documentElement:{lang}}});
 for(const n of [0,1,2,23]){const result=format(labels.template,n);assert.equal(/\bmembres\b/.test(result),lang==='fr'&&n>1);
  assert.equal(/\bmembers\b/.test(result),lang==='en'&&n!==1);assert(result.includes(String(n)));assert.equal(labels.native[[0,1,2,23].indexOf(n)],result);count++;
 }
}
const controller=read('amd/src/local/cm/group_cards.js');assert(controller.includes("toggle.setAttribute('aria-label', text)"));
assert(controller.includes("countLabel(labels.groupmembersshowall || '', getGroupMemberCount(group))"));
assert(read('manage.php').includes("'groupmembersshowall' => local_groupimport_count_template('groupmembersshowall')"));
const css=read('styles/student-management.css');assert(/\.local-groupimport-easystud-group__members-toggle-label\s*\{\s*display:\s*none;/.test(css));
console.log(JSON.stringify({passed:true,phpAndJsCases:count,iconOnlyPreserved:true,runtimeAccess:false}));
