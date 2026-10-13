const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

// Supervised principal-preview check: temporary config only; no course writes.
// CLI avoids the admin page's unrelated cache purge and remains usable after
// a browser failure. Both the scenario and its finally restore Current.
test.use({actionTimeout: 15000, navigationTimeout: 60000});
const moodleRoot = process.env.EASYEDU_MOODLE_ROOT || path.resolve(process.cwd(), '../..');
const php = process.env.EASYEDU_PHP_EXECUTABLE ||
    (process.platform === 'win32' ? path.resolve(moodleRoot, '../php/php.exe') : 'php');
const setRenderingMode = mode => {
    if (!['legacy', 'reactive'].includes(mode) || !fs.existsSync(path.join(moodleRoot, 'config.php'))) {
        throw new Error('Explicit local Moodle root and supported rendering mode required');
    }
    const value = execFileSync(php, ['-r',
        "define('CLI_SCRIPT', true); require $argv[1].'/config.php'; " +
        "set_config('renderingmode', $argv[2], 'local_groupimport'); " +
        "echo get_config('local_groupimport', 'renderingmode');", moodleRoot, mode],
    {cwd: moodleRoot, encoding: 'utf8', timeout: 30000}).trim();
    expect(value).toBe(mode);
};
const login = async page => {
    const url = new URL('/local/groupimport/manage.php?id=5', process.env.EASYEDU_MOODLE_URL);
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) {
        throw new Error('Local Moodle only');
    }
    url.searchParams.set('lang', 'fr');
    await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(current => !current.pathname.includes('/login/'), {waitUntil: 'commit'});
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    }
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr');
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    return root;
};
const settle = root => root.evaluate(node => Promise.all(node.getAnimations({subtree: true})
    .filter(animation => Number.isFinite(animation.effect?.getComputedTiming().endTime))
    .map(animation => animation.finished.catch(() => {}))));
const switchView = async (root, view, width) => {
    const selector = width <= 1024 ? '[data-easystud-mobile-view="' +
        (view === 'structure' ? 'groups' : 'participants') + '"]:visible' :
        '[data-easystud-layout-mode="' + view + '"]:visible';
    await root.locator(selector).first().click();
    await settle(root);
};
const openMemberSearch = async (root, card) => {
    let toggle = card.locator('[data-easystud-group-member-search-toggle]:visible').first();
    if (!await toggle.count()) {
        const menu = card.locator('[data-easystud-group-actions-toggle]:visible, ' +
            '[data-easystud-card-menu]:visible').first();
        await expect(menu).toBeVisible();
        await menu.click();
        toggle = card.locator('[data-easystud-group-actions-menu] ' +
            '[data-easystud-group-member-search-toggle]:visible').first();
        if (!await toggle.count()) {
            toggle = root.locator('[data-easystud-context-menu] ' +
                '[data-easystud-context-action="group-search-members"]:visible').first();
        }
    }
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(card.locator('[data-easystud-group-member-search]')).toBeVisible();
};
const clipboard = async root => {
    await root.locator('[data-easystud-open-clipboard]:visible, ' +
        '[data-easyedu-navigation-action="open-clipboard"]:visible').first().click();
    const modal = root.locator('[data-easystud-clipboard-modal]');
    await expect(modal).toBeVisible();
    await modal.locator('[data-easystud-paste-box]').fill('test.etudiant.01@example.com');
    const token = modal.locator('[data-easystud-paste-results] .local-groupimport-easystud-token--valid');
    await expect(token).toHaveCount(1);
    const result = await token.textContent();
    await modal.locator('[data-easystud-close-clipboard]').click();
    await expect(modal).toBeHidden();
    return result;
};
const headerSnapshot = cards => cards.evaluateAll(nodes => nodes.map(card => {
    const header = card.querySelector('.local-groupimport-easystud-group__header');
    const visible = element => element && !element.hidden && element.getClientRects().length > 0;
    const menu = header.querySelector('[data-easystud-group-actions-menu]');
    const tags = header.querySelector('.local-groupimport-easystud-group__groupings--inline');
    return {id: card.getAttribute('data-easystud-group-id'),
        actionMenu: !!visible(header.querySelector('[data-easystud-group-actions-toggle]')),
        menuActions: Array.from(menu?.querySelectorAll('button') || [])
            .map(button => button.getAttribute('aria-label') || button.textContent.trim()),
        maskedGroupings: card.classList.contains('is-groupings-summary-hidden'),
        groupingTags: Array.from(tags?.querySelectorAll('.local-groupimport-easystud-token') || [])
            .map(tag => tag.textContent.trim()),
        rows: card.querySelectorAll('[data-easystud-member-id]').length,
        total: Number(card.getAttribute('data-easystud-member-total')) ||
            card.querySelectorAll('[data-easystud-member-id]').length};
}));

