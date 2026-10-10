/* eslint-env node */
// Pure actual curriculum renderer; no Moodle session, course writes or media.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {execFileSync} = require('node:child_process');
assert.equal(process.argv.length, 5, 'Usage: <playwright> <mustache> <php>');
const {chromium} = require(process.argv[2]);
const renderer = {module: {exports: {}}};
vm.runInNewContext(fs.readFileSync(process.argv[3], 'utf8')
    .replace('export default mustache;', 'module.exports = mustache;'), renderer);
const root = path.resolve(__dirname, '../..');
const template = fs.readFileSync(path.join(root, 'templates/easyedu_guide.mustache'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const engine = 'window.define=(...args)=>{window.Guide=args.at(-1)();};\n' +
    fs.readFileSync(path.join(root, 'amd/build/easyedu_guide.min.js'), 'utf8');
(async() => {
    const browser = await chromium.launch({headless: true, channel: 'chrome'});
    let cases = 0;
    try {
        for (const language of ['en', 'fr']) {
            const data = JSON.parse(execFileSync(process.argv[4],
                [path.join(__dirname, 'guide-current-curriculum-fixture.php'), language], {encoding: 'utf8'}));
            const slides = data.templateData.slides.filter(slide => slide.commonintroduction);
            assert.equal(slides.length, 10, 'All current consumers, not just the first slide');
            for (const width of [1280, 768, 390]) for (const motion of ['no-preference', 'reduce']) {
                const page = await browser.newPage({viewport: {width, height: 900}, reducedMotion: motion});
                const errors = [];
                page.on('pageerror', error => errors.push(error.message));
                await page.route('**/*', route => route.fulfill({body: '<html></html>'}));
                await page.goto('http://guide-recomposition.test');
                await page.setContent('<style>*{box-sizing:border-box}body{font-family:Arial,sans-serif}' +
                    '[hidden]{display:none!important}' + css + '</style>' +
                    '<div class="local-groupimport-easystud path-local-groupimport easyedu-ui">' +
                    renderer.module.exports.render(template, data.templateData) + '</div>');
                await page.addScriptTag({content: engine});
                await page.evaluate(() => Guide.init('[data-easyedu-guide-root]', {
                    firstVisit: false, fullscreen: true, storageKey: 'recomposition-isolated-qa'
                }));
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                for (const slide of slides) {
                    await page.locator('[data-easyedu-guide-nav-item="' + slide.index + '"]').click();
                    const intro = page.locator('[data-easyedu-guide-slide="' + slide.index + '"] [data-easyedu-guide-introduction]');
                    await intro.waitFor({state: 'visible'});
                    const result = await intro.evaluate(node => {
                        const topics = [...node.querySelectorAll('.easyedu-guide-introduction__topic')]
                            .filter(item => !item.hidden);
                        const failures = [], gaps = [], laneFailures = [];
                        const host = node.getBoundingClientRect();
                        let count = 0;
                        for (const text of node.querySelectorAll('dt > span:last-child, dd:not([data-easyedu-guide-specimen]), p, [data-easyedu-guide-specimen] span:last-child')) {
                            if (text.closest('[hidden]')) continue;
                            count++;
                            const box = text.getBoundingClientRect(), range = document.createRange();
                            range.selectNodeContents(text);
                            if ([...range.getClientRects()].some(rect => rect.left < box.left - 1 || rect.right > box.right + 1 ||
                                rect.bottom > box.bottom + 1 || rect.left < host.left - 1 || rect.right > host.right + 1)) {
                                failures.push(text.textContent);
                            }
                        }
                        for (let i = 1; i < topics.length; i++) gaps.push(
                            topics[i].getBoundingClientRect().top - topics[i - 1].getBoundingClientRect().bottom);
                        const withSpecimens = !!node.querySelector('[data-easyedu-guide-specimen]');
                        for (const topic of topics) {
                            const title = topic.querySelector('dt').getBoundingClientRect();
                            const copy = topic.querySelector('dd').getBoundingClientRect();
                            const sample = topic.querySelector('[data-easyedu-guide-specimen]')?.getBoundingClientRect();
                            if (window.innerWidth < 768 || withSpecimens) {
                                if (copy.top < title.bottom + 11 || Math.abs(copy.left - title.left) > 1) laneFailures.push('reading lane');
                            } else if (copy.left < title.right + 23 || Math.abs(copy.top - title.top) > 1) laneFailures.push('plain desktop lane');
                            if (sample && window.innerWidth >= 768 && sample.left < copy.right + 23) laneFailures.push('desktop specimen lane');
                            if (sample && window.innerWidth < 768 && sample.top < copy.bottom + 19) laneFailures.push('mobile specimen lane');
                        }
                        return {count, topics: topics.length, failures, gaps, laneFailures,
                            overflow: node.scrollWidth > node.clientWidth + 1,
                            columns: getComputedStyle(node.querySelector('dl')).gridTemplateColumns.split(' ').length,
                            label: parseFloat(getComputedStyle(node.querySelector('dt')).fontSize),
                            caption: parseFloat(getComputedStyle(node.querySelector('dd')).fontSize)};
                    });
                    const expected = slide.commonintroduction.topics.filter(topic => !topic.desktopfullscreen || width >= 1024).length;
                    const context = `${slide.id}/${language}/${width}/${motion}`;
                    assert.equal(result.topics, expected, context);
                    assert.ok(result.count >= expected * 2 + 1, context + ': all explanation nodes');
                    assert.deepEqual(result.failures, [], context);
                    assert.deepEqual(result.laneFailures, [], context);
                    assert.equal(result.overflow, false, context);
                    assert.equal(result.columns, 1, context);
                    assert.ok(result.gaps.every(gap => gap >= 23), context + ': row breathing space');
                    assert.ok(Math.abs(result.label - 14.08) < 0.01, context + ': label=' + result.label);
                    assert.ok(Math.abs(result.caption - 12.16) < 0.01, context + ': caption=' + result.caption);
                    cases++;
                }
                assert.deepEqual(errors, []);
                await page.close();
            }
        }
        console.log(`PASS ${cases} current explanations: EN/FR, three widths, normal/reduced, painted copy and row spacing.`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
