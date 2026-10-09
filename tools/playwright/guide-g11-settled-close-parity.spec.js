const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Local-supervised read/open/close only. Compare roles and actual glyph paint,
// not a Guide heading against an entity product eyebrow as if both were titles.
test('Guide G11 settled regular Close glyph parity', async({page}, info) => {
    test.setTimeout(150000);
    page.setDefaultTimeout(15000);
    const rows=[],errors=[],blocked=[];
    page.on('pageerror',error=>errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter:true});
        await page.waitForURL(url=>!url.pathname.includes('/login/'),{waitUntil:'commit',timeout:60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL,{waitUntil:'domcontentloaded'});
    }
    await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    await page.route('**/lib/ajax/service.php*',route=>{
        if (route.request().method()!=='POST') return route.continue();
        const methods=route.request().postDataJSON().map(call=>call.methodname);
        const reads=new Set(['core_get_string','core_get_strings','core_output_load_template','core_output_load_template_with_dependencies','core_courseformat_get_state']);
        if (methods.every(method=>reads.has(method))) return route.continue();
        blocked.push(methods);return route.abort('blockedbyclient');
    });
    const paint=async locator=>locator.evaluate(node=>{
        const c=getComputedStyle(node),p=getComputedStyle(node,'::before'),r=node.getBoundingClientRect();
        const parent=node.parentElement.getBoundingClientRect();
        return {text:node.textContent.trim(),font:c.fontFamily,size:c.fontSize,weight:c.fontWeight,color:c.color,
            lineHeight:c.lineHeight,width:r.width,height:r.height,glyph:p.content,glyphFont:p.fontFamily,glyphSize:p.fontSize,
            frameWidth:parent.width,frameHeight:parent.height,
            centreDelta:Math.max(Math.abs(r.x+r.width/2-parent.x-parent.width/2),Math.abs(r.y+r.height/2-parent.y-parent.height/2))};
    });
    try {
        for (const width of [1280,768,390]) {
            await page.setViewportSize({width,height:900});
            if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                await page.locator('[data-easyedu-navigation-open]:visible').first().click();
            }
            const opener=page.locator('[data-easyedu-guide-open]:visible').first();
            await opener.click();
            const guide=page.locator('[data-easyedu-guide-modal]:visible');
            await expect(guide).toBeVisible();
            const guidePaint={title:await paint(guide.locator('header h2')),description:await paint(guide.locator('header p')),
                close:await paint(guide.locator('[data-easyedu-guide-close] span'))};
            const fullscreen=guide.locator('[data-easyedu-guide-fullscreen]:visible span');
            if (await fullscreen.count()) guidePaint.fullscreen=await paint(fullscreen);
            expect(guidePaint.close.centreDelta).toBeLessThan(1);
            await guide.locator('[data-easyedu-guide-close]').hover();
            await expect.poll(async()=> (await paint(guide.locator('[data-easyedu-guide-close] span'))).color).not.toBe(guidePaint.close.color);
            await expect.poll(()=>guide.locator('[data-easyedu-guide-close]').evaluate(node=>node.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
            guidePaint.closeHover=await paint(guide.locator('[data-easyedu-guide-close] span'));
            await guide.locator('[data-easyedu-guide-close]').click();
            await expect(guide).toBeHidden();
            await expect(opener).toBeFocused();
            const backdrop=page.locator('[data-easyedu-navigation-backdrop]:visible');
            if (await backdrop.count()) {
                await page.locator('[data-easyedu-navigation-close]:visible').first().click();
                await expect(backdrop).toBeHidden();
            }
            const eye=page.locator('[data-easystud-open-user]:visible').first();
            await expect(eye).toBeVisible();await eye.click();
            const entity=page.locator('[data-easystud-user-modal]:visible');
            await expect(entity).toBeVisible();
            const entityPaint={eyebrow:await paint(entity.locator('.easyedu-entity-dialog__eyebrow')),
                title:await paint(entity.locator('h3')),close:await paint(entity.locator('[data-easystud-close-user-modal] span'))};
            expect(guidePaint.title.font).toBe(entityPaint.title.font);
            expect(guidePaint.title.size).toBe(entityPaint.title.size);
            expect(guidePaint.title.color).toBe(entityPaint.title.color);
            expect(guidePaint.close.font).toBe(entityPaint.close.font);
            expect(guidePaint.close.weight).toBe('400');
            expect(guidePaint.close.weight).toBe(entityPaint.close.weight);
            expect(guidePaint.close.size).toBe(entityPaint.close.size);
            expect(guidePaint.close.text).toBe('×');
            expect(guidePaint.close.text).toBe(entityPaint.close.text);
            expect(entityPaint.close.centreDelta).toBeLessThan(1);
            expect(Math.abs(guidePaint.close.frameWidth-entityPaint.close.frameWidth)).toBeLessThan(1);
            expect(Math.abs(guidePaint.close.frameHeight-entityPaint.close.frameHeight)).toBeLessThan(1);
            await entity.locator('[data-easystud-close-user-modal]').hover();
            await expect.poll(()=>entity.locator('[data-easystud-close-user-modal]').evaluate(node=>node.getAnimations({subtree:true}).filter(animation=>animation.playState==='running').length)).toBe(0);
            await expect.poll(async()=> (await paint(entity.locator('[data-easystud-close-user-modal] span'))).color).toBe(guidePaint.closeHover.color);
            entityPaint.closeHover=await paint(entity.locator('[data-easystud-close-user-modal] span'));
            rows.push({width,guide:guidePaint,entity:entityPaint});
            await page.screenshot({path:info.outputPath('entity-header-'+width+'.png')});
            await entity.locator('[data-easystud-close-user-modal]').click();
            await expect(entity).toBeHidden();
            await expect(eye).toBeFocused();
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('guide-g11-header-audit.json'),JSON.stringify({rows,errors,blocked,
            scope:'Same-host visible Guide and participant headers; no settings, messages, paths or course transaction'},null,2));
    }
});

