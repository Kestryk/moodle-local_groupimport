const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('K23 Mass Import Cancel and page-selection share Kit paint', async({page}) => {
    test.setTimeout(600000);
    page.setDefaultTimeout(60000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL), out = process.env.K239498_OUT;
    if (base.hostname !== 'localhost' || base.port !== '8052' || !out) throw Error('Owned 8052 only');
    const result = {cases: [], errors: [], drafts: [], importApplied: false};
    const save = () => fs.writeFileSync(out + '/palette.json', JSON.stringify(result, null, 2));
    page.on('pageerror', e => result.errors.push({message: e.message, stack: e.stack}));
    await page.goto(new URL('/login/index.php', base).href, {waitUntil: 'domcontentloaded', timeout: 150000});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'domcontentloaded', timeout: 150000});
    }
    try {
        for (const lang of ['en', 'fr']) {
            await page.setViewportSize({width: 1600, height: 1000});
            await page.goto(new URL('/local/groupimport/index.php?id=71&lang=' + lang, base).href,
                {waitUntil: 'domcontentloaded', timeout: 180000});
            const root = page.locator('#local-groupimport-import');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
            await page.locator('[id^="filepicker-button-"]').click();
            await page.getByRole('tab', {name: /Upload a file|Déposer un fichier/i}).click();
            const filename = 'k23-94-palette-' + Date.now() + '.csv';
            result.drafts.push(filename); save();
            await page.locator('input[type="file"][name="repo_upload_file"]').setInputFiles({
                name: filename, mimeType: 'text/csv', buffer: Buffer.from(
                    'username;group;grouping\nqa_k2394_missing_1;K2394 group;K2394 grouping\n' +
                    'qa_k2394_missing_2;K2394 group;K2394 grouping\n')});
            await page.locator('.fp-upload-btn').click();
            await expect(root.locator('.filepicker-filename a')).toContainText(filename, {timeout: 120000});
            await page.locator('#id_submitbutton').click({noWaitAfter: true});
            await expect(page.locator('[data-local-groupimport-preview-cancel]')).toBeVisible({timeout: 150000});
            for (const width of [1600, 390]) {
                await page.setViewportSize({width, height: 1000});
                for (const selection of ['selected', 'deselected']) {
                    if (selection === 'deselected') {
                        await page.locator('[data-local-groupimport-preview-toggle-all]').click();
                    }
                    await page.mouse.move(0, 0);
                    await page.waitForTimeout(500);
                    const data = await page.evaluate(() => {
                        const root = document.querySelector('#local-groupimport-import');
                        const probe = document.createElement('span');
                        probe.style.color = 'var(--easyedu-tone-primary-ink)';
                        root.append(probe);
                        const expected = getComputedStyle(probe).color; probe.remove();
                        const controls = ['[data-local-groupimport-preview-cancel]',
                            '[data-local-groupimport-preview-toggle-all]'].map(selector => {
                            const e = root.querySelector(selector), s = getComputedStyle(e), r = e.getBoundingClientRect();
                            return {selector, text: e.textContent.trim(), cls: e.className, color: s.color,
                                border: s.borderTopColor, height: r.height, font: s.fontSize,
                                selectedRows: root.querySelectorAll('[data-local-groupimport-preview-row] input:checked').length};
                        });
                        return {expected, controls};
                    });
                    for (const c of data.controls) {
                        expect(c.cls).toContain('foundation-selection-action');
                        expect(c.color).toBe(data.expected);
                        expect(c.border).toBe(data.expected);
                    }
                    expect(Math.abs(data.controls[0].height - data.controls[1].height)).toBeLessThanOrEqual(.5);
                    result.cases.push({lang, width, selection, ...data}); save();
                }
                // Restore the selection for the next viewport; no import is submitted.
                await page.locator('[data-local-groupimport-preview-toggle-all]').click();
            }
            await page.locator('[data-local-groupimport-preview-cancel]').click({noWaitAfter: true});
        }
        expect(result.errors).toEqual([]);
        result.complete = true;
    } finally { save(); }
});
