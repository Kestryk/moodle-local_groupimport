// Native served-source check: commands only open and close details; no Save.
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const rootPath = path.resolve(__dirname, '../..');
const expected = {
    en: {group: 'Group details', grouping: 'Grouping details', participant: 'Participant details'},
    fr: {group: 'Détails du groupe', grouping: 'Détails du groupement', participant: 'Détails du participant'}
};

test('K23-53 localized detail commands fit all card families', async({page}, info) => {
    test.setTimeout(540000);
    const records = [], errors = [];
    const base = process.env.EASYEDU_MOODLE_URL;
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base, {waitUntil: 'domcontentloaded', timeout: 120000});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('input[name="password"]').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(url => !url.pathname.includes('/login/'), {waitUntil: 'domcontentloaded', timeout: 120000});
    }
    const fit = async locator => locator.evaluate(element => {
        const range = document.createRange(); range.selectNodeContents(element);
        const rects = [...range.getClientRects()].filter(rect => rect.width && rect.height);
        const box = element.getBoundingClientRect();
        return {width: box.width, scrollWidth: element.scrollWidth, clientWidth: element.clientWidth,
            clipped: rects.some(rect => rect.left < box.left - 0.5 || rect.right > box.right + 0.5 ||
                rect.top < box.top - 0.5 || rect.bottom > box.bottom + 0.5)};
    });
    try {
        for (const lang of ['en', 'fr']) for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1000});
            const url = new URL(base); url.searchParams.set('lang', lang);
            await page.goto(url.href, {waitUntil: 'domcontentloaded', timeout: 120000});
            await expect(page.locator('html')).toHaveAttribute('lang', lang);
            const root = page.locator('#local-groupimport-easystud');
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 120000});
            const labels = expected[lang];
            const menu = root.locator('[data-easystud-context-menu]');
            for (const kind of ['participant', 'group', 'grouping']) {
                const action = kind === 'participant' ? 'participant-open-details' : kind + '-open-advanced-settings';
                const command = menu.locator('[data-easystud-context-action="' + action + '"]');
                await expect(command).toHaveCount(1);
                await expect(command).toContainText(labels[kind]);
            }
            const directGroups = await root.locator('[data-easystud-open-advanced-settings][aria-label]').evaluateAll(nodes =>
                nodes.map(node => ({kind: node.getAttribute('data-easystud-advanced-target'),
                    aria: node.getAttribute('aria-label'), help: node.getAttribute('data-easystud-hover-help')})));
            for (const value of directGroups) {
                expect(value.aria).toBe(labels[value.kind]); expect(value.help).toBe(labels[value.kind]);
            }
            expect(directGroups.some(value => value.kind === 'group')).toBe(true);
            expect(directGroups.some(value => value.kind === 'grouping')).toBe(true);
            for (const kind of ['participant', 'group', 'grouping']) {
                if (width === 390) await root.locator('[data-easystud-mobile-view="' +
                    (kind === 'participant' ? 'participants' : kind === 'group' ? 'groups' : 'groupings') + '"]:visible').click();
                else if (kind !== 'participant') await root.locator('[data-easystud-layout-mode="structure"]:visible').click();
                const selector = kind === 'participant' ? '[data-easystud-user]:visible' :
                    kind === 'group' ? '[data-easystud-structure-groups] [data-easystud-advanced-type="group"]:visible' :
                        '[data-easystud-tree] [data-easystud-advanced-type="grouping"]:visible';
                const card = root.locator(selector).first();
                await expect(card).toBeVisible();
                const direct = card.locator(kind === 'participant' ? '[data-easystud-open-user]' :
                    ':scope > .local-groupimport-easystud-' + kind + '__header > [data-easystud-open-advanced-settings]');
                await expect(direct).toHaveAttribute('aria-label', labels[kind]);
                await expect(direct).toHaveAttribute('data-easystud-hover-help', labels[kind]);
                const record = {lang, width, kind, direct: labels[kind], directButtonsChecked: directGroups.length};
                if (kind === 'participant') {
                    await card.click({button: 'right'});
                    const command = menu.locator('[data-easystud-context-action="participant-open-details"]');
                    await expect(command).toBeVisible();
                    record.menu = await fit(command); expect(record.menu.clipped).toBe(false);
                    await command.click();
                } else if (await direct.isVisible()) {
                    await direct.click(); record.openedBy = 'direct';
                } else {
                    await card.click({button: 'right'});
                    const command = menu.locator('[data-easystud-context-action="' + kind + '-open-advanced-settings"]');
                    await expect(command).toBeVisible();
                    record.menu = await fit(command); expect(record.menu.clipped).toBe(false);
                    await command.click(); record.openedBy = 'menu';
                }
                const modal = root.locator(kind === 'participant' ? '[data-easystud-user-modal]:visible' :
                    '[data-easystud-advanced-settings-modal]:visible');
                await expect(modal).toBeVisible();
                const heading = modal.locator('h3').first(); await expect(heading).toHaveText(labels[kind]);
                record.heading = await fit(heading); expect(record.heading.clipped).toBe(false);
                if (width === 390 && kind === 'grouping') await page.screenshot({path: info.outputPath('details-' + lang + '-390.png')});
                const close = modal.locator(kind === 'participant' ? '[data-easystud-close-user-modal]' :
                    '[data-easystud-close-advanced-settings]').first();
                await close.click(); await expect(modal).toBeHidden(); records.push(record);
            }
        }
        expect(records).toHaveLength(12); expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(info.outputPath('detail-labels.json'), JSON.stringify({records, errors, sourceRoot: rootPath, businessWritesRequested: false}, null, 2));
    }
});