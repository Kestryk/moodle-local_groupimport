const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

// local-supervised: fictional illustrations, isolated reading key; no business commands.
test('Mass Import empty picker prevents preview navigation and shows the Kit warning', async({page}, info) => {
    test.setTimeout(180000);
    const rows = [], errors = [], blocked = [];
    const language = new URL(process.env.EASYEDU_MOODLE_URL).searchParams.get('lang');
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize({width: 390, height: 1000});
    await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'commit', timeout: 60000});
        await page.goto(process.env.EASYEDU_MOODLE_URL, {waitUntil: 'domcontentloaded'});
    }
    page.setDefaultTimeout(15000);
    await page.route('**/local/groupimport/**', route => {
        if (route.request().method() === 'GET') return route.continue();
        blocked.push('plugin write'); return route.abort('blockedbyclient');
    });
    await page.route('**/lib/ajax/service.php*', route => {
        if (route.request().method() !== 'POST') return route.continue();
        const methods = route.request().postDataJSON().map(call => call.methodname);
        if (methods.every(method => method === 'core_message_get_unsent_message')) return route.fulfill({
            status: 200, contentType: 'application/json',
            body: JSON.stringify(methods.map(() => ({error: false, data: {}}))),
        });
        const reads = new Set(['core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state']);
        if (methods.every(method => reads.has(method))) return route.continue();
        blocked.push(methods); return route.abort('blockedbyclient');
    });
    const root=page.locator('#local-groupimport-import');
    try {
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await expect(root).toHaveAttribute('data-easyedu-loading-ready','1');
        await expect(page.locator('html')).toHaveAttribute('lang',new RegExp('^'+language+'(?:-|$)'));
        const deposit=root.locator('.easyedu-file-deposit--moodle'),
            form=deposit.locator('xpath=ancestor::form'),
            notice=form.locator('[data-local-groupimport-file-required]'),
            submit=form.locator('#id_submitbutton'),
            picker=deposit.locator('[id^="filepicker-button-"]');
        await expect(picker).toBeVisible();
        await expect(notice).toHaveCount(1);
        await expect(notice).toBeHidden();
        await expect(form).toHaveAttribute('data-easyedu-import-requirement-bound','1');
        await expect(deposit.locator('.filepicker-filename a')).toHaveCount(0);
        expect(Number(await form.locator('input[name="importfile"]').inputValue())).toBeGreaterThan(0);
        const marker=await page.evaluate(()=>{window.emptyPickerQaMarker=crypto.randomUUID();return window.emptyPickerQaMarker;});
        const url=page.url();
        for(const width of [390,768,1280]) {
            await page.setViewportSize({width,height:1000});
            await expect(submit).toBeEnabled();
            await submit.click();
            await expect(notice).toBeVisible();
            await expect(notice).toHaveClass(/easyedu-notice--warning/);
            await expect(notice).toHaveAttribute('role','alert');
            await expect(picker).toBeFocused();
            await expect(picker).toHaveAttribute('aria-invalid','true');
            expect(page.url()).toBe(url);
            expect(await page.evaluate(()=>window.emptyPickerQaMarker)).toBe(marker);
            const paint=await notice.evaluate(node=>{
                const copy=node.querySelector('p'),box=node.getBoundingClientRect(),
                    text=copy.getBoundingClientRect(),icon=node.querySelector('.fa').getBoundingClientRect();
                return {width:box.width,font:getComputedStyle(copy).fontFamily,size:getComputedStyle(copy).fontSize,
                    copyOverflow:copy.scrollWidth>copy.clientWidth+1,
                    contained:text.left>=box.left&&text.right<=box.right+1&&text.bottom<=box.bottom+1,
                    iconGap:text.left-icon.right,text:copy.textContent.trim()};
            });
            rows.push({width,language,paint,nativeDraftIdWithoutFile:true,noNavigation:true,focusPicker:true});
            expect(paint.copyOverflow).toBe(false);expect(paint.contained).toBe(true);
            expect(paint.iconGap).toBeGreaterThan(0);
            await submit.focus();await page.keyboard.press('Enter');
            await expect(picker).toBeFocused();
            expect(await page.evaluate(()=>window.emptyPickerQaMarker)).toBe(marker);
            await expect(notice).toHaveCount(1);
        }
        expect(errors).toEqual([]);expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('mass-import-file-required-native.json'),JSON.stringify({
            rows,errors,blocked,businessWrites:false,actualUploadTested:false},null,2));
    }
});
