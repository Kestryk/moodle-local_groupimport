const {test, expect} = require('@playwright/test');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// local-supervised: PHP configuration stubs + transient DOM specimens only.
// Native stylesheet/cascade is used; no settings or course data are saved.
test('Semantic palettes retain readable text on soft surfaces', async({page}, testInfo) => {
    test.setTimeout(120000);
    const palettes = JSON.parse(execFileSync(process.env.EASYEDU_PALETTE_PHP || 'php', [
        path.resolve(__dirname, '../release/test-theme-palette-standalone.php'), '--json',
    ], {encoding: 'utf8'}));
    const records = [];
    const blocked = [];
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(process.env.EASYEDU_MOODLE_URL);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
        await page.goto(process.env.EASYEDU_MOODLE_URL);
    }
    await expect(page.locator('#local-groupimport-easystud'))
        .toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await page.route('**/*', route => {
        if (route.request().method() !== 'GET') {
            blocked.push(route.request().method());
            return route.abort();
        }
        return route.continue();
    });
    try {
        for (const width of [1600, 768, 390]) {
            await page.setViewportSize({width, height: 1000});
            const samples = await page.evaluate(palettes => {
                // Canvas resolves color(srgb ...) returned for CSS color-mix.
                const context = document.createElement('canvas').getContext('2d');
                const rgb = colour => {
                    context.clearRect(0, 0, 1, 1);
                    context.fillStyle = colour;
                    context.fillRect(0, 0, 1, 1);
                    return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
                };
                const luminance = channels => channels.map(channel => {
                    const value = channel / 255;
                    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                }).reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
                const results = [];
                for (const palette of palettes) {
                    const host = document.createElement('section');
                    host.className = 'easyedu-ui local-groupimport-easystud';
                    host.style.cssText = palette.style;
                    host.innerHTML = `<span data-case="status" class="easyedu-status">Ready</span>
                        <div data-easystud-group-email-result><span data-case="recognized"
                            class="local-groupimport-easystud-token local-groupimport-easystud-token--valid">Alex Dupont</span></div>
                        <button data-case="selected-choice" class="easyedu-searchable-choice__option"
                            aria-pressed="true">Selected group</button>`;
                    // Also test the published role pairs independently from DOM
                    // specimens; these assertions do not claim whole-card proof.
                    for (const role of ['primary', 'accent', 'participant', 'group', 'grouping']) {
                        const probe = document.createElement('span');
                        probe.dataset.case = `${role}-pair`;
                        probe.textContent = role;
                        probe.style.color = `var(--easyedu-${role})`;
                        probe.style.backgroundColor = `var(--easyedu-${role}-soft)`;
                        host.append(probe);
                    }
                    document.body.append(host);
                    try {
                        for (const node of host.querySelectorAll('[data-case]')) {
                            const style = getComputedStyle(node);
                            const foreground = rgb(style.color);
                            const background = rgb(style.backgroundColor);
                            const ink = luminance(foreground);
                            const surface = luminance(background);
                            results.push({width: innerWidth, palette: palette.name, component: node.dataset.case,
                                colour: style.color, background: style.backgroundColor,
                                ratio: (Math.max(ink, surface) + 0.05) / (Math.min(ink, surface) + 0.05)});
                        }
                    } finally {
                        host.remove();
                    }
                }
                return results;
            }, palettes);
            records.push(...samples);
        }
        for (const sample of records) {
            expect(sample.ratio, `${sample.width}/${sample.palette}/${sample.component}: ${sample.colour} on ${sample.background}`)
                .toBeGreaterThanOrEqual(4.5);
        }
        expect(blocked).toEqual([]);
        expect(errors).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('theme-soft-contrast.json'), JSON.stringify({records, blocked, errors}, null, 2));
    }
});
