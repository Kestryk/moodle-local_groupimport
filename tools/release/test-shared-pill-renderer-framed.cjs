/* eslint-env node */
// Successor to the incoming syncTagWindow-only harness: exercise the real shared renderer.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const {chromium} = require(path.resolve(process.argv[2], 'playwright'));
const root = path.resolve(__dirname, '../..'), read = file => fs.readFileSync(path.join(root, file), 'utf8');
const take = (file, start, end) => {const s = read(file); return s.slice(s.indexOf(start), s.indexOf(end)).replaceAll('export const ', 'const ');};
(async() => {
    const browser = await chromium.launch({headless: true});
    const results = [];
    try {
        for (const width of [1600, 390]) {
            const page = await browser.newPage({viewport: {width, height: 1000}});
            await page.setContent('<main id="local-groupimport-easystud" class="easyedu-ui local-groupimport-easystud"><article data-easystud-user data-user-id="7"><div class="local-groupimport-easystud-user__meta"><div class="local-groupimport-easystud-user__meta-tags easyedu-person-card__meta-values" style="display:flex;gap:6px;width:260px"></div></div></article></main>');
            await page.addStyleTag({content: read('styles/student-management.css')});
            await page.addScriptTag({content: `(() => {
                const getLabels = () => ({showless:'Reduce',longlistall:'View all (__total__)'});
                const listPolicy = {tags:{initial:6,ceiling:30}};
                ${take('amd/src/local/cm/long_lists.js', 'export const normaliseTagValue', '/**\n * Bind controls once')}
                ${take('amd/src/local/cm/cards.js', 'const ensureTagToggle', 'export const scheduleParticipantTagOverflow')}
                window.renderShared = syncParticipantTagOverflow;
            })();`});
            for (const count of [0, 1, 3, 12, 37]) {
                const pairs = [];
                for (const payload of [false, true]) {
                    const measured = await page.evaluate(({count, payload}) => {
                        const c = document.querySelector('.local-groupimport-easystud-user__meta-tags'); c.replaceChildren();
                        const values = ['', '-', '\u2212', '\u2014', ...Array.from({length: count}, (_, i) => 'Value ' + i)];
                        c.removeAttribute('data-easystud-long-tags');
                        if (payload) c.setAttribute('data-easystud-long-tags', JSON.stringify(values));
                        c.setAttribute('data-easystud-token-class', 'local-groupimport-easystud-token local-groupimport-easystud-token--group');
                        values.forEach(value => {const t = document.createElement('span'); t.className = c.getAttribute('data-easystud-token-class'); t.textContent = value; c.append(t);});
                        window.renderShared(document.querySelector('main'));
                        return [...c.children].filter(t => !t.hidden).map(t => ({text:t.textContent, title:t.title, height:t.offsetHeight, toggle:t.hasAttribute('data-easystud-toggle-tags')}));
                    }, {count, payload});
                    fs.writeFileSync(process.argv[3], JSON.stringify({width,count,payload,measured,passed:false},null,2));
                    assert(measured.every(t => t.height === 22 && t.title === t.text && /^Value |^\+\d+$/.test(t.text)));
                    const real = measured.filter(t => !t.toggle), toggle = measured.find(t => t.toggle);
                    assert.equal(real.length > 0, count > 0);
                    if (toggle) assert.equal(toggle.text, '+' + (count - real.length));
                    pairs.push(measured); results.push({width, count, payload, measured});
                }
                assert.deepEqual(pairs[0], pairs[1], 'Identical collapsed rendering with and without payload');
            }
            await page.close();
        }
        fs.writeFileSync(process.argv[3], JSON.stringify({passed:true, results}, null, 2));
        console.log('PASS 20 shared-renderer cases: payload/legacy, zero/sentinels, first token, 22px, titles and exact counters');
    } finally {await browser.close();}
})().catch(e => {console.error(e); process.exitCode = 1;});
