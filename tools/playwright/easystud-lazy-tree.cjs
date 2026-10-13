'use strict';

/**
 * Finds an existing non-empty grouping without assuming its child cards have
 * already been rendered. On-demand mode creates those cards on first open;
 * Current mode already has them, so this keeps one test path for both modes.
 *
 * @param {import('@playwright/test').Locator} root EasyStud workspace root.
 * @returns {Promise<import('@playwright/test').Locator>} Expanded grouping.
 */
async function openPopulatedGrouping(root) {
    const groupings = root.locator('[data-easystud-tree] [data-easystud-grouping-id]:visible');
    const index = await groupings.evaluateAll(nodes => nodes.findIndex(node => {
        const badge = node.querySelector(':scope > .local-groupimport-easystud-grouping__header .badge');
        const count = Number.parseInt((badge && badge.textContent) || '', 10);
        return Number.isFinite(count) && count > 0;
    }));
    if (index < 0) throw new Error('Existing populated grouping is required; no fixture is created.');

    const grouping = groupings.nth(index);
    const toggle = grouping.locator(
        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
    );
    if (await toggle.getAttribute('aria-expanded') === 'false') await toggle.click();
    await grouping.locator(
        ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]:visible'
    ).first().waitFor({state: 'visible', timeout: 15000});
    return grouping;
}

module.exports = {openPopulatedGrouping};
