'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
test('T058 ready inline panels and Space Move FR1280 normal reduced', async({page}, info) => {
    test.setTimeout(300000); page.setDefaultTimeout(60000);
    const report = {cases: [], moves: [], errors: [], writesBlocked: [], identity: audit.identity()};
    const save = () => fs.writeFileSync(info.outputPath('inline.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => report.errors.push(e.message));
    await page.setViewportSize({width:1280,height:900});
    await audit.login(page); await audit.blockBusinessWrites(page, report.writesBlocked);
    try {
        for (const motion of ['no-preference','reduce']) {
            await page.emulateMedia({reducedMotion:motion});
            await page.goto(audit.perfUrl().href,{waitUntil:'domcontentloaded'});
            const root = await audit.ready(page);
            const press = async n => {await expect(n).toBeVisible(); await n.focus(); await page.keyboard.press('Enter');};
            await press(root.locator('[data-easystud-layout-mode="structure"]:visible').first());
            await audit.settle(root);
            const group=root.locator('[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible').first();
            const menu=group.locator(':scope > [data-easystud-card-menu]:visible, :scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible').first();
            const samples=[
                ['search','group-search-members','[data-easystud-group-member-search-panel]','[data-easystud-group-member-search]','[data-easystud-group-member-search-cancel]'],
                ['identifiers','group-paste-emails','[data-easystud-group-email-panel]','[data-easystud-group-email-box]','[data-easystud-cancel-group-email]'],
                ['rename','group-focus-rename','.local-groupimport-easystud-rename__edit','input[name="name"]','[data-easystud-rename-cancel]']
            ];
            for(const [name,action,panelSelector,fieldSelector,cancelSelector] of samples) {
                await press(menu);
                await press(root.locator(`[data-easystud-context-menu]:visible [data-easystud-context-action="${action}"]`));
                const panel=group.locator(panelSelector).first(),field=panel.locator(fieldSelector).first();
                await expect(panel).toBeVisible(); await audit.settle(root);
                const row={motion,name,initial:await field.evaluate(n=>n===document.activeElement)};
                row.motion=motion;
                row.duration=await panel.evaluate(n=>({animation:getComputedStyle(n).animationDuration,transition:getComputedStyle(n).transitionDuration}));
                // Integrated panels remain ordinary document flow, not modal focus traps.
                await field.focus(); await page.keyboard.press('Tab');
                row.tabTarget=await page.evaluate(()=>document.activeElement.outerHTML.slice(0,300));
                await field.focus(); await page.keyboard.press('Escape'); await audit.settle(root);
                row.escapeClosed=await panel.isHidden(); row.escapeReturn=await menu.evaluate(n=>n===document.activeElement);
                await page.screenshot({path:info.outputPath(`${motion}-${name}-escape.png`)});
                if(!row.escapeClosed) await press(panel.locator(cancelSelector).first());
                await expect(panel).toBeHidden(); await audit.settle(root);
                row.finalReturn=await menu.evaluate(n=>n===document.activeElement);
                report.cases.push(row);save();
            }
            for(const type of ['group','participant']) {
                const clear=root.locator('[data-easystud-clear-all-selection]:visible').first();
                if(await clear.count()) {await press(clear);await audit.settle(root);}
                if(type==='participant') {await press(root.locator('[data-easystud-layout-mode="participants"]:visible').first());await audit.settle(root);}
                const item=type==='group'?group:root.locator('[data-easystud-user]:visible').first();
                const checkbox=item.locator(':scope > .local-groupimport-easystud-selector [data-easystud-selector-input]').first();
                await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
                const trigger=root.locator(type==='group'?'[data-easystud-move-selected-groups]:visible':'[data-easystud-move-selected-participants]:visible').first();
                await press(trigger);const modal=root.locator('[data-easystud-move-modal]');
                await expect(modal).toBeVisible();await audit.settle(modal);
                const row={motion,type,spaceSelected:true,opened:true,initialInside:await modal.evaluate(n=>n.contains(document.activeElement))};
                await page.keyboard.press('Escape');await expect(modal).toBeHidden();await audit.settle(root);
                row.returned=await trigger.evaluate(n=>n===document.activeElement);report.moves.push(row);save();
                await press(root.locator('[data-easystud-clear-all-selection]:visible').first());await audit.settle(root);
            }
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
        expect(report.cases.filter(c=>!c.initial||!c.escapeClosed||!c.escapeReturn||!c.finalReturn)).toEqual([]);
        expect(report.moves.filter(c=>!c.initialInside||!c.returned)).toEqual([]);
    } finally {save();await page.screenshot({path:info.outputPath('final.png')}).catch(()=>{});}
});
