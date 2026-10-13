const {test, expect} = require('@playwright/test');
const {areSafeAjaxReads} = require('./easystud-safe-ajax-reads.cjs');
const fs = require('node:fs');

// local-supervised: fictional illustrations, isolated reading key; no business commands.
test('Participant membership overflow keeps its first native disclosure scroll anchor', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 390, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (areSafeAjaxReads(methods, reads)) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const root=page.locator('#local-groupimport-easystud');
    try {
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.setViewportSize({width:1280,height:700});
        const view=root.locator('[data-easystud-view-mode="participants"]');
        if(await view.count()&&await view.getAttribute('aria-pressed')!=='true')await view.click();
        const toggle=root.locator('[data-easystud-participant-memberships="groupings"]:visible '+
            '[data-easystud-toggle-tags]:visible').first();
        await expect(toggle).toBeVisible();
        await toggle.scrollIntoViewIfNeeded();
        await page.evaluate(()=>document.fonts.ready);
        const expectedHidden=await toggle.evaluate(button=>{
            const row=button.closest('.local-groupimport-easystud-user__meta-tags');
            return Array.from(row.querySelectorAll('.local-groupimport-easystud-token'))
                .filter(node=>node!==button&&node.hidden).length;
        });
        const initialLabel=await toggle.textContent();
        // Record first, then assert: a failure retains real scope/count/scroll diagnostics.
        rows.push({width:1280,expectedHidden,initialLabel,cycles:[]});
        for(let cycle=0;cycle<2;cycle++) {
            const before=await toggle.evaluate(button=>{
                window.overflowQaFrames=[];
                let active=true,id;
                const ancestors=[];let parent=button.parentElement;
                while(parent) {if(parent.scrollHeight>parent.clientHeight+1)ancestors.push(parent);parent=parent.parentElement;}
                const sample=()=>{
                    if(!active)return;
                    window.overflowQaFrames.push({y:scrollY,
                        ancestors:ancestors.map(node=>({tag:node.tagName,classes:node.className,y:node.scrollTop})),
                        expanded:button.dataset.expanded,connected:button.isConnected});
                    id=requestAnimationFrame(sample);
                };
                window.stopOverflowQa=()=>{active=false;cancelAnimationFrame(id);};
                sample();
                return {y:scrollY,expanded:button.dataset.expanded||'0'};
            });
            await toggle.click();
            await expect(toggle).toHaveAttribute('data-expanded',cycle===0?'1':'0');
            await toggle.evaluate(async button=>{
                const card=button.closest('[data-easystud-user]');
                await Promise.all(card.getAnimations({subtree:true})
                    .filter(a=>Number.isFinite(a.effect?.getComputedTiming().iterations))
                    .map(a=>a.finished.catch(()=>{})));
                await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
            });
            const after=await page.evaluate(()=>{window.stopOverflowQa();return {y:scrollY,frames:window.overflowQaFrames};});
            rows[0].cycles.push({cycle,before,after});
            expect(Math.abs(after.y-before.y)).toBeLessThan(2);
        }
        expect(Number(initialLabel.replace('+',''))).toBe(expectedHidden);
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(()=>window.stopOverflowQa?.()).catch(()=>{});
        fs.writeFileSync(info.outputPath('participant-overflow-scroll-native.json'),
            JSON.stringify({rows,errors,blocked,businessWrites:false},null,2));
    }
});
