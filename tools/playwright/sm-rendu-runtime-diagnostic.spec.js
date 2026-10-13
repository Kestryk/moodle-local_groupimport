const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('SM-RENDU local runtime diagnostic', async({page}, testInfo) => {
    const consoleEvents = [];
    const failedRequests = [];
    const pageErrors = [];
    page.on('console', message => consoleEvents.push({type: message.type(), text: message.text()}));
    page.on('requestfailed', request => failedRequests.push({url: request.url(), failure: request.failure()}));
    page.on('pageerror', error => pageErrors.push(error.message));
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    url.searchParams.set('easystudloadingdiagnostics', '1');
    await page.goto(url.toString(), {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(target => !target.pathname.includes('/login/'));
        await page.goto(url.toString(), {waitUntil: 'domcontentloaded'});
    }
    await page.locator('#local-groupimport-easystud').waitFor({state: 'attached'});
    await page.waitForFunction(() => document.querySelector('#local-groupimport-easystud')
        ?.getAttribute('data-easystud-loading-state') === 'ready', null, {timeout: 60000}).catch(() => undefined);
    const snapshot = await page.evaluate(() => {
        const root = document.querySelector('#local-groupimport-easystud');
        return {
            state: root && root.getAttribute('data-easystud-loading-state'),
            initialized: root && root.getAttribute('data-easystud-manager-initialised'),
            initializing: root && root.getAttribute('data-easystud-manager-initialising'),
            controller: !!(root && root.easystudLoadingController),
            diagnostics: window.__easyStudLoadingDiagnostics?.['local-groupimport-easystud']?.snapshot?.() || [],
            scripts: [...document.scripts].map(script => script.src).filter(Boolean)
                .filter(src => src.includes('groupimport')),
            groupings: root ? [...root.querySelectorAll('[data-easystud-tree] [data-easystud-grouping-id]')]
                .map(section => ({
                    id: section.getAttribute('data-easystud-grouping-id'),
                    hidden: section.hidden,
                    display: getComputedStyle(section).display,
                    badge: section.querySelector('.local-groupimport-easystud-tree__toggle .badge')?.textContent?.trim(),
                    countText: section.getAttribute('data-easystud-advanced-count'),
                    toggle: section.querySelector('[data-easystud-collapse-toggle]')?.getAttribute('aria-expanded'),
                    childCount: section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length,
                })) : [],
        };
    });
    const evidence = {snapshot, consoleEvents, failedRequests, pageErrors};
    fs.writeFileSync(testInfo.outputPath('sm-rendu-runtime-diagnostic.json'), JSON.stringify(evidence, null, 2));
    await page.screenshot({path: testInfo.outputPath('sm-rendu-runtime-diagnostic.png')});
    expect(snapshot.state).toBe('ready');
});
