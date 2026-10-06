// Source-CSS isolated Group header wrap diagnostic; no Moodle or data writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.argv[2]);
const root=path.resolve(__dirname,'../..'),output=path.resolve(process.argv[3]);
const approved=path.resolve(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/isolated');
if(!output.startsWith(approved+path.sep)||fs.existsSync(output))throw Error('New owned external run required');
const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
(async()=>{fs.mkdirSync(output,{recursive:true});const b=await chromium.launch({channel:'chrome',headless:true}),records=[];
try{const p=await b.newPage();for(const width of[320,390,768,1024]){await p.setViewportSize({width,height:900});
await p.emulateMedia({reducedMotion:'reduce'});
await p.setContent('<!doctype html><main class="easyedu-ui local-groupimport-easystud local-groupimport-easystud--responsive-workspace">'+
'<div class="local-groupimport-easystud-group local-groupimport-easystud-group--catalog">'+
'<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--group"><input type="checkbox">'+
'<span class="local-groupimport-easystud-selector__ui"></span></label>'+
'<div class="local-groupimport-easystud-group__header"><span class="local-groupimport-easystud-group__name">A long existing-style group name</span>'+
'<span class="badge bg-light text-dark">4 members</span><button class="local-groupimport-easystud-group__mail-button">Add</button>'+
'<form class="local-groupimport-easystud-rename"><input type="hidden"><button class="local-groupimport-easystud-rename__toggle">Rename</button>'+
'<div class="local-groupimport-easystud-rename__edit" hidden><input><button>Save</button><button>Cancel</button></div></form>'+
'<button class="local-groupimport-easystud-card-menu" data-easystud-group-actions-toggle="1" data-easystud-card-menu="group" hidden>More</button>'+
'</div></div></main>');
await p.addStyleTag({content:css+'\nhtml{font-size:16px}main{width:calc(100vw - 76px);margin:auto}*,*::before,*::after{box-sizing:border-box}'});
const geometry=await p.evaluate(()=>{const root=document.querySelector('.local-groupimport-easystud-group'),r=root.getBoundingClientRect();
const title=root.querySelector('.local-groupimport-easystud-group__name').getBoundingClientRect();
const square=root.querySelector('label span').getBoundingClientRect();const header=root.querySelector('.local-groupimport-easystud-group__header');
const form=root.querySelector('form'),f=form.getBoundingClientRect(),h=header.getBoundingClientRect();
return{delta:square.y+square.height/2-title.y-title.height/2,titleY:title.y-r.y,titleH:title.height,
headerY:h.y-r.y,headerH:h.height,form:{display:getComputedStyle(form).display,x:f.x-h.x,y:f.y-h.y,w:f.width,h:f.height},
wrap:getComputedStyle(header).flexWrap};});records.push({width,geometry});
assert.ok(Math.abs(geometry.delta)<=1,`Group first-line centre ${width}: ${geometry.delta}`);
const editing=await p.evaluate(()=>{const form=document.querySelector('form'),edit=form.querySelector('.local-groupimport-easystud-rename__edit');
const header=form.closest('.local-groupimport-easystud-group__header'),root=document.querySelector('main');
edit.hidden=false;header.classList.add('is-rename-editing');root.classList.add('local-groupimport-easystud--inline-editing');
const active={form:getComputedStyle(form).display,edit:getComputedStyle(edit).display,visible:edit.getBoundingClientRect().height>0};
edit.hidden=true;header.classList.remove('is-rename-editing');root.classList.remove('local-groupimport-easystud--inline-editing');
return{active,closed:getComputedStyle(form).display};});records.push({width,editing});
assert.equal(editing.active.form,'flex');assert.equal(editing.active.visible,true);assert.equal(editing.closed,'none');
}fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'passed',records},null,2));console.log('PASS four isolated Group centres and four editor open/close layout branches');
}catch(e){fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'failed',records,error:e.message},null,2));throw e;}
finally{await b.close()}})().catch(e=>{console.error(e.stack);process.exitCode=1});
