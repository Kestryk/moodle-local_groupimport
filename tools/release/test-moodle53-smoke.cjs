'use strict';
// Dedicated :8053 only. Credentials/fixture IDs are read from external local files.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const [playwrightPath, secretPath, fixturePath, output] = process.argv.slice(2);
assert(playwrightPath && secretPath && fixturePath && path.isAbsolute(output));
const {chromium} = require(playwrightPath);
const base = 'http://localhost:8053';
const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf8'));
const report = {base, courseid: fixture.courseid, rows: [], console: [], pageErrors: [], network: [], notices: [], failure: null};
const safeUrl = value => value.replace(/([?&](?:sesskey|token|logintoken)=)[^&]+/gi, '$1[redacted]');
fs.mkdirSync(output, {recursive: true});
(async () => {
    const browser = await chromium.launch({executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true});
    const context = await browser.newContext({viewport: {width: 1600, height: 1000}});
    await context.route('**/*', route => {
        const url = new URL(route.request().url());
        if (['http:', 'https:'].includes(url.protocol) && url.origin !== base) return route.abort('blockedbyclient');
        return route.continue();
    });
    const page = await context.newPage();
    let label = 'login';
    page.on('console', message => {
        if (['error', 'warning'].includes(message.type())) report.console.push({page: label, type: message.type(), text: message.text(), location: message.location()});
    });
    page.on('pageerror', error => report.pageErrors.push({page: label, message: error.message, stack: error.stack}));
    page.on('response', response => {
        if (response.status() >= 400) report.network.push({page: label, status: response.status(), url: safeUrl(response.url())});
    });
    page.on('requestfailed', request => report.network.push({page: label, failed: request.failure()?.errorText, url: safeUrl(request.url())}));
    try {
        await page.goto(base + '/login/index.php', {waitUntil: 'domcontentloaded', timeout: 180000});
        await page.locator('#username').fill('admin');
        await page.locator('#password').fill(fs.readFileSync(secretPath, 'utf8').trim());
        await Promise.all([page.waitForURL(url => !url.pathname.includes('/login/'), {timeout: 90000, waitUntil: 'commit'}), page.locator('#loginbtn').click({noWaitAfter: true})]);
        for (const language of ['fr', 'en']) for (const width of [1600, 390]) {
            await page.setViewportSize({width, height: 1000});
            if(process.env.EASYSTUD_SMOKE53_FOCUS !== 'plugin-only') {
            // Visit the actual course page before SM: inspect native secondary navigation
            // after hydration instead of proving only a synthetic link rewrite.
            label = `course-${language}-${width}`;
            await page.goto(`${base}/course/view.php?id=${fixture.courseid}&lang=${language}`, {waitUntil: 'domcontentloaded', timeout: 180000});
            await page.locator('.secondary-navigation').waitFor({state:'attached',timeout:45000});
            await page.waitForFunction(() => window.require?.defined?.('local_groupimport/navigation'), null, {timeout:45000}).catch(error => report.notices.push({page:label,type:'navigation-module-readiness',text:error.message}));
            const navigation = await page.locator('.secondary-navigation').evaluateAll(nodes => nodes.map(node => ({
                tag: node.tagName, text: node.innerText, visible: node.getBoundingClientRect().height > 0,
                overflow: node.scrollWidth > node.clientWidth + 1,
                links: [...node.querySelectorAll('a[href]')].map(a => ({text: a.textContent.trim(), href: a.getAttribute('href')})),
            })));
            await captureNotices(page, label);
            report.rows.push({page: label, navigation});
            await page.screenshot({path: path.join(output, label + '.png'), fullPage: false});
            }
            for (const screen of ['manage', 'index']) {
                label = `${screen}-${language}-${width}`;
                await page.goto(`${base}/local/groupimport/${screen}.php?id=${fixture.courseid}&lang=${language}`, {waitUntil: 'domcontentloaded', timeout: 180000});
                let ready = false;
                try {
                    if (screen === 'manage') {
                        await page.waitForFunction(() => {
                            const root = document.querySelector('#local-groupimport-easystud');
                            return root?.dataset.easystudLoadingState === 'ready' && document.querySelectorAll('[data-easystud-user]').length >= 3;
                        }, null, {timeout: 90000});
                    } else {
                        await page.locator('input[type=file], .filepicker-container, [data-local-groupimport-file-input]').first().waitFor({state: 'attached', timeout: 45000});
                    }
                    ready = true;
                } catch (error) {
                    report.notices.push({page: label, type: 'readiness-failure', text: error.message});
                }
                await captureNotices(page, label);
                const state = await page.evaluate(() => ({
                    title: document.title, readyState: document.querySelector('#local-groupimport-easystud')?.dataset.easystudLoadingState,
                    participants: document.querySelectorAll('[data-easystud-user]').length,
                    groupCards: document.querySelectorAll('[data-easystud-group]').length,
                    filePickers: document.querySelectorAll('input[type=file], .filepicker-container').length,
                    coreLogDefined: !!window.require?.defined?.('core/log'),
                    pageBootstrapDefined: !!window.require?.defined?.('local_groupimport/page_bootstrap'),
                    managerDefined: !!window.require?.defined?.('local_groupimport/course_manager'),
                    bodyOverflow: document.documentElement.scrollWidth > innerWidth + 1,
                }));
                report.rows.push({page: label, ready, ...state});
                await page.screenshot({path: path.join(output, label + '.png'), fullPage: false});
            }
        }
    } catch (error) {
        report.failure = {page: label, message: error.message, stack: error.stack};
        await captureNotices(page, label).catch(() => {});
        await page.screenshot({path: path.join(output, 'failure.png')}).catch(() => {});
    } finally {
        fs.writeFileSync(path.join(output, 'smoke.json'), JSON.stringify(report, null, 2));
        await browser.close();
    }
    console.log(JSON.stringify({rows: report.rows.length, pageErrors: report.pageErrors.length,
        console: report.console.length, notices: report.notices.length, network: report.network.length, failure: report.failure?.message ?? null}));
    process.exitCode = report.failure || report.rows.filter(row => row.ready === false).length || report.pageErrors.length || report.console.length || report.notices.some(notice => ['PHP/Moodle', 'body-PHP'].includes(notice.type)) ? 1 : 0;
})();
async function captureNotices(page, label) {
    const messages = await page.locator('[data-rel=debugging], .debuggingmessage, .notifytiny').allInnerTexts();
    for (const text of messages) report.notices.push({page: label, type: 'PHP/Moodle', text});
    const body = await page.locator('body').innerText();
    const lines = body.split('\n');
    for (let i = 0; i < lines.length; i++) {
        if (/(?:Deprecated:|Notice:|Warning:|Fatal error:|Too much data passed|js_call_amd.*(?:large|data))/.test(lines[i])) {
            report.notices.push({page: label, type: 'body-PHP', text: lines.slice(i, i + 5).join('\n')});
        }
    }
}
