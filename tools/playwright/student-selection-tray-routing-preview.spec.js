const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised: native selections only; no move/remove/send or fixtures.
test('Responsive selection tray preserves native action eligibility and geometry', async ({page}, testInfo) => {
    test.setTimeout(240000);
    const records = [], blocked = [];
    const save = () => fs.writeFileSync(testInfo.outputPath('selection-tray-routing.json'),
        JSON.stringify({records,blocked},null,2));
    const root = page.locator('#local-groupimport-easystud');
    await page.route('**/local/groupimport/**', async route => {
        if (route.request().method() === 'GET') {await route.continue();}
        else {blocked.push(route.request().method());save();await route.abort('blockedbyclient');}
    });
    for (const width of [390,768]) {
        await page.setViewportSize({width,height:1100});
        await page.goto(process.env.EASYEDU_MOODLE_URL);
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(url=>!url.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        const tray = root.locator('[data-easystud-mobile-actions]');
        const cases = [
            {type:'participant',view:'participants',count:1},
            {type:'participant',view:'participants',count:2},
            {type:'member',view:'groups',count:1},
            {type:'group',view:'groups',count:1},
            {type:'group',view:'groups',count:1,requireMembership:true},
            {type:'grouping',view:'groupings',count:1},
        ];
        for (const current of cases) {
            if (await tray.isVisible()) {
                await tray.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]').click();
                await expect(tray).toBeHidden();
            }
            await root.locator('[data-easystud-mobile-view="'+current.view+'"]:visible').first().click();
            let rows = root.locator('[data-selectable-type="'+current.type+'"]:visible');
            if (current.requireMembership) {
                const memberGroupId = await rows.evaluateAll(nodes=>nodes.find(n=>{
                    const id=n.getAttribute('data-easystud-group-id');
                    return [...n.closest('#local-groupimport-easystud').querySelectorAll('[data-easystud-grouping-id]')]
                        .some(section=>section.querySelector(':scope > .local-groupimport-easystud-tree__children > '+
                            '[data-easystud-group-id="'+id+'"]'));
                })?.getAttribute('data-easystud-group-id'));
                expect(memberGroupId,'Existing grouped entity required; never create a fixture').toBeTruthy();
                rows = root.locator('[data-selectable-type="group"][data-easystud-group-id="'+memberGroupId+'"]:visible');
            }
            expect(await rows.count(),'Use existing course entities only').toBeGreaterThanOrEqual(current.count);
            const detailsSourceExists = await root.locator('[data-easystud-open-selected-user]').count() > 0;
            const groupHasMembership = current.type==='group' && await rows.first().evaluate(n=>{
                const id=n.getAttribute('data-easystud-group-id');
                return [...n.closest('#local-groupimport-easystud').querySelectorAll('[data-easystud-grouping-id]')]
                    .some(section=>section.querySelector(':scope > .local-groupimport-easystud-tree__children > '+
                        '[data-easystud-group-id="'+id+'"]'));
            });
            for (let index=0;index<current.count;index++) {
                await rows.nth(index).locator(':scope > label [data-easystud-selector-input]').evaluate(n=>n.click());
            }
            await expect(tray).toBeVisible();
            await expect(tray).toHaveAttribute('data-easystud-mobile-actions-type',current.type);
            const data = await tray.evaluate(node=>{
                const rect = n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
                return {frame:rect(node),summary:rect(node.querySelector('[data-easystud-mobile-actions-summary]')),
                    summaryText:node.querySelector('[data-easystud-mobile-actions-summary]').textContent,
                    actions:[...node.querySelectorAll('[data-easystud-mobile-action-trigger]')].map(n=>{
                        const s=getComputedStyle(n),i=n.querySelector('.fa'),label=n.lastElementChild;
                        const range=document.createRange();range.selectNodeContents(label);
                        const lines=[...range.getClientRects()].filter(r=>r.width>0).map(r=>
                            ({x:r.x,y:r.y,width:r.width,height:r.height}));
                        return {selector:n.getAttribute('data-easystud-mobile-action-trigger'),text:n.textContent.trim(),
                            icon:i?.className,classes:n.className,color:s.color,background:s.backgroundColor,
                            font:s.fontSize,weight:s.fontWeight,gap:s.columnGap,whiteSpace:s.whiteSpace,
                            padding:[s.paddingTop,s.paddingRight,s.paddingBottom,s.paddingLeft].map(parseFloat),
                            border:[s.borderTopWidth,s.borderRightWidth,s.borderBottomWidth,s.borderLeftWidth].map(parseFloat),
                            lineHeight:parseFloat(s.lineHeight),iconRect:rect(i),labelRect:rect(label),
                            lines,rect:rect(n)};
                    })};
            });
            records.push({width,...current,detailsSourceExists,groupHasMembership,...data});save();
            const selectors = data.actions.map(n=>n.selector);
            expect(selectors[selectors.length-1]).toBe('[data-easystud-clear-all-selection]');
            const expected = {
                participant:['[data-easystud-message-selected-participants]',
                    ...(current.count===1&&detailsSourceExists?['[data-easystud-open-selected-user]']:[]),
                    '[data-easystud-move-selected-participants]','[data-easystud-clear-all-selection]'],
                member:['[data-easystud-move-selected-members]','[data-easystud-delete-selected-members]',
                    '[data-easystud-message-selected-participants]','[data-easystud-clear-all-selection]'],
                group:['[data-easystud-move-selected-groups]',
                    ...(groupHasMembership?
                        ['[data-easystud-remove-selected-groups-from-groupings]']:[]),
                    '[data-easystud-delete-selected-groups]','[data-easystud-clear-all-selection]'],
                grouping:['[data-easystud-delete-selected-groupings]','[data-easystud-clear-all-selection]'],
            };
            expect(selectors).toEqual(expected[current.type]);
            for(const action of data.actions) {
                expect(action.font).toBe('12.48px');expect(action.weight).toBe('600');expect(action.gap).toBe('5.6px');
                expect(action.whiteSpace).toBe('normal');
                const row = data.actions.filter(a=>Math.abs(a.rect.y-action.rect.y)<1);
                const rowMinimum = Math.max(37.6,...row.map(a=>
                    a.lines.length*a.lineHeight+a.padding[0]+a.padding[2]+a.border[0]+a.border[2]));
                expect(Math.abs(action.rect.height-rowMinimum)).toBeLessThanOrEqual(.15);
                expect(action.rect.x).toBeGreaterThanOrEqual(data.frame.x);
                expect(action.rect.x+action.rect.width).toBeLessThanOrEqual(data.frame.x+data.frame.width);
                const left=action.rect.x+action.border[3]+action.padding[3];
                const right=action.rect.x+action.rect.width-action.border[1]-action.padding[1];
                for(const content of [action.iconRect,...action.lines]) {
                    expect(content.x).toBeGreaterThanOrEqual(left-.1);
                    expect(content.x+content.width).toBeLessThanOrEqual(right+.1);
                }
                expect(Math.abs(action.labelRect.x-action.iconRect.x-action.iconRect.width-5.6)).toBeLessThanOrEqual(.1);
                const centre=action.rect.y+action.rect.height/2;
                expect(Math.abs(action.iconRect.y+action.iconRect.height/2-centre)).toBeLessThanOrEqual(1);
                expect(Math.abs(action.labelRect.y+action.labelRect.height/2-centre)).toBeLessThanOrEqual(1);
            }
            await tray.screenshot({path:testInfo.outputPath(
                `selection-${current.type}-${current.count}-${current.requireMembership?'linked':'plain'}-${width}.png`)});
        }
        await tray.locator('[data-easystud-mobile-action-trigger="[data-easystud-clear-all-selection]"]').click();
        await expect(tray).toBeHidden();
    }
    expect(blocked).toEqual([]);save();
});
