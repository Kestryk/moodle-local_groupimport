/* eslint-env node */
'use strict';
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(process.argv[2]);
const output = process.argv[3];
const root = path.resolve(__dirname, '../..');
assert.ok(path.isAbsolute(output));
fs.mkdirSync(output, {recursive: true});
(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    const rows = [], errors = [];
    try {
        for (const width of [1600, 390]) for (const lang of ['fr', 'en']) for (const long of [false, true]) {
            const page = await browser.newPage({viewport: {width, height: 900}, hasTouch: width === 390});
            page.on('pageerror', error => errors.push(error.message));
            page.on('console', message => {if (message.type() === 'error') { errors.push(message.text()); }});
            await page.setContent(`<style>${fs.readFileSync(root + '/styles/student-management.css', 'utf8')
                .replaceAll('../fonts/InterVariable.woff2', 'data:font/woff2;base64,' +
                    fs.readFileSync(root + '/fonts/InterVariable.woff2').toString('base64'))}</style>
                <div class="easyedu-ui" data-easyedu-motion-level="minimal"></div>`);
            const result = await page.evaluate(async({source, lang, long}) => {
                let api;
                window.define = (name, deps, factory) => { api = factory(); };
                Function(source)();
                const banner = api.show({eyebrow: 'EasyStud', title: lang === 'fr' ? 'Modification effectuée' : 'Changes saved',
                    text: long ? (lang === 'fr' ? 'Participants ajoutés : 600 ; déjà présents dans ce groupe : 0.' :
                        'Participants added: 600; already present in this group: 0.') :
                        (lang === 'fr' ? 'Les données du cours sont à jour.' : 'Course data is up to date.'),
                    closeLabel: lang === 'fr' ? 'Fermer' : 'Close', delay: 60000});
                await Promise.all(banner.getAnimations({subtree: true}).map(animation => animation.finished));
                await document.fonts.ready;
                const box = selector => {
                    const e = banner.querySelector(selector), r = e.getBoundingClientRect(), s = getComputedStyle(e);
                    return {width: r.width, height: r.height, top: r.top, bottom: r.bottom,
                        size: parseFloat(s.fontSize), line: parseFloat(s.lineHeight)};
                };
                const close = banner.querySelector('button'), r = close.getBoundingClientRect();
                const centre = [r.x + r.width / 2, r.y + r.height / 2];
                const hit = close.contains(document.elementFromPoint(...centre));
                const glyph = getComputedStyle(close, '::before');
                const probe = document.createElement('span');
                for (const key of ['position', 'width', 'height', 'left', 'top', 'transform', 'transformOrigin']) {
                    probe.style[key] = glyph[key];
                }
                probe.style.setProperty('display', 'block', 'important');
                close.append(probe);
                const g = probe.getBoundingClientRect();
                const glyphCentreDelta = Math.max(Math.abs(g.x + g.width / 2 - centre[0]),
                    Math.abs(g.y + g.height / 2 - centre[1]));
                probe.remove();
                return {panel: box('.easyedu-v3-banner__panel'), eyebrow: box('.easyedu-v3-banner__eyebrow'),
                    title: box('.easyedu-v3-banner__title'), text: box('.easyedu-v3-banner__text'),
                    close: box('button'), glyphCentreDelta, hit, overflow: document.documentElement.scrollWidth > innerWidth};
            }, {source: fs.readFileSync(root + '/amd/build/easyedu_notification.min.js', 'utf8'), lang, long});
            assert.equal(result.close.width, 44); assert.equal(result.close.height, 44);
            assert.ok(result.glyphCentreDelta <= 0.5);
            assert.equal(result.eyebrow.size, 10); assert.equal(result.eyebrow.line, 12);
            assert.equal(result.title.size, 14); assert.equal(result.title.line, 20);
            assert.equal(result.text.size, 13); assert.equal(result.text.line, 18);
            assert.equal(result.panel.height, long && width === 390 ? 90 : 72);
            assert.ok(result.close.bottom <= result.panel.bottom && result.text.bottom <= result.panel.bottom);
            assert.equal(result.hit, true); assert.equal(result.overflow, false);
            rows.push({width, lang, long, ...result});
            await page.close();
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(output + '/notifications.json', JSON.stringify({status: 'PASS', rows, errors}, null, 2));
        console.log(JSON.stringify({status: 'PASS', cases: rows.length, errors: errors.length}));
    } finally { await browser.close(); }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
