const {test, expect} = require('@playwright/test');

const managementUrl = process.env.EASYEDU_MOODLE_URL ||
    'http://localhost/local/groupimport/manage.php?id=5';

const openManagementPage = async page => {
    await page.goto(managementUrl, {waitUntil: 'domcontentloaded', timeout: 60000});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME || '');
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD || '');
        await page.locator('#loginbtn').click();
    }

    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toBeVisible({timeout: 60000});
    await expect(root).not.toHaveClass(/local-groupimport-easystud--booting/, {timeout: 30000});
};

test('Teacher role filter hides the Student-only canonical participant card', async({page}, testInfo) => {
    test.setTimeout(90000);
    await page.setViewportSize({width: 1440, height: 1000});

    const consoleErrors = [];
    page.on('console', message => {
        if (message.type() === 'error') {
            consoleErrors.push(message.text());
        }
    });
    page.on('pageerror', error => consoleErrors.push(error.message));

    await openManagementPage(page);

    const roleSelect = page.locator('[data-easystud-role-filter="1"]');
    // V2 n°6: options are valued by role id; find the Teacher role by its label.
    const teacherOption = roleSelect.locator('option', {hasText: /^Teacher$/});
    const advancedFiltersToggle = page.locator(
        '[data-easystud-advanced-filters-toggle="participants"]'
    );
    const teacherChoice = page.locator('[data-easystud-role-choice]', {hasText: /^Teacher$/});
    const canonicalCard = page.locator('[data-easystud-user="1"][data-user-id="22"]');
    await expect(roleSelect).toHaveCount(1);
    await expect(teacherOption).toHaveCount(1);
    await expect(advancedFiltersToggle).toBeVisible();
    await expect(canonicalCard).toHaveCount(1);
    await expect(canonicalCard).toHaveAttribute('data-role-text', 'student');

    await advancedFiltersToggle.click();
    await expect(advancedFiltersToggle).toHaveAttribute('aria-expanded', 'true');
    await expect(teacherChoice).toBeVisible();
    await teacherChoice.click();
    await expect.poll(() => teacherOption.evaluate(option => option.selected)).toBe(true);

    const diagnostics = await page.evaluate(() => {
        const select = document.querySelector('[data-easystud-role-filter="1"]');
        const card = document.querySelector('[data-easystud-user="1"][data-user-id="22"]');
        const members = Array.from(document.querySelectorAll('[data-easystud-member-id="22"]'));
        const resources = performance.getEntriesByType('resource')
            .map(entry => entry.name)
            .filter(name => /course_manager(?:\.min)?\.js(?:\?|$)/.test(name));
        const describe = node => {
            const style = getComputedStyle(node);
            return {
                hidden: node.hidden,
                filterHidden: node.getAttribute('data-easystud-filter-hidden'),
                pageHidden: node.getAttribute('data-easystud-page-hidden'),
                inlineStyle: node.getAttribute('style'),
                computedDisplay: style.display,
                computedVisibility: style.visibility,
            };
        };

        return {
            selectedRoles: Array.from(select.selectedOptions).map(option => option.value),
            roleControls: {
                selectDisplay: getComputedStyle(select).display,
                teacherButtonDisplay: getComputedStyle(
                    Array.from(document.querySelectorAll('[data-easystud-role-choice]'))
                        .find(button => button.textContent.trim() === 'Teacher')
                ).display,
            },
            canonical: describe(card),
            groupMemberRepresentations: members.map(describe),
            servedCourseManagerAssets: resources,
        };
    });

    await testInfo.attach('participant-role-filter-diagnostics.json', {
        body: JSON.stringify({diagnostics, consoleErrors}, null, 2),
        contentType: 'application/json',
    });
    await page.screenshot({
        path: testInfo.outputPath('teacher-role-filter.png'),
        fullPage: false,
    });

    expect(diagnostics.selectedRoles).toEqual([await teacherOption.getAttribute('value')]);
    expect(diagnostics.canonical.hidden).toBe(true);
    expect(diagnostics.canonical.filterHidden).toBe('1');
    expect(diagnostics.canonical.computedDisplay).toBe('none');
    expect(diagnostics.servedCourseManagerAssets.length).toBeGreaterThan(0);
    expect(consoleErrors).toEqual([]);
});
