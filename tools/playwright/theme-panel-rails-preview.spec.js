const {test, expect} = require('@playwright/test');
const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

// local-supervised: actual native panels + transient palette roots; no Save,
// fixtures, file uploads or commands. Persistence is a separate future gate.
test('Native workspace rails consume custom palette without geometry drift', async({page}, testInfo) => {
    test.setTimeout(150000);
    const palettes = JSON.parse(execFileSync(process.env.EASYEDU_PALETTE_PHP || 'php', [
        path.resolve(__dirname, '../release/test-theme-palette-standalone.php'), '--json',
    ], {encoding: 'utf8'}));
    // Independent role opt-ins are not covered by uniform palettes alone.
    palettes.push({name: 'primary-only', style: '--easyedu-primary-chosen:#7b3f98;', railRoles: 'primary'});
    palettes.push({name: 'success-only', style: '--easyedu-accent-chosen:#b9ebd0;', railRoles: 'success'});
    const records = [];
    const binding = [];
    const errors = [];
    const blocked = [];
    const bootstrapReads = [];
    page.on('pageerror', error => errors.push(error.message));
    const initial = new URL(process.env.EASYEDU_MOODLE_URL);
    await page.goto(initial.href);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
    }
    await page.route('**/*', route => {
        if (route.request().method() === 'POST') {
            const request = route.request();
            const pathname = new URL(request.url()).pathname;
            let methods = [];
            try {
                const body = request.postDataJSON();
                if (Array.isArray(body)) methods = body.map(call => call.methodname);
            } catch (_) { /* Unknown POST remains denied. */ }
            // Native Moodle bootstrap loads translations/templates and the
            // existing unsent draft through
            // read-only Ajax functions. Allow no other POST and log no args.
            const allowed = new Set(['core_get_string', 'core_get_strings',
                'core_output_load_template', 'core_output_load_template_with_dependencies',
                'core_message_get_unsent_message']);
            if (pathname === '/lib/ajax/service.php' && methods.length && methods.every(method => allowed.has(method))) {
                bootstrapReads.push(...methods);
                return route.continue();
            }
            blocked.push({pathname, methods});
            return route.abort();
        }
        return route.continue();
    });
    try {
        for (const [route, rootSelector, selector] of [
            ['manage.php', '#local-groupimport-easystud', '.easyedu-workspace-panel'],
            ['index.php', '#local-groupimport-import', '.easyedu-panel'],
        ]) {
            const url = new URL(`/local/groupimport/${route}`, initial);
            url.search = initial.search;
            await page.goto(url.href);
            const root = page.locator(rootSelector);
            await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
            const initialBinding = await root.evaluate(node => {
                const style = getComputedStyle(node);
                return {attribute: node.getAttribute('data-easyedu-custom-rails'),
                    primary: style.getPropertyValue('--easyedu-primary-chosen').trim().toLowerCase(),
                    accent: style.getPropertyValue('--easyedu-accent-chosen').trim().toLowerCase()};
            });
            const expectedRoles = [initialBinding.primary !== '#0f6cbf' ? 'primary' : '',
                initialBinding.accent !== '#1b7f5a' ? 'success' : ''].filter(Boolean).join(' ');
            expect(initialBinding.attribute).toBe(expectedRoles);
            binding.push({route, ...initialBinding});
            for (const width of [1600, 768, 390]) {
                await page.setViewportSize({width, height: 1000});
                const samples = await root.evaluate((node, {palettes, selector, route}) => {
                    const originalStyle = node.getAttribute('style');
                    const originalRoles = node.getAttribute('data-easyedu-custom-rails');
                    const panels = [...node.querySelectorAll(selector)];
                    const geometry = panel => {
                        const style = getComputedStyle(panel);
                        const rect = panel.getBoundingClientRect();
                        return {width: rect.width, height: rect.height, radius: style.borderRadius,
                            size: style.backgroundSize, overflow: style.overflow,
                            border: style.borderWidth, position: style.backgroundPosition};
                    };
                    const baseline = panels.map(geometry);
                    const probe = document.createElement('span');
                    probe.style.display = 'none';
                    node.append(probe);
                    const canvas = document.createElement('canvas');
                    canvas.width = canvas.height = 1;
                    const context = canvas.getContext('2d');
                    const rgb = expression => {
                        probe.style.color = expression;
                        context.fillStyle = getComputedStyle(probe).color;
                        context.fillRect(0, 0, 1, 1);
                        return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
                    };
                    const result = [];
                    try {
                        for (const palette of palettes) {
                            node.style.cssText = palette.style;
                            node.setAttribute('data-easyedu-custom-rails', palette.railRoles);
                            for (const [index, panel] of panels.entries()) {
                                const role = panel.classList.contains('easyedu-panel--success') ||
                                    panel.classList.contains('easyedu-workspace-panel--success') ? 'success' : 'primary';
                                const custom = palette.railRoles.split(' ').includes(role);
                                const chosen = role === 'primary' ? 'primary' : 'accent';
                                const expected = custom ?
                                    [rgb(`var(--easyedu-${chosen}-chosen)`),
                                        rgb(`color-mix(in srgb,var(--easyedu-${chosen}-chosen) 68%,#fff 32%)`)] :
                                    (role === 'primary' ? [[15,108,191],[91,155,216]] : [[27,127,90],[101,169,127]]);
                                const image = getComputedStyle(panel).backgroundImage;
                                const colours = [...image.matchAll(/rgba?\([^)]*\)|color\([^)]*\)/g)].slice(0, 2)
                                    .map(match => rgb(match[0]));
                                result.push({route, width: innerWidth, palette: palette.name, role,
                                    image, colours, expected, geometry: geometry(panel), baseline: baseline[index]});
                            }
                        }
                    } finally {
                        probe.remove();
                        if (originalStyle === null) node.removeAttribute('style');
                        else node.setAttribute('style', originalStyle);
                        if (originalRoles === null) node.removeAttribute('data-easyedu-custom-rails');
                        else node.setAttribute('data-easyedu-custom-rails', originalRoles);
                    }
                    return result;
                }, {palettes, selector, route});
                expect(samples).toHaveLength(palettes.length * 2);
                records.push(...samples);
                for (const sample of samples) {
                    expect(sample.colours, `${route}/${width}/${sample.palette}/${sample.role}`).toEqual(sample.expected);
                    expect(sample.geometry).toEqual(sample.baseline);
                }
            }
        }
        expect(errors).toEqual([]);
        expect(blocked).toEqual([]);
    } finally {
        fs.writeFileSync(testInfo.outputPath('theme-panel-rails.json'), JSON.stringify({binding, records, errors, blocked, bootstrapReads}, null, 2));
    }
});
