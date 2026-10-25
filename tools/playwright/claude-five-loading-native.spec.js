const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const {execFileSync} = require('node:child_process');
const setMode = mode => execFileSync(process.env.EASYEDU_PHP_EXECUTABLE, ['-r',
    "define('CLI_SCRIPT',true); require $argv[1].'/config.php'; " +
    "set_config('renderingmode',$argv[2],'local_groupimport'); echo get_config('local_groupimport','renderingmode');",
    process.env.EASYEDU_MOODLE_ROOT, mode], {encoding:'utf8',timeout:30000}).trim();
const settle = locator => locator.evaluate(async node => {
    await document.fonts.ready;
    await Promise.all(node.getAnimations({subtree:true})
        .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));
});

test('Claude five commits FR EN modes frame specimens counts and Move', async ({page}, info) => {
    test.setTimeout(360000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    await page.setViewportSize({width:1280,height:1000});
    const url = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);
    if (url.hostname !== 'localhost' || url.port || url.searchParams.get('id') === '5') throw Error('Disposable local course required');
    const rows = [], errors = [];
    let releaseState = () => {};
    page.on('pageerror', error => errors.push(error.message));
    const save = () => fs.writeFileSync(info.outputPath('claude-five.json'), JSON.stringify({rows,errors},null,2));
    try {
        expect(setMode('legacy')).toBe('legacy');
        await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if (await page.locator('#username').count()) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        }
        for (const lang of ['fr','en']) for (const mode of ['legacy','reactive']) {
            expect(setMode(mode)).toBe(mode);
            const row={lang,mode,stage:'loading'}; rows.push(row); save();
            const stateGate = new Promise(resolve => { releaseState = resolve; });
            const stateRoute = async route => {
                let calls;
                try { calls=route.request().postDataJSON(); } catch { calls=[]; }
                if (Array.isArray(calls) && calls.some(c=>c.methodname==='local_groupimport_get_state')) {
                    row.stateResponseHeld=true; save();
                    const response=await route.fetch();
                    await stateGate;
                    await route.fulfill({response});
                } else await route.continue();
            };
            await page.route('**/lib/ajax/service.php*',stateRoute);
            url.searchParams.set('lang',lang);
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            const root=page.locator('#local-groupimport-easystud');
            await expect(page.locator('html')).toHaveAttribute('lang',lang);
            if(mode==='reactive') {
                await expect(root).toHaveAttribute('data-easyedu-loading-frame','1',{timeout:60000});
                await expect(root.locator('[data-easystud-real-content]')).toBeVisible();
                await expect(root.locator('[data-easystud-participant-list] [data-easystud-sm-loading]').first()).toBeVisible();
                await settle(root);
                row.frame=await root.evaluate(n=>({state:n.getAttribute('data-easystud-loading-state'),
                    busy:n.getAttribute('aria-busy'),blocked:n.querySelector('[data-easystud-real-content]').inert,
                    skeletons:n.querySelectorAll('[data-easystud-participant-list] [data-easystud-sm-loading]').length,
                    cards:n.querySelectorAll('[data-easystud-user]').length}));
                save();
                expect(row.stateResponseHeld).toBe(true);
                expect(row.frame.state).toBe('loading'); expect(row.frame.busy).toBe('true');
                expect(row.frame.blocked).toBe(true); expect(row.frame.skeletons).toBeGreaterThan(0);
                expect(row.frame.cards).toBe(0);
                await page.screenshot({path:info.outputPath(lang+'-reactive-frame.png')});
            }
            releaseState();
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await expect(root).toHaveAttribute('aria-busy','false');
            await expect(root.locator('[data-easystud-user]:visible').first()).toBeVisible();
            expect(await root.locator('[data-easystud-real-content]').evaluate(n=>n.inert)).toBe(false);
            await expect(root.locator('[data-easystud-sm-loading]')).toHaveCount(0);
            if(mode==='legacy') expect(await root.getAttribute('data-easyedu-loading-frame')).toBeNull();
            await page.unroute('**/lib/ajax/service.php*',stateRoute);
            await settle(root);
            row.stage='ready'; save();

            row.specimens=await root.evaluate(async (root,lang)=>{
                const api=await new Promise(resolve=>require(['local_groupimport/local/sm/specimen'],resolve));
                const probe='[data-easystud-user],[data-easystud-group-id]';
                const before=root.querySelectorAll(probe).length;
                const cards=await Promise.all([
                    api.renderParticipantSpecimen(root,{fullname:'Alex Example',email:'alex@example.invalid',
                        roles:[lang==='fr'?'Étudiant':'Student'],groups:['QA Group'],groupings:['QA Grouping']}),
                    api.renderGroupSpecimen(root,{name:'QA Group',members:[],groupings:['QA Grouping']}),
                    api.renderGroupSpecimen(root,{name:'QA Group',members:['Alex Example'],groupings:['QA Grouping']},
                        {treecard:true,withingrouping:true})]);
                const results=cards.map(card=>{
                    const detached=!card.isConnected;
                    const forbidden=[card,...card.querySelectorAll('*')].flatMap(n=>[...n.attributes]
                        .filter(a=>a.name.startsWith('data-easystud-') || ['id','for','name','draggable','tabindex',
                            'data-user-id','data-selectable-id','data-group-ids','data-grouping-ids'].includes(a.name))
                        .map(a=>a.name));
                    root.append(card);
                    return {detached,forbidden,inert:card.inert,hidden:card.getAttribute('aria-hidden'),
                        type:card.getAttribute('data-specimen-card'),text:card.textContent};
                });
                const after=root.querySelectorAll(probe).length;
                cards.forEach(card=>card.remove());
                return {before,after,results};
            },lang);
            expect(row.specimens.after).toBe(row.specimens.before);
            for (const card of row.specimens.results) {
                expect(card.detached).toBe(true); expect(card.forbidden).toEqual([]);
                expect(card.inert).toBe(true); expect(card.hidden).toBe('true');
            }
            expect(row.specimens.results[0].text).toContain('Alex Example'); save();
            await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
            await settle(root);
            const grouping=root.locator('[data-easystud-tree] [data-easystud-grouping-id]').filter({
                has:page.locator('.local-groupimport-easystud-grouping__name').filter({hasText:new RegExp('^QA '+lang+'-'+mode+'$')})}).first();
            await expect(grouping.locator('.badge').first()).toHaveText(lang==='fr'?'1 groupe':'1 group');
            const toggle=grouping.locator('[data-easystud-collapse-toggle]').first();
            if(await toggle.getAttribute('aria-expanded')==='false') await toggle.click();
            await settle(grouping);
            await expect(grouping.locator('[data-easystud-group-id] .badge').first()).toHaveText(lang==='fr'?'0 membre':'0 members');
            row.counts=true; save();
            const alpha=root.locator('[data-easystud-structure-groups] [data-easystud-group-id]').filter({hasText:'Alpha group'}).first();
            await alpha.locator('[data-easystud-selector-input]').first().evaluate(n=>n.click());
            const opener=root.locator('[data-easystud-move-selected-groups]:visible').first(); await opener.click();
            const modal=root.locator('[data-easystud-move-modal]'); await expect(modal).toBeVisible(); await settle(modal);
            expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await modal.evaluate(n=>[...n.querySelectorAll('button,a[href],input,select,textarea,[tabindex]')]
                .filter(e=>!e.disabled&&e.tabIndex>=0&&e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden').at(-1).focus());
            await page.keyboard.press('Tab'); expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Shift+Tab'); expect(await modal.evaluate(n=>n.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Escape'); await expect(modal).toBeHidden(); await settle(root); await expect(opener).toBeFocused();
            row.focus=true; save();
            const mass=new URL(url); mass.pathname='/local/groupimport/index.php';
            await page.goto(mass.href,{waitUntil:'domcontentloaded'});
            const massRoot=page.locator('#local-groupimport-import');
            await expect(massRoot).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            expect(await massRoot.getAttribute('data-easyedu-loading-frame')).toBeNull();
            await expect(massRoot.locator('[data-easystud-real-content]')).toBeVisible();
            await expect(massRoot.locator('[id^="filepicker-wrapper-"]')).toBeVisible();
            row.massReady=true; row.stage='complete'; save();
        }
        expect(errors).toEqual([]);
    } finally { releaseState(); setMode('legacy'); save(); }
});
