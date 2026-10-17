// This file is part of Moodle - http://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <http://www.gnu.org/licenses/>.

/**
 * EasyStud course manager: split bulk requests into batches the server accepts (R6).
 *
 * Pure module (no import, no DOM). The server rejects more than bulkMaxItems items per call and
 * commits each call in one transaction, so a batch is either fully applied or not at all. Sending
 * batches one after the other therefore gives a clean stop: items of the batches already done are
 * reported as done, the failed batch and the following ones as not done. Every bulk action is
 * idempotent (existing members counted, missing groups skipped), so a retry never writes twice.
 *
 * @module     local_groupimport/local/cm/bulk_batches
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Must match local_groupimport\local\bulk_action::MAX_ITEMS.
export const bulkMaxItems = 500;

// Split a list in consecutive batches of at most `max` items (no batch for an empty list).
export const splitBatches = (items, max = bulkMaxItems) => {
    const list = Array.isArray(items) ? items : [];
    const size = Math.max(1, Math.floor(max) || bulkMaxItems);
    const batches = [];
    for (let start = 0; start < list.length; start += size) {
        batches.push(list.slice(start, start + size));
    }
    return batches;
};

// Same tokenisation as local_groupimport_extract_user_tokens() on the server (unique, in order).
export const splitIdentifierTokens = text => {
    const seen = new Set();
    return String(text || '').split(/[\s,;|]+/u).map(part => part.trim()).filter(token => {
        if (token === '' || seen.has(token)) {
            return false;
        }
        seen.add(token);
        return true;
    });
};

// Counter of one response. addemails reports the participants it added in `users` (older servers sent no `added`).
const countOf = (response, key) => {
    if (response && response[key] !== undefined) {
        return Number(response[key]) || 0;
    }
    return key === 'added' && response && Array.isArray(response.users) ? response.users.length : 0;
};
const hasCount = (response, key) => Boolean(response) && (response[key] !== undefined ||
    (key === 'added' && Array.isArray(response.users)));
const sum = (responses, key) => responses.reduce((total, response) => total + countOf(response, key), 0);
const gather = (responses, key) => responses.reduce((all, response) => all.concat((response && response[key]) || []), []);

// Merge the batch responses: counters are summed, lists concatenated, the other fields come from the last batch.
export const mergeResponses = responses => {
    const last = responses[responses.length - 1] || {};
    if (responses.length < 2) {
        return last;
    }
    const merged = Object.assign({}, last);
    ['added', 'existing', 'skipped', 'removed', 'deleted'].forEach(key => {
        if (responses.some(response => hasCount(response, key))) {
            merged[key] = sum(responses, key);
        }
    });
    ['users', 'missing'].forEach(key => {
        if (responses.some(response => response && Array.isArray(response[key]))) {
            merged[key] = gather(responses, key);
        }
    });
    merged.batches = responses.length;
    return merged;
};

// Keys of the selected items the server did not confirm: they stay selected after a failed batch.
export const unconfirmedKeys = (selectedKeys, doneKeys) => {
    const done = new Set((doneKeys || []).map(String));
    return (selectedKeys || []).filter(key => !done.has(String(key)));
};

const fill = (template, values) => Object.keys(values).reduce(
    (text, key) => text.split('__' + key + '__').join(String(values[key])), String(template || ''));

// Localised summary of a participant addition, built from the merged counters.
export const addSummaryMessage = (labels, merged) => {
    const base = fill(labels.bulkaddsummary, {added: merged.added || 0, existing: merged.existing || 0});
    return merged.skipped > 0 ? base + ' ' + fill(labels.bulkitemsskipped, {count: merged.skipped}) : base;
};

// Progress callback for postInBatches(): one existing notification (toast) per finished batch.
export const progressNotifier = (labels, notify) => (done, total) => {
    notify(fill(labels.bulkbatchprogress, {done, total}), 'success');
};

// Message of a run stopped by a failed batch: what was done, what was not, and that a retry is safe.
export const failureMessage = (labels, reason, done, total) => fill(labels.bulkpartialfailure, {
    done, total, remaining: Math.max(0, total - done), reason: reason || labels.ajaxerror || '',
});

/**
 * Send the items in successive batches.
 *
 * @param {Object} options
 * @param {Function} options.post Request function (payload) => Promise<response>.
 * @param {Array} options.items Items to send, already unique.
 * @param {Function} options.payload (batch) => request payload of one batch.
 * @param {Object} [options.labels] Localised bulk labels.
 * @param {Function} [options.onProgress] (batchesDone, batchesTotal) after each batch but the last.
 * @param {Number} [options.max] Server limit.
 * @returns {Promise} Resolves {response, responses, items}; with several batches the response counters
 *   are merged. Rejects with an Error whose doneItems / failedItems / response describe the partial run.
 */
export const postInBatches = ({post, items, payload, labels = {}, onProgress = null, max = bulkMaxItems}) => {
    const list = Array.isArray(items) ? items : [];
    const batches = splitBatches(list, max);
    if (batches.length < 2) {
        return post(payload(list)).then(response => ({response, responses: [response], items: list}));
    }

    const responses = [];
    const doneItems = [];
    const step = index => {
        if (index >= batches.length) {
            return Promise.resolve({response: mergeResponses(responses), responses, items: doneItems});
        }
        return post(payload(batches[index])).then(response => {
            responses.push(response);
            batches[index].forEach(item => doneItems.push(item));
            if (onProgress && index < batches.length - 1) {
                onProgress(index + 1, batches.length);
            }
            return step(index + 1);
        }, error => {
            const stopped = new Error(failureMessage(labels, error && error.message, doneItems.length, list.length));
            stopped.cause = error;
            stopped.doneItems = doneItems.slice();
            stopped.failedItems = list.slice(doneItems.length);
            stopped.response = mergeResponses(responses);
            throw stopped;
        });
    };
    return step(0);
};
