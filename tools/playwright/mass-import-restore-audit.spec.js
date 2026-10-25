const {test, expect} = require('@playwright/test');
const {execFileSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const baseUrl = process.env.EASYEDU_MASS_IMPORT_URL ||
    'http://localhost/local/groupimport/index.php?id=5';
const username = process.env.EASYEDU_MOODLE_USERNAME || 'Admin';
const password = process.env.EASYEDU_MOODLE_PASSWORD || '';
const courseId = Number(new URL(baseUrl).searchParams.get('id') || 5);
const filename = 'easyedu-restore-audit.csv';
const groupName = 'EasyStud restore audit group';
const groupingName = 'EasyStud restore audit grouping';
const moodleRoot = path.resolve(__dirname, '..', '..', '..', '..').replaceAll('\\', '/');

const phpString = value => `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`;
const runMoodlePhp = code => execFileSync('php', ['-r', [
    "define('CLI_SCRIPT', true);",
    `require ${phpString(`${moodleRoot}/config.php`)};`,
    `require_once ${phpString(`${moodleRoot}/group/lib.php`)};`,
    code,
].join(' ')], {encoding: 'utf8'}).trim();

const cleanup = () => runMoodlePhp(`
    $groupid = groups_get_group_by_name(${courseId}, ${phpString(groupName)});
    if ($groupid) { groups_delete_group($groupid); }
    $groupingid = $DB->get_field('groupings', 'id', [
        'courseid' => ${courseId}, 'name' => ${phpString(groupingName)}
    ]);
    if ($groupingid) { groups_delete_grouping($groupingid); }
    $DB->delete_records('local_groupimport_history', [
        'courseid' => ${courseId}, 'filename' => ${phpString(filename)}
    ]);
`);

const login = async page => {
    await page.goto(baseUrl);
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(username);
        await page.locator('#password').fill(password);
        await page.locator('#loginbtn').click();
        await page.waitForURL(url => !url.pathname.includes('/login/'));
    }
    await expect(page.locator('#local-groupimport-import')).toBeVisible({timeout: 30000});
};

test.beforeEach(() => cleanup());
test.afterEach(() => cleanup());

test('recreates deleted imported structures and exports an annotated workbook', async({page}) => {
    test.setTimeout(180000);
    await login(page);
    await page.waitForFunction(() => window.M && M.form_filepicker && M.core_filepicker &&
        Object.keys(M.core_filepicker.instances || {}).length > 0, null, {timeout: 20000});

    const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
    await dataTransfer.evaluate((transfer, content) => {
        transfer.items.add(new File([content], 'easyedu-restore-audit.csv', {type: 'text/csv'}));
    }, [
        'student;group;grouping',
        `test.etudiant.01@example.com;${groupName};${groupingName}`,
    ].join('\n'));
    await page.dispatchEvent('body', 'drop', {dataTransfer});
    await expect(page.locator('.filepicker-filename, [id^="file_info_"]')
        .filter({hasText: filename}).first()).toBeVisible({timeout: 30000});

    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.locator('.local-groupimport-import-card--upload [type="submit"]').click(),
    ]);
    await expect(page.locator('.local-groupimport-import-preview__table')).toBeVisible();
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.locator('.local-groupimport-import-preview__actions [type="submit"]').click(),
    ]);
    await expect(page.locator('.local-groupimport-import__export-results')).toBeVisible();

    runMoodlePhp(`
        $groupid = groups_get_group_by_name(${courseId}, ${phpString(groupName)});
        if ($groupid) { groups_delete_group($groupid); }
        $groupingid = $DB->get_field('groupings', 'id', [
            'courseid' => ${courseId}, 'name' => ${phpString(groupingName)}
        ]);
        if ($groupingid) { groups_delete_grouping($groupingid); }
    `);
    expect(runMoodlePhp(`
        echo groups_get_group_by_name(${courseId}, ${phpString(groupName)}) ? 'present' : 'absent';
    `)).toBe('absent');

    await page.goto(baseUrl);
    await expect(page.locator('#local-groupimport-import')).toBeVisible({timeout: 30000});
    await page.locator('[data-local-groupimport-history-open]').click();
    const historyItem = page.locator('.local-groupimport-import-history li').filter({hasText: filename});
    await expect(historyItem).toBeVisible();
    await historyItem.locator('[data-local-groupimport-rollback-open]').click();
    await Promise.all([
        page.waitForLoadState('domcontentloaded'),
        page.locator('[data-local-groupimport-rollback-form] [type="submit"]').click(),
    ]);

    const restored = JSON.parse(runMoodlePhp(`
        $groupid = groups_get_group_by_name(${courseId}, ${phpString(groupName)});
        $groupingid = $DB->get_field('groupings', 'id', [
            'courseid' => ${courseId}, 'name' => ${phpString(groupingName)}
        ]);
        $memberid = $DB->get_field('user', 'id', ['email' => 'test.etudiant.01@example.com']);
        echo json_encode([
            'group' => (bool)$groupid,
            'grouping' => (bool)$groupingid,
            'member' => $groupid && $memberid ? groups_is_member($groupid, $memberid) : false,
            'assigned' => $groupid && $groupingid ? $DB->record_exists('groupings_groups', [
                'groupid' => $groupid, 'groupingid' => $groupingid
            ]) : false,
        ]);
    `));
    expect(restored).toEqual({group: true, grouping: true, member: true, assigned: true});

    await page.locator('[data-local-groupimport-history-open]').click();
    const restoredItem = page.locator('.local-groupimport-import-history li').filter({hasText: filename});
    const downloadPromise = page.waitForEvent('download');
    await restoredItem.locator('.local-groupimport-import-history__export').click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/_report\.xlsx$/i);
    const downloadedPath = await download.path();
    expect(downloadedPath).toBeTruthy();
    expect(fs.statSync(downloadedPath).size).toBeGreaterThan(1000);
});
