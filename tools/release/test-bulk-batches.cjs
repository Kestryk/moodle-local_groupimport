// R6 browser side: bulk requests are cut in batches of at most 500 items, merged, stopped cleanly on failure.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
const source = read('amd/src/local/cm/bulk_batches.js');
assert(!/^import\b/m.test(source), 'bulk_batches must stay pure (no import)');
const names = [...source.matchAll(/^export const (\w+)/gm)].map(match => match[1]);
const api = vm.runInNewContext(source.replace(/^export /gm, '') + '\n({' + names.join(',') + '})', {Error, Promise, Set});
const same = (actual, expected, message) => assert.equal(JSON.stringify(actual), JSON.stringify(expected), message);
const ids = count => Array.from({length: count}, (item, index) => 'u' + index);
const labels = {
    bulkbatchprogress: 'Batch __done__ of __total__', bulkpartialfailure: 'Stopped __done__/__total__ rest __remaining__: __reason__',
    bulkaddsummary: 'added __added__ existing __existing__', bulkitemsskipped: 'skipped __count__', ajaxerror: 'generic',
};
const fakePost = (failOn = 0) => {
    const calls = [];
    const post = payload => {
        calls.push(payload);
        if (failOn && calls.length === failOn) {
            return Promise.reject(new Error('server down'));
        }
        const list = payload.userids;
        return Promise.resolve({success: true, added: list.length - 1, existing: 1, skipped: 0, users: list.map(id => ({id})),
            message: 'server'});
    };
    return {post, calls};
};

(async () => {
    assert.equal(api.bulkMaxItems, 500);
    // Splitting: 0, 1, 500, 501, 1234.
    assert.equal(api.splitBatches([]).length, 0);
    same(api.splitBatches(ids(1)).map(batch => batch.length), [1]);
    same(api.splitBatches(ids(500)).map(batch => batch.length), [500]);
    same(api.splitBatches(ids(501)).map(batch => batch.length), [500, 1]);
    same(api.splitBatches(ids(1234)).map(batch => batch.length), [500, 500, 234]);
    same(api.splitBatches(ids(1234)).flat(), ids(1234), 'order kept, nothing lost or repeated');
    // Tokens: same rules as the server.
    same(api.splitIdentifierTokens(' a@x.fr,b;c|d\n\ne a@x.fr '), ['a@x.fr', 'b', 'c', 'd', 'e']);

    for (const count of [0, 1, 500, 501, 1234]) {
        const {post, calls} = fakePost();
        const progress = [];
        const result = await api.postInBatches({post, items: ids(count), labels,
            payload: batch => ({userids: batch}), onProgress: (done, total) => progress.push([done, total])});
        const expected = Math.max(1, Math.ceil(count / 500));
        assert.equal(calls.length, expected, count + ' items: request count');
        assert(calls.every(call => call.userids.length <= 500), count + ' items: server limit respected');
        same(calls.flatMap(call => call.userids), ids(count));
        assert.equal(result.items.length, count);
        assert.equal(progress.length, Math.max(0, expected - 1), 'one progress step per batch but the last');
        if (expected > 1) {
            assert.equal(result.response.batches, expected);
            assert.equal(result.response.added, count - expected);
            assert.equal(result.response.existing, expected);
            assert.equal(result.response.users.length, count);
            assert.equal(api.addSummaryMessage(labels, result.response), 'added ' + (count - expected) + ' existing ' + expected);
        } else {
            assert.equal(result.response.message, 'server', 'single request: response untouched');
        }
    }

    // Failure on the 2nd batch of 1234: first 500 done, 734 not done, run stops, message says so.
    const failing = fakePost(2);
    const progress = [];
    await assert.rejects(api.postInBatches({post: failing.post, items: ids(1234), labels, payload: batch => ({userids: batch}),
        onProgress: (done, total) => progress.push([done, total])}), error => {
        assert.equal(failing.calls.length, 2, 'no request after the failed batch');
        same(error.doneItems, ids(500));
        same(error.failedItems, ids(1234).slice(500));
        assert.equal(error.response.added, 499);
        assert.equal(error.message, 'Stopped 500/1234 rest 734: server down');
        return true;
    });
    same(progress, [[1, 3]]);
    // Retry on the not-done items sends only those: nothing already processed is sent twice.
    const retry = fakePost();
    const rest = ids(1234).slice(500);
    await api.postInBatches({post: retry.post, items: rest, labels, payload: batch => ({userids: batch})});
    same(retry.calls.map(call => call.userids.length), [500, 234]);
    assert.equal(new Set([...failing.calls[0].userids, ...retry.calls.flatMap(call => call.userids)]).size, 1234);
    // Failure of the only request: nothing done.
    const single = fakePost(1);
    await assert.rejects(api.postInBatches({post: single.post, items: ids(3), labels, payload: batch => ({userids: batch})}),
        error => error.message === 'server down' && !error.doneItems);
    api.progressNotifier(labels, message => progress.push(message))(2, 3);
    assert.equal(progress.at(-1), 'Batch 2 of 3');

    // addemails responses carry the added users but no `added` counter: the summary must still say 600 (R6 recette).
    const emailPost = payload => Promise.resolve({success: true, users: payload.emails.split(String.fromCharCode(10)).map(id => ({id})),
        existing: 0, missing: [], skipped: 0});
    const emails = await api.postInBatches({post: emailPost, items: ids(600), labels, payload: batch => ({emails: batch.join(String.fromCharCode(10))})});
    assert.equal(emails.response.added, 600, 'added derived from users when the server sends no counter');
    assert.equal(api.addSummaryMessage(labels, emails.response), 'added 600 existing 0');
    // A server that does send `added` is trusted over the users list.
    assert.equal(api.mergeResponses([{added: 2, users: [1, 2, 3]}, {added: 1, users: [4]}]).added, 3);

    // Selection after a failure: confirmed items are released, the others stay selected (800 selected, 500 confirmed).
    const selected = ids(800);
    const midway = fakePost(2);
    await assert.rejects(api.postInBatches({post: midway.post, items: selected, labels, payload: batch => ({userids: batch})}),
        error => {
            const kept = api.unconfirmedKeys(selected, error.doneItems);
            assert.equal(kept.length, 300, '300 stay selected');
            same(kept, error.failedItems, 'the kept selection is exactly the unconfirmed items');
            assert(!kept.some(key => error.doneItems.includes(key)), 'no confirmed item stays selected');
            return true;
        });
    same(api.unconfirmedKeys(['1', '2', '3'], [2]), ['1', '3'], 'keys compared as text');
    same(api.unconfirmedKeys(selected, []), selected, 'nothing confirmed: everything stays selected');

    // Wiring: every bounded action goes through the batch helpers, never a direct unbounded post.
    const actions = read('amd/src/local/cm/actions.js');
    assert(/action: 'removemembers',/.test(actions) && /postActionInBatches\(root, entries/.test(actions));
    assert(!/postAction\(\{\s*courseid: courseId,\s*action: '(addusers|addemails|deletegroups)'/.test(
        ['drag_drop', 'move_modal', 'context_menu', 'quick_actions'].map(name => read('amd/src/local/cm/' + name + '.js')).join('\n')));
    console.log('bulk batches PASS');
})().catch(error => { console.error(error); process.exit(1); });
