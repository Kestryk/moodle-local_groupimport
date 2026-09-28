const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

const massImportUrl = process.env.EASYEDU_MASS_IMPORT_URL || process.env.EASYEDU_MOODLE_URL ||
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

const isMoodleDraftUpload = url => {
    const parsed = new URL(url);
    return parsed.pathname.endsWith('/repository/repository_ajax.php') &&
        parsed.searchParams.get('action') === 'upload';
};

const expectContainedBy = async(locator, container) => {
    const [box, bounds] = await Promise.all([locator.boundingBox(), container.boundingBox()]);
    expect(box).not.toBeNull();
    expect(bounds).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(bounds.x - 1);
    expect(box.y).toBeGreaterThanOrEqual(bounds.y - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
};

const exerciseDepositDragState = async(deposit, page, testInfo, viewportName) => {
    const transfer = await page.evaluateHandle(() => {
        const value = new DataTransfer();
        value.items.add(new File(['drag state only'], 'phase0-drag-probe.csv', {type: 'text/csv'}));
        return value;
    });

    try {
        // Entering through the page must not leave its global veil over the
        // local deposit feedback when the pointer reaches the native target.
        const overlay = page.locator('[data-local-groupimport-drop-overlay]');
        await page.locator('body').dispatchEvent('dragenter', {dataTransfer: transfer});
        await expect(overlay).toBeVisible();
        await deposit.dispatchEvent('dragenter', {dataTransfer: transfer});
        await expect(deposit).toHaveClass(/is-dragover/);
        await expect(overlay).toBeHidden();
        await deposit.dispatchEvent('dragover', {dataTransfer: transfer});
        await expect(deposit).toHaveClass(/is-dragover/);
        await deposit.screenshot({path: testInfo.outputPath(`phase0-dragover-${viewportName}.png`)});
        await deposit.dispatchEvent('dragleave', {dataTransfer: transfer});
        await expect(deposit).not.toHaveClass(/is-dragover/);
    } finally {
        await transfer.dispose();
    }
};

const uploadDraftThroughNativeDrop = async(page, root, testInfo, viewportName, filename) => {
    const deposit = root.locator('.easyedu-file-deposit');
    const filelist = deposit.locator('.filepicker-filelist');
    const uploadCard = root.locator('.local-groupimport-import-card--upload');
    const chooseButton = deposit.locator('.fp-btn-choose').first();
    const previewButton = uploadCard.locator('[type="submit"]');
    const transfer = await page.evaluateHandle(name => {
        const value = new DataTransfer();
        value.items.add(new File([
            'student;group;grouping\ntest.etudiant.01@example.com;Phase 0 preview;Phase 0 preview'
        ], name, {type: 'text/csv'}));
        return value;
    }, filename);

    let releaseUploadGate;
    let uploadGateTimer;
    let uploadRequestCount = 0;
    let pendingRoute;
    const uploadGate = new Promise(resolve => { releaseUploadGate = resolve; });
    const uploadRoute = async route => {
        uploadRequestCount++;
        uploadGateTimer = setTimeout(releaseUploadGate, 10000);
        pendingRoute = uploadGate.then(() => route.continue());
        await pendingRoute;
    };
    const uploadUrlMatcher = url => isMoodleDraftUpload(url);
    const uploadRequest = page.waitForRequest(request =>
        isMoodleDraftUpload(request.url()) && request.method() === 'POST', {timeout: 30000});

    await page.route(uploadUrlMatcher, uploadRoute);
    try {
        // Send a native filepicker drop. Moodle owns this progress row and the
        // draft upload request; this deliberately avoids EasyStud's body route.
        await filelist.dispatchEvent('dragenter', {dataTransfer: transfer});
        await filelist.dispatchEvent('dragover', {dataTransfer: transfer});
        await filelist.dispatchEvent('drop', {dataTransfer: transfer});

        const request = await uploadRequest;
        expect(request.method()).toBe('POST');
        expect(new URL(request.url()).searchParams.get('action')).toBe('upload');
        await expect.poll(() => uploadRequestCount).toBe(1);

        const progressRow = deposit.locator('.dndupload-progressbars > div')
            .filter({hasText: filename}).first();
        const progressTrack = progressRow.locator('.progress');
        const progressBar = progressRow.locator('.progress-bar[role="progressbar"]');
        await expect(progressRow).toBeVisible({timeout: 10000});
        await expect(progressTrack).toBeVisible();
        await expect(progressBar).toHaveAttribute('aria-valuenow', '0');
        await expectContainedBy(progressRow, deposit);
        await expectContainedBy(progressTrack, deposit);
        await expectContainedBy(chooseButton, deposit);
        const progressBounds = await progressRow.boundingBox();
        const chooseBounds = await chooseButton.boundingBox();
        expect(chooseBounds.y).toBeGreaterThanOrEqual(progressBounds.y + progressBounds.height);
        await expectContainedBy(previewButton, uploadCard);
        await expect(previewButton).toBeDisabled();
        await deposit.screenshot({path: testInfo.outputPath(`phase0-uploading-${viewportName}.png`)});
    } finally {
        releaseUploadGate();
        if (pendingRoute) { await pendingRoute; }
        if (uploadGateTimer) {
            clearTimeout(uploadGateTimer);
        }
        await page.unroute(uploadUrlMatcher, uploadRoute);
        await transfer.dispose();
    }

    await expect(deposit.locator('.filepicker-filename'))
        .toContainText(filename, {timeout: 30000});
    await expect(deposit.locator('.dndupload-progressbars .progress-bar')).toHaveCount(0);
};

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
        await expect(massRoot.locator('.filepicker-container')).toBeHidden();
        await expect(massRoot.locator('.easyedu-file-deposit__support')).toBeVisible();
        await page.evaluate(() => document.fonts.load('600 16px "EasyEdu Inter"'));
        expect(await page.evaluate(() => Array.from(document.fonts).some(font =>
            font.family.includes('EasyEdu Inter') && font.status === 'loaded'))).toBe(true);
        await expect(massRoot.locator('.easyedu-panel__title').first()).toHaveCSS('font-weight', '600');
        await expect(massRoot.locator('.easyedu-panel__title').first()).toHaveCSS('line-height', '19.2px');
        await expect(massRoot.locator('.easyedu-panel').first()).toHaveCSS('box-shadow', 'none');
        await expect(massRoot.locator('.easyedu-file-deposit__title')).toHaveCSS('font-size', '17px');
        await expect(massRoot.locator('.local-groupimport-import-card__title').first())
            .toHaveCSS('font-size', '16px');
        await expectNoHorizontalOverflow(page);
        await captureScrollSeries(page, massRoot, testInfo, `phase0-mass-import-${viewport.name}`);

        // Verify the shared deposit drag state separately, then gate one native
        // Moodle draft upload long enough to capture its real progress surface.
        await exerciseDepositDragState(massRoot.locator('.easyedu-file-deposit'), page, testInfo, viewport.name);
        const draftFilename = `phase0-preview-${viewport.name}.csv`;
        await uploadDraftThroughNativeDrop(page, massRoot, testInfo, viewport.name, draftFilename);
        await massRoot.locator('.easyedu-file-deposit').screenshot({
            path: testInfo.outputPath(`phase0-file-present-${viewport.name}.png`),
        });
        await massRoot.locator('.local-groupimport-import-card--upload [type="submit"]').click();
        await expect(massRoot).toHaveClass(/has-preview/, {timeout: 60000});
        await expect(massRoot.locator('.local-groupimport-import-preview__table')).toBeVisible();
        const dataTable = massRoot.locator('.easyedu-data-table');
        fs.writeFileSync(testInfo.outputPath(`table-cascade-${viewport.name}.json`),
            JSON.stringify(await dataTable.locator('td').nth(2).evaluate(node => {
                const matched = [];
                const visit = rules => Array.from(rules).forEach(rule => {
                    if (rule.selectorText && node.matches(rule.selectorText)) {
                        matched.push({selector: rule.selectorText, style: rule.style.cssText});
                    }
                    if (rule.cssRules) { visit(rule.cssRules); }
                });
                for (const sheet of document.styleSheets) {
                    try { visit(sheet.cssRules); } catch (_) { /* Cross-origin sheets are unreadable. */ }
                }
                return {matched, inline: node.style.cssText, writingMode: getComputedStyle(node).writingMode};
            }), null, 2));
        await dataTable.screenshot({path: testInfo.outputPath(`table-detail-${viewport.name}.png`)});
        await expect(dataTable.locator('th').nth(1)).toHaveCSS('font-size', '11px');
        await expect(dataTable.locator('td').nth(2)).toHaveCSS('border-left-width', '0px');
        await expect(dataTable.locator('input[type="text"]').first()).toHaveCSS('height', '40px');
        await expect(massRoot.locator('.local-groupimport-import-preview__actions button'))
            .toHaveCSS('column-gap', '10.4px');
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
