const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Resolve the canonical compiled fixture before credentials/lease discovery.
const cssPath = process.env.EASYEDU_NARROW_PARTICIPANT_CANDIDATE_CSS;
if (!cssPath) throw new Error('Set EASYEDU_NARROW_PARTICIPANT_CANDIDATE_CSS to the compiled canonical fixture.');
const css = fs.readFileSync(cssPath,'utf8');

// Read-only baseline audit: do not inject the rejected candidate or mutate data.
test('Audit narrow participant control lanes without changing styles', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:320,height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u=>!u.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const card = root.locator('[data-easystud-user="1"]:visible').first();
    const reports = [];
    for (const width of [320,390]) {
        await page.setViewportSize({width,height:1100});
        await page.evaluate(()=>document.fonts.ready);
        await card.scrollIntoViewIfNeeded();
        const report = await card.evaluate(n=>{
            const measure = e=>{
                if (!e) return null;
                const r=e.getBoundingClientRect(), s=getComputedStyle(e);
                return {x:r.x,y:r.y,w:r.width,h:r.height,display:s.display,
                    paddingLeft:s.paddingLeft,paddingRight:s.paddingRight,gap:s.gap,
                    gridColumns:s.gridTemplateColumns,maxWidth:s.maxWidth};
            };
            const pick = suffix=>measure(n.querySelector('.local-groupimport-easystud-'+suffix));
            return {card:measure(n),headline:pick('user__headline'),identity:pick('user__headline-main'),
                name:pick('user__name'),badge:pick('user__primary-badge'),email:pick('user__email'),
                eye:pick('user__detail-button'),selection:pick('selector'),menu:pick('card-menu'),
                overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
        });
        reports.push({width,...report});
        fs.writeFileSync(testInfo.outputPath('participant-control-lanes.json'),JSON.stringify(reports,null,2));
        await page.screenshot({path:testInfo.outputPath('participant-control-lanes-'+width+'.png')});
        expect(report.overflow).toBeLessThanOrEqual(2);
        expect(report.eye.w).toBeGreaterThan(0);
        expect(report.selection.w).toBeGreaterThan(0);
    }
});

