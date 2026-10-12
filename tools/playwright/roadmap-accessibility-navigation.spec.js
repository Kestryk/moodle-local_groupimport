'use strict';
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

// Stable panel identity survives aria-hidden changes. Retain the previous
// open-qualified locator timeout as a harness failure, not a product Escape bug.
test('T058 compact navigation stable identity Escape and focus', async({page}, info) => {
    test.setTimeout(120000);
    const r = {task:'T058', name:'compact-navigation-stable', viewport:390,
        scope:'Desktop initial load then compact native entry', blockedWrites:[], servedFiles:audit.identity()};
    try {
        await page.setViewportSize({width:1280,height:900}); await audit.login(page);
        await audit.blockBusinessWrites(page,r.blockedWrites); const root = await audit.ready(page);
        await page.setViewportSize({width:390,height:844}); await audit.settle(root);
        const opener = root.locator('[data-easyedu-navigation-open]:visible').first();
        await opener.click();
        const id = await page.locator('[data-easyedu-navigation-panel][aria-hidden="false"]').first().getAttribute('id');
        const panel = page.locator('[id="'+id+'"]'); await audit.settle(panel);
        r.focusAtOpen = await panel.evaluate(n=>n.contains(document.activeElement));
        r.background = await panel.evaluate(n=>getComputedStyle(n).backgroundColor);
        r.tabSamples = [];
        for(let i=0;i<20;i++) {await page.keyboard.press('Tab'); r.tabSamples.push(await panel.evaluate(n=>n.contains(document.activeElement)));}
        await page.keyboard.press('Escape');
        await expect(panel).toHaveAttribute('aria-hidden','true',{timeout:3000});
        await audit.settle(panel); r.escapeClosed = true;
        await expect(opener).toBeFocused(); r.returnFocus = true;
        r.completed = true; r.passed = r.focusAtOpen && r.tabSamples.every(Boolean) && r.returnFocus;
    } finally {fs.writeFileSync(info.outputPath('T058-navigation.json'),JSON.stringify(r,null,2));}
});
