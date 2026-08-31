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
 * EasyStud course manager interactions.
 *
 * @module     local_groupimport/course_manager
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from './motion';

const selectedClass = 'is-selected';
const disabledSelectionClass = 'is-selection-disabled';
const draggingClass = 'is-dragging';
const dropTargetClass = 'is-drop-target';
const compactClass = 'local-groupimport-easystud--compact-users';
const structureFocusClass = 'local-groupimport-easystud--structure-focus';
const participantFocusClass = 'local-groupimport-easystud--participant-focus';
const hoverPopoverClass = 'local-groupimport-easystud-hover-popover';
const panelActionOverflowClass = 'local-groupimport-easystud__panel-action--overflow-hidden';
const guideRefreshEvent = 'easyedu:guide-refresh-highlight';
const responsiveWorkspaceQuery = '(max-width: 1024px)';

const isResponsiveWorkspace = () => {
    return !!(window.matchMedia && window.matchMedia(responsiveWorkspaceQuery).matches);
};

const requestGuideHighlightRefresh = (root, options = {}) => {
    if (!root) {
        return;
    }

    if (root.easystudGuideRefreshTimers) {
        root.easystudGuideRefreshTimers.forEach(timer => window.clearTimeout(timer));
    }

    const detail = Object.assign({root, dock: true}, options);
    root.easystudGuideRefreshTimers = [0, Motion.timing.slow + 20].map(delay => window.setTimeout(() => {
        document.dispatchEvent(new CustomEvent(guideRefreshEvent, {detail}));
    }, delay));
};

const onReady = callback => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, {once: true});
        return;
    }
    callback();
};

const runSafely = callback => {
    try {
        callback();
    } catch (error) {
        if (window.console && window.console.error) {
            window.console.error('EasyStud initialisation step failed.', error);
        }
    }
};

const showEasyStudModal = modal => {
    if (!modal) {
        return;
    }
    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog');
    if (dialog) {
        Motion.cancel(dialog);
    }
    modal.classList.remove('is-closing');
    modal.hidden = false;
};

const hideEasyStudModal = (modal, callback = null) => {
    if (!modal || modal.hidden) {
        if (callback) {
            callback();
        }
        return Promise.resolve(true);
    }
    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog') || modal;
    modal.classList.add('is-closing');
    return Motion.exit(dialog, {duration: Motion.timing.fast, distance: '0.28rem'}).then(completed => {
        if (!completed) {
            return false;
        }
        modal.hidden = true;
        modal.classList.remove('is-closing');
        if (callback) {
            callback();
        }
        return true;
    });
};

// Normalise text for filtering.
const normalise = value => (value || '').toString().toLowerCase();

const formatCountMessage = (template, count) => {
    return (template || '')
        .replace('__count__', count)
        .replace('{}', count);
};

const formatMoveSummary = (template, added, existing) => {
    return (template || '')
        .replace('__added__', added)
        .replace('__existing__', existing);
};

// Copy text to the clipboard when the browser allows it.
const copyText = text => {
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text);
    }
};

const getLabels = root => JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

const getSelectedItemsForContext = (root, selector, target) => {
    const selected = Array.from(root.querySelectorAll(selector + '.' + selectedClass));
    if (!selected.length) {
        return target ? [target] : [];
    }
    if (!target) {
        return selected;
    }
    return selected.indexOf(target) === -1 ? [target] : selected;
};

const getSelectedParticipantsForContext = (root, target) => {
    return getSelectedItemsForContext(root, '[data-easystud-user]', target);
};

const getParticipantFromContextItem = (root, item) => {
    if (!item) {
        return null;
    }
    if (item.matches('[data-easystud-user]')) {
        return item;
    }
    const userid = item.getAttribute('data-easystud-member-id') || item.getAttribute('data-user-id') || '';
    return userid ? root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]') : null;
};

const getParticipantItemsForContext = (root, type, target) => {
    if (type === 'participant') {
        return getSelectedParticipantsForContext(root, target);
    }
    if (type !== 'member') {
        return [];
    }
    return getSelectedItemsForContext(root, '[data-easystud-member-id]', target)
        .map(item => getParticipantFromContextItem(root, item))
        .filter(Boolean);
};

const removeDragPreview = preview => {
    if (preview && preview.parentNode) {
        preview.parentNode.removeChild(preview);
    }
};

const getBlankDragImage = () => {
    let blank = document.getElementById('local-groupimport-easystud-blank-drag-canvas');
    if (!blank) {
        blank = document.createElement('canvas');
        blank.id = 'local-groupimport-easystud-blank-drag-canvas';
        blank.width = 1;
        blank.height = 1;
        blank.style.cssText = 'position:fixed;left:-1000px;top:-1000px;width:1px;height:1px;opacity:0;pointer-events:none;';
        document.body.appendChild(blank);
    }
    return blank;
};

const setStackedDragImage = (event, items, type) => {
    if (!event.dataTransfer || !items.length) {
        return null;
    }

    const source = items[0];
    const rect = source.getBoundingClientRect();
    const preview = document.createElement('div');
    preview.className = 'local-groupimport-easystud-drag-preview local-groupimport-easystud-drag-preview--' + type;
    preview.style.width = Math.max(rect.width, 220) + 'px';
    preview.style.left = Math.max(event.clientX - 24, 0) + 'px';
    preview.style.top = Math.max(event.clientY - 18, 0) + 'px';

    const card = source.cloneNode(true);
    card.classList.remove(draggingClass, selectedClass, disabledSelectionClass, dropTargetClass);
    card.classList.add('local-groupimport-easystud-drag-preview__card');
    card.removeAttribute('id');
    card.querySelectorAll('[id]').forEach(node => node.removeAttribute('id'));
    card.querySelectorAll('input, textarea, select, button').forEach(control => {
        control.setAttribute('tabindex', '-1');
    });
    card.querySelectorAll('[data-easystud-selector-input]').forEach(input => {
        input.checked = false;
    });
    preview.appendChild(card);

    if (items.length > 1) {
        preview.classList.add('has-stack');
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-drag-preview__badge';
        badge.textContent = '+' + (items.length - 1);
        preview.appendChild(badge);
    }

    document.body.appendChild(preview);
    event.dataTransfer.setDragImage(getBlankDragImage(), 0, 0);
    return preview;
};

const moveDragPreview = (preview, event) => {
    if (!preview) {
        return;
    }
    preview.style.left = Math.max(event.clientX - 24, 0) + 'px';
    preview.style.top = Math.max(event.clientY - 18, 0) + 'px';
};

const isResponsiveDragSuppressed = () => {
    return window.matchMedia &&
        window.matchMedia('(hover: none), (pointer: coarse), (max-width: 1024px)').matches;
};

const dragInteractiveSelector =
    'button, a, input, textarea, select, form, [contenteditable="true"], .local-groupimport-easystud-selector';

const isDragInteractiveTarget = target => {
    return !!(target && target.closest && target.closest(dragInteractiveSelector));
};

const hasFocusedDragControl = item => {
    const active = document.activeElement;
    return !!(active && item.contains(active) && isDragInteractiveTarget(active));
};

const syncResponsiveDragAvailability = root => {
    const disabled = isResponsiveDragSuppressed();
    root.classList.toggle('local-groupimport-easystud--touch-drag-disabled', disabled);
    root.querySelectorAll('[data-easystud-user], [data-easystud-group-id]').forEach(item => {
        item.setAttribute('draggable', disabled || hasFocusedDragControl(item) ? 'false' : 'true');
    });
};

const getGroupingDropIdForGroup = group => {
    const section = group ? group.closest('[data-easystud-grouping-drop]') : null;
    return section ? (section.getAttribute('data-easystud-grouping-drop') || '0') : '0';
};

const bindResponsiveDragGuard = root => {
    const guard = event => {
        const card = event.target.closest('[data-easystud-user], [data-easystud-group-id]');
        if (!card || !root.contains(card)) {
            return;
        }
        if (isDragInteractiveTarget(event.target)) {
            card.setAttribute('draggable', 'false');
            return;
        }
        if (!isResponsiveDragSuppressed()) {
            return;
        }
        syncResponsiveDragAvailability(root);
        card.setAttribute('draggable', 'false');
    };

    root.addEventListener('pointerdown', guard, true);
    root.addEventListener('touchstart', guard, true);
    root.addEventListener('focusin', guard, true);
    root.addEventListener('focusout', event => {
        if (!isDragInteractiveTarget(event.target)) {
            return;
        }
        window.requestAnimationFrame(() => syncResponsiveDragAvailability(root));
    }, true);
};

const getUserCopyFields = user => {
    if (!user) {
        return [];
    }
    try {
        return JSON.parse(user.getAttribute('data-user-copy-fields') || '[]');
    } catch (error) {
        return [];
    }
};

const getUserCopyFieldValue = (user, fieldkey) => {
    const fields = getUserCopyFields(user);
    const match = fields.find(field => field.key === fieldkey);
    return match && match.value ? match.value : '';
};

const getKnownUserIdentifiers = root => {
    const known = new Map();
    const pending = new Map();
    const conflicts = new Set();
    const addIdentifier = (value, display, userid) => {
        const key = normalise(value);
        if (!key || conflicts.has(key)) {
            return;
        }
        if (pending.has(key) && pending.get(key) !== userid) {
            pending.delete(key);
            known.delete(key);
            conflicts.add(key);
            return;
        }
        pending.set(key, userid);
        known.set(key, display || value);
    };

    Array.from(root.querySelectorAll('[data-easystud-user]')).forEach(user => {
        const name = (user.querySelector('.local-groupimport-easystud-user__name') || {}).textContent || '';
        const display = name.trim();
        const userid = user.getAttribute('data-user-id') || display;
        [user.getAttribute('data-user-id'), user.getAttribute('data-user-email')].filter(Boolean).forEach(value => {
            addIdentifier(value, display || value, userid);
        });
        getUserCopyFields(user).forEach(field => {
            if (field.value) {
                addIdentifier(field.value, display || field.value, userid);
            }
        });
        display.split(/\s+/u).filter(Boolean).forEach(part => addIdentifier(part, display, userid));
    });
    return known;
};

const renderIdentifierPreview = (box, results, knownIdentifiers, separator = /[\s,;|]+/u) => {
    if (!box || !results) {
        return;
    }
    const tokens = (box.value.split(separator) || []).map(normalise).filter(Boolean);
    results.innerHTML = '';
    tokens.forEach(identifier => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token ' +
            (knownIdentifiers.has(identifier) ? 'local-groupimport-easystud-token--valid' : 'local-groupimport-easystud-token--invalid');
        badge.textContent = knownIdentifiers.get(identifier) || identifier;
        results.appendChild(badge);
    });
};

const getRecognisedIdentifiers = (text, knownIdentifiers, separator = /[\r\n,;|]+/u) => {
    const recognised = [];
    const unresolved = [];
    const seen = new Set();
    const phrases = (text || '').split(separator).map(part => part.trim()).filter(Boolean);
    const knownKeys = Array.from(knownIdentifiers.keys()).sort((left, right) => {
        const leftWords = left.split(/\s+/u).length;
        const rightWords = right.split(/\s+/u).length;
        if (leftWords !== rightWords) {
            return rightWords - leftWords;
        }
        return right.length - left.length;
    });

    const addRecognised = key => {
        if (!seen.has(key)) {
            recognised.push({key: key, label: knownIdentifiers.get(key)});
            seen.add(key);
        }
    };

    phrases.forEach(phrase => {
        const exact = normalise(phrase);
        if (knownIdentifiers.has(exact)) {
            addRecognised(exact);
            return;
        }

        const words = phrase.split(/\s+/u).map(normalise).filter(Boolean);
        for (let index = 0; index < words.length;) {
            let matched = '';
            for (const key of knownKeys) {
                const keyWords = key.split(/\s+/u);
                if (keyWords.length > words.length - index) {
                    continue;
                }
                const candidate = words.slice(index, index + keyWords.length).join(' ');
                if (candidate === key) {
                    matched = key;
                    break;
                }
            }
            if (matched) {
                addRecognised(matched);
                index += matched.split(/\s+/u).length;
            } else {
                unresolved.push(words[index]);
                index++;
            }
        }
    });

    return {recognised, unresolved};
};

const renderSmartIdentifierPreview = (box, results, knownIdentifiers, separator = /[\r\n,;|]+/u) => {
    if (!box || !results) {
        return;
    }
    const parsed = getRecognisedIdentifiers(box.value, knownIdentifiers, separator);
    results.innerHTML = '';
    parsed.recognised.forEach(match => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--valid';
        badge.textContent = match.label || match.key;
        results.appendChild(badge);
    });
    parsed.unresolved.forEach(identifier => {
        const badge = document.createElement('span');
        badge.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--invalid';
        badge.textContent = identifier;
        results.appendChild(badge);
    });
};

const getKnownGroupIdentifiers = root => {
    const known = new Map();
    const pending = new Map();
    const conflicts = new Set();
    const addIdentifier = (value, display, groupid) => {
        const key = normalise(value);
        if (!key || conflicts.has(key)) {
            return;
        }
        if (pending.has(key) && pending.get(key) !== groupid) {
            pending.delete(key);
            known.delete(key);
            conflicts.add(key);
            return;
        }
        pending.set(key, groupid);
        known.set(key, display || value);
    };

    Array.from(root.querySelectorAll('[data-easystud-group-id]')).forEach(group => {
        const id = group.getAttribute('data-easystud-group-id') || '';
        const nameNode = group.querySelector('.local-groupimport-easystud-group__name');
        const name = nameNode ? nameNode.textContent.trim() : '';
        addIdentifier(id, name || id, id);
        addIdentifier(name, name, id);
    });
    return known;
};

const getGroupName = group => {
    const node = group ? group.querySelector('.local-groupimport-easystud-group__name') : null;
    return node ? node.textContent.trim() : '';
};

const getGroupingName = grouping => {
    const node = grouping ? grouping.querySelector('.local-groupimport-easystud-grouping__name') : null;
    return node ? node.textContent.trim() : '';
};

const insertGroupElementSorted = (container, element) => {
    if (!container || !element) {
        return;
    }

    const newname = normalise(getGroupName(element));
    const groups = Array.from(container.querySelectorAll('[data-easystud-group-id]'));
    const next = groups.find(group => normalise(getGroupName(group)) > newname);
    if (next) {
        container.insertBefore(element, next);
        return;
    }

    container.appendChild(element);
};

const insertGroupingElementSorted = (container, element) => {
    if (!container || !element) {
        return;
    }

    const newname = normalise(getGroupingName(element));
    const groupings = Array.from(container.querySelectorAll('[data-easystud-grouping-id]'));
    const next = groupings.find(grouping => normalise(getGroupingName(grouping)) > newname);
    if (next) {
        container.insertBefore(element, next);
        return;
    }

    container.appendChild(element);
};

const animateElementCreated = element => {
    if (!element) {
        return;
    }
    element.classList.add('is-newly-created');
    Motion.enter(element, {duration: Motion.timing.normal, distance: '-0.45rem'}).then(completed => {
        if (completed) {
            window.setTimeout(() => element.classList.remove('is-newly-created'), Motion.timing.normal);
        }
    });
};

const animateElementRemoval = (element, onremove) => {
    if (!element) {
        if (onremove) {
            onremove();
        }
        return;
    }
    const finish = () => {
        if (onremove) {
            onremove();
        } else {
            element.remove();
        }
    };
    element.classList.add('is-being-removed');
    Motion.exit(element, {duration: Motion.timing.normal, distance: '0.45rem'}).then(completed => {
        if (completed) {
            finish();
        }
    });
};

const getGroupElementsById = (root, groupid) => Array.from(
    root.querySelectorAll('[data-easystud-group-id="' + groupid + '"]')
);

const getTreeGroupElementsById = (root, groupid) => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return [];
    }
    return Array.from(tree.querySelectorAll('[data-easystud-group-id="' + groupid + '"]')).filter(group => {
        return !group.closest('.local-groupimport-easystud-structure-groups');
    });
};

const getGroupingIdsForGroup = (root, groupid) => {
    const ids = [];
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
        const groupingid = grouping.getAttribute('data-easystud-grouping-id');
        if (grouping.querySelector(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id="' + groupid + '"]')) {
            ids.push(groupingid);
        }
    });
    return ids;
};

const groupHasGroupingMembership = (root, group) => {
    const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
    return !!groupid && getGroupingIdsForGroup(root, groupid).length > 0;
};

const getGroupsWithGroupingMembership = (root, groups) => {
    const seen = new Set();
    return groups.filter(group => {
        const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
        if (!groupid || seen.has(groupid) || !groupHasGroupingMembership(root, group)) {
            return false;
        }
        seen.add(groupid);
        return true;
    });
};

const renderGroupGroupingTags = (container, groupingnames) => {
    if (!container) {
        return;
    }
    const group = container.closest('[data-easystud-group-id]');
    const previousDetails = group ? group.querySelector(':scope > .local-groupimport-easystud-group__groupings-details') : null;
    const wasExpanded = group ? group.classList.contains('is-groupings-expanded') : false;
    if (previousDetails) {
        previousDetails.remove();
    }
    container.innerHTML = '';

    if (!groupingnames.length) {
        container.hidden = true;
        if (group) {
            group.classList.remove('is-groupings-expanded');
        }
        return;
    }

    const root = container.closest('.local-groupimport-easystud');
    const labels = root ? getLabels(root) : {};
    const overflowLabel = labels.groupingoverflowlabel || '';
    const shouldSummarise = groupingnames.length > 1 || (groupingnames[0] || '').length > 18;
    const summary = shouldSummarise ?
        overflowLabel.replace('__count__', groupingnames.length).replace('{$a}', groupingnames.length) :
        groupingnames[0];

    const summaryNode = document.createElement(shouldSummarise ? 'button' : 'span');
    summaryNode.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--grouping ' +
        'local-groupimport-easystud-group__groupings-summary';
    summaryNode.textContent = summary;
    if (shouldSummarise) {
        summaryNode.type = 'button';
        summaryNode.setAttribute('aria-expanded', wasExpanded ? 'true' : 'false');
        summaryNode.setAttribute('aria-label', summary + ': ' + groupingnames.join(', '));
        summaryNode.setAttribute('data-easystud-grouping-summary-toggle', '1');
    }
    container.appendChild(summaryNode);
    container.hidden = false;

    if (!shouldSummarise || !group) {
        if (group) {
            group.classList.remove('is-groupings-expanded');
        }
        return;
    }

    const details = document.createElement('div');
    details.className = 'local-groupimport-easystud-group__groupings-details';
    details.setAttribute('data-easystud-grouping-details', '1');

    const list = document.createElement('div');
    list.className = 'local-groupimport-easystud-group__groupings-details-list';
    groupingnames.forEach(name => {
        const token = document.createElement('span');
        token.className = 'local-groupimport-easystud-token local-groupimport-easystud-token--grouping';
        token.textContent = name;
        list.appendChild(token);
    });

    const icon = document.createElement('span');
    icon.className = 'fa fa-chevron-down local-groupimport-easystud-group__groupings-summary-icon';
    icon.setAttribute('aria-hidden', 'true');
    summaryNode.appendChild(icon);

    details.appendChild(list);
    group.insertBefore(details, group.querySelector(':scope > .local-groupimport-easystud-group__members') || null);
    group.classList.toggle('is-groupings-expanded', wasExpanded);
    details.hidden = !wasExpanded;
};

const setAdvancedAttributes = (element, data, type) => {
    if (!element || !data) {
        return;
    }
    element.setAttribute('data-easystud-advanced-type', type);
    element.setAttribute('data-easystud-advanced-name', data.name || '');
    element.setAttribute('data-easystud-advanced-description', data.description || '');
    element.setAttribute('data-easystud-advanced-raw-description', data.rawdescription || data.description || '');
    element.setAttribute('data-easystud-advanced-idnumber', data.idnumber || '');
    element.setAttribute('data-easystud-advanced-native-url', data.nativeurl || '');
    if (type === 'group') {
        element.setAttribute('data-easystud-advanced-picture', data.picture || '');
        element.setAttribute('data-easystud-advanced-enrolment-key', data.enrolmentkey ? '1' : '0');
        element.setAttribute('data-easystud-advanced-hide-picture', data.hidepicture ? '1' : '0');
        element.setAttribute('data-easystud-advanced-count', data.membercountlabel || '');
    } else {
        element.setAttribute('data-easystud-advanced-config', data.configdata || '');
        element.setAttribute('data-easystud-advanced-count', data.countlabel || '');
    }
};

/**
 * Rebuild participant membership metadata from the live group/grouping DOM.
 *
 * Participant details are initially rendered as JSON attributes. Dynamic group
 * and grouping mutations update the visible cards, so the cached JSON must be
 * refreshed before a details modal is reopened.
 *
 * @param {HTMLElement} root EasyStud root.
 */
const rehydrateParticipantMembershipDetails = root => {
    if (!root) {
        return;
    }

    const groups = new Map();
    const groupings = new Map();
    const memberships = new Map();
    const groupingMemberships = new Map();

    root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
        const groupingid = grouping.getAttribute('data-easystud-grouping-id') || '';
        if (groupingid && !groupings.has(groupingid)) {
            groupings.set(groupingid, getGroupingName(grouping));
        }
    });

    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        const groupid = group.getAttribute('data-easystud-group-id') || '';
        if (!groupid) {
            return;
        }
        if (!groups.has(groupid)) {
            groups.set(groupid, getGroupName(group));
        }

        const grouping = group.closest('[data-easystud-grouping-id]');
        const groupingid = grouping ? (grouping.getAttribute('data-easystud-grouping-id') || '') : '';
        if (groupingid) {
            if (!groupingMemberships.has(groupid)) {
                groupingMemberships.set(groupid, new Set());
            }
            groupingMemberships.get(groupid).add(groupingid);
        }

        group.querySelectorAll('[data-easystud-member-id]').forEach(member => {
            const userid = member.getAttribute('data-easystud-member-id') || '';
            if (!userid) {
                return;
            }
            if (!memberships.has(userid)) {
                memberships.set(userid, new Set());
            }
            memberships.get(userid).add(groupid);
        });
    });

    const normaliseIds = ids => ids.map(id => /^\d+$/.test(id) ? Number(id) : id);
    root.querySelectorAll('[data-easystud-user][data-user-id]').forEach(user => {
        const userid = user.getAttribute('data-user-id') || '';
        const groupids = Array.from(memberships.get(userid) || []);
        const groupingids = Array.from(groupids.reduce((result, groupid) => {
            (groupingMemberships.get(groupid) || []).forEach(groupingid => result.add(groupingid));
            return result;
        }, new Set()));

        user.setAttribute('data-group-ids', groupids.join(','));
        user.setAttribute('data-grouping-ids', groupingids.join(','));

        const detail = user.getAttribute('data-user-detail');
        if (!detail) {
            return;
        }
        try {
            const data = JSON.parse(detail);
            data.groupids = normaliseIds(groupids);
            data.groups = groupids.map(groupid => groups.get(groupid) || '').filter(Boolean);
            data.groupingids = normaliseIds(groupingids);
            data.groupings = groupingids.map(groupingid => groupings.get(groupingid) || '').filter(Boolean);
            user.setAttribute('data-user-detail', JSON.stringify(data));
        } catch (error) {
            // Preserve the server-rendered detail payload if it is malformed.
        }
    });
};

const updateCatalogGroupingTags = (root, groupid) => {
    const groupingids = getGroupingIdsForGroup(root, groupid);
    const groupingnames = groupingids.map(groupingid => {
        const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
        return getGroupingName(grouping);
    }).filter(Boolean);

    getGroupElementsById(root, groupid).forEach(group => {
        group.setAttribute('data-grouping-ids', groupingids.join(','));
        group.setAttribute('data-has-no-grouping', groupingids.length ? '0' : '1');

        const container = group.querySelector('.local-groupimport-easystud-group__groupings--inline');
        renderGroupGroupingTags(container, groupingnames);
    });
    scheduleGroupGroupingOverflow(root);
    scheduleCompleteListAlignment(root);
    rehydrateParticipantMembershipDetails(root);
};

const syncMaskedGroupingDescription = (group, container, masked, expanded) => {
    let description = group.querySelector(':scope > [data-easystud-masked-groupings-description]');
    if (!masked) {
        if (description) {
            description.remove();
        }
        return;
    }

    if (!description) {
        description = document.createElement('span');
        description.className = 'visually-hidden';
        description.setAttribute('data-easystud-masked-groupings-description', '1');
        group.insertBefore(description, group.querySelector(':scope > .local-groupimport-easystud-group__members') || null);
    }

    const details = group.querySelector(':scope > [data-easystud-grouping-details]');
    const source = details || container;
    const labels = getLabels(container.closest('.local-groupimport-easystud'));
    const names = Array.from(source.querySelectorAll('.local-groupimport-easystud-token--grouping'))
        .map(token => token.textContent.trim())
        .filter(Boolean);
    description.textContent = (labels.groupings || '') + ': ' + names.join(', ');
    description.hidden = expanded;
};

const syncMaskedGroupingMenuTrigger = (group, masked) => {
    const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
    if (!header) {
        return;
    }

    const trigger = group.querySelector(':scope > [data-easystud-card-menu]') ||
        header.querySelector(':scope > [data-easystud-card-menu]');
    if (!trigger) {
        return;
    }

    if (masked) {
        if (trigger.parentElement === group) {
            trigger.setAttribute('data-easystud-grouping-menu-relocated', '1');
        }
        // Keep the recovery action at the logical end of the card header.
        // The title keeps the first claim on the row; every lower-priority
        // card action can then move into this menu as space becomes scarce.
        header.appendChild(trigger);
        return;
    }

    if (trigger.getAttribute('data-easystud-grouping-menu-relocated') === '1') {
        group.appendChild(trigger);
        trigger.removeAttribute('data-easystud-grouping-menu-relocated');
    }
};

const syncGroupGroupingOverflow = root => {
    root.querySelectorAll('.local-groupimport-easystud-group__groupings--inline').forEach(container => {
        const group = container.closest('[data-easystud-group-id]');
        if (!group) {
            return;
        }

        if (isResponsiveWorkspace()) {
            container.hidden = false;
            group.classList.remove('is-groupings-summary-hidden');
            syncMaskedGroupingMenuTrigger(group, false);
            syncMaskedGroupingDescription(group, container, false, false);
            return;
        }

        // Measure the complete pill before deciding whether it may remain in the header.
        container.hidden = false;
        if (container.clientWidth < 1) {
            return;
        }
        const pills = Array.from(container.querySelectorAll('.local-groupimport-easystud-token--grouping'));
        const masked = container.scrollWidth > container.clientWidth || pills.some(pill =>
            pill.scrollWidth > pill.clientWidth
        );
        const toggle = container.querySelector('[data-easystud-grouping-summary-toggle]');
        const details = group.querySelector(':scope > [data-easystud-grouping-details]');
        const expanded = group.classList.contains('is-groupings-expanded');

        container.hidden = masked;
        group.classList.toggle('is-groupings-summary-hidden', masked);
        syncMaskedGroupingMenuTrigger(group, masked);
        syncMaskedGroupingDescription(group, container, masked, expanded);

        if (!toggle || !details) {
            return;
        }
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.classList.toggle('is-expanded', expanded);
        details.hidden = !expanded;
    });
};

const normaliseAllGroupGroupingTags = root => {
    root.querySelectorAll('.local-groupimport-easystud-group__groupings--inline').forEach(container => {
        const group = container.closest('[data-easystud-group-id]');
        const ids = group ? (group.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean) : [];
        let names = ids.map(groupingid => {
            const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
            return getGroupingName(grouping);
        }).filter(Boolean);

        if (!names.length) {
            names = Array.from(container.querySelectorAll('.local-groupimport-easystud-token--grouping'))
                .map(token => token.textContent.trim())
                .filter(Boolean);
        }
        renderGroupGroupingTags(container, names);
    });
};

const scheduleGroupGroupingOverflow = root => {
    window.requestAnimationFrame(() => syncGroupGroupingOverflow(root));
};

const ensureTagToggle = (container, root) => {
    let toggle = container.querySelector('[data-easystud-toggle-tags]');
    if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-link p-0 local-groupimport-easystud-tags-toggle local-groupimport-easystud-token';
        toggle.setAttribute('data-easystud-toggle-tags', '1');
        toggle.setAttribute('data-more-label', '+0');
        toggle.setAttribute('data-less-label', getLabels(root).showless || '');
        container.appendChild(toggle);
    }
    return toggle;
};

const syncTagToggleStyle = (toggle, token) => {
    if (!toggle || !token) {
        return;
    }
    toggle.classList.remove(
        'local-groupimport-easystud-token--role',
        'local-groupimport-easystud-token--group',
        'local-groupimport-easystud-token--grouping'
    );
    toggle.classList.add('local-groupimport-easystud-token');
    ['local-groupimport-easystud-token--role', 'local-groupimport-easystud-token--group',
        'local-groupimport-easystud-token--grouping'].forEach(classname => {
        if (token.classList.contains(classname)) {
            toggle.classList.add(classname);
        }
    });
};

const syncParticipantTagOverflow = scope => {
    const root = scope.matches && scope.matches('#local-groupimport-easystud') ?
        scope : scope.closest('#local-groupimport-easystud');
    if (!root) {
        return;
    }
    const pendingMeasurements = [];
    scope.querySelectorAll('.local-groupimport-easystud-user__meta-tags').forEach(container => {
        const tokens = Array.from(container.querySelectorAll('.local-groupimport-easystud-token:not(.local-groupimport-easystud-token--empty)'));
        let toggle = container.querySelector('[data-easystud-toggle-tags]');
        const expanded = toggle && toggle.getAttribute('data-expanded') === '1';

        tokens.forEach(token => {
            token.hidden = false;
        });

        if (!tokens.length || container.clientWidth < 1) {
            if (toggle) {
                toggle.hidden = true;
            }
            return;
        }

        toggle = ensureTagToggle(container, root);
        syncTagToggleStyle(toggle, tokens[0]);
        toggle.hidden = false;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');

        if (expanded) {
            toggle.textContent = '-';
            return;
        }

        toggle.textContent = '+' + tokens.length;
        pendingMeasurements.push({container, tokens, toggle});
    });

    // Read all rows together, then write all visibility states together. This avoids one style/layout pass per row.
    const measurements = pendingMeasurements.map(({container, tokens, toggle}) => {
        const styles = window.getComputedStyle(container);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const available = container.clientWidth;
        const togglewidth = toggle.getBoundingClientRect().width + gap;
        const tokenwidths = tokens.map(token => token.getBoundingClientRect().width);
        return {tokens, toggle, gap, available, togglewidth, tokenwidths};
    });

    measurements.forEach(({tokens, toggle, gap, available, togglewidth, tokenwidths}) => {
        let used = 0;
        let hidden = 0;
        let visible = 0;

        const visibility = tokenwidths.map(tokenwidth => {
            const width = tokenwidth + (visible > 0 ? gap : 0);
            if (used + width + togglewidth > available) {
                hidden++;
                return false;
            }
            used += width;
            visible++;
            return true;
        });

        // Apply visibility only after every width has been read to avoid a forced layout per hidden token.
        tokens.forEach((token, index) => {
            token.hidden = !visibility[index];
        });

        if (hidden) {
            toggle.textContent = '+' + hidden;
            toggle.setAttribute('data-more-label', '+' + hidden);
        } else {
            toggle.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
        }
    });
};

const scheduleParticipantTagOverflow = root => {
    window.requestAnimationFrame(() => syncParticipantTagOverflow(root));
};

const syncGroupingChildrenState = (section, labels) => {
    if (!section) {
        return;
    }
    const children = section.querySelector(':scope > .local-groupimport-easystud-tree__children');
    if (!children) {
        return;
    }
    children.querySelectorAll(':scope > .local-groupimport-easystud-tree__empty').forEach(node => node.remove());
    const hasgroups = children.querySelectorAll(':scope > [data-easystud-group-id]').length > 0;
    if (!hasgroups) {
        const empty = document.createElement('div');
        empty.className = 'local-groupimport-easystud-tree__empty';
        empty.textContent = labels.nogroupsingrouping || '';
        children.appendChild(empty);
    }
};

const syncUngroupedState = (root, labels) => {
    const children = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__children');
    if (!children) {
        return;
    }
    children.querySelectorAll(':scope > .local-groupimport-easystud-tree__empty').forEach(node => node.remove());
    const hasgroups = children.querySelectorAll(':scope > [data-easystud-group-id]').length > 0;
    if (!hasgroups) {
        const empty = document.createElement('div');
        empty.className = 'local-groupimport-easystud-tree__empty';
        empty.textContent = labels.nogroupsavailable || '';
        children.appendChild(empty);
    }
};

const syncGroupMembersHeight = (list, members, visibleCount, cancollapse) => {
    if (!list) {
        return;
    }
    if (!cancollapse) {
        list.style.removeProperty('--local-groupimport-members-collapsed-height');
        list.style.removeProperty('--local-groupimport-members-expanded-height');
        return;
    }

    const firstmember = members[0];
    const secondmember = members[1];
    const firstheight = firstmember ? firstmember.offsetTop + firstmember.offsetHeight : 0;
    if (!firstheight) {
        list.style.removeProperty('--local-groupimport-members-collapsed-height');
        list.style.removeProperty('--local-groupimport-members-expanded-height');
        return;
    }
    const partialheight = secondmember && secondmember.offsetHeight ?
        secondmember.offsetTop + (secondmember.offsetHeight * 0.58) : 0;
    const collapsedheight = Math.ceil(Math.max(partialheight, firstheight + 8));
    const expandedheight = Math.ceil(list.scrollHeight + 2);
    list.style.setProperty('--local-groupimport-members-collapsed-height', Math.max(collapsedheight, 0) + 'px');
    list.style.setProperty('--local-groupimport-members-expanded-height', Math.max(expandedheight, collapsedheight) + 'px');
};

const memberFocusableSelector = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
].join(', ');

const memberCollapsedTabindexAttribute = 'data-easystud-member-collapsed-tabindex';
let groupMemberMotionToken = 0;

/**
 * Keeps the visually clipped members out of the keyboard sequence.
 *
 * The `inert` state is the primary containment. The saved tabindex fallback
 * keeps the disclosure usable in browsers which do not enforce inert yet.
 *
 * @param {HTMLElement} member The group member item.
 * @param {boolean} collapsed Whether the member is visually clipped.
 * @returns {void}
 */
const syncCollapsedMemberFocus = (member, collapsed) => {
    member.toggleAttribute('inert', collapsed);
    if (collapsed) {
        member.querySelectorAll(memberFocusableSelector).forEach(control => {
            if (!control.hasAttribute(memberCollapsedTabindexAttribute)) {
                control.setAttribute(
                    memberCollapsedTabindexAttribute,
                    control.hasAttribute('tabindex') ? control.getAttribute('tabindex') : ''
                );
            }
            control.setAttribute('tabindex', '-1');
        });
        return;
    }

    member.querySelectorAll('[' + memberCollapsedTabindexAttribute + ']').forEach(control => {
        const tabindex = control.getAttribute(memberCollapsedTabindexAttribute);
        if (tabindex === '') {
            control.removeAttribute('tabindex');
        } else {
            control.setAttribute('tabindex', tabindex);
        }
        control.removeAttribute(memberCollapsedTabindexAttribute);
    });
};

const syncGroupMembersCollapsible = group => {
    if (!group) {
        return;
    }
    const list = group.querySelector('[data-easystud-group-members]');
    const toggle = group.querySelector('[data-easystud-group-members-toggle]');
    const more = group.querySelector('[data-easystud-group-members-more]');
    if (!list || !toggle) {
        return;
    }

    const allmembers = Array.from(list.querySelectorAll('[data-easystud-member-id]'));
    const members = allmembers.filter(member => !member.hidden);
    const expanded = toggle.getAttribute('aria-expanded') === 'true';
    const visibleCount = 2;
    const cancollapse = members.length > 1;

    allmembers.forEach(member => {
        member.classList.remove('local-groupimport-easystud-member--extra', 'is-collapsed');
    });

    const collapsedmembers = [];
    members.forEach((member, index) => {
        const isextra = cancollapse && index >= visibleCount;
        const iscollapsed = isextra && !expanded;
        member.classList.toggle('local-groupimport-easystud-member--extra', isextra);
        member.classList.toggle('is-collapsed', iscollapsed);
        if (iscollapsed) {
            collapsedmembers.push(member);
        }
    });

    if (collapsedmembers.some(member => member.contains(document.activeElement))) {
        toggle.focus({preventScroll: true});
    }
    allmembers.forEach(member => syncCollapsedMemberFocus(member, collapsedmembers.includes(member)));

    list.classList.toggle('has-extra-members', cancollapse);
    list.classList.toggle('is-expanded', expanded);
    syncGroupMembersHeight(list, members, visibleCount, cancollapse);
    group.classList.toggle('has-collapsible-members', cancollapse);
    toggle.hidden = !cancollapse;
    toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
    toggle.classList.toggle('is-expanded', expanded);
    if (more) {
        more.hidden = !cancollapse || expanded;
    }
};

const syncAllGroupMembersCollapsible = root => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(syncGroupMembersCollapsible);
};

const syncGroupMembersInContainer = container => {
    if (!container) {
        return;
    }
    container.querySelectorAll('[data-easystud-group-id]').forEach(syncGroupMembersCollapsible);
};

const getContainerGroups = list => {
    if (!list) {
        return [];
    }
    return Array.from(list.querySelectorAll(':scope > [data-easystud-group-id]'));
};

const getVisibleContainerGroups = list => getContainerGroups(list).filter(group => !group.hidden);

const syncGroupingGroupsHeight = (list, groups, visibleCount, cancollapse) => {
    if (!list) {
        return;
    }
    if (!cancollapse) {
        list.style.removeProperty('--local-groupimport-grouping-groups-collapsed-height');
        list.style.removeProperty('--local-groupimport-grouping-groups-expanded-height');
        list.style.maxHeight = '';
        return;
    }

    const lastvisible = groups[Math.min(visibleCount, groups.length) - 1];
    const collapsedheight = lastvisible ? Math.ceil(lastvisible.offsetTop + lastvisible.offsetHeight + 8) : 0;
    const expandedheight = Math.ceil(list.scrollHeight + 2);
    list.style.setProperty('--local-groupimport-grouping-groups-collapsed-height', Math.max(collapsedheight, 0) + 'px');
    list.style.setProperty('--local-groupimport-grouping-groups-expanded-height', Math.max(expandedheight, collapsedheight) + 'px');
    if (!list.classList.contains('is-tree-animating')) {
        list.style.maxHeight = list.classList.contains('is-expanded') ?
            Math.max(expandedheight, collapsedheight) + 'px' : Math.max(collapsedheight, 0) + 'px';
    }
};

const syncGroupingGroupsCollapsible = grouping => {
    if (!grouping || !grouping.hasAttribute('data-easystud-grouping-id')) {
        return;
    }
    const list = grouping.querySelector('[data-easystud-container-group-list]');
    const toggle = grouping.querySelector('[data-easystud-grouping-groups-toggle]');
    if (!list || !toggle || list.hidden) {
        return;
    }

    const groups = getVisibleContainerGroups(list);

    getContainerGroups(list).forEach(group => {
        group.classList.remove('local-groupimport-easystud-group--extra', 'is-collapsed');
    });

    list.classList.remove('has-extra-groups');
    list.classList.add('is-expanded');
    syncGroupingGroupsHeight(list, groups, groups.length, false);
    grouping.classList.remove('has-collapsible-groups');
    toggle.hidden = true;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.remove('is-expanded');
};

const syncAllGroupingGroupsCollapsible = root => {
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(syncGroupingGroupsCollapsible);
};

const scheduleGroupingResizeForGroup = group => {
    const grouping = group ? group.closest('[data-easystud-grouping-id]') : null;
    if (!grouping) {
        return;
    }
    requestGuideHighlightRefresh(grouping.closest('#local-groupimport-easystud'));
    window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(grouping));
};

const expandGroupingSection = grouping => {
    if (!grouping) {
        return;
    }
    const root = grouping.closest('.local-groupimport-easystud');
    const toggle = grouping.querySelector('[data-easystud-collapse-toggle]');
    const children = grouping.querySelector('.local-groupimport-easystud-tree__children');
    if (!toggle || !children) {
        return;
    }
    const icon = toggle.querySelector('.fa');
    if (toggle.getAttribute('aria-expanded') === 'true') {
        grouping.classList.add('is-expanded');
        children.hidden = false;
        if (root) {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        window.requestAnimationFrame(() => {
            syncGroupingGroupsCollapsible(grouping);
            syncGroupMembersInContainer(children);
        });
        if (icon) {
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
        }
        return;
    }
    toggle.setAttribute('aria-expanded', 'true');
    grouping.classList.add('is-expanded');
    if (icon) {
        icon.classList.remove('fa-chevron-right');
        icon.classList.add('fa-chevron-down');
    }
    animateTreeChildren(children, true);
    if (root) {
        emitGuidedCompletion(root, 2, 'grouping');
        requestGuideHighlightRefresh(root);
    }
};

const syncSelectedGroupingExpansion = root => {
    const selectedGroupings = getSelectedItems(root, 'grouping');
    if (selectedGroupings.length === 1) {
        expandGroupingSection(selectedGroupings[0]);
        return;
    }
    if (selectedGroupings.length > 1) {
        collapseAllGroupings(root);
    }
};

const collapseGroupingSection = grouping => {
    if (!grouping) {
        return;
    }
    const children = grouping.querySelector(':scope > .local-groupimport-easystud-tree__children');
    const toggle = grouping.querySelector(':scope .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]');
    const icon = toggle ? toggle.querySelector('.fa') : null;
    const groupsToggle = grouping.querySelector('[data-easystud-grouping-groups-toggle]');

    grouping.classList.remove('is-expanded');
    if (children) {
        children.hidden = true;
        children.style.maxHeight = '';
        children.style.opacity = '';
        children.style.overflow = '';
    }
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
    }
    if (icon) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-right');
    }
    if (groupsToggle) {
        groupsToggle.setAttribute('aria-expanded', 'false');
        groupsToggle.classList.remove('is-expanded');
    }
    requestGuideHighlightRefresh(grouping.closest('#local-groupimport-easystud'));
};

const collapseAllGroupings = root => {
    root.querySelectorAll('[data-easystud-grouping-id].is-expanded').forEach(collapseGroupingSection);
};

const getGroupsInGrouping = grouping => {
    if (!grouping) {
        return [];
    }
    return Array.from(grouping.querySelectorAll(
        ':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]'
    ));
};

const selectGroupingGroups = (root, groupings) => {
    const groups = [];
    const seen = new Set();
    groupings.forEach(grouping => {
        expandGroupingSection(grouping);
        getGroupsInGrouping(grouping).forEach(group => {
            const groupid = group.getAttribute('data-easystud-group-id') || '';
            if (!groupid || seen.has(groupid)) {
                return;
            }
            seen.add(groupid);
            groups.push(group);
        });
    });
    clearSelectionState(root);
    groupings.forEach(expandGroupingSection);
    groups.forEach(group => setItemSelected(group, true));
    updateSelectionActions(root);
};

const setRenameEditing = (form, editing) => {
    if (!form) {
        return;
    }
    const edit = form.querySelector('.local-groupimport-easystud-rename__edit');
    const toggle = form.querySelector('[data-easystud-rename-toggle]');
    const header = form.closest('.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header');
    if (edit) {
        edit.hidden = !editing;
    }
    if (toggle) {
        toggle.hidden = editing;
    }
    if (header) {
        header.classList.toggle('is-rename-editing', editing);
    }
    const root = form.closest('.local-groupimport-easystud');
    if (root) {
        const hasOpenEditor = editing || !!root.querySelector(
            '.local-groupimport-easystud-rename__edit:not([hidden])'
        );
        root.classList.toggle('local-groupimport-easystud--inline-editing', hasOpenEditor);
    }
};

const syncCatalogFilters = (root, options = {}) => {
    const catalogs = [
        {
            key: 'participants',
            filter: root.querySelector('[data-easystud-catalog-grouping-filter="participants"]'),
            toggle: root.querySelector('[data-easystud-catalog-show-ungrouped="participants"]'),
            list: root.querySelector('.local-groupimport-easystud-participant-groups__list'),
        },
        {
            key: 'structure',
            filter: root.querySelector('[data-easystud-catalog-grouping-filter="structure"]'),
            toggle: root.querySelector('[data-easystud-catalog-show-ungrouped="structure"]'),
            list: root.querySelector('.local-groupimport-easystud-structure-groups__list'),
        },
    ];

    catalogs.forEach(catalog => {
        if (!catalog.filter || !catalog.list) {
            return;
        }
        const selected = Array.from(catalog.filter.selectedOptions).map(option => option.value).filter(Boolean);
        const onlyungrouped = catalog.toggle ? catalog.toggle.checked : false;
        catalog.list.querySelectorAll('[data-easystud-group-id]').forEach(group => {
            const groupingids = (group.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
            const hasnogrouping = group.getAttribute('data-has-no-grouping') === '1';
            const matchesgrouping = !selected.length || selected.some(value => {
                if (value === '__none__') {
                    return hasnogrouping;
                }
                return groupingids.indexOf(value) !== -1;
            });
            const matchesungrouped = !onlyungrouped || hasnogrouping;
            const filterhidden = !(matchesgrouping && matchesungrouped);
            group.setAttribute('data-easystud-catalog-filter-hidden', filterhidden ? '1' : '0');
        });
    });
    applyCatalogSearch(root, options);
    applyStructureSearch(root, options);
    syncResponsiveResetButtons(root);
};

const getInputQuery = (root, selector) => {
    const search = root.querySelector(selector);
    return normalise(search ? search.value : '');
};

const getStructureGroupSearchQuery = root => {
    return (root.classList.contains(structureFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'groups') ?
        getInputQuery(root, '[data-easystud-structure-group-search]') : '';
};

const getStructureGroupingSearchQuery = root => {
    return (root.classList.contains(structureFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'groupings') ?
        getInputQuery(root, '[data-easystud-structure-grouping-search]') : '';
};

const syncResponsiveResetButtons = root => {
    const participantActive = !!(
        getInputQuery(root, '[data-easystud-search]') ||
        getSelectedFilterValues(root.querySelector('[data-easystud-role-filter]')).length ||
        getSelectedFilterValues(root.querySelector('[data-easystud-group-filter]')).length ||
        getSelectedFilterValues(root.querySelector('[data-easystud-grouping-filter]')).length
    );
    root.querySelectorAll('[data-easystud-reset-filters]').forEach(button => {
        button.classList.toggle('is-active', participantActive);
    });

    ['participants', 'structure'].forEach(key => {
        const searchSelector = key === 'structure' ? '[data-easystud-structure-group-search]' :
            '[data-easystud-catalog-search="participants"]';
        const toggle = root.querySelector('[data-easystud-catalog-show-ungrouped="' + key + '"]');
        const active = !!(
            getInputQuery(root, searchSelector) ||
            getSelectedFilterValues(root.querySelector('[data-easystud-catalog-grouping-filter="' + key + '"]')).length ||
            (toggle && toggle.checked)
        );
        root.querySelectorAll('[data-easystud-reset-catalog-filters="' + key + '"]').forEach(button => {
            button.classList.toggle('is-active', active);
        });
    });
    const groupingOccupancy = root.querySelector('[data-easystud-grouping-occupancy][aria-pressed="true"]');
    const groupingFiltersActive = !!(
        getInputQuery(root, '[data-easystud-structure-grouping-search]') ||
        (groupingOccupancy && groupingOccupancy.getAttribute('data-easystud-grouping-occupancy') !== 'all')
    );
    root.querySelectorAll('[data-easystud-reset-grouping-filters]').forEach(button => {
        button.classList.toggle('is-active', groupingFiltersActive);
    });
};

const matchesSearchText = (element, query) => {
    if (!query) {
        return true;
    }
    return normalise(element.getAttribute('data-search-text') || element.textContent).indexOf(query) !== -1;
};

const applyCatalogSearch = (root, options = {}) => {
    const structureGroupQuery = getStructureGroupSearchQuery(root);
    const participantGroupQuery = root.classList.contains(participantFocusClass) ?
        getInputQuery(root, '[data-easystud-catalog-search="participants"]') : '';

    root.querySelectorAll('.local-groupimport-easystud-structure-groups__list > [data-easystud-group-id]').forEach(group => {
        const searchhidden = !matchesSearchText(group, structureGroupQuery);
        group.setAttribute('data-easystud-structure-search-hidden', searchhidden ? '1' : '0');
        group.hidden = group.getAttribute('data-easystud-catalog-filter-hidden') === '1' || searchhidden;
    });

    root.querySelectorAll('.local-groupimport-easystud-participant-groups__list > [data-easystud-group-id]').forEach(group => {
        const searchhidden = !matchesSearchText(group, participantGroupQuery);
        group.setAttribute('data-easystud-catalog-search-hidden', searchhidden ? '1' : '0');
        group.hidden = group.getAttribute('data-easystud-catalog-filter-hidden') === '1' || searchhidden;
    });
    syncFilteredEmptyStates(root);
    if (options.pagination !== false) {
        syncPagination(root);
    }
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

const applyStructureSearch = (root, options = {}) => {
    const groupingQuery = getStructureGroupingSearchQuery(root);
    const occupancy = root.querySelector('[data-easystud-grouping-occupancy][aria-pressed="true"]');
    const occupancyValue = occupancy ? occupancy.getAttribute('data-easystud-grouping-occupancy') : 'all';

    root.querySelectorAll('[data-easystud-tree] [data-easystud-grouping-id]').forEach(grouping => {
        const hasGroups = getGroupsInGrouping(grouping).length > 0;
        const matchesOccupancy = occupancyValue === 'all' ||
            (occupancyValue === 'filled' && hasGroups) || (occupancyValue === 'empty' && !hasGroups);
        grouping.hidden = !matchesSearchText(grouping, groupingQuery) || !matchesOccupancy;
    });
    syncFilteredEmptyStates(root);
    if (options.pagination !== false) {
        syncPagination(root);
    }
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

const placeManagedStateBeforeBottomPagination = (list, state) => {
    const bottomPagination = list.querySelector(':scope > [data-easystud-pagination="bottom"]');
    list.insertBefore(state, bottomPagination || null);
};

const syncContainerGroupEmptyState = (root, list, query, visibleCount) => {
    if (!list) {
        return;
    }
    const labels = getLabels(root);
    const groups = getContainerGroups(list);
    const naturalEmpty = Array.from(list.querySelectorAll(':scope > .local-groupimport-easystud-tree__empty'))
        .filter(item => !item.hasAttribute('data-easystud-container-filter-empty'));
    let filteredEmpty = list.querySelector(':scope > [data-easystud-container-filter-empty]');

    naturalEmpty.forEach(item => {
        item.hidden = groups.length > 0;
    });

    if (!filteredEmpty) {
        filteredEmpty = document.createElement('div');
        filteredEmpty.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        filteredEmpty.setAttribute('data-easystud-container-filter-empty', '1');
        filteredEmpty.textContent = labels.noresultsfiltered || '';
    }
    placeManagedStateBeforeBottomPagination(list, filteredEmpty);
    filteredEmpty.hidden = !query || visibleCount > 0 || groups.length === 0;
};

const applyContainerGroupSearch = (root, options = {}) => {
    root.querySelectorAll('[data-easystud-container-group-list]').forEach(list => {
        const key = list.getAttribute('data-easystud-container-group-list') || '';
        const section = list.closest('.local-groupimport-easystud-tree__section');
        const search = section ? section.querySelector('[data-easystud-container-group-search="' + key + '"]') : null;
        const query = normalise(search ? search.value : '');
        let visibleCount = 0;

        getContainerGroups(list).forEach(group => {
            const hidden = !matchesSearchText(group, query);
            group.hidden = hidden;
            group.setAttribute('data-easystud-container-search-hidden', hidden ? '1' : '0');
            if (!hidden) {
                visibleCount++;
            }
        });

        syncContainerGroupEmptyState(root, list, query, visibleCount);
        if (section && section.hasAttribute('data-easystud-grouping-id')) {
            const toggle = section.querySelector('[data-easystud-grouping-groups-toggle]');
            if (query && toggle) {
                toggle.setAttribute('aria-expanded', 'true');
            }
            window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(section));
        }
    });
    scheduleResponsiveUiRefresh(root, options);
};

const ensureGroupMemberSearchControls = (root, group) => {
    if (!group || group.querySelector('[data-easystud-group-member-search-toggle]')) {
        return;
    }
    const labels = getLabels(root);
    const groupid = group.getAttribute('data-easystud-group-id') || '';
    const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
    const members = group.querySelector(':scope > [data-easystud-group-members]');
    if (!groupid || !header || !members) {
        return;
    }

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'btn btn-link p-0 local-groupimport-easystud-group__member-search-button';
    toggle.setAttribute('data-easystud-group-member-search-toggle', groupid);
    toggle.setAttribute('aria-label', labels.searchparticipantslabel || '');
    toggle.setAttribute('data-easystud-hover-help', labels.searchparticipantslabel || '');
    toggle.innerHTML = '<span class="fa fa-search" aria-hidden="true"></span>';

    const mail = header.querySelector(':scope > .local-groupimport-easystud-group__mail-button');
    const rename = header.querySelector(':scope > .local-groupimport-easystud-rename');
    header.insertBefore(toggle, mail || rename || null);

    const panel = document.createElement('div');
    panel.className = 'local-groupimport-easystud-container-search local-groupimport-easystud-group__member-search';
    panel.setAttribute('data-easystud-group-member-search-panel', groupid);
    panel.hidden = true;
    panel.innerHTML =
        '<div class="local-groupimport-easystud-container-search__row">' +
            '<label class="local-groupimport-easystud__search-field local-groupimport-easystud-container-search__field" aria-label="' +
                (labels.searchparticipantslabel || '') + '">' +
                '<span class="fa fa-search" aria-hidden="true"></span>' +
                '<input type="search" class="form-control" placeholder="' + (labels.searchparticipants || '') +
                    '" data-easystud-group-member-search="' + groupid + '">' +
            '</label>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-group-member-search-cancel="' +
                groupid + '">' + (labels.cancel || '') + '</button>' +
        '</div>';
    group.insertBefore(panel, members);
};

const normaliseCardMenuButton = (button, root) => {
    if (!button) {
        return;
    }
    button.classList.add('local-groupimport-easystud-card-menu');
    button.setAttribute('data-easystud-card-menu', '1');
    button.setAttribute('aria-haspopup', 'menu');
    if (!button.getAttribute('aria-expanded')) {
        button.setAttribute('aria-expanded', 'false');
    }
    if (!button.getAttribute('aria-label')) {
        button.setAttribute('aria-label',
            root.getAttribute('data-easystud-mobile-card-actions') || getLabels(root).mobilecardactions || '');
    }
    const icon = button.querySelector(':scope > .local-groupimport-easystud-card-menu__icon.fa-bars');
    if (!icon || button.children.length !== 1) {
        button.innerHTML =
            '<span class="fa fa-bars local-groupimport-easystud-card-menu__icon" aria-hidden="true"></span>';
    }
};

const ensureNestedGroupActionMenus = root => {
    const actionSelector = [
        ':scope > .local-groupimport-easystud-group__mail-button',
        ':scope > .local-groupimport-easystud-group__member-search-button',
        ':scope > .local-groupimport-easystud-group__duplicate-button',
        ':scope > .local-groupimport-easystud-group__settings-button',
        ':scope > .local-groupimport-easystud-group__unlink-button',
        ':scope > .local-groupimport-easystud-container-search__toggle',
        ':scope > .local-groupimport-easystud-grouping__search-button',
        ':scope > .local-groupimport-easystud-grouping__duplicate-button',
        ':scope > .local-groupimport-easystud-grouping__settings-button',
        ':scope > .local-groupimport-easystud-rename > .local-groupimport-easystud-rename__toggle',
    ].join(', ');

    root.querySelectorAll('[data-easystud-group-id], [data-easystud-grouping-id]').forEach(group => {
        const header = group.querySelector(
            ':scope > .local-groupimport-easystud-group__header, :scope > .local-groupimport-easystud-grouping__header'
        );
        if (!header) {
            return;
        }

        let menu = header.querySelector(':scope > [data-easystud-group-actions-menu]');
        let toggle = header.querySelector(':scope > [data-easystud-group-actions-toggle]');
        if (!menu) {
            menu = document.createElement('div');
            menu.className = 'local-groupimport-easystud-group__actions-menu';
            menu.setAttribute('data-easystud-group-actions-menu', '1');
            menu.hidden = true;
            header.appendChild(menu);
        }
        if (!toggle) {
            toggle = document.createElement('button');
            toggle.type = 'button';
            toggle.className = 'btn btn-link p-0 local-groupimport-easystud-group__actions-toggle ' +
                'local-groupimport-easystud-card-menu';
            toggle.setAttribute('data-easystud-group-actions-toggle', '1');
            toggle.setAttribute('aria-expanded', 'false');
            toggle.setAttribute('aria-label', getLabels(root).moreactions || '');
            header.appendChild(toggle);
        }
        normaliseCardMenuButton(toggle, root);

        const actions = Array.from(header.querySelectorAll(actionSelector));
        actions.forEach(button => button.classList.remove('is-easystud-card-action-overflow'));
        toggle.hidden = true;
        menu.hidden = true;
        menu.innerHTML = '';
        if (!header.offsetParent || !actions.length) {
            return;
        }

        const cardBounds = group.getBoundingClientRect();
        const isOutsideCard = button => {
            if (button.hidden || button.offsetParent === null) {
                return false;
            }
            const bounds = button.getBoundingClientRect();
            return bounds.left < cardBounds.left - 1 || bounds.right > cardBounds.right + 1;
        };
        const responsive = isResponsiveWorkspace();
        let overflowed = responsive ? actions.filter(button => !button.hidden) : actions.filter(isOutsideCard);
        if (!overflowed.length && header.scrollWidth <= header.clientWidth + 1) {
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        toggle.hidden = false;
        for (let index = actions.length - 1;
            index >= 0 && (header.scrollWidth > header.clientWidth + 1 || actions.some(isOutsideCard));
            index--) {
            const button = actions[index];
            if (!button.hidden && !overflowed.includes(button)) {
                overflowed.unshift(button);
            }
            button.classList.add('is-easystud-card-action-overflow');
        }
        overflowed.forEach(source => {
            source.classList.add('is-easystud-card-action-overflow');
            const clone = source.cloneNode(true);
            const label = source.getAttribute('aria-label') || source.getAttribute('data-easystud-hover-help') ||
                source.getAttribute('title') || '';
            clone.removeAttribute('id');
            clone.classList.remove('is-easystud-card-action-overflow');
            clone.classList.add('local-groupimport-easystud-group__actions-menu-item');
            clone.removeAttribute('data-easystud-hover-help');
            clone.removeAttribute('title');
            if (label) {
                const labelNode = document.createElement('span');
                labelNode.className = 'local-groupimport-easystud-group__actions-menu-label';
                labelNode.textContent = label;
                clone.appendChild(labelNode);
            }
            clone.addEventListener('click', event => {
                event.preventDefault();
                menu.hidden = true;
                toggle.setAttribute('aria-expanded', 'false');
                source.click();
            });
            menu.appendChild(clone);
        });
        toggle.hidden = menu.children.length === 0;
    });
};

const syncGroupMemberSearchEmptyState = (root, group, query, visibleCount) => {
    const labels = getLabels(root);
    const list = group ? group.querySelector(':scope > [data-easystud-group-members]') : null;
    if (!list) {
        return;
    }
    let empty = list.querySelector(':scope > [data-easystud-member-filter-empty]');
    if (!empty) {
        empty = document.createElement('li');
        empty.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        empty.setAttribute('data-easystud-member-filter-empty', '1');
        empty.textContent = labels.noresultsfiltered || '';
        list.appendChild(empty);
    }
    empty.hidden = !query || visibleCount > 0;
};

const applyGroupMemberSearch = (root, options = {}) => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        ensureGroupMemberSearchControls(root, group);
        const groupid = group.getAttribute('data-easystud-group-id') || '';
        const input = group.querySelector(':scope > [data-easystud-group-member-search-panel="' + groupid + '"] ' +
            '[data-easystud-group-member-search="' + groupid + '"]');
        const query = normalise(input ? input.value : '');
        const members = Array.from(group.querySelectorAll(':scope > [data-easystud-group-members] [data-easystud-member-id]'));
        let visibleCount = 0;

        members.forEach(member => {
            const userid = member.getAttribute('data-easystud-member-id') || '';
            const user = userid ? root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]') : null;
            const text = normalise(
                (member.getAttribute('data-search-text') || member.textContent || '') + ' ' +
                (user ? (user.getAttribute('data-search-text') || user.textContent || '') : '')
            );
            const hidden = !!query && text.indexOf(query) === -1;
            member.hidden = hidden;
            member.setAttribute('data-easystud-member-search-hidden', hidden ? '1' : '0');
            if (!hidden) {
                visibleCount++;
            }
        });

        if (query) {
            const toggle = group.querySelector('[data-easystud-group-members-toggle]');
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'true');
            }
        }
        syncGroupMemberSearchEmptyState(root, group, query, visibleCount);
        syncGroupMembersCollapsible(group);
        scheduleGroupingResizeForGroup(group);
    });
    scheduleResponsiveUiRefresh(root, options);
};

const showNotification = (root, message, type) => {
    const container = root.querySelector('[data-easystud-notifications]');
    if (!message) {
        return;
    }

    const toasttype = type === 'error' ? 'danger' : (type || 'success');
    const showFallback = () => {
        if (!container) {
            return;
        }

        const note = document.createElement('div');
        note.className = 'alert alert-' + toasttype + ' local-groupimport-easystud__notification';
        note.setAttribute('role', 'status');
        note.textContent = message;
        container.appendChild(note);

        window.setTimeout(() => {
            note.classList.add('is-leaving');
            window.setTimeout(() => note.remove(), 220);
        }, 3200);
    };

    if (typeof require === 'function') {
        try {
            require(['core/toast'], toast => {
                toast.add(message, {
                    type: toasttype,
                    delay: 4000,
                });
            }, showFallback);
            return;
        } catch (error) {
            showFallback();
            return;
        }
    }

    showFallback();
};

const decorateNativeMessageModalNode = node => {
    if (!node) {
        return null;
    }

    node.classList.add('local-groupimport-easystud-message-modal', 'is-open');
    node.classList.toggle('is-loading', !node.querySelector('#bulk-message'));

    const dialog = node.querySelector('.modal-dialog');
    if (dialog) {
        dialog.classList.add('local-groupimport-easystud-message-modal__dialog');
    }
    const content = node.querySelector('.modal-content');
    if (content) {
        content.classList.add('local-groupimport-easystud-message-modal__content');
    }
    const textarea = node.querySelector('#bulk-message');
    if (textarea) {
        textarea.classList.add('local-groupimport-easystud-message-modal__textarea');
        textarea.setAttribute('rows', '10');
        textarea.removeAttribute('data-auto-rows');
        textarea.removeAttribute('data-max-rows');
        const wrapper = textarea.closest('p, .form-group, .mb-3');
        if (wrapper) {
            wrapper.classList.add('local-groupimport-easystud-message-modal__textarea-wrap');
        }
        node.classList.remove('is-loading');
        if (node.easystudMessageContentObserver) {
            node.easystudMessageContentObserver.disconnect();
            node.easystudMessageContentObserver = null;
        }
    } else {
        if (!node.easystudMessageContentObserver && typeof MutationObserver === 'function') {
            node.easystudMessageContentObserver = new MutationObserver(() => {
                if (node.querySelector('#bulk-message')) {
                    decorateNativeMessageModalNode(node);
                }
            });
            node.easystudMessageContentObserver.observe(node, {childList: true, subtree: true});
        }
    }
    if (textarea || node.getAttribute('data-easystud-message-animation-played') === '1') {
        replayNativeMessageModalAnimation(node);
    }
    return node;
};

const replayNativeMessageModalAnimation = node => {
    if (!node || node.getAttribute('data-easystud-message-animation-played') === '1') {
        return;
    }
    const dialog = node.querySelector('.local-groupimport-easystud-message-modal__dialog');
    if (!dialog) {
        return;
    }

    const play = () => {
        if (node.getAttribute('data-easystud-message-animation-played') === '1') {
            return;
        }
        node.setAttribute('data-easystud-message-animation-played', '1');
        Motion.enter(dialog, {duration: Motion.timing.slow, distance: '0.45rem'});
    };
    const playWhenVisible = () => {
        const isvisible = node.classList.contains('show') || node.getAttribute('aria-hidden') === 'false' ||
            node.offsetParent !== null;
        if (!isvisible) {
            node.addEventListener('shown.bs.modal', play, {once: true});
            return;
        }
        play();
    };
    playWhenVisible();
};

const decorateNativeMessageModal = modal => {
    if (!modal || !modal.getRoot) {
        return modal;
    }
    const root = modal.getRoot();
    const node = root && root.get ? root.get(0) : null;
    decorateNativeMessageModalNode(node);
    return modal;
};

const watchNativeMessageModal = () => {
    if (typeof MutationObserver !== 'function' || !document.body) {
        return () => {};
    }

    let observer = null;
    let timeout = null;
    const inspectNode = node => {
        if (!node || node.nodeType !== 1) {
            return;
        }

        const candidates = [];
        if (node.matches && node.matches('.modal')) {
            candidates.push(node);
        }
        if (node.closest) {
            const closestModal = node.closest('.modal');
            if (closestModal) {
                candidates.push(closestModal);
            }
        }
        if (node.querySelectorAll) {
            node.querySelectorAll('.modal').forEach(candidate => candidates.push(candidate));
        }

        Array.from(new Set(candidates)).forEach(candidate => {
            if (!candidate.classList.contains('local-groupimport-easystud-modal')) {
                decorateNativeMessageModalNode(candidate);
            }
        });
    };

    observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(inspectNode);
        });
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
    document.body.querySelectorAll('.modal.show').forEach(inspectNode);

    const stop = () => {
        if (observer) {
            observer.disconnect();
            observer = null;
        }
        if (timeout) {
            window.clearTimeout(timeout);
            timeout = null;
        }
    };
    timeout = window.setTimeout(stop, 6000);
    return stop;
};

const getUniqueParticipantIds = items => {
    const seen = new Set();
    const ids = [];
    (items || []).forEach(item => {
        const id = item ? (item.getAttribute('data-user-id') || item.getAttribute('data-easystud-member-id') || '') : '';
        if (id && !seen.has(id)) {
            seen.add(id);
            ids.push(Number(id));
        }
    });
    return ids;
};

const getSelectedMessageUserIds = (root, contextType = '', target = null) => {
    if (contextType) {
        return getUniqueParticipantIds(getParticipantItemsForContext(root, contextType, target));
    }

    const selectedUsers = getSelectedItems(root, 'participant');
    if (selectedUsers.length) {
        return getUniqueParticipantIds(selectedUsers);
    }
    return getUniqueParticipantIds(getSelectedItems(root, 'member'));
};

const openParticipantMessageModal = (root, userids) => {
    const ids = (userids || []).filter(Boolean);
    if (!ids.length) {
        return Promise.resolve();
    }
    if (typeof require !== 'function') {
        showNotification(root, getLabels(root).messagesendunavailable || '', 'error');
        return Promise.resolve();
    }
    const stopWatchingMessageModal = watchNativeMessageModal();
    const stopWatchingSoon = () => {
        window.setTimeout(stopWatchingMessageModal, 5000);
    };
    return new Promise((resolve, reject) => {
        require(['core_user/local/participants/bulkactions'], bulkactions => {
            if (!bulkactions || !bulkactions.showSendMessage) {
                stopWatchingSoon();
                reject(new Error(getLabels(root).messagesendunavailable || ''));
                return;
            }
            bulkactions.showSendMessage(ids)
                .then(modal => {
                    stopWatchingSoon();
                    resolve(decorateNativeMessageModal(modal));
                })
                .catch(error => {
                    stopWatchingSoon();
                    reject(error);
                });
        }, error => {
            stopWatchingSoon();
            reject(error);
        });
    }).catch(error => {
        showNotification(root, error.message || getLabels(root).messagesendunavailable || '', 'error');
    });
};

const emitGuidedCompletion = (root, step, path = 'main') => {
    root.dispatchEvent(new CustomEvent('easystud:guided-complete', {
        bubbles: true,
        detail: {path, step},
    }));

    const easyeduPaths = {
        main: {
            path: 'first-structure',
            steps: ['create-structure', 'add-participants', 'check-filters'],
        },
        grouping: {
            path: 'create-grouping',
            steps: ['create-grouping', 'add-group-to-grouping', 'verify-grouping'],
        },
        actions: {
            path: 'try-actions',
            steps: ['try-drag', 'try-selection', 'try-context'],
        },
    };
    const easyeduPath = easyeduPaths[path];
    const easyeduStep = easyeduPath && easyeduPath.steps[step];
    if (easyeduPath && easyeduStep) {
        root.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
            bubbles: true,
            detail: {
                path: easyeduPath.path,
                step: easyeduStep,
            },
        }));
    }
};

const getFixedHeaderOffset = () => {
    const candidates = Array.from(document.body.querySelectorAll('body > *, .navbar, header, [role="navigation"]'));
    return candidates.reduce((offset, node) => {
        if (!node || node.classList.contains('local-groupimport-easystud-tutorial-highlight-overlay')) {
            return offset;
        }
        const style = window.getComputedStyle(node);
        if (style.position !== 'fixed' && style.position !== 'sticky') {
            return offset;
        }
        const rect = node.getBoundingClientRect();
        if (rect.top > 8 || rect.bottom <= 0 || rect.height > 180) {
            return offset;
        }
        return Math.max(offset, rect.bottom);
    }, 0);
};

// Keep the shared guide launcher consumer-owned while the navigation component
// owns only destinations and its compact panel.
const bindResponsiveGuideLauncher = root => {
    const guideSlot = root.querySelector('[data-easyedu-navigation-guide-slot]');
    const guideSource = root.querySelector('[data-easyedu-navigation-guide-source]');
    const guideNode = guideSource ?
        guideSource.querySelector('[data-easyedu-guide-root], [data-easystud-open-tutorial]') : null;
    const guideLauncher = guideNode ? guideNode.querySelector('[data-easyedu-guide-open]') : null;
    if (!guideNode || !guideSource || !guideSlot || !guideLauncher) {
        return;
    }
    const guideAnchor = document.createComment('easyedu-guide-responsive-anchor');
    guideSource.insertBefore(guideAnchor, guideNode);

    const preserveGuidePortalTheme = () => {
        // The guide is visually scoped below the EasyStud workspace. Portalling
        // it to body must retain the resolved product tokens, otherwise CSS
        // declarations using those variables become invalid (not transparent).
        const styles = window.getComputedStyle(guideNode);
        Array.from(styles).forEach(name => {
            if (!name.startsWith('--easyedu-') && !name.startsWith('--local-groupimport-easystud-')) {
                return;
            }
            const value = styles.getPropertyValue(name).trim();
            if (value !== '') {
                guideNode.style.setProperty(name, value);
            }
        });
        guideNode.setAttribute('data-easyedu-guide-portal-theme', '1');
    };

    const syncGuideLauncher = matches => {
        if (matches) {
            // The overlay surfaces must never live inside the compact drawer:
            // closing that drawer makes its descendants inert and invisible.
            if (guideNode.parentElement !== document.body) {
                preserveGuidePortalTheme();
                document.body.appendChild(guideNode);
            }
            guideLauncher.hidden = true;
            if (!guideSlot.querySelector('[data-easyedu-responsive-guide-launcher]')) {
                const compactLauncher = guideLauncher.cloneNode(true);
                compactLauncher.hidden = false;
                compactLauncher.removeAttribute('id');
                compactLauncher.setAttribute('data-easyedu-responsive-guide-launcher', '1');
                compactLauncher.addEventListener('click', event => {
                    event.preventDefault();
                    guideLauncher.click();
                });
                guideSlot.replaceChildren(compactLauncher);
            }
        } else {
            guideSlot.replaceChildren();
            if (guideAnchor.parentNode && guideNode.parentElement !== guideSource) {
                guideAnchor.parentNode.insertBefore(guideNode, guideAnchor.nextSibling);
            }
            guideLauncher.hidden = false;
        }
    };

    const responsiveMedia = window.matchMedia(responsiveWorkspaceQuery);
    responsiveMedia.addEventListener('change', event => {
        syncGuideLauncher(event.matches);
    });
    syncGuideLauncher(responsiveMedia.matches);
};

const bindCanonicalNavigation = root => {
    const navigationRoot = root.querySelector('[data-easyedu-navigation]');
    if (!navigationRoot || typeof require !== 'function') {
        return;
    }
    require(['local_groupimport/easyedu_navigation'], navigation => {
        if (navigation && typeof navigation.init === 'function') {
            navigation.init(navigationRoot);
        }
    });
};

// Restore Moodle's participant destinations in their own compact-only
// category. The native select remains server-owned in the header; this is a
// presentation copy of its capability-filtered links, matching the former
// EasyStud responsive navigation contract without changing desktop markup.
const bindResponsiveParticipantNavigation = root => {
    const navigationRoot = root.querySelector('[data-easyedu-navigation]');
    const panel = navigationRoot ? navigationRoot.querySelector('[data-easyedu-navigation-panel]') : null;
    const mobileLinks = panel ? panel.querySelector('[data-easyedu-navigation-participant-links]') : null;
    const participantNavigation = root.querySelector('[data-easystud-participant-navigation]');
    if (!panel || !mobileLinks || !participantNavigation || mobileLinks.dataset.easyeduParticipantBound === '1') {
        return;
    }
    mobileLinks.dataset.easyeduParticipantBound = '1';

    const syncParticipantLinks = () => {
        // Moodle's select-menu may replace its dropdown node while its AMD
        // controller finishes populating the capability-filtered options.
        // Always resolve the current node instead of retaining a stale menu.
        const nativeMenu = participantNavigation.querySelector('.dropdown-menu');
        if (!nativeMenu) {
            return;
        }
        const entries = nativeMenu.querySelectorAll('.dropdown-header, .dropdown-item[data-value]');
        if (!entries.length) {
            return;
        }
        mobileLinks.replaceChildren();
        entries.forEach(item => {
            if (item.classList.contains('dropdown-header')) {
                const group = document.createElement('p');
                group.className = 'easyedu-navigation__participant-group';
                group.textContent = item.textContent.trim();
                mobileLinks.appendChild(group);
                return;
            }

            const url = item.getAttribute('data-value');
            if (!url) {
                return;
            }
            const link = document.createElement('a');
            link.className = 'easyedu-navigation__item easyedu-navigation__participant-link';
            link.setAttribute('data-easyedu-navigation-participant-item', '1');
            link.href = url;
            link.textContent = item.textContent.trim();
            // The current EasyStud destination is already exposed by the tools
            // category; avoid exposing a second current-page marker here.
            if (!panel.querySelector('[aria-current="page"]') &&
                    (item.getAttribute('aria-selected') === 'true' || item.classList.contains('active'))) {
                link.setAttribute('aria-current', 'page');
            }
            mobileLinks.appendChild(link);
        });
    };

    syncParticipantLinks();
    const participantNavigationObserver = new MutationObserver(syncParticipantLinks);
    participantNavigationObserver.observe(participantNavigation, {
        attributes: true,
        attributeFilter: ['aria-selected', 'class', 'data-value'],
        childList: true,
        subtree: true,
    });
    // Cover a replacement that occurs in the same task as the initial
    // controller binding, before the observer can observe the new node.
    window.setTimeout(syncParticipantLinks, 0);
    window.setTimeout(syncParticipantLinks, 100);
};

const bindBackToTop = root => {
    const button = root.querySelector('[data-easystud-back-to-top]');
    if (!button) {
        return;
    }
    const media = window.matchMedia(responsiveWorkspaceQuery);
    const contextMenu = root.querySelector('[data-easystud-context-menu]');
    const modalSelector = '[role="dialog"]:not([hidden]):not([data-easyedu-navigation-panel]), .modal.show';
    const floatingSelector = '[data-easystud-mobile-actions]:not([hidden]), ' +
        '[data-easystud-action-busy-status]:not([hidden]), ' +
        '[data-easyedu-guided-panel]:not([hidden]), [data-easystud-guided-panel]:not([hidden])';
    let syncFrame = null;
    const sync = () => {
        const hasVisibleModal = Array.from(document.querySelectorAll(modalSelector)).some(surface => {
            const style = window.getComputedStyle(surface);
            return surface.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        const obscured = !!(
            (contextMenu && !contextMenu.hidden) ||
            hasVisibleModal ||
            root.querySelector('[data-easyedu-navigation-panel].is-open')
        );
        let offset = 14;
        root.querySelectorAll(floatingSelector).forEach(surface => {
            const rect = surface.getBoundingClientRect();
            // Safe-area padding can leave a small gap below a bottom-docked
            // surface. Treat it as occupying the bottom edge so the control
            // is always lifted above action trays and guided checklists.
            if (rect.width && rect.height && rect.bottom > window.innerHeight - 48) {
                offset = Math.max(offset, Math.ceil(window.innerHeight - rect.top + 12));
            }
        });
        const offsetValue = offset + 'px';
        const hidden = !media.matches || window.scrollY < 400 || obscured;
        if (button.style.getPropertyValue('--easyedu-back-to-top-bottom') !== offsetValue) {
            button.style.setProperty('--easyedu-back-to-top-bottom', offsetValue);
        }
        if (button.classList.contains('is-obscured') !== obscured) {
            button.classList.toggle('is-obscured', obscured);
        }
        if (button.hidden !== hidden) {
            button.hidden = hidden;
        }
    };
    const scheduleSync = () => {
        if (syncFrame !== null) {
            return;
        }
        syncFrame = window.requestAnimationFrame(() => {
            syncFrame = null;
            sync();
        });
    };
    button.addEventListener('click', () => {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({top: 0, behavior: reduced ? 'auto' : 'smooth'});
    });
    window.addEventListener('scroll', scheduleSync, {passive: true});
    window.addEventListener('resize', scheduleSync);
    media.addEventListener('change', scheduleSync);

    const stateObserver = new MutationObserver(scheduleSync);
    const observeFloatingSurface = surface => stateObserver.observe(surface, {
        attributes: true,
        attributeFilter: ['class', 'hidden'],
    });
    if (contextMenu) {
        observeFloatingSurface(contextMenu);
    }
    root.querySelectorAll(floatingSelector).forEach(observeFloatingSurface);

    // Ajax updates may replace a floating surface. Watch additions only; observing every
    // class/hidden mutation in the manager would make this callback observe its own button.
    new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
            if (!node || node.nodeType !== 1) {
                return;
            }
            if (node.matches && node.matches(floatingSelector)) {
                observeFloatingSurface(node);
            }
            if (node.querySelectorAll) {
                node.querySelectorAll(floatingSelector).forEach(observeFloatingSurface);
            }
        }));
        scheduleSync();
    }).observe(root, {childList: true, subtree: true});
    document.addEventListener('shown.bs.modal', scheduleSync);
    document.addEventListener('hidden.bs.modal', scheduleSync);
    sync();
};

const bindLayoutModeToggle = root => {
    const buttons = Array.from(root.querySelectorAll('[data-easystud-layout-mode]'));
    const participantGroupsPanel = root.querySelector('[data-easystud-participant-groups-panel]');
    const structureGroupsPanel = root.querySelector('[data-easystud-structure-groups]');
    const layout = root.querySelector('.local-groupimport-easystud__layout');
    if (!buttons.length) {
        return;
    }

    const applyModeState = mode => {
        const normalisedmode = mode || 'both';
        root.easystudDesktopMode = normalisedmode;
        clearSelectionState(root);
        root.classList.toggle(participantFocusClass, normalisedmode === 'participants');
        root.classList.toggle(structureFocusClass, normalisedmode === 'structure');

        buttons.forEach(button => {
            const active = button.getAttribute('data-easystud-layout-mode') === normalisedmode;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.classList.toggle('active', active);
            button.classList.toggle('btn-primary', active);
            button.classList.toggle('btn-outline-secondary', !active);
            button.classList.toggle('btn-outline-primary', active);
        });

        if (participantGroupsPanel) {
            participantGroupsPanel.hidden = normalisedmode !== 'participants';
        }
        if (structureGroupsPanel) {
            structureGroupsPanel.hidden = normalisedmode !== 'structure';
        }
        root.querySelectorAll('.local-groupimport-easystud__participant-group-action').forEach(button => {
            button.hidden = normalisedmode !== 'participants';
        });
        root.querySelectorAll('.local-groupimport-easystud__participant-move-action').forEach(button => {
            button.hidden = normalisedmode === 'structure';
        });

        updateRoleFilterMode(root);
        const hasModeDependentCatalogSearch = [
            '[data-easystud-catalog-search="participants"]',
            '[data-easystud-structure-group-search]',
            '[data-easystud-structure-grouping-search]',
        ].some(selector => {
            const control = root.querySelector(selector);
            return !!(control && control.value.trim());
        });
        const groupingFilter = root.querySelector('[data-easystud-grouping-filter]');
        if (hasModeDependentCatalogSearch) {
            syncCatalogFilters(root, {pagination: false, responsive: false});
        }
        if (getSelectedFilterValues(groupingFilter).length) {
            applyFilters(root, {pagination: false, responsive: false});
        }
        syncPagination(root);
        updateSelectionActions(root);
        scheduleResponsiveUiRefresh(root, {pagination: false});
        scheduleCompleteListAlignment(root);
    };

    const applyMode = (mode, animate = true) => {
        if (animate && layout) {
            Motion.swap(layout, () => applyModeState(mode), {
                exit: false,
                enterDuration: Motion.timing.normal,
                resize: false,
                swapOpacity: 0.62,
            }).then(() => requestGuideHighlightRefresh(root));
            return;
        }
        applyModeState(mode);
    };

    buttons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            applyMode(button.getAttribute('data-easystud-layout-mode') || 'both');
        });
    });

    applyMode('both', false);
    root.easystudApplyDesktopMode = applyMode;
};

const getFirstVisibleListEntry = (list, selector) => {
    if (!list) {
        return null;
    }
    return Array.from(list.querySelectorAll(selector)).find(item => !item.hidden && item.offsetParent !== null) || null;
};

const syncCompleteListAlignment = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return;
    }

    tree.style.paddingTop = '';
    if (
        root.classList.contains(participantFocusClass) ||
        root.classList.contains(structureFocusClass) ||
        isResponsiveWorkspace()
    ) {
        return;
    }

    const participantList = root.querySelector('[data-easystud-participant-list]');
    const participantEntry = getFirstVisibleListEntry(
        participantList,
        '[data-easystud-user], [data-easystud-empty-state]'
    );
    const structureEntry = getFirstVisibleListEntry(
        tree,
        '.local-groupimport-easystud-tree__section--ungrouped, ' +
            '.local-groupimport-easystud-tree__section[data-easystud-grouping-id], ' +
            '[data-easystud-empty-state]'
    );
    if (!participantEntry || !structureEntry) {
        return;
    }

    const delta = participantEntry.getBoundingClientRect().top - structureEntry.getBoundingClientRect().top;
    if (Math.abs(delta) < 1) {
        return;
    }

    const currentPadding = parseFloat(window.getComputedStyle(tree).paddingTop) || 0;
    tree.style.paddingTop = Math.max(0, currentPadding + delta) + 'px';
};

const scheduleCompleteListAlignment = root => {
    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => syncCompleteListAlignment(root));
    });
};

// In Complete View the participant filter and the structure list are separate
// grid columns. Follow the live Motion height on every animation frame so the
// right-hand list moves with the same timing as the opening/closing filter,
// rather than jumping only when the transition has completed.
const animateCompleteListAlignment = root => {
    if (root.easystudCompleteAlignmentFrame) {
        window.cancelAnimationFrame(root.easystudCompleteAlignmentFrame);
        root.easystudCompleteAlignmentFrame = null;
    }

    const tick = () => {
        syncCompleteListAlignment(root);
        const animating = root.querySelector(
            '.local-groupimport-easystud-advanced-filters.is-easyedu-disclosing'
        );
        if (animating) {
            root.easystudCompleteAlignmentFrame = window.requestAnimationFrame(tick);
            return;
        }
        root.easystudCompleteAlignmentFrame = null;
        syncCompleteListAlignment(root);
    };

    root.easystudCompleteAlignmentFrame = window.requestAnimationFrame(tick);
};

// Keep compact entity navigation independent from the three desktop workspaces.
const bindMobileEntityViews = root => {
    const media = window.matchMedia ? window.matchMedia(responsiveWorkspaceQuery) : null;
    const switcher = root.querySelector('[data-easystud-mobile-view-switcher]');
    const buttons = Array.from(root.querySelectorAll('[data-easystud-mobile-view]'));
    const participantPanel = root.querySelector('[data-easystud-participants-panel]');
    const structurePanel = root.querySelector('[data-easystud-structure-panel]');
    const structureTitle = structurePanel ? structurePanel.querySelector('.local-groupimport-easystud__panel-title') : null;
    const structureTitleDefault = structureTitle ? structureTitle.textContent : '';
    const structureGroups = root.querySelector('[data-easystud-structure-groups]');
    const layout = root.querySelector('.local-groupimport-easystud__layout');
    if (!media || !switcher || !buttons.length || !participantPanel || !structurePanel) {
        return;
    }

    let mobileView = 'participants';
    const closeResponsiveGuide = () => {
        root.querySelectorAll('[data-easystud-tutorial-modal], [data-easyedu-guide-modal]').forEach(modal => {
            modal.hidden = true;
        });
        root.querySelectorAll('[data-easystud-guided-panel], [data-easyedu-guided-panel], ' +
            '[data-easystud-tutorial-return], [data-easyedu-guide-return]').forEach(panel => {
            panel.hidden = true;
        });
    };

    const applyMobileState = view => {
        mobileView = ['participants', 'groups', 'groupings'].indexOf(view) === -1 ? 'participants' : view;
        root.setAttribute('data-easystud-mobile-view-active', mobileView);
        // Desktop focus classes hide whole regions and must not leak into the
        // three independent responsive workspaces.
        root.classList.remove(participantFocusClass, structureFocusClass);
        clearSelectionState(root);
        updateSelectionActions(root);

        buttons.forEach(button => {
            const active = button.getAttribute('data-easystud-mobile-view') === mobileView;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.classList.toggle('is-active', active);
        });
        participantPanel.hidden = mobileView !== 'participants';
        structurePanel.hidden = mobileView === 'participants';
        if (structureGroups) {
            structureGroups.hidden = mobileView !== 'groups';
        }
        if (structureTitle && mobileView !== 'participants') {
            const activeButton = buttons.find(button => button.getAttribute('data-easystud-mobile-view') === mobileView);
            const label = activeButton ? activeButton.querySelector('span:last-child') : null;
            structureTitle.textContent = label ? label.textContent : structureTitleDefault;
        }
        closeResponsiveGuide();
        syncPagination(root);
        scheduleResponsiveUiRefresh(root, {pagination: false, guide: false});
    };

    const applyMobileView = (view, animate = true) => {
        if (!media.matches) {
            return;
        }
        if (animate && layout) {
            Motion.swap(layout, () => applyMobileState(view), {
                exit: false,
                enterDuration: Motion.timing.normal,
                resize: false,
                swapOpacity: 0.72,
            });
            return;
        }
        applyMobileState(view);
    };

    const syncViewportMode = () => {
        root.classList.toggle('local-groupimport-easystud--responsive-workspace', media.matches);
        if (media.matches) {
            applyMobileView(mobileView, false);
            return;
        }
        root.removeAttribute('data-easystud-mobile-view-active');
        if (structureTitle) {
            structureTitle.textContent = structureTitleDefault;
        }
        participantPanel.hidden = false;
        structurePanel.hidden = false;
        if (root.easystudApplyDesktopMode) {
            root.easystudApplyDesktopMode(root.easystudDesktopMode || 'both', false);
        }
    };

    buttons.forEach(button => button.addEventListener('click', () => {
        applyMobileView(button.getAttribute('data-easystud-mobile-view') || 'participants');
    }));
    if (media.addEventListener) {
        media.addEventListener('change', syncViewportMode);
    } else {
        media.addListener(syncViewportMode);
    }
    syncViewportMode();
};

const ensurePanelActionOverflowControls = (root, actions) => {
    let toggle = actions.querySelector(':scope > [data-easystud-panel-actions-toggle]');
    let menu = actions.querySelector(':scope > [data-easystud-panel-actions-menu]');

    if (!toggle) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-outline-secondary btn-sm local-groupimport-easystud__panel-actions-more';
        toggle.setAttribute('data-easystud-panel-actions-toggle', '1');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.setAttribute('aria-label', getLabels(root).moreactions || '');
        toggle.innerHTML = '<span class="local-groupimport-easystud-action-grip" aria-hidden="true"></span>';
        actions.appendChild(toggle);
    }
    if (!menu) {
        menu = document.createElement('div');
        menu.className = 'local-groupimport-easystud__panel-actions-menu';
        menu.setAttribute('data-easystud-panel-actions-menu', '1');
        menu.hidden = true;
        actions.appendChild(menu);
    }

    return {toggle, menu};
};

const getPanelActionButtons = actions => {
    return Array.from(actions.querySelectorAll(':scope > button')).filter(button => {
        return !button.matches('[data-easystud-panel-actions-toggle]');
    });
};

const cloneOverflowAction = (source, menu, toggle) => {
    const clone = source.cloneNode(true);
    clone.classList.remove(panelActionOverflowClass);
    clone.removeAttribute('id');
    clone.addEventListener('click', event => {
        event.preventDefault();
        menu.hidden = true;
        toggle.setAttribute('aria-expanded', 'false');
        source.click();
    });
    menu.appendChild(clone);
};

const syncPanelActionOverflow = root => {
    root.querySelectorAll('.local-groupimport-easystud__panel-actions').forEach(actions => {
        const {toggle, menu} = ensurePanelActionOverflowControls(root, actions);
        const buttons = getPanelActionButtons(actions);
        const wasExpanded = toggle.getAttribute('aria-expanded') === 'true' && !menu.hidden;

        buttons.forEach(button => button.classList.remove(panelActionOverflowClass));
        toggle.hidden = true;
        menu.hidden = true;
        menu.innerHTML = '';

        if (!actions.offsetParent || !buttons.length) {
            return;
        }

        if (actions.scrollWidth <= actions.clientWidth + 1) {
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        toggle.hidden = false;
        for (let index = buttons.length - 1; index >= 0 && actions.scrollWidth > actions.clientWidth + 1; index--) {
            buttons[index].classList.add(panelActionOverflowClass);
        }

        const hiddenButtons = buttons.filter(button => button.classList.contains(panelActionOverflowClass) && !button.hidden);
        hiddenButtons.forEach(button => cloneOverflowAction(button, menu, toggle));
        if (!hiddenButtons.length) {
            toggle.hidden = true;
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        menu.hidden = !wasExpanded;
        toggle.setAttribute('aria-expanded', wasExpanded ? 'true' : 'false');
    });
};

const schedulePanelActionOverflow = root => {
    window.requestAnimationFrame(() => syncPanelActionOverflow(root));
};

const scheduleResponsiveUiRefresh = (root, options = {}) => {
    if (!root) {
        return;
    }
    if (root.easystudResponsiveRefreshFrame) {
        window.cancelAnimationFrame(root.easystudResponsiveRefreshFrame);
    }

    const refresh = () => {
        syncResponsiveDragAvailability(root);
        if (options.pagination !== false) {
            syncPagination(root);
        }
        syncAllGroupMembersCollapsible(root);
        syncAllGroupingGroupsCollapsible(root);
        scheduleGroupGroupingOverflow(root);
        scheduleParticipantTagOverflow(root);
        schedulePanelActionOverflow(root);
        if (options.guide !== false) {
            requestGuideHighlightRefresh(root);
        }
    };

    root.easystudResponsiveRefreshFrame = window.requestAnimationFrame(() => {
        root.easystudResponsiveRefreshFrame = null;
        refresh();
    });
};

const bindPanelActionOverflow = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-panel-actions-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();
        const actions = toggle.closest('.local-groupimport-easystud__panel-actions');
        const menu = actions ? actions.querySelector('[data-easystud-panel-actions-menu]') : null;
        if (!menu) {
            return;
        }
        const open = menu.hidden;
        root.querySelectorAll('[data-easystud-panel-actions-menu]').forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.hidden = true;
                const otherToggle = otherMenu.parentElement ?
                    otherMenu.parentElement.querySelector('[data-easystud-panel-actions-toggle]') : null;
                if (otherToggle) {
                    otherToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (root.contains(event.target) && event.target.closest('[data-easystud-panel-actions-toggle], [data-easystud-panel-actions-menu]')) {
            return;
        }
        root.querySelectorAll('[data-easystud-panel-actions-menu]').forEach(menu => {
            menu.hidden = true;
        });
        root.querySelectorAll('[data-easystud-panel-actions-toggle]').forEach(toggle => {
            toggle.setAttribute('aria-expanded', 'false');
        });
    });

    schedulePanelActionOverflow(root);
};

let pendingActionCount = 0;

const setActionBusyState = busy => {
    document.querySelectorAll('.local-groupimport-easystud').forEach(container => {
        const labels = JSON.parse(container.getAttribute('data-easystud-detail-labels') || '{}');
        const label = labels.actioninprogress || '';
        const status = container.querySelector('[data-easystud-action-busy-status]');
        container.setAttribute('data-easystud-action-busy-label', label);
        container.classList.toggle('is-action-busy', busy);
        container.setAttribute('aria-busy', busy ? 'true' : 'false');
        if (status) {
            const text = status.querySelector('[data-easystud-action-busy-text]');
            if (text) {
                text.textContent = label;
            }
            status.hidden = !busy;
        }
    });
};

const trackActionRequest = promise => {
    pendingActionCount += 1;
    setActionBusyState(true);
    return promise.finally(() => {
        pendingActionCount = Math.max(0, pendingActionCount - 1);
        setActionBusyState(pendingActionCount > 0);
    });
};

// Post an EasyStud action.
const postAction = data => {
    const root = document.getElementById('local-groupimport-easystud');
    const labels = root ? JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}') : {};
    const body = new URLSearchParams();
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (Array.isArray(value)) {
            value.forEach(item => body.append(key + '[]', item));
            return;
        }
        body.set(key, value);
    });
    body.set('sesskey', M.cfg.sesskey);

    return trackActionRequest(fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: body.toString(),
    }).then(response => response.json()).then(result => {
        if (!result.success) {
            throw new Error(result.error || labels.ajaxerror || '');
        }
        return result;
    }));
};

// Move an existing group element into a grouping section.
const moveGroupElementToGrouping = (root, groupid, groupingid) => {
    const groups = getTreeGroupElementsById(root, groupid);
    const group = groups[0] || null;
    const target = root.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
    const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
    if (!group || !children) {
        return;
    }
    const sourceSections = groups.map(entry => entry.closest('[data-easystud-grouping-drop]')).filter(Boolean);
    children.hidden = false;
    groups.slice(1).forEach(entry => entry.remove());
    if (group.parentElement !== children) {
        group.remove();
        insertGroupElementSorted(children, group);
    }
    ensureGroupUnlinkButton(root, group, groupingid);
    if (groupingid !== '0') {
        expandGroupingSection(target);
    }
    sourceSections.concat([target]).forEach(section => {
        const badge = section ? section.querySelector('.local-groupimport-easystud-tree__toggle .badge') : null;
        const groupcount = section ? section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length : 0;
        if (badge) {
            const template = badge.getAttribute('data-count-template') || '__count__';
            badge.textContent = template.replace('__count__', groupcount);
        }
    });
    syncUngroupedState(root, getLabels(root));
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => syncGroupingChildrenState(section, getLabels(root)));
    applyContainerGroupSearch(root);
    updateCatalogGroupingTags(root, groupid);
    syncCatalogFilters(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

const copyGroupElementToGrouping = (root, sourceGroup, groupingid) => {
    const groupid = sourceGroup ? sourceGroup.getAttribute('data-easystud-group-id') : '';
    const target = root.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
    const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
    if (!groupid || !sourceGroup || !children) {
        return;
    }
    if (children.querySelector(':scope > [data-easystud-group-id="' + groupid + '"]')) {
        return;
    }

    const copy = sourceGroup.cloneNode(true);
    copy.classList.remove(selectedClass, draggingClass, dropTargetClass, 'local-groupimport-easystud-group--catalog');
    copy.querySelectorAll('.' + selectedClass).forEach(item => item.classList.remove(selectedClass));
    copy.querySelectorAll('[data-easystud-selector-input]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });
    children.hidden = false;
    insertGroupElementSorted(children, copy);
    ensureGroupUnlinkButton(root, copy, groupingid);
    ensureNestedGroupActionMenus(root);
    expandGroupingSection(target);
    updateGroupingBadge(target);
    syncGroupingChildrenState(target, getLabels(root));
    applyContainerGroupSearch(root);
    updateCatalogGroupingTags(root, groupid);
    syncCatalogFilters(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

const removeGroupsFromGroupings = (root, courseId, groups) => {
    const labels = getLabels(root);
    const groupsToRemove = getGroupsWithGroupingMembership(root, groups);
    if (!groupsToRemove.length) {
        return Promise.resolve(null);
    }

    return Promise.all(groupsToRemove.map(group => {
        const groupid = group.getAttribute('data-easystud-group-id');
        return postAction({
            courseid: courseId,
            action: 'movegroup',
            groupid,
            groupingid: 0,
        }).then(response => {
            moveGroupElementToGrouping(root, groupid, 0);
            return response;
        });
    })).then(() => {
        clearSelectionState(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
        showNotification(root, formatCountMessage(labels.groupsremovedfromgroupingscount, groupsToRemove.length), 'success');
        return groupsToRemove;
    });
};

const postFormAction = formData => {
    const root = document.getElementById('local-groupimport-easystud');
    const labels = root ? JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}') : {};
    formData.set('sesskey', M.cfg.sesskey);

    return trackActionRequest(fetch(M.cfg.wwwroot + '/local/groupimport/ajax.php', {
        method: 'POST',
        credentials: 'same-origin',
        body: formData,
    }).then(response => response.json()).then(result => {
        if (!result.success) {
            throw new Error(result.error || labels.ajaxerror || '');
        }
        return result;
    }));
};

const ensureGroupUnlinkButton = (root, group, groupingid) => {
    if (!group || !groupingid || groupingid === '0') {
        return;
    }
    const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
    const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
    if (!header || !rename || header.querySelector('[data-easystud-remove-from-grouping]')) {
        return;
    }
    const labels = getLabels(root);
    const label = labels.removefromgroupinglabel || labels.removegroupfromgrouping || '';
    const button = createIconActionButton(
        'local-groupimport-easystud-group__unlink-button',
        'data-easystud-remove-from-grouping',
        group.getAttribute('data-easystud-group-id') || '',
        label,
        'fa-unlink'
    );
    header.insertBefore(button, rename.nextSibling);
};

const deleteGroupElement = (root, groupid) => {
    const groups = getGroupElementsById(root, groupid);
    const sections = new Set(groups.map(group => group.closest('[data-easystud-grouping-drop]')).filter(Boolean));

    const syncAfterRemoval = () => {
        sections.forEach(section => {
            updateGroupingBadge(section);
            syncGroupingChildrenState(section, getLabels(root));
            syncGroupingGroupsCollapsible(section);
        });

        syncStructurePlaceholders(root);
        applyContainerGroupSearch(root);
        updateCatalogGroupingTags(root, groupid);
        syncCatalogFilters(root);
        updateStructureSummary(root);
        updateStructureEmptyState(root);
        syncPagination(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
    };

    if (!groups.length) {
        syncAfterRemoval();
        return;
    }

    let pending = groups.length;
    groups.forEach(group => {
        animateElementRemoval(group, () => {
            group.remove();
            pending--;
            if (pending === 0) {
                syncAfterRemoval();
            }
        });
    });
};

const deleteGroupingElement = (root, groupingid) => {
    const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
    const removeGrouping = () => {
        const ungroupedchildren = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__children');
        if (ungroupedchildren) {
            grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').forEach(group => {
                ungroupedchildren.appendChild(group);
                updateCatalogGroupingTags(root, group.getAttribute('data-easystud-group-id'));
            });
        }
        grouping.remove();
        syncStructurePlaceholders(root);
        applyContainerGroupSearch(root);
        updateSelectionActions(root);
        rehydrateParticipantMembershipDetails(root);
        requestGuideHighlightRefresh(root);
    };
    if (grouping) {
        animateElementRemoval(grouping, removeGrouping);
        return;
    }
    syncStructurePlaceholders(root);
    applyContainerGroupSearch(root);
    updateSelectionActions(root);
    rehydrateParticipantMembershipDetails(root);
};

const removeMembers = (root, courseId, members) => {
    const validmembers = (members || []).filter(Boolean);
    if (!validmembers.length) {
        return Promise.resolve(null);
    }

    const groupids = [];
    const userids = [];
    validmembers.forEach(member => {
        const group = member.closest('[data-easystud-group-id]');
        const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
        const userid = member.getAttribute('data-easystud-member-id');
        if (groupid && userid) {
            groupids.push(groupid);
            userids.push(userid);
        }
    });

    const payload = {
        courseid: courseId,
        action: validmembers.length > 1 ? 'removemembers' : 'removeuser',
    };

    if (validmembers.length > 1) {
        payload.groupids = groupids;
        payload.userids = userids;
    } else {
        payload.groupid = groupids[0];
        payload.userid = userids[0];
    }

    return postAction(payload).then(response => {
        validmembers.forEach(member => {
            const group = member.closest('[data-easystud-group-id]');
            const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
            const userid = member.getAttribute('data-easystud-member-id');
            const user = root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]');
            if (user) {
                const current = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                user.setAttribute('data-group-ids', current.filter(id => id !== groupid).join(','));
            }
            getGroupElementsById(root, groupid).forEach(groupcopy => {
                const copyMember = groupcopy.querySelector('[data-member-key="' + groupid + '-' + userid + '"], [data-member-key="' + groupid + ':' + userid + '"]');
                if (copyMember) {
                    copyMember.remove();
                }
                syncGroupMembersState(groupcopy, getLabels(root));
            });
        });
        rehydrateParticipantMembershipDetails(root);
        applyFilters(root);
        updateSelectionActions(root);
        return response;
    });
};

// Create a member row in a group.
const createMemberItem = (groupid, userid, fullname, removelabel, selectionlabel) => {
    const item = document.createElement('li');
    item.className = 'local-groupimport-easystud-member';
    item.setAttribute('data-easystud-member-id', userid);
    item.setAttribute('data-member-key', groupid + '-' + userid);
    item.setAttribute('data-selectable-type', 'member');
    item.setAttribute('data-selectable-id', groupid + '-' + userid);
    item.setAttribute('data-search-text', normalise(fullname || ''));

    const selector = document.createElement('label');
    selector.className = 'local-groupimport-easystud-selector local-groupimport-easystud-selector--member';
    selector.setAttribute('aria-label', selectionlabel || '');

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.setAttribute('data-easystud-selector-input', '1');
    checkbox.tabIndex = -1;
    selector.appendChild(checkbox);

    const ui = document.createElement('span');
    ui.className = 'local-groupimport-easystud-selector__ui';
    ui.setAttribute('aria-hidden', 'true');
    selector.appendChild(ui);

    item.appendChild(selector);

    const name = document.createElement('span');
    name.className = 'local-groupimport-easystud-member__name';
    name.textContent = fullname;
    item.appendChild(name);

    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'btn btn-link p-0 local-groupimport-easystud-member__remove';
    remove.setAttribute('data-easystud-remove-member', '1');
    remove.setAttribute('data-group-id', groupid);
    remove.setAttribute('data-user-id', userid);
    remove.setAttribute('aria-label', removelabel || fullname);
    remove.setAttribute('data-easystud-hover-help', removelabel || fullname);
    remove.innerHTML = '<span aria-hidden="true">&minus;</span>';
    item.appendChild(remove);

    return item;
};

const normaliseMemberRemoveLabels = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-member-id]').forEach(member => {
        const button = member.querySelector('[data-easystud-remove-member]');
        const name = member.querySelector('.local-groupimport-easystud-member__name');
        if (!button || !name) {
            return;
        }

        const current = button.getAttribute('aria-label') || '';
        if (current && current.indexOf('{}') === -1 && current.indexOf('{name}') === -1) {
            return;
        }

        const label = (labels.removeuser || '').replace('{name}', name.textContent.trim());
        button.setAttribute('aria-label', label);
        button.setAttribute('title', label);
        button.setAttribute('data-easystud-hover-help', label);
    });
};

const updateGroupingBadge = section => {
    if (!section) {
        return;
    }
    const badge = section.querySelector('.local-groupimport-easystud-tree__toggle .badge');
    if (!badge) {
        return;
    }
    const count = section.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    const template = badge.getAttribute('data-count-template') || '__count__';
    badge.textContent = template.replace('__count__', count);
    section.setAttribute('data-easystud-advanced-count', badge.textContent);
    setCountBadgeState(badge, count, 'grouping');
};

const setCountBadgeState = (badge, count, type) => {
    if (!badge) {
        return;
    }
    badge.classList.toggle('local-groupimport-easystud-count-badge', true);
    badge.classList.toggle('local-groupimport-easystud-count-badge--empty', count === 0);
    badge.classList.toggle('local-groupimport-easystud-count-badge--filled', count > 0);
    badge.classList.toggle('local-groupimport-easystud-count-badge--members', type === 'members');
    badge.classList.toggle('local-groupimport-easystud-count-badge--grouping', type === 'grouping');
};

const syncGroupMembersState = (group, labels) => {
    const list = group ? group.querySelector('[data-easystud-group-members]') : null;
    const badge = group ? group.querySelector('.local-groupimport-easystud-group__header .badge') : null;
    if (!list || !badge) {
        return;
    }

    const members = list.querySelectorAll('[data-easystud-member-id]');
    list.querySelectorAll(':scope > .text-muted, :scope > .local-groupimport-easystud-tree__empty').forEach(item => item.remove());
    if (!members.length) {
        const empty = document.createElement('li');
        empty.className = 'local-groupimport-easystud-tree__empty';
        empty.textContent = labels.nogroupmembers || '';
        list.appendChild(empty);
    }

    const template = labels.memberscounttemplate || '';
    badge.textContent = template.replace('__count__', members.length);
    group.setAttribute('data-easystud-advanced-count', badge.textContent);
    setCountBadgeState(badge, members.length, 'members');
    syncGroupMembersCollapsible(group);
    scheduleGroupingResizeForGroup(group);
};

const syncAllCountBadges = root => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        const badge = group.querySelector('.local-groupimport-easystud-group__header .badge');
        const count = group.querySelectorAll('[data-easystud-group-members] [data-easystud-member-id]').length;
        setCountBadgeState(badge, count, 'members');
    });
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(updateGroupingBadge);
};

const appendUsersToGroupCopies = (root, groupid, users, labels) => {
    getGroupElementsById(root, groupid).forEach(group => {
        const list = group.querySelector('[data-easystud-group-members]');
        if (!list) {
            return;
        }
        list.querySelectorAll('.text-muted, .local-groupimport-easystud-tree__empty').forEach(empty => empty.remove());
        users.forEach(user => {
            const userid = user.getAttribute ? user.getAttribute('data-user-id') : String(user.id);
            const fullname = user.querySelector ? (
                user.querySelector('strong') ? user.querySelector('strong').textContent : ''
            ) : user.fullname;
            if (!userid || list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                return;
            }
            const removelabel = (labels.removeuser || '').replace('{name}', fullname);
            list.appendChild(createMemberItem(groupid, userid, fullname, removelabel, labels.selectionmode || ''));
        });
        syncGroupMembersState(group, labels);
    });
    rehydrateParticipantMembershipDetails(root);
    applyGroupMemberSearch(root);
};

const updateStructureSummary = root => {
    const labels = getLabels(root);
    const badge = root.querySelector('.local-groupimport-easystud__panel--structure .local-groupimport-easystud__panel-badge--accent');
    if (!badge) {
        return;
    }

    const groupings = root.querySelectorAll('[data-easystud-grouping-id]').length;
    const groups = root.querySelectorAll('[data-easystud-group-id]').length;
    const template = labels.groupstructuresummarytemplate || '';
    badge.textContent = template
        .replace('__groupings__', groupings)
        .replace('__groups__', groups);
};

const updateStructureEmptyState = root => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return;
    }

    const state = tree.querySelector('.local-groupimport-easystud__empty-state--structure');
    if (!state) {
        return;
    }

    const hasgroups = root.querySelectorAll('[data-easystud-group-id]').length > 0;
    const hasgroupings = root.querySelectorAll('[data-easystud-grouping-id]').length > 0;
    state.hidden = hasgroups || hasgroupings;
};

const syncStructurePlaceholders = root => {
    const labels = getLabels(root);
    syncUngroupedState(root, labels);
    root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => {
        syncGroupingChildrenState(section, labels);
    });
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    syncFilteredEmptyStates(root);
    syncPagination(root);
};

const createGroupElement = (root, groupdata) => {
    const labels = getLabels(root);
    const group = document.createElement('div');
    group.className = 'local-groupimport-easystud-group';
    group.setAttribute('data-easystud-group-id', groupdata.id);
    group.setAttribute('data-easystud-user-drop', groupdata.id);
    group.setAttribute('data-selectable-type', 'group');
    group.setAttribute('data-selectable-id', groupdata.id);
    group.setAttribute('data-grouping-ids', groupdata.groupingidscsv || '');
    group.setAttribute('data-has-no-grouping', groupdata.groupingidscsv ? '0' : '1');
    group.setAttribute('data-search-text', normalise(groupdata.searchtext || groupdata.name || ''));
    group.setAttribute('draggable', isResponsiveDragSuppressed() ? 'false' : 'true');
    setAdvancedAttributes(group, groupdata, 'group');

    group.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--group" aria-label="' + (labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1" tabindex="-1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-group__header">' +
            '<span class="local-groupimport-easystud-group__name"></span>' +
            '<span class="local-groupimport-easystud-group__groupings local-groupimport-easystud-group__groupings--inline" hidden></span>' +
            '<span class="badge bg-light text-dark"></span>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-group-email="' + groupdata.id + '" aria-label="' + (labels.addemailstogroup || '') + '" data-easystud-hover-help="' + (labels.addemailstogroup || '') + '">' +
                '<span class="fa fa-at" aria-hidden="true"></span>' +
            '</button>' +
            '<form method="post" action="" class="local-groupimport-easystud-rename" data-easystud-rename-form="1">' +
                '<input type="hidden" name="sesskey" value="' + M.cfg.sesskey + '">' +
                '<input type="hidden" name="action" value="renamegroup">' +
                '<input type="hidden" name="groupid" value="' + groupdata.id + '">' +
                '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-rename__toggle" data-easystud-rename-toggle="1" aria-label="' + (labels.rename || '') + '" data-easystud-hover-help="' + (labels.rename || '') + '">' +
                    '<span class="fa fa-pen" aria-hidden="true"></span>' +
                '</button>' +
                '<div class="local-groupimport-easystud-rename__edit" hidden>' +
                    '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + (labels.rename || '') + '">' +
                    '<button type="submit" class="btn btn-sm btn-outline-secondary">' + (labels.save || '') + '</button>' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-rename-cancel="1">' + (labels.cancel || '') + '</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<ul class="local-groupimport-easystud-group__members" data-easystud-group-members="' + groupdata.id + '"></ul>' +
        '<span class="local-groupimport-easystud-group__members-more" data-easystud-group-members-more="1" hidden>...</span>' +
        '<button type="button" class="local-groupimport-easystud-group__members-toggle" data-easystud-group-members-toggle="1" hidden>' +
            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
        '</button>' +
        '<div class="local-groupimport-easystud-group-email" data-easystud-group-email-panel="' + groupdata.id + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + (labels.pasteemailsplaceholder || '') + '" data-easystud-group-email-box="' + groupdata.id + '"></textarea>' +
            '<div class="local-groupimport-easystud-inline-actions">' +
                '<button type="button" class="btn btn-sm btn-primary" data-easystud-add-group-emails="' + groupdata.id + '">' +
                    '<span class="fa fa-plus me-1" aria-hidden="true"></span><span>' + (labels.addemails || '') + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-group-email="1">' + (labels.cancel || '') + '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-group-email-result="' + groupdata.id + '" aria-live="polite"></div>' +
        '</div>';

    const name = group.querySelector('.local-groupimport-easystud-group__name');
    const input = group.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupdata.name || '';
    }
    if (input) {
        input.value = groupdata.rawname || groupdata.name || '';
    }
    const groupingcontainer = group.querySelector('.local-groupimport-easystud-group__groupings--inline');
    const groupingnames = Array.isArray(groupdata.groupingtags) ?
        groupdata.groupingtags.map(tag => tag.label || '').filter(Boolean) : [];
    renderGroupGroupingTags(groupingcontainer, groupingnames);
    if (Array.isArray(groupdata.members) && groupdata.members.length) {
        const list = group.querySelector('[data-easystud-group-members]');
        if (list) {
            groupdata.members.forEach(member => {
                const userid = String(member.userid || member.id || '');
                const fullname = member.fullname || '';
                if (!userid || list.querySelector('[data-easystud-member-id="' + userid + '"]')) {
                    return;
                }
                const removelabel = (labels.removeuser || '').replace('{name}', fullname);
                list.appendChild(createMemberItem(groupdata.id, userid, fullname, removelabel, labels.selectionmode || ''));
            });
        }
    }
    syncGroupMembersState(group, labels);
    ensureGroupMemberSearchControls(root, group);
    return group;
};

const createParticipantCatalogGroupElement = (root, groupdata) => {
    const group = createGroupElement(root, groupdata);
    group.classList.add('local-groupimport-easystud-group--catalog');
    const name = group.querySelector('.local-groupimport-easystud-group__name');
    if (name && !group.querySelector('.local-groupimport-easystud-group__groupings--inline')) {
        const inline = document.createElement('span');
        inline.className = 'local-groupimport-easystud-group__groupings local-groupimport-easystud-group__groupings--inline';
        inline.hidden = true;
        name.insertAdjacentElement('afterend', inline);
    }
    return group;
};

const createGroupingElement = (root, groupingdata) => {
    const labels = getLabels(root);
    const section = document.createElement('div');
    section.className = 'local-groupimport-easystud-tree__section';
    section.setAttribute('data-easystud-grouping-id', groupingdata.id);
    section.setAttribute('data-easystud-grouping-drop', groupingdata.id);
    section.setAttribute('data-selectable-type', 'grouping');
    section.setAttribute('data-selectable-id', groupingdata.id);
    section.setAttribute('data-search-text', normalise(groupingdata.searchtext || groupingdata.name || ''));
    setAdvancedAttributes(section, groupingdata, 'grouping');

    section.innerHTML =
        '<label class="local-groupimport-easystud-selector local-groupimport-easystud-selector--section" aria-label="' + (labels.selectionmode || '') + '">' +
            '<input type="checkbox" data-easystud-selector-input="1" tabindex="-1">' +
            '<span class="local-groupimport-easystud-selector__ui" aria-hidden="true"></span>' +
        '</label>' +
        '<div class="local-groupimport-easystud-grouping__header">' +
            '<button type="button" class="local-groupimport-easystud-tree__toggle" data-easystud-collapse-toggle="1" aria-expanded="false">' +
                '<span class="fa fa-chevron-right" aria-hidden="true"></span>' +
                '<span class="local-groupimport-easystud-grouping__name"></span>' +
                '<span class="badge bg-secondary text-white" data-count-template="' + (labels.groupscounttemplate || '__count__') + '"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__mail-button" data-easystud-toggle-grouping-groups="' + groupingdata.id + '" aria-label="' + (labels.addgroupstogrouping || '') + '" data-easystud-hover-help="' + (labels.addgroupstogrouping || '') + '">' +
                '<span class="fa fa-layer-group" aria-hidden="true"></span>' +
            '</button>' +
            '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-container-search__toggle" data-easystud-container-search-toggle="' + groupingdata.id + '" aria-label="' + (labels.searchgroupslabel || '') + '" data-easystud-hover-help="' + (labels.searchgroupslabel || '') + '">' +
                '<span class="fa fa-search" aria-hidden="true"></span>' +
            '</button>' +
            '<form method="post" action="" class="local-groupimport-easystud-rename" data-easystud-rename-form="1">' +
                '<input type="hidden" name="sesskey" value="' + M.cfg.sesskey + '">' +
                '<input type="hidden" name="action" value="renamegrouping">' +
                '<input type="hidden" name="groupingid" value="' + groupingdata.id + '">' +
                '<button type="button" class="btn btn-link p-0 local-groupimport-easystud-rename__toggle" data-easystud-rename-toggle="1" aria-label="' + (labels.rename || '') + '" data-easystud-hover-help="' + (labels.rename || '') + '">' +
                    '<span class="fa fa-pen" aria-hidden="true"></span>' +
                '</button>' +
                '<div class="local-groupimport-easystud-rename__edit" hidden>' +
                    '<input type="text" name="name" class="form-control form-control-sm" aria-label="' + (labels.rename || '') + '">' +
                    '<button type="submit" class="btn btn-sm btn-outline-secondary">' + (labels.save || '') + '</button>' +
                    '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-rename-cancel="1">' + (labels.cancel || '') + '</button>' +
                '</div>' +
            '</form>' +
        '</div>' +
        '<div class="local-groupimport-easystud-container-search" data-easystud-container-search-panel="' + groupingdata.id + '" hidden>' +
            '<div class="local-groupimport-easystud-container-search__row">' +
                '<label class="local-groupimport-easystud__search-field local-groupimport-easystud-container-search__field" aria-label="' + (labels.searchgroupslabel || '') + '">' +
                    '<span class="fa fa-search" aria-hidden="true"></span>' +
                    '<input type="search" class="form-control" placeholder="' + (labels.searchgroupsplaceholder || '') + '" data-easystud-container-group-search="' + groupingdata.id + '">' +
                '</label>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-container-search-cancel="' + groupingdata.id + '">' + (labels.cancel || '') + '</button>' +
            '</div>' +
        '</div>' +
        '<div class="local-groupimport-easystud-group-email" data-easystud-grouping-groups-panel="' + groupingdata.id + '" hidden>' +
            '<textarea class="form-control form-control-sm" rows="3" placeholder="' + (labels.pastegroupsplaceholder || '') + '" data-easystud-grouping-groups-box="' + groupingdata.id + '"></textarea>' +
            '<div class="local-groupimport-easystud-inline-actions">' +
                '<button type="button" class="btn btn-sm btn-outline-primary" data-easystud-add-grouping-groups="' + groupingdata.id + '">' +
                    '<span class="fa fa-plus me-1" aria-hidden="true"></span><span>' + (labels.addgroups || '') + '</span>' +
                '</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-grouping-groups="1">' + (labels.cancel || '') + '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-group-email__result" data-easystud-grouping-groups-result="' + groupingdata.id + '" aria-live="polite"></div>' +
        '</div>' +
        '<div class="local-groupimport-easystud-tree__children local-groupimport-easystud-grouping__groups" data-easystud-container-group-list="' + groupingdata.id + '" hidden><div class="local-groupimport-easystud-tree__empty">' +
            (labels.nogroupsingrouping || '') + '</div></div>' +
        '<button type="button" class="local-groupimport-easystud-group__members-toggle local-groupimport-easystud-grouping__groups-toggle" data-easystud-grouping-groups-toggle="' + groupingdata.id + '" hidden>' +
            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
        '</button>';

    const name = section.querySelector('.local-groupimport-easystud-grouping__name');
    const input = section.querySelector('input[name="name"]');
    if (name) {
        name.textContent = groupingdata.name || '';
    }
    if (input) {
        input.value = groupingdata.rawname || groupingdata.name || '';
    }
    updateGroupingBadge(section);
    return section;
};

const createIconActionButton = (className, actionAttribute, actionValue, label, icon) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-link p-0 ' + className;
    button.setAttribute(actionAttribute, actionValue);
    button.setAttribute('aria-label', label || '');
    button.setAttribute('data-easystud-hover-help', label || '');
    button.innerHTML = '<span class="fa ' + icon + '" aria-hidden="true"></span>';
    return button;
};

const ensureDuplicateButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => {
        const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-duplicate-group]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__duplicate-button',
            'data-easystud-duplicate-group',
            group.getAttribute('data-easystud-group-id') || '',
            labels.duplicate || '',
            'fa-copy'
        );
        header.insertBefore(button, rename);
    });

    root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
        const header = grouping.querySelector(':scope > .local-groupimport-easystud-grouping__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-duplicate-grouping]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__duplicate-button local-groupimport-easystud-grouping__duplicate-button',
            'data-easystud-duplicate-grouping',
            grouping.getAttribute('data-easystud-grouping-id') || '',
            labels.duplicate || '',
            'fa-copy'
        );
        header.insertBefore(button, rename);
    });
};

const ensureAdvancedSettingsButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-id][data-easystud-advanced-type="group"]').forEach(group => {
        const header = group.querySelector(':scope > .local-groupimport-easystud-group__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-open-advanced-settings]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__settings-button',
            'data-easystud-open-advanced-settings',
            group.getAttribute('data-easystud-group-id') || '',
            labels.advancedsettings || '',
            'fa-cog'
        );
        button.setAttribute('data-easystud-advanced-target', 'group');
        header.insertBefore(button, rename);
    });

    root.querySelectorAll('[data-easystud-grouping-id][data-easystud-advanced-type="grouping"]').forEach(grouping => {
        const header = grouping.querySelector(':scope > .local-groupimport-easystud-grouping__header');
        const rename = header ? header.querySelector(':scope > .local-groupimport-easystud-rename') : null;
        if (!header || !rename || header.querySelector('[data-easystud-open-advanced-settings]')) {
            return;
        }
        const button = createIconActionButton(
            'local-groupimport-easystud-group__settings-button local-groupimport-easystud-grouping__settings-button',
            'data-easystud-open-advanced-settings',
            grouping.getAttribute('data-easystud-grouping-id') || '',
            labels.advancedsettings || '',
            'fa-cog'
        );
        button.setAttribute('data-easystud-advanced-target', 'grouping');
        header.insertBefore(button, rename);
    });
};

const clearAdvancedFileDragState = root => {
    root.querySelectorAll('.local-groupimport-easystud-settings-modal__filepicker.is-drag-over')
        .forEach(item => item.classList.remove('is-drag-over'));
    root.querySelectorAll('.local-groupimport-easystud-settings-modal__dialog.is-file-drag-over')
        .forEach(item => item.classList.remove('is-file-drag-over'));
};

const getAdvancedFileDropTarget = event => {
    const modal = event.target.closest('[data-easystud-advanced-settings-modal]');
    const input = modal ? modal.querySelector('[data-easystud-advanced-file-input]') : null;
    const filepicker = input ? input.closest('.local-groupimport-easystud-settings-modal__filepicker') : null;
    const dialog = modal ? modal.querySelector('.local-groupimport-easystud-settings-modal__dialog') : null;
    if (!modal || !input || !filepicker || !dialog) {
        return null;
    }
    return {modal, input, filepicker, dialog};
};

const bindAdvancedSettings = root => {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-open-advanced-settings]');
        if (!button || !root.contains(button)) {
            return;
        }
        const targetType = button.getAttribute('data-easystud-advanced-target') || 'group';
        const item = button.closest(targetType === 'grouping' ?
            '[data-easystud-grouping-id]' :
            '[data-easystud-group-id]');
        if (!item) {
            return;
        }
        event.preventDefault();
        openAdvancedSettingsModal(root, item);
    });

    root.addEventListener('click', event => {
        const exportButton = event.target.closest('[data-easystud-settings-export]');
        if (!exportButton || !root.contains(exportButton)) {
            return;
        }
        event.preventDefault();
        const section = exportButton.closest('[data-easystud-settings-list-section]');
        if (section) {
            exportAdvancedListSection(section);
        }
    });

    root.addEventListener('submit', event => {
        const form = event.target.closest('[data-easystud-advanced-settings-form]');
        if (!form || !root.contains(form)) {
            return;
        }
        event.preventDefault();
        const submit = form.querySelector('[type="submit"]');
        if (submit) {
            submit.disabled = true;
        }
        postFormAction(new FormData(form)).then(response => {
            if (response.group) {
                applyAdvancedGroupUpdate(root, response.group);
            }
            if (response.grouping) {
                applyAdvancedGroupingUpdate(root, response.grouping);
            }
            const modal = form.closest('[data-easystud-advanced-settings-modal]');
            if (modal) {
                modal.remove();
            }
            showNotification(root, response.message || '', 'success');
        }).catch(error => {
            showNotification(root, error.message || '', 'error');
        }).finally(() => {
            if (submit) {
                submit.disabled = false;
            }
        });
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-easystud-advanced-file-input]');
        if (!input || !root.contains(input)) {
            return;
        }
        updateAdvancedFilePickerName(root, input);
    });

    root.addEventListener('dragover', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            clearAdvancedFileDragState(root);
            return;
        }
        event.preventDefault();
        target.filepicker.classList.add('is-drag-over');
        target.dialog.classList.add('is-file-drag-over');
    });

    root.addEventListener('dragenter', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            return;
        }
        target.filepicker.classList.add('is-drag-over');
        target.dialog.classList.add('is-file-drag-over');
    });

    root.addEventListener('dragleave', event => {
        const target = getAdvancedFileDropTarget(event);
        if (target && !target.modal.contains(event.relatedTarget)) {
            target.filepicker.classList.remove('is-drag-over');
            target.dialog.classList.remove('is-file-drag-over');
        }
    });

    root.addEventListener('drop', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            return;
        }
        event.preventDefault();
        target.filepicker.classList.remove('is-drag-over');
        target.dialog.classList.remove('is-file-drag-over');
        const input = target.input;
        const files = event.dataTransfer ? event.dataTransfer.files : null;
        if (!input || !files || !files.length) {
            return;
        }
        const imagefile = Array.from(files).find(file => file.type && file.type.indexOf('image/') === 0);
        if (!imagefile) {
            return;
        }
        try {
            if (window.DataTransfer) {
                const transfer = new DataTransfer();
                transfer.items.add(imagefile);
                input.files = transfer.files;
            } else {
                input.files = files;
            }
        } catch (error) {
            return;
        }
        updateAdvancedFilePickerName(root, input);
    });
};

const updateAdvancedFilePickerName = (root, input) => {
    const filepicker = input.closest('.local-groupimport-easystud-settings-modal__filepicker');
    const name = filepicker ? filepicker.querySelector('[data-easystud-advanced-file-name]') : null;
    if (!name) {
        return;
    }
    const labels = getLabels(root);
    name.textContent = input.files && input.files.length ?
        input.files[0].name :
        (labels.advancedsettingsnofile || '');
};

const downloadTextFile = (filename, content, mimetype = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], {type: mimetype});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 250);
};

const getCsvValue = value => '"' + (value || '').toString().replace(/"/g, '""') + '"';

const exportAdvancedListSection = section => {
    const filename = section.getAttribute('data-easystud-settings-export-name') || 'easystud-export.csv';
    const headers = Array.from(section.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
    const rows = Array.from(section.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    });
    const csv = '\ufeff' + [headers].concat(rows).map(row => row.map(getCsvValue).join(';')).join('\r\n');
    downloadTextFile(filename, csv);
};

const escapeHtml = value => {
    const element = document.createElement('span');
    element.textContent = value || '';
    return element.innerHTML;
};

const getAdvancedValue = (item, key) => item ? (item.getAttribute('data-easystud-advanced-' + key) || '') : '';

const getUserById = (root, userid) => {
    return userid ? root.querySelector('[data-easystud-user][data-user-id="' + userid + '"]') : null;
};

const getAdvancedGroupMemberRows = (root, item) => {
    const seen = new Set();
    return Array.from(item.querySelectorAll(':scope > [data-easystud-group-members] [data-easystud-member-id]')).map(member => {
        const userid = member.getAttribute('data-easystud-member-id') || '';
        if (!userid || seen.has(userid)) {
            return null;
        }
        seen.add(userid);
        const user = getUserById(root, userid);
        return {
            name: (member.querySelector('.local-groupimport-easystud-member__name') || {}).textContent || '',
            email: user ? (user.getAttribute('data-user-email') || '') : '',
            id: userid,
        };
    }).filter(Boolean);
};

const getAdvancedGroupGroupingRows = (root, item) => {
    const ids = (item.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
    return ids.map(groupingid => {
        const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
        return {
            name: grouping ? getAdvancedValue(grouping, 'name') : '',
            id: groupingid,
        };
    }).filter(row => row.name || row.id);
};

const getAdvancedGroupingGroupRows = (item) => {
    return Array.from(item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]')).map(group => {
        return {
            name: getAdvancedValue(group, 'name') || getGroupName(group),
            members: getAdvancedCountLabel(null, group, true),
            id: group.getAttribute('data-easystud-group-id') || '',
        };
    });
};

const renderFieldHelp = help => {
    if (!help) {
        return '';
    }
    // Keep the contextual-help control keyboard reachable. Its visual and
    // hover/focus behavior deliberately matches the accepted CCB Slideshow
    // question-mark control without importing another plugin at runtime.
    return '<button type="button" class="btn p-0 icon-no-margin ' +
        'local-groupimport-easystud-settings-modal__help" ' +
        'aria-label="' + escapeHtml(help) + '" data-easystud-hover-help="' + escapeHtml(help) + '">?</button>';
};

const getAdvancedCountLabel = (root, item, isgroup) => {
    const labels = root ? getLabels(root) : {};
    const raw = getAdvancedValue(item, 'count');
    if (raw && raw.indexOf('__count__') === -1) {
        return raw;
    }

    const count = isgroup ?
        item.querySelectorAll('[data-easystud-group-members] [data-easystud-member-id]').length :
        item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    const template = isgroup ?
        (labels.memberscounttemplate || '') :
        (labels.groupscounttemplate || '');
    if (template.indexOf('__count__') === -1) {
        return template;
    }
    return template.replace('__count__', String(count));
};

const renderAdvancedInput = (label, name, value, type = 'text', help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field">' +
        '<span>' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<input type="' + type + '" class="form-control form-control-sm" name="' + escapeHtml(name) + '" value="' +
            escapeHtml(value || '') + '">' +
    '</label>';
};

const renderAdvancedTextarea = (label, name, value, help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field local-groupimport-easystud-settings-modal__field--wide">' +
        '<span>' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<textarea class="form-control form-control-sm" name="' + escapeHtml(name) + '" rows="2">' +
            escapeHtml(value || '') +
        '</textarea>' +
    '</label>';
};

/**
 * Bind one native details element to the shared EasyEdu disclosure Motion.
 *
 * Native details remains the no-script and reduced-motion path. The explicit
 * state attribute keeps the visual chevron in sync while Motion temporarily
 * leaves a closing details element open to animate its content.
 *
 * @param {HTMLElement} details The details element.
 * @param {HTMLElement} content The direct disclosure content.
 * @param {String} stateAttribute Attribute used by the component CSS.
 */
const bindAnimatedDetails = (details, content, stateAttribute) => {
    const summary = details ? details.querySelector(':scope > summary') : null;
    if (!details || !summary || !content || details.dataset.easystudMotionBound === '1') {
        return;
    }
    details.dataset.easystudMotionBound = '1';

    const syncState = open => {
        details.setAttribute(stateAttribute, open ? 'open' : 'closed');
        summary.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    syncState(details.open);
    details.addEventListener('toggle', () => {
        if (!Motion.isEnabled(details)) {
            syncState(details.open);
        }
    });
    summary.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-settings-export]') || !Motion.isEnabled(details)) {
            return;
        }
        event.preventDefault();
        const shouldOpen = details.getAttribute(stateAttribute) === 'closed';
        syncState(shouldOpen);
        if (!shouldOpen) {
            Motion.collapse(content, {
                duration: Motion.timing.slow,
                onComplete: () => {
                    details.open = false;
                },
            });
            return;
        }
        details.open = true;
        content.hidden = true;
        Motion.expand(content, {duration: Motion.timing.slow});
    });
};

const renderAdvancedListSection = (title, rows, columns, exportname, emptylabel, type) => {
    const count = rows.length;
    const open = count <= 6 ? ' open' : '';
    const sectiontype = type ? ' local-groupimport-easystud-settings-modal__list-section--' + type : '';
    const visiblelist = rows.map(row => {
        const primary = row[columns[0].key] || '';
        const meta = columns.slice(1).map(column => {
            const value = row[column.key] || '';
            if (!value) {
                return '';
            }
            return '<span class="local-groupimport-easystud-settings-modal__list-item-chip">' +
                    '<span>' + escapeHtml(column.label) + '</span>' +
                    '<span>' + escapeHtml(value) + '</span>' +
                '</span>';
        }).filter(Boolean).join('');
        return '<li>' +
                '<span class="local-groupimport-easystud-settings-modal__list-item-primary">' +
                    escapeHtml(primary) +
                '</span>' +
                (meta ? '<span class="local-groupimport-easystud-settings-modal__list-item-meta">' + meta + '</span>' : '') +
            '</li>';
    }).join('');
    const exporttable =
        '<table hidden>' +
            '<thead><tr>' + columns.map(column => '<th>' + escapeHtml(column.label) + '</th>').join('') + '</tr></thead>' +
            '<tbody>' + rows.map(row => '<tr>' + columns.map(column => {
                return '<td>' + escapeHtml(row[column.key] || '') + '</td>';
            }).join('') + '</tr>').join('') + '</tbody>' +
        '</table>';

    return '<details class="local-groupimport-easystud-settings-modal__list-section' + sectiontype + '" ' +
            'data-easystud-settings-list-section="1"' +
            ' data-easystud-settings-export-name="' + escapeHtml(exportname) + '"' + open + '>' +
        '<summary>' +
            '<span class="local-groupimport-easystud-settings-modal__disclosure-chevron fa fa-chevron-down" ' +
                'aria-hidden="true"></span>' +
            '<span class="local-groupimport-easystud-settings-modal__list-title">' + escapeHtml(title) + '</span>' +
            '<strong><span>' + count + '</span><span class="local-groupimport-easystud-settings-modal__list-count-label">' +
                escapeHtml(title) + '</span></strong>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-settings-export="1" ' +
                (count ? '' : 'disabled') + '>' +
                '<span class="fa fa-file-export me-1" aria-hidden="true"></span>' +
                '<span>CSV</span>' +
            '</button>' +
        '</summary>' +
        (count ?
            '<div class="local-groupimport-easystud-settings-modal__list-scroll">' +
                '<ul>' + visiblelist + '</ul>' +
                exporttable +
            '</div>' :
            '<div class="local-groupimport-easystud-settings-modal__list-empty">' + escapeHtml(emptylabel || '') + '</div>') +
    '</details>';
};

const openAdvancedSettingsModal = (root, item) => {
    const labels = getLabels(root);
    const type = getAdvancedValue(item, 'type');
    const isgroup = type === 'group';
    const title = getAdvancedValue(item, 'name') || (labels.advancedsettings || '');
    const notset = labels.advancedsettingsnotset || '';
    const nativeurl = getAdvancedValue(item, 'native-url');
    const picture = getAdvancedValue(item, 'picture');
    const count = getAdvancedCountLabel(root, item, isgroup);
    const typeLabel = isgroup ? (labels.groupdetails || '') :
        (labels.groupingdetails || '');
    const pluginLabel = labels.pluginname || '';
    const icon = isgroup ? 'fa-users' : 'fa-layer-group';
    const memberRows = isgroup ? getAdvancedGroupMemberRows(root, item) : [];
    const groupGroupingRows = isgroup ? getAdvancedGroupGroupingRows(root, item) : [];
    const groupingGroupRows = isgroup ? [] : getAdvancedGroupingGroupRows(item);
    const listTitle = isgroup ? (labels.advancedsettingsmembers || '') : (labels.advancedsettingsgroups || '');
    const relatedTitle = labels.groupings || '';
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'easystud';

    let modal = root.querySelector('[data-easystud-advanced-settings-modal]');
    if (modal) {
        modal.remove();
    }
    modal = document.createElement('div');
    modal.className = 'local-groupimport-easystud-modal local-groupimport-easystud-settings-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('data-easystud-advanced-settings-modal', '1');
    modal.innerHTML =
        '<div class="local-groupimport-easystud-modal__dialog local-groupimport-easystud-settings-modal__dialog ' +
                (isgroup ? 'local-groupimport-easystud-settings-modal__dialog--group' :
                    'local-groupimport-easystud-settings-modal__dialog--grouping') + '">' +
            '<div class="local-groupimport-easystud-modal__header local-groupimport-easystud-settings-modal__header">' +
                '<div class="local-groupimport-easystud-settings-modal__heading">' +
                    '<span class="local-groupimport-easystud-settings-modal__icon fa ' + icon + '" aria-hidden="true"></span>' +
                    '<div>' +
                        '<span class="local-groupimport-easystud-settings-modal__eyebrow">' +
                            escapeHtml(pluginLabel) +
                        '</span>' +
                        '<h3 class="h5 mb-0">' + escapeHtml(typeLabel) + '</h3>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="local-groupimport-easystud-modal__close" ' +
                    'data-easystud-close-advanced-settings="1" aria-label="' +
                    escapeHtml(labels.close || '') + '">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-modal__body">' +
                '<form class="local-groupimport-easystud-settings-modal__form" data-easystud-advanced-settings-form="1">' +
                    '<input type="hidden" name="courseid" value="' + escapeHtml(root.getAttribute('data-easystud-course-id') || '') + '">' +
                    '<input type="hidden" name="action" value="' +
                        (isgroup ? 'updategroupadvanced' : 'updategroupingadvanced') + '">' +
                    '<input type="hidden" name="' + (isgroup ? 'groupid' : 'groupingid') + '" value="' +
                        escapeHtml(isgroup ? (item.getAttribute('data-easystud-group-id') || '') :
                            (item.getAttribute('data-easystud-grouping-id') || '')) + '">' +
                    '<div class="local-groupimport-easystud-settings-modal__summary-grid ' +
                            (isgroup ? 'local-groupimport-easystud-settings-modal__summary-grid--group' : '') + '">' +
                        (isgroup ?
                            '<div class="local-groupimport-easystud-settings-modal__image">' +
                                (picture ?
                                    '<img src="' + escapeHtml(picture) + '" alt="">' :
                                    '<div class="local-groupimport-easystud-settings-modal__image-placeholder">' +
                                        '<span class="fa fa-image" aria-hidden="true"></span>' +
                                        '<span>' + escapeHtml(labels.advancedsettingsnoimage || '') + '</span>' +
                                    '</div>') +
                            '</div>' : '') +
                        '<div class="local-groupimport-easystud-settings-modal__grid">' +
                            renderAdvancedInput(labels.advancedsettingsname || '', 'name', getAdvancedValue(item, 'name')) +
                            renderAdvancedInput(labels.advancedsettingsidnumber || '', 'idnumber',
                                getAdvancedValue(item, 'idnumber')) +
                            '<div class="local-groupimport-easystud-settings-modal__field ' +
                                    'local-groupimport-easystud-settings-modal__field--readonly ' +
                                    'local-groupimport-easystud-settings-modal__field--entity-count">' +
                                '<span class="local-groupimport-easystud-settings-modal__field-label">' +
                                escapeHtml(isgroup ? (labels.advancedsettingsmembers || '') :
                                (labels.advancedsettingsgroups || '')) + '</span>' +
                                '<strong>' + escapeHtml(count || notset) + '</strong>' +
                            '</div>' +
                            (isgroup ?
                                renderAdvancedInput(labels.advancedsettingsenrolmentkey || '',
                                    'enrolmentkey', '', 'password', labels.advancedsettingsenrolmentkeyhelp || '') :
                                '<div class="local-groupimport-easystud-settings-modal__field local-groupimport-easystud-settings-modal__field--readonly">' +
                                    '<span>' + escapeHtml(labels.advancedsettingsconfigdata || '') + '</span>' +
                                    '<strong class="' + (!getAdvancedValue(item, 'config') ? 'is-empty' : '') + '">' +
                                        escapeHtml(getAdvancedValue(item, 'config') || notset) +
                                    '</strong>' +
                                '</div>') +
                        '</div>' +
                    '</div>' +
                    renderAdvancedTextarea(labels.advancedsettingsdescription || '', 'description',
                        getAdvancedValue(item, 'raw-description')) +
                    '<div class="local-groupimport-easystud-settings-modal__lists">' +
                        (isgroup ?
                            renderAdvancedListSection(listTitle, memberRows, [
                                {key: 'name', label: labels.advancedsettingsmembername || ''},
                                {key: 'email', label: labels.advancedsettingsmemberemail || ''},
                                {key: 'id', label: labels.advancedsettingsmemberid || ''},
                            ], 'easystud-' + safeTitle + '-members.csv', labels.advancedsettingsnomembers || '', 'members') +
                            renderAdvancedListSection(relatedTitle, groupGroupingRows, [
                                {key: 'name', label: labels.advancedsettingsgroupingname || ''},
                                {key: 'id', label: labels.advancedsettingsgroupingid || ''},
                            ], 'easystud-' + safeTitle + '-groupings.csv', labels.advancedsettingsnogroupings || '', 'groupings') :
                            renderAdvancedListSection(listTitle, groupingGroupRows, [
                                {key: 'name', label: labels.advancedsettingsgroupname || ''},
                                {key: 'members', label: labels.advancedsettingsmembers || ''},
                                {key: 'id', label: labels.advancedsettingsgroupid || ''},
                            ], 'easystud-' + safeTitle + '-groups.csv', labels.advancedsettingsnogroups || '', 'groups')) +
                    '</div>' +
                    (isgroup ?
                        '<div class="local-groupimport-easystud-settings-modal__file-row">' +
                            '<div class="local-groupimport-easystud-settings-modal__filemanager">' +
                                '<div class="local-groupimport-easystud-settings-modal__filemanager-title">' +
                                    '<span class="fa fa-file-image" aria-hidden="true"></span>' +
                                    '<span>' + escapeHtml(labels.advancedsettingsimage || '') +
                                        renderFieldHelp(labels.advancedsettingsimagehelp || '') + '</span>' +
                                '</div>' +
                                '<label class="local-groupimport-easystud-settings-modal__filepicker">' +
                                    '<input type="file" name="imagefile" accept="image/*" data-easystud-advanced-file-input="1">' +
                                    '<span class="local-groupimport-easystud-settings-modal__filepicker-icon fa fa-cloud-upload-alt" aria-hidden="true"></span>' +
                                    '<span class="btn btn-secondary btn-sm">' +
                                        escapeHtml(labels.advancedsettingschoosefile || '') +
                                    '</span>' +
                                    '<span class="local-groupimport-easystud-settings-modal__filename" data-easystud-advanced-file-name>' +
                                        escapeHtml(labels.advancedsettingsnofile || '') +
                                    '</span>' +
                                '</label>' +
                            '</div>' +
                            '<label class="local-groupimport-easystud-toggle-check">' +
                                '<input type="checkbox" name="deletepicture" value="1">' +
                                '<span>' + escapeHtml(labels.deletepicture || '') + '</span>' +
                            '</label>' +
                        '</div>' : '') +
                    '<div class="local-groupimport-easystud-modal__footer">' +
                        '<button type="submit" class="btn btn-primary">' +
                            '<span class="fa fa-save me-1" aria-hidden="true"></span>' +
                            '<span>' + escapeHtml(labels.save || '') + '</span>' +
                        '</button>' +
                        '<button type="button" class="btn btn-outline-secondary" data-easystud-close-advanced-settings="1">' +
                            escapeHtml(labels.cancel || '') +
                        '</button>' +
                        (nativeurl ?
                            '<a class="btn btn-outline-secondary" href="' + escapeHtml(nativeurl) + '">' +
                                '<span class="fa fa-external-link-alt me-1" aria-hidden="true"></span>' +
                                '<span>' + escapeHtml(labels.advancedsettingsnative || '') + '</span>' +
                            '</a>' : '') +
                    '</div>' +
                '</form>' +
            '</div>' +
        '</div>';

    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('[data-easystud-close-advanced-settings]')) {
            modal.remove();
        }
    });
    root.appendChild(modal);
    modal.querySelectorAll('[data-easystud-settings-list-section]').forEach(details => {
        const content = details.querySelector(':scope > .local-groupimport-easystud-settings-modal__list-scroll, ' +
            ':scope > .local-groupimport-easystud-settings-modal__list-empty');
        bindAnimatedDetails(details, content, 'data-easystud-settings-list-state');
    });
};

const applyAdvancedGroupUpdate = (root, data) => {
    if (!data || !data.id) {
        return;
    }
    getGroupElementsById(root, data.id).forEach(group => {
        const name = group.querySelector('.local-groupimport-easystud-group__name');
        if (name) {
            name.textContent = data.name || '';
        }
        group.setAttribute('data-easystud-advanced-name', data.name || '');
        group.setAttribute('data-easystud-advanced-description', data.description || '');
        group.setAttribute('data-easystud-advanced-raw-description', data.rawdescription || '');
        group.setAttribute('data-easystud-advanced-idnumber', data.idnumber || '');
        group.setAttribute('data-easystud-advanced-native-url', data.nativeurl || '');
        group.setAttribute('data-easystud-advanced-picture', data.picture || '');
        group.setAttribute('data-easystud-advanced-enrolment-key', data.enrolmentkey ? '1' : '0');
        const input = group.querySelector('input[name="name"]');
        if (input) {
            input.value = data.rawname || data.name || '';
        }
    });
    rehydrateParticipantMembershipDetails(root);
    scheduleGroupGroupingOverflow(root);
    requestGuideHighlightRefresh(root);
};

const applyAdvancedGroupingUpdate = (root, data) => {
    if (!data || !data.id) {
        return;
    }
    const grouping = root.querySelector('[data-easystud-grouping-id="' + data.id + '"]');
    if (grouping) {
        const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
        if (name) {
            name.textContent = data.name || '';
        }
        grouping.setAttribute('data-easystud-advanced-name', data.name || '');
        grouping.setAttribute('data-easystud-advanced-description', data.description || '');
        grouping.setAttribute('data-easystud-advanced-raw-description', data.rawdescription || '');
        grouping.setAttribute('data-easystud-advanced-idnumber', data.idnumber || '');
        grouping.setAttribute('data-easystud-advanced-native-url', data.nativeurl || '');
        grouping.setAttribute('data-easystud-advanced-config', data.configdata || '');
        grouping.setAttribute('data-search-text', normalise(data.name || ''));
        const input = grouping.querySelector('input[name="name"]');
        if (input) {
            input.value = data.rawname || data.name || '';
        }
    }
    root.querySelectorAll('[data-easystud-group-id][data-grouping-ids]').forEach(group => {
        const ids = (group.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
        if (ids.indexOf(String(data.id)) !== -1) {
            updateCatalogGroupingTags(root, group.getAttribute('data-easystud-group-id'));
        }
    });
    rehydrateParticipantMembershipDetails(root);
    scheduleGroupGroupingOverflow(root);
    requestGuideHighlightRefresh(root);
};

const insertGroupData = (root, groupdata) => {
    const tree = root.querySelector('[data-easystud-tree]');
    const participantgrouplist = root.querySelector('.local-groupimport-easystud-participant-groups__list');
    const structuregrouplist = root.querySelector('.local-groupimport-easystud-structure-groups__list');
    const groupingids = Array.isArray(groupdata.groupingids) ?
        groupdata.groupingids.map(id => String(id)) :
        (groupdata.groupingidscsv || '').split(',').filter(Boolean);

    if (tree) {
        if (groupingids.length) {
            groupingids.forEach(groupingid => {
                const target = tree.querySelector('[data-easystud-grouping-drop="' + groupingid + '"]');
                const children = target ? target.querySelector('.local-groupimport-easystud-tree__children') : null;
                if (!children) {
                    return;
                }
                children.hidden = false;
                const group = createGroupElement(root, groupdata);
                insertGroupElementSorted(children, group);
                animateElementCreated(group);
                syncGroupingChildrenState(target, getLabels(root));
                updateGroupingBadge(target);
            });
        } else {
            const ungroupedsection = tree.querySelector('.local-groupimport-easystud-tree__section--ungrouped');
            const children = ungroupedsection ? ungroupedsection.querySelector('.local-groupimport-easystud-tree__children') : null;
            if (children) {
                children.hidden = false;
                const group = createGroupElement(root, groupdata);
                insertGroupElementSorted(children, group);
                animateElementCreated(group);
                syncUngroupedState(root, getLabels(root));
            }
        }
    }

    if (participantgrouplist) {
        const group = createParticipantCatalogGroupElement(root, groupdata);
        insertGroupElementSorted(participantgrouplist, group);
        animateElementCreated(group);
    }
    if (structuregrouplist) {
        const group = createParticipantCatalogGroupElement(root, groupdata);
        insertGroupElementSorted(structuregrouplist, group);
        animateElementCreated(group);
    }
    ensureDuplicateButtons(root);
    ensureAdvancedSettingsButtons(root);
    updateCatalogGroupingTags(root, groupdata.id);
    syncCatalogFilters(root);
    applyContainerGroupSearch(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
};

const insertGroupingData = (root, groupingdata) => {
    const tree = root.querySelector('[data-easystud-tree]');
    const groupingswrap = tree ? tree.querySelector('.local-groupimport-easystud-tree__groupings') : null;
    if (!groupingswrap) {
        return null;
    }
    const grouping = createGroupingElement(root, groupingdata);
    grouping.classList.remove(selectedClass, disabledSelectionClass, draggingClass, dropTargetClass, 'is-expanded');
    insertGroupingElementSorted(groupingswrap, grouping);
    animateElementCreated(grouping);
    (groupingdata.groupids || []).forEach(groupid => {
        const source = getTreeGroupElementsById(root, String(groupid))[0] ||
            root.querySelector('.local-groupimport-easystud-structure-groups__list [data-easystud-group-id="' + groupid + '"]');
        if (source) {
            copyGroupElementToGrouping(root, source, groupingdata.id);
        }
    });
    const children = grouping.querySelector(':scope > .local-groupimport-easystud-tree__children');
    if (children) {
        children.hidden = true;
    }
    const toggle = grouping.querySelector('[data-easystud-collapse-toggle]');
    if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
        const icon = toggle.querySelector('.fa');
        if (icon) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
        }
    }
    collapseGroupingSection(grouping);
    ensureDuplicateButtons(root);
    ensureAdvancedSettingsButtons(root);
    syncCatalogFilters(root);
    applyContainerGroupSearch(root);
    updateStructureSummary(root);
    updateStructureEmptyState(root);
    requestGuideHighlightRefresh(root);
    return grouping;
};

const getSelectedFilterValues = control => {
    if (!control) {
        return [];
    }

    if (control.tagName === 'SELECT' && control.multiple) {
        return Array.from(control.selectedOptions).map(option => option.value).filter(Boolean);
    }

    const value = control.value || '';
    return value ? [value] : [];
};

const syncRoleFilterState = root => {
    const select = root.querySelector('[data-easystud-role-filter]');
    const buttons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));
    if (!select || !buttons.length) {
        return;
    }

    const selectedvalues = Array.from(select.selectedOptions).map(option => option.value);
    buttons.forEach(button => {
        const active = selectedvalues.indexOf(button.getAttribute('data-easystud-role-choice') || '') !== -1;
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.classList.toggle('active', active);
        button.classList.toggle('btn-primary', active);
        button.classList.toggle('btn-outline-secondary', !active);
    });
};

const updateRoleFilterMode = root => {
    const wrap = root.querySelector('[data-easystud-role-toggle-wrap]');
    const toggle = root.querySelector('[data-easystud-role-toggle]');
    const select = root.querySelector('[data-easystud-role-filter]');
    if (!wrap || !toggle || !select) {
        return;
    }

    toggle.hidden = false;
    select.hidden = true;

    const shouldFallback = window.innerWidth < 768;
    toggle.hidden = shouldFallback;
    select.hidden = !shouldFallback;
};

const resetFilters = root => {
    const searchControl = root.querySelector('[data-easystud-search]');
    const roleControl = root.querySelector('[data-easystud-role-filter]');
    const groupControl = root.querySelector('[data-easystud-group-filter]');
    const groupingControl = root.querySelector('[data-easystud-grouping-filter]');
    const roleButtons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));

    if (searchControl) {
        searchControl.value = '';
    }

    if (roleControl && roleControl.tagName === 'SELECT') {
        Array.from(roleControl.options).forEach(option => {
            option.selected = false;
        });
    }

    if (groupControl && groupControl.tagName === 'SELECT') {
        Array.from(groupControl.options).forEach(option => {
            option.selected = false;
        });
    }

    if (groupingControl && groupingControl.tagName === 'SELECT') {
        Array.from(groupingControl.options).forEach(option => {
            option.selected = false;
        });
    }

    roleButtons.forEach(button => {
        button.setAttribute('aria-pressed', 'false');
        button.classList.remove('active', 'btn-primary');
        button.classList.add('btn-outline-secondary');
    });
};

const getPaginationConfigs = root => {
    const participantLimit = root.classList.contains(compactClass) ? 20 : 15;
    return [
        {
            list: root.querySelector('[data-easystud-participant-list]'),
            selector: '[data-easystud-user]',
            limit: participantLimit,
            inside: true,
        },
        {
            list: root.querySelector('.local-groupimport-easystud-participant-groups__list'),
            selector: '[data-easystud-group-id]',
            limit: 10,
            inside: true,
        },
        {
            list: root.querySelector('.local-groupimport-easystud-structure-groups__list'),
            selector: '[data-easystud-group-id]',
            limit: 10,
            inside: true,
        },
        {
            list: root.classList.contains(structureFocusClass) ?
                root.querySelector('[data-easystud-tree] .local-groupimport-easystud-tree__groupings') : null,
            selector: '[data-easystud-grouping-id]',
            limit: 10,
            inside: true,
        },
    ];
};

const getPagination = (list, inside, position) => {
    const root = list.closest('.local-groupimport-easystud');
    const labels = root ? getLabels(root) : {};
    // The consumer owns the block geometry; this marker lets its bottom
    // pagination remain at the end of that block without viewport positioning.
    list.classList.add('is-easystud-paginated');
    const selector = '[data-easystud-pagination="' + position + '"]';
    let pagination = inside ? list.querySelector(':scope > ' + selector) :
        (position === 'top' ? list.previousElementSibling : list.nextElementSibling);
    if (!pagination || !pagination.matches('[data-easystud-pagination]')) {
        pagination = document.createElement('nav');
        pagination.className = 'local-groupimport-easystud-pagination local-groupimport-easystud-pagination--' + position;
        pagination.setAttribute('data-easystud-pagination', position);
        pagination.innerHTML =
            '<span class="local-groupimport-easystud-pagination__selection">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary local-groupimport-easystud-pagination__select" data-easystud-select-results="1">' +
                    '<span data-easystud-select-results-label>' +
                        (labels.selectresults || '') +
                    '</span>' +
                '</button>' +
                '<span class="local-groupimport-easystud-pagination__count" data-easystud-list-count></span>' +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__controls">' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-page-first="1">&laquo;</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-page-prev="1">&lsaquo;</button>' +
                '<span data-easystud-page-label></span>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-page-next="1">&rsaquo;</button>' +
                '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-page-last="1">&raquo;</button>' +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__tools">' +
                '<label class="local-groupimport-easystud-pagination__sort">' +
                    '<span>' + (labels.sortitems || '') + '</span>' +
                    '<span class="local-groupimport-easystud-dropdown" data-easystud-list-sort-dropdown>' +
                        '<button type="button" class="local-groupimport-easystud-dropdown__button" data-easystud-list-sort-toggle aria-expanded="false">' +
                            '<span data-easystud-list-sort-label>' + (labels.sortalpha || '') + '</span>' +
                            '<span class="fa fa-chevron-down" aria-hidden="true"></span>' +
                        '</button>' +
                        '<span class="local-groupimport-easystud-dropdown__menu" data-easystud-list-sort-menu hidden>' +
                            '<button type="button" data-easystud-list-sort-option="alpha">' + (labels.sortalpha || '') + '</button>' +
                            '<button type="button" data-easystud-list-sort-option="filled">' + (labels.sortfilledfirst || '') + '</button>' +
                            '<button type="button" data-easystud-list-sort-option="empty">' + (labels.sortemptyfirst || '') + '</button>' +
                        '</span>' +
                    '</span>' +
                '</label>' +
            '</span>' +
            '<span class="local-groupimport-easystud-pagination__spacer" aria-hidden="true"></span>';
        if (inside) {
            if (position === 'top') {
                list.insertBefore(pagination, list.firstChild);
            } else {
                list.appendChild(pagination);
            }
        } else {
            list.insertAdjacentElement(position === 'top' ? 'beforebegin' : 'afterend', pagination);
        }
    }
    if (inside && position === 'bottom') {
        // Reusing an existing navigation must restore the same invariant as
        // creating it: late lifecycle children stay above the bottom pager.
        list.appendChild(pagination);
    }
    return pagination;
};

const hasActiveListFilters = (root, list) => {
    if (!root || !list) {
        return false;
    }
    const hasValue = control => !!control && !!(control.value || '').trim();
    const hasSelected = control => getSelectedFilterValues(control).length > 0;

    if (list.matches('[data-easystud-participant-list]')) {
        return hasValue(root.querySelector('[data-easystud-search]')) ||
            hasSelected(root.querySelector('[data-easystud-role-filter]')) ||
            hasSelected(root.querySelector('[data-easystud-group-filter]')) ||
            hasSelected(root.querySelector('[data-easystud-grouping-filter]'));
    }

    if (list.matches('.local-groupimport-easystud-participant-groups__list')) {
        return hasValue(root.querySelector('[data-easystud-catalog-search="participants"]')) ||
            hasSelected(root.querySelector('[data-easystud-catalog-grouping-filter="participants"]')) ||
            !!(root.querySelector('[data-easystud-catalog-show-ungrouped="participants"]') || {}).checked;
    }

    if (list.matches('.local-groupimport-easystud-structure-groups__list')) {
        return hasValue(root.querySelector('[data-easystud-catalog-search="structure"]')) ||
            hasValue(root.querySelector('[data-easystud-structure-group-search]')) ||
            hasSelected(root.querySelector('[data-easystud-catalog-grouping-filter="structure"]')) ||
            !!(root.querySelector('[data-easystud-catalog-show-ungrouped="structure"]') || {}).checked;
    }

    if (list.matches('.local-groupimport-easystud-tree__groupings')) {
        return hasValue(root.querySelector('[data-easystud-structure-grouping-search]'));
    }

    return false;
};

const getSelectableResultItems = (list, config) => {
    return Array.from(list.children).filter(item => {
        if (!item.matches(config.selector)) {
            return false;
        }
        return !item.hidden || item.getAttribute('data-easystud-page-hidden') === '1';
    });
};

const getSortableItemName = item => {
    const name = item.querySelector(
        '.local-groupimport-easystud-user__name, ' +
        '.local-groupimport-easystud-group__name, ' +
        '.local-groupimport-easystud-grouping__name'
    );
    return normalise(name ? name.textContent : item.textContent);
};

const getSortableItemCount = item => {
    const type = item.getAttribute('data-selectable-type') || '';
    if (type === 'participant') {
        return (item.getAttribute('data-group-ids') || '').split(',').filter(Boolean).length;
    }
    if (type === 'group') {
        return item.querySelectorAll(':scope [data-easystud-member-id]').length;
    }
    if (type === 'grouping') {
        return item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    }
    return 0;
};

const getSortModeLabels = (root, list) => {
    const labels = getLabels(root);
    if (list && list.matches('[data-easystud-participant-list]')) {
        return {
            alpha: labels.sortalpha || '',
            filled: labels.sortparticipantswithgroups || '',
            empty: labels.sortparticipantswithoutgroups || '',
        };
    }
    return {
        alpha: labels.sortalpha || '',
        filled: labels.sortfilledfirst || '',
        empty: labels.sortemptyfirst || '',
    };
};

const sortListItems = (list, config) => {
    if (!list || !config) {
        return;
    }
    const mode = list.getAttribute('data-easystud-sort') || 'alpha';
    const topPagination = list.querySelector(':scope > [data-easystud-pagination="top"]');
    const bottomPagination = list.querySelector(':scope > [data-easystud-pagination="bottom"]');
    const items = Array.from(list.children).filter(item => item.matches(config.selector));
    items.sort((left, right) => {
        const leftName = getSortableItemName(left);
        const rightName = getSortableItemName(right);
        if (mode === 'filled' || mode === 'empty') {
            const leftCount = getSortableItemCount(left);
            const rightCount = getSortableItemCount(right);
            if (leftCount !== rightCount) {
                return mode === 'filled' ? rightCount - leftCount : leftCount - rightCount;
            }
        }
        return leftName.localeCompare(rightName);
    });
    const anchor = bottomPagination && bottomPagination.parentElement === list ? bottomPagination : null;
    items.forEach(item => list.insertBefore(item, anchor));
    if (topPagination && topPagination.parentElement === list) {
        list.insertBefore(topPagination, list.firstChild);
    }
};

const updateResultSelectionControl = (root, list, config, select) => {
    if (!select) {
        return;
    }
    const labels = getLabels(root);
    const items = getSelectableResultItems(list, config);
    const filtered = hasActiveListFilters(root, list);
    const show = items.length > 0;
    const label = select.querySelector('[data-easystud-select-results-label]') || select;
    select.hidden = !show;
    if (!show) {
        select.removeAttribute('data-easystud-deselect-results');
        label.textContent = filtered ?
            (labels.selectresults || '') :
            (labels.selectall || '');
        return;
    }
    const allselected = items.every(item => item.classList.contains(selectedClass));
    select.setAttribute('data-easystud-deselect-results', allselected ? '1' : '0');
    label.textContent = allselected ?
        (filtered ? (labels.deselectresults || '') : (labels.deselectall || '')) :
        (filtered ? (labels.selectresults || '') : (labels.selectall || ''));
};

// A selection only changes the select/deselect wording. Rebuilding every paginated list here delays card motion.
const syncPaginationSelectionControls = root => {
    getPaginationConfigs(root).forEach(config => {
        const list = config.list;
        if (!list) {
            return;
        }
        const paginations = config.inside ?
            Array.from(list.querySelectorAll(':scope > [data-easystud-pagination="top"]')) :
            [list.previousElementSibling].filter(node => node && node.matches('[data-easystud-pagination="top"]'));
        paginations.forEach(pagination => {
            updateResultSelectionControl(root, list, config,
                pagination.querySelector('[data-easystud-select-results]'));
        });
    });
};

const updatePaginationMetaControls = (root, list, pagination, total, position) => {
    const count = pagination.querySelector('[data-easystud-list-count]');
    const sortDropdown = pagination.querySelector('[data-easystud-list-sort-dropdown]');
    const sortLabel = pagination.querySelector('[data-easystud-list-sort-label]');
    const tools = pagination.querySelector('.local-groupimport-easystud-pagination__tools');
    const visible = position === 'top' && total > 0;
    const isFullView = !root.classList.contains(participantFocusClass) && !root.classList.contains(structureFocusClass);
    const showCount = visible && !isFullView;
    if (tools) {
        tools.hidden = !visible;
    }
    if (count) {
        const labels = getLabels(root);
        const template = labels.listeditemscounttemplate || '';
        count.textContent = template.replace('__count__', String(total));
        count.hidden = !showCount;
        if (showCount) {
            window.requestAnimationFrame(() => {
                if (pagination.scrollWidth > pagination.clientWidth + 1) {
                    count.hidden = true;
                }
            });
        }
    }
    if (sortDropdown) {
        const mode = list.getAttribute('data-easystud-sort') || 'alpha';
        const modeLabels = getSortModeLabels(root, list);
        sortDropdown.setAttribute('data-easystud-list-sort-value', mode);
        if (sortLabel) {
            sortLabel.textContent = modeLabels[mode] || modeLabels.alpha;
        }
        sortDropdown.querySelectorAll('[data-easystud-list-sort-option]').forEach(option => {
            const optionMode = option.getAttribute('data-easystud-list-sort-option') || 'alpha';
            const active = optionMode === mode;
            option.textContent = modeLabels[optionMode] || option.textContent;
            option.classList.toggle('is-active', active);
            option.setAttribute('aria-pressed', active ? 'true' : 'false');
        });
    }
};

const syncSinglePageResultSelection = (root, list, config, pages, items) => {
    const paginations = config.inside ? Array.from(list.querySelectorAll(':scope > [data-easystud-pagination]')) :
        [list.previousElementSibling, list.nextElementSibling].filter(node => node && node.matches('[data-easystud-pagination]'));
    if (pages > 1) {
        return;
    }

    paginations.forEach(pagination => {
        if (pagination.getAttribute('data-easystud-pagination') !== 'top') {
            pagination.remove();
        }
    });

    const controls = getPagination(list, config.inside, 'top');
    controls.classList.add('is-placeholder');
    controls.querySelectorAll('[data-easystud-page-first], [data-easystud-page-prev], [data-easystud-page-next], [data-easystud-page-last], [data-easystud-page-label]')
        .forEach(control => {
            control.hidden = false;
            control.setAttribute('aria-hidden', 'true');
            if ('disabled' in control) {
                control.disabled = true;
            }
        });
    const label = controls.querySelector('[data-easystud-page-label]');
    if (label) {
        label.textContent = '1 / 1';
    }
    const select = controls.querySelector('[data-easystud-select-results]');
    updateResultSelectionControl(root, list, config, select);
    updatePaginationMetaControls(root, list, controls, items.length, 'top');
};

const syncPagination = root => {
    if (!root.classList.contains(structureFocusClass)) {
        root.querySelectorAll('[data-easystud-tree] .local-groupimport-easystud-tree__groupings > [data-easystud-pagination]')
            .forEach(pagination => pagination.remove());
    }
    getPaginationConfigs(root).forEach(config => {
        const list = config.list;
        if (!list) {
            return;
        }

        Array.from(list.querySelectorAll('[data-easystud-page-hidden="1"]')).forEach(item => {
            item.removeAttribute('data-easystud-page-hidden');
            if (!item.hasAttribute('data-easystud-filter-hidden')) {
                item.hidden = false;
            }
        });

        sortListItems(list, config);
        const items = Array.from(list.children).filter(item => item.matches(config.selector) && !item.hidden);
        const pages = Math.ceil(items.length / config.limit);
        let page = parseInt(list.getAttribute('data-easystud-page') || '0', 10);
        if (Number.isNaN(page) || page < 0) {
            page = 0;
        }
        page = Math.min(page, Math.max(pages - 1, 0));
        list.setAttribute('data-easystud-page', page);

        const paginations = config.inside ? Array.from(list.querySelectorAll(':scope > [data-easystud-pagination]')) :
            [list.previousElementSibling, list.nextElementSibling].filter(node => node && node.matches('[data-easystud-pagination]'));
        if (pages <= 1) {
            syncSinglePageResultSelection(root, list, config, pages, items);
            return;
        }

        const start = page * config.limit;
        const end = start + config.limit;
        items.forEach((item, index) => {
            const hidden = index < start || index >= end;
            item.hidden = hidden;
            if (hidden) {
                item.setAttribute('data-easystud-page-hidden', '1');
            }
        });

        ['top', 'bottom'].forEach(position => {
            const controls = getPagination(list, config.inside, position);
            controls.classList.remove('is-placeholder');
            controls.removeAttribute('aria-hidden');
            const label = controls.querySelector('[data-easystud-page-label]');
            const first = controls.querySelector('[data-easystud-page-first]');
            const prev = controls.querySelector('[data-easystud-page-prev]');
            const next = controls.querySelector('[data-easystud-page-next]');
            const last = controls.querySelector('[data-easystud-page-last]');
            const select = controls.querySelector('[data-easystud-select-results]');
            updatePaginationMetaControls(root, list, controls, items.length, position);
            [label, first, prev, next, last].forEach(control => {
                if (control) {
                    control.hidden = false;
                    control.removeAttribute('aria-hidden');
                }
            });
            if (label) {
                label.textContent = (page + 1) + ' / ' + pages;
            }
            [first, last].forEach(edge => {
                if (edge) {
                    edge.hidden = pages <= 2;
                }
            });
            if (first) {
                first.disabled = page === 0;
            }
            if (prev) {
                prev.disabled = page === 0;
            }
            if (next) {
                next.disabled = page >= pages - 1;
            }
            if (last) {
                last.disabled = page >= pages - 1;
            }
            if (select) {
                if (position !== 'top') {
                    select.hidden = true;
                } else {
                    updateResultSelectionControl(root, list, config, select);
                }
            }
        });
    });
    scheduleGroupGroupingOverflow(root);
};

const getListFromPagination = pagination => {
    if (!pagination) {
        return null;
    }
    const parent = pagination.parentElement;
    if (parent && (
        parent.matches('[data-easystud-participant-list]') ||
        parent.classList.contains('local-groupimport-easystud-participant-groups__list') ||
        parent.classList.contains('local-groupimport-easystud-structure-groups__list') ||
        parent.classList.contains('local-groupimport-easystud-tree__groupings')
    )) {
        return parent;
    }
    return pagination.getAttribute('data-easystud-pagination') === 'top' ?
        pagination.nextElementSibling : pagination.previousElementSibling;
};

const getConfigFromPagination = (root, pagination) => {
    const list = getListFromPagination(pagination);
    if (!list) {
        return null;
    }
    return getPaginationConfigs(root).find(config => config.list === list) || null;
};

const bindPagination = root => {
    const setSortDropdownStackOpen = (dropdown, open) => {
        if (!dropdown) {
            return;
        }
        dropdown.classList.toggle('is-open', open);
        const pagination = dropdown.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (pagination) {
            pagination.classList.toggle('is-sort-menu-open', open);
        }
        if (list) {
            list.classList.toggle('is-sort-menu-open', open);
        }
        const card = dropdown.closest('[data-easystud-group-id], [data-easystud-grouping-id], [data-easystud-user]');
        if (card) {
            card.classList.toggle('is-sort-menu-open', open);
        }
    };

    const closeSortDropdowns = except => {
        root.querySelectorAll('[data-easystud-list-sort-dropdown]').forEach(dropdown => {
            if (dropdown === except) {
                return;
            }
            const toggle = dropdown.querySelector('[data-easystud-list-sort-toggle]');
            const menu = dropdown.querySelector('[data-easystud-list-sort-menu]');
            if (menu) {
                menu.hidden = true;
            }
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
            setSortDropdownStackOpen(dropdown, false);
        });
    };

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-list-sort-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();
        const dropdown = toggle.closest('[data-easystud-list-sort-dropdown]');
        const menu = dropdown ? dropdown.querySelector('[data-easystud-list-sort-menu]') : null;
        if (!menu) {
            return;
        }
        const open = menu.hidden;
        closeSortDropdowns(dropdown);
        menu.hidden = !open;
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        setSortDropdownStackOpen(dropdown, open);
    });

    root.addEventListener('click', event => {
        const option = event.target.closest('[data-easystud-list-sort-option]');
        if (!option || !root.contains(option)) {
            return;
        }
        event.preventDefault();
        const pagination = option.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (!list) {
            return;
        }
        closeSortDropdowns();
        Motion.swap(list, () => {
            list.setAttribute('data-easystud-sort', option.getAttribute('data-easystud-list-sort-option') || 'alpha');
            list.setAttribute('data-easystud-page', '0');
            syncPagination(root);
        }, {
            exitDuration: Motion.timing.fast,
            enterDuration: Motion.timing.normal,
            exitDistance: '0px',
            distance: '0px',
            resize: false,
            swapOpacity: 0.55,
        }).then(() => requestGuideHighlightRefresh(root));
    });

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-page-first], [data-easystud-page-prev], [data-easystud-page-next], [data-easystud-page-last], [data-easystud-select-results]');
        if (!button || !root.contains(button)) {
            return;
        }
        event.preventDefault();
        if (button.hidden || button.disabled || button.getAttribute('aria-hidden') === 'true') {
            return;
        }
        const pagination = button.closest('[data-easystud-pagination]');
        const list = getListFromPagination(pagination);
        if (!list) {
            return;
        }
        const config = getConfigFromPagination(root, pagination);
        if (!config) {
            return;
        }
        if (button.matches('[data-easystud-select-results]')) {
            const items = getSelectableResultItems(list, config);
            const type = items[0] ? items[0].getAttribute('data-selectable-type') : '';
            const active = getActiveSelectionType(root);
            if (!type || (active && active !== type)) {
                return;
            }
            const deselect = button.getAttribute('data-easystud-deselect-results') === '1';
            items.forEach(item => setItemSelected(item, !deselect));
            if (deselect && type === 'grouping') {
                collapseAllGroupings(root);
            }
            updateSelectionActions(root);
            requestGuideHighlightRefresh(root);
            return;
        }
        const current = parseInt(list.getAttribute('data-easystud-page') || '0', 10) || 0;
        let nextpage = current;
        if (button.matches('[data-easystud-page-first]')) {
            nextpage = 0;
        } else if (button.matches('[data-easystud-page-last]')) {
            const limit = config.limit;
            const total = Array.from(list.children).filter(item => {
                if (!item.matches(config.selector)) {
                    return false;
                }
                return !item.hidden || item.getAttribute('data-easystud-page-hidden') === '1';
            }).length;
            nextpage = Math.max(Math.ceil(total / limit) - 1, 0);
        } else {
            nextpage = current + (button.matches('[data-easystud-page-next]') ? 1 : -1);
        }
        const total = Array.from(list.children).filter(item => {
            if (!item.matches(config.selector)) {
                return false;
            }
            return !item.hidden || item.getAttribute('data-easystud-page-hidden') === '1';
        }).length;
        const maxpage = Math.max(Math.ceil(total / config.limit) - 1, 0);
        nextpage = Math.max(0, Math.min(nextpage, maxpage));
        const fromBottom = pagination.getAttribute('data-easystud-pagination') === 'bottom';
        Motion.swap(list, () => {
            list.setAttribute('data-easystud-page', nextpage);
            syncPagination(root);
            scheduleResponsiveUiRefresh(root, {pagination: false});
        }, {
            exitDuration: Motion.timing.fast,
            enterDuration: Motion.timing.normal,
            exitDistance: '0px',
            distance: '0px',
            resize: false,
            swapOpacity: 0.55,
        }).then(completed => {
            if (!completed) {
                return;
            }
            requestGuideHighlightRefresh(root);
            if (!fromBottom) {
                return;
            }
            const topPagination = config.inside ?
                list.querySelector(':scope > [data-easystud-pagination="top"]') :
                list.previousElementSibling;
            const scrollTarget = topPagination && topPagination.matches('[data-easystud-pagination]') ?
                topPagination : list;
            Motion.scroll(scrollTarget, {block: 'start', inline: 'nearest'});
        });
    });

    document.addEventListener('click', event => {
        if (root.contains(event.target) && event.target.closest('[data-easystud-list-sort-dropdown]')) {
            return;
        }
        closeSortDropdowns();
    });
};

// Apply participant filters.
const applyFilters = (root, options = {}) => {
    const searchControl = root.querySelector('[data-easystud-search]');
    const roleControl = root.querySelector('[data-easystud-role-filter]');
    const groupControl = root.querySelector('[data-easystud-group-filter]');
    const groupingControl = root.querySelector('[data-easystud-grouping-filter]');
    const query = normalise(searchControl ? searchControl.value : '');
    const selectedroles = getSelectedFilterValues(roleControl).map(normalise);
    const selectedgroups = getSelectedFilterValues(groupControl);
    const selectedgroupings = (root.classList.contains(participantFocusClass) ||
        root.getAttribute('data-easystud-mobile-view-active') === 'participants') ?
        getSelectedFilterValues(groupingControl) : [];

    root.querySelectorAll('[data-easystud-user]').forEach(user => {
        const text = normalise(user.getAttribute('data-search-text'));
        const roles = normalise(user.getAttribute('data-role-text')).split('|').filter(Boolean);
        const groups = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
        const groupings = (user.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
        const hasnogrouping = groupings.length === 0;
        const matchesQuery = !query || text.indexOf(query) !== -1;
        const matchesRole = !selectedroles.length || selectedroles.some(role => roles.indexOf(role) !== -1);
        const matchesGroup = !selectedgroups.length || selectedgroups.some(groupid => groups.indexOf(groupid) !== -1);
        const matchesGrouping = !selectedgroupings.length || selectedgroupings.some(groupingid => {
            if (groupingid === '__none__') {
                return hasnogrouping;
            }
            return groupings.indexOf(groupingid) !== -1;
        });
        const matches = matchesQuery && matchesRole && matchesGroup && matchesGrouping;
        user.hidden = !matches;
        if (matches) {
            user.removeAttribute('data-easystud-filter-hidden');
        } else {
            user.setAttribute('data-easystud-filter-hidden', '1');
        }
    });
    if (options.pagination !== false) {
        syncPagination(root);
    }
    updateParticipantEmptyState(root);
    syncResponsiveResetButtons(root);
    if (options.responsive !== false) {
        scheduleResponsiveUiRefresh(root);
    }
};

const bindFilters = root => {
    const roleSelect = root.querySelector('[data-easystud-role-filter]');
    const groupSelect = root.querySelector('[data-easystud-group-filter]');
    const groupingSelect = root.querySelector('[data-easystud-grouping-filter]');
    const searchControl = root.querySelector('[data-easystud-search]');
    const resetButton = root.querySelector('[data-easystud-reset-filters]');
    const roleButtons = Array.from(root.querySelectorAll('[data-easystud-role-choice]'));

    if (searchControl) {
        searchControl.addEventListener('input', () => {
            applyFilters(root);
            emitGuidedCompletion(root, 2);
        });
    }

    if (roleSelect) {
        roleSelect.addEventListener('change', () => {
            syncRoleFilterState(root);
            applyFilters(root);
            emitGuidedCompletion(root, 2);
        });
    }

    if (groupSelect) {
        groupSelect.addEventListener('change', () => {
            applyFilters(root);
            emitGuidedCompletion(root, 2);
        });
    }

    if (groupingSelect) {
        groupingSelect.addEventListener('change', () => {
            applyFilters(root);
            emitGuidedCompletion(root, 2);
        });
    }

    roleButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (!roleSelect) {
                return;
            }
            const value = button.getAttribute('data-easystud-role-choice') || '';
            Array.from(roleSelect.options).forEach(option => {
                if (option.value === value) {
                    option.selected = !option.selected;
                }
            });
            syncRoleFilterState(root);
            applyFilters(root);
            updateRoleFilterMode(root);
            emitGuidedCompletion(root, 2);
        });
    });

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            resetFilters(root);
            if (roleSelect) {
                syncRoleFilterState(root);
            }
            applyFilters(root);
            updateRoleFilterMode(root);
            requestGuideHighlightRefresh(root);
            closeResponsiveAdvancedFilters(root, 'participants');
        });
    }

    const refreshRoleMode = () => updateRoleFilterMode(root);
    window.addEventListener('resize', refreshRoleMode);
    window.requestAnimationFrame(refreshRoleMode);
    syncRoleFilterState(root);
};

const getSelectedItems = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"].' + selectedClass : '[data-selectable-type].' + selectedClass;
    return Array.from(root.querySelectorAll(selector));
};

const openConfirmModal = (root, message, onconfirm) => {
    const modal = root.querySelector('[data-easystud-confirm-modal]');
    const messageNode = root.querySelector('[data-easystud-confirm-modal-message]');
    const confirmButton = root.querySelector('[data-easystud-confirm-modal-submit]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-confirm-modal]');
    if (!modal || !messageNode || !confirmButton) {
        onconfirm();
        return;
    }

    const closeModal = () => {
        hideEasyStudModal(modal, () => {
            confirmButton.onclick = null;
        });
    };

    messageNode.textContent = message || '';
    showEasyStudModal(modal);
    confirmButton.onclick = () => {
        hideEasyStudModal(modal, () => {
            confirmButton.onclick = null;
            onconfirm();
        });
    };

    closeButtons.forEach(button => {
        button.onclick = closeModal;
    });

    modal.onclick = event => {
        if (event.target === modal) {
            closeModal();
        }
    };
};

const openGroupDropModeModal = (root, oncopy, onmove) => {
    const labels = getLabels(root);
    const modal = document.createElement('div');
    modal.className = 'local-groupimport-easystud-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML =
        '<div class="local-groupimport-easystud-modal__dialog local-groupimport-easystud-modal__dialog--confirm">' +
            '<div class="local-groupimport-easystud-modal__header">' +
                '<h3 class="h5 mb-0">' + (labels.groupdropmode || '') + '</h3>' +
                '<button type="button" class="local-groupimport-easystud-modal__close" data-easystud-choice-close="1">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-modal__body">' +
                '<p class="text-muted mb-0">' + (labels.groupdropmodedesc || '') + '</p>' +
                '<div class="local-groupimport-easystud-modal__footer">' +
                    '<button type="button" class="btn btn-outline-secondary" data-easystud-choice-copy="1">' +
                        (labels.groupdropcopy || '') +
                    '</button>' +
                    '<button type="button" class="btn btn-primary" data-easystud-choice-move="1">' +
                        (labels.groupdropmove || '') +
                    '</button>' +
                '</div>' +
            '</div>' +
        '</div>';

    const close = () => hideEasyStudModal(modal, () => modal.remove());
    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('[data-easystud-choice-close]')) {
            close();
            return;
        }
        if (event.target.closest('[data-easystud-choice-copy]')) {
            close();
            oncopy();
            return;
        }
        if (event.target.closest('[data-easystud-choice-move]')) {
            close();
            onmove();
        }
    });
    root.appendChild(modal);
};

const getSelectionInput = item => item.querySelector(':scope > .local-groupimport-easystud-selector [data-easystud-selector-input]');

const setItemSelected = (item, selected) => {
    item.classList.toggle(selectedClass, selected);
    const input = getSelectionInput(item);
    if (input) {
        input.checked = selected;
    }
};

const clearSelectionForType = (root, type, except) => {
    root.querySelectorAll('[data-selectable-type="' + type + '"].' + selectedClass).forEach(entry => {
        if (entry !== except) {
            setItemSelected(entry, false);
            if (type === 'grouping') {
                collapseGroupingSection(entry);
            }
        }
    });
};

const clearSelection = (root, type) => {
    const selector = type ? '[data-selectable-type="' + type + '"]' : '[data-selectable-type]';
    root.querySelectorAll(selector).forEach(item => setItemSelected(item, false));
    if (type === 'grouping') {
        collapseAllGroupings(root);
    }
};

const clearSelectionState = root => {
    const hadSelectedGroupings = getSelectedItems(root, 'grouping').length > 0;
    clearSelection(root);
    if (hadSelectedGroupings) {
        collapseAllGroupings(root);
    }
    root.querySelectorAll('[data-selectable-type]').forEach(item => {
        item.classList.remove(disabledSelectionClass, draggingClass, dropTargetClass);
        item.removeAttribute('aria-disabled');
    });
    root.querySelectorAll('[data-easystud-selector-input]').forEach(input => {
        input.checked = false;
        input.disabled = false;
    });
};

const getActiveSelectionType = root => {
    const types = ['participant', 'grouping', 'group', 'member'];
    return types.find(type => getSelectedItems(root, type).length > 0) || '';
};

const areSelectionTypesCompatible = (activetype, type) => {
    return !activetype || activetype === type;
};

const updateSelectionAvailability = root => {
    const activetype = getActiveSelectionType(root);

    root.querySelectorAll('[data-selectable-type]').forEach(item => {
        const type = item.getAttribute('data-selectable-type');
        const selected = item.classList.contains(selectedClass);
        const disabled = !!activetype && !areSelectionTypesCompatible(activetype, type) && !selected;
        item.classList.toggle(disabledSelectionClass, disabled);
        item.setAttribute('aria-disabled', disabled ? 'true' : 'false');

        const input = getSelectionInput(item);
        if (input) {
            input.disabled = disabled;
        }
    });
};

const updateParticipantEmptyState = root => {
    const list = root.querySelector('[data-easystud-participant-list]');
    if (!list) {
        return;
    }

    const users = Array.from(list.querySelectorAll('[data-easystud-user]'));
    const visibleUsers = users.filter(user => !user.hidden);
    let state = list.querySelector('[data-easystud-empty-state="participants"]');

    if (!state) {
        state = document.createElement('div');
        state.className = 'local-groupimport-easystud__empty-state';
        state.setAttribute('data-easystud-empty-state', 'participants');
        state.hidden = true;
        state.innerHTML = '<span class="fa fa-users" aria-hidden="true"></span><p class="mb-0"></p>';
    }

    placeManagedStateBeforeBottomPagination(list, state);

    const labels = getLabels(root);
    const message = users.length ?
        (labels.noparticipantsfiltered || '') :
        (list.getAttribute('data-empty-filtered-label') || labels.noparticipantsstate || '');
    const messageNode = state.querySelector('p');
    if (messageNode) {
        messageNode.textContent = message;
    }
    state.hidden = visibleUsers.length > 0;
};

const syncManagedEmptyState = (root, list, selector, key) => {
    if (!list) {
        return;
    }
    const labels = getLabels(root);
    let state = list.querySelector(':scope > [data-easystud-managed-empty="' + key + '"]');
    const items = Array.from(list.children).filter(item => item.matches(selector));
    const visible = items.some(item =>
        (!item.hidden || item.getAttribute('data-easystud-page-hidden') === '1'));
    if (!state) {
        state = document.createElement('div');
        state.className = 'local-groupimport-easystud-tree__empty local-groupimport-easystud-tree__empty--filtered';
        state.setAttribute('data-easystud-managed-empty', key);
    }
    placeManagedStateBeforeBottomPagination(list, state);
    if (items.length === 0 && (key === 'participant-groups' || key === 'structure-groups')) {
        state.textContent = labels.nogroupsincourse || '';
    } else if (key === 'structure-groupings' && items.length === 0) {
        state.textContent = labels.nogroupingsincourse || labels.nogroupingsavailable || '';
    } else {
        state.textContent = labels.noresultsfiltered || '';
    }
    state.hidden = visible;
};

const syncFilteredEmptyStates = root => {
    syncManagedEmptyState(root, root.querySelector('.local-groupimport-easystud-participant-groups__list'),
        '[data-easystud-group-id]', 'participant-groups');
    syncManagedEmptyState(root, root.querySelector('.local-groupimport-easystud-structure-groups__list'),
        '[data-easystud-group-id]', 'structure-groups');
    syncManagedEmptyState(root, root.querySelector('[data-easystud-tree] .local-groupimport-easystud-tree__groupings'),
        '[data-easystud-grouping-id]', 'structure-groupings');
};

const getEnabledActionButton = (root, selector) => {
    return Array.from(root.querySelectorAll(selector)).find(button => {
        return !button.disabled && !button.hidden && button.offsetParent !== null;
    }) || Array.from(root.querySelectorAll(selector)).find(button => !button.disabled && !button.hidden) || null;
};

const getMobileActionButton = (root, selector) => {
    return Array.from(root.querySelectorAll(selector)).find(button => {
        return !button.disabled && !button.hidden && button.getAttribute('aria-hidden') !== 'true';
    }) || null;
};

const getButtonText = button => {
    const text = button ? (button.textContent || '').replace(/\s+/g, ' ').trim() : '';
    return text || '';
};

const getButtonIcon = button => {
    const icon = button ? button.querySelector('.fa') : null;
    return icon ? Array.from(icon.classList).filter(classname => classname.indexOf('fa-') === 0).join(' ') : '';
};

const ensureMobileActionBar = root => {
    let bar = root.querySelector('[data-easystud-mobile-actions]');
    if (bar) {
        return bar;
    }

    bar = document.createElement('div');
    bar.className = 'local-groupimport-easystud-mobile-actions';
    bar.setAttribute('data-easystud-mobile-actions', '1');
    bar.setAttribute('role', 'region');
    bar.setAttribute('aria-live', 'polite');
    bar.hidden = true;
    bar.innerHTML =
        '<div class="local-groupimport-easystud-mobile-actions__summary" data-easystud-mobile-actions-summary></div>' +
        '<div class="local-groupimport-easystud-mobile-actions__buttons" data-easystud-mobile-actions-buttons></div>';
    root.appendChild(bar);
    return bar;
};

const guideBottomObstructionProperty = '--easyedu-guide-bottom-obstruction';

const syncGuideBottomObstruction = root => {
    const documentRoot = document.documentElement;
    const bar = root.querySelector('[data-easystud-mobile-actions]');
    if (!isResponsiveWorkspace() || !bar || bar.hidden || !bar.getClientRects().length) {
        documentRoot.style.removeProperty(guideBottomObstructionProperty);
        return;
    }

    const rect = bar.getBoundingClientRect();
    const clearance = Math.max(0, Math.ceil(window.innerHeight - rect.top + 8));
    documentRoot.style.setProperty(guideBottomObstructionProperty, clearance + 'px');
};

const scheduleGuideBottomObstruction = root => {
    if (root.easystudGuideBottomObstructionFrame) {
        window.cancelAnimationFrame(root.easystudGuideBottomObstructionFrame);
    }
    root.easystudGuideBottomObstructionFrame = window.requestAnimationFrame(() => {
        root.easystudGuideBottomObstructionFrame = null;
        syncGuideBottomObstruction(root);
    });
};

const bindGuideBottomObstruction = root => {
    const bar = ensureMobileActionBar(root);
    const refresh = () => scheduleGuideBottomObstruction(root);
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    if (window.ResizeObserver) {
        const observer = new window.ResizeObserver(refresh);
        observer.observe(bar);
        root.easystudGuideBottomObstructionObserver = observer;
    }
    refresh();
};

const renderMobileActionBar = (root, counts, activetype) => {
    const bar = ensureMobileActionBar(root);
    const summary = bar.querySelector('[data-easystud-mobile-actions-summary]');
    const buttons = bar.querySelector('[data-easystud-mobile-actions-buttons]');
    const total = counts.participant + counts.member + counts.group + counts.grouping;

    if (!buttons || !summary || !total) {
        bar.removeAttribute('data-easystud-mobile-actions-type');
        bar.hidden = true;
        return;
    }

    const actionSelectors = [];
    if (activetype === 'participant') {
        actionSelectors.push(
            '[data-easystud-message-selected-participants]',
            '[data-easystud-open-selected-user]',
            '[data-easystud-move-selected-participants]'
        );
    } else if (activetype === 'member') {
        actionSelectors.push('[data-easystud-message-selected-participants]', '[data-easystud-delete-selected-members]');
    } else if (activetype === 'group') {
        actionSelectors.push(
            '[data-easystud-move-selected-groups]',
            '[data-easystud-remove-selected-groups-from-groupings]',
            '[data-easystud-delete-selected-groups]'
        );
    } else if (activetype === 'grouping') {
        actionSelectors.push('[data-easystud-delete-selected-groupings]');
    }
    actionSelectors.push('[data-easystud-clear-all-selection]');

    const actions = actionSelectors.map(selector => {
        const button = getMobileActionButton(root, selector);
        return button ? {selector, button} : null;
    }).filter(Boolean);

    if (!actions.length) {
        bar.removeAttribute('data-easystud-mobile-actions-type');
        bar.hidden = true;
        return;
    }

    const labels = getLabels(root);
    const template = labels.selectioncounttemplate || '';
    summary.textContent = template.replace('__count__', String(total));
    bar.setAttribute('data-easystud-mobile-actions-type', activetype || '');
    buttons.innerHTML = '';
    actions.forEach(action => {
        const button = document.createElement('button');
        const source = action.button;
        const isdanger = source.classList.contains('btn-outline-danger') || source.classList.contains('btn-danger');
        const isprimary = source.classList.contains('btn-primary') || source.classList.contains('btn-outline-primary');
        button.type = 'button';
        button.className = 'btn btn-sm ' + (isdanger ? 'btn-outline-danger' : (isprimary ? 'btn-primary' : 'btn-outline-secondary'));
        button.setAttribute('data-easystud-mobile-action-trigger', action.selector);
        const icon = getButtonIcon(source);
        if (icon) {
            const iconNode = document.createElement('span');
            iconNode.className = 'fa ' + icon;
            iconNode.setAttribute('aria-hidden', 'true');
            button.appendChild(iconNode);
        }
        const textNode = document.createElement('span');
        textNode.textContent = getButtonText(source);
        button.appendChild(textNode);
        buttons.appendChild(button);
    });
    bar.hidden = false;
};

const updateSelectionActions = root => {
    const selectedUsers = getSelectedItems(root, 'participant');
    const selectedGroups = getSelectedItems(root, 'group');
    const selectedGroupings = getSelectedItems(root, 'grouping');
    const selectedMembers = getSelectedItems(root, 'member');
    const hasSelection = selectedUsers.length || selectedGroups.length || selectedGroupings.length || selectedMembers.length;
    const activetype = getActiveSelectionType(root);
    const labels = getLabels(root);
    const willSingleParticipantSelected = selectedUsers.length === 1 && !isResponsiveWorkspace();
    const previousExpandedParticipant = root.easystudExpandedParticipant || null;
    const nextExpandedParticipant = willSingleParticipantSelected ? selectedUsers[0] : null;
    const participantToResize = nextExpandedParticipant || previousExpandedParticipant;

    root.classList.toggle('local-groupimport-easystud--has-selection', !!hasSelection);
    const updateParticipantDensity = () => {
        root.classList.toggle('local-groupimport-easystud--single-participant-selected', willSingleParticipantSelected);
        if (previousExpandedParticipant && previousExpandedParticipant !== nextExpandedParticipant) {
            previousExpandedParticipant.classList.remove('is-density-expanded');
        }
        if (nextExpandedParticipant) {
            nextExpandedParticipant.classList.add('is-density-expanded');
        }
        if (participantToResize) {
            // Tag wrapping affects the card's natural height, so resolve it before Motion.resize measures the target.
            syncParticipantTagOverflow(participantToResize);
        }
    };
    if (participantToResize && previousExpandedParticipant !== nextExpandedParticipant &&
            root.classList.contains(compactClass)) {
        Motion.resize(participantToResize, updateParticipantDensity, {
            duration: Motion.timing.normal,
            onComplete: () => requestGuideHighlightRefresh(root),
        });
    } else {
        updateParticipantDensity();
    }
    root.easystudExpandedParticipant = nextExpandedParticipant;
    ['participant', 'member', 'group', 'grouping'].forEach(type => {
        root.classList.toggle('local-groupimport-easystud--selecting-' + type, activetype === type);
    });
    if (activetype) {
        root.setAttribute('data-easystud-selection-type', activetype);
    } else {
        root.removeAttribute('data-easystud-selection-type');
    }

    root.querySelectorAll('[data-easystud-clear-all-selection]').forEach(button => {
        button.hidden = !hasSelection;
        const frame = button.closest('[data-easystud-clear-selection-frame]');
        if (frame) {
            frame.hidden = !hasSelection;
            const count = frame.querySelector('[data-easystud-clear-selection-count]');
            if (count) {
                const template = labels.selectioncounttemplate || '';
                count.textContent = template.replace('__count__', String(
                    selectedUsers.length + selectedMembers.length + selectedGroups.length + selectedGroupings.length
                ));
            }
        }
    });

    const detailsButton = root.querySelector('[data-easystud-open-selected-user]');
    if (detailsButton) {
        detailsButton.disabled = selectedUsers.length !== 1;
    }

    const futureRemoveButton = root.querySelector('[data-easystud-remove-selected-users]');
    if (futureRemoveButton) {
        futureRemoveButton.disabled = true;
    }

    root.querySelectorAll('[data-easystud-delete-selected-groups]').forEach(button => {
        button.disabled = selectedGroups.length === 0;
    });

    root.querySelectorAll('[data-easystud-delete-selected-groupings]').forEach(button => {
        button.disabled = selectedGroupings.length === 0;
    });

    root.querySelectorAll('[data-easystud-delete-selected-members]').forEach(button => {
        button.disabled = selectedMembers.length === 0;
    });

    const moveParticipantsButton = root.querySelector('[data-easystud-move-selected-participants]');
    if (moveParticipantsButton) {
        moveParticipantsButton.disabled = selectedUsers.length === 0;
    }

    root.querySelectorAll('[data-easystud-message-selected-participants]').forEach(button => {
        button.disabled = selectedUsers.length === 0 && selectedMembers.length === 0;
    });

    root.querySelectorAll('[data-easystud-move-selected-groups]').forEach(button => {
        button.disabled = selectedGroups.length === 0;
    });
    root.querySelectorAll('[data-easystud-remove-selected-groups-from-groupings]').forEach(button => {
        button.disabled = getGroupsWithGroupingMembership(root, selectedGroups).length === 0;
    });

    renderMobileActionBar(root, {
        participant: selectedUsers.length,
        member: selectedMembers.length,
        group: selectedGroups.length,
        grouping: selectedGroupings.length,
    }, activetype);
    scheduleGuideBottomObstruction(root);

    updateSelectionAvailability(root);
    syncSelectedGroupingExpansion(root);
    syncPaginationSelectionControls(root);
};

// Bind multi-selection across participant, group, grouping and member items.
const bindSelection = root => {
    const lastSelectedByType = new Map();

    root.addEventListener('click', event => {
        if (event.target.closest('button, a, input, textarea, select, form, .local-groupimport-easystud-selector')) {
            return;
        }

        const item = event.target.closest('[data-selectable-type]');
        if (!item || !root.contains(item)) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, type)) {
            return;
        }
        const items = Array.from(root.querySelectorAll('[data-selectable-type="' + type + '"]:not([hidden])'));
        const lastSelected = lastSelectedByType.get(type);

        if (event.shiftKey && lastSelected) {
            const start = items.indexOf(lastSelected);
            const end = items.indexOf(item);
            if (start !== -1 && end !== -1) {
                const [from, to] = start < end ? [start, end] : [end, start];
                items.slice(from, to + 1).forEach(entry => setItemSelected(entry, true));
            }
        } else if (event.ctrlKey || event.metaKey) {
            setItemSelected(item, !item.classList.contains(selectedClass));
        } else {
            clearSelectionForType(root, type, item);
            setItemSelected(item, true);
        }

        lastSelectedByType.set(type, item);
        if (type === 'grouping' && getSelectedItems(root, 'grouping').length === 0) {
            collapseAllGroupings(root);
        }
        if (type === 'grouping') {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
    });

    root.addEventListener('change', event => {
        const input = event.target.closest('[data-easystud-selector-input]');
        if (!input || !root.contains(input)) {
            return;
        }

        const item = input.closest('[data-selectable-type]');
        if (!item) {
            return;
        }

        const type = item.getAttribute('data-selectable-type');
        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, type) && !item.classList.contains(selectedClass)) {
            input.checked = false;
            return;
        }
        setItemSelected(item, input.checked);
        lastSelectedByType.set(type, item);
        if (type === 'grouping' && getSelectedItems(root, 'grouping').length === 0) {
            collapseAllGroupings(root);
        }
        if (type === 'grouping') {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        updateSelectionActions(root);
    });

    root.addEventListener('click', event => {
        const clearButton = event.target.closest('[data-easystud-clear-all-selection]');
        if (!clearButton || !root.contains(clearButton)) {
            return;
        }
        clearSelectionState(root);
        updateSelectionActions(root);
        requestGuideHighlightRefresh(root);
    });

    root.addEventListener('click', event => {
        const mobileAction = event.target.closest('[data-easystud-mobile-action-trigger]');
        if (!mobileAction || !root.contains(mobileAction)) {
            return;
        }
        const selector = mobileAction.getAttribute('data-easystud-mobile-action-trigger');
        const target = selector ? getMobileActionButton(root, selector) : null;
        if (!target) {
            return;
        }
        event.preventDefault();
        target.click();
    });

    root.addEventListener('keydown', event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
            const selected = getSelectedItems(root, 'participant');
            if (!selected.length || !navigator.clipboard) {
                return;
            }
            event.preventDefault();
            const emails = selected.map(user => user.getAttribute('data-user-email')).filter(Boolean).join('\n');
            navigator.clipboard.writeText(emails);
        }
    });

    updateSelectionActions(root);
};

const animateTreeChildren = (children, expand, options = {}) => {
    if (!children) {
        return;
    }
    const root = children.closest('#local-groupimport-easystud');
    requestGuideHighlightRefresh(root);

    children.classList.add('is-tree-animating');
    const complete = () => {
        if (expand && options.syncAfter !== false) {
            if (children.classList.contains('local-groupimport-easystud-grouping__groups')) {
                window.requestAnimationFrame(() => {
                    syncGroupingGroupsCollapsible(children.closest('[data-easystud-grouping-id]'));
                    syncGroupMembersInContainer(children);
                });
            }
        }
        children.classList.remove('is-tree-animating');
        requestGuideHighlightRefresh(root);
    };

    if (options.animate === false) {
        children.hidden = !expand;
        complete();
        return Promise.resolve(true);
    }

    if (expand) {
        Motion.expand(children, {
            duration: Motion.timing.slow,
            prepare: () => {
                if (options.prepare === false) {
                    return;
                }
                syncGroupMembersInContainer(children);
                if (children.classList.contains('local-groupimport-easystud-tree__children')) {
                    syncGroupingGroupsCollapsible(children.closest('[data-easystud-grouping-id]'));
                }
            },
            onComplete: complete,
        });
    } else {
        Motion.collapse(children, {duration: Motion.timing.slow, onComplete: complete});
    }
};

const setInlinePanelOpen = (panel, open) => {
    if (!panel) {
        return Promise.resolve(false);
    }
    const root = panel.closest('#local-groupimport-easystud');
    requestGuideHighlightRefresh(root);

    panel.classList.toggle('is-open', open);
    const complete = () => requestGuideHighlightRefresh(root);
    if (open) {
        return Motion.expand(panel, {duration: Motion.timing.slow, onComplete: complete});
    }
    return Motion.collapse(panel, {duration: Motion.timing.slow, onComplete: complete});
};

// Bind collapsible tree sections.
const bindTree = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-collapse-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const section = toggle.closest('.local-groupimport-easystud-tree__section');
        const children = section ? section.querySelector('.local-groupimport-easystud-tree__children') : null;
        if (!children) {
            return;
        }
        const expanded = toggle.getAttribute('aria-expanded') !== 'false';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        section.classList.toggle('is-expanded', !expanded);
        const isUngrouped = section.classList.contains('local-groupimport-easystud-tree__section--ungrouped');
        animateTreeChildren(children, !expanded, isUngrouped ? {prepare: false, syncAfter: false} : {});
        if (isUngrouped) {
            const panel = section.querySelector('[data-easystud-container-search-panel="ungrouped"]');
            const input = panel ? panel.querySelector('[data-easystud-container-group-search="ungrouped"]') : null;
            setInlinePanelOpen(panel, !expanded).then(completed => {
                if (completed && !expanded && input) {
                    input.focus();
                }
            });
            if (expanded && input) {
                input.value = '';
                applyContainerGroupSearch(root);
            }
        }
        if (!expanded) {
            window.requestAnimationFrame(() => syncGroupingGroupsCollapsible(section));
        } else {
            const groupingGroupsToggle = section.querySelector('[data-easystud-grouping-groups-toggle]');
            if (groupingGroupsToggle) {
                groupingGroupsToggle.hidden = true;
            }
        }
        const icon = toggle.querySelector('.fa');
        if (icon) {
            icon.classList.toggle('fa-chevron-right', expanded);
            icon.classList.toggle('fa-chevron-down', !expanded);
        }
    });
};

// Return selected users, defaulting to the dragged user when needed.
const getSelectedUsersForDrag = (root, draggedUser) => {
    const selected = getSelectedItems(root, 'participant');
    if (selected.indexOf(draggedUser) === -1) {
        return [draggedUser];
    }
    return selected;
};

// Return selected groups, defaulting to the dragged group when needed.
const getSelectedGroupsForDrag = (root, draggedGroup) => {
    const selected = getSelectedItems(root, 'group');
    if (selected.indexOf(draggedGroup) === -1) {
        return [draggedGroup];
    }
    return selected;
};

const isParticipantCatalogGroup = (root, group) => {
    return !!(root.classList.contains(participantFocusClass) &&
        group &&
        group.closest('.local-groupimport-easystud-participant-groups__list'));
};

// Bind group drag and drop between groupings.
const bindGroupDragDrop = (root, courseId) => {
    let draggedGroups = [];
    let dragPreview = null;
    const labels = getLabels(root);

    const moveGroups = (groups, dropTarget, removefromorigin) => {
        const groupingid = dropTarget.getAttribute('data-easystud-grouping-drop') || '0';
        return Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid,
                removefromorigin: removefromorigin ? 1 : 0,
            }).then(response => {
                if (removefromorigin || groupingid === '0') {
                    moveGroupElementToGrouping(root, groupid, groupingid);
                } else if (!response.existing) {
                    copyGroupElementToGrouping(root, group, groupingid);
                }
                return response;
            });
        })).then(responses => {
            if (groupingid === '0') {
                return formatCountMessage(labels.groupsremovedfromgroupingscount || '', groups.length);
            }
            emitGuidedCompletion(root, 1, 'grouping');
            const added = responses.filter(response => !response.existing).length;
            const existing = responses.filter(response => response.existing).length;
            return formatMoveSummary(labels.groupsmovesummary || '', added, existing);
        });
    };

    root.addEventListener('dragstart', event => {
        if (isResponsiveDragSuppressed()) {
            event.preventDefault();
            return;
        }
        const group = event.target.closest('[data-easystud-group-id]');
        if (!group || !root.contains(group)) {
            return;
        }
        if (isParticipantCatalogGroup(root, group)) {
            event.preventDefault();
            return;
        }
        draggedGroups = getSelectedGroupsForDrag(root, group);
        root.classList.add('is-dragging-groups');
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedGroups.map(item => item.getAttribute('data-easystud-group-id')).join(','));
        dragPreview = setStackedDragImage(event, draggedGroups, 'group');
        const groupsToHide = draggedGroups.slice();
        window.requestAnimationFrame(() => {
            if (draggedGroups.length) {
                groupsToHide.forEach(item => item.classList.add(draggingClass));
            }
        });
    });

    root.addEventListener('dragend', () => {
        draggedGroups.forEach(item => item.classList.remove(draggingClass));
        draggedGroups = [];
        root.classList.remove('is-dragging-groups');
        removeDragPreview(dragPreview);
        dragPreview = null;
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
    });

    root.addEventListener('dragover', event => {
        moveDragPreview(dragPreview, event);
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-grouping-drop]');
        if (!draggedGroups.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        root.classList.remove('is-dragging-groups');
        dropTarget.classList.remove(dropTargetClass);
        const groupsToMove = draggedGroups.slice();
        const targetGroupingId = dropTarget.getAttribute('data-easystud-grouping-drop') || '0';
        const groupsChangingGrouping = groupsToMove.filter(group => getGroupingDropIdForGroup(group) !== targetGroupingId);
        if (!groupsChangingGrouping.length) {
            draggedGroups.forEach(group => group.classList.remove(draggingClass));
            draggedGroups = [];
            removeDragPreview(dragPreview);
            dragPreview = null;
            return;
        }
        const hasGroupingOrigin = groupsChangingGrouping.some(group => getGroupingDropIdForGroup(group) !== '0');
        const runChangingMove = removefromorigin => moveGroups(groupsChangingGrouping, dropTarget, removefromorigin).then(message => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, message, 'success');
        }).catch(() => {
            window.location.reload();
        });

        if (!root.classList.contains(participantFocusClass) && targetGroupingId !== '0' && hasGroupingOrigin) {
            openGroupDropModeModal(root, () => runChangingMove(false), () => runChangingMove(true));
            return;
        }

        // Groups dragged from the dedicated catalog do not represent one
        // specific origin grouping, so adding them remains non-destructive.
        // A nested group card has a concrete origin and is handled by the
        // copy-or-move modal above in every management view.
        if (root.classList.contains(structureFocusClass) && targetGroupingId !== '0') {
            runChangingMove(false);
            return;
        }

        runChangingMove(true);
    });
};

// Bind participant drag and drop into groups.
const bindUserDragDrop = (root, courseId) => {
    let draggedUsers = [];
    let dragPreview = null;
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    const emptyGroupingDropDisabledClass = 'is-user-drop-disabled';

    const syncEmptyGroupingDropState = enabled => {
        root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
            const children = grouping.querySelector(':scope > .local-groupimport-easystud-tree__children');
            const hasgroups = !!(children && children.querySelector(':scope > [data-easystud-group-id]'));
            grouping.classList.toggle(emptyGroupingDropDisabledClass, enabled && !hasgroups);
        });
    };

    const addUsersToGroup = (users, dropTarget) => {
        const groupid = dropTarget.getAttribute('data-easystud-user-drop');
        return postAction({
            courseid: courseId,
            action: 'addusers',
            groupid,
            userids: users.map(user => user.getAttribute('data-user-id')),
        }).then(response => {
            appendUsersToGroupCopies(root, groupid, users, labels);
            users.forEach(user => {
                const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                if (groupids.indexOf(groupid) === -1) {
                    groupids.push(groupid);
                    user.setAttribute('data-group-ids', groupids.join(','));
                }
            });
            applyFilters(root);
            return response;
        });
    };

    root.addEventListener('dragstart', event => {
        if (isResponsiveDragSuppressed()) {
            event.preventDefault();
            return;
        }
        const user = event.target.closest('[data-easystud-user]');
        if (!user || !root.contains(user)) {
            return;
        }
        draggedUsers = getSelectedUsersForDrag(root, user);
        root.classList.add('is-dragging-participants');
        syncEmptyGroupingDropState(true);
        event.dataTransfer.effectAllowed = 'copy';
        event.dataTransfer.setData('text/plain', draggedUsers.map(item => item.getAttribute('data-user-id')).join(','));
        dragPreview = setStackedDragImage(event, draggedUsers, 'participant');
        const usersToHide = draggedUsers.slice();
        window.requestAnimationFrame(() => {
            if (draggedUsers.length) {
                usersToHide.forEach(item => item.classList.add(draggingClass));
            }
        });
    });

    root.addEventListener('dragend', () => {
        draggedUsers.forEach(item => item.classList.remove(draggingClass));
        draggedUsers = [];
        root.classList.remove('is-dragging-participants');
        syncEmptyGroupingDropState(false);
        removeDragPreview(dragPreview);
        dragPreview = null;
        root.querySelectorAll('.' + dropTargetClass).forEach(target => target.classList.remove(dropTargetClass));
    });

    root.addEventListener('dragover', event => {
        moveDragPreview(dragPreview, event);
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        dropTarget.classList.add(dropTargetClass);
    });

    root.addEventListener('dragleave', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (dropTarget && !dropTarget.contains(event.relatedTarget)) {
            dropTarget.classList.remove(dropTargetClass);
        }
    });

    root.addEventListener('drop', event => {
        const dropTarget = event.target.closest('[data-easystud-user-drop]');
        if (!draggedUsers.length || !dropTarget || !root.contains(dropTarget)) {
            return;
        }
        event.preventDefault();
        root.classList.remove('is-dragging-participants');
        syncEmptyGroupingDropState(false);
        dropTarget.classList.remove(dropTargetClass);
        addUsersToGroup(draggedUsers, dropTarget).then(response => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, response.message || '', 'success');
            emitGuidedCompletion(root, 1);
            emitGuidedCompletion(root, 0, 'actions');
        }).catch(() => {
            showNotification(root, labels.ajaxerror || '', 'error');
        });
    });
};

const bindQuickCreate = (root, courseId) => {
    root.querySelectorAll('.local-groupimport-easystud-create').forEach(form => {
        form.addEventListener('submit', event => {
            event.preventDefault();

            const action = form.querySelector('input[name="action"]');
            const textinput = form.querySelector('input[type="text"]');
            if (!action || !textinput || !textinput.value.trim()) {
                return;
            }

            const payload = {
                courseid: courseId,
                action: action.value,
            };

            if (action.value === 'creategroup') {
                payload.groupname = textinput.value.trim();
            } else if (action.value === 'creategrouping') {
                payload.groupingname = textinput.value.trim();
            } else {
                return;
            }

            postAction(payload).then(response => {
                const createdGroups = response.groups || (response.group ? [response.group] : []);
                const createdGroupings = response.groupings || (response.grouping ? [response.grouping] : []);

                createdGroups.forEach(group => insertGroupData(root, group));
                createdGroupings.forEach(groupingdata => insertGroupingData(root, groupingdata));

                textinput.value = '';
                updateSelectionActions(root);
                ensureInlinePanelCancelButtons(root);
                syncUngroupedState(root, getLabels(root));
                root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => {
                    syncGroupingChildrenState(section, getLabels(root));
                });
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 0, 'main');
                if (action.value === 'creategrouping') {
                    emitGuidedCompletion(root, 0, 'grouping');
                }
            }).catch(error => {
                showNotification(root, error.message || '', 'error');
            });
        });
    });
};

const bindRenameForms = (root, courseId) => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-rename-toggle]');
        if (toggle && root.contains(toggle)) {
            const form = toggle.closest('.local-groupimport-easystud-rename');
            const input = form ? form.querySelector('input[name="name"]') : null;
            setRenameEditing(form, true);
            if (input) {
                input.focus();
                input.select();
            }
            return;
        }

        const cancel = event.target.closest('[data-easystud-rename-cancel]');
        if (cancel && root.contains(cancel)) {
            const form = cancel.closest('.local-groupimport-easystud-rename');
            setRenameEditing(form, false);
        }
    });

    root.addEventListener('submit', event => {
        const form = event.target.closest('.local-groupimport-easystud-rename');
        if (!form || !root.contains(form)) {
            return;
        }

        event.preventDefault();
        const action = form.querySelector('input[name="action"]');
        const nameinput = form.querySelector('input[name="name"]');
        if (!action || !nameinput || !nameinput.value.trim()) {
            return;
        }

        const payload = {
            courseid: courseId,
            action: action.value,
            name: nameinput.value.trim(),
        };

        const groupid = form.querySelector('input[name="groupid"]');
        const groupingid = form.querySelector('input[name="groupingid"]');
        if (groupid) {
            payload.groupid = groupid.value;
        }
        if (groupingid) {
            payload.groupingid = groupingid.value;
        }

        postAction(payload).then(response => {
            if (response.group) {
                getGroupElementsById(root, response.group.id).forEach(group => {
                    const name = group.querySelector('.local-groupimport-easystud-group__name');
                    if (name) {
                        name.textContent = response.group.name || '';
                    }
                    group.setAttribute('data-search-text', normalise(response.group.name || ''));
                    group.setAttribute('data-easystud-advanced-name', response.group.name || '');
                    const copyinput = group.querySelector('input[name="name"]');
                    if (copyinput) {
                        copyinput.value = response.group.rawname || response.group.name || '';
                    }
                });
                if (form) {
                    nameinput.value = response.group.rawname || response.group.name || '';
                }
            }

            if (response.grouping) {
                const grouping = root.querySelector('[data-easystud-grouping-id="' + response.grouping.id + '"]');
                if (grouping) {
                    const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
                    if (name) {
                        name.textContent = response.grouping.name || '';
                    }
                    grouping.setAttribute('data-search-text', normalise(response.grouping.name || ''));
                    grouping.setAttribute('data-easystud-advanced-name', response.grouping.name || '');
                    nameinput.value = response.grouping.rawname || response.grouping.name || '';
                }
            }

            rehydrateParticipantMembershipDetails(root);
            setRenameEditing(form, false);

            showNotification(root, response.message || '', 'success');
        }).catch(error => {
            showNotification(root, error.message || '', 'error');
        });
    });
};

const ensureGroupEmailPanel = (group, groupid, labels) => {
    if (!group || !groupid) {
        return null;
    }

    let panel = group.querySelector('[data-easystud-group-email-panel="' + groupid + '"]');
    if (panel) {
        return panel;
    }

    panel = document.createElement('div');
    panel.className = 'local-groupimport-easystud-group-email';
    panel.setAttribute('data-easystud-group-email-panel', groupid);
    panel.hidden = true;
    panel.innerHTML =
        '<textarea class="form-control form-control-sm" rows="3" placeholder="' +
            (labels.pasteemailsplaceholder || '') + '" data-easystud-group-email-box="' + groupid + '"></textarea>' +
        '<div class="local-groupimport-easystud-inline-actions">' +
            '<button type="button" class="btn btn-sm btn-primary" data-easystud-add-group-emails="' + groupid + '">' +
                '<span class="fa fa-plus me-1" aria-hidden="true"></span><span>' + (labels.addemails || '') + '</span>' +
            '</button>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-cancel-group-email="1">' +
                (labels.cancel || '') +
            '</button>' +
        '</div>' +
        '<div class="local-groupimport-easystud-group-email__result" data-easystud-group-email-result="' +
            groupid + '" aria-live="polite"></div>';
    group.appendChild(panel);
    return panel;
};

// Bind direct group email paste and member removal actions.
const bindGroupMemberActions = (root, courseId) => {
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    const knownIdentifiers = getKnownUserIdentifiers(root);

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-toggle-group-email]');
        if (toggle && root.contains(toggle)) {
            const groupid = toggle.getAttribute('data-easystud-toggle-group-email');
            const group = toggle.closest('[data-easystud-group-id]');
            const panel = ensureGroupEmailPanel(group, groupid, labels);
            if (panel) {
                const open = panel.hidden || !panel.classList.contains('is-open');
                const box = panel.querySelector('[data-easystud-group-email-box]');
                if (open && box) {
                    const result = panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]');
                    renderIdentifierPreview(box, result, knownIdentifiers);
                }
                const transition = setInlinePanelOpen(panel, open);
                if (open && box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus();
                        }
                    });
                }
            }
            return;
        }

        const cancelButton = event.target.closest('[data-easystud-cancel-group-email]');
        if (cancelButton && root.contains(cancelButton)) {
            const panel = cancelButton.closest('[data-easystud-group-email-panel]');
            if (panel) {
                setInlinePanelOpen(panel, false);
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-group-emails]');
        if (addButton && root.contains(addButton)) {
            const groupid = addButton.getAttribute('data-easystud-add-group-emails');
            const group = addButton.closest('[data-easystud-group-id]');
            const panel = ensureGroupEmailPanel(group, groupid, labels);
            const box = panel ? panel.querySelector('[data-easystud-group-email-box="' + groupid + '"]') : null;
            const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
            if (!group || !box) {
                return;
            }
            postAction({
                courseid: courseId,
                action: 'addemails',
                groupid,
                emails: box.value,
            }).then(response => {
                appendUsersToGroupCopies(root, groupid, response.users || [], labels);
                if (result) {
                    const missing = response.missing && response.missing.length ? ' - ' + response.missing.join(', ') : '';
                    result.textContent = (response.message || '') + missing;
                    result.classList.toggle('text-danger', !!missing);
                }
                box.value = '';
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
            return;
        }

        const removeButton = event.target.closest('[data-easystud-remove-member]');
        if (removeButton && root.contains(removeButton)) {
            const item = removeButton.closest('[data-easystud-member-id]');
            const selectedMembers = getSelectedItems(root, 'member');
            const members = item && item.classList.contains(selectedClass) && selectedMembers.indexOf(item) !== -1 &&
                selectedMembers.length > 1 ? selectedMembers : [item];
            removeMembers(root, courseId, members).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1, 'grouping');
            }).catch(() => window.location.reload());
        }
    });

    root.addEventListener('input', event => {
        const box = event.target.closest('[data-easystud-group-email-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        const groupid = box.getAttribute('data-easystud-group-email-box');
        const panel = box.closest('[data-easystud-group-email-panel]');
        const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
        renderIdentifierPreview(box, result, knownIdentifiers);
    });

    root.addEventListener('paste', event => {
        const box = event.target.closest('[data-easystud-group-email-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        window.setTimeout(() => {
            const groupid = box.getAttribute('data-easystud-group-email-box');
            const panel = box.closest('[data-easystud-group-email-panel]');
            const result = panel ? panel.querySelector('[data-easystud-group-email-result="' + groupid + '"]') : null;
            renderIdentifierPreview(box, result, knownIdentifiers);
        }, 0);
    });
};

// Bind direct grouping group paste actions.
const bindGroupingGroupActions = (root, courseId) => {
    const renderGroupPreview = box => {
        const groupingid = box.getAttribute('data-easystud-grouping-groups-box');
        const grouping = box.closest('[data-easystud-grouping-id]');
        const result = grouping ? grouping.querySelector('[data-easystud-grouping-groups-result="' + groupingid + '"]') : null;
        renderSmartIdentifierPreview(box, result, getKnownGroupIdentifiers(root), /[\r\n,;|]+/u);
    };

    root.addEventListener('click', event => {
        const removeButton = event.target.closest('[data-easystud-remove-from-grouping]');
        if (removeButton && root.contains(removeButton)) {
            const groupid = removeButton.getAttribute('data-easystud-remove-from-grouping');
            postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: 0,
            }).then(response => {
                moveGroupElementToGrouping(root, groupid, 0);
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1);
            }).catch(() => window.location.reload());
            return;
        }

        const toggle = event.target.closest('[data-easystud-toggle-grouping-groups]');
        if (toggle && root.contains(toggle)) {
            const groupingid = toggle.getAttribute('data-easystud-toggle-grouping-groups');
            const grouping = toggle.closest('[data-easystud-grouping-id]');
            const panel = grouping ? grouping.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]') : null;
            if (panel) {
                const open = panel.hidden || !panel.classList.contains('is-open');
                const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                if (open && box) {
                    renderGroupPreview(box);
                }
                const transition = setInlinePanelOpen(panel, open);
                if (open && box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus();
                        }
                    });
                }
            }
            return;
        }

        const cancelButton = event.target.closest('[data-easystud-cancel-grouping-groups]');
        if (cancelButton && root.contains(cancelButton)) {
            const panel = cancelButton.closest('[data-easystud-grouping-groups-panel]');
            if (panel) {
                setInlinePanelOpen(panel, false);
            }
            return;
        }

        const addButton = event.target.closest('[data-easystud-add-grouping-groups]');
        if (addButton && root.contains(addButton)) {
            const groupingid = addButton.getAttribute('data-easystud-add-grouping-groups');
            const grouping = addButton.closest('[data-easystud-grouping-id]');
            const box = grouping ? grouping.querySelector('[data-easystud-grouping-groups-box="' + groupingid + '"]') : null;
            const result = grouping ? grouping.querySelector('[data-easystud-grouping-groups-result="' + groupingid + '"]') : null;
            if (!box) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'addgroups',
                groupingid,
                groups: box.value,
            }).then(response => {
                (response.groups || []).forEach(group => {
                    moveGroupElementToGrouping(root, group.id, groupingid);
                });
                if (result) {
                    let details = '';
                    if (response.missing && response.missing.length) {
                        details += ' - ' + response.missing.join(', ');
                    }
                    if (response.ambiguous && response.ambiguous.length) {
                        details += ' - ' + response.ambiguous.join(', ');
                    }
                    result.textContent = (response.message || '') + details;
                    result.classList.toggle('text-danger', !!details);
                }
                box.value = '';
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1, 'grouping');
            }).catch(() => window.location.reload());
        }
    });

    root.addEventListener('input', event => {
        const box = event.target.closest('[data-easystud-grouping-groups-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        renderGroupPreview(box);
    });

    root.addEventListener('paste', event => {
        const box = event.target.closest('[data-easystud-grouping-groups-box]');
        if (!box || !root.contains(box)) {
            return;
        }
        window.setTimeout(() => renderGroupPreview(box), 0);
    });

};

const ensureInlinePanelCancelButtons = root => {
    const labels = getLabels(root);
    root.querySelectorAll('[data-easystud-group-email-panel]').forEach(panel => {
        if (panel.querySelector('[data-easystud-cancel-group-email]')) {
            return;
        }
        const add = panel.querySelector('[data-easystud-add-group-emails]');
        if (!add) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'local-groupimport-easystud-inline-actions';
        add.parentNode.insertBefore(wrapper, add);
        wrapper.appendChild(add);
        add.classList.remove('mt-2');
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-sm btn-outline-secondary';
        cancel.setAttribute('data-easystud-cancel-group-email', '1');
        cancel.textContent = labels.cancel || '';
        wrapper.appendChild(cancel);
    });

    root.querySelectorAll('[data-easystud-grouping-groups-panel]').forEach(panel => {
        if (panel.querySelector('[data-easystud-cancel-grouping-groups]')) {
            return;
        }
        const add = panel.querySelector('[data-easystud-add-grouping-groups]');
        if (!add) {
            return;
        }
        const wrapper = document.createElement('div');
        wrapper.className = 'local-groupimport-easystud-inline-actions';
        add.parentNode.insertBefore(wrapper, add);
        wrapper.appendChild(add);
        add.classList.remove('mt-2');
        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'btn btn-sm btn-outline-secondary';
        cancel.setAttribute('data-easystud-cancel-grouping-groups', '1');
        cancel.textContent = labels.cancel || '';
        wrapper.appendChild(cancel);
    });
};

const bindBulkActions = (root, courseId) => {
    root.querySelectorAll('[data-easystud-delete-selected-groups]').forEach(deleteGroupsButton => {
        deleteGroupsButton.addEventListener('click', () => {
            const selectedGroups = getSelectedItems(root, 'group');
            const groupids = selectedGroups.map(group => group.getAttribute('data-selectable-id'));
            if (!groupids.length) {
                return;
            }

            const hasmembers = selectedGroups.some(group => group.querySelector('[data-easystud-member-id]'));
            const runDelete = () => {
                postAction({
                    courseid: courseId,
                    action: 'deletegroups',
                    groupids,
                }).then(response => {
                    groupids.forEach(groupid => deleteGroupElement(root, groupid));
                    clearSelectionState(root);
                    updateSelectionActions(root);
                    showNotification(root, response.message || '', 'success');
                }).catch(() => window.location.reload());
            };

            if (hasmembers) {
                openConfirmModal(root, getLabels(root).confirmdeletegroups || '', runDelete);
                return;
            }

            runDelete();
        });
    });

    root.querySelectorAll('[data-easystud-delete-selected-groupings]').forEach(deleteGroupingsButton => {
        deleteGroupingsButton.addEventListener('click', () => {
            const selectedGroupings = getSelectedItems(root, 'grouping');
            const groupingids = selectedGroupings.map(grouping => grouping.getAttribute('data-selectable-id'));
            if (!groupingids.length) {
                return;
            }

            const hasgroups = selectedGroupings.some(grouping => {
                return grouping.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length > 0;
            });
            const runDelete = () => {
                postAction({
                    courseid: courseId,
                    action: 'deletegroupings',
                    groupingids,
                }).then(response => {
                    groupingids.forEach(groupingid => deleteGroupingElement(root, groupingid));
                    clearSelectionState(root);
                    updateSelectionActions(root);
                    showNotification(root, response.message || '', 'success');
                }).catch(() => window.location.reload());
            };

            if (hasgroups) {
                openConfirmModal(root, getLabels(root).confirmdeletegroupings || '', runDelete);
                return;
            }

            runDelete();
        });
    });

    root.querySelectorAll('[data-easystud-delete-selected-members]').forEach(deleteMembersButton => {
        deleteMembersButton.addEventListener('click', () => {
            const selectedMembers = getSelectedItems(root, 'member');
            if (!selectedMembers.length) {
                return;
            }
            removeMembers(root, courseId, selectedMembers).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        });
    });

    root.querySelectorAll('[data-easystud-remove-selected-groups-from-groupings]').forEach(removeGroupsButton => {
        removeGroupsButton.addEventListener('click', () => {
            removeGroupsFromGroupings(root, courseId, getSelectedItems(root, 'group'))
                .catch(() => window.location.reload());
        });
    });
};

const bindMoveModal = (root, courseId) => {
    const modal = root.querySelector('[data-easystud-move-modal]');
    const openParticipants = root.querySelectorAll('[data-easystud-move-selected-participants]');
    const openGroups = root.querySelectorAll('[data-easystud-move-selected-groups]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-move-modal]');
    const confirmButton = root.querySelector('[data-easystud-confirm-move]');
    const destination = root.querySelector('[data-easystud-move-destination]');
    const removeOriginWrap = root.querySelector('[data-easystud-move-origin-wrap]');
    const removeOrigin = root.querySelector('[data-easystud-move-remove-origin]');
    const help = root.querySelector('[data-easystud-move-modal-help]');
    const label = root.querySelector('[data-easystud-move-modal-label]');
    const emptyState = root.querySelector('[data-easystud-move-empty]');
    const body = modal ? modal.querySelector('.local-groupimport-easystud-modal__body') : null;
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');

    if (!modal || !confirmButton || !destination || !help || !label || !body) {
        return;
    }

    let contextType = '';

    const closeModal = () => {
        hideEasyStudModal(modal, () => {
            contextType = '';
        });
    };

    const buildOptions = type => {
        destination.innerHTML = '';
        let hasDestination = false;

        if (type === 'participant') {
            const seen = new Set();
            root.querySelectorAll('[data-easystud-tree] [data-easystud-group-id]').forEach(group => {
                const value = group.getAttribute('data-easystud-group-id') || '';
                if (!value || seen.has(value)) {
                    return;
                }
                seen.add(value);
                const option = document.createElement('option');
                option.value = value;
                option.textContent = getGroupName(group);
                destination.appendChild(option);
                hasDestination = true;
            });
            return hasDestination;
        }

        root.querySelectorAll('[data-easystud-grouping-id]').forEach(grouping => {
            const option = document.createElement('option');
            option.value = grouping.getAttribute('data-easystud-grouping-id') || '';
            const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
            option.textContent = name ? name.textContent.trim() : '';
            destination.appendChild(option);
            hasDestination = true;
        });

        if (hasDestination) {
            const ungrouped = root.querySelector('.local-groupimport-easystud-tree__section--ungrouped .local-groupimport-easystud-tree__toggle');
            const ungroupedOption = document.createElement('option');
            ungroupedOption.value = '0';
            ungroupedOption.textContent = ungrouped ? ungrouped.textContent.trim() : (labels.groupswithoutgrouping || '');
            destination.insertBefore(ungroupedOption, destination.firstChild);
        }

        return hasDestination;
    };

    const openModal = type => {
        contextType = type;
        const selectedCount = type === 'participant' ? getSelectedItems(root, 'participant').length :
            getSelectedItems(root, 'group').length;
        help.textContent = body.getAttribute(type === 'participant' ? 'data-move-participants-help' : 'data-move-groups-help') || '';
        label.textContent = body.getAttribute(type === 'participant' ? 'data-move-participants-label' : 'data-move-groups-label') || '';
        confirmButton.textContent = selectedCount === 1 ?
            (labels.moveconfirmone || '') :
            (labels.moveconfirmmany || '');
        if (removeOriginWrap) {
            const selectedGroups = type === 'group' ? getSelectedItems(root, 'group') : [];
            removeOriginWrap.hidden = type !== 'group' || getGroupsWithGroupingMembership(root, selectedGroups).length === 0;
        }
        if (removeOrigin) {
            removeOrigin.checked = false;
        }
        const hasDestination = buildOptions(type);
        confirmButton.disabled = !hasDestination;
        destination.hidden = !hasDestination;
        label.hidden = !hasDestination;
        if (emptyState) {
            emptyState.hidden = hasDestination;
            emptyState.textContent = type === 'participant' ?
                (labels.nomovegroupsavailable || '') :
                (labels.nomovegroupingsavailable || '');
        }
        showEasyStudModal(modal);
        if (hasDestination) {
            destination.focus();
        } else if (emptyState) {
            emptyState.focus();
        }
    };

    openParticipants.forEach(button => button.addEventListener('click', () => openModal('participant')));

    openGroups.forEach(button => button.addEventListener('click', () => openModal('group')));

    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeModal();
        }
    });

    confirmButton.addEventListener('click', () => {
        const value = destination.value;
        if (!contextType || !value) {
            return;
        }

        if (contextType === 'participant') {
            const users = getSelectedItems(root, 'participant');
            const group = root.querySelector('[data-easystud-user-drop="' + value + '"]');
            if (!users.length || !group) {
                return;
            }

            postAction({
                courseid: courseId,
                action: 'addusers',
                groupid: value,
                userids: users.map(user => user.getAttribute('data-user-id')),
            }).then(response => {
                appendUsersToGroupCopies(root, value, users, labels);
                users.forEach(user => {
                    const groupids = (user.getAttribute('data-group-ids') || '').split(',').filter(Boolean);
                    if (groupids.indexOf(value) === -1) {
                        groupids.push(value);
                        user.setAttribute('data-group-ids', groupids.join(','));
                    }
                });
                applyFilters(root);
                closeModal();
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
                emitGuidedCompletion(root, 1);
                emitGuidedCompletion(root, 1, 'actions');
            }).catch(() => window.location.reload());
            return;
        }

        const groups = getSelectedItems(root, 'group');
        if (!groups.length) {
            return;
        }

        Promise.all(groups.map(group => {
            const groupid = group.getAttribute('data-easystud-group-id');
            return postAction({
                courseid: courseId,
                action: 'movegroup',
                groupid,
                groupingid: value,
                removefromorigin: removeOrigin && removeOrigin.checked ? 1 : 0,
            }).then(response => {
                if ((removeOrigin && removeOrigin.checked) || value === '0') {
                    moveGroupElementToGrouping(root, groupid, value);
                } else if (!response.existing) {
                    copyGroupElementToGrouping(root, group, value);
                }
                return response;
            });
        })).then(responses => {
            closeModal();
            clearSelectionState(root);
            updateSelectionActions(root);
            if (value === '0') {
                showNotification(root, formatCountMessage(labels.groupsremovedfromgroupingscount, groups.length), 'success');
                return;
            }
            const added = responses.filter(response => !response.existing).length;
            const existing = responses.filter(response => response.existing).length;
            showNotification(root, formatMoveSummary(labels.groupsmovesummary || '', added, existing), 'success');
            emitGuidedCompletion(root, 1, 'actions');
            emitGuidedCompletion(root, 1, 'grouping');
        }).catch(() => window.location.reload());
    });
};

const bindParticipantMessaging = root => {
    root.querySelectorAll('[data-easystud-message-selected-participants]').forEach(button => {
        button.addEventListener('click', () => {
            openParticipantMessageModal(root, getSelectedMessageUserIds(root));
        });
    });
};

const bindDuplicateActions = (root, courseId) => {
    root.addEventListener('click', event => {
        const groupButton = event.target.closest('[data-easystud-duplicate-group]');
        if (groupButton && root.contains(groupButton)) {
            event.preventDefault();
            postAction({
                courseid: courseId,
                action: 'duplicategroup',
                groupid: groupButton.getAttribute('data-easystud-duplicate-group'),
            }).then(response => {
                if (response.group) {
                    insertGroupData(root, response.group);
                }
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
            return;
        }

        const groupingButton = event.target.closest('[data-easystud-duplicate-grouping]');
        if (groupingButton && root.contains(groupingButton)) {
            event.preventDefault();
            postAction({
                courseid: courseId,
                action: 'duplicategrouping',
                groupingid: groupingButton.getAttribute('data-easystud-duplicate-grouping'),
            }).then(response => {
                if (response.grouping) {
                    insertGroupingData(root, response.grouping);
                }
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        }
    });
};

// Bind right-click menus for fast local actions.
const bindContextMenu = (root, courseId) => {
    const menu = root.querySelector('[data-easystud-context-menu]');
    const backdrop = root.querySelector('[data-easystud-context-backdrop]');
    if (!menu) {
        return;
    }

    let context = null;
    let returnFocus = null;

    const hideMenu = () => {
        menu.hidden = true;
        menu.classList.remove('is-mobile-sheet');
        root.querySelectorAll('[data-easystud-card-menu][aria-expanded="true"]').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
        if (backdrop) {
            backdrop.hidden = true;
        }
        context = null;
        if (returnFocus && document.contains(returnFocus)) {
            returnFocus.focus({preventScroll: true});
        }
        returnFocus = null;
    };

    const getContextItems = (type, target) => {
        const selectors = {
            participant: '[data-easystud-user]',
            group: '[data-easystud-group-id]',
            grouping: '[data-easystud-grouping-id]',
            member: '[data-easystud-member-id]',
            'paste-field': 'textarea',
        };
        const selector = selectors[type] || '';
        return selector ? getSelectedItemsForContext(root, selector, target) : (target ? [target] : []);
    };

    const pasteIntoField = box => {
        if (!box || !navigator.clipboard || !navigator.clipboard.readText) {
            return Promise.reject(new Error('Clipboard unavailable'));
        }
        return navigator.clipboard.readText().then(text => {
            const start = typeof box.selectionStart === 'number' ? box.selectionStart : box.value.length;
            const end = typeof box.selectionEnd === 'number' ? box.selectionEnd : box.value.length;
            box.value = box.value.slice(0, start) + text + box.value.slice(end);
            const position = start + text.length;
            box.setSelectionRange(position, position);
            box.dispatchEvent(new Event('input', {bubbles: true}));
            box.focus();
        });
    };

    const addCopiedUsersToGroup = group => {
        if (!group || !navigator.clipboard || !navigator.clipboard.readText) {
            return Promise.reject(new Error('Clipboard unavailable'));
        }
        const labels = getLabels(root);
        const groupid = group.getAttribute('data-easystud-group-id');
        return navigator.clipboard.readText().then(text => postAction({
            courseid: courseId,
            action: 'addemails',
            groupid,
            emails: text,
        })).then(response => {
            appendUsersToGroupCopies(root, groupid, response.users || [], labels);
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, response.message || '', 'success');
            emitGuidedCompletion(root, 1, 'grouping');
        });
    };

    const addCopiedGroupsToGrouping = grouping => {
        if (!grouping || !navigator.clipboard || !navigator.clipboard.readText) {
            return Promise.reject(new Error('Clipboard unavailable'));
        }
        const groupingid = grouping.getAttribute('data-easystud-grouping-id');
        return navigator.clipboard.readText().then(text => postAction({
            courseid: courseId,
            action: 'addgroups',
            groupingid,
            groups: text,
        })).then(response => {
            (response.groups || []).forEach(group => {
                const sourceGroup = getTreeGroupElementsById(root, group.id)[0] || null;
                copyGroupElementToGrouping(root, sourceGroup, groupingid);
            });
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, response.message || '', 'success');
            emitGuidedCompletion(root, 1, 'grouping');
        });
    };

    const canOpenAdvancedSettingsFromContext = (items, target) => {
        const metadata = [
            'data-easystud-advanced-name',
            'data-easystud-advanced-raw-description',
            'data-easystud-advanced-idnumber',
            'data-easystud-advanced-count',
            'data-easystud-advanced-native-url',
        ];
        if (!isResponsiveWorkspace() || items.length !== 1 || !target ||
                !target.matches('[data-easystud-group-id][data-easystud-advanced-type="group"]') ||
                !metadata.every(attribute => target.hasAttribute(attribute)) ||
                !target.getAttribute('data-easystud-advanced-native-url')) {
            return false;
        }

        const header = target.querySelector(':scope > .local-groupimport-easystud-group__header');
        return !!header && !header.querySelector(':scope > [data-easystud-open-advanced-settings]');
    };

    const restoreContextFocusAfterAdvancedSettingsClose = opener => {
        const modal = root.querySelector('[data-easystud-advanced-settings-modal]');
        if (!modal || !opener) {
            return;
        }
        modal.addEventListener('click', event => {
            if (event.target !== modal && !event.target.closest('[data-easystud-close-advanced-settings]')) {
                return;
            }
            window.setTimeout(() => {
                if (document.contains(opener)) {
                    opener.focus({preventScroll: true});
                }
            }, 0);
        });
    };

    const setVisibleActions = (type, target) => {
        const items = getContextItems(type, target);
        menu.querySelectorAll('[data-easystud-context-action]').forEach(button => {
            const contexts = (button.getAttribute('data-easystud-contexts') || '').split(' ');
            let hidden = contexts.indexOf(type) === -1;
            if (!hidden && items.length > 1) {
                const action = button.getAttribute('data-easystud-context-action');
                if ([
                    'participant-open-details',
                    'group-paste-emails',
                    'group-add-copied-users',
                    'group-focus-rename',
                    'grouping-paste-groups',
                    'grouping-add-copied-groups',
                    'grouping-focus-rename',
                    'copy-grouping-name',
                    'paste-field',
                ].indexOf(action) !== -1) {
                    hidden = true;
                }
            }
            if (!hidden && button.getAttribute('data-easystud-context-action') === 'participant-open-details' &&
                    !root.querySelector('[data-easystud-open-user]') &&
                    !root.querySelector('[data-easystud-open-selected-user]')) {
                hidden = true;
            }
            if (!hidden && button.getAttribute('data-easystud-context-action') === 'group-remove-from-grouping' &&
                    getGroupsWithGroupingMembership(root, items).length === 0) {
                hidden = true;
            }
            if (!hidden && button.getAttribute('data-easystud-context-action') === 'grouping-select-groups' &&
                    !items.some(item => getGroupsInGrouping(item).length > 0)) {
                hidden = true;
            }
            if (!hidden && button.getAttribute('data-easystud-context-action') === 'group-open-advanced-settings' &&
                    !canOpenAdvancedSettingsFromContext(items, target)) {
                hidden = true;
            }
            button.hidden = hidden;

            const text = button.querySelector('[data-easystud-context-text]');
            if (text) {
                const label = button.getAttribute(items.length > 1 ? 'data-easystud-context-multi-label' :
                    'data-easystud-context-label') || button.getAttribute('data-easystud-context-label') || '';
                text.textContent = label;
            }
        });
    };

    const syncMaskedGroupingMenuAction = (type, target) => {
        menu.querySelectorAll('[data-easystud-masked-pill-action]').forEach(button => button.remove());
        if (type !== 'group' || !target || isResponsiveWorkspace() ||
                !target.classList.contains('is-groupings-summary-hidden')) {
            return;
        }

        const summary = target.querySelector(
            ':scope > .local-groupimport-easystud-group__header ' +
            '[data-easystud-grouping-summary-toggle]'
        );
        if (!summary) {
            return;
        }

        const item = document.createElement('button');
        const icon = document.createElement('span');
        const text = document.createElement('span');
        item.type = 'button';
        item.setAttribute('data-easystud-masked-pill-action', 'grouping-summary-toggle');
        item.setAttribute('role', 'menuitem');
        item.setAttribute('aria-label', summary.getAttribute('aria-label') || summary.textContent.trim());
        icon.className = 'fa fa-layer-group';
        icon.setAttribute('aria-hidden', 'true');
        text.textContent = summary.textContent.trim();
        item.append(icon, text);

        const list = menu.querySelector('.local-groupimport-easystud-context-menu__list');
        if (list) {
            list.insertBefore(item, list.firstChild);
        }
    };

    const showMenu = (event, type, target) => {
        event.preventDefault();
        context = {type, target};
        returnFocus = event.currentTarget && event.currentTarget.focus ? event.currentTarget : target;
        if (returnFocus && returnFocus.matches && returnFocus.matches('[data-easystud-card-menu]')) {
            returnFocus.setAttribute('aria-expanded', 'true');
        }
        setVisibleActions(type, target);
        syncMaskedGroupingMenuAction(type, target);
        menu.hidden = false;
        const mobile = isResponsiveWorkspace();
        menu.classList.toggle('is-mobile-sheet', mobile);
        if (backdrop) {
            backdrop.hidden = !mobile;
        }
        if (mobile) {
            menu.style.removeProperty('left');
            menu.style.removeProperty('top');
        } else {
            const rect = menu.getBoundingClientRect();
            const left = Math.min(event.clientX, window.innerWidth - rect.width - 8);
            const top = Math.min(event.clientY, window.innerHeight - rect.height - 8);
            menu.style.left = Math.max(8, left) + 'px';
            menu.style.top = Math.max(8, top) + 'px';
        }
        const first = menu.querySelector(
            '[data-easystud-masked-pill-action]:not([hidden]), ' +
            '[data-easystud-context-action]:not([hidden])'
        );
        if (first) {
            first.focus({preventScroll: true});
        }
    };

    const getContextTarget = event => {
        const pasteField = event.target.closest('[data-easystud-group-email-box], [data-easystud-grouping-groups-box]');
        if (pasteField && root.contains(pasteField)) {
            return {type: 'paste-field', target: pasteField};
        }

        const member = event.target.closest('[data-easystud-member-id]');
        if (member && root.contains(member)) {
            return {type: 'member', target: member};
        }

        const group = event.target.closest('[data-easystud-group-id]');
        if (group && root.contains(group)) {
            return {type: 'group', target: group};
        }

        const grouping = event.target.closest('[data-easystud-grouping-id]');
        if (grouping && root.contains(grouping)) {
            return {type: 'grouping', target: grouping};
        }

        const user = event.target.closest('[data-easystud-user]');
        if (user && root.contains(user)) {
            return {type: 'participant', target: user};
        }

        return null;
    };

    const prepareContextSelection = item => {
        if (item.type === 'paste-field') {
            return;
        }
        const target = item.target;
        if (!target || target.classList.contains(selectedClass)) {
            return;
        }

        const activetype = getActiveSelectionType(root);
        if (!areSelectionTypesCompatible(activetype, item.type)) {
            clearSelectionState(root);
        } else {
            clearSelectionForType(root, item.type, target);
        }
        setItemSelected(target, true);
        updateSelectionActions(root);
    };

    const ensureCardMenuButtons = () => {
        root.querySelectorAll('[data-easystud-user], [data-easystud-group-id], [data-easystud-grouping-id]').forEach(card => {
            if (card.querySelector(':scope > [data-easystud-card-menu], ' +
                ':scope > .local-groupimport-easystud-group__header > [data-easystud-card-menu], ' +
                ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-card-menu]')) {
                return;
            }
            const existing = card.querySelector(
                ':scope > .local-groupimport-easystud-group__header > [data-easystud-group-actions-toggle], ' +
                ':scope > .local-groupimport-easystud-grouping__header > [data-easystud-group-actions-toggle]'
            );
            if (existing) {
                normaliseCardMenuButton(existing, root);
                return;
            }
            const button = document.createElement('button');
            button.type = 'button';
            normaliseCardMenuButton(button, root);
            card.appendChild(button);
        });
    };

    root.addEventListener('click', event => {
        const trigger = event.target.closest('[data-easystud-card-menu]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }
        event.stopPropagation();
        const item = getContextTarget({target: trigger});
        if (!item) {
            return;
        }
        prepareContextSelection(item);
        showMenu({
            preventDefault: () => event.preventDefault(),
            clientX: trigger.getBoundingClientRect().right,
            clientY: trigger.getBoundingClientRect().bottom,
            currentTarget: trigger,
        }, item.type, item.target);
    });
    ensureCardMenuButtons();
    let cardMenuRefreshFrame = null;
    const cardMenuObserver = new MutationObserver(mutations => {
        if (!mutations.some(mutation => mutation.addedNodes.length) || cardMenuRefreshFrame !== null) {
            return;
        }
        cardMenuRefreshFrame = window.requestAnimationFrame(() => {
            cardMenuRefreshFrame = null;
            ensureCardMenuButtons();
        });
    });
    cardMenuObserver.observe(root, {childList: true, subtree: true});

    root.addEventListener('contextmenu', event => {
        const item = getContextTarget(event);
        if (!item) {
            return;
        }
        prepareContextSelection(item);
        showMenu(event, item.type, item.target);
        emitGuidedCompletion(root, 2, 'actions');
    });

    let longPressTimer = null;
    let longPressPoint = null;
    let suppressNextDocumentClick = false;
    const clearLongPress = () => {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
        longPressPoint = null;
        root.classList.remove('local-groupimport-easystud--long-press-armed');
    };

    root.addEventListener('pointerdown', event => {
        if (!isResponsiveDragSuppressed() || event.pointerType === 'mouse' || event.button > 0 ||
                event.target.closest('button, a, input, textarea, select, form, .local-groupimport-easystud-selector')) {
            return;
        }
        const item = getContextTarget(event);
        if (!item) {
            return;
        }
        longPressPoint = {x: event.clientX, y: event.clientY};
        root.classList.add('local-groupimport-easystud--long-press-armed');
        longPressTimer = window.setTimeout(() => {
            prepareContextSelection(item);
            suppressNextDocumentClick = true;
            showMenu({
                preventDefault: () => {},
                clientX: longPressPoint.x,
                clientY: longPressPoint.y,
            }, item.type, item.target);
            window.setTimeout(() => {
                suppressNextDocumentClick = false;
            }, 700);
            clearLongPress();
        }, 520);
    }, true);

    root.addEventListener('pointermove', event => {
        if (!longPressPoint) {
            return;
        }
        if (Math.abs(event.clientX - longPressPoint.x) > 10 || Math.abs(event.clientY - longPressPoint.y) > 10) {
            clearLongPress();
        }
    }, true);

    root.addEventListener('pointerup', clearLongPress, true);
    root.addEventListener('pointercancel', clearLongPress, true);
    root.addEventListener('scroll', clearLongPress, true);

    menu.addEventListener('click', event => {
        const maskedPillAction = event.target.closest('[data-easystud-masked-pill-action]');
        if (maskedPillAction && context) {
            const target = context.target;
            hideMenu();
            if (maskedPillAction.getAttribute('data-easystud-masked-pill-action') ===
                    'grouping-summary-toggle') {
                const summary = target.querySelector(
                    ':scope > .local-groupimport-easystud-group__header ' +
                    '[data-easystud-grouping-summary-toggle]'
                );
                if (summary) {
                    summary.click();
                }
            }
            return;
        }

        const button = event.target.closest('[data-easystud-context-action]');
        if (!button || !context) {
            return;
        }

        const action = button.getAttribute('data-easystud-context-action');
        const contextType = context.type;
        const target = context.target;
        hideMenu();

        if (action === 'copy-participant-field') {
            const fieldkey = button.getAttribute('data-easystud-context-field') || '';
            const users = getParticipantItemsForContext(root, contextType, target);
            const values = users.map(user => getUserCopyFieldValue(user, fieldkey)).filter(Boolean);
            copyText(values.join('\n'));
        } else if (action === 'copy-participant-name') {
            const users = getParticipantItemsForContext(root, contextType, target);
            copyText(users.map(user => {
                const node = user.querySelector('.local-groupimport-easystud-user__name');
                return node ? node.textContent.trim() : '';
            }).filter(Boolean).join('\n'));
        } else if (action === 'copy-participant-id') {
            const users = getParticipantItemsForContext(root, contextType, target);
            copyText(users.map(user => user.getAttribute('data-user-id')).filter(Boolean).join('\n'));
        } else if (action === 'participant-open-details') {
            const button = root.querySelector('[data-easystud-open-user="' + target.getAttribute('data-user-id') + '"]');
            if (button) {
                button.click();
            }
        } else if (action === 'participant-move-selected') {
            const button = root.querySelector('[data-easystud-move-selected-participants]');
            if (button) {
                button.click();
            }
        } else if (action === 'participant-message-selected') {
            openParticipantMessageModal(root, getSelectedMessageUserIds(root, contextType, target));
        } else if (action === 'clear-selection') {
            clearSelection(root, contextType);
            updateSelectionActions(root);
        } else if (action === 'group-paste-emails') {
            const groupid = target.getAttribute('data-easystud-group-id');
            const panel = ensureGroupEmailPanel(target, groupid, getLabels(root));
            if (panel) {
                const box = panel.querySelector('[data-easystud-group-email-box]');
                const transition = setInlinePanelOpen(panel, true);
                if (box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus();
                        }
                    });
                }
            }
        } else if (action === 'group-add-copied-users') {
            addCopiedUsersToGroup(target).catch(() => {
                const groupid = target.getAttribute('data-easystud-group-id');
                const panel = ensureGroupEmailPanel(target, groupid, getLabels(root));
                if (panel) {
                    const box = panel.querySelector('[data-easystud-group-email-box]');
                    const transition = setInlinePanelOpen(panel, true);
                    if (box) {
                        transition.then(completed => {
                            if (completed) {
                                box.focus();
                            }
                        });
                    }
                }
            });
        } else if (action === 'group-focus-rename') {
            const form = target.querySelector('.local-groupimport-easystud-rename');
            if (form) {
                setRenameEditing(form, true);
                const input = form.querySelector('input[name="name"]');
                if (input) {
                    window.requestAnimationFrame(() => {
                        input.focus();
                        input.select();
                    });
                }
            }
        } else if (action === 'group-open-advanced-settings') {
            const opener = document.activeElement;
            openAdvancedSettingsModal(root, target);
            restoreContextFocusAfterAdvancedSettingsClose(opener);
        } else if (action === 'copy-group-name') {
            copyText(getContextItems('group', target).map(group => getGroupName(group)).filter(Boolean).join('\n'));
        } else if (action === 'group-move-selected') {
            const button = root.querySelector('[data-easystud-move-selected-groups]');
            if (button) {
                button.click();
            }
        } else if (action === 'group-remove-from-grouping') {
            removeGroupsFromGroupings(root, courseId, getContextItems('group', target))
                .catch(() => window.location.reload());
        } else if (action === 'group-delete-selected') {
            const button = root.querySelector('[data-easystud-delete-selected-groups]');
            if (button) {
                button.click();
            }
        } else if (action === 'grouping-focus-rename') {
            const form = target.querySelector('.local-groupimport-easystud-rename');
            if (form) {
                setRenameEditing(form, true);
                const input = form.querySelector('input[name="name"]');
                if (input) {
                    window.requestAnimationFrame(() => {
                        input.focus();
                        input.select();
                    });
                }
            }
        } else if (action === 'grouping-paste-groups') {
            const groupingid = target.getAttribute('data-easystud-grouping-id');
            const panel = root.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]');
            if (panel) {
                const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                const transition = setInlinePanelOpen(panel, true);
                if (box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus();
                        }
                    });
                }
            }
        } else if (action === 'grouping-add-copied-groups') {
            addCopiedGroupsToGrouping(target).catch(() => {
                const groupingid = target.getAttribute('data-easystud-grouping-id');
                const panel = root.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]');
                if (panel) {
                    const box = panel.querySelector('[data-easystud-grouping-groups-box]');
                    const transition = setInlinePanelOpen(panel, true);
                    if (box) {
                        transition.then(completed => {
                            if (completed) {
                                box.focus();
                            }
                        });
                    }
                }
            });
        } else if (action === 'grouping-select-groups') {
            selectGroupingGroups(root, getContextItems('grouping', target));
        } else if (action === 'copy-grouping-name') {
            const name = target.querySelector('.local-groupimport-easystud-grouping__name');
            copyText(name ? name.textContent : '');
        } else if (action === 'remove-member') {
            const members = getContextItems('member', target);
            removeMembers(root, courseId, members).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(() => window.location.reload());
        } else if (action === 'paste-field') {
            pasteIntoField(target).catch(() => {});
        }
    });

    document.addEventListener('click', event => {
        if (suppressNextDocumentClick) {
            suppressNextDocumentClick = false;
            event.preventDefault();
            event.stopPropagation();
            return;
        }
        if (!menu.hidden && !menu.contains(event.target)) {
            hideMenu();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMenu();
        }
    });
    if (backdrop) {
        backdrop.addEventListener('click', hideMenu);
    }
    menu.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-context-close]')) {
            hideMenu();
        }
    });
    window.addEventListener('scroll', () => {
        if (!isResponsiveWorkspace()) {
            hideMenu();
        }
    }, true);
};

const bindCatalogFilters = root => {
    root.querySelectorAll('[data-easystud-catalog-grouping-filter], [data-easystud-catalog-show-ungrouped]').forEach(control => {
        control.addEventListener('change', () => syncCatalogFilters(root));
    });
    root.querySelectorAll('[data-easystud-structure-group-search], [data-easystud-catalog-search]').forEach(search => {
        search.addEventListener('input', () => applyCatalogSearch(root));
    });
    root.querySelectorAll('[data-easystud-structure-grouping-search]').forEach(search => {
        search.addEventListener('input', () => applyStructureSearch(root));
    });
    root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(button => {
        button.addEventListener('click', () => {
            root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(option => {
                const active = option === button;
                option.classList.toggle('is-active', active);
                option.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            applyStructureSearch(root);
            syncResponsiveResetButtons(root);
            closeResponsiveAdvancedFilters(root, 'structure-groupings');
        });
    });
    const resetGroupingFilters = root.querySelector('[data-easystud-reset-grouping-filters]');
    if (resetGroupingFilters) {
        resetGroupingFilters.addEventListener('click', () => {
            const all = root.querySelector('[data-easystud-grouping-occupancy="all"]');
            root.querySelectorAll('[data-easystud-grouping-occupancy]').forEach(option => {
                const active = option === all;
                option.classList.toggle('is-active', active);
                option.setAttribute('aria-pressed', active ? 'true' : 'false');
            });
            const search = root.querySelector('[data-easystud-structure-grouping-search]');
            if (search) {
                search.value = '';
            }
            applyStructureSearch(root);
            syncResponsiveResetButtons(root);
        });
    }
    root.querySelectorAll('[data-easystud-reset-catalog-filters]').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-easystud-reset-catalog-filters');
            const select = root.querySelector('[data-easystud-catalog-grouping-filter="' + key + '"]');
            const toggle = root.querySelector('[data-easystud-catalog-show-ungrouped="' + key + '"]');
            if (select && select.tagName === 'SELECT') {
                Array.from(select.options).forEach(option => {
                    option.selected = false;
                });
            }
            if (toggle) {
                toggle.checked = false;
            }
            const search = root.querySelector('[data-easystud-catalog-search="' + key + '"]');
            if (search) {
                search.value = '';
            }
            if (key === 'structure') {
                const structureSearch = root.querySelector('[data-easystud-structure-group-search]');
                if (structureSearch) {
                    structureSearch.value = '';
                }
                const groupingSearch = root.querySelector('[data-easystud-structure-grouping-search]');
                if (groupingSearch) {
                    groupingSearch.value = '';
                }
            }
            syncCatalogFilters(root);
            closeResponsiveAdvancedFilters(root, key === 'structure' ? 'structure-groups' : 'participant-groups');
        });
    });
    syncCatalogFilters(root);
};

const bindContainerGroupSearch = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-container-search-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();

        const key = toggle.getAttribute('data-easystud-container-search-toggle') || '';
        const section = toggle.closest('.local-groupimport-easystud-tree__section');
        const panel = section ? section.querySelector('[data-easystud-container-search-panel="' + key + '"]') : null;
        const collapseToggle = section ? section.querySelector('[data-easystud-collapse-toggle]') : null;
        const children = section ? section.querySelector('.local-groupimport-easystud-tree__children') : null;
        const shouldOpen = !panel || panel.hidden || !panel.classList.contains('is-open');

        if (shouldOpen && collapseToggle && children && collapseToggle.getAttribute('aria-expanded') === 'false') {
            collapseToggle.setAttribute('aria-expanded', 'true');
            section.classList.add('is-expanded');
            const icon = collapseToggle.querySelector('.fa');
            if (icon) {
                icon.classList.remove('fa-chevron-right');
                icon.classList.add('fa-chevron-down');
            }
            animateTreeChildren(children, true, {animate: false, prepare: false, syncAfter: false});
        }
        if (shouldOpen && section && section.hasAttribute('data-easystud-grouping-id')) {
            const groupingGroupsToggle = section.querySelector('[data-easystud-grouping-groups-toggle]');
            if (groupingGroupsToggle) {
                groupingGroupsToggle.setAttribute('aria-expanded', 'true');
            }
        }

        const transition = setInlinePanelOpen(panel, shouldOpen);
        toggle.classList.toggle('is-active', shouldOpen);
        if (shouldOpen && panel) {
            const input = panel.querySelector('[data-easystud-container-group-search]');
            if (input) {
                transition.then(completed => {
                    if (completed) {
                        input.focus();
                    }
                });
            }
        }
    });

    root.addEventListener('click', event => {
        const cancel = event.target.closest('[data-easystud-container-search-cancel]');
        if (!cancel || !root.contains(cancel)) {
            return;
        }
        event.preventDefault();

        const key = cancel.getAttribute('data-easystud-container-search-cancel') || '';
        const section = cancel.closest('.local-groupimport-easystud-tree__section');
        const panel = section ? section.querySelector('[data-easystud-container-search-panel="' + key + '"]') : null;
        const input = panel ? panel.querySelector('[data-easystud-container-group-search="' + key + '"]') : null;
        const toggle = section ? section.querySelector('[data-easystud-container-search-toggle="' + key + '"]') : null;
        if (input) {
            input.value = '';
        }
        applyContainerGroupSearch(root);
        setInlinePanelOpen(panel, false);
        if (toggle) {
            toggle.classList.remove('is-active');
        }
    });

    root.addEventListener('input', event => {
        if (!event.target.closest('[data-easystud-container-group-search]')) {
            return;
        }
        // Sorting re-inserts every card in its list. If the active search is
        // inside one of those cards, that DOM move drops focus and the caret.
        // The nested filter already updates its own results and empty state;
        // keep the surrounding pagination order stable while the user types.
        applyContainerGroupSearch(root, {pagination: false});
    });
    applyContainerGroupSearch(root);
};

const bindGroupMemberSearch = root => {
    root.querySelectorAll('[data-easystud-group-id]').forEach(group => ensureGroupMemberSearchControls(root, group));

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-group-member-search-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();

        const group = toggle.closest('[data-easystud-group-id]');
        const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
        const panel = group ? group.querySelector(':scope > [data-easystud-group-member-search-panel="' + groupid + '"]') : null;
        const shouldOpen = !panel || panel.hidden || !panel.classList.contains('is-open');
        if (shouldOpen) {
            const membersToggle = group ? group.querySelector('[data-easystud-group-members-toggle]') : null;
            if (membersToggle) {
                membersToggle.setAttribute('aria-expanded', 'true');
                syncGroupMembersCollapsible(group);
            }
        }
        const transition = setInlinePanelOpen(panel, shouldOpen);
        toggle.classList.toggle('is-active', shouldOpen);
        if (shouldOpen && panel) {
            const input = panel.querySelector('[data-easystud-group-member-search]');
            if (input) {
                transition.then(completed => {
                    if (completed) {
                        input.focus();
                    }
                });
            }
        }
    });

    root.addEventListener('click', event => {
        const cancel = event.target.closest('[data-easystud-group-member-search-cancel]');
        if (!cancel || !root.contains(cancel)) {
            return;
        }
        event.preventDefault();

        const group = cancel.closest('[data-easystud-group-id]');
        const groupid = group ? group.getAttribute('data-easystud-group-id') : '';
        const panel = group ? group.querySelector(':scope > [data-easystud-group-member-search-panel="' + groupid + '"]') : null;
        const input = panel ? panel.querySelector('[data-easystud-group-member-search="' + groupid + '"]') : null;
        const toggle = group ? group.querySelector('[data-easystud-group-member-search-toggle="' + groupid + '"]') : null;
        if (input) {
            input.value = '';
        }
        applyGroupMemberSearch(root);
        setInlinePanelOpen(panel, false);
        if (toggle) {
            toggle.classList.remove('is-active');
        }
    });

    root.addEventListener('input', event => {
        if (!event.target.closest('[data-easystud-group-member-search]')) {
            return;
        }
        // Keep the focused Group card in place while its members are filtered.
        // Responsive sizing still refreshes, but pagination must not reinsert
        // the active card on every character, Backspace, Paste or native clear.
        applyGroupMemberSearch(root, {pagination: false});
    });
    applyGroupMemberSearch(root);
};

const bindNestedGroupActionMenus = root => {
    const closeMenus = except => {
        root.querySelectorAll('[data-easystud-group-actions-menu]').forEach(menu => {
            if (menu === except) {
                return;
            }
            menu.hidden = true;
            const group = menu.closest('[data-easystud-group-id], [data-easystud-grouping-id]');
            if (group) {
                group.classList.remove('is-actions-menu-open');
            }
            const header = menu.closest(
                '.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header'
            );
            const toggle = header ? header.querySelector('[data-easystud-group-actions-toggle]') : null;
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    };

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-group-actions-toggle]');
        if (toggle && root.contains(toggle)) {
            event.preventDefault();
            // This trigger also carries the generic card-menu hook so it can
            // open the responsive action sheet. At non-responsive widths the
            // local overflow menu owns the click exclusively; allowing the
            // event to reach bindContextMenu opens both menus at once.
            event.stopImmediatePropagation();
            const header = toggle.closest(
                '.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header'
            );
            const menu = header ? header.querySelector('[data-easystud-group-actions-menu]') : null;
            if (!menu) {
                return;
            }
            const open = menu.hidden;
            closeMenus(menu);
            menu.hidden = !open;
            const group = toggle.closest('[data-easystud-group-id], [data-easystud-grouping-id]');
            if (group) {
                group.classList.toggle('is-actions-menu-open', open);
            }
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            return;
        }

        if (!event.target.closest('[data-easystud-group-actions-menu]')) {
            closeMenus(null);
            return;
        }

        if (event.target.closest('button')) {
            window.setTimeout(() => closeMenus(null), 0);
        }
    });

    ensureNestedGroupActionMenus(root);
    let refreshFrame = null;
    const refresh = () => {
        if (refreshFrame !== null) {
            window.cancelAnimationFrame(refreshFrame);
        }
        refreshFrame = window.requestAnimationFrame(() => {
            refreshFrame = null;
            ensureNestedGroupActionMenus(root);
            // A nested-card action change also changes the room available to
            // the Grouping tag. Re-evaluate its all-or-recover decision in
            // the same frame so it never remains visually clipped.
            scheduleGroupGroupingOverflow(root);
        });
    };
    window.addEventListener('resize', refresh);
    if (window.ResizeObserver) {
        const widths = new WeakMap();
        const observer = new window.ResizeObserver(entries => {
            const changed = entries.some(entry => {
                const width = Math.round(entry.contentRect.width * 10) / 10;
                const previous = widths.get(entry.target);
                widths.set(entry.target, width);
                return previous !== undefined && previous !== width;
            });
            if (changed) {
                refresh();
            }
        });
        root.querySelectorAll(
            '.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header'
        ).forEach(header => {
            widths.set(header, Math.round(header.getBoundingClientRect().width * 10) / 10);
            observer.observe(header);
        });
        root.easystudCardActionOverflowObserver = observer;
    }
};

const closeResponsiveAdvancedFilters = (root, key) => {
    if (!isResponsiveWorkspace()) {
        return;
    }
    const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
    if (toggle && toggle.getAttribute('aria-expanded') === 'true') {
        toggle.click();
    }
};

const bindAdvancedFilters = root => {
    const getAdvancedFilterStateClass = key =>
        'local-groupimport-easystud--' + key + '-filters-expanded';

    const setAdvancedFilterAccessibility = (panel, expanded) => {
        panel.inert = !expanded;
        panel.setAttribute('aria-hidden', expanded ? 'false' : 'true');
    };

    const toggleAdvancedFilters = key => {
        const panel = root.querySelector('[data-easystud-advanced-filters="' + key + '"]');
        const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
        const more = root.querySelector('[data-easystud-advanced-filters-more="' + key + '"]');
        if (!panel || !toggle) {
            return;
        }

        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const nextexpanded = !expanded;
        toggle.setAttribute('aria-expanded', nextexpanded ? 'true' : 'false');
        toggle.classList.toggle('is-expanded', nextexpanded);
        if (more) {
            more.classList.toggle('is-expanded', nextexpanded);
        }
        if (nextexpanded) {
            setAdvancedFilterAccessibility(panel, true);
            panel.hidden = false;
            root.classList.add(getAdvancedFilterStateClass(key));
            Motion.expand(panel, {
                prepare: () => {
                    panel.classList.remove('is-collapsed');
                    panel.classList.add('is-expanded');
                },
                onComplete: () => {
                    scheduleCompleteListAlignment(root);
                    requestGuideHighlightRefresh(root);
                },
            });
        } else {
            setAdvancedFilterAccessibility(panel, false);
            Motion.collapse(panel, {
                hideOnComplete: false,
                onComplete: () => {
                    root.classList.remove(getAdvancedFilterStateClass(key));
                    panel.classList.remove('is-expanded');
                    panel.classList.add('is-collapsed');
                    scheduleCompleteListAlignment(root);
                    requestGuideHighlightRefresh(root);
                },
            });
        }
        window.requestAnimationFrame(() => {
            scheduleCompleteListAlignment(root);
            requestGuideHighlightRefresh(root);
        });
    };

    root.addEventListener('click', event => {
        const control = event.target.closest('[data-easystud-advanced-filters-toggle], [data-easystud-advanced-filters-more]');
        if (!control || !root.contains(control)) {
            return;
        }
        event.preventDefault();
        const key = control.getAttribute('data-easystud-advanced-filters-toggle') ||
            control.getAttribute('data-easystud-advanced-filters-more');
        const panel = root.querySelector('[data-easystud-advanced-filters="' + key + '"]');
        if (panel && control.offsetParent !== null) {
            toggleAdvancedFilters(key);
            emitGuidedCompletion(root, 2);
            scheduleResponsiveUiRefresh(root);
            animateCompleteListAlignment(root);
            scheduleCompleteListAlignment(root);
        }
    });

    root.querySelectorAll('[data-easystud-advanced-filters]').forEach(panel => {
        const key = panel.getAttribute('data-easystud-advanced-filters');
        const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="' + key + '"]');
        const expanded = !!(toggle && toggle.getAttribute('aria-expanded') === 'true');
        panel.hidden = false;
        panel.classList.toggle('is-expanded', expanded);
        panel.classList.toggle('is-collapsed', !expanded);
        root.classList.toggle(getAdvancedFilterStateClass(key), expanded);
        setAdvancedFilterAccessibility(panel, expanded);
    });
};

const bindGroupMemberToggles = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-group-members-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const group = toggle.closest('[data-easystud-group-id]');
        if (!group) {
            return;
        }
        const grouping = group.closest('[data-easystud-grouping-id]');
        if (grouping) {
            expandGroupingSection(grouping);
            const groupingGroupsToggle = grouping.querySelector('[data-easystud-grouping-groups-toggle]');
            if (groupingGroupsToggle) {
                groupingGroupsToggle.setAttribute('aria-expanded', 'true');
                syncGroupingGroupsCollapsible(grouping);
            }
        }
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        const list = group.querySelector('[data-easystud-group-members]');
        const motionToken = String(++groupMemberMotionToken);
        list.setAttribute('data-easystud-members-motion-token', motionToken);
        list.classList.add('is-easyedu-disclosing');
        void Motion.resize(list, () => {
            toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
            syncGroupMembersCollapsible(group);
        }, {
            duration: Motion.timing.normal,
            onComplete: () => {
                scheduleGroupingResizeForGroup(group);
                requestGuideHighlightRefresh(root);
            },
        }).then(() => {
            if (list.getAttribute('data-easystud-members-motion-token') === motionToken) {
                list.classList.remove('is-easyedu-disclosing');
                list.removeAttribute('data-easystud-members-motion-token');
            }
        });
    });
    root.addEventListener('click', event => {
        const groupingHeader = event.target.closest('.local-groupimport-easystud-grouping__header');
        if (groupingHeader && root.contains(groupingHeader)) {
            const grouping = groupingHeader.closest('[data-easystud-grouping-id]');
            if (grouping) {
                emitGuidedCompletion(root, 2, 'grouping');
            }
        }

        const toggle = event.target.closest('[data-easystud-grouping-groups-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const grouping = toggle.closest('[data-easystud-grouping-id]');
        if (!grouping) {
            return;
        }
        const expanded = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        syncGroupingGroupsCollapsible(grouping);
        if (!expanded) {
            emitGuidedCompletion(root, 2, 'grouping');
        }
        scheduleResponsiveUiRefresh(root);
    });
    syncAllGroupMembersCollapsible(root);
    syncAllGroupingGroupsCollapsible(root);
};

const bindTagToggles = root => {
    root.addEventListener('click', event => {
        const groupingToggle = event.target.closest('[data-easystud-grouping-summary-toggle]');
        if (groupingToggle && root.contains(groupingToggle)) {
            event.preventDefault();
            const group = groupingToggle.closest('[data-easystud-group-id]');
            if (!group) {
                return;
            }
            const expanded = !group.classList.contains('is-groupings-expanded');
            const details = group.querySelector(':scope > [data-easystud-grouping-details]');
            if (!details) {
                group.classList.toggle('is-groupings-expanded', expanded);
                return;
            }
            if (expanded) {
                group.classList.add('is-groupings-expanded');
                Motion.expand(details, {
                    duration: Motion.timing.normal,
                    onComplete: () => scheduleResponsiveUiRefresh(root),
                });
            } else {
                Motion.collapse(details, {
                    duration: Motion.timing.normal,
                    onComplete: () => {
                        group.classList.remove('is-groupings-expanded');
                        scheduleResponsiveUiRefresh(root);
                    },
                });
            }
            return;
        }

        const toggle = event.target.closest('[data-easystud-toggle-tags]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }

        const container = toggle.closest('.local-groupimport-easystud-user__meta-tags');
        if (!container) {
            return;
        }

        const expanded = toggle.getAttribute('data-expanded') === '1';
        const card = container.closest('[data-easystud-user]');
        Motion.resize(card, () => {
            toggle.setAttribute('data-expanded', expanded ? '0' : '1');
            syncParticipantTagOverflow(root);
        }, {
            duration: Motion.timing.normal,
            onComplete: () => scheduleResponsiveUiRefresh(root),
        });
    });
};

const bindHoverPopovers = root => {
    let activeTip = null;
    let activeNode = null;

    root.querySelectorAll('[data-easystud-hover-help][title]').forEach(node => {
        node.setAttribute('data-easystud-native-title', node.getAttribute('title') || '');
        node.removeAttribute('title');
    });

    const removeTip = () => {
        if (activeTip) {
            activeTip.remove();
            activeTip = null;
        }
        activeNode = null;
    };

    const showTip = node => {
        if (activeNode === node && activeTip) {
            return;
        }
        removeTip();
        const content = node.getAttribute('data-easystud-hover-help') || '';
        if (!content) {
            return;
        }
        activeNode = node;

        activeTip = document.createElement('div');
        activeTip.className = 'popover ' + hoverPopoverClass + ' ' + hoverPopoverClass + '--top show';
        activeTip.classList.toggle(hoverPopoverClass + '--long', content.length > 110);
        activeTip.setAttribute('role', 'tooltip');
        activeTip.innerHTML = '<div class="popover-arrow"></div><div class="popover-body">' + escapeHtml(content) + '</div>';
        document.body.appendChild(activeTip);

        const rect = node.getBoundingClientRect();
        const tiprect = activeTip.getBoundingClientRect();
        const top = window.scrollY + rect.top - tiprect.height - 10;
        const left = window.scrollX + rect.left + ((rect.width - tiprect.width) / 2);

        activeTip.style.top = Math.max(window.scrollY + 8, top) + 'px';
        activeTip.style.left = Math.max(
            window.scrollX + 8,
            Math.min(window.scrollX + window.innerWidth - tiprect.width - 8, left)
        ) + 'px';
    };

    root.addEventListener('mouseenter', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            showTip(node);
        }
    }, true);

    root.addEventListener('mouseleave', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            if (event.relatedTarget && node.contains(event.relatedTarget)) {
                return;
            }
            removeTip();
        }
    }, true);

    root.addEventListener('focusin', event => {
        const node = event.target.closest('[data-easystud-hover-help]');
        if (node && root.contains(node)) {
            showTip(node);
        }
    });

    root.addEventListener('focusout', removeTip);
    root.addEventListener('click', removeTip);
    window.addEventListener('scroll', removeTip, true);
};

const bindParticipantModal = root => {
    const modal = root.querySelector('[data-easystud-user-modal]');
    const body = root.querySelector('[data-easystud-user-modal-body]');
    const close = root.querySelector('[data-easystud-close-user-modal]');
    const openSelected = root.querySelector('[data-easystud-open-selected-user]');
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    if (!modal || !body || !close) {
        return;
    }

    const renderParticipantField = (label, value) => {
        if (!value) {
            return '';
        }
        return '<div class="local-groupimport-easystud-detail__field">' +
            '<span>' + escapeHtml(label) + '</span>' +
            '<strong>' + escapeHtml(value) + '</strong>' +
        '</div>';
    };

    const renderParticipantList = (title, values, modifier) => {
        const entries = (values || []).filter(Boolean);
        const list = entries.length ?
            '<div class="local-groupimport-easystud-detail__list-scroll">' +
                '<ul>' + entries.map(value => '<li>' + escapeHtml(value) + '</li>').join('') + '</ul>' +
            '</div>' :
            '<div class="local-groupimport-easystud-detail__list-empty">' +
                escapeHtml(labels.advancedsettingsnotset || '') +
            '</div>';
        return '<details class="local-groupimport-easystud-detail__list local-groupimport-easystud-detail__list--' +
                escapeHtml(modifier || 'default') + '" data-easystud-detail-list="1" open>' +
            '<summary>' +
                '<span class="local-groupimport-easystud-detail__list-chevron fa fa-chevron-down" ' +
                    'aria-hidden="true"></span>' +
                '<span class="local-groupimport-easystud-detail__list-title">' + escapeHtml(title) + '</span>' +
                '<span class="local-groupimport-easystud-detail__list-summary-end">' +
                    '<strong><span>' + entries.length + '</span><span>' + escapeHtml(title) + '</span></strong>' +
                '</span>' +
            '</summary>' +
            list +
        '</details>';
    };

    const bindParticipantDetailLists = detailRoot => {
        detailRoot.querySelectorAll('[data-easystud-detail-list]').forEach(details => {
            const content = details.querySelector(':scope > .local-groupimport-easystud-detail__list-scroll, ' +
                ':scope > .local-groupimport-easystud-detail__list-empty');
            bindAnimatedDetails(details, content, 'data-easystud-detail-list-state');
        });
    };

    const openForUser = user => {
        rehydrateParticipantMembershipDetails(root);
        const detail = user.getAttribute('data-user-detail');
        if (!detail) {
            return;
        }
        const data = JSON.parse(detail);
        body.innerHTML =
            '<div class="local-groupimport-easystud-detail">' +
                '<div class="local-groupimport-easystud-detail__hero">' +
                    '<div class="local-groupimport-easystud-detail__avatar">' + (data.profileimage || '') + '</div>' +
                    '<div class="local-groupimport-easystud-detail__identity">' +
                        '<span class="local-groupimport-easystud-detail__identity-label">' +
                            escapeHtml(labels.participantdetails || '') +
                        '</span>' +
                        '<h4>' + escapeHtml(data.fullname || '') + '</h4>' +
                        (data.email ? '<p>' + escapeHtml(data.email) + '</p>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="local-groupimport-easystud-detail__grid">' +
                    renderParticipantField(labels.username || '', data.username) +
                    renderParticipantField(labels.idnumber || '', data.idnumber) +
                    renderParticipantField(labels.institution || '', data.institution) +
                    renderParticipantField(labels.department || '', data.department) +
                    renderParticipantField(labels.city || '', data.city) +
                    renderParticipantField(labels.country || '', data.country) +
                    renderParticipantField(labels.language || '', data.lang) +
                '</div>' +
                '<div class="local-groupimport-easystud-detail__lists">' +
                    renderParticipantList(labels.roles || '', data.roles || [], 'roles') +
                    renderParticipantList(labels.groups || '', data.groups || [], 'groups') +
                    renderParticipantList(labels.groupings || '', data.groupings || [], 'groupings') +
                '</div>' +
                (data.description ? '<details class="local-groupimport-easystud-detail__description" open>' +
                    '<summary>' + escapeHtml(labels.advancedsettingsdescription || '') + '</summary>' +
                    '<div>' + data.description + '</div>' +
                '</details>' : '') +
                (data.profileurl ? '<div class="local-groupimport-easystud-settings-modal__native">' +
                    '<a class="btn btn-outline-secondary" href="' + escapeHtml(data.profileurl) + '">' +
                        '<span class="fa fa-external-link-alt me-1" aria-hidden="true"></span>' +
                        '<span>' + escapeHtml(labels.nativedetails || '') + '</span>' +
                    '</a>' +
                '</div>' : '') +
            '</div>';
        bindParticipantDetailLists(body);
        showEasyStudModal(modal);
    };

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-open-user]');
        if (!button || !root.contains(button)) {
            return;
        }
        const user = root.querySelector('[data-easystud-user][data-user-id="' + button.getAttribute('data-easystud-open-user') + '"]');
        if (user) {
            openForUser(user);
        }
    });

    if (openSelected) {
        openSelected.addEventListener('click', () => {
            const selected = getSelectedItems(root, 'participant');
            if (selected.length === 1) {
                openForUser(selected[0]);
            }
        });
    }

    close.addEventListener('click', () => {
        hideEasyStudModal(modal);
    });
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            hideEasyStudModal(modal);
        }
    });
};

// The shared Guide owns its modal and checklist UI. EasyStud still owns the
// product-specific controls that a slide can reveal (for example an inline
// email field or a grouping's add-groups field). Keep that adapter active
// even when the legacy tutorial modal is not rendered.
const bindSharedGuideTargets = root => {
    const guideRoot = root.querySelector('[data-easyedu-guide-root]');
    if (!guideRoot || root.dataset.easystudGuideTargetsBound === '1') {
        return;
    }
    root.dataset.easystudGuideTargetsBound = '1';

    const ensureWorkspace = workspace => {
        if (isResponsiveWorkspace()) {
            const mobileView = root.querySelector('[data-easystud-mobile-view="' + workspace + '"]');
            if (mobileView && mobileView.getAttribute('aria-pressed') !== 'true') {
                mobileView.click();
            }
            return mobileView || null;
        }
        if (typeof root.easystudApplyDesktopMode === 'function') {
            root.easystudApplyDesktopMode('structure', false);
            return root;
        }
        const structureView = root.querySelector('[data-easystud-layout-mode="structure"]');
        if (structureView && structureView.getAttribute('aria-pressed') !== 'true') {
            structureView.click();
        }
        return structureView || null;
    };

    const openTarget = selector => {
        if (!selector) {
            return null;
        }
        if (selector === 'tutorial:participant-details') {
            const participant = root.querySelector('[data-easystud-participant-list] [data-easystud-user]:not([hidden])');
            if (participant) {
                participant.focus({preventScroll: true});
            }
            scheduleParticipantTagOverflow(root);
            return participant;
        }
        if (selector === 'tutorial:participant-card-actions') {
            const participant = root.querySelector('[data-easystud-participant-list] [data-easystud-user]:not([hidden])');
            if (!participant) {
                return null;
            }
            if (!isResponsiveWorkspace()) {
                participant.focus({preventScroll: true});
                return participant;
            }
            let menu = participant.querySelector(':scope > [data-easystud-card-menu]') ||
                participant.querySelector('[data-easystud-card-menu]');
            if (!menu) {
                menu = document.createElement('button');
                menu.type = 'button';
                normaliseCardMenuButton(menu, root);
                participant.appendChild(menu);
            }
            menu.focus({preventScroll: true});
            return menu;
        }
        if (selector === 'tutorial:first-group') {
            const group = root.querySelector('[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])') ||
                root.querySelector('[data-easystud-group-id]:not([hidden])');
            if (group) {
                group.focus({preventScroll: true});
            }
            return group;
        }
        if (selector === 'tutorial:first-grouping') {
            const grouping = root.querySelector('[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])') ||
                root.querySelector('[data-easystud-grouping-id]:not([hidden])');
            if (grouping) {
                expandGroupingSection(grouping);
                grouping.focus({preventScroll: true});
            }
            return grouping;
        }
        if (selector === 'tutorial:create-group' || selector === 'tutorial:create-grouping') {
            const workspace = ensureWorkspace(selector === 'tutorial:create-group' ? 'groups' : 'groupings');
            const fieldName = selector === 'tutorial:create-group' ? 'groupname' : 'groupingname';
            const input = root.querySelector('.local-groupimport-easystud-create-row input[name="' + fieldName + '"]');
            if (input) {
                input.focus({preventScroll: true});
                input.select();
            }
            return input || workspace;
        }
        if (selector === 'tutorial:first-grouping-add-groups') {
            const grouping = root.querySelector('[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])') ||
                root.querySelector('[data-easystud-grouping-id]:not([hidden])');
            if (!grouping) {
                return null;
            }
            expandGroupingSection(grouping);
            const toggle = grouping.querySelector('[data-easystud-toggle-grouping-groups]');
            let panel = grouping.querySelector('[data-easystud-grouping-groups-panel]');
            if (toggle && (!panel || panel.hidden || !panel.classList.contains('is-open'))) {
                toggle.click();
            }
            panel = grouping.querySelector('[data-easystud-grouping-groups-panel]');
            const box = grouping.querySelector('[data-easystud-grouping-groups-box]');
            if (box) {
                box.focus({preventScroll: true});
            }
            return box || panel || grouping;
        }
        if (selector === 'tutorial:add-users-text') {
            const group = root.querySelector('[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])') ||
                root.querySelector('[data-easystud-group-id]:not([hidden])');
            if (!group) {
                return null;
            }
            const groupid = group.getAttribute('data-easystud-group-id');
            const panel = ensureGroupEmailPanel(group, groupid, getLabels(root));
            if (panel && (panel.hidden || !panel.classList.contains('is-open'))) {
                setInlinePanelOpen(panel, true);
            }
            const textarea = group.querySelector('[data-easystud-group-email-box]');
            if (textarea) {
                textarea.focus({preventScroll: true});
            }
            return textarea || panel || group;
        }
        return null;
    };

    document.addEventListener('easyedu:guide-open-target', event => {
        const request = event.detail;
        if (!request || request.root !== guideRoot || typeof request.target !== 'string' ||
                !request.target.startsWith('tutorial:')) {
            return;
        }
        if (openTarget(request.target)) {
            request.handled = true;
        }
    });
};

const bindTutorialModal = root => {
    if (root.querySelector('[data-easyedu-guide-root]')) {
        return;
    }

    const modal = root.querySelector('[data-easystud-tutorial-modal]');
    const open = root.querySelector('[data-easystud-open-tutorial]');
    const close = root.querySelector('[data-easystud-close-tutorial]');
    const steps = modal ? Array.from(modal.querySelectorAll('[data-easystud-tutorial-step]')) : [];
    const navItems = modal ? Array.from(modal.querySelectorAll('[data-easystud-tutorial-nav]')) : [];
    const prev = modal ? modal.querySelector('[data-easystud-tutorial-prev]') : null;
    const next = modal ? modal.querySelector('[data-easystud-tutorial-next]') : null;
    const nextLabel = next ? next.textContent : '';
    const finishLabel = next ? (next.getAttribute('data-finish-label') || nextLabel) : '';
    const progress = modal ? modal.querySelector('[data-easystud-tutorial-progress]') : null;
    const progressBar = modal ? modal.querySelector('[data-easystud-tutorial-progress-bar]') : null;
    const body = modal ? modal.querySelector('.local-groupimport-easystud-modal__body') : null;
    const stepsContainer = modal ? modal.querySelector('.local-groupimport-easystud-tutorial__steps') : null;
    const nav = modal ? modal.querySelector('.local-groupimport-easystud-tutorial__nav') : null;
    const navScrollButtons = modal ? Array.from(modal.querySelectorAll('[data-easystud-tutorial-nav-scroll]')) : [];
    const returnBanner = root.querySelector('[data-easystud-tutorial-return]');
    const returnButton = root.querySelector('[data-easystud-return-to-tutorial]');
    const dismissReturn = root.querySelector('[data-easystud-dismiss-tutorial-return]');
    const discovery = root.querySelector('[data-easystud-discovery]');
    const discoveryStart = root.querySelector('[data-easystud-discovery-start]');
    const discoveryDismiss = root.querySelector('[data-easystud-discovery-dismiss]');
    const guidedPanel = root.querySelector('[data-easystud-guided-panel]');
    const guidedPanelSteps = guidedPanel ? Array.from(guidedPanel.querySelectorAll('[data-easystud-guided-panel-step]')) : [];
    const guidedClose = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-close]') : null;
    const guidedMinimize = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-minimize]') : null;
    const guidedReturn = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-return]') : null;
    const guidedProgress = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-progress]') : null;
    const guidedMessage = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-message] span:last-child') : null;
    const guidedMessageIcon = guidedPanel ? guidedPanel.querySelector('[data-easystud-guided-message] .fa') : null;
    const guidedDefaultMessage = guidedMessage ? guidedMessage.textContent : '';
    const guidedTitle = guidedPanel ? guidedPanel.querySelector('.local-groupimport-easystud-guided-panel__header strong') : null;
    const guidedDefaultTitle = guidedTitle ? guidedTitle.textContent : '';
    const guidedStartButtons = modal ?
        Array.from(modal.querySelectorAll('.local-groupimport-easystud-tutorial__start-guided')) : [];
    const discoveryKey = 'local_groupimport_easystud_guide_seen_' +
        (root.getAttribute('data-easystud-course-id') || 'course') + '_' +
        ((window.M && window.M.cfg && window.M.cfg.userid) ? window.M.cfg.userid : 'guest');
    const guidedSlideIndex = steps.findIndex(step => step.querySelector('[data-easystud-guided-action]'));
    let index = 0;
    let highlightTimer = null;
    let highlightDelayTimer = null;
    let highlightOverlay = null;
    let highlightTarget = null;
    let highlightFrame = null;
    let highlightFollowTimer = null;
    let guidedDock = 'left';
    let guidedDockTimer = null;
    let returnTimer = null;
    let restoreCompactAfterTutorial = false;
    let guidedCurrent = 0;
    let guidedPath = 'main';
    const guidedCompleted = new Set();

    if (!modal || !open || !close || !steps.length) {
        return;
    }

    steps.forEach((step, stepIndex) => {
        if (navItems[stepIndex]) {
            navItems[stepIndex].classList.toggle('has-guided-path', !!step.querySelector('[data-easystud-guided-action]'));
        }
    });

    if (guidedStartButtons.length) {
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    entry.target.classList.toggle('is-visible', entry.isIntersecting);
                });
            }, {threshold: 0.72});
            guidedStartButtons.forEach(button => observer.observe(button));
        } else {
            guidedStartButtons.forEach(button => button.classList.add('is-visible'));
        }
    }

    const update = (nextIndex, scrollToStep = false) => {
        index = Math.max(0, Math.min(nextIndex, steps.length - 1));
        steps.forEach((step, stepIndex) => {
            const active = stepIndex === index;
            step.classList.toggle('is-active', active);
            step.hidden = !active;
        });
        navItems.forEach((item, itemIndex) => {
            const active = itemIndex === index;
            item.classList.toggle('is-active', active);
            item.setAttribute('aria-selected', active ? 'true' : 'false');
            item.setAttribute('tabindex', active ? '0' : '-1');
        });
        if (prev) {
            prev.disabled = index === 0;
        }
        if (next) {
            next.disabled = false;
            next.textContent = index === steps.length - 1 ? finishLabel : nextLabel;
        }
        if (progress) {
            const template = progress.getAttribute('data-progress-label') || '';
            progress.textContent = template
                .replace('{$a->current}', String(index + 1))
                .replace('{$a->total}', String(steps.length))
                .replace('__current__', String(index + 1))
                .replace('__total__', String(steps.length));
        }
        if (progressBar) {
            progressBar.style.width = (((index + 1) / steps.length) * 100) + '%';
        }
        const scrollBehavior = Motion.isEnabled(root) ? 'smooth' : 'auto';
        if (scrollToStep && stepsContainer) {
            stepsContainer.scrollTo({top: 0, behavior: scrollBehavior});
        } else if (scrollToStep && body) {
            body.scrollTo({top: 0, behavior: scrollBehavior});
        }
        if (scrollToStep && navItems[index]) {
            navItems[index].scrollIntoView({behavior: scrollBehavior, block: 'nearest', inline: 'center'});
        }
        updateNavScrollButtons();
    };

    const updateNavScrollButtons = () => {
        if (!nav || !navScrollButtons.length) {
            return;
        }
        const maxScroll = Math.max(0, nav.scrollWidth - nav.clientWidth - 1);
        navScrollButtons.forEach(button => {
            const direction = parseInt(button.getAttribute('data-easystud-tutorial-nav-scroll') || '0', 10);
            button.disabled = direction < 0 ? nav.scrollLeft <= 1 : nav.scrollLeft >= maxScroll;
        });
    };

    const scrollTutorialNav = direction => {
        if (!nav) {
            return;
        }
        const amount = Math.max(180, Math.round(nav.clientWidth * 0.72));
        nav.scrollBy({left: amount * direction, behavior: Motion.isEnabled(root) ? 'smooth' : 'auto'});
        window.setTimeout(updateNavScrollButtons, Motion.isEnabled(root) ? 260 : 0);
    };

    const hideTutorialModal = (afterClose = null) => {
        modal.classList.remove('is-opening');
        modal.classList.add('is-closing');
        window.setTimeout(() => {
            modal.hidden = true;
            modal.classList.remove('is-closing');
            if (afterClose) {
                afterClose();
            }
        }, 180);
    };

    const closeModal = () => {
        hideTutorialModal(() => {
            restoreParticipantDensity();
            if (open) {
                open.blur();
            }
        });
    };

    const showTutorialModal = () => {
        modal.hidden = true;
        modal.classList.remove('is-closing');
        modal.hidden = false;
        modal.classList.remove('is-opening');
        void modal.offsetWidth;
        modal.classList.add('is-opening');
    };

    const hideReturnBanner = () => {
        window.clearTimeout(returnTimer);
        if (returnBanner) {
            returnBanner.hidden = true;
        }
    };

    const restoreParticipantDensity = () => {
        if (!restoreCompactAfterTutorial) {
            return;
        }
        restoreCompactAfterTutorial = false;
        if (root.classList.contains(compactClass)) {
            return;
        }
        const densityToggle = root.querySelector('[data-easystud-density-toggle]');
        if (densityToggle) {
            densityToggle.click();
        } else {
            root.classList.add(compactClass);
            scheduleParticipantTagOverflow(root);
            schedulePanelActionOverflow(root);
        }
    };

    const markDiscoverySeen = () => {
        try {
            window.localStorage.setItem(discoveryKey, '1');
        } catch (error) {
            // Private browsing or blocked storage should not prevent the guide from opening.
        }
        if (discovery) {
            discovery.hidden = true;
        }
    };

    const isDiscoverySeen = () => {
        try {
            return window.localStorage.getItem(discoveryKey) === '1';
        } catch (error) {
            return true;
        }
    };

    const openModalAt = nextIndex => {
        hideReturnBanner();
        hideGuidedPanel();
        clearTutorialHighlight();
        if (discovery) {
            discovery.hidden = true;
        }
        showTutorialModal();
        update(nextIndex);
        const activeNav = navItems[index] || close;
        activeNav.focus();
    };

    const getGuidedControlLabel = control => {
        const explicit = control.getAttribute('data-easystud-guided-label');
        if (explicit) {
            return explicit;
        }
        const label = control.querySelector('span:last-child');
        return (label ? label.textContent : control.textContent).trim();
    };

    const syncGuidedPanelFromPath = path => {
        if (!guidedPanel) {
            return;
        }
        const controls = modal ? Array.from(
            modal.querySelectorAll('[data-easystud-guided-action][data-easystud-guided-path="' + path + '"]')
        ) : [];
        const controlsByStep = new Map();
        controls.forEach(control => {
            const step = parseInt(control.getAttribute('data-easystud-guided-step') || '0', 10);
            if (!Number.isNaN(step) && !controlsByStep.has(step)) {
                controlsByStep.set(step, control);
            }
        });
        const firstControl = controlsByStep.get(0);
        if (guidedTitle) {
            guidedTitle.textContent = (firstControl && firstControl.getAttribute('data-easystud-guided-title')) ||
                guidedDefaultTitle;
        }
        guidedPanelSteps.forEach((step, stepIndex) => {
            const source = controlsByStep.get(stepIndex);
            step.hidden = !source;
            if (!source) {
                return;
            }
            [
                'data-easystud-guided-target',
                'data-easystud-guided-mode',
                'data-easystud-guided-open',
                'data-easystud-guided-feedback',
                'data-easystud-guided-path',
            ].forEach(attribute => {
                const value = source.getAttribute(attribute);
                if (value !== null) {
                    step.setAttribute(attribute, value);
                } else {
                    step.removeAttribute(attribute);
                }
            });
            const label = step.querySelector('span:last-child strong');
            const description = step.querySelector('span:last-child small');
            if (label) {
                label.textContent = getGuidedControlLabel(source);
            }
            if (description) {
                description.textContent = source.getAttribute('data-easystud-guided-desc') || '';
            }
        });
    };

    const showReturnBanner = () => {
        if (!returnBanner) {
            return;
        }
        window.clearTimeout(returnTimer);
        returnBanner.hidden = false;
        returnTimer = window.setTimeout(() => {
            returnBanner.hidden = true;
            restoreParticipantDensity();
        }, 12000);
    };

    function updateGuidedPanel() {
        if (!guidedPanel) {
            return;
        }
        const visibleSteps = guidedPanelSteps.filter(step => !step.hidden);
        guidedPanelSteps.forEach((step, stepIndex) => {
            step.classList.toggle('is-active', stepIndex === guidedCurrent);
            step.classList.toggle('is-complete', guidedCompleted.has(stepIndex));
            step.setAttribute('aria-current', stepIndex === guidedCurrent ? 'step' : 'false');
        });
        if (guidedProgress) {
            const template = guidedProgress.getAttribute('data-progress-label') || '';
            guidedProgress.textContent = template
                .replace('{$a->done}', String(guidedCompleted.size))
                .replace('{$a->total}', String(visibleSteps.length))
                .replace('__done__', String(guidedCompleted.size))
                .replace('__total__', String(visibleSteps.length));
        }
        if (guidedMessage) {
            const messageBox = guidedMessage.closest('[data-easystud-guided-message]');
            const activeStep = guidedPanelSteps[guidedCurrent];
            const message = activeStep ? activeStep.getAttribute('data-easystud-guided-feedback') : '';
            const completeMessage = messageBox ? messageBox.getAttribute('data-complete-message') : '';
            const isComplete = visibleSteps.length > 0 && guidedCompleted.size >= visibleSteps.length && !!completeMessage;
            guidedPanel.classList.toggle('is-complete', isComplete);
            if (messageBox) {
                messageBox.classList.toggle('is-complete', isComplete);
            }
            if (guidedMessageIcon) {
                guidedMessageIcon.classList.toggle('fa-location-arrow', !isComplete);
                guidedMessageIcon.classList.toggle('fa-check-circle', isComplete);
            }
            if (isComplete) {
                guidedMessage.textContent = completeMessage;
            } else if (message) {
                guidedMessage.textContent = message;
            } else {
                guidedMessage.textContent = guidedDefaultMessage;
            }
        }
    }

    function hideGuidedPanel() {
        if (guidedPanel) {
            guidedPanel.hidden = true;
        }
    }

    function setGuidedDockImmediate(dock) {
        if (!guidedPanel || (dock !== 'left' && dock !== 'right')) {
            return;
        }
        guidedDock = dock;
        guidedPanel.classList.remove('is-dock-moving');
        guidedPanel.classList.toggle('is-docked-right', dock === 'right');
        guidedPanel.classList.toggle('is-docked-left', dock === 'left');
    }

    function prepareGuidedDockForSelector(selector) {
        const target = selector ? root.querySelector(selector) : null;
        if (!target) {
            return;
        }
        const rect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        setGuidedDockImmediate(rect.left < viewportWidth / 2 ? 'right' : 'left');
    }

    function runGuidedPanelStep(control, stepIndex) {
        if (!control) {
            return;
        }
        markDiscoverySeen();
        hideReturnBanner();
        const nextPath = control.getAttribute('data-easystud-guided-path') || 'main';
        if (nextPath !== guidedPath) {
            guidedPath = nextPath;
            guidedCurrent = 0;
            guidedCompleted.clear();
            syncGuidedPanelFromPath(guidedPath);
        } else {
            syncGuidedPanelFromPath(guidedPath);
        }
        guidedCurrent = Math.max(0, Math.min(stepIndex, guidedPanelSteps.length - 1));
        updateGuidedPanel();
        let guidedPanelShown = false;
        const revealGuidedPanel = target => {
            if (guidedPanelShown) {
                return;
            }
            guidedPanelShown = true;
            if (target && target.nodeType === 1) {
                const rect = target.getBoundingClientRect();
                const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
                setGuidedDockImmediate(rect.left < viewportWidth / 2 ? 'right' : 'left');
            } else {
                prepareGuidedDockForSelector(control.getAttribute('data-easystud-guided-target'));
            }
            if (guidedPanel) {
                guidedPanel.hidden = false;
                guidedPanel.classList.remove('is-minimized');
                guidedPanel.classList.remove('is-updated');
                // Restart a tiny pulse so the panel acknowledges the new objective.
                void guidedPanel.offsetWidth;
                guidedPanel.classList.add('is-updated');
            }
            updateGuidedPanel();
        };
        const feedback = control.getAttribute('data-easystud-guided-feedback') || '';
        if (feedback) {
            showNotification(root, feedback, 'info');
        }
        highlightInView(
            control.getAttribute('data-easystud-guided-target'),
            control.getAttribute('data-easystud-guided-mode'),
            control.getAttribute('data-easystud-guided-open'),
            {guided: true, beforeHighlight: revealGuidedPanel}
        );
        window.setTimeout(() => revealGuidedPanel(null), 520);
    }

    const clearTutorialHighlight = () => {
        window.clearTimeout(highlightTimer);
        window.clearInterval(highlightFollowTimer);
        highlightFollowTimer = null;
        if (highlightFrame) {
            window.cancelAnimationFrame(highlightFrame);
            highlightFrame = null;
        }
        highlightTarget = null;
        root.querySelectorAll('.is-tutorial-highlight').forEach(node => {
            node.classList.remove('is-tutorial-highlight');
        });
        if (highlightOverlay) {
            highlightOverlay.remove();
            highlightOverlay = null;
        }
    };

    const positionTutorialHighlightOverlay = () => {
        if (!highlightTarget) {
            return;
        }
        if (!highlightOverlay) {
            highlightOverlay = document.createElement('div');
            highlightOverlay.className = 'local-groupimport-easystud-tutorial-highlight-overlay';
            highlightOverlay.setAttribute('aria-hidden', 'true');
            document.body.appendChild(highlightOverlay);
        }
        const rect = highlightTarget.getBoundingClientRect();
        const padding = 8;
        const guardedTop = getFixedHeaderOffset() + 8;
        const overlayTop = Math.max(guardedTop, rect.top - padding);
        const hiddenHeight = Math.max(0, overlayTop - (rect.top - padding));
        highlightOverlay.style.left = Math.max(8, rect.left - padding) + 'px';
        highlightOverlay.style.top = overlayTop + 'px';
        highlightOverlay.style.width = Math.max(0, rect.width + (padding * 2)) + 'px';
        highlightOverlay.style.height = Math.max(0, rect.height + (padding * 2) - hiddenHeight) + 'px';
    };

    const scheduleTutorialHighlightOverlay = () => {
        if (!highlightTarget) {
            return;
        }
        if (highlightFrame) {
            return;
        }
        highlightFrame = window.requestAnimationFrame(() => {
            highlightFrame = null;
            positionTutorialHighlightOverlay();
        });
    };

    const rectsOverlap = (first, second, padding = 10) => {
        return first.left < second.right + padding &&
            first.right > second.left - padding &&
            first.top < second.bottom + padding &&
            first.bottom > second.top - padding;
    };

    const dockGuidedPanel = dock => {
        if (!guidedPanel || (dock !== 'left' && dock !== 'right') || guidedDock === dock) {
            return;
        }
        guidedDock = dock;
        window.clearTimeout(guidedDockTimer);
        guidedPanel.classList.remove('is-updated');
        guidedPanel.classList.add('is-dock-moving');
        guidedPanel.classList.toggle('is-docked-right', dock === 'right');
        guidedPanel.classList.toggle('is-docked-left', dock === 'left');
        guidedDockTimer = window.setTimeout(() => {
            if (guidedPanel) {
                guidedPanel.classList.remove('is-dock-moving');
            }
        }, 260);
    };

    const keepHighlightClearOfGuidedPanel = target => {
        if (!target || !guidedPanel || guidedPanel.hidden) {
            return;
        }
        const targetrect = target.getBoundingClientRect();
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        dockGuidedPanel(targetrect.left < viewportWidth / 2 ? 'right' : 'left');

        const panelrect = guidedPanel.getBoundingClientRect();
        if (!panelrect.width || !panelrect.height) {
            return;
        }
        if (!rectsOverlap(targetrect, panelrect, 18)) {
            return;
        }

        const headerOffset = getFixedHeaderOffset() + 18;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        let delta = 0;

        if (panelrect.top > viewportHeight / 2) {
            delta = targetrect.bottom - panelrect.top + 28;
        } else {
            delta = targetrect.top - panelrect.bottom - 28;
        }

        if (delta !== 0) {
            window.scrollBy({top: delta, behavior: 'smooth'});
            window.setTimeout(() => {
                const updated = target.getBoundingClientRect();
                if (updated.top < headerOffset) {
                    window.scrollBy({top: updated.top - headerOffset, behavior: 'smooth'});
                }
                scheduleTutorialHighlightOverlay();
            }, 260);
        }
    };

    const switchTutorialMode = mode => {
        if (!mode) {
            return false;
        }
        const button = root.querySelector('[data-easystud-layout-mode="' + mode + '"]');
        if (!button || button.getAttribute('aria-pressed') === 'true') {
            return false;
        }
        button.click();
        return true;
    };

    // A Guide request can arrive while the desktop layout is still settling
    // after its normal view control was clicked. Resolve creation fields only
    // after their real responsive workspace is active; focusing a hidden input
    // would make the Guide return panel appear without a usable highlight.
    const ensureTutorialCreationWorkspace = workspace => {
        if (isResponsiveWorkspace()) {
            const mobileView = root.querySelector('[data-easystud-mobile-view="' + workspace + '"]');
            if (mobileView && mobileView.getAttribute('aria-pressed') !== 'true') {
                mobileView.click();
            }
            return mobileView || null;
        }

        if (typeof root.easystudApplyDesktopMode === 'function') {
            root.easystudApplyDesktopMode('structure', false);
            return root;
        }

        const structureView = root.querySelector('[data-easystud-layout-mode="structure"]');
        if (structureView && structureView.getAttribute('aria-pressed') !== 'true') {
            structureView.click();
        }
        return structureView || null;
    };

    const openTutorialTarget = selector => {
        if (!selector) {
            return false;
        }
        if (selector === 'tutorial:participant-details') {
            const densityToggle = root.querySelector('[data-easystud-density-toggle]');
            if (root.classList.contains(compactClass) && densityToggle) {
                densityToggle.click();
                restoreCompactAfterTutorial = true;
            }
            const participant = root.querySelector('[data-easystud-participant-list] [data-easystud-user]');
            if (participant) {
                participant.focus({preventScroll: true});
            }
            scheduleParticipantTagOverflow(root);
            return participant || densityToggle || null;
        }
        if (selector === 'tutorial:first-group') {
            const group = root.querySelector('[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])') ||
                root.querySelector('[data-easystud-group-id]:not([hidden])');
            if (!group) {
                return false;
            }
            const grouping = group.closest('[data-easystud-grouping-id]');
            if (grouping) {
                expandGroupingSection(grouping);
            }
            const groupid = group.getAttribute('data-easystud-group-id');
            getGroupElementsById(root, groupid).forEach(copy => {
                const copytoggle = copy.querySelector('[data-easystud-group-members-toggle]');
                if (copytoggle) {
                    copytoggle.setAttribute('aria-expanded', 'true');
                }
                syncGroupMembersCollapsible(copy);
                scheduleGroupingResizeForGroup(copy);
            });
            group.focus({preventScroll: true});
            return group;
        }
        if (selector === 'tutorial:first-grouping') {
            const grouping = root.querySelector('[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])') ||
                root.querySelector('[data-easystud-grouping-id]:not([hidden])');
            if (!grouping) {
                return false;
            }
            expandGroupingSection(grouping);
            const groupingToggle = grouping.querySelector('[data-easystud-grouping-groups-toggle]');
            if (groupingToggle) {
                groupingToggle.setAttribute('aria-expanded', 'true');
                syncGroupingGroupsCollapsible(grouping);
            }
            grouping.focus({preventScroll: true});
            return grouping;
        }
        if (selector === 'tutorial:create-group') {
            const workspace = ensureTutorialCreationWorkspace('groups');
            const input = root.querySelector('.local-groupimport-easystud-create-row input[name="groupname"]') ||
                root.querySelector('.local-groupimport-easystud-create-row input[name="groupingname"]');
            if (!input) {
                return workspace;
            }
            input.focus({preventScroll: true});
            input.select();
            return input;
        }
        if (selector === 'tutorial:create-grouping') {
            const workspace = ensureTutorialCreationWorkspace('groupings');
            const input = root.querySelector('.local-groupimport-easystud-create-row input[name="groupingname"]') ||
                root.querySelector('.local-groupimport-easystud-create-row input[name="groupname"]');
            if (!input) {
                return workspace;
            }
            input.focus({preventScroll: true});
            input.select();
            return input;
        }
        if (selector === 'tutorial:first-grouping-add-groups') {
            const grouping = root.querySelector('[data-easystud-tree] [data-easystud-grouping-id]:not([hidden])') ||
                root.querySelector('[data-easystud-grouping-id]:not([hidden])');
            if (!grouping) {
                return false;
            }
            expandGroupingSection(grouping);
            const toggle = grouping.querySelector('[data-easystud-toggle-grouping-groups]');
            const panel = grouping.querySelector('[data-easystud-grouping-groups-panel]');
            if (toggle && panel && (panel.hidden || !panel.classList.contains('is-open'))) {
                toggle.click();
            }
            const box = grouping.querySelector('[data-easystud-grouping-groups-box]');
            if (box) {
                box.focus({preventScroll: true});
            }
            return panel || grouping;
        }
        if (selector === 'tutorial:add-users-text') {
            const group = root.querySelector('[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])') ||
                root.querySelector('[data-easystud-group-id]:not([hidden])');
            if (!group) {
                return false;
            }
            const grouping = group.closest('[data-easystud-grouping-id]');
            if (grouping) {
                expandGroupingSection(grouping);
            }
            const groupid = group.getAttribute('data-easystud-group-id');
            const panel = ensureGroupEmailPanel(group, groupid, getLabels(root));
            if (panel && (panel.hidden || !panel.classList.contains('is-open'))) {
                setInlinePanelOpen(panel, true);
            }
            const textarea = group.querySelector('[data-easystud-group-email-box]');
            if (textarea) {
                textarea.focus({preventScroll: true});
            }
            return textarea || panel || group;
        }
        const target = root.querySelector(selector);
        if (!target) {
            return false;
        }
        if (target.matches('[data-easystud-advanced-filters-toggle]') &&
                target.getAttribute('aria-expanded') !== 'true') {
            target.click();
            return target;
        }
        if (target.matches('[data-easystud-toggle-group-email], [data-easystud-toggle-grouping-add]')) {
            target.click();
            return target;
        }
        target.click();
        return target;
    };

    // The shared Guide owns modal, transition and highlight timing. EasyStud
    // owns product-specific detail controls such as a participant card's
    // expanded content or a grouping's add-groups panel. This narrow event
    // lets a Guide slide request that real control after its workspace opens.
    const guideOpenTargetHandler = event => {
        const request = event.detail;
        if (!request || typeof request.target !== 'string' || !request.target.startsWith('tutorial:')) {
            return;
        }
        const opened = openTutorialTarget(request.target);
        if (opened) {
            request.handled = true;
        }
    };
    document.addEventListener('easyedu:guide-open-target', guideOpenTargetHandler);

    const highlightInView = (selector, mode, openSelector, options = {}) => {
        if (!selector) {
            return;
        }
        hideTutorialModal();
        const switched = switchTutorialMode(mode);
        const openedTarget = openTutorialTarget(openSelector);
        const opened = !!openedTarget;
        clearTutorialHighlight();
        window.clearTimeout(highlightDelayTimer);
        highlightDelayTimer = window.setTimeout(() => {
            let target = openedTarget && openedTarget.nodeType === 1 ? openedTarget : root.querySelector(selector);
            const missingTarget = !target;
            if (missingTarget) {
                target = root.querySelector('.local-groupimport-easystud-create-row') ||
                    root.querySelector('[data-easystud-tree]') ||
                    root.querySelector('.local-groupimport-easystud__layout-toggles');
            }
            if (!target) {
                return;
            }
            if (typeof options.beforeHighlight === 'function') {
                options.beforeHighlight(target);
            }
            target.classList.add('is-tutorial-highlight');
            highlightTarget = target;
            const targetRect = target.getBoundingClientRect();
            const headerOffset = getFixedHeaderOffset() + 18;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const bottomOffset = Math.min(Math.max(viewportHeight * 0.18, 110), 180);
            const usableHeight = Math.max(160, viewportHeight - headerOffset - bottomOffset);
            if (
                targetRect.top < headerOffset ||
                targetRect.bottom > viewportHeight - bottomOffset ||
                targetRect.height > usableHeight
            ) {
                window.scrollTo({
                    behavior: 'smooth',
                    top: Math.max(0, window.scrollY + targetRect.top - headerOffset),
                });
            }
            [180, 420, 760].forEach(delay => {
                window.setTimeout(() => keepHighlightClearOfGuidedPanel(target), delay);
            });
            [80, 220, 520, 900].forEach(delay => {
                window.setTimeout(scheduleTutorialHighlightOverlay, delay);
            });
            positionTutorialHighlightOverlay();
            window.clearInterval(highlightFollowTimer);
            highlightFollowTimer = window.setInterval(scheduleTutorialHighlightOverlay, 140);
            highlightTimer = window.setTimeout(() => {
                clearTutorialHighlight();
            }, 5200);
            if (missingTarget) {
                showNotification(root, modal.getAttribute('data-missing-target-message') || '', 'info');
            }
            if (!options.guided) {
                showReturnBanner();
            }
        }, switched || opened ? 340 : 40);
    };

    open.addEventListener('click', () => {
        markDiscoverySeen();
        openModalAt(index);
    });
    if (returnButton) {
        returnButton.addEventListener('click', () => {
            openModalAt(index);
        });
    }
    if (dismissReturn) {
        dismissReturn.addEventListener('click', () => {
            hideReturnBanner();
            restoreParticipantDensity();
        });
    }
    if (guidedClose) {
        guidedClose.addEventListener('click', () => {
            hideGuidedPanel();
            clearTutorialHighlight();
            restoreParticipantDensity();
        });
    }
    if (guidedMinimize && guidedPanel) {
        guidedMinimize.addEventListener('click', () => {
            const minimized = !guidedPanel.classList.contains('is-minimized');
            guidedPanel.classList.toggle('is-minimized', minimized);
            guidedMinimize.setAttribute('aria-expanded', minimized ? 'false' : 'true');
            guidedMinimize.setAttribute(
                'aria-label',
                minimized ?
                    (guidedMinimize.getAttribute('data-expand-label') || '') :
                    (guidedMinimize.getAttribute('data-minimize-label') || '')
            );
            const icon = guidedMinimize.querySelector('.fa');
            if (icon) {
                icon.classList.toggle('fa-minus', !minimized);
                icon.classList.toggle('fa-expand', minimized);
            }
        });
    }
    if (guidedReturn) {
        guidedReturn.addEventListener('click', () => {
            openModalAt(guidedSlideIndex >= 0 ? guidedSlideIndex : index);
        });
    }
    guidedPanelSteps.forEach((step, stepIndex) => {
        step.addEventListener('click', () => runGuidedPanelStep(step, stepIndex));
    });
    if (discoveryStart) {
        discoveryStart.addEventListener('click', () => {
            markDiscoverySeen();
            openModalAt(0);
        });
    }
    if (discoveryDismiss) {
        discoveryDismiss.addEventListener('click', markDiscoverySeen);
    }
    close.addEventListener('click', closeModal);
    modal.addEventListener('click', event => {
        const guidedAction = event.target.closest('[data-easystud-guided-action]');
        if (guidedAction && modal.contains(guidedAction)) {
            const stepIndex = parseInt(guidedAction.getAttribute('data-easystud-guided-step') || '0', 10);
            runGuidedPanelStep(guidedAction, stepIndex);
            return;
        }
        const highlight = event.target.closest('[data-easystud-tutorial-highlight]');
        if (highlight && modal.contains(highlight)) {
            highlightInView(
                highlight.getAttribute('data-easystud-tutorial-highlight'),
                highlight.getAttribute('data-easystud-tutorial-mode'),
                highlight.getAttribute('data-easystud-tutorial-open')
            );
            return;
        }
        if (event.target === modal) {
            closeModal();
        }
    });
    modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeModal();
            return;
        }
        if (event.key === 'ArrowLeft') {
            event.preventDefault();
            update(index - 1, true);
            const activeNav = navItems[index] || prev || close;
            activeNav.focus();
            return;
        }
        if (event.key === 'ArrowRight') {
            event.preventDefault();
            update(index + 1, true);
            const activeNav = navItems[index] || next || close;
            activeNav.focus();
        }
    });
    if (prev) {
        prev.addEventListener('click', () => update(index - 1, true));
    }
    if (next) {
        next.addEventListener('click', () => {
            if (index === steps.length - 1) {
                markDiscoverySeen();
                closeModal();
                return;
            }
            update(index + 1, true);
        });
    }
    navItems.forEach((item, itemIndex) => {
        item.addEventListener('click', () => update(itemIndex, true));
    });
    root.addEventListener('easystud:guided-complete', event => {
        const step = event.detail ? parseInt(event.detail.step, 10) : NaN;
        const path = event.detail && event.detail.path ? event.detail.path : 'main';
        if (path !== guidedPath) {
            return;
        }
        if (Number.isNaN(step) || step < 0 || step >= guidedPanelSteps.length) {
            return;
        }
        guidedCompleted.add(step);
        guidedCurrent = step;
        if (guidedPanel && !guidedPanel.hidden) {
            guidedPanel.classList.remove('is-updated');
            void guidedPanel.offsetWidth;
            guidedPanel.classList.add('is-updated');
        }
        updateGuidedPanel();
    });
    navScrollButtons.forEach(button => {
        button.addEventListener('click', () => {
            const direction = parseInt(button.getAttribute('data-easystud-tutorial-nav-scroll') || '0', 10);
            scrollTutorialNav(direction);
        });
    });
    if (nav) {
        nav.addEventListener('wheel', event => {
            if (!event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
                return;
            }
            event.preventDefault();
            nav.scrollLeft += event.deltaY;
            updateNavScrollButtons();
        }, {passive: false});
        nav.addEventListener('scroll', updateNavScrollButtons, {passive: true});
        window.addEventListener('resize', updateNavScrollButtons);
    }
    document.addEventListener('scroll', scheduleTutorialHighlightOverlay, {capture: true, passive: true});
    window.addEventListener('resize', scheduleTutorialHighlightOverlay);

    update(0);
    updateGuidedPanel();
    if (discovery && !isDiscoverySeen()) {
        discovery.hidden = false;
    }
};

// Bind optional tools that should not take permanent screen space.
const bindOptionalTools = root => {
    const densityToggle = root.querySelector('[data-easystud-density-toggle]');
    const modal = root.querySelector('[data-easystud-clipboard-modal]');
    const openClipboardButtons = Array.from(root.querySelectorAll(
        '[data-easystud-open-clipboard], [data-easyedu-navigation-action="open-clipboard"]'
    ));
    const closeClipboard = root.querySelector('[data-easystud-close-clipboard]');

    if (densityToggle) {
        const updateDensityToggle = () => {
            const compact = root.classList.contains(compactClass);
            densityToggle.setAttribute('aria-pressed', compact ? 'true' : 'false');
            const text = densityToggle.querySelector('span:last-child');
            if (text) {
                text.textContent = compact ?
                    (densityToggle.getAttribute('data-detailed-label') || '') :
                    (densityToggle.getAttribute('data-compact-label') || '');
            }
            const icon = densityToggle.querySelector('.fa');
            if (icon) {
                icon.classList.toggle('fa-compress', !compact);
                icon.classList.toggle('fa-expand', compact);
            }
        };

        densityToggle.addEventListener('click', () => {
            const compact = !root.classList.contains(compactClass);
            const participantList = root.querySelector('[data-easystud-participant-list]');
            const applyDensity = () => {
                root.classList.toggle(compactClass, compact);
                root.classList.remove('local-groupimport-easystud--single-participant-selected');
                root.querySelectorAll('.is-density-expanded').forEach(card => card.classList.remove('is-density-expanded'));
                root.easystudExpandedParticipant = null;
                updateDensityToggle();
                scheduleResponsiveUiRefresh(root);
            };
            if (participantList) {
                Motion.swap(participantList, applyDensity, {
                    exitDuration: Motion.timing.fast,
                    enterDuration: Motion.timing.normal,
                }).then(() => requestGuideHighlightRefresh(root));
            } else {
                applyDensity();
            }
        });

        updateDensityToggle();
    }

    if (modal && openClipboardButtons.length && closeClipboard) {
        let lastClipboardOpener = openClipboardButtons[0];
        const restoreClipboardFocus = () => {
            const panel = lastClipboardOpener.closest('[data-easyedu-navigation-panel]');
            const trigger = panel && root.querySelector('[data-easyedu-navigation-open]');
            (trigger || lastClipboardOpener).focus();
        };
        openClipboardButtons.forEach(button => button.addEventListener('click', () => {
            lastClipboardOpener = button;
            showEasyStudModal(modal);
            const textarea = modal.querySelector('[data-easystud-paste-box]');
            if (textarea) {
                textarea.focus();
            }
        }));
        closeClipboard.addEventListener('click', () => {
            hideEasyStudModal(modal, restoreClipboardFocus);
        });
        modal.addEventListener('click', event => {
            if (event.target === modal) {
                hideEasyStudModal(modal, restoreClipboardFocus);
            }
        });
    }
};

// Bind paste recognition preview.
const bindPastePreview = root => {
    const box = root.querySelector('[data-easystud-paste-box]');
    const results = root.querySelector('[data-easystud-paste-results]');
    if (!box || !results) {
        return;
    }

    const knownIdentifiers = getKnownUserIdentifiers(root);
    const render = () => renderIdentifierPreview(box, results, knownIdentifiers);

    box.addEventListener('input', render);
    box.addEventListener('paste', () => window.setTimeout(render, 0));
};

// Initialise the manager.
export const init = (rootId, courseId) => {
    onReady(() => {
        const root = document.getElementById(rootId);
        if (!root) {
            return;
        }
        if (root.getAttribute('data-easystud-manager-initialised') === '1' ||
                root.getAttribute('data-easystud-manager-initialising') === '1') {
            return;
        }
        root.setAttribute('data-easystud-manager-initialising', '1');

        // The parallel loading bootstrap owns the inert gate. Keep it in place
        // until bindings and two paint frames have completed, so no unfinished
        // visual DOM is exposed between the skeleton and the manager.
        const loadingController = root.easystudLoadingController;

        Motion.init(root);

        [
            () => bindFilters(root),
            () => bindSelection(root),
            () => bindGuideBottomObstruction(root),
            () => bindPanelActionOverflow(root),
            () => bindTree(root),
            () => bindGroupDragDrop(root, courseId),
            () => bindUserDragDrop(root, courseId),
            () => bindQuickCreate(root, courseId),
            () => bindRenameForms(root, courseId),
            () => ensureInlinePanelCancelButtons(root),
            () => bindGroupMemberActions(root, courseId),
            () => bindGroupingGroupActions(root, courseId),
            () => bindBulkActions(root, courseId),
            () => bindMoveModal(root, courseId),
            () => bindParticipantMessaging(root),
            () => ensureDuplicateButtons(root),
            () => ensureAdvancedSettingsButtons(root),
            () => normaliseAllGroupGroupingTags(root),
            () => bindNestedGroupActionMenus(root),
            () => bindDuplicateActions(root, courseId),
            () => bindAdvancedSettings(root),
            () => bindContextMenu(root, courseId),
            () => bindCatalogFilters(root),
            () => bindContainerGroupSearch(root),
            () => bindGroupMemberSearch(root),
            () => bindAdvancedFilters(root),
            () => bindGroupMemberToggles(root),
            () => bindTagToggles(root),
            () => bindPagination(root),
            () => bindParticipantModal(root),
            () => bindSharedGuideTargets(root),
            () => bindTutorialModal(root),
            () => bindOptionalTools(root),
            () => bindPastePreview(root),
            () => bindHoverPopovers(root),
             () => bindCanonicalNavigation(root),
             () => bindResponsiveParticipantNavigation(root),
             () => bindResponsiveGuideLauncher(root),
            () => bindBackToTop(root),
            () => bindLayoutModeToggle(root),
            () => bindMobileEntityViews(root),
            () => syncResponsiveDragAvailability(root),
            () => bindResponsiveDragGuard(root),
            () => normaliseMemberRemoveLabels(root),
            () => applyFilters(root),
            () => syncPagination(root),
            () => scheduleGroupGroupingOverflow(root),
            () => scheduleParticipantTagOverflow(root),
            () => {
                const refreshResponsiveUi = () => {
                    scheduleResponsiveUiRefresh(root);
                    scheduleCompleteListAlignment(root);
                    scheduleGroupGroupingOverflow(root);
                };
                window.addEventListener('resize', refreshResponsiveUi);
                window.addEventListener('orientationchange', refreshResponsiveUi);
            },
            () => syncUngroupedState(root, getLabels(root)),
            () => root.querySelectorAll('[data-easystud-grouping-id]').forEach(section => {
                syncGroupingChildrenState(section, getLabels(root));
            }),
            () => syncAllCountBadges(root),
            () => updateParticipantEmptyState(root),
        ].forEach(runSafely);

        scheduleResponsiveUiRefresh(root, {guide: false});
        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                root.removeAttribute('data-easystud-manager-initialising');
                root.setAttribute('data-easystud-manager-initialised', '1');
                if (!loadingController || typeof loadingController.complete !== 'function') {
                    root.classList.remove('local-groupimport-easystud--booting');
                }
            });
        });
    });
};
