const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('R3 no-mode scene rows and activity spacing stay consistent',async({page},info)=>{
    test.setTimeout(180000);const rows=[],errors=[],blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang','fr');
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push('plugin write');return route.abort();
    });
    const workspace=page.locator('#local-groupimport-easystud'),modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
    try{
        await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang','fr');
        await page.evaluate(async()=>{
            const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
            const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
            root.r3OriginalConfig=config;
            Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:'r3-header-dots-qa'});
        });
        for(const width of [1280,390]){
            await page.setViewportSize({width,height:1000});
            if(!await page.locator('[data-easyedu-guide-open]:visible').count())
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();await expect(modal).toBeVisible();
            for(const id of ['read-group-card','read-grouping-card']){
                const index=await page.evaluate(id=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.slideIds.indexOf(id),id);
                await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
                const scene=modal.locator('[data-easyedu-guide-slide="'+index+'"] [data-easyedu-guide-scene]');
                await expect(scene).toBeVisible();
                const header=scene.locator('[data-guide-scene-header]');
                await expect(header).toHaveClass(/header--single/);
                await modal.evaluate(node=>Promise.all(node.getAnimations({subtree:true})
                    .filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().endTime))
                    .map(animation=>animation.finished.catch(()=>{}))));
                const geometry=await header.evaluate(header=>{
                    const rect=node=>{const r=node.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
                    return {header:rect(header),reading:rect(header.querySelector('.easyedu-guide-scene__reading')),
                        start:rect(header.querySelector('[data-guide-scene-command="start"]'))};
                });
                rows.push({width,id,geometry,dots:[]});
                if(width===1280){
                    expect(Math.abs(geometry.reading.y+geometry.reading.height/2-geometry.start.y-geometry.start.height/2)).toBeLessThan(1);
                    expect(geometry.start.x).toBeGreaterThan(geometry.reading.x+geometry.reading.width);
                }else{
                    expect(geometry.start.y).toBeGreaterThanOrEqual(geometry.reading.y+geometry.reading.height-1);
                    expect(Math.abs(geometry.start.width-geometry.reading.width)).toBeLessThan(1);
                }
                // Mobile idle intentionally hides detailed narration. Measure dots
                // in the real paused surface, not inside that hidden ancestor.
                await scene.locator('[data-guide-scene-command="start"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state','playing');
                await scene.locator('[data-guide-playback="pause"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state','paused');
                rows.at(-1).paused=true;
                const samples=['Prêt.','Ready to learn.','Vérifiez le nom reconnu et corrigez l’entrée avant de continuer.',
                    'Check the recognised name and fix the unresolved entry before continuing in the real card.'];
                const spacings=await header.evaluate((header,samples)=>{
                    const copy=header.querySelector('[data-guide-live-copy]'),dots=header.querySelector('[data-guide-activity]');
                    const original=copy.textContent,hidden=dots.hidden;dots.hidden=false;
                    try{return samples.map(text=>{
                        copy.textContent=text;const c=copy.getBoundingClientRect(),d=dots.getBoundingClientRect(),
                            points=[...dots.children].map(node=>node.getBoundingClientRect());
                        return {text,copyToDots:d.left-c.right,widths:points.map(p=>p.width),
                            gaps:[points[1].left-points[0].right,points[2].left-points[1].right],
                            rem:parseFloat(getComputedStyle(document.documentElement).fontSize),
                            whiteSpace:getComputedStyle(dots).whiteSpace,letterSpacing:getComputedStyle(dots).letterSpacing};
                    });}finally{copy.textContent=original;dots.hidden=hidden;}
                },samples);
                rows.at(-1).dots=spacings;
                for(const sample of spacings){
                    expect(Math.max(...sample.widths)-Math.min(...sample.widths)).toBeLessThanOrEqual(0.5);
                    expect(Math.abs(sample.gaps[0]-sample.gaps[1])).toBeLessThanOrEqual(0.5);
                    for(const size of sample.widths)expect(Math.abs(size-sample.rem*0.25)).toBeLessThanOrEqual(0.5);
                    for(const gap of sample.gaps)expect(Math.abs(gap-sample.rem*0.1875)).toBeLessThanOrEqual(0.5);
                    expect(sample.whiteSpace).toBe('nowrap');
                    // Chromium serializes zero letter spacing as "normal".
                    // Keep fixed dot geometry assertions as the independent oracle.
                    expect(sample.letterSpacing==='normal'||parseFloat(sample.letterSpacing)===0).toBe(true);
                    expect(Math.abs(sample.copyToDots-spacings[0].copyToDots)).toBeLessThanOrEqual(0.5);
                }
                await page.emulateMedia({reducedMotion:'reduce'});
                expect(await scene.locator('[data-guide-activity] > span').evaluateAll(nodes=>nodes.every(node=>getComputedStyle(node).animationName==='none'))).toBe(true);
                // Live media changes test CSS only; the engine captures Motion at init.
                await page.emulateMedia({reducedMotion:'no-preference'});
                await scene.locator('[data-guide-playback="pause"]').click();
                for(let phase=0;phase<14&&await header.getAttribute('data-guide-playback-state')!=='finished';phase++){
                    await page.waitForFunction(node=>node.dataset.guidePlaybackState==='finished'||
                        !node.querySelector('[data-guide-playback="next-phase"]').disabled,await header.elementHandle());
                    if(await header.getAttribute('data-guide-playback-state')==='finished')break;
                    await scene.locator('[data-guide-playback="next-phase"]').click();
                }
                await expect(header).toHaveAttribute('data-guide-playback-state','finished');
                await expect(scene.locator('[data-guide-scene-command="start"]')).toBeEnabled();
                await modal.evaluate(node=>Promise.all(node.getAnimations({subtree:true})
                    .filter(animation=>Number.isFinite(animation.effect?.getComputedTiming().endTime))
                    .map(animation=>animation.finished.catch(()=>{}))));
                const finished=await header.evaluate(node=>{
                    const r=node.querySelector('.easyedu-guide-scene__reading').getBoundingClientRect(),
                        s=node.querySelector('[data-guide-scene-command="start"]').getBoundingClientRect();
                    return {reading:{x:r.x,y:r.y,width:r.width,height:r.height},start:{x:s.x,y:s.y,width:s.width,height:s.height}};
                });
                rows.at(-1).finished=finished;
                if(width===1280)expect(Math.abs(finished.reading.y+finished.reading.height/2-finished.start.y-finished.start.height/2)).toBeLessThan(1);
                else expect(finished.start.y).toBeGreaterThanOrEqual(finished.reading.y+finished.reading.height-1);
                await scene.locator('[data-guide-scene-command="reset"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state','idle');
            }
            await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        await page.evaluate(async()=>{
            const root=document.querySelector('[data-easyedu-guide-root]');
            if(root?.r3OriginalConfig){
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,root.r3OriginalConfig);delete root.r3OriginalConfig;
            }
            localStorage.removeItem('r3-header-dots-qa');localStorage.removeItem('r3-header-dots-qa.checklist');
        }).catch(()=>{});
        fs.writeFileSync(info.outputPath('r3-header-dots-native.json'),JSON.stringify({surface:'guide-R3',niveau:1,rows,errors,blocked,
            samples:'QA text variations in actual component; no state/business confirmation'},null,2));
    }
});

