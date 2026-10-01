const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// Native start/over/leave/end only. Never drop or confirm a membership operation.
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
    // CSS border widths snap to device pixels. Compare a declared 1.5px probe,
    // not an impossible fractional computed width on DPR=1 Chromium.
    const expectedBorder=await page.evaluate(()=>{
        const probe=document.createElement('span');
        probe.style.border='1.5px solid transparent';
        document.body.appendChild(probe);
        try { return getComputedStyle(probe).borderTopWidth; }
        finally { probe.remove(); }
    });
    const reports=[];
    for (const type of ['participant','group']) {
        if (type==='participant' && !await root.locator('[data-easystud-user-drop]:visible').count()) {
            const grouping=root.locator('[data-easystud-grouping-id]:visible').filter({
                has:page.locator('.local-groupimport-easystud-tree__children > [data-easystud-group-id]')
            }).first();
            await grouping.locator('.local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]').click();
            await expect(root.locator('[data-easystud-user-drop]:visible').first()).toBeVisible({timeout:10000});
        }
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
            const sourceCheckbox=await source.locator(':scope > .local-groupimport-easystud-selector > span').evaluate(n=>{
                const s=getComputedStyle(n);
                return {width:s.width,height:s.height,radius:s.borderRadius,background:s.backgroundColor};
            });
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
                    const input=front.querySelector('[data-easystud-selector-input]');
                    const check=front.querySelector('.local-groupimport-easystud-selector__ui');
                    return {font:getComputedStyle(n).fontFamily,outline:s.outlineWidth,outlineColor:s.outlineColor,
                        movingFont:m.fontSize,movingWeight:m.fontWeight,movingGap:m.gap,
                        iconWidth:i.width,iconHeight:i.height,mask:i.maskImage,
                        stack:n.classList.contains('has-stack'),before:getComputedStyle(n,'::before').content,
                        after:getComputedStyle(n,'::after').content,
                        nativeCheckboxOpacity:getComputedStyle(input).opacity,
                        customCheckOpacity:getComputedStyle(check,'::after').opacity,
                        checkboxWidth:getComputedStyle(check).width,checkboxHeight:getComputedStyle(check).height,
                        checkboxRadius:getComputedStyle(check).borderRadius,
                        checkboxBackground:getComputedStyle(check).backgroundColor,
                        checked:input.checked};
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
                expect(report.nativeCheckboxOpacity).toBe('0');
                expect(report.customCheckOpacity).toBe(report.checked?'1':'0');
                expect(report.checkboxWidth).toBe(sourceCheckbox.width);
                expect(report.checkboxHeight).toBe(sourceCheckbox.height);
                expect(report.checkboxRadius).toBe(sourceCheckbox.radius);
                await page.screenshot({path:testInfo.outputPath('drag-'+type+'-'+(multiple?'multiple':'single')+'.png')});
                const target=root.locator(type==='participant'?'[data-easystud-user-drop]:visible':
                    '[data-easystud-grouping-drop]:visible').first();
                await expect(target).toBeVisible({timeout:10000});
                await target.scrollIntoViewIfNeeded({timeout:10000});
                const box=await target.boundingBox();
                await target.dispatchEvent('dragover',{dataTransfer:transfer,
                    clientX:box.x+box.width/2,clientY:box.y+box.height/2});
                await expect(target).toHaveClass(/is-drop-target/);
                const affordance=await target.evaluate(n=>{
                    const s=getComputedStyle(n,'::after');
                    return {width:s.width,height:s.height,image:s.backgroundImage,size:s.backgroundSize,
                        position:s.backgroundPosition,border:s.borderTopWidth,shadow:s.boxShadow,content:s.content};
                });
                reports[reports.length-1].target=affordance;
                fs.writeFileSync(testInfo.outputPath('drag-preview-foundations.json'),JSON.stringify(reports,null,2));
                expect(affordance.width).toBe('40px');
                expect(affordance.height).toBe('40px');
                expect(affordance.size).toBe('20px 20px');
                expect(affordance.position).toBe('50% 50%');
                expect(affordance.border).toBe(expectedBorder);
                expect(affordance.shadow).toBe('none');
                expect(affordance.image).toContain('data:image/svg+xml');
                expect(affordance.content).toBe('""');
                // Hide only the decorative pointer-following preview for this
                // target capture, otherwise it obscures the centred indicator.
                await preview.evaluate(n=>{ n.style.visibility='hidden'; });
                try {
                    await target.screenshot({path:testInfo.outputPath('target-'+type+'-'+(multiple?'multiple':'single')+'.png')});
                } finally {
                    await preview.evaluate(n=>{ n.style.removeProperty('visibility'); });
                }
                await target.dispatchEvent('dragleave',{dataTransfer:transfer,relatedTarget:null});
                await expect(target).not.toHaveClass(/is-drop-target/);
                if (type==='participant') {
                    const denied=root.locator('[data-easystud-grouping-id].is-user-drop-disabled:visible').first();
                    await expect(denied).toBeVisible({timeout:10000});
                    const accepted=await denied.evaluate((n,dt)=>{
                        const event=new DragEvent('dragover',{bubbles:true,cancelable:true,dataTransfer:dt});
                        n.dispatchEvent(event);
                        return event.defaultPrevented;
                    },transfer);
                    expect(accepted).toBe(false);
                    await expect(denied).toHaveClass(/is-drop-denied/);
                    expect(await transfer.evaluate(dt=>dt.dropEffect)).toBe('none');
                    const danger=await denied.evaluate(n=>{
                        const s=getComputedStyle(n,'::after');
                        return {width:s.width,height:s.height,surface:s.backgroundColor,
                            border:s.borderTopColor,image:s.backgroundImage};
                    });
                    reports[reports.length-1].denied=danger;
                    fs.writeFileSync(testInfo.outputPath('drag-preview-foundations.json'),JSON.stringify(reports,null,2));
                    expect(danger.width).toBe('40px');
                    expect(danger.height).toBe('40px');
                    expect(danger.surface).toBe('rgb(255, 244, 242)');
                    expect(danger.border).toBe('rgb(217, 107, 99)');
                    expect(danger.image).toContain('c9271e');
                    await preview.evaluate(n=>{ n.style.visibility='hidden'; });
                    try {
                        await denied.screenshot({path:testInfo.outputPath('target-denied-'+(multiple?'multiple':'single')+'.png')});
                    } finally {
                        await preview.evaluate(n=>{ n.style.removeProperty('visibility'); });
                    }
                    await target.dispatchEvent('dragover',{dataTransfer:transfer});
                    await expect(denied).not.toHaveClass(/is-drop-denied/);
                    await expect(target).toHaveClass(/is-drop-target/);
                    await target.dispatchEvent('dragleave',{dataTransfer:transfer,relatedTarget:null});
                }
            } finally {
                if (!page.isClosed()) {
                    await root.dispatchEvent('dragend',{dataTransfer:transfer});
                    await transfer.dispose();
                    await expect(preview).toHaveCount(0);
                    if (multiple) for (const selector of selectors) await selector.click();
                }
            }
        }
    }
});
