const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

test('I9 readable and production CSS preserve native paint', async ({page}, info) => {
    test.setTimeout(1500000);
    const origin = new URL(process.env.EASYEDU_MOODLE_URL).origin;
    expect(origin).toBe('http://localhost:8051');
    const evidence = process.env.I9_CSS_EVIDENCE;
    expect(path.isAbsolute(evidence || '')).toBe(true);
    const report = {rows: [], errors: [], consoleErrors: [], writes: []};
    let phase = 'navigation';
    const save = () => fs.writeFileSync(info.outputPath('i9-native.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', e => { report.errors.push({phase, url: page.url(), stack: e.stack || e.message}); save(); });
    page.on('console', e => { if (e.type() === 'error') { report.consoleErrors.push(e.text()); save(); } });
    page.on('request', r => {
        if (r.url().includes('/local/groupimport/ajax.php') && r.method() === 'POST') {
            const action = new URLSearchParams(r.postData()).get('action');
            if (action !== 'movestatus') report.writes.push({action});
        }
    });
    await page.goto(origin + '/login/index.php?lang=en', {waitUntil: 'domcontentloaded'});
    await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
    await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
    await Promise.all([
        page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'commit'}),
        page.locator('#loginbtn').click({noWaitAfter: true})
    ]);
    const measure = () => page.evaluate(() => {
        const properties = ['display', 'visibility', 'opacity', 'color', 'backgroundColor', 'backgroundImage',
            'borderWidth', 'borderColor', 'borderRadius', 'boxShadow', 'fontFamily', 'fontSize', 'fontWeight',
            'lineHeight', 'letterSpacing', 'padding', 'margin', 'gap', 'overflowX', 'overflowY', 'transform',
            'outline', 'textAlign', 'textDecoration', 'width', 'height', 'position', 'zIndex'];
        return [...document.querySelectorAll('main *, [role="dialog"], [role="dialog"] *, [data-easyedu-guide-modal], [data-easyedu-guide-modal] *')].filter(e => {
            const b = e.getBoundingClientRect(), s = getComputedStyle(e);
            return b.width > 0 && b.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
        }).map(e => {
            const b = e.getBoundingClientRect(), s = getComputedStyle(e);
            return {tag: e.tagName, classes: e.getAttribute('class'), rect: [b.x, b.y, b.width, b.height].map(n => Math.round(n * 1000) / 1000),
                paint: Object.fromEntries(properties.map(p => [p, s[p]]))};
        });
    });
    for (const lang of ['fr', 'en']) for (const width of [1600, 768, 390]) {
        await page.setViewportSize({width, height: 1000});
        for (const surface of ['sm', 'mass', 'admin', 'guide']) {
            const row = {key: `${lang}-${width}-${surface}`, lang, width, surface};
            report.rows.push(row); save();
            phase = 'navigation';
            const url = surface === 'mass' ? '/local/groupimport/index.php?id=5'
                : surface === 'admin' ? '/admin/settings.php?section=local_groupimport'
                    : '/local/groupimport/manage.php?id=5';
            await page.goto(origin + url + '&lang=' + lang, {waitUntil: 'domcontentloaded'});
            if (surface === 'sm' || surface === 'guide') {
                await expect(page.locator('#local-groupimport-easystud')).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 180000});
            }
            await page.waitForLoadState('networkidle', {timeout: 60000});
            if (surface === 'guide') {
                if (!await page.locator('[data-easyedu-guide-open]:visible').count()) {
                    await page.locator('[data-easyedu-navigation-open]:visible').first().click();
                }
                await page.locator('[data-easyedu-guide-open]:visible').first().click();
                await expect(page.locator('[data-easyedu-guide-modal]:visible')).toBeVisible();
                await page.locator('[data-easyedu-guide-nav-item="1"]:visible').click();
            }
            const files = await page.locator('link[rel="stylesheet"]').evaluateAll(links => links
                .filter(e => e.href.includes('/local/groupimport/styles/')).map(e => new URL(e.href).pathname.split('/').pop()));
            expect(files.length).toBeGreaterThan(0);
            // Inline sheets resolve relative URLs against the document, unlike
            // the real links. Preserve the original font base in both forms.
            const inline = css => css.replace(/url\((["']?)\.\.\/fonts\//g,
                'url($1' + origin + '/local/groupimport/fonts/');
            const readable = Object.fromEntries(files.map(f => [f, inline(fs.readFileSync(path.join(evidence, 'readable', f), 'utf8'))]));
            const production = Object.fromEntries(files.map(f => [f, inline(fs.readFileSync(path.join(evidence, 'production', f), 'utf8'))]));
            phase = 'readable-css';
            await page.evaluate(css => {
                for (const link of document.querySelectorAll('link[rel="stylesheet"]')) {
                    if (!link.href.includes('/local/groupimport/styles/')) continue;
                    const file = new URL(link.href).pathname.split('/').pop();
                    const style = document.createElement('style');
                    style.dataset.i9Sheet = file; style.textContent = css[file];
                    link.after(style); link.disabled = true;
                }
            }, readable);
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.race([Promise.all(document.getAnimations().filter(a => Number.isFinite(a.effect?.getComputedTiming().iterations)).map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 2000))]);
                for (const a of document.getAnimations()) a.pause();
                await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            });
            const phases = await page.evaluate(() => {
                const elements = new Map([...document.querySelectorAll('*')].map((e, i) => [e, i]));
                return document.getAnimations().map(a => ({target: elements.get(a.effect.target),
                    name: a.animationName || a.transitionProperty || '', time: a.currentTime}));
            });
            const rootSelector = surface === 'guide' ? '[data-easyedu-guide-modal]:visible'
                : surface === 'admin' ? '.local-groupimport-admin' : surface === 'mass' ? '#local-groupimport-import' : '#local-groupimport-easystud';
            const bounds = await page.locator(rootSelector).first().boundingBox();
            expect(bounds).not.toBeNull();
            const clip = {x: Math.max(0, bounds.x), y: Math.max(0, bounds.y),
                width: Math.min(width, bounds.x + bounds.width) - Math.max(0, bounds.x),
                height: Math.min(1000, bounds.y + bounds.height) - Math.max(0, bounds.y)};
            expect(clip.height).toBeGreaterThan(0);
            const before = await measure();
            const beforeCapture = info.outputPath(row.key + '-before.png');
            const afterCapture = info.outputPath(row.key + '-after.png');
            await page.screenshot({path: beforeCapture, caret: 'hide', clip});
            phase = 'production-css';
            await page.evaluate(css => {
                for (const style of document.querySelectorAll('style[data-i9-sheet]')) style.textContent = css[style.dataset.i9Sheet];
            }, production);
            await page.evaluate(phases => {
                const elements = new Map([...document.querySelectorAll('*')].map((e, i) => [e, i]));
                for (const animation of document.getAnimations()) {
                    const target = elements.get(animation.effect.target);
                    const name = animation.animationName || animation.transitionProperty || '';
                    const phase = phases.find(p => p.target === target && p.name === name);
                    if (phase) { animation.pause(); animation.currentTime = phase.time; }
                }
            }, phases);
            const after = await measure();
            row.differences = [];
            if (before.length !== after.length) row.differences.push({type: 'count', before: before.length, after: after.length});
            for (let i = 0; i < Math.min(before.length, after.length); i++) {
                if (JSON.stringify(before[i]) !== JSON.stringify(after[i])) row.differences.push({index: i, before: before[i], after: after[i]});
            }
            await page.screenshot({path: afterCapture, caret: 'hide', clip});
            const hash = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
            row.nodes = before.length;
            row.pixelIdentical = hash(beforeCapture) === hash(afterCapture);
            row.pass = row.differences.length === 0 && row.pixelIdentical;
            row.captures = [beforeCapture, afterCapture]; save();
            console.log(JSON.stringify({key: row.key, pass: row.pass, nodes: row.nodes, differences: row.differences.length, pixelIdentical: row.pixelIdentical}));
        }
    }
    expect(report.errors).toEqual([]);
    expect(report.consoleErrors).toEqual([]);
    expect(report.writes).toEqual([]);
    expect(report.rows.filter(r => !r.pass).map(r => r.key)).toEqual([]);
});
