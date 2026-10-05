// SM-48 isolated source CSS geometry. No Moodle/credentials/Penpot acceptance.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process'), {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname,'../..'), output = path.resolve(process.argv[3]);
const approved = path.resolve(process.env.LOCALAPPDATA,'EasyEdu/artifacts/easystud/isolated');
if (!output.startsWith(approved+path.sep) || fs.existsSync(output)) throw Error('New owned external run required.');
const revision = process.argv[4];
if (revision && !/^[0-9a-f]{40}$/.test(revision)) throw Error('Predecessor must be an exact SHA.');
const css = revision ? execFileSync('git',['show',`${revision}:styles.css`],{cwd:root,maxBuffer:8*1024*1024}).toString() :
    fs.readFileSync(path.join(root,'styles.css'),'utf8');
(async () => {
    fs.mkdirSync(output,{recursive:true});
    const browser = await chromium.launch({channel:'chrome',headless:true}), records=[];
    try {
        const page = await browser.newPage();
        for (const width of [1600,1100,1025]) {
            for (const focus of [false,true]) {
                await page.setViewportSize({width,height:900});
                await page.emulateMedia({reducedMotion:'reduce'});
                await page.setContent('<main class="local-groupimport-easystud local-groupimport-easystud--compact-users' +
                    (focus ? ' local-groupimport-easystud--participant-focus' : '') + '">' +
                    '<div class="local-groupimport-easystud-user"><label class="local-groupimport-easystud-selector">' +
                    '<input type="checkbox"><span class="local-groupimport-easystud-selector__ui"></span></label>' +
                    '<div class="local-groupimport-easystud-user__rail"><div class="local-groupimport-easystud-user__avatar">' +
                    '<span class="userinitials">QA</span></div></div><div class="local-groupimport-easystud-user__main">' +
                    '<div class="local-groupimport-easystud-user__headline"><div class="local-groupimport-easystud-user__headline-main">' +
                    '<strong class="local-groupimport-easystud-user__name">A long participant name</strong></div>' +
                    '<span class="local-groupimport-easystud-user__email">qa@example.invalid</span>' +
                    '<button class="local-groupimport-easystud-user__detail-button">Eye</button></div>' +
                    '<div class="local-groupimport-easystud-user__meta">Roles and membership details</div></div></div></main>');
                await page.addStyleTag({content:css+'\nmain{width:480px;margin:auto}*,*::before,*::after{box-sizing:border-box}'});
                const result = await page.evaluate(() => {
                    const root=document.querySelector('main'),card=root.querySelector('.local-groupimport-easystud-user');
                    const measure=()=>{const r=card.getBoundingClientRect();
                        const target=card.querySelector('label').getBoundingClientRect(),title=card.querySelector('strong').getBoundingClientRect();
                        return {top:target.top-r.top,hitWidth:target.width,hitHeight:target.height,
                            titleGap:title.left-target.right};};
                    const before=measure();
                    root.classList.add('local-groupimport-easystud--single-participant-selected');
                    card.classList.add('is-selected','is-density-expanded');
                    const after=measure();
                    return {before,after};
                });
                records.push({width,focus,result});
                assert.ok(Math.abs(result.before.top-result.after.top)<=1,
                    `${width}/${focus}: selection target moves with expanded content`);
                for (const state of [result.before,result.after]) {
                    assert.ok(state.hitWidth>=32 && state.hitHeight>=32);
                    assert.ok(state.titleGap>=4,'Title must clear the complete selection hit target');
                }
            }
        }
        fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'passed',records},null,2));
        console.log('PASS: six desktop selection-header geometries remain anchored and clear the title.');
    } catch(error) {
        fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'failed',records,error:error.message},null,2));
        throw error;
    } finally { await browser.close(); }
})().catch(error=>{console.error(error.stack);process.exitCode=1;});
