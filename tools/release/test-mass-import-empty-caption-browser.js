/* eslint-env node */
// Isolated compiled-CSS check; no Moodle session, file upload or settings write.
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.join(path.resolve(process.argv[2]), 'playwright'));

(async() => {
    const browser = await chromium.launch({headless: true});
    try {
        const page = await browser.newPage();
        await page.setContent(`<div class="easyedu-ui local-groupimport-import">
            <div class="easyedu-empty" style="width: 340px">
                <svg class="easyedu-empty__boundary" aria-hidden="true"><rect width="100%" height="100%" rx="13.6"></rect></svg>
                <span class="fa fa-inbox" aria-hidden="true"></span>
                <p>No results to display yet. Upload a CSV file to begin the import.</p>
            </div></div>`);
        await page.addStyleTag({path: path.resolve(__dirname, '../../styles.css')});
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 850});
            const result = await page.locator('.easyedu-empty').evaluate(node => {
                const p = node.querySelector('p');
                const parent = node.getBoundingClientRect();
                const text = p.getBoundingClientRect();
                const boundary = node.querySelector('.easyedu-empty__boundary');
                return {
                    size: getComputedStyle(p).fontSize,
                    dash: getComputedStyle(boundary).strokeDasharray,
                    fits: text.left >= parent.left && text.right <= parent.right &&
                        text.top >= parent.top && text.bottom <= parent.bottom,
                };
            });
            assert.equal(result.size, '12.16px', `${width}px caption role`);
            assert.equal(result.dash, '11px, 11px', `${width}px fixed dashed boundary`);
            assert.equal(result.fits, true, `${width}px text containment`);
        }
        console.log('PASS: Empty-state caption, SVG dash cadence and containment at 1600/768/390.');
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
