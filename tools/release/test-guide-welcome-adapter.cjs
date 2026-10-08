// Isolated adapter lifecycle contract, fake requests only, no credentials/data.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(process.argv[2]);
assert.equal(process.argv.length,4,'Usage: node test-guide-welcome-adapter.cjs <playwright> <built-adapter>');
(async()=>{
    const browser = await chromium.launch({headless:true,channel:'chrome'});
    try {
        const page = await browser.newPage();
        let requests = 0;
        let response = {acknowledged:true};
        await page.route('**/*',async route=> {
            if (new URL(route.request().url()).pathname === '/ack') {
                requests++;
                assert.equal(route.request().method(),'POST');
                const fields = new URLSearchParams(route.request().postData());
                assert.deepEqual([...fields.keys()].sort(),['courseid','generation','sesskey']);
                assert.equal(fields.get('generation'),'isolated');
                await new Promise(resolve=>setTimeout(resolve,30));
                await route.fulfill({contentType:'application/json',body:JSON.stringify(response)});
            } else await route.fulfill({body:'<div id="guide"></div><div id="foreign"></div>'});
        });
        await page.goto('http://welcome-adapter.test');
        await page.addScriptTag({content:'window.define=(...args)=>{window.Adapter=args.at(-1)();};\n'+fs.readFileSync(process.argv[3],'utf8')});
        const init = () => page.evaluate(()=>window.Adapter.init('#guide',{
            eligible:true,endpoint:'/ack',courseid:5,generation:'isolated',sesskey:'non-secret-test-only'
        }));
        const open = (id='guide') => page.evaluate(id=>document.dispatchEvent(new CustomEvent('easyedu:guide-opened',{
            detail:{root:document.getElementById(id)}
        })),id);
        await init();
        await open('foreign');
        assert.equal(requests,0,'Foreign guide and mere init do not acknowledge');
        await open(); await open();
        await page.waitForFunction(()=>document.getElementById('guide').dataset.easyeduWelcomeAcknowledged==='1');
        assert.equal(requests,1,'Pending duplicate coalesced');
        await open();
        assert.equal(requests,1,'Acknowledged generation is not rewritten');
        await page.evaluate(()=>window.Adapter.destroy('#guide'));
        await open();
        assert.equal(requests,1,'Destroyed adapter has no listener');
        response={acknowledged:false};
        await page.evaluate(()=>delete document.getElementById('guide').dataset.easyeduWelcomeAcknowledged);
        await init(); await open();
        await page.waitForTimeout(100);
        assert.equal(requests,2);
        assert.equal(await page.locator('#guide').getAttribute('data-easyedu-welcome-acknowledged'),null,'Obsolete generation not acknowledged');
        response={acknowledged:true};
        await open();
        await page.waitForFunction(()=>document.getElementById('guide').dataset.easyeduWelcomeAcknowledged==='1');
        assert.equal(requests,3,'Later genuine opening can retry');
        console.log('PASS isolated built welcome adapter: ownership, POST fields, coalescing, acknowledgement, stale generation and teardown; no Moodle writes');
    } finally { await browser.close(); }
})().catch(error=>{console.error(error.message);process.exitCode=1;});
