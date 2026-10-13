'use strict';

const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

const viewports = [
    {name: 'tablet-1024', width: 1024, height: 900},
    {name: 'tablet-768', width: 768, height: 900},
    {name: 'mobile-390', width: 390, height: 844},
];

const recordGeometry = async(page, root, label) => {
    const geometry = await root.evaluate((node, surfaceLabel) => {
        const bounds = node.getBoundingClientRect();
        const documentRoot = document.documentElement;
        return {
            label: surfaceLabel,
            viewport: {width: window.innerWidth, height: window.innerHeight},
            documentOverflow: documentRoot.scrollWidth - documentRoot.clientWidth,
            rootOverflow: node.scrollWidth - node.clientWidth,
            root: {left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom,
                width: bounds.width, height: bounds.height},
        };
    }, label);
    return geometry;
};

const recordModal = async(page, report, name, opener, selector, returnTarget = opener) => {
    const item = {name, available: false};
    report.modals.push(item);
    if (!await opener.count() || !await opener.isVisible() || !await opener.isEnabled()) {
        item.reason = 'No visible enabled native entry in this viewport.';
        return;
    }
    item.available = true;
    await opener.click();
    const modal = page.locator(selector).filter({visible: true}).first();
    const opened = await modal.waitFor({state: 'visible', timeout: 15000}).then(() => true).catch(() => false);
    item.opened = opened;
    if (!opened) {
        item.reason = 'The existing entry did not reveal its expected dialog.';
        return;
    }
    await audit.settle(modal);
    item.geometry = await modal.evaluate(node => {
        const dialog = node.querySelector('.local-groupimport-easystud-modal__dialog, ' +
            '.local-groupimport-import-modal__dialog, .modal-dialog') || node;
        const box = dialog.getBoundingClientRect();
        return {
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            dialog: {left: box.left, right: box.right, top: box.top, bottom: box.bottom,
                width: box.width, height: box.height},
            viewport: {width: window.innerWidth, height: window.innerHeight},
            containedHorizontally: box.left >= -1 && box.right <= window.innerWidth + 1,
        };
    });
    await page.keyboard.press('Escape');
    item.closedWithEscape = await modal.waitFor({state: 'hidden', timeout: 5000}).then(() => true).catch(() => false);
    if (!item.closedWithEscape) {
        item.reason = 'Escape did not close the dialog during this audit.';
        return;
    }
    await audit.settle(page.locator('body'));
    item.returnedToExpectedTrigger = await returnTarget.evaluate(node => node === document.activeElement);
};

const openCompactEntry = async(page, root, action) => {
    let direct = root.locator('[data-easyedu-navigation-action="' + action + '"]:visible').first();
    if (action === 'open-clipboard' && !await direct.count()) {
        direct = root.locator('[data-easystud-open-clipboard]:visible').first();
    }
    if (await direct.count()) {
        return {opener: direct, returnTarget: direct, compact: false};
    }
    const trigger = root.locator('[data-easyedu-navigation-open]:visible').first();
    if (!await trigger.count()) {
        return {opener: direct, returnTarget: direct, compact: false};
    }
    await trigger.click();
    await audit.settle(root);
    return {
        opener: action === 'open-clipboard' ?
            root.locator('[data-easyedu-navigation-action="open-clipboard"]:visible, ' +
                '[data-easystud-open-clipboard]:visible').first() :
            root.locator('[data-easyedu-navigation-action="' + action + '"]:visible').first(),
        returnTarget: trigger,
        compact: true,
    };
};

const capture = async(page, info, name) => {
    await page.screenshot({path: info.outputPath(name + '.png'), fullPage: false});
};

const modalInventory = async page => page.evaluate(() => {
    const selectors = {
        participant: '[data-easystud-user-modal]',
        advancedSettings: '[data-easystud-advanced-settings-modal]',
        move: '[data-easystud-move-modal]',
        confirmation: '[data-easystud-confirm-modal]',
        clipboard: '[data-easystud-clipboard-modal]',
        message: '.local-groupimport-easystud-message-modal',
        history: '[data-local-groupimport-history-modal]',
        rollback: '[data-local-groupimport-rollback-modal]',
        native: '.modal[role="dialog"]',
    };
    return Object.fromEntries(Object.entries(selectors).map(([name, selector]) => [name,
        document.querySelectorAll(selector).length]));
});

