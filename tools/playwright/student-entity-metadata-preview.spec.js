const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised native audit: existing entities, disclosures and Cancel only.
// Settings are opened at desktop then resized; this is not a mobile entry proof.
test('Entity metadata preserves native count list and chip geometry', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const root=page.locator('#local-groupimport-easystud'), records=[], blocked=[];
    const save=()=>fs.writeFileSync(testInfo.outputPath('entity-metadata-native.json'),
        JSON.stringify({records,blocked},null,2));
    await page.route('**/local/groupimport/**', async route=>{
        if(route.request().method()==='GET') await route.continue();
        else {blocked.push(route.request().method());save();await route.abort('blockedbyclient');}
    });
    const ready=async()=>{
        await page.setViewportSize({width:1600,height:1100});
        await page.emulateMedia({reducedMotion:'no-preference'});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url=>!url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    };
    for(const width of [1600,768,390]) for(const kind of ['participant','group','grouping']){
        await ready();
        let modal;
        if(kind==='participant'){
            await root.locator('[data-easystud-open-user]:visible').first().click();
            modal=root.locator('[data-easystud-user-modal]');
        } else {
            await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
            const item=root.locator('[data-easystud-advanced-type="'+kind+'"]:visible').first();
            const header=item.locator(':scope > .local-groupimport-easystud-group__header, '+
                ':scope > .local-groupimport-easystud-grouping__header');
            await header.locator(':scope > [data-easystud-open-advanced-settings]:visible').click();
            modal=root.locator('[data-easystud-advanced-settings-modal]');
        }
        await expect(modal).toBeVisible();await page.setViewportSize({width,height:1100});
        await modal.evaluate(async n=>{
            await document.fonts.ready;
            await Promise.all(n.getAnimations({subtree:true})
                .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations))
                .map(a=>a.finished.catch(()=>undefined)));
        });
        const lists=modal.locator('[data-easystud-detail-list], [data-easystud-settings-list-section]');
        await expect(lists).toHaveCount(kind==='participant'?3:kind==='group'?2:1);
        for(const list of await lists.all()){
            if(await list.getAttribute('open')===null)await list.locator('summary').click();
            await list.evaluate(async n=>Promise.all(n.getAnimations({subtree:true})
                .filter(a=>Number.isFinite(a.effect.getComputedTiming().iterations))
                .map(a=>a.finished.catch(()=>undefined))));
        }
        const measures=await lists.evaluateAll(nodes=>{
            const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
            const paint=n=>{
                if(!n)return null;
                const s=getComputedStyle(n),range=document.createRange();range.selectNodeContents(n);
                return {text:n.textContent.trim(),rect:rect(n),font:s.fontSize,family:s.fontFamily,
                    weight:s.fontWeight,lineHeight:s.lineHeight,color:s.color,background:s.backgroundColor,
                    border:s.borderTopColor,radius:s.borderTopLeftRadius,gap:s.columnGap,
                    padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft],
                    lines:[...range.getClientRects()].filter(r=>r.width>0).map(r=>
                        ({x:r.x,y:r.y,width:r.width,height:r.height}))};
            };
            return nodes.map(n=>({
                classes:n.className,open:n.open,frame:rect(n),
                title:paint(n.querySelector('[class$="__list-title"]')),
                count:paint(n.querySelector('summary strong')),
                chevron:paint(n.querySelector('.fa-chevron-down')),
                entries:[...n.querySelectorAll(':scope > div > ul > li')].map(li=>({
                    ...paint(li),primary:paint(li.querySelector('[class$="__list-item-primary"]')),
                    chips:[...li.querySelectorAll('[class$="__list-item-chip"]')].map(paint)})),
                empty:paint(n.querySelector('[class$="__list-empty"]')),
                csvTables:n.querySelectorAll('table[hidden]').length,
                csvVisible:[...n.querySelectorAll('table[hidden]')].some(t=>getComputedStyle(t).display!=='none'),
            }));
        });
        records.push({kind,width,entryWidth:1600,lists:measures});save();
        for(const list of measures){
            expect(list.title.family).toContain('Inter');expect(list.title.font).toBe('14.08px');
            expect(list.title.weight).toBe('600');expect(list.count.weight).toBe('600');
            expect(list.count.font).toBe(kind==='participant'?'12.16px':'12.48px');
            expect(list.csvVisible).toBe(false);
            for(const content of [list.title,list.count,...list.entries]){
                expect(content.rect.x).toBeGreaterThanOrEqual(list.frame.x-.5);
                expect(content.rect.x+content.rect.width).toBeLessThanOrEqual(list.frame.x+list.frame.width+.5);
            }
        }
        // Preserve the native animated disclosure. Observe transitional state
        // before waiting for the terminal closed/open state, never force hidden.
        const disclosure=lists.first(),state=kind==='participant'?'data-easystud-detail-list-state':
            'data-easystud-settings-list-state';
        const content=disclosure.locator(':scope > div');
        if(await disclosure.getAttribute('open')!==null){
            await disclosure.locator('summary').click();
            await expect(content).toHaveClass(/is-easyedu-disclosing/);
            await expect(content).not.toHaveClass(/is-easyedu-disclosing/);
            await expect(disclosure).toHaveAttribute(state,'closed');
            await disclosure.locator('summary').click();
            await expect(content).toHaveClass(/is-easyedu-disclosing/);
            await expect(content).not.toHaveClass(/is-easyedu-disclosing/);
            await expect(disclosure).toHaveAttribute(state,'open');
        }
        await lists.first().screenshot({path:testInfo.outputPath('metadata-'+kind+'-'+width+'.png')});
        await modal.locator(kind==='participant'?'[data-easystud-close-user-modal]':
            '.easyedu-entity-dialog__actions [data-easystud-close-advanced-settings]').click();
        if(kind==='participant')await expect(modal).toBeHidden();else await expect(modal).toHaveCount(0);
    }
    expect(blocked).toEqual([]);save();
});
