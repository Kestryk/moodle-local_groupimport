// ci-reusable, isolated HTML only. No Moodle/login/fixture/lease or business write.
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.argv[2]);
const output = path.resolve(process.argv[3]);
const approved = path.resolve(process.env.LOCALAPPDATA, 'EasyEdu', 'artifacts', 'kit');
if (!output.startsWith(approved + path.sep) || fs.existsSync(output)) {
    throw new Error('Supply a new owned external Kit artifact directory.');
}
const root = path.resolve(__dirname, '../..');
const assert = (value, message) => { if (!value) throw new Error(message); };
(async () => {
    fs.mkdirSync(output, {recursive: true});
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    const records = [];
    try {
        const page = await browser.newPage();
        const source = fs.readFileSync(path.join(root, 'amd/src/searchable_choices.js'), 'utf8');
        const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 850});
            await page.setContent('<main class="local-groupimport-easystud easyedu-ui"><h1>Destination action</h1>' +
                '<label for="destination">Destination group</label><select id="destination">' +
                '<option value="0">Without grouping</option><option value="1">Équipe A</option>' +
                '<option value="2">Workshop B</option><option value="3" disabled>Locked group</option>' +
                '<option value="4">&lt;img src=x onerror=alert(1)&gt;</option></select>' +
                '<button id="cancel" type="button">Cancel</button></main>');
            await page.addStyleTag({content: css + '\nmain {box-sizing:border-box;max-width:34rem;padding:1rem;margin:auto;}'});
            await page.addScriptTag({content: source.replace('export const enhanceSelect =', 'window.enhanceSelect =')});
            await page.evaluate(() => {
                window.choice = window.enhanceSelect(document.querySelector('select'), {
                    label: 'Destination group', search: 'Search destinations', empty: 'No matching destinations',
                });
                window.changes = 0;
                document.querySelector('select').addEventListener('change', () => { window.changes++; });
                window.escaped = 0;
                document.addEventListener('keydown', event => { if (event.key === 'Escape') window.escaped++; });
            });
            const trigger = page.locator('.easyedu-searchable-choice__trigger');
            assert(await page.locator('select').isHidden(), 'native fallback hidden only after enhancement');
            await page.getByText('Destination group', {exact: true}).click();
            const search = page.getByRole('searchbox');
            assert(await trigger.getAttribute('aria-expanded') === 'true', 'visible label must activate its labelled trigger');
            assert(await search.evaluate(node => node === document.activeElement), 'label activation opens and focuses search');
            await search.fill('equipe');
            assert(await page.locator('.easyedu-searchable-choice__option:visible').count() === 1, 'accent-insensitive filtering');
            assert(await page.locator('select').inputValue() === '0', 'search must preserve value zero');
            await page.getByRole('button', {name: 'Équipe A', exact: true}).click();
            assert(await page.locator('select').inputValue() === '1', 'choice must sync native value');
            assert(await trigger.getAttribute('aria-label') === 'Destination group: \u00c9quipe A',
                'trigger accessible name must expose both role and current choice');
            assert(await trigger.evaluate(node => node === document.activeElement), 'choice returns focus');
            assert(await page.evaluate(() => window.changes) === 1, 'one native change event per choice');
            await trigger.click();
            await search.fill('missing destination');
            assert(await page.getByRole('status').isVisible(), 'empty result must be visible');
            assert(await page.locator('select').inputValue() === '1', 'empty search must retain selection');
            await search.press('Escape');
            assert(await page.evaluate(() => window.escaped) === 0, 'inner Escape must not close enclosing modal');
            assert(await trigger.getAttribute('aria-expanded') === 'false', 'Escape collapses choices');
            await trigger.click();
            await search.fill('');
            assert(await page.getByRole('button', {name: 'Locked group'}).isDisabled(), 'disabled options remain disabled');
            assert(await page.locator('.easyedu-searchable-choice img').count() === 0, 'plain option text cannot inject HTML');
            await search.press('Tab');
            assert(await page.locator('.easyedu-searchable-choice__option').first().evaluate(n => n === document.activeElement),
                'Tab must reach first real option');
            const geometry = await trigger.evaluate(node => {
                const r = node.getBoundingClientRect(), s = getComputedStyle(node);
                const row = document.querySelector('.easyedu-searchable-choice__option').getBoundingClientRect();
                return {height:r.height, rowHeight:row.height, font:s.fontSize, radius:s.borderTopLeftRadius, color:s.color,
                    contained:r.left >= 0 && r.right <= innerWidth, width:r.width};
            });
            assert(geometry.contained, 'narrow trigger must fit viewport');
            assert(geometry.height >= (width <= 768 ? 44 : 38), 'shared density / touch height');
            assert(geometry.font === '14px', 'shared field typography');
            assert(geometry.radius === '11.52px', 'canonical control radius must be active');
            assert(geometry.color === 'rgb(30, 52, 72)', 'canonical field text token must be active');
            await page.screenshot({path:path.join(output, `choice-open-${width}.png`)});
            // Refresh options/destination label without changing keyboard contract.
            await page.evaluate(() => {
                const option = document.createElement('option'); option.value = '5'; option.textContent = 'New grouping';
                document.querySelector('select').append(option);
                window.choice.refresh({label:'Destination grouping', search:'Search groupings', empty:'No matches'});
            });
            assert(await trigger.getAttribute('aria-label') === 'Destination grouping: \u00c9quipe A',
                'refresh updates translated role and preserves accessible selected value');
            await trigger.click();
            assert(await page.getByRole('button', {name:'New grouping'}).count() === 1, 'refresh exposes newly rebuilt options');
            await page.evaluate(() => window.choice.destroy());
            assert(await page.locator('select').isVisible(), 'destroy restores native fallback');
            assert(await page.locator('label').getAttribute('for') === 'destination', 'destroy restores original label');
            records.push({viewportWidth:width, ...geometry, interactions:'PASS'});
        }
        fs.writeFileSync(path.join(output, 'choices.json'), JSON.stringify({records, moodleAccess:false, businessWrite:false}, null, 2));
        console.log(JSON.stringify({status:'PASS', records, output, moodleAccess:false, businessWrite:false}));
    } catch (error) {
        fs.writeFileSync(path.join(output, 'failure.json'), JSON.stringify({message:error.message, records, moodleAccess:false}));
        throw error;
    } finally {
        await browser.close();
        fs.writeFileSync(path.join(output, 'cleanup.json'), JSON.stringify({ownedBrowserClosed:true, moodleAccess:false}));
    }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
