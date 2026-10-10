// Actual bounded Guide helper + compiled paint; no Moodle data/session.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
assert.ok(process.argv[2], 'Supply Playwright module path');
const {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'amd/src/easyedu_guide.js'), 'utf8');
const slice = (start, end) => {
    const a = source.indexOf(start), b = source.indexOf(end, a);
    assert.ok(a >= 0 && b > a, start); return source.slice(a, b);
};
const helper = slice('const bindNavigationTooltips =', 'const bindGuide =');
const listeners = slice('const addTrackedListener =', 'const setTrackedTimeout =');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
(async() => {
    const browser = await chromium.launch({headless:true, channel:'chrome'});
    let cases = 0;
    try {
        for (const width of [1280, 768, 390]) for (const copy of [
            'Participants',
            'Search and choose the destination group',
            'Rechercher et choisir le groupe de destination']) {
            const page = await browser.newPage({viewport:{width, height:700}});
            await page.setContent('<style>' + css + '</style>' +
                '<div class="local-groupimport-easystud easyedu-ui"><div class="local-groupimport-easystud-easyedu-guide easyedu-guide easyedu-guide--discovery" id="root">' +
                '<div data-easyedu-guide-modal style="position:fixed;inset:0;background:white">' +
                '<nav data-easyedu-guide-nav style="position:absolute;top:30px;left:12px;width:150px">' +
                '<button data-easyedu-guide-nav-item="0"><span class="easyedu-guide-nav-copy"><span id="label"></span></span></button>' +
                '<button data-easyedu-guide-nav-item="1"><span class="easyedu-guide-nav-copy"><span>OK</span></span></button>' +
                '</nav><button id="fullscreen" style="position:absolute;bottom:30px">Fullscreen</button></div></div></div>' +
                '<style>[data-easyedu-guide-nav-item]{width:130px}.easyedu-guide-nav-copy{display:block!important}' +
                '.easyedu-guide-nav-copy>span{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}</style>');
            await page.evaluate(({helper, listeners, copy}) => {
                document.querySelector('#label').textContent = copy;
                window.bindTooltipTest = Function('const SELECTORS={modal:"[data-easyedu-guide-modal]",nav:"[data-easyedu-guide-nav]",' +
                    'navItem:"[data-easyedu-guide-nav-item]"};' + listeners + helper +
                    'return {bind:bindNavigationTooltips,clear:clearTrackedListeners};')();
                window.bindTooltipTest.bind(document.querySelector('#root'));
                document.querySelector('#fullscreen').onclick = () => document.querySelector('[data-easyedu-guide-modal]').requestFullscreen();
            }, {helper, listeners, copy});
            if (copy === 'Participants') await page.locator('[data-easyedu-guide-nav-item="0"]').evaluate(node => { node.style.width = '50px'; });
            const button = page.locator('[data-easyedu-guide-nav-item="0"]');
            const tip = page.locator('.easyedu-guide-label-tooltip');
            console.log(width + ': hover');
            await button.hover();
            await tip.waitFor({state:'visible'});
            assert.equal(await tip.textContent(), copy);
            const paint = await tip.evaluate(node => {
                const style = getComputedStyle(node), rect = node.getBoundingClientRect();
                return {bg:style.backgroundColor, fg:style.color, weight:style.fontWeight, line:style.lineHeight,
                    size:style.fontSize, radius:style.borderRadius, rect:{x:rect.x,y:rect.y,right:rect.right,bottom:rect.bottom},
                    hidden:node.getAttribute('aria-hidden'), owner:node.parentElement.hasAttribute('data-easyedu-guide-modal')};
            });
            assert.equal(paint.bg, 'rgb(248, 251, 253)');
            assert.equal(paint.fg, 'rgb(49, 72, 95)');
            assert.equal(paint.weight, copy === 'Participants' ? '700' : '600');
            assert.equal(paint.size, copy === 'Participants' ? '11.84px' : '12.16px');
            assert.equal(paint.radius, '10.24px');
            assert.ok(paint.rect.x >= 11 && paint.rect.right <= width - 11 && paint.rect.y >= 11 && paint.rect.bottom <= 689);
            assert.equal(paint.hidden, 'true'); assert.ok(paint.owner);
            await button.click(); assert.equal(await tip.count(), 0, 'No click bubble');
            await page.mouse.move(width - 20, 400);
            await page.keyboard.press('Tab');
            await page.keyboard.press('Shift+Tab');
            console.log(width + ': keyboard ' + await page.evaluate(() => document.activeElement.outerHTML.slice(0, 220)));
            await tip.waitFor({state:'visible'});
            await page.keyboard.press('Escape'); assert.equal(await tip.count(), 0);
            await button.hover(); await tip.waitFor({state:'visible'});
            console.log(width + ': scroll cleanup');
            await page.evaluate(() => document.dispatchEvent(new Event('scroll')));
            assert.equal(await tip.count(), 0);
            await page.locator('[data-easyedu-guide-nav-item="1"]').hover();
            assert.equal(await tip.count(), 0, 'Untruncated labels need no bubble');
            await page.locator('#fullscreen').click();
            await page.waitForFunction(() => document.fullscreenElement);
            console.log(width + ': fullscreen');
            // The fullscreen flag precedes the browser's own viewport/scroll
            // events. Wait for that transition to settle, not a product delay.
            await page.evaluate(() => new Promise(resolve => {
                let timer;
                const finish = () => { window.removeEventListener('resize', settle); resolve(); };
                const settle = () => { clearTimeout(timer); timer = setTimeout(finish, 250); };
                window.addEventListener('resize', settle); settle();
            }));
            await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
            await page.mouse.move(width - 20, 400);
            await button.hover();
            console.log('fullscreen probe ' + JSON.stringify(await page.evaluate(() => ({
                tips:document.querySelectorAll('.easyedu-guide-label-tooltip').length,
                labelWidth:document.querySelector('#label').clientWidth,
                contentWidth:document.querySelector('#label').scrollWidth,
                modalHidden:document.querySelector('[data-easyedu-guide-modal]').hidden
            }))));
            await tip.waitFor({state:'visible'});
            assert.ok(await tip.evaluate(node => document.fullscreenElement.contains(node)), 'Actual fullscreen ownership');
            await page.evaluate(() => document.exitFullscreen());
            await page.waitForFunction(() => !document.fullscreenElement && !document.querySelector('.easyedu-guide-label-tooltip'));
            assert.equal(await tip.count(), 0);
            console.log(width + ': fullscreen exited');
            await page.mouse.move(width - 20, 400);
            await button.hover(); await tip.waitFor({state:'visible'});
            await page.evaluate(() => {
                const root = document.querySelector('#root'); root.easyeduGuideTooltipHide();
                window.bindTooltipTest.clear(root); delete root.easyeduGuideTooltipHide;
            });
            assert.equal(await tip.count(), 0);
            await page.locator('[data-easyedu-guide-nav-item="1"]').hover(); await button.hover();
            assert.equal(await tip.count(), 0, 'Tracked handlers removed');
            await page.evaluate(() => window.bindTooltipTest.bind(document.querySelector('#root')));
            console.log(width + ': rebind');
            await page.locator('[data-easyedu-guide-nav-item="1"]').hover(); await button.hover();
            await tip.waitFor({state:'visible'});
            assert.equal(await tip.count(), 1, 'No duplicate on rebind');
            await page.mouse.move(width - 20, 400);
            await page.locator('[data-easyedu-guide-nav]').evaluate((node, width) => {
                node.style.left = (width - 150) + 'px'; node.style.top = '640px';
            }, width);
            await button.hover(); await tip.waitFor({state:'visible'});
            assert.ok(await tip.evaluate(node => node.classList.contains('is-above')), 'Bottom-edge placement');
            const edge = await tip.boundingBox();
            assert.ok(edge.x >= 11 && edge.x + edge.width <= width - 11 && edge.y >= 11 && edge.y + edge.height <= 689);
            await page.close(); cases++;
        }
        console.log('PASS ' + cases + ' localized/width cases: paint, hover, keyboard, click/Escape/scroll, actual fullscreen, teardown/rebind.');
    } finally { await browser.close(); }
})().catch(error => {console.error(error.message);process.exitCode=1;});
