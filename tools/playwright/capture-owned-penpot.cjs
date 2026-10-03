// External evidence only. Connect to one explicitly owned tab; never reload/close it.
const {chromium}=require(process.argv[2]);
const fs=require('node:fs'),path=require('node:path');
const file=process.argv[3],target=path.resolve(process.argv[4]);
const approved=path.resolve(process.env.LOCALAPPDATA,'EasyEdu/artifacts/penpot');
if(!/^[0-9a-f-]{36}$/.test(file)||!target.startsWith(approved+path.sep)||
    path.extname(target)!=='.png'||fs.existsSync(target))throw Error('New external owned capture required.');
(async()=>{
    const browser=await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:15000});
    const pages=browser.contexts().flatMap(c=>c.pages()).filter(p=>p.url().startsWith('https://design.penpot.app/')&&
        p.url().includes('file-id='+file));
    if(pages.length!==1)throw Error('Expected one owned design tab.');
    fs.mkdirSync(path.dirname(target),{recursive:true});await pages[0].bringToFront();await pages[0].waitForTimeout(1800);
    await pages[0].screenshot({path:target});process.stdout.write('Owned capture saved; browser left open.\n');
})().then(()=>process.exit(0)).catch(error=>{process.stderr.write(error.message+'\n');process.exit(1);});
