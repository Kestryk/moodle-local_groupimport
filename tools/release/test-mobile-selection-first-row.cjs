// Isolated first-row geometry, not Moodle/Penpot visual acceptance.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {execFileSync} = require('node:child_process');
const {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname, '../..'), output = path.resolve(process.argv[3]);
const approved = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu/artifacts/easystud/isolated');
if (!output.startsWith(approved + path.sep) || fs.existsSync(output)) throw Error('New owned external run required');
const revision = process.argv[4];
if (revision && !/^[0-9a-f]{40}$/.test(revision)) throw Error('Exact baseline SHA required');
const css = revision ? execFileSync('git', ['show', `${revision}:styles.css`], {cwd: root, maxBuffer: 8*1024*1024}).toString() :
    fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
(async () => {
    fs.mkdirSync(output, {recursive: true});
    const browser = await chromium.launch({channel: 'chrome', headless: true}), records = [];
    try {
        const page = await browser.newPage();
        for (const width of [320,390,768,1024]) {
            for (const selected of [false,true]) {
                await page.setViewportSize({width,height:900});
                await page.emulateMedia({reducedMotion:'reduce'});
                await page.setContent('<!doctype html><main class="easyedu-ui local-groupimport-easystud local-groupimport-easystud--responsive-workspace">'+
                    '<div class="local-groupimport-easystud-user'+(selected?' is-selected':'')+'">'+
                    '<label class="local-groupimport-easystud-selector"><input type="checkbox"'+(selected?' checked':'')+'>'+ 
                    '<span class="local-groupimport-easystud-selector__ui"></span></label>'+
                    '<div class="local-groupimport-easystud-user__rail"><div class="local-groupimport-easystud-user__avatar">'+
                    '<span class="userinitials">QA</span></div></div><div class="local-groupimport-easystud-user__main">'+
                    '<div class="local-groupimport-easystud-user__headline"><div class="local-groupimport-easystud-user__headline-main">'+
                    '<strong class="local-groupimport-easystud-user__name">A long existing-style participant name</strong></div>'+
                    '<span class="local-groupimport-easystud-user__email">qa@example.invalid</span>'+
                    '<button class="local-groupimport-easystud-user__detail-button">Eye</button></div>'+
                    '<div class="local-groupimport-easystud-user__meta">Roles, profile and memberships</div></div></div></main>');
                await page.addStyleTag({content:css+'\nhtml{font-size:16px}main{width:calc(100vw - 76px);margin:auto}*,*::before,*::after{box-sizing:border-box}'});
                const geometry = await page.evaluate(() => {
                    const card=document.querySelector('.local-groupimport-easystud-user'),b=card.getBoundingClientRect();
                    const hit=card.querySelector('label').getBoundingClientRect();
                    const square=card.querySelector('label span').getBoundingClientRect();
                    const title=card.querySelector('strong').getBoundingClientRect();
                    const headline=card.querySelector('.local-groupimport-easystud-user__headline').getBoundingClientRect();
                    return {delta:square.y+square.height/2-title.y-title.height/2,
                        target:{y:hit.y-b.y,w:hit.width,h:hit.height},square:{w:square.width,h:square.height},
                        title:{y:title.y-b.y,h:title.height},headline:{y:headline.y-b.y,h:headline.height},
                        padding:getComputedStyle(card).paddingTop,
                        gap:title.left-hit.right,overflow:b.x < -1 || b.right > innerWidth+1};
                });
                records.push({width,selected,geometry});
                assert.ok(Math.abs(geometry.delta)<=1, `Title/square centre ${width}/${selected}: ${geometry.delta}`);
                assert.equal(geometry.target.w,44); assert.equal(geometry.target.h,44);
                assert.ok(geometry.gap>=4); assert.equal(geometry.overflow,false);
            }
        }
        fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'passed',records},null,2));
        console.log('PASS eight responsive full-card first-row centres;44px target and title lane unchanged.');
    } catch(e) {
        fs.writeFileSync(path.join(output,'contract.json'),JSON.stringify({status:'failed',records,error:e.message},null,2));
        throw e;
    } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
