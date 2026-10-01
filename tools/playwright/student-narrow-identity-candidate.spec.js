const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Resolve the canonical compiled fixture before credentials/lease discovery.
const cssPath = process.env.EASYEDU_NARROW_PARTICIPANT_CANDIDATE_CSS;
if (!cssPath) throw new Error('Set EASYEDU_NARROW_PARTICIPANT_CANDIDATE_CSS to the compiled canonical fixture.');
const css = fs.readFileSync(cssPath,'utf8');

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
                expect(after).toEqual(before);
            }
        } finally { await style.evaluate(n=>n.remove()); }
    }
});
