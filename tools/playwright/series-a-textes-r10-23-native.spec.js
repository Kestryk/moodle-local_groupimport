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

test('Series A text cards and R10-23 actual drag scrolling FR both modes', async ({page}, info) => {
    test.setTimeout(300000);
    page.setDefaultTimeout(15000);
    page.setDefaultNavigationTimeout(60000);
    await page.setViewportSize({width:1280,height:1000});
    const url = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL);
    if (url.hostname !== 'localhost' || url.port || url.searchParams.get('id') !== '5') throw Error('Local course 5 required');
    url.searchParams.set('lang','fr');
    const rows = [], errors = [], writes = [];
    const save = () => fs.writeFileSync(info.outputPath('series-a-textes-r10-23.json'), JSON.stringify({rows,errors,writes},null,2));
    page.on('pageerror', e => errors.push(e.message));
    // Read the existing course; neither drop nor guided practice may mutate it.
    await page.route('**/local/groupimport/ajax.php*', route => {
        writes.push(route.request().postData()); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        const calls = route.request().postDataJSON() || [];
        const mutations = calls.filter(c => /^local_groupimport_sm_/.test(c.methodname) && !/_(get|list)_/.test(c.methodname));
        if (mutations.length) { writes.push(mutations.map(c=>c.methodname)); return route.abort('blockedbyclient'); }
        return route.continue();
    });
    try {
        expect(setMode('legacy')).toBe('legacy');
        await page.goto(new URL('/login/index.php',url).href,{waitUntil:'domcontentloaded'});
        if (await page.locator('#username').count()) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click({noWaitAfter:true});
            await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        }
        for (const mode of ['legacy','reactive']) {
            expect(setMode(mode)).toBe(mode);
            const row={mode,stage:'loading',drags:[]}; rows.push(row); save();
            await page.goto(url.href,{waitUntil:'domcontentloaded'});
            const root=page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
            await settle(root);
            const config=await page.evaluate(async mode=>{
                const root=document.querySelector('[data-easyedu-guide-root]'), config=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);
                Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:'series-a-native-qa-'+mode});
                return {slideIds:config.slideIds,labels:config.labels};
            },mode);
            row.labels=config.labels;
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            await page.locator('[data-easyedu-guide-open]:visible').first().click();
            const guide=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
            await expect(guide).toBeVisible(); await settle(guide);
            row.cards=await guide.evaluate(guide=>[...guide.querySelectorAll('.easyedu-guide-guided-card')]
                .filter(n=>n.querySelector('[data-easyedu-guide-start-path]')).map(n=>({
                    label:n.querySelector('.easyedu-guide-guided-card__body > small')?.textContent.trim(),
                    arrow:!!n.querySelector('[data-easyedu-guide-start-path] .fa-arrow-right'),
                    play:!!n.querySelector('[data-easyedu-guide-start-path] .fa-play')})));
            expect(row.cards).toHaveLength(7);
            for (const card of row.cards) { expect(card.arrow).toBe(true); expect(card.play).toBe(false); expect(card.label).toBe('Parcours accompagné'); }
            await guide.locator('[data-easyedu-guide-nav-item="'+config.slideIds.indexOf('read-grouping-card')+'"]').click();
            const inspection=guide.locator('[data-easyedu-guide-scene="inspection"]:visible');
            await expect(inspection.locator('textarea')).toHaveValue(/entree-inconnue/);
            await expect(inspection.locator('.easyedu-guide-scene__caption')).toContainText('Exemple pratique');
            await guide.locator('[data-easyedu-guide-nav-item="'+config.slideIds.indexOf('create-structure')+'"]').click();
            row.noteBeforePath=await guide.locator('[data-easyedu-guide-slide]:visible').evaluate(slide=>{
                const note=slide.querySelector('.easyedu-guide-scene__note'), path=slide.querySelector('.easyedu-guide-guided-card');
                return !!note && !!path && !!(note.compareDocumentPosition(path)&Node.DOCUMENT_POSITION_FOLLOWING);
            });
            expect(row.noteBeforePath).toBe(true);
            await guide.locator('[data-easyedu-guide-nav-item="'+config.slideIds.indexOf('choose-right-action')+'"]').click();
            await expect(guide.locator('[data-easyedu-guide-slide]:visible')).not.toContainText('Mass Import possède son propre guide');
            await guide.locator('[data-easyedu-guide-nav-item="'+config.slideIds.indexOf('search-filter-select')+'"]').click();
            await guide.locator('[data-easyedu-guide-start-path="verify-with-filters"]').click();
            const panel=page.locator('[data-easyedu-guide-checklist]');
            await expect(panel).toBeVisible(); await settle(panel);
            await expect(panel.locator('[data-easyedu-guide-checklist-title]')).toContainText('Parcours guidé\u00a0: ');
            await expect(panel.locator('[data-easyedu-guide-checklist-subtitle]')).toContainText('étapes faites');
            row.checklistCopy=true; save();
            await page.evaluate(async()=>{
                const root=document.querySelector('[data-easyedu-guide-root]'), config=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root); Guide.init(root,{...config,firstVisit:false,welcomeOffer:false});
            });
            await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
            await settle(root);
            for (const [type,selector] of [['group','[data-easystud-structure-groups] [data-easystud-group-id]:visible'],
                ['participant','[data-easystud-user]:visible']]) {
                if (type==='participant') {
                    await root.locator('[data-easystud-layout-mode="both"]:visible').first().click(); await settle(root);
                }
                const card=root.locator(selector).first();
                await card.scrollIntoViewIfNeeded();
                const title=card.locator(type==='group'?'.local-groupimport-easystud-group__name':'.local-groupimport-easystud-user__name').first();
                const bounds=await title.boundingBox();
                if (!bounds) throw Error('Drag identity is not visible');
                await page.mouse.move(bounds.x+Math.min(35,bounds.width/2),bounds.y+bounds.height/2);
                await page.mouse.down();
                await page.mouse.move(bounds.x+45,bounds.y+bounds.height/2+12,{steps:4});
                await expect(root).toHaveClass(new RegExp('is-dragging-'+(type==='group'?'groups':'participants')));
                const geometry=await card.evaluate(card=>{
                    let scroller=null;
                    for(let node=card;node&&node!==document.body;node=node.parentElement) {
                        if(/^(auto|scroll)$/.test(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1) {scroller=node;break;}
                    }
                    scroller=scroller||document.scrollingElement;
                    const box=scroller===document.scrollingElement?{top:0,bottom:innerHeight}:scroller.getBoundingClientRect();
                    window.seriesAQAScroller=scroller;
                    return {id:scroller.id,top:box.top,bottom:box.bottom,before:scroller.scrollTop,
                        remaining:scroller.scrollHeight-scroller.clientHeight-scroller.scrollTop};
                });
                const x=Math.min(1200,bounds.x+Math.min(35,bounds.width/2)), y=Math.min(970,geometry.bottom-80);
                expect(geometry.remaining).toBeGreaterThan(100);
                await page.mouse.move(x,y,{steps:5});
                // A bounded observation window measures the actual drag, not application readiness.
                await page.waitForTimeout(180);
                const edge=await page.evaluate(()=>({scroll:window.seriesAQAScroller.scrollTop,
                    ghost:[...document.querySelectorAll('.local-groupimport-easystud-drag-preview')].map(n=>({left:parseFloat(n.style.left),top:parseFloat(n.style.top)}))}));
                expect(edge.scroll).toBeGreaterThan(geometry.before);
                expect(edge.ghost.some(g=>Math.abs(g.left-(x-24))<=2&&Math.abs(g.top-(y-18))<=2)).toBe(true);
                await page.screenshot({path:info.outputPath(mode+'-'+type+'-drag-edge.png')});
                await page.mouse.move(x,Math.max(geometry.top+150,(geometry.top+geometry.bottom)/2),{steps:3});
                await page.keyboard.press('Escape'); await page.mouse.up();
                await expect(page.locator('.local-groupimport-easystud-drag-preview')).toHaveCount(0);
                const stopped=await page.evaluate(()=>window.seriesAQAScroller.scrollTop);
                await page.waitForTimeout(220);
                expect(await page.evaluate(()=>window.seriesAQAScroller.scrollTop)).toBe(stopped);
                row.drags.push({type,...geometry,edge,stopped,ghostFollowsPointer:true}); save();
            }
            row.stage='complete'; save();
        }
        expect(writes).toEqual([]); expect(errors).toEqual([]);
    } finally { await page.keyboard.press('Escape').catch(()=>{}); await page.mouse.up().catch(()=>{}); setMode('legacy'); save(); }
});
