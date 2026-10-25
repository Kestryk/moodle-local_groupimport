const {test, expect} = require('@playwright/test');
const path = require('node:path');
const fs = require('node:fs');

// Local-supervised experiment: temporary page stylesheet, never runtime files.
test('Compare canonical name-priority tracks against the served participant row', async({page}, testInfo) => {
    test.setTimeout(180000);
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php';
    await page.setViewportSize({width:390,height:1100});
    await page.goto(url.toString());
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(v => !v.pathname.includes('/login/'));
        await page.goto(url.toString());
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const card = root.locator('[data-easystud-user="1"]:visible').first();
    await card.scrollIntoViewIfNeeded();
    const measure = () => card.evaluate(n => {
        const box = e => { const r=e.getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; };
        return {card:box(n), name:box(n.querySelector('.local-groupimport-easystud-user__name')),
            identity:box(n.querySelector('.local-groupimport-easystud-user__headline-main')),
            badge:n.querySelector('.local-groupimport-easystud-user__primary-badge') ? box(n.querySelector('.local-groupimport-easystud-user__primary-badge')) : null,
            email:box(n.querySelector('.local-groupimport-easystud-user__email')),
            eye:box(n.querySelector('.local-groupimport-easystud-user__detail-button')),
            text:n.textContent, overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
    });
    const before = await measure();
    const compiled = fs.readFileSync(path.resolve(__dirname,'../../styles.css'),'utf8');
    const rule = compiled.match(/\.local-groupimport-easystud--responsive-workspace \.local-groupimport-easystud-user__headline\s*\{([^}]+)\}/);
    expect(rule).not.toBeNull();
    const track = rule[1].match(/grid-template-columns:[^;]+;/)[0];
    const css = '.local-groupimport-easystud--responsive-workspace.local-groupimport-easystud--compact-users .local-groupimport-easystud-user__headline {'+track+'}';
    const style = await page.addStyleTag({content:css});
    try {
        const after = await measure();
        const evidence = {before:{...before},after:{...after}};
        delete evidence.before.text;
        delete evidence.after.text;
        fs.writeFileSync(testInfo.outputPath('name-priority-comparison.json'),JSON.stringify(evidence,null,2));
        await page.screenshot({path:testInfo.outputPath('name-priority-candidate-390.png')});
        expect(after.text).toBe(before.text);
        expect(after.name.w).toBeGreaterThan(before.name.w+10);
        expect(after.email.w).toBeGreaterThan(20);
        expect(Math.abs(after.card.h-before.card.h)).toBeLessThan(1);
        expect(Math.abs(after.eye.x-before.eye.x)).toBeLessThan(1);
        expect(after.overflow).toBeLessThanOrEqual(2);
        delete before.text;
        delete after.text;
        fs.writeFileSync(testInfo.outputPath('name-priority-comparison.json'),JSON.stringify({before,after},null,2));
        await page.screenshot({path:testInfo.outputPath('name-priority-candidate-390.png')});
    } finally { await style.evaluate(n=>n.remove()); }
});
