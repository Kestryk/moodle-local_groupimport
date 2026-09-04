const fs = require('fs');
const {test, expect} = require('@playwright/test');

const environment = () => {
    const required = ['EASYEDU_MOODLE_URL', 'EASYEDU_MOODLE_USERNAME', 'EASYEDU_MOODLE_PASSWORD'];
    const missing = required.filter(name => !process.env[name]);
    if (missing.length) {
        throw new Error(`Missing visual-evidence environment values: ${missing.join(', ')}.`);
    }
    return {
        baseUrl: String(process.env.EASYEDU_MOODLE_URL).replace(/\/$/, ''),
        username: process.env.EASYEDU_MOODLE_USERNAME,
        password: process.env.EASYEDU_MOODLE_PASSWORD,
    };
};

const login = async(page, env) => {
    await page.goto(`${env.baseUrl}/local/groupimport/manage.php?id=5`, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(env.username);
        await page.locator('#password').fill(env.password);
        await Promise.all([
            page.waitForURL(url => !/\/login\//.test(url.pathname), {waitUntil: 'domcontentloaded'}),
            page.locator('#loginbtn').click(),
        ]);
    }
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    return root;
};

const box = async(locator) => locator.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return {width: Math.round(rect.width), height: Math.round(rect.height)};
});

test('captures non-mutating EasyStud visual evidence at desktop and compact widths', async({page}, testInfo) => {
    test.setTimeout(120000);
    const env = environment();
    const root = await login(page, env);

    await page.setViewportSize({width: 1440, height: 1000});
    await page.screenshot({path: testInfo.outputPath('easystud-manager-desktop.png'), fullPage: false});
    const desktopManager = await box(root);

    let userModalCaptured = false;
    const details = root.locator('[data-easystud-open-user]:visible').first();
    if (await details.count()) {
        await details.click();
        const modal = root.locator('[data-easystud-user-modal]:visible');
        await expect(modal).toBeVisible({timeout: 30000});
        await page.waitForTimeout(350);
        await modal.screenshot({path: testInfo.outputPath('easystud-participant-modal-desktop.png')});
        await modal.locator('[data-easystud-close-user-modal]').click();
        await expect(modal).toBeHidden();
        userModalCaptured = true;
    }

    await page.setViewportSize({width: 768, height: 900});
    await page.waitForTimeout(150);
    await page.screenshot({path: testInfo.outputPath('easystud-manager-compact.png'), fullPage: false});
    const compactManager = await box(root);

    fs.writeFileSync(testInfo.outputPath('easystud-visual-evidence.json'), JSON.stringify({
        desktopManager,
        compactManager,
        participantModalCaptured: userModalCaptured,
        route: '/local/groupimport/manage.php?id=5',
        nonMutating: true,
    }, null, 2));
});
