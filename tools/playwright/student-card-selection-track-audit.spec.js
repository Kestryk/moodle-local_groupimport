// SM-48 diagnostic, local-supervised. No entity commands or settings Save.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

const runAudit = async ({page}, testInfo) => {
    test.setTimeout(150000);
    const records = [], blocked = [], errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.pathname = '/local/groupimport/manage.php'; url.search = '?id=5';
    const navigate = () => page.goto(url.toString(), {waitUntil:'domcontentloaded', timeout:30000});
    const measure = async (card, titleSelector, state, width, kind) => {
        await card.scrollIntoViewIfNeeded();
        // Await finite existing card transitions, never alter their timing.
        await card.evaluate(async node => {
            await Promise.all(node.getAnimations({subtree:true}).filter(a =>
                Number.isFinite(a.effect.getComputedTiming().endTime)).map(a => a.finished.catch(() => {})));
        });
        const geometry = await card.evaluate((node, selector) => {
            const r = node.getBoundingClientRect();
            const target = node.querySelector(':scope > .local-groupimport-easystud-selector');
            const square = target.querySelector('.local-groupimport-easystud-selector__ui');
            const title = node.querySelector(selector);
            const rect = el => { const b = el.getBoundingClientRect();
                return {left:b.left-r.left,top:b.top-r.top,width:b.width,height:b.height}; };
            const hit = rect(target), text = rect(title), visual = rect(square);
            return {card:{width:r.width,height:r.height},target:hit,title:text,square:visual,
                targetGap:text.left-(hit.left+hit.width),
                squareCentreDelta:Math.abs(visual.top+visual.height/2-text.top-text.height/2),
                overlap:hit.left < text.left+text.width && hit.left+hit.width > text.left &&
                    hit.top < text.top+text.height && hit.top+hit.height > text.top,
                position:getComputedStyle(target).position,transform:getComputedStyle(target).transform};
        }, titleSelector);
        records.push({width,kind,state,geometry});
    };
    try {
        await page.setViewportSize({width:1600,height:1000});
        await page.emulateMedia({reducedMotion:'no-preference'});
        await navigate();
        if (page.url().includes('/login/')) {
            await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
            await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
            await page.locator('#loginbtn').click();
            await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil:'domcontentloaded',timeout:30000});
            await navigate();
        }
        const root = page.locator('#local-groupimport-easystud');
        await expect(root).toHaveAttribute('data-easystud-loading-state','ready',{timeout:60000});
        await page.route('**/local/groupimport/**', async route => {
            if (route.request().method() === 'GET') { await route.continue(); }
            else { blocked.push({method:route.request().method(),path:new URL(route.request().url()).pathname});
                await route.abort('blockedbyclient'); }
        });
        for (const width of [1600,768,390,320]) {
            await page.setViewportSize({width,height:1000});
            await page.evaluate(() => document.fonts.ready);
            const mobileParticipants = root.locator('[data-easystud-mobile-view="participants"]:visible');
            if (await mobileParticipants.count()) { await mobileParticipants.click(); }
            const participantsView = root.locator('[data-easystud-layout-mode="participants"]:visible');
            if (await participantsView.count()) { await participantsView.click(); }
            const card = root.locator('[data-easystud-user]:visible').first();
            await expect(card).toBeVisible();
            await measure(card,'.local-groupimport-easystud-user__name','unselected',width,'participant');
            const label = card.locator(':scope > .local-groupimport-easystud-selector');
            await label.click();
            await expect(card).toHaveClass(/is-selected/);
            await measure(card,'.local-groupimport-easystud-user__name','sole-selected',width,'participant');
            await label.click();
            await expect(card).not.toHaveClass(/is-selected/);
            const structure = root.locator('[data-easystud-layout-mode="structure"]:visible');
            if (await structure.count()) { await structure.click(); }
            for (const [kind,title,selector] of [
                ['group','.local-groupimport-easystud-group__name','[data-easystud-group-id]'],
                ['grouping','.local-groupimport-easystud-grouping__name','[data-easystud-grouping-id]'],
            ]) {
                const mobile = root.locator(`[data-easystud-mobile-view="${kind === 'group' ? 'groups' : 'groupings'}"]:visible`);
                if (await mobile.count()) { await mobile.click(); }
                const entity = root.locator(`${selector}:visible`).filter({has:page.locator(title)}).first();
                if (await entity.count()) { await measure(entity,title,'current-header',width,kind); }
            }
        }
        expect(errors).toEqual([]); expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('card-selection-track-audit.json'),
            JSON.stringify({status:'diagnostic-not-acceptance',records,blocked,errors},null,2));
    }
};

test('Audit Student card selection header tracks without entity writes', runAudit);

test('Student selection header anchor stays stable after sole selection', async ({page}, testInfo) => {
    await runAudit({page}, testInfo);
    const proof = JSON.parse(fs.readFileSync(testInfo.outputPath('card-selection-track-audit.json'),'utf8'));
    expect(proof.records.length).toBeGreaterThanOrEqual(12);
    for (const record of proof.records) {
        expect(record.geometry.overlap).toBe(false);
        expect(record.geometry.targetGap).toBeGreaterThanOrEqual(4);
    }
    const desktop = proof.records.filter(r => r.width === 1600 && r.kind === 'participant');
    expect(desktop.length).toBe(2);
    expect(Math.abs(desktop[0].geometry.target.top-desktop[1].geometry.target.top)).toBeLessThanOrEqual(1);
    for (const record of desktop) { expect(record.geometry.squareCentreDelta).toBeLessThanOrEqual(2); }
});
