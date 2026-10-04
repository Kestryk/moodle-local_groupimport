/* eslint-env node */
// Isolated compiled-CSS framing proof, not native upload or disclosure proof.
const assert = require('node:assert/strict');
const path = require('node:path');
const {chromium} = require(path.join(path.resolve(process.argv[2]), 'playwright'));

(async() => {
    const browser = await chromium.launch({headless: true});
    try {
        const page = await browser.newPage();
        await page.emulateMedia({reducedMotion: 'reduce'});
        await page.setContent(`<main class="easyedu-ui local-groupimport-import has-preview is-upload-collapsed">
            <div class="local-groupimport-import__grid">
                <section class="local-groupimport-import-card local-groupimport-import-card--upload easyedu-panel">
                    <div class="local-groupimport-import-card__header easyedu-panel__header easyedu-panel__header--compact-icon">
                        <span class="fa fa-file-csv easyedu-icon-tile easyedu-icon-tile--compact" aria-hidden="true"></span>
                        <div class="easyedu-panel__copy"><h3 class="easyedu-panel__title">Import file</h3></div>
                        <button class="btn local-groupimport-import-card__toggle" type="button" aria-label="Expand upload"></button>
                    </div>
                </section>
                <section class="local-groupimport-import-card local-groupimport-import-card--results easyedu-panel"></section>
            </div>
        </main>`);
        await page.addStyleTag({path: path.resolve(__dirname, '../../styles.css')});
        for (const width of [1600, 1440]) {
            await page.setViewportSize({width, height: 900});
            const metrics = await page.locator('.local-groupimport-import-card--upload').evaluate(card => {
                const rail = card.getBoundingClientRect();
                const tile = card.querySelector('.easyedu-icon-tile').getBoundingClientRect();
                return {railWidth: rail.width, tileWidth: tile.width,
                    centerDelta: Math.abs(tile.left + tile.width / 2 - rail.left - rail.width / 2)};
            });
            assert.ok(Math.abs(metrics.railWidth - 77.6) < 0.1, `${width}px collapsed rail contract`);
            assert.ok(Math.abs(metrics.tileWidth - 35.2) < 0.1, `${width}px compact icon family`);
            assert.ok(metrics.centerDelta <= 1, `${width}px CSV centre delta ${metrics.centerDelta}`);
        }
        console.log('PASS: compact CSV tile centred in the settled collapsed rail at 1600/1440.');
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
