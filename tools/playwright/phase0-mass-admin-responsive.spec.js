const {test, expect} = require('@playwright/test');

const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const adminUrl = new URL('/admin/settings.php?section=local_groupimport', massImportUrl).toString();
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

test.describe.configure({timeout: 300000});

const login = async(page, url) => {
    await page.goto(url, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Saved credentials are required for the Phase 0 responsive audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(value => !value.pathname.includes('/login/'), {
            timeout: 60000,
            waitUntil: 'domcontentloaded',
        });
        await page.goto(url, {waitUntil: 'domcontentloaded'});
    }
};

const expectNoHorizontalOverflow = async page => {
    await expect.poll(async() => page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
    }))).toEqual(expect.objectContaining({
        clientWidth: expect.any(Number),
        scrollWidth: expect.any(Number),
    }));
    const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth
    );
    expect(overflow).toBeLessThanOrEqual(2);
};

const getColumnCount = locator => locator.evaluate(node =>
    getComputedStyle(node).gridTemplateColumns.split(' ').filter(Boolean).length
);

// Boost scrolls an inner page, so fullPage alone records only its first screen.
// Capture the real scroll container in overlapping, unmodified viewports.
const captureScrollSeries = async(page, root, testInfo, prefix) => {
    const dimensions = await root.evaluate(node => {
        let scroller = node;
        while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 2 &&
            /auto|scroll/.test(getComputedStyle(scroller).overflowY))) {
            scroller = scroller.parentElement;
        }
        scroller = scroller || document.scrollingElement;
        scroller.dataset.phase0CaptureScroller = 'true';
        return {height: scroller.clientHeight, total: scroller.scrollHeight};
    });
    const scroller = page.locator('[data-phase0-capture-scroller]');
    const step = Math.max(1, dimensions.height - 120);
    for (let offset = 0, index = 1; offset < dimensions.total; offset += step, index++) {
        await scroller.evaluate((node, top) => { node.scrollTop = top; }, offset);
        await page.screenshot({path: testInfo.outputPath(`${prefix}-${index}.png`)});
        if (offset + dimensions.height >= dimensions.total) { break; }
    }
    await scroller.evaluate(node => {
        node.scrollTop = 0;
        delete node.dataset.phase0CaptureScroller;
    });
};

const expectSquareCentredIcons = async locator => {
    const icons = await locator.evaluateAll(nodes => nodes.map(node => {
        const box = node.getBoundingClientRect();
        const glyph = node.querySelector('.fa') || node;
        const glyphBox = glyph.getBoundingClientRect();
        return {
            delta: Math.abs(box.width - box.height),
            centreX: Math.abs((glyphBox.left + glyphBox.width / 2) - (box.left + box.width / 2)),
            centreY: Math.abs((glyphBox.top + glyphBox.height / 2) - (box.top + box.height / 2)),
        };
    }));
    expect(icons.length).toBeGreaterThan(0);
    for (const icon of icons) {
        expect(icon.delta).toBeLessThanOrEqual(1);
        expect(icon.centreX).toBeLessThanOrEqual(2);
        expect(icon.centreY).toBeLessThanOrEqual(2);
    }
};

test('Phase 0 Mass Import and Administration stay composed at desktop and 390px', async({page}, testInfo) => {
    const viewports = [
        {name: 'desktop', width: 1440, height: 1000, expectedColumns: 2},
        {name: 'tablet-1024', width: 1024, height: 900, expectedColumns: 1, adminColumns: 2},
        {name: 'mobile-390', width: 390, height: 844, expectedColumns: 1},
    ];

    for (const viewport of viewports) {
        await page.setViewportSize({width: viewport.width, height: viewport.height});
        await login(page, massImportUrl);

        const massRoot = page.locator('#local-groupimport-import');
        await expect(massRoot).toBeVisible({timeout: 60000});
        await expect(massRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(massRoot.locator('[data-easystud-real-content]')).toBeVisible();
        await expect(massRoot.locator('.local-groupimport-import__grid')).toBeVisible();
        expect(await getColumnCount(massRoot.locator('.local-groupimport-import__grid')))
            .toBe(viewport.expectedColumns);
        await expectSquareCentredIcons(massRoot.locator(
            '.local-groupimport-import-card__header > .fa:visible, ' +
            '.local-groupimport-import-fields__icon:visible, .easyedu-file-deposit__icon'
        ));
        await expect(massRoot.locator('.easyedu-file-deposit')).toBeVisible();
        await expect(massRoot.locator('.fp-btn-choose')).toBeVisible({timeout: 60000});
        const nativeDrop = massRoot.locator('.filepicker-container');
        await expect(nativeDrop).toHaveCSS('position', 'static');
        await expect(nativeDrop).toHaveCSS('border-top-width', '0px');
        await nativeDrop.scrollIntoViewIfNeeded();
        await expect(massRoot.locator('.dndupload-message')).toBeInViewport();
        await expect(massRoot.locator('.local-groupimport-import-card__title').first())
            .toHaveCSS('font-size', '16px');
        await expectNoHorizontalOverflow(page);
        await captureScrollSeries(page, massRoot, testInfo, `phase0-mass-import-${viewport.name}`);

        // Upload a draft and preview only: never execute an import or mutate
        // course membership. The native filename must remain visible.
        const transfer = await page.evaluateHandle(() => new DataTransfer());
        await transfer.evaluate(data => data.items.add(new File([
            'student;group;grouping\ntest.etudiant.01@example.com;Phase 0 preview;Phase 0 preview'
        ], 'phase0-preview.csv', {type: 'text/csv'})));
        await page.dispatchEvent('body', 'drop', {dataTransfer: transfer});
        await transfer.dispose();
        await expect(massRoot.locator('.filepicker-filename')).toContainText('phase0-preview.csv', {timeout: 30000});
        await massRoot.locator('.easyedu-file-deposit').screenshot({
            path: testInfo.outputPath(`phase0-file-present-${viewport.name}.png`),
        });
        await massRoot.locator('.local-groupimport-import-card--upload [type="submit"]').click();
        await expect(massRoot).toHaveClass(/has-preview/, {timeout: 60000});
        await expect(massRoot.locator('.local-groupimport-import-preview__table')).toBeVisible();
        await expectNoHorizontalOverflow(page);
        await captureScrollSeries(page, massRoot, testInfo, `phase0-preview-${viewport.name}`);

        await page.goto(adminUrl, {waitUntil: 'domcontentloaded'});
        const adminRoot = page.locator('#page-admin-setting-local_groupimport');
        await expect(adminRoot).toBeVisible({timeout: 60000});
        await expect(adminRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await expect(adminRoot.locator('[data-local-groupimport-admin-features]')).toBeVisible();

        const fieldGrids = adminRoot.locator('.local-groupimport-admin-settings__field-grid:visible');
        await expect(fieldGrids.first()).toBeVisible();
        for (let index = 0; index < await fieldGrids.count(); index++) {
            expect(await getColumnCount(fieldGrids.nth(index)))
                .toBe(viewport.adminColumns || viewport.expectedColumns);
        }
        const hero = adminRoot.locator('.local-groupimport-admin-settings__hero:visible').first();
        await expect(hero).toBeVisible();
        expect(await getColumnCount(hero)).toBe(viewport.adminColumns || viewport.expectedColumns);
        await expectSquareCentredIcons(adminRoot.locator(
            '.local-groupimport-admin-settings__hero > .fa:visible'
        ));
        await expectNoHorizontalOverflow(page);
        await captureScrollSeries(page, adminRoot.locator('#adminsettings'), testInfo,
            `phase0-administration-${viewport.name}`);
    }
});