// N1 approved copy: existing live controls/scenes, no membership writes.
test('Approved Guide copy navigation and contextual Add fit in Moodle', async({page}, info) => {
    test.setTimeout(240000);
    const rows=[],errors=[],blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    const url=new URL(process.env.EASYEDU_MOODLE_URL);url.searchParams.set('lang','fr');
    await page.goto(url.href,{waitUntil:'domcontentloaded'});
    if(page.url().includes('/login/')){
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u=>!u.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
    }
    await page.route('**/local/groupimport/**',route=>{
        if(route.request().method()==='GET')return route.continue();
        blocked.push('plugin write');return route.abort('blockedbyclient');
    });
    const workspace=page.locator('#local-groupimport-easystud'),modal=page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
    try{
        await expect(workspace).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(page.locator('html')).toHaveAttribute('lang','fr');
        await page.emulateMedia({reducedMotion:'no-preference'});
        for(const width of [1280,390]){
            await page.setViewportSize({width,height:1000});
            await page.evaluate(async width=>{
                const root=document.querySelector('[data-easyedu-guide-root]'),config=root.easyeduGuideConfig;
                const Guide=await new Promise(resolve=>require(['local_groupimport/easyedu_guide'],resolve));
                Guide.destroy(root);Guide.init(root,{...config,firstVisit:false,welcomeOffer:false,storageKey:'approved-copy-qa-'+width});
            },width);
            if(!await page.locator('[data-easyedu-guide-open]:visible').count())
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            await page.locator('[data-easyedu-guide-open]:visible').first().click();await expect(modal).toBeVisible();
            const nav=await modal.locator('[data-easyedu-guide-nav-item]').evaluateAll(nodes=>nodes.map(node=>{
                const copy=node.querySelector('.easyedu-guide-nav-copy > span');
                return {text:copy.textContent.trim(),fits:copy.scrollWidth<=copy.clientWidth+1,
                    chapters:node.querySelectorAll('.easyedu-guide-nav-copy > small').length};
            }));
            expect(nav.map(item=>item.text)).toEqual(['1 · Le guide','2 · Repères','3 · Structure','4 · Participant',
                '5 · Groupe','6 · Groupement','7 · Organiser','8 · Filtrer','9 · Identifiants','10 · Actions','11 · Devoir de groupe','12 · Prêt']);
            expect(nav.every(item=>item.fits)).toBe(true);
            const row={width,nav,phases:[]};rows.push(row);
            for(const id of ['read-group-card','read-grouping-card']){
                const index=await page.evaluate(id=>document.querySelector('[data-easyedu-guide-root]').easyeduGuideConfig.slideIds.indexOf(id),id);
                await modal.locator('[data-easyedu-guide-nav-item="'+index+'"]').click();
                const scene=modal.locator('[data-easyedu-guide-slide="'+index+'"] [data-easyedu-guide-scene="inspection"]');
                await expect(scene).toBeVisible();
                if(id==='read-group-card')await expect(scene.locator('[data-guide-inspection-card]')).toContainText('2 membres');
                await scene.locator('[data-guide-scene-command="start"]').click();
                await expect(scene).toHaveAttribute('data-guide-phase','orient');
                await scene.locator('[data-guide-playback="pause"]').click();
                for(const phase of ['open','enter','review','return']){
                    await scene.locator('[data-guide-playback="next-phase"]').click();
                    await expect(scene).toHaveAttribute('data-guide-phase',phase);
                    const geometry=await scene.locator('[data-guide-live-copy]').evaluate(copy=>{
                        const range=document.createRange();range.selectNodeContents(copy);
                        const lines=[...range.getClientRects()].filter(rect=>rect.width>0&&rect.height>0);
                        const bounds=node=>{const rect=node.getBoundingClientRect();return {width:rect.width,height:rect.height,x:rect.x,y:rect.y};};
                        return {text:copy.textContent,lines:new Set(lines.map(rect=>Math.round(rect.top*2)/2)).size,
                            clientWidth:copy.clientWidth,scrollWidth:copy.scrollWidth,font:getComputedStyle(copy).font,
                            header:bounds(copy.closest('[data-guide-scene-header]')),
                            reading:bounds(copy.closest('.easyedu-guide-scene__reading')),
                            content:bounds(copy.parentElement)};
                    });
                    row.phases.push({id,phase,...geometry});
                }
            }
            await modal.locator('[data-easyedu-guide-close]').click();await expect(modal).toBeHidden();
            const card=workspace.locator('[data-easystud-participant-list] [data-easystud-user]:visible').first();
            const checkbox=card.locator('[data-easystud-selector-input]');
            if(!await checkbox.isChecked())await card.locator('.local-groupimport-easystud-selector').click();
            const action=workspace.locator('[data-easystud-move-selected-participants]:visible, '+
                '[data-easystud-mobile-action-trigger="[data-easystud-move-selected-participants]"]:visible').first();
            await expect(action).toHaveText('Ajouter à un groupe');await action.click();
            const destination=workspace.locator('[data-easystud-move-modal][data-easystud-move-context="participant"]');
            await expect(destination).toBeVisible();
            await expect(destination.locator('.easyedu-modal-title')).toHaveText('Ajouter à un groupe');
            await expect(destination.locator('[data-easystud-confirm-move]')).toHaveText('Ajouter');
            await destination.locator('.easyedu-dialog-actions [data-easystud-close-move-modal]').click();
            await expect(destination).toBeHidden();row.nativeAddOpenCancel=true;
        }
        for(const row of rows)for(const geometry of row.phases){
            expect(geometry.lines).toBeLessThanOrEqual(2);
            expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth+1);
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    }finally{
        fs.writeFileSync(info.outputPath('approved-guide-copy-native.json'),JSON.stringify({surface:'guide-copy',niveau:1,rows,errors,blocked,businessWrites:false},null,2));
    }
});