test('Compare narrow participant identity without changing served styles', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:320,height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u=>!u.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const card=root.locator('[data-easystud-user="1"]:visible').first();
    const measure=()=>card.evaluate(n=>{
        const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
        return {card:box(n),name:box(n.querySelector('.local-groupimport-easystud-user__name')),
            headline:box(n.querySelector('.local-groupimport-easystud-user__headline')),
            identity:box(n.querySelector('.local-groupimport-easystud-user__headline-main')),
            email:box(n.querySelector('.local-groupimport-easystud-user__email')),
            eye:box(n.querySelector('.local-groupimport-easystud-user__detail-button')),
            text:n.textContent,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    const reports=[];
    for(const width of [320,390,768,1600]) {
        await page.setViewportSize({width,height:1100});
        await page.evaluate(()=>document.fonts.ready);
        await card.scrollIntoViewIfNeeded();
        const before=await measure();
        const style=await page.addStyleTag({content:css});
        try {
            const after=await measure();
            const sameContent=after.text===before.text;
            delete before.text;delete after.text;
            reports.push({width,before,after,sameContent});
            fs.writeFileSync(testInfo.outputPath('narrow-identity.json'),JSON.stringify(reports,null,2));
            await page.screenshot({path:testInfo.outputPath('narrow-identity-'+width+'.png')});
            expect(sameContent).toBe(true);
            expect(after.overflow).toBeLessThanOrEqual(2);
            expect(Math.abs(after.eye.x-before.eye.x)).toBeLessThan(1);
            if(width===320) {
                expect(after.name.w).toBeGreaterThan(50);
                expect(after.email.w).toBeGreaterThan(80);
                expect(after.card.h-before.card.h).toBeLessThanOrEqual(10);
                for(const e of [after.name,after.email,after.eye]) {
                    expect(e.x).toBeGreaterThanOrEqual(after.card.x-1);
                    expect(e.x+e.w).toBeLessThanOrEqual(after.card.x+after.card.w+1);
                    expect(e.y+e.h).toBeLessThanOrEqual(after.card.y+after.card.h+1);
                }
            } else {
                // Moodle may scroll-anchor between samples. Compare local geometry,
                // not the viewport origin of the entire card.
                const local = sample=>Object.fromEntries(Object.entries(sample).map(([key,value])=>{
                    if (key==='overflow') return [key,value];
                    if (key==='card') return [key,{w:value.w,h:value.h}];
                    return [key,{...value,x:value.x-sample.card.x,y:value.y-sample.card.y}];
                }));
                expect(local(after)).toEqual(local(before));
            }
        } finally { await style.evaluate(n=>n.remove()); }
    }
});

test('Compare readable narrow density without changing served styles', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:320,height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u=>!u.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const card = root.locator('[data-easystud-user="1"]:visible').first();
    const measure = ()=>card.evaluate(n=>{
        const box = e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};};
        const pick = suffix=>box(n.querySelector('.local-groupimport-easystud-'+suffix));
        return {card:box(n),name:pick('user__name'),badge:pick('user__primary-badge'),
            email:pick('user__email'),eye:pick('user__detail-button'),
            selection:pick('selector'),menu:pick('card-menu'),text:n.textContent,
            overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    const reports = [];
    for (const width of [320,390,768,1600]) {
        await page.setViewportSize({width,height:1100});
        await page.evaluate(()=>document.fonts.ready);
        await card.scrollIntoViewIfNeeded();
        const before = await measure();
        const style = await page.addStyleTag({content:css});
        try {
            // Existing density Motion is preserved; sample only its settled endpoint.
            await page.waitForTimeout(900);
            const after = await measure();
            const sameContent = after.text===before.text;
            delete before.text; delete after.text;
            reports.push({width,before,after,sameContent});
            fs.writeFileSync(testInfo.outputPath('readable-narrow-density.json'),JSON.stringify(reports,null,2));
            await page.screenshot({path:testInfo.outputPath('readable-narrow-density-'+width+'.png')});
            expect(sameContent).toBe(true);
            expect(after.overflow).toBeLessThanOrEqual(2);
            if (width===320) {
                expect(after.name.w).toBeGreaterThan(50);
                expect(after.email.w).toBeGreaterThan(80);
                // Three text lines require a taller endpoint; duration/easing is unchanged.
                expect(after.card.h-before.card.h).toBeLessThanOrEqual(50);
                expect(Math.abs(after.eye.x-before.eye.x)).toBeLessThan(1);
                const centre = item=>item.y+item.h/2;
                expect(Math.abs(centre(after.name)-centre(after.eye))).toBeLessThan(1);
                expect(Math.abs(centre(after.selection)-centre(after.eye))).toBeLessThan(1);
                for (const item of [after.name,after.badge,after.email,after.eye,after.selection,after.menu]) {
                    expect(item.x).toBeGreaterThanOrEqual(after.card.x-1);
                    expect(item.x+item.w).toBeLessThanOrEqual(after.card.x+after.card.w+1);
                    expect(item.y+item.h).toBeLessThanOrEqual(after.card.y+after.card.h+1);
                }
                const selector = card.locator(':scope > .local-groupimport-easystud-selector');
                const transition = ()=>card.evaluate(n=>{
                    const s=getComputedStyle(n);
                    return {property:s.transitionProperty,duration:s.transitionDuration,easing:s.transitionTimingFunction};
                });
                const compactTransition = await transition();
                await selector.click();
                await expect(card).toHaveClass(/is-selected/);
                await expect.poll(()=>card.evaluate(n=>n.getAnimations({subtree:true})
                    .filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).length)).toBe(0);
                const selected = await measure();
                delete selected.text;
                const detailed = await root.evaluate(n=>n.classList.contains('local-groupimport-easystud--single-participant-selected'));
                reports.push({width,selected,detailed,transition:await transition()});
                fs.writeFileSync(testInfo.outputPath('readable-narrow-density.json'),JSON.stringify(reports,null,2));
                // Keep the selected card above the real sticky action sheet.
                // Do not hide that product control just to obtain a clean capture.
                await card.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
                await page.screenshot({path:testInfo.outputPath('readable-narrow-density-320-selected.png')});
                if (!detailed) {
                    expect(selected.name.w).toBeGreaterThan(50);
                    expect(selected.email.w).toBeGreaterThan(80);
                    expect(selected.card.h).toBeCloseTo(after.card.h,0);
                }
                expect(await transition()).toEqual(compactTransition);
                await selector.click();
                await expect(card).not.toHaveClass(/is-selected/);
                await expect.poll(()=>card.evaluate(n=>n.getAnimations({subtree:true})
                    .filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations!==Infinity).length)).toBe(0);
                expect((await measure()).card.h).toBeCloseTo(after.card.h,0);
            } else {
                // Ignore scroll anchoring; require identical card-local geometry.
                const local = sample=>Object.fromEntries(Object.entries(sample).map(([key,value])=>{
                    if (key==='overflow') return [key,value];
                    if (key==='card') return [key,{w:value.w,h:value.h}];
                    return [key,{...value,x:value.x-sample.card.x,y:value.y-sample.card.y}];
                }));
                expect(local(after)).toEqual(local(before));
            }
        } finally {
            await style.evaluate(n=>n.remove());
            await page.waitForTimeout(900);
        }
    }
});
