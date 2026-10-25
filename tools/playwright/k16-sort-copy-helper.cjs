const {expect} = require('@playwright/test');
const fs = require('node:fs');
const settle = node => node.evaluate(async n => {
    await document.fonts.ready;
    await Promise.all(n.getAnimations({subtree: true}).filter(a =>
        Number.isFinite(a.effect.getComputedTiming().iterations)).map(a => a.finished.catch(() => {})));
});
async function login(page) {
    const url = new URL(process.env.EASYEDU_EASYSTUD_MANAGER_URL || '');
    if (url.origin !== 'http://localhost:8051' || Number(url.searchParams.get('id')) <= 5) {
        throw Error('Disposable own8051 course required');
    }
    page.setDefaultTimeout(20000);
    page.setDefaultNavigationTimeout(90000);
    await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'commit'}),
            page.locator('#loginbtn').click({noWaitAfter: true})]);
    }
    return url;
}
async function ready(page, url, lang, width) {
    await page.setViewportSize({width, height: 1000});
    url.searchParams.set('lang', lang);
    await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 90000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 90000});
    // Suppress only the first-visit offer, using the public Guide lifecycle, never product CSS/Motion.
    await page.locator('.easyedu-guide--discovery[data-easyedu-guide-root]').evaluate(async n => {
        const G = await new Promise(r => require(['local_groupimport/easyedu_guide'], r));
        const config = n.easyeduGuideConfig;
        G.destroy(n); G.init(n, {...config, firstVisit: false, welcomeOffer: false});
    });
    await settle(root);
    return root;
}
async function view(root, name) {
    const mobile = root.locator('[data-easystud-mobile-view="' + name + '"]:visible');
    if (await mobile.count()) await mobile.first().click();
    else await root.locator('[data-easystud-layout-mode="' +
        (name === 'groupings' ? 'structure' : 'participants') + '"]:visible').first().click();
    await settle(root);
}
const model = page => page.evaluate(() => new Promise(resolve =>
    require(['local_groupimport/local/cm/state'], s => {
        const m = s.getOnDemandModel(); resolve({users: m.raw.users, groups: m.raw.groups, groupings: m.raw.groupings});
    })));
function reportFile(info, name, report) {
    fs.writeFileSync(info.outputPath(name + '.json'), JSON.stringify(report, null, 2));
}
module.exports = {login, ready, settle, view, model, reportFile};
