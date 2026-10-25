const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const rootSelector = '#local-groupimport-easystud';

const login = async page => {
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running this desktop scenario.');
        }
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForLoadState('domcontentloaded');
    }

    const root = page.locator(rootSelector);
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).toHaveAttribute('data-easystud-manager-initialised', '1', {timeout: 60000});
    return root;
};

const installCapacityProbes = root => root.evaluate(rootNode => {
    const host = document.createElement('div');
    host.setAttribute('data-easystud-grouping-summary-probes', '1');
    host.style.cssText = 'display:grid;gap:.6rem;left:1rem;position:fixed;top:6rem;width:34rem;z-index:20;';
    const renderings = [
        {name: 'participant-catalogue', classes: 'local-groupimport-easystud-group--catalog'},
        {name: 'structure-catalogue', classes: 'local-groupimport-easystud-group--catalog'},
        {name: 'ungrouped', classes: ''},
        {name: 'grouping-nested', classes: ''},
    ];

    renderings.forEach((rendering, index) => {
        const card = document.createElement('div');
        const header = document.createElement('div');
        const name = document.createElement('span');
        const container = document.createElement('span');
        const summary = document.createElement('button');
        const details = document.createElement('div');
        const list = document.createElement('div');
        const names = ['Long grouping alpha', 'Long grouping beta'];

        card.className = 'local-groupimport-easystud-group ' + rendering.classes;
        card.setAttribute('data-easystud-group-id', 'probe-' + index);
        card.setAttribute('data-easystud-grouping-summary-rendering', rendering.name);
        header.className = 'local-groupimport-easystud-group__header';
        name.className = 'local-groupimport-easystud-group__name';
        name.textContent = rendering.name;
        container.className = 'local-groupimport-easystud-group__groupings ' +
            'local-groupimport-easystud-group__groupings--inline';
        container.style.flex = '0 0 2rem';
        container.style.maxWidth = '2rem';
        container.style.width = '2rem';
        summary.type = 'button';
        summary.className = 'local-groupimport-easystud-token ' +
            'local-groupimport-easystud-token--grouping ' +
            'local-groupimport-easystud-group__groupings-summary';
        summary.textContent = '2 grouping(s)';
        summary.setAttribute('aria-label', '2 grouping(s): ' + names.join(', '));
        summary.setAttribute('aria-expanded', 'false');
        summary.setAttribute('data-easystud-grouping-summary-toggle', '1');
        details.className = 'local-groupimport-easystud-group__groupings-details';
        details.setAttribute('data-easystud-grouping-details', '1');
        details.hidden = true;
        list.className = 'local-groupimport-easystud-group__groupings-details-list';
        names.forEach(groupingname => {
            const token = document.createElement('span');
            token.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--grouping';
            token.textContent = groupingname;
            list.appendChild(token);
        });

        container.appendChild(summary);
        header.append(name, container);
        details.appendChild(list);
        card.append(header, details);
        host.appendChild(card);
    });

    rootNode.appendChild(host);
});

