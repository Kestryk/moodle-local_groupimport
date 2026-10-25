/* eslint-env node */
'use strict';

// Isolated rendering and ordered cascade proof; not a native Moodle certification.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const root = path.resolve(__dirname, '../..');
const [postcssPath, playwrightPath, output, baseline = 'cc8231dd'] = process.argv.slice(2);
assert.ok([postcssPath, playwrightPath, output].every(value => value && path.isAbsolute(value)));
const postcss = require(postcssPath);
const {chromium} = require(playwrightPath);
fs.mkdirSync(output, {recursive: true});
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const previous = file => cp.execFileSync('git', ['show', baseline + ':' + file],
    {cwd: root, encoding: 'utf8', maxBuffer: 10 * 1024 * 1024});
const ordered = (text, candidate) => {
    const ast = postcss.parse(text);
    if (candidate) {
        // The base includes K20-04 SCSS but not its rebuilt page CSS. Accept
        // only its exact approved wrapping rule, never another Guide delta.
        ast.walkRules(rule => {
            if (rule.selector === '.local-groupimport-easystud-easyedu-guide.easyedu-guide.easyedu-guide--discovery ' +
                    '.easyedu-guide-spec__tile .easyedu-information__description') {
                assert.deepEqual(rule.nodes.map(node => [node.prop, node.value]),
                    [['overflow-wrap', 'anywhere'], ['word-break', 'break-word']]);
                rule.remove();
            }
        });
        ast.walkDecls('--easyedu-lane-border-colour', declaration => declaration.remove());
        ast.walkDecls('box-shadow', declaration => {
            if (declaration.value === 'inset 0 0 0 1px var(--easyedu-lane-border-colour)') {
                declaration.value = 'none';
            }
        });
    }
    const rows = [];
    ast.walk(node => {
        if (node.type === 'comment') {
            return;
        }
        rows.push([node.type, node.selector || node.name || node.prop, node.params || node.value, !!node.important]);
    });
    return rows;
};
for (const file of ['student-management', 'guide', 'mass-import', 'administration']) {
    assert.ok(JSON.stringify(ordered(read('styles/' + file + '.css'), true)) ===
        JSON.stringify(ordered(previous('styles/' + file + '.css'), false)),
    file + ': only lane boundary paint and exact inherited K20-04 wrapping rule');
}
assert.equal(read('styles.css').trim(), previous('styles.css').trim());
const manage = read('manage.php');
assert.match(manage, /js_call_amd\('local_groupimport\/page_bootstrap', 'init', \['easystud-page-config'\]\)/);
assert.doesNotMatch(manage, /js_call_amd\('local_groupimport\/(?:course_manager|easyedu_guide)'/);
assert.match(read('settings.php'), /has_set_url\(\)/);

(async() => {
    const browser = await chromium.launch({channel: 'chrome', headless: true});
    const rows = [];
    const errors = [];
    try {
        for (const width of [1600, 390]) {
            for (const host of ['#ffffff', '#f2f3f7', '#f8f9fa']) {
                const page = await browser.newPage({viewport: {width, height: 1000}});
                page.on('pageerror', error => errors.push(error.message));
                page.on('console', message => {
                    if (message.type() === 'error') {
                        errors.push(message.text());
                    }
                });
                const measurements = [];
                for (const state of ['before', 'after']) {
                    const css = state === 'before' ? previous('styles/student-management.css') :
                        read('styles/student-management.css');
                    await page.setContent(`<style>${css}</style><body style="margin:0;background:${host}">
                      <main id="local-groupimport-easystud" class="easyedu-ui local-groupimport-easystud">
                        <div class="local-groupimport-easystud__layout">
                          <section class="local-groupimport-easystud__panel"><div class="card-body">Participants</div></section>
                          <section class="local-groupimport-easystud__panel local-groupimport-easystud__panel--structure">
                            <div class="card-body">Groups</div></section>
                        </div>
                      </main></body>`);
                    measurements.push(await page.locator('.local-groupimport-easystud__panel').evaluateAll(elements => {
                        const canvas = document.createElement('canvas');
                        canvas.width = canvas.height = 1;
                        const context = canvas.getContext('2d', {willReadFrequently: true});
                        const rgb = value => {
                            context.clearRect(0, 0, 1, 1);
                            context.fillStyle = value;
                            context.fillRect(0, 0, 1, 1);
                            return [...context.getImageData(0, 0, 1, 1).data].slice(0, 3);
                        };
                        return elements.map(element => {
                            const style = getComputedStyle(element);
                            const box = element.getBoundingClientRect();
                            const probe = document.createElement('span');
                            element.append(probe);
                            probe.style.color = 'var(--easyedu-lane-border-colour, transparent)';
                            const border = rgb(getComputedStyle(probe).color);
                            probe.remove();
                            return {x: box.x, y: box.y, width: box.width, height: box.height,
                                padding: style.padding, radius: style.borderRadius, text: rgb(style.color),
                                surface: rgb(style.backgroundColor), border, shadow: style.boxShadow};
                        });
                    }));
                }
                const luminance = rgb => rgb.map(value => {
                    value /= 255;
                    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
                }).reduce((total, value, index) => total + value * [0.2126, 0.7152, 0.0722][index], 0);
                const contrast = (a, b) => (Math.max(luminance(a), luminance(b)) + 0.05) /
                    (Math.min(luminance(a), luminance(b)) + 0.05);
                const hostRgb = host.match(/\w\w/g).map(value => parseInt(value, 16));
                measurements[1].forEach((after, index) => {
                    const before = measurements[0][index];
                    for (const key of ['x', 'y', 'width', 'height', 'padding', 'radius', 'text', 'surface']) {
                        assert.deepEqual(after[key], before[key], key + ': existing geometry/paint unchanged');
                    }
                    assert.notEqual(after.shadow, 'none');
                    assert.ok(contrast(after.border, hostRgb) >= 3, 'Lane boundary contrasts on each host');
                    assert.ok(contrast(after.text, after.surface) >= 4.5, 'Text contrast preserved');
                    rows.push({width, host, lane: index, before, after,
                        previousSurfaceContrast: contrast(before.surface, hostRgb),
                        boundaryContrast: contrast(after.border, hostRgb),
                        textContrast: contrast(after.text, after.surface)});
                });
                await page.close();
            }
        }
        assert.deepEqual(errors, []);
        fs.writeFileSync(path.join(output, 'lanes.json'), JSON.stringify({status: 'PASS', rows, errors}, null, 2));
        console.log(JSON.stringify({status: 'PASS', measurements: rows.length, errors: errors.length}));
    } finally {
        await browser.close();
    }
})().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
