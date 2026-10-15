const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('K16 actual responsive group layout diagnostic', async({page}, info) => {
    test.setTimeout(300000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL);
    if (base.origin !== 'http://localhost') throw Error('Principal only');
    await page.route('**/local/groupimport/ajax.php*', r => r.abort());
    await page.goto(new URL('/login/index.php', base).href, {waitUntil:'domcontentloaded'});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil:'domcontentloaded'});
    }
    const rows = [];
    for (const width of [768,390]) {
        await page.setViewportSize({width,height:1100});
        await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:90000});
        const root = page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
        await root.locator('[data-easystud-mobile-view="groups"]').click();
        await root.evaluate(async n => {await document.fonts.ready; await Promise.all(n.getAnimations({subtree:true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));});
        rows.push({width,cards:await root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible').evaluateAll(nodes => nodes.slice(0,2).map(c => {
            const box = n => {const b=n.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height,cx:b.x+b.width/2,cy:b.y+b.height/2};};
            const selectors = [':scope > .local-groupimport-easystud-selector', '.local-groupimport-easystud-selector--group .local-groupimport-easystud-selector__ui',
                '.local-groupimport-easystud-group__header','.local-groupimport-easystud-group__name',
                '.local-groupimport-easystud-group__header .badge','.local-groupimport-easystud-group__header .btn-link',
                ':scope > .local-groupimport-easystud-card-menu','.local-groupimport-easystud-member',
                '.local-groupimport-easystud-member .local-groupimport-easystud-selector__ui'];
            return {root:c.closest('#local-groupimport-easystud').className,box:box(c),column:getComputedStyle(c).getPropertyValue('--easyedu-entity-selection-column'),
                slots:selectors.flatMap(selector => [...c.querySelectorAll(selector)].filter(n => n.getClientRects().length).slice(0,4).map(n => {
                    const s=getComputedStyle(n);return {selector,kind:n.className,box:box(n),parent:box(n.parentElement),
                        css:{display:s.display,position:s.position,top:s.top,left:s.left,right:s.right,transform:s.transform,
                            margin:s.margin,padding:s.padding,border:s.borderWidth,width:s.width,height:s.height,
                            alignItems:s.alignItems,justifyContent:s.justifyContent,gridArea:s.gridArea}};
                }))};
        }))});
    }
    fs.writeFileSync(info.outputPath('group-responsive-layout.json'),JSON.stringify({rows,readOnly:true},null,2));
});
