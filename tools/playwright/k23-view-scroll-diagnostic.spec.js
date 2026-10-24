const {test, expect} = require('@playwright/test');
const fs = require('node:fs');

test('K23 Groups view-switch bounded scroll diagnostic', async({page}) => {
    test.setTimeout(720000);
    page.setDefaultTimeout(60000);
    const base = new URL(process.env.EASYEDU_MOODLE_URL), out = process.env.K239498_OUT;
    if (base.hostname !== 'localhost' || base.port !== '8052' || !out) throw Error('Owned 8052 only');
    const result = {cases: [], errors: []};
    const save = () => fs.writeFileSync(out + '/scroll.json', JSON.stringify(result, null, 2));
    page.on('pageerror', e => result.errors.push({message: e.message, stack: e.stack}));
    await page.goto(new URL('/login/index.php', base).href, {waitUntil: 'domcontentloaded', timeout: 150000});
    if (await page.locator('#username').count()) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click({noWaitAfter: true});
        await page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'domcontentloaded', timeout: 150000});
    }
    try {
        for (const course of [6, 5, 71]) for (const lang of ['en', 'fr']) {
            await page.setViewportSize({width: 1600, height: 1000});
            await page.goto(new URL('/local/groupimport/manage.php?id=' + course + '&lang=' + lang, base).href,
                {waitUntil: 'domcontentloaded', timeout: 180000});
            await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute(
                'data-easystud-loading-state', 'ready', {timeout: 180000});
            await page.waitForTimeout(800);
            for (const width of [1600, 390]) for (const level of ['full', 'minimal']) {
                await page.setViewportSize({width, height: 1000});
                await page.waitForTimeout(600);
                await page.locator('#local-groupimport-easystud').evaluate((r, level) => {
                    r.dataset.easyeduMotionLevel = level;
                    r.classList.toggle('is-easyedu-motion-off', level === 'minimal');
                    r.classList.toggle('is-easyedu-motion-minimal', level === 'minimal');
                }, level);
                const from = width > 1024 ? '[data-easystud-layout-mode="participants"]' :
                    '[data-easystud-mobile-view="participants"]';
                const to = width > 1024 ? '[data-easystud-layout-mode="structure"]' :
                    '[data-easystud-mobile-view="groups"]';
                await page.locator(from + ':visible').first().click();
                await page.waitForTimeout(700);
                await page.evaluate(to => {
                    const root = document.querySelector('#local-groupimport-easystud');
                    const selectors = ['.local-groupimport-easystud__layout',
                        '.local-groupimport-easystud__panel', '[data-easystud-participant-groups-panel]',
                        '[data-easystud-structure-groups]', '.local-groupimport-easystud-structure-groups__list',
                        '.local-groupimport-easystud-participant-groups__list',
                        '.local-groupimport-easystud__content', '#page', '#region-main'];
                    const hosts = [...new Set(selectors.flatMap(s => [...document.querySelectorAll(s)]))];
                    const describe = e => {
                        const s = getComputedStyle(e), r = e.getBoundingClientRect();
                        return {cls: e.className, id: e.id, x: r.x, y: r.y, width: r.width, height: r.height,
                            clientWidth: e.clientWidth, scrollWidth: e.scrollWidth,
                            clientHeight: e.clientHeight, scrollHeight: e.scrollHeight,
                            overflowX: s.overflowX, overflowY: s.overflowY, transform: s.transform,
                            visible: r.width > 0 && r.height > 0 && s.visibility !== 'hidden',
                            marginTop: s.marginTop, paddingTop: s.paddingTop,
                            animations: e.getAnimations().map(a => ({state: a.playState, frames: a.effect?.getKeyframes()})),
                            children: [...e.children].slice(0, 14).map(c => {
                                const r = c.getBoundingClientRect(), s = getComputedStyle(c);
                                return {cls: c.className, y: r.y, h: r.height, bottom: r.bottom,
                                    visible: !c.hidden && r.height > 0, transform: s.transform};
                            })};
                    };
                    const capture = () => ({ms: performance.now(), mode: root.className,
                        swapping: root.easystudLayoutSwapping || 0, nodes: hosts.map(describe)});
                    window.scrollProbe = {frames: [], before: capture(), done: false};
                    const trigger = event => {
                        if (!event.target.closest(to)) return;
                        document.removeEventListener('click', trigger, true);
                        const start = performance.now();
                        queueMicrotask(() => window.scrollProbe.frames.push(capture()));
                        const sample = () => {
                            window.scrollProbe.frames.push(capture());
                            if (performance.now() - start < 800) requestAnimationFrame(sample);
                            else { window.scrollProbe.after = capture(); window.scrollProbe.done = true; }
                        };
                        requestAnimationFrame(sample);
                    };
                    document.addEventListener('click', trigger, true);
                }, to);
                await page.locator(to + ':visible').first().click();
                await page.waitForFunction(() => window.scrollProbe.done, {}, {timeout: 15000});
                result.cases.push({course, lang, width, level, ...await page.evaluate(() => window.scrollProbe)});
                save();
            }
        }
        result.complete = true;
        expect(result.errors).toEqual([]);
    } finally { save(); }
});
