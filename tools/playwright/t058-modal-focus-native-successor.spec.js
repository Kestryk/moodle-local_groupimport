'use strict';

const {test, expect} = require('@playwright/test');
const fs = require('node:fs');
const audit = require('./roadmap-audit-helper.cjs');

const visibleModal = (page, selector) => page.locator(selector).filter({visible: true}).first();

// Successor of 9dd156b4: preserve the original spec and native failure evidence.
const awaitModalReady = async(page, modal) => {
    await expect(modal).toBeVisible({timeout: 15000});
    // The navigation action closes its panel in a deferred callback. Wait for
    // that callback before sampling the dialog's focus ownership.
    await expect(page.locator('[data-easyedu-navigation-panel][aria-hidden="false"]')).toHaveCount(0);
    await audit.settle(page.locator('body'));
    await expect.poll(() => modal.evaluate(node => node.contains(document.activeElement)),
        {timeout: 5000, message: 'Native modal must own focus after navigation/dialog settlement'}).toBe(true);
};

const tabContract = async modal => modal.evaluate(node => {
    const selector = 'button, a[href], input, select, textarea, summary, [tabindex]';
    const visible = target => target.isConnected && !target.disabled && !target.matches(':disabled') &&
        target.tabIndex >= 0 && target.getClientRects().length > 0 && !target.closest('[hidden], [inert], [aria-hidden="true"]') &&
        getComputedStyle(target).visibility === 'visible';
    const stops = Array.from(node.querySelectorAll(selector)).filter(visible);
    if (!stops.length) {
        return {count: 0};
    }
    stops[stops.length - 1].focus();
    return {count: stops.length};
});

const assertTrapAndEscape = async(page, opener, modal, record, returnTarget = opener) => {
    await awaitModalReady(page, modal);
    record.initialFocusInside = await modal.evaluate(node => node.contains(document.activeElement));
    const tab = await tabContract(modal);
    record.tabStopCount = tab.count;
    await page.keyboard.press('Tab');
    record.tabWrap = await modal.evaluate(node => {
        const selector = 'button, a[href], input, select, textarea, summary, [tabindex]';
        const visible = target => target.isConnected && !target.disabled && !target.matches(':disabled') &&
            target.tabIndex >= 0 && target.getClientRects().length > 0 && !target.closest('[hidden], [inert], [aria-hidden="true"]') &&
            getComputedStyle(target).visibility === 'visible';
        const stops = Array.from(node.querySelectorAll(selector)).filter(visible);
        return !stops.length || document.activeElement === stops[0];
    });
    await page.keyboard.press('Escape');
    record.escapeClosed = await modal.waitFor({state: 'hidden', timeout: 5000}).then(() => true).catch(() => false);
    await audit.settle(page.locator('body'));
    await expect(returnTarget).toBeFocused({timeout: 5000});
    record.returnedToExpectedTrigger = await returnTarget.evaluate(node => node === document.activeElement);
    expect(record.initialFocusInside).toBe(true);
    expect(record.tabWrap).toBe(true);
    expect(record.escapeClosed).toBe(true);
    expect(record.returnedToExpectedTrigger).toBe(true);
};

const selectFirst = async locator => {
    await expect(locator).toHaveCount(1);
    await locator.evaluate(node => node.click());
};

