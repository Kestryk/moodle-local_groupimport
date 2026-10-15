const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
test('K16 footer native font metrics diagnostic without retained styles', async({page}, info) => {
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
    for (const width of [1600,390]) {
        await page.setViewportSize({width,height:1100});
        await page.goto(base.href,{waitUntil:'domcontentloaded',timeout:90000});
        const root = page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:90000});
        await root.locator(width === 390 ? '[data-easystud-mobile-view="groups"]' : '[data-easystud-layout-mode="structure"]:visible').click();
        await root.evaluate(async n => {await document.fonts.ready; await Promise.all(n.getAnimations({subtree:true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));});
        const button = root.locator('[data-easystud-group-select-all]:visible').first();
        await expect(button).toBeVisible();
        const measures = await button.evaluate(async n => {
            const original = n.getAttribute('style');
            const variants = [{name:'actual'}, {name:'normal',lineHeight:'normal'},
                {name:'one',lineHeight:'1'}, {name:'grid',display:'inline-grid',placeItems:'center'},
                {name:'grid-normal',display:'inline-grid',placeItems:'center',lineHeight:'normal'}];
            const out = [];
            try {for (const variant of variants) {
                if (original === null) n.removeAttribute('style'); else n.setAttribute('style', original);
                Object.entries(variant).filter(([k]) => k !== 'name').forEach(([k,v]) => {n.style[k] = v;});
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
                const b = n.getBoundingClientRect(), range = document.createRange(); range.selectNodeContents(n);
                const text = range.getBoundingClientRect(), s = getComputedStyle(n);
                out.push({variant:variant.name,height:b.height,width:b.width,dx:text.x+text.width/2-b.x-b.width/2,
                    dy:text.y+text.height/2-b.y-b.height/2,font:s.font,fontFamily:s.fontFamily,lineHeight:s.lineHeight,
                    padding:s.padding,display:s.display,alignItems:s.alignItems,justifyContent:s.justifyContent});
            }} finally {if (original === null) n.removeAttribute('style'); else n.setAttribute('style', original);}
            return out;
        });
        rows.push({width,measures});
    }
    fs.writeFileSync(info.outputPath('footer-font-probe.json'),JSON.stringify({rows,testOnly:true,stylesRestored:true},null,2));
});
