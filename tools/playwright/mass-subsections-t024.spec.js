const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('T024 paired Mass Import subsections align in French', async ({page}, testInfo) => {
    test.setTimeout(180000);
    const records = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = new URL('/local/groupimport/index.php?id=5&lang=fr', process.env.EASYEDU_MOODLE_URL);
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw Error('Local runtime required');
    try {
        for (const width of [1600, 1280, 390]) {
            await page.setViewportSize({width, height: 1100});
            await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            if (page.url().includes('/login/')) {
                await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
                await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
                await page.locator('#loginbtn').click({noWaitAfter: true});
                await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'commit'});
                await page.goto(url.href, {waitUntil: 'domcontentloaded'});
            }
            const root = page.locator('#local-groupimport-import');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
            await page.evaluate(() => document.fonts.ready);
            const result = await root.evaluate(root => {
                const selectors = ['.easyedu-information__title', '.easyedu-information__description',
                    '.easyedu-information__label', '.easyedu-file-deposit__title',
                    '.easyedu-file-deposit__support', '.easyedu-file-deposit__requirements'];
                const text = selectors.map(selector => {
                    const n = root.querySelector(selector), r = n.getBoundingClientRect();
                    return {selector, x:r.x, right:r.right};
                });
                const surfaces = ['.easyedu-information', '.easyedu-file-deposit--moodle'].map(s => {
                    const n = root.querySelector(s), c = getComputedStyle(n), r = n.getBoundingClientRect();
                    return {x:r.x, right:r.right, background:c.backgroundColor, border:c.borderColor,
                        borderWidth:c.borderTopWidth, radius:c.borderRadius};
                });
                const caption = getComputedStyle(root.querySelector('.easyedu-file-deposit__requirements'));
                const form = root.querySelector('.mform');
                return {text, surfaces, caption:{background:caption.backgroundColor,border:caption.borderTopWidth},
                    method:form.method, sesskey:!!form.querySelector('[name="sesskey"]'),
                    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth};
            });
            records.push({width,...result});
            await root.screenshot({path:testInfo.outputPath(`t024-${width}-fr.png`)});
            const xs = result.text.map(x=>x.x);
            expect(Math.max(...xs)-Math.min(...xs)).toBeLessThanOrEqual(1);
            expect(result.surfaces[0]).toEqual(result.surfaces[1]);
            expect(result.surfaces[0].background).toBe('rgb(255, 255, 255)');
            expect(result.surfaces[0].border).toBe('rgb(200, 214, 227)');
            expect(result.caption).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px'});
            expect(result.text.every(t=>t.right<=result.surfaces[0].right)).toBe(true);
            expect(result.method).toBe('post');
            expect(result.sesskey).toBe(true);
            expect(result.overflow).toBeLessThanOrEqual(2);
        }
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('t024.json'), JSON.stringify({records,errors},null,2));
    }
});
