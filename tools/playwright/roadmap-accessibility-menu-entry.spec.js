'use strict';
const {test, expect} = require('@playwright/test');
const {default: AxeBuilder} = require('@axe-core/playwright');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

// Correct the menu-entry probe only: preselect/settle/header target follows the
// existing student-context-menu-foundations scenario; product Motion unchanged.
test('T058 settled context entry and compact navigation focus audit', async({page}, info) => {
    test.setTimeout(240000); page.setDefaultTimeout(10000);
    const r = {task: 'T058', cases: [], gaps: [], axe: [], blockedWrites: [], servedFiles: audit.identity(),
        compactScope: 'Desktop load then390px resize, not cold mobile readiness or full responsive acceptance'};
    const save = () => fs.writeFileSync(info.outputPath('T058-menu-entry.json'), JSON.stringify(r, null, 2));
    try {
        await page.setViewportSize({width:1280,height:900}); await audit.login(page);
        await audit.blockBusinessWrites(page, r.blockedWrites); const root = await audit.ready(page);
        for (const [name, selector] of [['participant','[data-easystud-user]'], ['group','[data-easystud-group-id]'],
            ['grouping','[data-easystud-grouping-id]']]) {
            const mode = name === 'participant' ? 'participants' : 'structure';
            const toggle = root.locator('[data-easystud-layout-mode="' + mode + '"]:visible').first();
            await toggle.click(); await audit.settle(root);
            const card = root.locator(selector + ':visible').first();
            if (!await card.count()) {r.gaps.push({name, reason:'No existing visible card'}); continue;}
            await card.scrollIntoViewIfNeeded();
            const input = card.locator('[data-easystud-selector-input]').first();
            if (!await input.isChecked()) await input.locator('..').click();
            const header = card.locator(':scope > .local-groupimport-easystud-user__main, ' +
                ':scope > .local-groupimport-easystud-group__header, :scope > .local-groupimport-easystud-grouping__header').first();
            await header.scrollIntoViewIfNeeded(); await audit.settle(root);
            let previous = '', stable = 0;
            await expect.poll(async() => {
                const next = JSON.stringify(await card.evaluate(n => ({h:n.getBoundingClientRect().height, scroll:scrollY})));
                stable = next === previous ? stable + 1 : 0; previous = next; return stable;
            }, {timeout:10000, intervals:[100]}).toBeGreaterThanOrEqual(3);
            await header.click({button:'right', position:{x:100,y:16}});
            const menu = root.locator('[data-easystud-context-menu]');
            const rec = {name:name+'-context', viewport:1280}; r.cases.push(rec); save();
            if (!await menu.waitFor({state:'visible',timeout:3000}).then(()=>true).catch(()=>false)) {
                rec.opened = false; r.gaps.push({name,reason:'Settled native header right-click did not expose menu'}); continue;
            }
            rec.opened = true; await audit.settle(menu);
            rec.focusAtOpen = await menu.evaluate(n=>n.contains(document.activeElement));
            await page.keyboard.press('ArrowDown');
            rec.arrowFocusInside = await menu.evaluate(n=>n.contains(document.activeElement));
            const axe = await new AxeBuilder({page}).include('[data-easystud-context-menu]').withTags(['wcag2a','wcag2aa']).analyze();
            r.axe.push({name, violations:axe.violations.map(v=>({id:v.id,impact:v.impact,targets:v.nodes.map(n=>n.target)}))});
            await page.keyboard.press('Escape');
            rec.escapeClosed = await menu.waitFor({state:'hidden',timeout:3000}).then(()=>true).catch(()=>false);
            rec.returnInsideCard = await card.evaluate(n=>n.contains(document.activeElement)); save();
        }
        await page.setViewportSize({width:390,height:844}); await audit.settle(root);
        const open = root.locator('[data-easyedu-navigation-open]:visible').first();
        if (!await open.count()) r.gaps.push({name:'compact-navigation',reason:'No native visible trigger'});
        else {
            await open.click(); const panel = page.locator('[data-easyedu-navigation-panel][aria-hidden="false"]').first();
            await expect(panel).toBeVisible(); await audit.settle(panel);
            const rec = {name:'compact-navigation',viewport:390,focusAtOpen:await panel.evaluate(n=>n.contains(document.activeElement)),
                background:await panel.evaluate(n=>getComputedStyle(n).backgroundColor)};
            r.cases.push(rec); rec.tabInside = [];
            for(let i=0;i<20;i++) {await page.keyboard.press('Tab'); rec.tabInside.push(await panel.evaluate(n=>n.contains(document.activeElement)));}
            await page.keyboard.press('Escape');
            rec.escapeClosed = await panel.getAttribute('aria-hidden') === 'true';
            if (!rec.escapeClosed) await panel.locator('[data-easyedu-navigation-close]').click();
            await audit.settle(root); rec.returnFocus = await open.evaluate(n=>n===document.activeElement); save();
        }
        r.completed = true;
        r.passed = r.gaps.length === 0 && r.axe.every(a=>a.violations.length === 0) &&
            r.cases.every(c=>c.escapeClosed && (c.returnFocus ?? c.returnInsideCard));
    } finally {save();}
});
