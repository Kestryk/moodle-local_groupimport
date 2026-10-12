'use strict';
const {expect} = require('@playwright/test');
const fs = require('node:fs');
const crypto = require('node:crypto');
const path = require('node:path');
function perfUrl() {
    const url = new URL(process.env.EASYEDU_MOODLE_URL);
    if (!['localhost', '127.0.0.1'].includes(url.hostname) || url.port !== '8051')
        throw new Error('Roadmap audits require the dedicated :8051 copy.');
    url.searchParams.set('lang', 'fr');
    return url;
}
async function login(page) {
    const url = perfUrl();
    await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    if (page.url().includes('/login/')) {
        await page.locator('#username').fill(process.env.EASYEDU_MOODLE_USERNAME);
        await page.locator('#password').fill(process.env.EASYEDU_MOODLE_PASSWORD);
        await Promise.all([page.waitForURL(u => !u.pathname.includes('/login/'), {waitUntil: 'domcontentloaded'}),
            page.locator('#loginbtn').click()]);
        await page.goto(url.href, {waitUntil: 'domcontentloaded'});
    }
}
async function settle(locator) {
    await locator.evaluate(async node => {
        await document.fonts.ready;
        await Promise.all(node.getAnimations({subtree: true})
            .filter(a => Number.isFinite(a.effect.getComputedTiming().iterations))
            .map(a => a.finished.catch(() => {})));
    });
}
async function ready(page) {
    const root = page.locator('#local-groupimport-easystud');
    await expect(root).toHaveAttribute('data-easystud-loading-state', 'ready', {timeout: 60000});
    await settle(root);
    return root;
}
function identity() {
    const runtime = process.env.EASYEDU_AUDIT_RUNTIME_ROOT;
    if (!runtime) throw new Error('EASYEDU_AUDIT_RUNTIME_ROOT is required for served-file evidence.');
    const files = ['styles.css', 'templates/manage.mustache', 'amd/build/course_manager.min.js',
        'lang/fr/local_groupimport.php', 'version.php'];
    return Object.fromEntries(files.map(file => [file,
        crypto.createHash('sha256').update(fs.readFileSync(path.join(runtime, file))).digest('hex')]));
}
async function blockBusinessWrites(page, blocked) {
    await page.route('**/local/groupimport/**', async route => {
        const request = route.request();
        if (request.method() !== 'GET') {
            // Read-only detail request used by the existing Participant dialog.
            const data = new URLSearchParams(request.postData() || '');
            if (['userdetails'].includes(data.get('action'))) return route.continue();
            blocked.push({path: new URL(request.url()).pathname, method: request.method(),
                action: data.get('action') || 'unknown'});
            return route.abort('blockedbyclient');
        }
        return route.continue();
    });
    await page.route('**/lib/ajax/service.php**', async route => {
        let calls;
        try { calls = JSON.parse(route.request().postData() || '[]'); } catch { calls = []; }
        const reads = ['core_get_fragment', 'core_get_string', 'core_get_strings', 'core_output_load_template',
            'core_output_load_template_with_dependencies', 'core_courseformat_get_state',
            'core_message_get_member_info', 'core_message_get_conversation_messages',
            'local_groupimport_get_state', 'local_groupimport_get_user_details', 'core_message_get_unread_conversations_count'];
        if (Array.isArray(calls) && calls.length && calls.every(c => reads.includes(c.methodname))) return route.continue();
        // Reading a user's unsent-message draft is not required for presentation.
        if (Array.isArray(calls) && calls.length && calls.every(c => c.methodname === 'core_message_get_unsent_message'))
            return route.fulfill({json: calls.map(() => ({error: false, data: ''}))});
        blocked.push({path: '/lib/ajax/service.php', methods: calls.map(c => c.methodname)});
        return route.abort('blockedbyclient');
    });
}
module.exports = {perfUrl, login, settle, ready, identity, blockBusinessWrites};
