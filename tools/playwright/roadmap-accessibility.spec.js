'use strict';
const {test, expect} = require('@playwright/test');
const {default: AxeBuilder} = require('@axe-core/playwright');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');
const {inventory} = require('../release/accessibility-inventory.cjs');

// local-supervised read-only AUDIT, not a green accessibility acceptance test.
test('T058 audits native FR1280 modal and panel accessibility on Perf', async({page}, info) => {
    test.setTimeout(600000); page.setDefaultTimeout(10000);
    const report = {task: 'T058', level: 'N1', viewport: 1280, locale: 'fr', servedFiles: audit.identity(),
        inventory: inventory(), cases: [], axe: [], gaps: [], blockedWrites: [], pageErrors: [],
        writesRequested: false, humanAccepted: false};
    const save = () => fs.writeFileSync(info.outputPath('T058-raw.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', error => report.pageErrors.push(error.message));
    await page.setViewportSize({width: 1280, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    let root;
    const axe = async (selector, name) => {
        const result = await new AxeBuilder({page}).include(selector).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        report.axe.push({name, violations: result.violations.map(v => ({id: v.id, impact: v.impact, help: v.help,
            nodes: v.nodes.map(n => ({target: n.target, checks: [...n.any, ...n.all, ...n.none].map(c => ({
                id: c.id, message: c.message, data: c.id === 'color-contrast' ? c.data : undefined}))}))})),
            incomplete: result.incomplete.map(v => ({id: v.id, nodeCount: v.nodes.length}))});
        save();
    };
    const reset = async mode => {
        root = await audit.ready(page);
        // Native presentation cleanup without a second heavy GET or any writes.
        await root.locator('[data-easystud-selector-input]').evaluateAll(nodes => {
            for (const n of nodes) if (n.isConnected && n.checked) n.click();
        });
        if (mode) {
            const toggle = root.locator('[data-easystud-layout-mode="' + mode + '"]:visible').first();
            if (await toggle.count()) { await toggle.click(); await audit.settle(root); }
        }
    };
    const dialog = async (name, opener, selector) => {
        const item = {name, selector, status: 'unavailable'};
        report.cases.push(item); save();
        if (!(await opener.count()) || !(await opener.isVisible()) || !(await opener.isEnabled())) {
            report.gaps.push({name, reason: 'No visible enabled native entry with existing course data'}); return;
        }
        await opener.click();
        const modal = page.locator(selector).filter({visible: true}).first();
        if (!await modal.waitFor({state: 'visible', timeout: 15000}).then(() => true).catch(() => false)) {
            item.status = 'open-failed'; save(); return;
        }
        await audit.settle(modal);
        item.focusAtOpen = await modal.evaluate(n => n.contains(document.activeElement));
        item.semantic = await modal.evaluate(n => ({role: n.getAttribute('role'), ariaModal: n.getAttribute('aria-modal'),
            labelled: !!(n.getAttribute('aria-label')?.trim() || n.getAttribute('aria-labelledby')?.split(/\s+/)
                .some(id => document.getElementById(id)?.textContent.trim())),
            focusableCount: [...n.querySelectorAll('button,input,select,textarea,a[href],[tabindex]')]
                .filter(e => e.tabIndex >= 0 && !e.disabled && e.getClientRects().length).length}));
        item.tabSamples = [];
        const steps = Math.min(60, item.semantic.focusableCount * 2 + 2);
        for (let i = 0; i < steps; i++) {
            await page.keyboard.press('Tab');
            item.tabSamples.push(await modal.evaluate(n => n.contains(document.activeElement)));
        }
        await page.keyboard.press('Shift+Tab');
        item.shiftTabInside = await modal.evaluate(n => n.contains(document.activeElement));
        item.trapSamplePassed = item.tabSamples.every(Boolean) && item.shiftTabInside;
        await axe(selector, name);
        await page.keyboard.press('Escape');
        item.escapeClosed = await modal.waitFor({state: 'hidden', timeout: 3000}).then(() => true).catch(() => false);
        if (!item.escapeClosed) {
            const close = modal.locator('[data-action="cancel"], [data-action="hide"], [data-easystud-close-user-modal], ' +
                '[data-easystud-close-advanced-settings], [data-easystud-close-move-modal], [data-easystud-close-confirm-modal], ' +
                '[data-easystud-close-clipboard], [data-easyedu-guide-close], [data-local-groupimport-history-close], ' +
                '[data-local-groupimport-rollback-close]').filter({visible: true}).first();
            if (await close.count()) { await close.click(); await modal.waitFor({state: 'hidden', timeout: 3000}).catch(() => {}); }
        }
        item.returnFocus = await opener.evaluate(n => n === document.activeElement);
        item.status = 'audited';
        item.passed = item.focusAtOpen && item.escapeClosed && item.returnFocus && item.trapSamplePassed && item.semantic.labelled;
        save();
    };
    const panel = async (name, opener) => {
        const item = {name, kind: 'nonmodal-disclosure', focusTrap: 'not-required', status: 'unavailable'};
        report.cases.push(item);
        if (!(await opener.count()) || !(await opener.isVisible()) || !(await opener.isEnabled())) {
            report.gaps.push({name, reason: 'Native disclosure entry absent/hidden'}); save(); return;
        }
        const before = await opener.getAttribute('aria-expanded');
        await opener.click(); await audit.settle(root);
        item.expandedAfterOpen = await opener.getAttribute('aria-expanded');
        await page.keyboard.press('Escape'); await audit.settle(root);
        item.expandedAfterEscape = await opener.getAttribute('aria-expanded');
        item.returnFocus = await opener.evaluate(n => n === document.activeElement);
        item.escapePolicy = 'recorded; ordinary nonmodal disclosures need not close on Escape';
        if ((await opener.getAttribute('aria-expanded')) !== before) { await opener.click(); await audit.settle(root); }
        item.status = 'audited'; save();
    };
    try {
        await audit.login(page);
        await audit.blockBusinessWrites(page, report.blockedWrites);
        root = await audit.ready(page);
        expect(await page.locator('html').getAttribute('lang')).toMatch(/^fr/);
        await axe('#local-groupimport-easystud', 'student-initial');
        await dialog('participant-details', root.locator('[data-easystud-open-user]:visible').first(), '[data-easystud-user-modal]');
        for (const kind of ['group', 'grouping']) {
            await reset('structure');
            const area = kind === 'group' ? '[data-easystud-structure-groups]' : '[data-easystud-tree]';
            await dialog(kind + '-settings', root.locator(area + ' [data-easystud-open-advanced-settings]' +
                '[data-easystud-advanced-target="' + kind + '"]:visible').first(), '[data-easystud-advanced-settings-modal]');
        }
        for (const kind of ['participants', 'groups', 'members']) {
            await reset(kind === 'participants' ? 'participants' : 'structure');
            const selection = root.locator(kind === 'participants' ? '[data-easystud-user]:visible [data-easystud-selector-input]' :
                kind === 'groups' ? '[data-easystud-structure-groups] [data-easystud-group-id]:visible [data-easystud-selector-input]' :
                    '[data-easystud-member-id]:visible [data-easystud-selector-input]').first();
            if (!(await selection.count())) { report.gaps.push({name: 'move-' + kind, reason: 'No existing selectable entity'}); continue; }
            // Existing presentation oracle uses input click; this is NOT keyboard selection proof.
            await selection.evaluate(n => n.click());
            await dialog('move-' + kind, root.locator('[data-easystud-move-selected-' + kind + ']:visible').first(), '[data-easystud-move-modal]');
            if (kind === 'participants') await dialog('message-participants',
                root.locator('[data-easystud-message-selected-participants]:visible').first(), '.local-groupimport-easystud-message-modal.show');
            if (kind === 'groups') {
                const populated = await selection.evaluate(n => !!n.closest('[data-easystud-group-id]')?.querySelector('[data-easystud-member-id]'));
                if (populated) await dialog('delete-group-confirmation',
                    root.locator('[data-easystud-delete-selected-groups]:visible').first(), '[data-easystud-confirm-modal]');
                else report.gaps.push({name: 'delete-group-confirmation', reason: 'Selected Group empty; no Delete click, which could bypass confirmation'});
            }
        }
        await reset('participants');
        await dialog('clipboard', root.locator('[data-easystud-open-clipboard]:visible, [data-easyedu-navigation-action="open-clipboard"]:visible').first(),
            '[data-easystud-clipboard-modal]');
        await dialog('guide', page.locator('[data-easyedu-guide-open]:visible').first(), '[data-easyedu-guide-modal]');
        await reset('participants');
        await panel('more-filters-participants', root.locator('[data-easystud-advanced-filters-toggle="participants"]:visible').first());
        await reset('structure');
        for (const name of ['structure-groups', 'structure-groupings']) await panel('more-filters-' + name,
            root.locator('[data-easystud-advanced-filters-toggle="' + name + '"]:visible').first());
        for (const [name, selector] of [['group-member-search', '[data-easystud-group-member-search-toggle]'],
            ['add-identifiers', '[data-easystud-toggle-group-email]'], ['add-groups', '[data-easystud-toggle-grouping-groups]'],
            ['grouping-search', '[data-easystud-container-search-toggle]']]) await panel(name, root.locator(selector + ':visible').first());
        const url = audit.perfUrl(); url.pathname = '/local/groupimport/index.php';
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
        const mass = page.locator('#local-groupimport-import');
        await expect(mass).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await axe('#local-groupimport-import', 'mass-import');
        await dialog('import-history', page.locator('[data-easyedu-navigation-item-id="mass-import-history"] button:visible').first(),
            '[data-local-groupimport-history-modal]');
        report.gaps.push({name: 'rollback-confirmation', reason: 'Requires suitable native import history; no synthetic data created'},
            {name: 'delete-member/grouping-confirmation', reason: 'Shared confirmation audited for Groups; entity-specific branch coverage remains'},
            {name: 'mobile-navigation/context-menus', reason: 'Outside proportional FR1280 N1; source inventory retained for compact follow-up'},
            {name: 'Guide checklist/tutorial legacy panels', reason: 'Separate Guide owner; no fake progression or forced hidden UI'},
            {name: 'reduced-motion', reason: 'Not executed in this FR1280 normal-motion pass'},
            {name: 'keyboard drag alternative', reason: 'Move dialogs exercised, sequential checkbox entry not certified'});
        report.completed = true;
        report.passed = report.cases.every(c => c.passed !== false && c.status === 'audited') &&
            report.axe.every(a => a.violations.length === 0) && report.gaps.length === 0;
        // Completion asserts the audit ran. Findings/gaps remain explicit, never relabelled PASS.
        expect(report.cases.length).toBeGreaterThan(0);
    } finally { save(); }
});
