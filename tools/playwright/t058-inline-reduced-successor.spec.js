'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
test('T058 final reduced focus panels and keyboard destination FR1280', async({page}, info) => {
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
            const directSelectors={'group-search-members':'[data-easystud-group-member-search-toggle]', 'group-paste-emails':'[data-easystud-toggle-group-email]', 'group-focus-rename':'[data-easystud-rename-toggle]', 'grouping-paste-groups':'[data-easystud-toggle-grouping-groups]', 'grouping-focus-rename':'[data-easystud-rename-toggle]'};
            const grouping=root.locator('[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible').first();
            const samples=[
                ['search','group-search-members','[data-easystud-group-member-search-panel]','[data-easystud-group-member-search]','[data-easystud-group-member-search-cancel]'],
                ['identifiers','group-paste-emails','[data-easystud-group-email-panel]','[data-easystud-group-email-box]','[data-easystud-cancel-group-email]'],
                ['rename','group-focus-rename','.local-groupimport-easystud-rename__edit','input[name="name"]','[data-easystud-rename-cancel]'],
                ['grouping-search',null,'[data-easystud-container-search-panel]','[data-easystud-container-group-search]','[data-easystud-container-search-cancel]'],
                ['grouping-identifiers','grouping-paste-groups','[data-easystud-grouping-groups-panel]','[data-easystud-grouping-groups-box]','[data-easystud-cancel-grouping-groups]'],
                ['grouping-rename','grouping-focus-rename','.local-groupimport-easystud-rename__edit','input[name="name"]','[data-easystud-rename-cancel]']
            ];
            for(const [name,action,panelSelector,fieldSelector,cancelSelector] of samples) {
                const owner=name.startsWith('grouping-')?grouping:group;
                const direct=owner.locator((action?directSelectors[action]:'[data-easystud-container-search-toggle]')+':visible').first();
                const throughMenu=!await direct.count();
                const opener=throughMenu?owner.locator(':scope > [data-easystud-card-menu]:visible, :scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu]:visible, :scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]:visible').first():direct;
                const openerNode=await opener.elementHandle();
                const open=async()=>{await press(opener);if(throughMenu) await press(root.locator(`[data-easystud-context-menu]:visible [data-easystud-context-action="${action}"]`));};
                await root.evaluate(n=>{
                    n.__panelTrace=[];
                    n.__panelObserver?.disconnect();
                    n.__panelObserver=new MutationObserver(records=>{
                        for(const r of records) if(r.type==='attributes' && r.attributeName==='class' &&
                            r.target.classList.contains('is-easyedu-disclosing'))
                            n.__panelTrace.push({target:r.target, durations:r.target.getAnimations()
                                .map(a=>a.effect.getComputedTiming().duration)});
                    });
                    n.__panelObserver.observe(n,{subtree:true,attributes:true,attributeFilter:['class']});
                });
                await open();
                const panel=owner.locator(panelSelector).first(),field=panel.locator(fieldSelector).first();
                await expect(panel).toBeVisible(); await audit.settle(root);
                const row={motion,name,throughMenu,initial:await field.evaluate(n=>n===document.activeElement)};
                row.motion=motion;
                row.disclosure=await panel.evaluate(n=>n.closest('#local-groupimport-easystud').__panelTrace
                    .filter(t=>t.target===n).map(t=>t.durations));
                if(!name.includes('rename')) {
                    if(motion==='no-preference') expect(row.disclosure.flat().some(d=>d>0)).toBe(true);
                    else expect(row.disclosure.flat()).toEqual([]);
                }
                row.duration=await panel.evaluate(n=>({animation:getComputedStyle(n).animationDuration,transition:getComputedStyle(n).transitionDuration}));
                if(motion==='reduce') expect(row.duration.transition.split(',').every(v=>parseFloat(v)<=0.000001)).toBe(true);
                // Integrated panels remain ordinary document flow, not modal focus traps.
                await field.focus(); await page.keyboard.press('Tab');
                row.tabTarget=await page.evaluate(()=>document.activeElement.outerHTML.slice(0,300));
                await field.focus(); await page.keyboard.press('Escape'); await audit.settle(root);
                row.escapeClosed=await panel.isHidden(); row.escapeReturn=await openerNode.evaluate(n=>n===document.activeElement);
                await page.screenshot({path:info.outputPath(`${motion}-${name}-escape.png`)});
                if(!row.escapeClosed) await press(panel.locator(cancelSelector).first());
                await expect(panel).toBeHidden(); await audit.settle(root);
                row.finalReturn=await openerNode.evaluate(n=>n===document.activeElement);
                await open();await expect(panel).toBeVisible();await audit.settle(root);
                const cancel=panel.locator(cancelSelector).first();await cancel.focus();await page.keyboard.press('Tab');
                row.tabCanLeave=await panel.evaluate(n=>!n.contains(document.activeElement));
                await press(cancel);await expect(panel).toBeHidden();await audit.settle(root);
                row.cancelReturn=await openerNode.evaluate(n=>n===document.activeElement);
                row.reducedMatches=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
                report.cases.push(row);save();
            }
            for(const type of ['group','member','participant']) {
                const clear=root.locator('[data-easystud-clear-all-selection]:visible').first();
                if(await clear.count()) {await press(clear);await audit.settle(root);}
                if(type==='participant') {await press(root.locator('[data-easystud-layout-mode="participants"]:visible').first());await audit.settle(root);}
                const item=type==='group'?group:type==='member'?root.locator('[data-easystud-structure-groups] [data-easystud-member-id]:visible').first():root.locator('[data-easystud-user]:visible').first();
                if(type==='member' && !await item.count()) {
                    const toggle=group.locator('[data-easystud-group-members-toggle]:visible').first();
                    if(await toggle.count()) await press(toggle);
                    await audit.settle(root);
                }
                const checkbox=item.locator(':scope > .local-groupimport-easystud-selector [data-easystud-selector-input]').first();
                await checkbox.focus();await page.keyboard.press('Space');await expect(checkbox).toBeChecked();
                const trigger=root.locator(type==='group'?'[data-easystud-move-selected-groups]:visible':type==='member'?'[data-easystud-move-selected-members]:visible':'[data-easystud-move-selected-participants]:visible').first();
                await press(trigger);const modal=root.locator('[data-easystud-move-modal]');
                await expect(modal).toBeVisible();await audit.settle(modal);
                await expect(modal).toHaveAttribute('data-easystud-move-context',type);
                const row={motion,type,spaceSelected:true,opened:true,initialInside:await modal.evaluate(n=>n.contains(document.activeElement))};
                const chooser=modal.locator('.easyedu-searchable-choice__trigger');
                await press(chooser);await audit.settle(modal);
                await page.keyboard.press('Escape');await audit.settle(modal);
                await expect(modal).toBeVisible();await expect(chooser).toBeFocused();
                row.nestedEscape=true;
                await press(chooser);await audit.settle(modal);
                const destination=modal.locator('[data-easystud-move-destination]');
                const expectedValue=await destination.evaluate(n=>n.options[1].value);
                await page.keyboard.press('Tab');await page.keyboard.press('Tab');await page.keyboard.press('Space');
                await expect(destination).toHaveValue(expectedValue);await audit.settle(modal);
                row.keyboardDestination=expectedValue;
                for(let i=0;i<4;i++) {
                    await page.keyboard.press('Tab');
                    if(await modal.locator('[data-easystud-confirm-move]').evaluate(n=>n===document.activeElement)) break;
                }
                await expect(modal.locator('[data-easystud-confirm-move]')).toBeFocused();
                row.confirmReached=true;
                await page.screenshot({path:info.outputPath(`${motion}-${type}-keyboard-destination.png`)});
                await page.keyboard.press('Escape');await expect(modal).toBeHidden();await audit.settle(root);
                row.returned=await trigger.evaluate(n=>n===document.activeElement);report.moves.push(row);save();
                await press(root.locator('[data-easystud-clear-all-selection]:visible').first());await audit.settle(root);
            }
        }
        expect(report.errors).toEqual([]);expect(report.writesBlocked).toEqual([]);
        expect(report.cases.filter(c=>!c.initial||!c.escapeClosed||!c.escapeReturn||!c.finalReturn||!c.cancelReturn||!c.tabCanLeave)).toEqual([]);
        expect(report.moves.filter(c=>!c.initialInside||!c.returned||!c.nestedEscape||!c.confirmReached)).toEqual([]);
    } finally {save();await page.screenshot({path:info.outputPath('final.png')}).catch(()=>{});}
});
