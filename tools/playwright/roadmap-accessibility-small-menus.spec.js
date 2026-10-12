'use strict';
const {test, expect} = require('@playwright/test');
const {default: AxeBuilder} = require('@axe-core/playwright');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

test('T058 native sort panel and member action menus audit', async({page}, info) => {
    test.setTimeout(150000); page.setDefaultTimeout(10000);
    const r = {task:'T058', viewport:1280, cases:[], gaps:[], blockedWrites:[], servedFiles:audit.identity()};
    const save = () => fs.writeFileSync(info.outputPath('T058-small-menus.json'),JSON.stringify(r,null,2));
    try {
        await page.setViewportSize({width:1280,height:900}); await audit.login(page);
        await audit.blockBusinessWrites(page,r.blockedWrites); const root = await audit.ready(page);
        for (const [name, triggerAttr, menuAttr] of [
            ['sort','data-easystud-list-sort-toggle','data-easystud-list-sort-menu'],
            ['panel-actions','data-easystud-panel-actions-toggle','data-easystud-panel-actions-menu'],
            ['member-actions','data-easystud-group-actions-toggle','data-easystud-group-actions-menu']]) {
            const rec = {name, status:'unavailable'}; r.cases.push(rec); save();
            if (name === 'panel-actions') {
                const participant = root.locator('[data-easystud-user]:visible [data-easystud-selector-input]').first();
                if (await participant.count() && !await participant.isChecked()) await participant.evaluate(n=>n.click());
                await audit.settle(root);
            }
            if (name === 'member-actions') {
                await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click(); await audit.settle(root);
                const input = root.locator('[data-easystud-member-id]:visible [data-easystud-selector-input]').first();
                if (await input.count()) await input.evaluate(n=>n.click());
            }
            const candidates = root.locator('['+triggerAttr+']:visible');
            let trigger = null;
            rec.entryPaintCandidates = [];
            for (let i=0;i<await candidates.count();i++) {
                const candidate = candidates.nth(i);
                if (!await candidate.isEnabled()) continue;
                await candidate.scrollIntoViewIfNeeded(); await audit.settle(root);
                const painted = await candidate.evaluate(n=>{
                    const b=n.getBoundingClientRect(), hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
                    return n===hit || n.contains(hit);
                });
                rec.entryPaintCandidates.push(painted);
                if (painted) {trigger=candidate;break;}
            }
            if (!trigger) {
                r.gaps.push({name,reason:'No enabled painted native trigger; visible off-canvas/inert candidates do not certify availability'});continue;
            }
            await trigger.click(); await audit.settle(root);
            const menu = root.locator('['+menuAttr+']:visible').first();
            if (!await menu.count()) {r.gaps.push({name,reason:'No visible menu after native opener'});continue;}
            rec.focusAtOpen = await menu.evaluate(n=>n.contains(document.activeElement));
            rec.role = await menu.getAttribute('role');
            const a = await new AxeBuilder({page}).include('['+menuAttr+']').withTags(['wcag2a','wcag2aa']).analyze();
            rec.violations = a.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}));
            await page.keyboard.press('Escape'); await audit.settle(root);
            rec.escapeClosed = !await menu.isVisible();
            if (!rec.escapeClosed) {await trigger.click();await audit.settle(root);}
            rec.returnFocus = await trigger.evaluate(n=>n===document.activeElement);
            rec.status = 'audited'; save();
        }
        r.completed = true;
        r.passed = r.gaps.length === 0 && r.cases.every(c=>c.escapeClosed && c.returnFocus && c.violations?.length === 0);
        expect(r.cases).toHaveLength(3);
    } finally {save();}
});
