'use strict';

/**
 * Read-only WebService calls that the On demand Student Management renderer
 * makes while it constructs its initial state and lazy card details.
 *
 * Specs keep their narrower local allow-list: this helper only adds the two
 * renderer reads and never turns a product mutation into an allowed request.
 */
const RENDERING_READS = new Set([
    'local_groupimport_get_state',
    'local_groupimport_get_details',
]);

function methodName(call) {
    return typeof call === 'string' ? call : call && call.methodname;
}

function isSafeAjaxRead(call, localReads) {
    const method = methodName(call);
    if (!method) return false;
    if (RENDERING_READS.has(method)) return true;
    return localReads instanceof Set ? localReads.has(method) : Array.isArray(localReads) && localReads.includes(method);
}

function areSafeAjaxReads(calls, localReads) {
    return Array.isArray(calls) && calls.length > 0 && calls.every(call => isSafeAjaxRead(call, localReads));
}

module.exports = {RENDERING_READS, isSafeAjaxRead, areSafeAjaxReads};
