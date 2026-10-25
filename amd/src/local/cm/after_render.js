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
 * Scoped presentation updates, including mutations outside the list renderer.
 *
 * @module local_groupimport/local/cm/after_render
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

const states = new WeakMap();
const eventName = 'easystud:after-render';
const cardSelector = '[data-easystud-user], [data-easystud-group-id], ' +
    '[data-easystud-grouping-id], [data-easystud-member-id]';

/**
 * Remove disconnected nodes and descendants already covered by another scope.
 * @param {HTMLElement} root Workspace.
 * @param {Iterable<Node>} nodes Changed nodes.
 * @returns {HTMLElement[]} Minimal connected scopes.
 */
export const compactRenderScopes = (root, nodes) => {
    const elements = new Set(Array.from(nodes, node => node.nodeType === 1 ? node : node.parentElement)
        .filter(node => node && root.contains(node)));
    return Array.from(elements).filter(node => {
        for (let parent = node.parentElement; parent && root.contains(parent); parent = parent.parentElement) {
            if (elements.has(parent)) {
                return false;
            }
        }
        return true;
    });
};

const collect = (state, records) => records.forEach(record => {
    state.scopes.add(record.target);
    record.addedNodes.forEach(node => {
        if (node.nodeType === 1) {
            state.added.add(node);
        }
    });
    record.removedNodes.forEach(node => {
        if (node.nodeType === 1) {
            state.removed.add(node);
        }
    });
    state.geometry.add('content');
});

const cardsWithin = nodes => {
    const cards = new Set();
    nodes.forEach(node => {
        if (node.matches(cardSelector)) {
            cards.add(node);
        }
        node.querySelectorAll(cardSelector).forEach(card => cards.add(card));
    });
    return Array.from(cards);
};

const schedule = (root, state) => {
    if (state.depth || state.frame !== null) {
        return;
    }
    state.frame = window.requestAnimationFrame(function flushAfterRender() {
        state.frame = null;
        collect(state, state.observer.takeRecords());
        const subtrees = compactRenderScopes(root, state.scopes);
        const addedNodes = compactRenderScopes(root, state.added);
        const removedNodes = Array.from(state.removed).filter(node => !root.contains(node));
        const detail = {
            generation: ++state.generation,
            subtrees,
            addedNodes,
            removedNodes,
            addedCards: cardsWithin(addedNodes),
            removedCards: cardsWithin(removedNodes),
            geometryFields: Array.from(state.geometry),
        };
        state.scopes.clear();
        state.added.clear();
        state.removed.clear();
        state.geometry.clear();
        if (subtrees.length || removedNodes.length) {
            root.dispatchEvent(new CustomEvent(eventName, {detail}));
        }
        // Menu decoration is consumed by the naming listener in this same notification.
        // Preserve unrelated synchronous changes made by other listeners.
        const remaining = state.observer.takeRecords().filter(record => !(
            record.target.nodeType === 1 &&
            (record.target.closest('[data-easystud-card-menu]') ||
                (record.addedNodes.length && Array.from(record.addedNodes).every(node =>
                    node.nodeType === 1 && node.matches('[data-easystud-card-menu]'))))
        ));
        if (remaining.length) {
            collect(state, remaining);
            schedule(root, state);
        }
    });
};

const getState = root => {
    if (!states.has(root)) {
        const state = {depth: 0, generation: 0, frame: null, scopes: new Set(), added: new Set(),
            removed: new Set(), geometry: new Set(), observer: null};
        state.observer = new MutationObserver(records => {
            collect(state, records);
            schedule(root, state);
        });
        state.observer.observe(root, {childList: true, subtree: true, characterData: true});
        states.set(root, state);
    }
    return states.get(root);
};

/**
 * Subscribe on the workspace, never on document or a global unscoped channel.
 * @param {HTMLElement} root Workspace.
 * @param {Function} listener Scoped update consumer.
 */
export const onAfterRender = (root, listener) => {
    getState(root);
    root.addEventListener(eventName, event => listener(event.detail));
};

/**
 * Keep nested list renders and their synchronous decorators in one notification.
 * @param {HTMLElement} root Workspace.
 * @param {Function} render Synchronous render operation.
 * @returns {*} Operation result.
 */
export const withRenderTransaction = (root, render) => {
    const state = getState(root);
    state.depth++;
    try {
        return render();
    } finally {
        collect(state, state.observer.takeRecords());
        state.depth--;
        if (state.scopes.size || state.removed.size) {
            schedule(root, state);
        }
    }
};

/**
 * Record the list and exact cards replaced by a renderer, without retaining model data.
 * @param {HTMLElement} root Workspace.
 * @param {HTMLElement} subtree Rendered list.
 * @param {HTMLElement[]} added New cards.
 * @param {HTMLElement[]} removed Replaced cards.
 */
export const recordRenderedCards = (root, subtree, added, removed) => {
    const state = getState(root);
    state.scopes.add(subtree);
    added.forEach(card => state.added.add(card));
    removed.forEach(card => state.removed.add(card));
    state.geometry.add('cards');
    state.geometry.add('height');
    schedule(root, state);
};