const runDesktop = async(page, info) => {
    const report = {task: 'T058-focus-correction', level: 'N1', locale: 'fr', viewport: 1280,
        servedFiles: audit.identity(), writesBlocked: [], cases: [], pageErrors: []};
    const save = () => fs.writeFileSync(info.outputPath('t058-modal-focus-native.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', error => { report.pageErrors.push(error.message); save(); });
    await page.setViewportSize({width: 1280, height: 900});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await audit.login(page);
    await audit.blockBusinessWrites(page, report.writesBlocked);
    const root = await audit.ready(page);

    const open = async(name, opener, selector, returnTarget = opener) => {
        const record = {name}; report.cases.push(record); save();
        await expect(opener).toBeVisible(); await expect(opener).toBeEnabled();
        await opener.click();
        await assertTrapAndEscape(page, opener, visibleModal(page, selector), record, returnTarget);
        save();
    };
    await open('participant', root.locator('[data-easystud-open-user]:visible').first(), '[data-easystud-user-modal]');

    const structure = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
    await structure.click(); await audit.settle(root);
    for (const [name, selector] of [['group', '[data-easystud-structure-groups]'], ['grouping', '[data-easystud-tree]']]) {
        const card = root.locator(selector + ' [data-easystud-advanced-type="' + name + '"]:visible').first();
        const direct = card.locator(':scope > .local-groupimport-easystud-' + name + '__header > ' +
            '[data-easystud-open-advanced-settings]:visible').first();
        if (await direct.count()) {
            await open(name + '-settings', direct, '[data-easystud-advanced-settings-modal]');
        } else {
            const menu = card.locator(':scope > [data-easystud-card-menu]:visible, ' +
                ':scope > .local-groupimport-easystud-' + name + '__header > [data-easystud-card-menu]:visible').first();
            await menu.click();
            const action = root.locator('[data-easystud-context-menu]:visible ' +
                '[data-easystud-context-action="' + name + '-open-advanced-settings"]');
            await open(name + '-settings-menu', action, '[data-easystud-advanced-settings-modal]', menu);
        }
    }

    const groupSelection = root.locator('[data-easystud-structure-groups] [data-easystud-group-id]:visible ' +
        '[data-easystud-selector-input]').first();
    await selectFirst(groupSelection);
    await open('move-groups', root.locator('[data-easystud-move-selected-groups]:visible').first(), '[data-easystud-move-modal]');
    const populated = await groupSelection.evaluate(node => !!node.closest('[data-easystud-group-id]')?.querySelector('[data-easystud-member-id]'));
    if (populated) {
        await open('delete-confirmation', root.locator('[data-easystud-delete-selected-groups]:visible').first(),
            '[data-easystud-confirm-modal]');
    } else {
        report.skippedDeleteConfirmation = 'The existing group is empty; no Delete trigger was opened.'; save();
    }

    // EasyStud permits one selection type at a time. Clear the verified Group
    // selection before selecting an existing member; this is presentation-only.
    const clearSelection = root.locator('[data-easystud-clear-all-selection]:visible').first();
    await expect(clearSelection).toBeEnabled();
    await clearSelection.click();
    await audit.settle(root);
    const memberSelection = root.locator('[data-easystud-member-id]:visible [data-easystud-selector-input]').first();
    if (await memberSelection.count()) {
        await selectFirst(memberSelection);
        await audit.settle(root);
        await open('move-members', root.locator('[data-easystud-move-selected-members]:visible').first(), '[data-easystud-move-modal]');
    } else {
        report.skippedMoveMembers = 'No existing visible member row.'; save();
    }

    const participants = root.locator('[data-easystud-layout-mode="participants"]:visible').first();
    await participants.click(); await audit.settle(root);
    const clearMemberSelection = root.locator('[data-easystud-clear-all-selection]:visible').first();
    if (await clearMemberSelection.count()) {
        await clearMemberSelection.click();
        await audit.settle(root);
    }
    const participantSelection = root.locator('[data-easystud-user]:visible [data-easystud-selector-input]').first();
    await selectFirst(participantSelection);
    await open('move-participants', root.locator('[data-easystud-move-selected-participants]:visible').first(), '[data-easystud-move-modal]');
    await open('clipboard', root.locator('[data-easystud-open-clipboard]:visible, [data-easyedu-navigation-action="open-clipboard"]:visible').first(),
        '[data-easystud-clipboard-modal]');

    const massUrl = audit.perfUrl(); massUrl.pathname = '/local/groupimport/index.php'; massUrl.searchParams.set('id', '5');
    await page.goto(massUrl.href, {waitUntil: 'domcontentloaded'});
    const importRoot = page.locator('#local-groupimport-import');
    await expect(importRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(page.locator('[data-local-groupimport-history-modal]'))
        .toHaveAttribute('data-local-groupimport-history-bound', '1');
    const directHistory = page.locator('[data-local-groupimport-history-open]:visible, ' +
        '[data-easyedu-navigation-action="mass-import-history"]:visible').first();
    if (await directHistory.count()) {
        await open('history', directHistory, '[data-local-groupimport-history-modal]');
    } else {
        const massNavigationOpen = page.locator('[data-easyedu-navigation-open]:visible').first();
        await expect(massNavigationOpen).toBeVisible();
        await massNavigationOpen.click();
        await audit.settle(importRoot);
        await open('history', page.locator('[data-easyedu-navigation-action="mass-import-history"]:visible').first(),
            '[data-local-groupimport-history-modal]', massNavigationOpen);
    }
    report.completed = true; save();
};

const runMobile = async(page, info) => {
    const report = {task: 'T058-focus-correction', level: 'N1', locale: 'fr', viewport: 390,
        servedFiles: audit.identity(), writesBlocked: [], cases: [], pageErrors: []};
    const save = () => fs.writeFileSync(info.outputPath('t058-modal-focus-mobile.json'), JSON.stringify(report, null, 2));
    page.on('pageerror', error => { report.pageErrors.push(error.message); save(); });
    await page.setViewportSize({width: 390, height: 844});
    await page.emulateMedia({reducedMotion: 'no-preference'});
    await audit.login(page);
    await audit.blockBusinessWrites(page, report.writesBlocked);
    const root = await audit.ready(page);
    const open = async(name, opener, selector, returnTarget = opener) => {
        const record = {name}; report.cases.push(record); save();
        await expect(opener).toBeVisible(); await opener.click();
        await assertTrapAndEscape(page, opener, visibleModal(page, selector), record, returnTarget); save();
    };
    await open('participant', root.locator('[data-easystud-open-user]:visible').first(), '[data-easystud-user-modal]');
    const navigationOpen = root.locator('[data-easyedu-navigation-open]:visible').first();
    await expect(navigationOpen).toBeVisible();
    await navigationOpen.click();
    await audit.settle(root);
    await open('clipboard', root.locator('[data-easystud-open-clipboard]:visible, [data-easyedu-navigation-action="open-clipboard"]:visible').first(),
        '[data-easystud-clipboard-modal]', navigationOpen);
    const massUrl = audit.perfUrl(); massUrl.pathname = '/local/groupimport/index.php'; massUrl.searchParams.set('id', '5');
    await page.goto(massUrl.href, {waitUntil: 'domcontentloaded'});
    const importRoot = page.locator('#local-groupimport-import');
    await expect(importRoot).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await expect(page.locator('[data-local-groupimport-history-modal]'))
        .toHaveAttribute('data-local-groupimport-history-bound', '1');
    const massNavigationOpen = page.locator('[data-easyedu-navigation-open]:visible').first();
    await expect(massNavigationOpen).toBeVisible();
    await massNavigationOpen.click();
    await audit.settle(importRoot);
    await expect(page.locator('[data-easyedu-navigation-action="mass-import-history"]:visible').first())
        .toHaveAttribute('data-local-groupimport-history-bound', '1');
    await open('history', page.locator('[data-local-groupimport-history-open]:visible, ' +
        '[data-easyedu-navigation-action="mass-import-history"]:visible').first(),
    '[data-local-groupimport-history-modal]', massNavigationOpen);
    report.completed = true; save();
};

test('T058 focus correction retains keyboard lifecycle on FR1280', async({page}, info) => {
    test.setTimeout(420000);
    await runDesktop(page, info);
});

test('T058 focus correction retains keyboard lifecycle on FR390', async({page}, info) => {
    test.setTimeout(300000);
    await runMobile(page, info);
});
