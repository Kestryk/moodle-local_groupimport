const {test,expect}=require('@playwright/test');
const fs=require('node:fs');

// local-supervised: existing native More-filters controls, no business POST/fixture.
test('More filters share calm hover touch geometry and retain disclosure Motion',async({page},testInfo)=>{
    test.setTimeout(180000);const records=[],blocked=[],errors=[];
    const root=page.locator('#local-groupimport-easystud');
    await page.emulateMedia({reducedMotion:'no-preference'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/local/groupimport/**',async route=>{
        if(route.request().method()!=='GET'){blocked.push(route.request().method());await route.abort('blockedbyclient');}
        else await route.continue();
    });
    for(const width of [1600,768,390]){
        await page.setViewportSize({width,height:1100});await page.goto(process.env.EASYEDU_MOODLE_URL);
        if(page.url().includes('/login/')){
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();await page.waitForURL(u=>!u.pathname.includes('/login/'));
            await page.goto(process.env.EASYEDU_MOODLE_URL);
        }
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await root.locator(width>1024?'[data-easystud-layout-mode="participants"]:visible':
            '[data-easystud-mobile-view="participants"]:visible').click();
        const button=root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible');
        const panel=root.locator('[data-easystud-advanced-filters="participants"]');
        await expect(button).toHaveAttribute('aria-expanded','false');
        await button.hover();await page.waitForTimeout(150);
        const paint=await button.evaluate(n=>{const s=getComputedStyle(n),r=n.getBoundingClientRect();
            return {font:s.fontSize,gap:s.gap,border:s.borderTopColor,background:s.backgroundColor,color:s.color,
                h:r.height,x:r.x,right:r.right,viewport:innerWidth};});
        expect(paint.font).toBe('12.16px');expect(paint.gap).toBe('6.72px');
        expect(paint.border).toBe('rgb(200, 214, 227)');expect(paint.background).toMatch(/0\.94|240/);
        expect(paint.h).toBeGreaterThanOrEqual(width>1024?33.5:44);
        expect(paint.x).toBeGreaterThanOrEqual(0);expect(paint.right).toBeLessThanOrEqual(width);
        await button.screenshot({path:testInfo.outputPath('more-filters-hover-'+width+'.png')});
        await page.mouse.move(1,1);await button.focus();await page.keyboard.press('Tab');await page.keyboard.press('Shift+Tab');
        await expect(button).toBeFocused();await page.waitForTimeout(150);
        expect(await button.evaluate(n=>n.matches(':focus-visible'))).toBe(true);
        expect(await button.evaluate(n=>getComputedStyle(n).borderTopColor)).toBe('rgb(138, 188, 227)');
        await panel.evaluate(n=>{
            window.__easyeduMoreMotion=[];
            window.__easyeduMoreObserver=new MutationObserver(()=>{
                if(n.classList.contains('is-easyedu-disclosing'))window.__easyeduMoreMotion.push(n.getAttribute('aria-hidden'));
            });
            window.__easyeduMoreObserver.observe(n,{attributes:true,attributeFilter:['class']});
        });
        await button.click();await expect(button).toHaveAttribute('aria-expanded','true');
        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
        expect(await panel.evaluate(n=>n.inert)).toBe(false);
        await panel.locator('..').screenshot({path:testInfo.outputPath('more-filters-expanded-'+width+'.png')});
        await button.click();await expect(button).toHaveAttribute('aria-expanded','false');
        await expect(panel).not.toHaveClass(/is-easyedu-disclosing/);
        expect(await panel.evaluate(n=>n.inert)).toBe(true);
        const transitions=await page.evaluate(()=>{window.__easyeduMoreObserver.disconnect();return window.__easyeduMoreMotion;});
        expect(transitions).toContain('false');expect(transitions).toContain('true');
        records.push({width,paint,openingAndClosingMotionObserved:true});
        fs.writeFileSync(testInfo.outputPath('more-filters-native.json'),JSON.stringify({records,blocked,errors},null,2));
    }
    expect(blocked).toEqual([]);expect(errors).toEqual([]);
});