test('SM-RENDU grouped C9, lean members and card header parity', async ({page}, info) => {
    test.setTimeout(300000);
    const report = {surface: 'SM-RENDU-C9-suite', niveau: 1, language: 'fr', phase: 'initial',
        modes: {}, headers: [], errors: [], expectedFailureLogs: [], businessWrites: [], restoredCurrent: false};
    const save = () => fs.writeFileSync(info.outputPath('sm-rendu-c9-native.json'), JSON.stringify(report, null, 2));
    let injectFailure = false;
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') (injectFailure ? report.expectedFailureLogs : report.errors).push(message.text());
    });
    await page.route('**/local/groupimport/**', route => {
        const request = route.request();
        if (request.method() === 'GET') return route.continue();
        report.businessWrites.push({method: request.method(), path: new URL(request.url()).pathname});
        return route.abort();
    });
    try {
        for (const mode of ['legacy', 'reactive']) {
            report.phase = mode + '-1280'; save();
            setRenderingMode(mode);
            await page.setViewportSize({width: 1280, height: 900});
            let root = await login(page);
            if (mode === 'reactive') await expect(root).toHaveAttribute('data-easystud-sm-ready', '1');
            report.modes[mode] = {greenClipboardToken: await clipboard(root)};
            await switchView(root, 'structure', 1280);
            const list = root.locator('.local-groupimport-easystud-structure-groups__list');
            const cards = list.locator(':scope > [data-easystud-group-id]:visible');
            await expect(cards).toHaveCount(10);
            const usableIndex = await cards.evaluateAll(nodes => nodes.findIndex(card => {
                const toggle = card.querySelector('[data-easystud-group-members-toggle]');
                const count = Number(card.getAttribute('data-easystud-member-total')) ||
                    card.querySelectorAll('[data-easystud-member-id]').length;
                return count > 2 && toggle && !toggle.hidden && toggle.getClientRects().length > 0;
            }));
            expect(usableIndex, 'Course 5 must contain a genuinely unfoldable group; no fixture is created').toBeGreaterThanOrEqual(0);
            let card = cards.nth(usableIndex);
            const groupid = await card.getAttribute('data-easystud-group-id');
            const initial = (await headerSnapshot(card))[0];
            report.modes[mode].initialMembers = initial;
            if (mode === 'reactive') expect(initial.rows).toBe(2);
            report.phase = mode + '-unfold'; save();
            await card.locator('[data-easystud-group-members-toggle]:visible').click();
            await settle(root);
            const members = card.locator('[data-easystud-member-id]');
            expect(await members.count()).toBe(initial.total);
            const member = members.nth(2); // exercises a row absent from the lean render.
            const memberid = await member.getAttribute('data-easystud-member-id');
            await member.locator('label').click();
            await expect(member).toHaveClass(/is-selected/);
            await expect(member.locator('input')).toBeChecked();
            await expect(root.locator('[data-easystud-clear-selection-count]')).toContainText('1');
            const query = (await member.locator('.local-groupimport-easystud-member__name').textContent())
                .trim().split(/\s+/).sort((left, right) => right.length - left.length)[0];
            await openMemberSearch(root, card);
            await card.locator('[data-easystud-group-member-search]').fill(query);
            report.phase = mode + '-paging'; save();
            const pager = list.locator(':scope > [data-easystud-pagination="top"]');
            await pager.locator('[data-easystud-page-next]').click();
            await expect(pager.locator('[data-easystud-page-prev]')).toBeEnabled();
            await settle(root);
            await pager.locator('[data-easystud-page-prev]').click();
            card = list.locator(':scope > [data-easystud-group-id="' + groupid + '"]');
            await expect(card).toBeVisible();
            await expect(card.locator('[data-easystud-group-members-toggle]')).toHaveAttribute('aria-expanded', 'true');
            await expect(card.locator('[data-easystud-member-id="' + memberid + '"] input')).toBeChecked();
            await expect(root.locator('[data-easystud-clear-selection-count]')).toContainText('1');
            await expect(card.locator('[data-easystud-group-member-search]')).toBeVisible();
            await expect(card.locator('[data-easystud-group-member-search]')).toHaveValue(query);
            report.modes[mode].retained = {groupid, memberid, unfolded: true, selected: true, count: 1, search: query};
            // Clean presentation state by a real reload before each header sample.
            for (const width of [1280, 390]) {
                for (const view of ['structure', 'participants']) {
                    report.phase = mode + '-' + width + '-' + view; save();
                    await page.setViewportSize({width, height: 900});
                    root = await login(page);
                    await switchView(root, view, width);
                    // On mobile Participants intentionally shows only participants;
                    // the Groups tab exposes its equivalent group catalogue.
                    if (width <= 1024 && view === 'participants') {
                        await root.locator('[data-easystud-mobile-view="groups"]:visible').click();
                        await settle(root);
                    }
                    const className = width <= 1024 || view === 'structure' ?
                        '.local-groupimport-easystud-structure-groups__list' :
                        '.local-groupimport-easystud-participant-groups__list';
                    const rows = root.locator(className + ' > [data-easystud-group-id]:visible');
                    await expect(rows).toHaveCount(10);
                    const sample = {mode, width, view, cards: await headerSnapshot(rows)};
                    report.headers.push(sample); save();
                    const target = rows.first();
                    await openMemberSearch(root, target);
                    await target.locator('[data-easystud-group-member-search]').fill('Admin');
                    await target.locator('[data-easystud-group-member-search-cancel]').click();
                    await expect(target.locator('[data-easystud-group-member-search]')).toBeHidden();
                    sample.menuCommandPassed = true;
                }
            }
        }
        for (const sample of report.headers.filter(item => item.mode === 'reactive')) {
            const reference = report.headers.find(item => item.mode === 'legacy' &&
                item.width === sample.width && item.view === sample.view);
            const shape = item => item.cards.map(({rows, total, ...header}) => header);
            expect(shape(sample), 'Same menu actions and grouping masking in both rendering modes').toEqual(shape(reference));
        }
        expect(report.errors).toEqual([]);
        expect(report.businessWrites).toEqual([]);
        report.phase = 'injected-read-failure'; save();
        // A read-only failure must explain recovery inline instead of opening
        // Moodle's exception dialog. The successful reload is exercised too.
        injectFailure = true;
        const failState = async route => {
            const calls = route.request().postDataJSON();
            if (Array.isArray(calls) && calls.some(call => call.methodname === 'local_groupimport_get_state')) {
                return route.fulfill({contentType: 'application/json', body: JSON.stringify([
                    {error: true, exception: {errorcode: 'servicetestfailure', message: 'Supervised state-read failure'}},
                ])});
            }
            return route.continue();
        };
        await page.route('**/lib/ajax/service.php*', failState);
        await page.goto(new URL('/local/groupimport/manage.php?id=5&lang=fr', process.env.EASYEDU_MOODLE_URL).href,
            {waitUntil: 'domcontentloaded'});
        const failedRoot = page.locator('#local-groupimport-easystud');
        await expect(failedRoot).toHaveAttribute('data-easystud-sm-ready', 'error', {timeout: 60000});
        const warning = failedRoot.locator('[data-easystud-sm-error]');
        await expect(warning).toBeVisible();
        await expect(warning).toHaveAttribute('role', 'alert');
        expect((await warning.locator('span').textContent()).trim().length).toBeGreaterThan(10);
        await expect(page.locator('.moodle-dialogue:visible, .modal.show:visible')).toHaveCount(0);
        await page.unroute('**/lib/ajax/service.php*', failState);
        await warning.locator('button').click();
        await expect(failedRoot).toHaveAttribute('data-easystud-sm-ready', '1', {timeout: 60000});
        await expect(failedRoot.locator('[data-easystud-sm-error]')).toHaveCount(0);
        report.inlineFailureAndReload = true;
        injectFailure = false;
        report.phase = 'completed';
        report.passed = true;
    } finally {
        setRenderingMode('legacy');
        report.restoredCurrent = true;
        save();
    }
});