// local-supervised: actual Moodle Guide, fictional scenes, isolated progress key.
test('Localized Guide header labels fit their own padded controls in Moodle', async ({page}, info) => {
    test.setTimeout(300000);
    const rows = [], errors = [], blocked = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
    }
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort();
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state', 'core_message_get_unsent_message']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort();
    });
    await page.emulateMedia({reducedMotion: 'no-preference'});
    const qaKey = 'guide-scene-header-label-containment-native-qa';
    try {
        for (const language of ['en', 'fr']) {
            const url = new URL(process.env.EASYEDU_MOODLE_URL); url.searchParams.set('lang', language);
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', new RegExp('^' + language));
            await page.evaluate(async key => {
                const root = document.querySelector('[data-easyedu-guide-root]'), config = root.easyeduGuideConfig;
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                root.headerQaOriginal = config; Guide.destroy(root);
                Guide.init(root, {...config, firstVisit: false, welcomeOffer: false, storageKey: key});
            }, qaKey);
            for (const width of [1280, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                if (!await page.locator('[data-easyedu-guide-open]:visible').count()) await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                const modal = page.locator('.easyedu-guide--discovery [data-easyedu-guide-modal]');
                await expect(modal).toBeVisible();
                const scene = modal.locator('[data-easyedu-guide-scene="membership"]');
                const index = await scene.evaluate(n => n.closest('[data-easyedu-guide-slide]').dataset.easyeduGuideSlide);
                await modal.locator(`[data-easyedu-guide-nav-item="${index}"]`).click();
                const header = scene.locator('[data-guide-scene-header]'); await expect(header).toBeVisible();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'idle');
                await expect(header.locator('[data-guide-playback="pause"]')).toBeHidden();
                await expect(scene.locator('[data-guide-memberships]')).toHaveAttribute('data-guide-membership-preview', '');
                await header.locator('[data-guide-scene-command="move"]').click();
                await expect(header.locator('[data-guide-scene-command="move"]')).toHaveAttribute('aria-pressed', 'true');
                await expect(scene.locator('[data-guide-membership-origin]')).toHaveClass(/is-removed/);
                const geometry = await header.evaluate(n => {
                    const r = n.getBoundingClientRect();
                    const visible = [...n.querySelectorAll('button, [data-guide-live-copy]')].filter(t => t.getClientRects().length);
                    const paint = visible.map(t => {
                        const range = document.createRange(); range.selectNodeContents(t);
                        const b = range.getBoundingClientRect(), own = t.getBoundingClientRect(), css = getComputedStyle(t);
                        const inset = t.tagName === 'BUTTON' ? {
                            left: parseFloat(css.paddingLeft) + parseFloat(css.borderLeftWidth),
                            right: parseFloat(css.paddingRight) + parseFloat(css.borderRightWidth)
                        } : {left: 0, right: 0};
                        return {text: t.textContent.trim(),
                            fitsOwnLane: b.left >= own.left + inset.left - 1 && b.right <= own.right - inset.right + 1 &&
                                b.top >= own.top - 1 && b.bottom <= own.bottom + 1,
                            fitsHeader: b.left >= r.left - 1 && b.right <= r.right + 1 && b.top >= r.top - 1 && b.bottom <= r.bottom + 1,
                            scrollOverflow: t.scrollWidth > t.clientWidth + 1};
                    });
                    return {headerInlineSize: r.width, paint,
                        overflow: paint.filter(t => !t.fitsOwnLane || !t.fitsHeader || t.scrollOverflow).map(t => t.text),
                        height: n.querySelector('[data-guide-scene-command="start"]').getBoundingClientRect().height};
                });
                rows.push({language, viewportWidth: width, ...geometry});
                expect(geometry.overflow).toEqual([]); expect(geometry.height).toBeCloseTo(30.4, 1);
                await header.screenshot({path: info.outputPath(`${language}-${width}-ready.png`)});
                await header.locator('[data-guide-scene-command="start"]').click();
                await header.locator('[data-guide-playback="pause"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'paused');
                await expect(header.locator('[data-guide-phase-caption]')).toContainText('1/4');
                await expect(header.locator('[data-guide-scene-command="start"]')).toBeDisabled();
                await header.screenshot({path: info.outputPath(`${language}-${width}-paused.png`)});
                await scene.locator('[data-guide-scene-command="reset"]').click();
                await expect(header).toHaveAttribute('data-guide-playback-state', 'idle');
                await expect(header.locator('[data-guide-playback="pause"]')).toBeHidden();
                await page.keyboard.press('Escape'); await expect(modal).toBeHidden();
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        await page.evaluate(async key => {
            const root = document.querySelector('[data-easyedu-guide-root]');
            if (root?.headerQaOriginal) {
                const Guide = await new Promise(resolve => require(['local_groupimport/easyedu_guide'], resolve));
                Guide.destroy(root); Guide.init(root, root.headerQaOriginal); delete root.headerQaOriginal;
            }
            localStorage.removeItem(key);
            localStorage.removeItem(key + '.checklist');
        }, qaKey).catch(() => {});
        fs.writeFileSync(info.outputPath('scene-header-label-containment-native.json'), JSON.stringify({rows, errors, blocked, humanAccepted: false}, null, 2));
    }
});
