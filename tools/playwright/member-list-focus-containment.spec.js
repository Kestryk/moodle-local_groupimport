const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const settleMotion = async page => {
    await page.evaluate(async() => {
        const root = document.querySelector('#local-groupimport-easystud');
        if (!root || !root.getAnimations) {
            return;
        }
        const animations = root.getAnimations({subtree: true}).filter(animation => {
            const timing = animation.effect && animation.effect.getComputedTiming ?
                animation.effect.getComputedTiming() : null;
            return !timing || Number.isFinite(timing.iterations);
        });
        await Promise.race([
            Promise.all(animations.map(animation => animation.finished.catch(() => undefined))),
            new Promise(resolve => window.setTimeout(resolve, 1200)),
        ]);
    });
};

const login = async page => {
    const errors = [];
    const failedRequests = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            errors.push(message.text());
        }
    });
    page.on('requestfailed', request => failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText || '',
    }));

    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the member focus audit.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    await expect(root).not.toHaveAttribute('data-easystud-manager-initialising', '1', {timeout: 60000});
    return {root, errors, failedRequests};
};

const findNestedCollapsibleGroup = async(page, root) => {
    const structure = root.locator('[data-easystud-layout-mode="structure"]:visible').first();
    await expect(structure).toBeVisible();
    await structure.click();
    await settleMotion(page);

    const groupings = root.locator('[data-easystud-grouping-id]:visible');
    for (let groupingIndex = 0; groupingIndex < await groupings.count(); groupingIndex++) {
        const grouping = groupings.nth(groupingIndex);
        const groupingToggle = grouping.locator(
            ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
        );
        if (await groupingToggle.count() && await groupingToggle.getAttribute('aria-expanded') !== 'true') {
            await groupingToggle.click();
            await settleMotion(page);
        }

        const groups = grouping.locator(
            ':scope > [data-easystud-container-group-list] > [data-easystud-group-id]:visible'
        );
        for (let groupIndex = 0; groupIndex < await groups.count(); groupIndex++) {
            const group = groups.nth(groupIndex);
            const members = group.locator(':scope > [data-easystud-group-members] > [data-easystud-member-id]');
            const toggle = group.locator(':scope > [data-easystud-group-members-toggle]:visible');
            if (await members.count() > 2 && await toggle.count()) {
                return {group, toggle};
            }
        }
    }
    throw new Error('The Moodle 5.1 fixture needs one Grouping containing a Group with at least three members.');
};

test('collapsed nested group members stay out of keyboard focus and restore on open', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 1440, height: 1000});
    const {root, errors, failedRequests} = await login(page);
    const {group, toggle} = await findNestedCollapsibleGroup(page, root);
    const list = group.locator(':scope > [data-easystud-group-members]');

    if (await toggle.getAttribute('aria-expanded') === 'true') {
        await toggle.click();
        await expect(list).toHaveClass(/is-easyedu-disclosing/);
        await settleMotion(page);
    }
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const collapsedMembers = list.locator(':scope > [data-easystud-member-id].is-collapsed');
    await expect(collapsedMembers).not.toHaveCount(0);
    await expect(collapsedMembers.first()).toHaveAttribute('inert', '');
    const collapsedActionTabindexes = await collapsedMembers.evaluateAll(members => members.flatMap(member =>
        Array.from(member.querySelectorAll('[data-easystud-remove-member]')).map(action =>
            action.getAttribute('tabindex')
        )
    ));
    expect(collapsedActionTabindexes).not.toEqual([]);
    expect(collapsedActionTabindexes).toEqual(collapsedActionTabindexes.map(() => '-1'));

    await group.evaluate(groupNode => {
        const listNode = groupNode.querySelector(':scope > [data-easystud-group-members]');
        const sentinel = document.createElement('button');
        sentinel.type = 'button';
        sentinel.id = 'easyedu-member-focus-sentinel';
        sentinel.setAttribute('aria-label', 'Member focus sentinel');
        sentinel.style.cssText = 'position:fixed;inset:0 auto auto 0;opacity:0.01;pointer-events:none;';
        listNode.parentElement.insertBefore(sentinel, listNode);
        sentinel.focus();
    });
    await page.keyboard.press('Tab');
    const tabTargetIsCollapsedMember = await group.evaluate(groupNode => {
        const active = document.activeElement;
        return Array.from(groupNode.querySelectorAll(
            ':scope > [data-easystud-group-members] > [data-easystud-member-id].is-collapsed'
        )).some(member => member.contains(active));
    });
    await page.locator('#easyedu-member-focus-sentinel').evaluate(node => node.remove());
    expect(tabTargetIsCollapsedMember, 'Tab must bypass clipped member actions').toBe(false);

    await toggle.click();
    await expect(list).toHaveClass(/is-easyedu-disclosing/);
    await settleMotion(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const restoredMember = list.locator(':scope > [data-easystud-member-id]').nth(2);
    const restoredRemove = restoredMember.locator('[data-easystud-remove-member]');
    await expect(restoredMember).not.toHaveAttribute('inert');
    await expect(restoredRemove).not.toHaveAttribute('tabindex');
    await restoredRemove.focus();
    await expect(restoredRemove).toBeFocused();

    await toggle.click();
    await expect(list).toHaveClass(/is-easyedu-disclosing/);
    await settleMotion(page);
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(toggle).toBeFocused();
    await page.screenshot({
        path: testInfo.outputPath('collapsed-nested-group-member-focus.png'),
        fullPage: false,
    });

    expect(errors, `console and page errors: ${JSON.stringify(errors)}`).toEqual([]);
    expect(failedRequests, `failed requests: ${JSON.stringify(failedRequests)}`).toEqual([]);
});
