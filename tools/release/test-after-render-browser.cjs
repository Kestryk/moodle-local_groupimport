/* eslint-env node */
// Run against the real AMD module and native DOM mutation delivery, without a Moodle database.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require(process.argv[2]);
const root = path.resolve(__dirname, '../..');
(async () => {
    const browser = await chromium.launch({headless: true,
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'});
    try {
        const page = await browser.newPage();
        await page.setContent('<main id="root"><section id="list"></section></main><aside id="foreign"></aside>');
        await page.evaluate(() => {
            window.module = {};
            window.define = (name, deps, factory) => factory(window.module);
        });
        await page.addScriptTag({content: fs.readFileSync(path.join(root, 'amd/build/local/cm/after_render.min.js'), 'utf8')});
        const result = await page.evaluate(async () => {
            const {onAfterRender, withRenderTransaction, recordRenderedCards, compactRenderScopes} = window.module;
            const root = document.querySelector('#root'), list = document.querySelector('#list');
            const frames = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            const notices = [];
            onAfterRender(root, detail => notices.push(detail));
            const card = document.createElement('article');
            card.setAttribute('data-easystud-user', '7');
            card.innerHTML = '<span class="name">Before</span>';
            const value = withRenderTransaction(root, () => withRenderTransaction(root, () => {
                list.appendChild(card);
                recordRenderedCards(root, list, [card], []);
                card.querySelector('.name').textContent = 'After';
                return 42;
            }));
            await frames();
            const checks = {
                nestedSingleNotification: notices.length === 1,
                returnValue: value === 42,
                scoped: notices[0].subtrees.length === 1 && notices[0].subtrees[0] === list,
                exactAdded: notices[0].addedCards.length === 1 && notices[0].addedCards[0] === card,
                geometry: notices[0].geometryFields.includes('cards') && notices[0].geometryFields.includes('height'),
                compactAncestors: compactRenderScopes(root, [list, card, card.firstChild, card.firstChild.firstChild]).length === 1,
            };
            card.firstChild.firstChild.data = 'Renamed outside the renderer';
            await frames();
            checks.externalText = notices.length === 2 && notices[1].subtrees.includes(card.firstChild);
            checks.generation = notices[1].generation === notices[0].generation + 1;
            document.querySelector('#foreign').textContent = 'Not in this workspace';
            await frames();
            checks.noGlobalNotification = notices.length === 2;
            withRenderTransaction(root, () => {
                card.remove();
                recordRenderedCards(root, list, [], [card]);
            });
            await frames();
            checks.exactRemoved = notices.length === 3 && notices[2].removedCards[0] === card && !notices[2].addedCards.length;
            let decorate = true;
            onAfterRender(root, detail => {
                if (decorate && detail.addedCards.length) {
                    decorate = false;
                    const button = document.createElement('button');
                    button.setAttribute('data-easystud-card-menu', '1');
                    detail.addedCards[0].appendChild(button);
                }
            });
            onAfterRender(root, detail => detail.addedCards.forEach(added => {
                added.querySelectorAll('[data-easystud-card-menu]').forEach(button => button.setAttribute('aria-label', 'Actions'));
            }));
            list.appendChild(card);
            await frames();
            checks.decorationNoFeedback = notices.length === 4 && card.querySelector('button').getAttribute('aria-label') === 'Actions';
            let mutate = true;
            onAfterRender(root, () => {
                if (mutate) {
                    mutate = false;
                    const note = document.createElement('p');
                    note.textContent = 'Unrelated listener output';
                    list.appendChild(note);
                }
            });
            card.firstChild.textContent = 'Another rename';
            await frames();
            await frames();
            checks.unrelatedListenerPreserved = notices.length === 6 && notices[5].subtrees.includes(list);
            const other = document.createElement('main');
            document.body.appendChild(other);
            let otherCount = 0;
            onAfterRender(other, () => otherCount++);
            other.textContent = 'Independent workspace';
            await frames();
            checks.independentRoots = otherCount === 1 && notices.length === 6;
            return checks;
        });
        for (const [name, pass] of Object.entries(result)) assert.equal(pass, true, name);
        console.log(JSON.stringify({pass: Object.keys(result).length, checks: result}));
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
