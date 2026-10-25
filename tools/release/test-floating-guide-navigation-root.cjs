/* eslint-env node */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require(process.env.EASYEDU_PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '../..');
(async() => {
    const browser = await chromium.launch({headless: true, executablePath: process.env.EASYEDU_CHROME_PATH});
    let checks = 0;
    try {
        for (const file of ['amd/src/local/cm/guide_launcher.js', 'amd/build/local/cm/guide_launcher.min.js']) {
            for (const scope of ['navigation', 'ancestor', 'absent']) {
                const page = await browser.newPage({viewport: {width: 1600, height: 900}});
                await page.setContent('<main id="workspace"><div data-easyedu-navigation>' +
                    '<div data-easyedu-navigation-guide-source><div data-easyedu-guide-root>' +
                    '<button data-easyedu-guide-open>Guide</button></div></div>' +
                    '<div data-easyedu-navigation-guide-slot></div></div></main>');
                await page.evaluate(scope => {
                    window.originalClicks = 0;
                    document.querySelector('[data-easyedu-guide-open]').addEventListener('click', () => {
                        window.originalClicks++;
                    });
                    const nav = document.querySelector('[data-easyedu-navigation]');
                    nav.getBoundingClientRect = () => ({width: 100, height: 20, top: -30, bottom: -10});
                    if (scope === 'absent') {
                        nav.removeAttribute('data-easyedu-navigation');
                    }
                    window.define = (...args) => {
                        const factory = args[args.length - 1];
                        window.launcherExports = {};
                        factory(window.launcherExports);
                    };
                }, scope);
                if (file.includes('/src/')) {
                    const source = fs.readFileSync(path.join(root, file), 'utf8');
                    await page.evaluate(async source => {
                        window.launcherExports = await import(URL.createObjectURL(new Blob([source], {
                            type: 'text/javascript',
                        })));
                    }, source);
                } else {
                    await page.addScriptTag({content: fs.readFileSync(path.join(root, file), 'utf8')});
                }
                const actual = await page.evaluate(scope => {
                    const workspace = document.getElementById('workspace');
                    const target = scope === 'ancestor' ? workspace : workspace.firstElementChild;
                    window.launcherExports.bindGuideLauncher(target, '(max-width: 64rem)', {floating: true});
                    const floating = document.querySelector('[data-easyedu-guide-floating-launcher]');
                    if (floating) {
                        floating.click();
                    }
                    const result = {count: document.querySelectorAll('[data-easyedu-guide-floating-launcher]').length,
                        owner: !!target.easystudFloatingGuideLauncher, clicks: window.originalClicks,
                        visible: floating?.classList.contains('is-visible'), disabled: floating?.disabled};
                    window.dispatchEvent(new PageTransitionEvent('pagehide', {persisted: false}));
                    result.remaining = document.querySelectorAll('[data-easyedu-guide-floating-launcher]').length;
                    return result;
                }, scope);
                assert.equal(actual.count, scope === 'absent' ? 0 : 1);
                assert.equal(actual.owner, scope !== 'absent');
                assert.equal(actual.clicks, scope === 'absent' ? 0 : 1);
                assert.equal(actual.remaining, 0);
                if (scope !== 'absent') {
                    assert.equal(actual.visible, true);
                    assert.equal(actual.disabled, false);
                }
                checks++;
                await page.close();
            }
        }
        process.stdout.write('PASS ' + checks + ' source/built root, ancestor, absent, click and cleanup cases.\n');
    } finally {
        await browser.close();
    }
})().catch(error => {
    process.stderr.write(String(error.stack || error) + '\n');
    process.exitCode = 1;
});
