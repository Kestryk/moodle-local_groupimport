const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('K16-54 pilot then bilingual selection disclosure', async({page}, info) => {
    test.setTimeout(850000);
    const base = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);
    if (base.origin !== 'http://localhost' || base.searchParams.get('id') === '5') throw Error('Isolated fixture required');
    const runtime = 'C:/dev/Moodle 51/MoodleWindowsInstaller-latest-501/server/moodle/local/groupimport';
    const modulePath = 'amd/build/local/cm/selection_controls.min.js';
    const original = fs.readFileSync(path.join(runtime,modulePath),'utf8').split(/\r?\n/)[0];
    const candidate = fs.readFileSync(path.resolve(__dirname,'../..',modulePath),'utf8').split(/\r?\n/)[0];
    const report = {pilot:null, rows:[], errors:[], blockedWrites:[], replacements:0, candidateTransport:'Browser response override only; runtime files unchanged'};
    const save = () => fs.writeFileSync(info.outputPath('k16-54-results.json'),JSON.stringify(report,null,2));
    page.on('pageerror',e => {report.errors.push(e.message);save();});
    page.on('console',m => {if(m.type()==='error') {report.errors.push(m.text());save();}});
    await page.route('**/lib/requirejs.php/**',async route => {
        const response = await route.fetch();
        const body = await response.text();
        if(body.includes(original)) {
            report.replacements++;save();
            await route.fulfill({response,body:body.replace(original,candidate)});
        } else await route.fulfill({response});
    });
    await page.route('**/local/groupimport/ajax.php*',r => {report.blockedWrites.push(r.request().url());return r.abort();});
    await page.route('**/lib/ajax/service.php*',r => {
        const writes=(r.request().postDataJSON()||[]).filter(c=>c.methodname.startsWith('local_groupimport_')&&!/_(get|list)_/.test(c.methodname));
        if(writes.length) {report.blockedWrites.push(writes);return r.abort();}return r.continue();
    });
    await page.goto(new URL('/login/index.php',base).href,{waitUntil:'domcontentloaded'});
    if(await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'domcontentloaded'});
    }
    const root=page.locator('#local-groupimport-easystud');
    const settle=async()=>{
        await root.evaluate(async n=>{await document.fonts.ready;await Promise.all(n.getAnimations({subtree:true})
            .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations)).map(a=>a.finished.catch(()=>{})));});
        await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    };
    const open=async(lang,width)=>{
        await page.setViewportSize({width,height:1100});base.searchParams.set('lang',lang);
        await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:150000});
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:150000});
        if(width===390) await root.locator('[data-easystud-mobile-view="groups"]').click();
        else await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
        await settle();expect(report.replacements).toBeGreaterThan(0);
        await page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/local/cm/group_card_controls',
            'local_groupimport/local/cm/state'],(controls,state)=>{
            window.k54Calls=[];const native=controls.setGroupMembersExpanded;
            controls.setGroupMembersExpanded=(r,g,expanded)=>{
                const before=g.querySelector('[data-easystud-group-members-toggle]').getAttribute('aria-expanded');
                const selected=state.getOnDemandModel(r).selectedMembers.size;
                const changed=native(r,g,expanded);
                window.k54Calls.push({before,selected,changed,expanded});return changed;
            };resolve();
        })));
    };
    const sample=async(count)=>{
        const card=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]').filter({has:page.locator(
            '.local-groupimport-easystud-group__name',{hasText:new RegExp('^QA K54 '+count+'$')})}).first();
        await expect(card).toBeVisible();await card.scrollIntoViewIfNeeded();await settle();
        const toggle=card.locator('[data-easystud-group-members-toggle]');
        if(await toggle.getAttribute('aria-expanded')==='true') {await toggle.click();await settle();}
        await expect(toggle).toHaveAttribute('aria-expanded','false');
        const button=card.locator('[data-easystud-group-select-all]');
        if(count===2) {
            await expect(button).toBeHidden();await toggle.click();await settle();
            await expect(toggle).toHaveAttribute('aria-expanded','true');
            await toggle.click();await settle();
            await expect(toggle).toHaveAttribute('aria-expanded','false');
            return {members:2,selectAllVisible:false,chevronRoundTrip:true};
        }
        const footer=card.locator(':scope > [data-easystud-long-list-footer]');
        if(count>8) await expect(footer).toBeHidden();
        await page.evaluate(()=>{window.k54Calls=[];});
        await button.click();await expect(toggle).toHaveAttribute('aria-expanded','true');await settle();
        const state=()=>page.evaluate(()=>new Promise(resolve=>require(['local_groupimport/local/cm/state'],s=>{
            const r=document.querySelector('#local-groupimport-easystud');resolve(s.getOnDemandModel(r).selectedMembers.size);
        })));
        expect(await state()).toBe(count);
        const calls=await page.evaluate(()=>window.k54Calls);expect(calls).toHaveLength(1);
        expect(calls[0]).toEqual({before:'false',selected:0,changed:true,expanded:true});
        if(count>8) await expect(footer).toBeVisible();
        await button.click();await settle();expect(await state()).toBe(0);
        await expect(toggle).toHaveAttribute('aria-expanded','true');
        expect(await page.evaluate(()=>window.k54Calls.length)).toBe(1);
        // Already open: selection stays open and creates no additional disclosure animation.
        await button.click();await settle();expect(await state()).toBe(count);
        const again=await page.evaluate(()=>window.k54Calls.at(-1));
        expect(again).toEqual({before:'true',selected:0,changed:false,expanded:true});
        await button.click();await settle();expect(await state()).toBe(0);
        await expect(toggle).toHaveAttribute('aria-expanded','true');
        await toggle.click();await settle();await expect(toggle).toHaveAttribute('aria-expanded','false');
        if(count>8) await expect(footer).toBeHidden();
        return {members:count,selected:count,deselected:0,expandBeforeSelection:true,
            sameChevronHelper:true,alreadyOpenUnchanged:true,deselectKeepsOpen:true,moreOnlyExpanded:count>8?true:null};
    };
    try {
        await open('fr',1600);report.pilot=await sample(8);save();
        for(const lang of ['fr','en']) for(const width of [1600,390]) {
            await open(lang,width);
            for(const count of [2,8,12]) {report.rows.push({lang,width,...await sample(count)});save();}
        }
        expect(report.errors).toEqual([]);expect(report.blockedWrites).toEqual([]);
        expect(report.rows).toHaveLength(12);
    } finally {save();}
});
