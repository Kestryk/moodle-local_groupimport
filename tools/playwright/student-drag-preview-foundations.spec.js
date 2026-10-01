const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Native dragstart/dragend only. Never drop or confirm a membership operation.
test('Drag previews match Foundations flair and multiple-only stacks', async({page}, testInfo) => {
    test.setTimeout(180000);
    await page.setViewportSize({width:1600,height:1100});
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(u=>!u.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    const root=page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
    const reports=[];
    for (const type of ['participant','group']) {
        if (type==='group') {
            await root.locator('[data-easystud-layout-mode="structure"]:visible').first().click();
        }
        const cards=root.locator(type==='participant'?'[data-easystud-user]:visible':
            '[data-easystud-group-id]:visible').filter({has:page.locator(':scope > .local-groupimport-easystud-selector')});
        expect(await cards.count()).toBeGreaterThanOrEqual(2);
        const source=cards.first();
        const selectors=[source.locator(':scope > .local-groupimport-easystud-selector'),
            cards.nth(1).locator(':scope > .local-groupimport-easystud-selector')];
        for (const multiple of [false,true]) {
            if (multiple) for (const selector of selectors) await selector.click();
            await page.evaluate(()=>document.activeElement?.blur());
            const transfer=await page.evaluateHandle(()=>new DataTransfer());
            const preview=page.locator('.local-groupimport-easystud-drag-preview');
            try {
                await source.dispatchEvent('dragstart',{dataTransfer:transfer,clientX:420,clientY:400});
                await expect(preview).toBeVisible();
                const badge=preview.locator('.local-groupimport-easystud-drag-preview__badge');
                await expect(badge).toHaveCount(multiple?1:0);
                if (multiple) await expect(badge).toHaveText('+1');
                await expect(preview).toHaveAttribute('aria-hidden','true');
                await expect(preview).toHaveAttribute('inert','');
                const label=await root.getAttribute('data-easystud-drag-moving-label');
                await expect(preview.locator('.local-groupimport-easystud-drag-preview__moving')).toHaveText(label);
                const report=await preview.evaluate(n=>{
                    const front=n.querySelector('.local-groupimport-easystud-drag-preview__card');
                    const moving=n.querySelector('.local-groupimport-easystud-drag-preview__moving');
                    const icon=n.querySelector('.local-groupimport-easystud-drag-preview__moving-icon');
                    const s=getComputedStyle(front), m=getComputedStyle(moving), i=getComputedStyle(icon);
                    return {font:getComputedStyle(n).fontFamily,outline:s.outlineWidth,outlineColor:s.outlineColor,
                        movingFont:m.fontSize,movingWeight:m.fontWeight,movingGap:m.gap,
                        iconWidth:i.width,iconHeight:i.height,mask:i.maskImage,
                        stack:n.classList.contains('has-stack'),before:getComputedStyle(n,'::before').content,
                        after:getComputedStyle(n,'::after').content};
                });
                reports.push({type,multiple,...report});
                fs.writeFileSync(testInfo.outputPath('drag-preview-foundations.json'),JSON.stringify(reports,null,2));
                expect(report.font).toContain('Inter');
                expect(report.outline).toBe('2px');
                expect(report.movingFont).toBe('12px');
                expect(report.movingWeight).toBe('700');
                expect(report.movingGap).toBe('6px');
                expect(report.iconWidth).toBe('16px');
                expect(report.iconHeight).toBe('16px');
                expect(report.mask).not.toBe('none');
                expect(report.stack).toBe(multiple);
                expect(report.before==='none').toBe(!multiple);
                expect(report.after==='none').toBe(!multiple);
                await page.screenshot({path:testInfo.outputPath('drag-'+type+'-'+(multiple?'multiple':'single')+'.png')});
            } finally {
                await source.dispatchEvent('dragend',{dataTransfer:transfer});
                await transfer.dispose();
                await expect(preview).toHaveCount(0);
                if (multiple) for (const selector of selectors) await selector.click();
            }
        }
    }
});
