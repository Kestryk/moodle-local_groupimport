const {test, expect} = require('@playwright/test');

const baseUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';

const login = async page => {
    page.on('pageerror', error => console.log('PAGE_ERROR:', error.message));
    page.on('console', message => {
        if (message.type() === 'error') {
            console.log('CONSOLE_ERROR:', message.text());
        }
    });
    await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        if (!password) {
            throw new Error('Set EASYEDU_MOODLE_PASSWORD before running the message modal audit.');
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
    return root;
};

test('responsive native Send message modal remains opaque and contained', async({page}, testInfo) => {
    test.setTimeout(120000);
    await page.setViewportSize({width: 390, height: 844});
    const root = await login(page);

    const participant = root.locator(
        '[data-easystud-mobile-entity-region="participants"] [data-easystud-user]:visible'
    ).first();
    await expect(participant).toBeVisible();
    const selector = participant.locator('[data-easystud-selector-input]').first();
    await expect(selector).toBeAttached();
    await selector.evaluate(input => input.click());

    const messageAction = root.locator(
        '[data-easystud-mobile-action-trigger="[data-easystud-message-selected-participants]"]:visible'
    ).first();
    await expect(messageAction).toBeEnabled();
    await messageAction.click();

    const modal = page.locator('.local-groupimport-easystud-message-modal.show').last();
    await expect(modal).toBeVisible({timeout: 30000});
    await expect(modal).not.toHaveClass(/is-loading/, {timeout: 30000});
    const textarea = modal.locator('#bulk-message.local-groupimport-easystud-message-modal__textarea');
    await expect(textarea).toBeVisible();
    const modalBody = modal.locator('.modal-body');
    await expect.poll(async() => modalBody.evaluate(body => ({
        inlineOverflow: body.style.overflow,
        computedOverflowY: window.getComputedStyle(body).overflowY,
    })), {
        message: 'Moodle must finish its native async body transition before geometry is measured',
        timeout: 5000,
    }).toEqual({
        inlineOverflow: '',
        computedOverflowY: 'auto',
    });

    const geometry = await modal.evaluate(node => {
        const rectangle = element => {
            const bounds = element.getBoundingClientRect();
            return {
                left: bounds.left,
                right: bounds.right,
                top: bounds.top,
                bottom: bounds.bottom,
                width: bounds.width,
                height: bounds.height,
            };
        };
        const alpha = color => {
            const match = color.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([^)]+)\)$/);
            return match ? Number(match[1]) : 1;
        };
        const dialog = node.querySelector('.local-groupimport-easystud-message-modal__dialog');
        const content = node.querySelector('.local-groupimport-easystud-message-modal__content');
        const body = node.querySelector('.modal-body');
        const header = node.querySelector('.modal-header');
        const footer = node.querySelector('.modal-footer');
        const textarea = node.querySelector('#bulk-message');
        return {
            dialog: rectangle(dialog),
            content: rectangle(content),
            body: rectangle(body),
            header: rectangle(header),
            footer: rectangle(footer),
            textarea: rectangle(textarea),
            dialogBackgroundAlpha: alpha(window.getComputedStyle(dialog).backgroundColor),
            contentBackgroundAlpha: alpha(window.getComputedStyle(content).backgroundColor),
            bodyOverflowY: window.getComputedStyle(body).overflowY,
            textareaResize: window.getComputedStyle(textarea).resize,
            documentScrollWidth: document.documentElement.scrollWidth,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight,
        };
    });
    console.log('RESPONSIVE_MESSAGE_MODAL:', JSON.stringify(geometry));
    await page.screenshot({
        path: testInfo.outputPath('message-modal-responsive-390.png'),
        fullPage: false,
    });

    expect(geometry.dialog.left, 'dialog left edge').toBeGreaterThanOrEqual(-1);
    expect(geometry.dialog.right, 'dialog right edge').toBeLessThanOrEqual(geometry.viewportWidth + 1);
    expect(geometry.dialog.top, 'dialog top edge').toBeGreaterThanOrEqual(-1);
    expect(geometry.dialog.bottom, 'dialog bottom edge').toBeLessThanOrEqual(geometry.viewportHeight + 1);
    expect(geometry.content.left, 'content left edge').toBeGreaterThanOrEqual(geometry.dialog.left - 1);
    expect(geometry.content.right, 'content right edge').toBeLessThanOrEqual(geometry.dialog.right + 1);
    expect(geometry.dialogBackgroundAlpha, 'dialog must be opaque').toBeGreaterThanOrEqual(0.99);
    expect(geometry.contentBackgroundAlpha, 'content must be opaque').toBeGreaterThanOrEqual(0.99);
    expect(geometry.bodyOverflowY, 'only the modal body scrolls').toBe('auto');
    expect(geometry.header.top, 'header inside content').toBeGreaterThanOrEqual(geometry.content.top - 1);
    expect(geometry.footer.bottom, 'footer inside content').toBeLessThanOrEqual(geometry.content.bottom + 1);
    expect(geometry.textarea.left, 'textarea left edge').toBeGreaterThanOrEqual(geometry.body.left - 1);
    expect(geometry.textarea.right, 'textarea right edge').toBeLessThanOrEqual(geometry.body.right + 1);
    expect(geometry.textarea.height, 'compact textarea height').toBeGreaterThanOrEqual(175);
    expect(geometry.textareaResize, 'compact textarea resize policy').toBe('none');
    expect(geometry.documentScrollWidth, 'document horizontal overflow').toBeLessThanOrEqual(
        geometry.viewportWidth + 2
    );

    const close = modal.locator('[data-action="hide"]').first();
    await expect(close).toBeVisible();
    await close.click();
    await expect(modal).toBeHidden({timeout: 30000});
});
