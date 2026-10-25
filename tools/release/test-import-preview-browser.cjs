const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(path.join(process.argv[2],'playwright'));
(async()=>{
 const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});
 try{
 const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.setContent('<div id="root"><form><input name="previewpayload"><input name="previewtoken" value="token"><input data-local-groupimport-preview-search><table><tbody>'+Array.from({length:1500},(_,i)=>'<tr data-local-groupimport-preview-row><td><input type="checkbox" checked name="rowenabled['+i+']"></td>'+['identifier','groupname','groupingname'].map(f=>'<td><input type="text" name="'+f+'['+i+']" value="'+f+i+'"></td>').join('')+'</tr>').join('')+'</tbody></table><input name="previewcomplete" value="1500"></form></div>');
 await page.evaluate(()=>{window.define=(name,deps,factory)=>{const exports={};factory(exports,{init:()=>{}});window.csvModule=exports;};window.define.amd=true;});
 await page.addScriptTag({path:path.resolve(__dirname,'../../amd/build/csv_import.min.js')});
 const result=await page.evaluate(()=>{window.csvModule.init('root');const form=document.querySelector('form');const before=[...new FormData(form)].length;form.querySelector('[name="groupname[1499]"]').value='Équipe < & "';form.querySelector('[name="rowenabled[2]"]').checked=false;form.querySelector('[data-local-groupimport-preview-search]').value='identifier0';form.querySelector('[data-local-groupimport-preview-search]').dispatchEvent(new Event('input'));const hidden=form.querySelectorAll('tr[hidden]').length;form.dispatchEvent(new Event('submit',{cancelable:true,bubbles:true}));const data=new FormData(form);return {before,after:[...data].length,hidden,payload:JSON.parse(data.get('previewpayload'))};});
 assert.ok(result.before>5000);assert.equal(result.after,3);assert.ok(result.hidden>1400);assert.deepEqual(result.payload,{count:1500,edits:[{index:1499,identifier:'identifier1499',groupname:'Équipe < & "',groupingname:'groupingname1499'}],excluded:[2]});assert.deepEqual(errors,[]);console.log(JSON.stringify({passed:true,rows:1500,postedFields:result.after,filteredRows:result.hidden,pageErrors:errors.length}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