test('desktop Group More actions recovers masked grouping summaries in every Group rendering', async({page}) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 1201, height: 900});
    const root = await login(page);

    await page.locator('[data-easystud-layout-mode="structure"]').click();
    const group = root.locator(
        '[data-easystud-structure-groups] [data-easystud-group-id]:visible'
    ).first();
    const header = group.locator(':scope > .local-groupimport-easystud-group__header');
    const title = header.locator(':scope > .local-groupimport-easystud-group__name');
    await expect(group).toBeVisible();
    await expect(title).toBeVisible();
    const initialTitleWidth = await title.evaluate(node => node.getBoundingClientRect().width);

    await group.evaluate(card => {
        card.querySelectorAll(
            ':scope > .local-groupimport-easystud-group__groupings-details, ' +
            ':scope > .local-groupimport-easystud-group__header .local-groupimport-easystud-group__groupings--inline'
        ).forEach(node => node.remove());

        const header = card.querySelector(':scope > .local-groupimport-easystud-group__header');
        const badge = header.querySelector(':scope > .badge');
        const container = document.createElement('span');
        const summary = document.createElement('button');
        const details = document.createElement('div');
        const list = document.createElement('div');
        const names = ['Long grouping alpha', 'Long grouping beta'];

        container.className = 'local-groupimport-easystud-group__groupings ' +
            'local-groupimport-easystud-group__groupings--inline';
        container.style.flex = '0 0 2rem';
        container.style.maxWidth = '2rem';
        container.style.width = '2rem';
        summary.type = 'button';
        summary.className = 'local-groupimport-easystud-token ' +
            'local-groupimport-easystud-token--grouping ' +
            'local-groupimport-easystud-group__groupings-summary';
        summary.textContent = '2 grouping(s)';
        summary.setAttribute('aria-label', '2 grouping(s): ' + names.join(', '));
        summary.setAttribute('aria-expanded', 'false');
        summary.setAttribute('data-easystud-grouping-summary-toggle', '1');
        container.appendChild(summary);

        details.className = 'local-groupimport-easystud-group__groupings-details';
        details.setAttribute('data-easystud-grouping-details', '1');
        details.hidden = true;
        list.className = 'local-groupimport-easystud-group__groupings-details-list';
        names.forEach(name => {
            const token = document.createElement('span');
            token.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--grouping';
            token.textContent = name;
            list.appendChild(token);
        });
        details.appendChild(list);
        header.insertBefore(container, badge || null);
        card.insertBefore(details, card.querySelector(':scope > .local-groupimport-easystud-group__members') || null);
    });
    await page.evaluate(() => window.dispatchEvent(new Event('resize')));

    const summary = header.locator('[data-easystud-grouping-summary-toggle]');
    const details = group.locator(':scope > [data-easystud-grouping-details]');
    const description = group.locator('[data-easystud-masked-groupings-description]');
    await expect(summary).toBeHidden();
    await expect(description).toHaveText('Groupings: Long grouping alpha, Long grouping beta');
    expect(await title.evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThanOrEqual(
        initialTitleWidth - 1
    );

    const moreActions = group.locator('[data-easystud-card-menu]');
    const contextMenu = root.locator('[data-easystud-context-menu]');
    const recoveredAction = contextMenu.locator(
        '[data-easystud-masked-pill-action="grouping-summary-toggle"]'
    );
    await moreActions.click();
    await expect(recoveredAction).toHaveCount(1);
    await expect(recoveredAction).toBeVisible();
    await expect(recoveredAction).toHaveAttribute(
        'aria-label',
        '2 grouping(s): Long grouping alpha, Long grouping beta'
    );
    await recoveredAction.click();

    await expect(details).toBeVisible();
    await expect(moreActions).toBeFocused();

    await installCapacityProbes(root);
    await page.evaluate(() => new Promise(resolve => {
        window.dispatchEvent(new Event('resize'));
        window.requestAnimationFrame(() => window.requestAnimationFrame(resolve));
    }));

    const renderings = [
        'participant-catalogue',
        'structure-catalogue',
        'ungrouped',
        'grouping-nested',
    ];
    for (const rendering of renderings) {
        const probe = root.locator('[data-easystud-grouping-summary-rendering="' + rendering + '"]');
        const probeSummary = probe.locator('[data-easystud-grouping-summary-toggle]');
        const probeDetails = probe.locator(':scope > [data-easystud-grouping-details]');
        const probeDescription = probe.locator('[data-easystud-masked-groupings-description]');
        const probeMoreActions = probe.locator('[data-easystud-card-menu]');

        await expect(probeSummary).toBeHidden();
        await expect(probeSummary).not.toBeFocused();
        await expect(probeDescription).toHaveText('Groupings: Long grouping alpha, Long grouping beta');
        await expect(probeMoreActions).toHaveCount(1);
        await probeMoreActions.click();
        await expect(recoveredAction).toHaveCount(1);
        await expect(recoveredAction).toBeVisible();
        await recoveredAction.click();
        await expect(probeDetails).toBeVisible();
        await expect(probeMoreActions).toBeFocused();
    }

    for (const selector of ['[data-easystud-user]', '[data-easystud-grouping-id]']) {
        const opened = await root.evaluate((rootNode, cardSelector) => {
            const card = rootNode.querySelector(cardSelector);
            const trigger = card ? card.querySelector(':scope > [data-easystud-card-menu]') : null;
            if (!trigger) {
                return false;
            }
            trigger.click();
            return true;
        }, selector);
        if (opened) {
            await expect(contextMenu.locator('[data-easystud-masked-pill-action]')).toHaveCount(0);
        }
    }
});
