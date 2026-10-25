// Capture only the owned EasyStud Penpot tab; never close or reload a design.
const {chromium} = require(process.argv[2]);
const fs = require('node:fs');
const path = require('node:path');
const target = path.resolve(process.argv[3]);
const root = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu/artifacts/penpot/member-actions-20261003');
if (path.dirname(target) !== root || path.extname(target) !== '.png' || fs.existsSync(target)) throw Error('New owned capture required.');
(async()=>{
    const browser = await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:15000});
    const pages = browser.contexts().flatMap(c=>c.pages()).filter(p=>p.url().startsWith('https://design.penpot.app/') &&
        p.url().includes('220f6449-533e-815b-8008-ad9958d032a1'));
    if(pages.length!==1)throw Error('Expected one owned product tab.');
    fs.mkdirSync(root,{recursive:true});await pages[0].bringToFront();await pages[0].waitForTimeout(1800);
    await pages[0].screenshot({path:target});process.stdout.write(`Captured ${target}\n`);
})().then(()=>process.exit(0)).catch(error=>{process.stderr.write(`${error.message}\n`);process.exit(1);});