test('T059 audits responsive EasyStud surfaces and dialogs without writes', async({page}, info) => {
    test.setTimeout(600000);
    page.setDefaultTimeout(15000);
    // Administration can legitimately need more than the control timeout on
    // the shared local stack; record layout only after its document is ready.
    page.setDefaultNavigationTimeout(60000);
    const report = {task: 'T059', level: 'N1-audit', locale: 'fr', servedFiles: audit.identity(),
        viewports: [], modals: [], findings: [], blockedWrites: [], pageErrors: [], humanAccepted: false};
    const save = () => fs.writeFileSync(info.outputPath('t059-responsive-audit.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', error => { report.pageErrors.push(error.message); save(); });
    await audit.blockBusinessWrites(page, report.blockedWrites);

    for (const viewport of viewports) {
        const view = {name: viewport.name, width: viewport.width, height: viewport.height, surfaces: []};
        report.viewports.push(view); save();
        await page.setViewportSize({width: viewport.width, height: viewport.height});

        await audit.login(page);
        const manager = await audit.ready(page);
        const managerEntry = {name: 'student-management', states: [], modalTemplates: await modalInventory(page)};
        view.surfaces.push(managerEntry);
        managerEntry.states.push(await recordGeometry(page, manager, 'initial'));
        for (const mobileView of ['participants', 'groups', 'groupings']) {
            const toggle = manager.locator('[data-easystud-mobile-view="' + mobileView + '"]:visible').first();
            if (!await toggle.count()) {
                managerEntry.states.push({label: mobileView, unavailable: true});
                continue;
            }
            await toggle.click();
            await audit.settle(manager);
            managerEntry.states.push(await recordGeometry(page, manager, mobileView));
        }
        await capture(page, info, 't059-manager-' + viewport.name);
        const participantsView = manager.locator('[data-easystud-mobile-view="participants"]:visible').first();
        await expect(participantsView).toBeVisible();
        await participantsView.click();
        await audit.settle(manager);
        await recordModal(page, report, viewport.name + '-participant',
            manager.locator('[data-easystud-open-user]:visible').first(), '[data-easystud-user-modal]');

        const clipboard = await openCompactEntry(page, manager, 'open-clipboard');
        await recordModal(page, report, viewport.name + '-clipboard', clipboard.opener,
            '[data-easystud-clipboard-modal]', clipboard.returnTarget);

        const importUrl = audit.perfUrl();
        importUrl.pathname = '/local/groupimport/index.php';
        importUrl.searchParams.set('id', '5');
        await page.goto(importUrl.href, {waitUntil: 'domcontentloaded'});
        const importer = page.locator('#local-groupimport-import');
        await expect(importer).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await audit.settle(importer);
        const importEntry = {name: 'mass-import', states: [await recordGeometry(page, importer, 'initial')],
            modalTemplates: await modalInventory(page)};
        view.surfaces.push(importEntry);
        await capture(page, info, 't059-import-' + viewport.name);
        const history = await openCompactEntry(page, importer, 'mass-import-history');
        await recordModal(page, report, viewport.name + '-history', history.opener,
            '[data-local-groupimport-history-modal]', history.returnTarget);

        const adminUrl = audit.perfUrl();
        adminUrl.pathname = '/admin/settings.php';
        adminUrl.search = '?section=local_groupimport&lang=fr';
        await page.goto(adminUrl.href, {waitUntil: 'domcontentloaded'});
        const admin = page.locator('#page-admin-setting-local_groupimport');
        await expect(admin).toBeVisible({timeout: 60000});
        await expect(admin).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
        await audit.settle(admin);
        view.surfaces.push({name: 'administration', states: [await recordGeometry(page, admin, 'initial')],
            modalTemplates: await modalInventory(page)});
        await capture(page, info, 't059-administration-' + viewport.name);
        save();
    }

    for (const view of report.viewports) {
        for (const surface of view.surfaces) {
            for (const state of surface.states) {
                if (!state.unavailable && state.documentOverflow > 2) {
                    report.findings.push({viewport: view.name, surface: surface.name, state: state.label,
                        kind: 'document-horizontal-overflow', pixels: state.documentOverflow});
                }
            }
        }
    }
    for (const modal of report.modals) {
        if (modal.available && (!modal.opened || !modal.closedWithEscape || !modal.returnedToExpectedTrigger ||
                !modal.geometry?.containedHorizontally || modal.geometry.documentOverflow > 2)) {
            report.findings.push({modal: modal.name, kind: 'modal-contract', detail: modal});
        }
    }
    report.completed = true;
    save();
    expect(report.blockedWrites, 'T059 must not request a business write').toEqual([]);
});
