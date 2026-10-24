/* eslint-env node */
const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');

test('selection actions retain the primary palette beside Bootstrap compatibility classes', async({page}) => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../styles/mass-import.css'), 'utf8');
    await page.setContent('<style>' + css + '</style>' +
        '<main id="local-groupimport-import" class="local-groupimport-import easyedu-ui">' +
        '<button id="reference" class="foundation-selection-action">Full details</button>' +
        '<button id="neutral" class="foundation-selection-action btn-outline-secondary">Select this page</button>' +
        '<a id="tray" class="foundation-selection-action btn-outline-secondary foundation-selection-action--tray">Cancel</a>' +
        '<button id="danger" class="foundation-selection-action btn-outline-danger">Remove</button>' +
        '<button id="solid" class="foundation-selection-action btn-primary">Apply</button>' +
        '<button id="disabled" class="foundation-selection-action btn-outline-secondary" disabled>Disabled</button>' +
        '<button id="recovery" class="foundation-selection-action btn-outline-secondary ' +
        'easyedu-selection-recovery-action">Clear</button>' +
        '</main>');
    const read = id => page.locator('#' + id).evaluate(element => {
        const style = getComputedStyle(element);
        return {color: style.color, border: style.borderTopColor, background: style.backgroundColor,
            size: style.fontSize, weight: style.fontWeight, radius: style.borderRadius};
    });
    const reference = await read('reference');
    for (const id of ['neutral', 'tray']) {
        const actual = await read(id);
        expect(actual.color).toBe(reference.color);
        expect(actual.border).toBe(reference.border);
        expect(actual.size).toBe(reference.size);
        expect(actual.weight).toBe(reference.weight);
        expect(actual.radius).toBe(reference.radius);
    }
    expect((await read('solid')).background).toBe(reference.color);
    expect((await read('solid')).color).toBe('rgb(255, 255, 255)');
    expect((await read('danger')).color).toBe('rgb(161, 43, 43)');
    expect((await read('disabled')).color).toBe('rgb(92, 108, 125)');
    expect((await read('recovery')).border).toBe('rgba(0, 0, 0, 0)');
});
