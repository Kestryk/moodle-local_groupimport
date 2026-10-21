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
 * EasyStud course manager: participant and group card primitives (names, grouping tags,
 * member counts, member "Select all", card lookup and id-based selection on cards).
 *
 * @module     local_groupimport/local/cm/cards
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {countLabel} from '../sm/index';
import {getDetachedCard} from '../sm/participants';
import {getDetachedGroupCard} from '../sm/groups';
import {
    selectedClass, isResponsiveWorkspace, requestGuideHighlightRefresh, normalise, getLabels, getSelectionInput,
    areSelectionTypesCompatible, escapeHtml,
} from './shared';
import {getOnDemandModel} from './state';
import {prepareInlinePanelFocus, restoreInlinePanelFocus} from './modal';
import {scheduleCompleteListAlignment} from './layout';
import {setEmptyHelp} from './drag_support';
import {syncTagWindow, normaliseTagValue} from './long_lists';

export const getGroupName = group => {
    const node = group ? group.querySelector('.local-groupimport-easystud-group__name') : null;
    return node ? node.textContent.trim() : '';
};

const getGroupingName = grouping => {
    const node = grouping ? grouping.querySelector('.local-groupimport-easystud-grouping__name') : null;
    return node ? node.textContent.trim() : '';
};

export const insertGroupElementSorted = (container, element) => {
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

export const insertGroupingElementSorted = (container, element) => {
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

export const animateElementCreated = element => {
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

export const animateElementRemoval = (element, onremove) => {
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

export const getGroupElementsById = (root, groupid) => Array.from(
    root.querySelectorAll('[data-easystud-group-id="' + groupid + '"]')
);

/**
 * Whether a course group exists. On demand, a group is often not drawn (other page, closed
 * section, hidden catalog): the state answers; the legacy page draws every group.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {String|Number} groupid Group id.
 * @returns {Boolean}
 */
export const groupExists = (root, groupid) => {
    const model = getOnDemandModel(root);
    if (model && model.groups) {
        return model.groups.has(Number(groupid));
    }
    return getGroupElementsById(root, groupid).length > 0;
};

/**
 * Whether the checklist of a guided path is open.
 *
 * @param {String} path Guided path id.
 * @returns {Boolean}
 */
export const isGuidePathOpen = path => {
    const checklist = document.querySelector('[data-easyedu-guide-checklist][data-easyedu-guide-path="' + path + '"]');
    return !!checklist && !checklist.hidden;
};

export const getTreeGroupElementsById = (root, groupid) => {
    const tree = root.querySelector('[data-easystud-tree]');
    if (!tree) {
        return [];
    }
    return Array.from(tree.querySelectorAll('[data-easystud-group-id="' + groupid + '"]')).filter(group => {
        return !group.closest('.local-groupimport-easystud-structure-groups');
    });
};

const getGroupingIdsForGroup = (root, groupid) => {
    const model = getOnDemandModel(root);
    if (model) {
        const group = model.groups.get(Number(groupid));
        return group ? (group.groupingids || []).filter(id => model.groupings.has(id)).map(String) : [];
    }
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

export const getGroupsWithGroupingMembership = (root, groups) => {
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

export const renderGroupGroupingTags = (container, groupingnames) => {
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
        countLabel(overflowLabel, groupingnames.length) :
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

export const setAdvancedAttributes = (element, data, type) => {
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
export const rehydrateParticipantMembershipDetails = root => {
    if (!root) {
        return;
    }
    // A bounded card is never evidence of the full membership graph. RefreshModel
    // and the participant renderer already own the complete model-backed payload.
    if (getOnDemandModel(root)) {
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

export const updateCatalogGroupingTags = (root, groupid) => {
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
    const responsive = isResponsiveWorkspace();
    // Show every container first, then measure them all, then apply: one layout for all cards
    // instead of one per card.
    const entries = [];
    root.querySelectorAll('.local-groupimport-easystud-group__groupings--inline').forEach(container => {
        const group = container.closest('[data-easystud-group-id]');
        if (!group) {
            return;
        }

        if (responsive) {
            container.hidden = false;
            group.classList.remove('is-groupings-summary-hidden');
            syncMaskedGroupingMenuTrigger(group, false);
            syncMaskedGroupingDescription(group, container, false, false);
            return;
        }

        // Measure the complete pill before deciding whether it may remain in the header.
        container.hidden = false;
        entries.push({group, container});
    });
    entries.forEach(entry => {
        const {container} = entry;
        if (container.clientWidth < 1) {
            return;
        }
        const pills = Array.from(container.querySelectorAll('.local-groupimport-easystud-token--grouping'));
        entry.masked = container.scrollWidth > container.clientWidth || pills.some(pill =>
            pill.scrollWidth > pill.clientWidth
        );
    });
    entries.filter(entry => entry.masked !== undefined).forEach(({group, container, masked}) => {
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

/**
 * Rebuild the grouping tags of one group card from its data-grouping-ids.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} container Inline grouping tags container of the card.
 */
export const normaliseGroupGroupingTags = (root, container) => {
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
};

export const normaliseAllGroupGroupingTags = root => {
    root.querySelectorAll('.local-groupimport-easystud-group__groupings--inline')
        .forEach(container => normaliseGroupGroupingTags(root, container));
};

// P1: requests made before the next frame share one measurement.
const groupingOverflowFrames = new WeakSet();
export const scheduleGroupGroupingOverflow = root => {
    if (groupingOverflowFrames.has(root)) {
        return;
    }
    groupingOverflowFrames.add(root);
    window.requestAnimationFrame(() => {
        groupingOverflowFrames.delete(root);
        syncGroupGroupingOverflow(root);
    });
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

export const syncParticipantTagOverflow = scope => {
    const root = scope.matches && scope.matches('#local-groupimport-easystud') ?
        scope : scope.closest('#local-groupimport-easystud');
    if (!root) {
        return;
    }
    const pendingMeasurements = [];
    const rows = Array.from(scope.querySelectorAll('.local-groupimport-easystud-user__meta-tags'))
        .map(container => {
        const window = syncTagWindow(container);
        if (window) {
            // Both payload-backed and legacy rows enter the same sanitiser, titles,
            // disclosure styling and batched overflow measurement below.
            const known = Array.from(container.querySelectorAll('span.local-groupimport-easystud-token'));
            const toggle = container.querySelector('[data-easystud-toggle-tags]');
            window.items.slice(0, window.limit).forEach((value, index) => {
                const token = known[index] || document.createElement('span');
                token.className = container.getAttribute('data-easystud-token-class') ||
                    'local-groupimport-easystud-token';
                token.textContent = value;
                if (!token.parentElement) {
                    container.insertBefore(token, toggle);
                }
            });
            known.slice(Math.min(window.limit, window.total)).forEach(token => token.remove());
        }
        const tokens = Array.from(container.querySelectorAll('.local-groupimport-easystud-token:not(.local-groupimport-easystud-token--empty):not([data-easystud-toggle-tags])'));
        container.querySelectorAll('.local-groupimport-easystud-token--empty').forEach(token => {
            token.hidden = true;
        });
        const values = tokens.filter(token => {
            const text = normaliseTagValue(token.textContent);
            token.hidden = !text;
            if (!token.hidden) {
                token.textContent = text;
                // K17-22: the Kit bubble, shown only when the pill text is really truncated (no native title).
                token.setAttribute('data-easystud-hover-help', text);
                token.setAttribute('data-easystud-hover-help-truncated', '1');
            }
            return !token.hidden;
        });
        return {container, tokens: values, window};
    });
    // Read every row width after all the writes above: one layout pass instead of one per row,
    // which costs seconds on large pages.
    const rowWidths = rows.map(({container}) => container.clientWidth);
    rows.forEach(({container, tokens, window}, rowIndex) => {
        let toggle = container.querySelector('[data-easystud-toggle-tags]');
        const expanded = toggle && toggle.getAttribute('data-expanded') === '1';

        if (!tokens.length || rowWidths[rowIndex] < 1) {
            if (toggle) {
                toggle.hidden = true;
            }
            return;
        }

        toggle = ensureTagToggle(container, root);
        syncTagToggleStyle(toggle, tokens[0]);
        toggle.hidden = false;
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (window && window.viewAll) {
            toggle.setAttribute('data-easystud-open-user', container.closest('[data-easystud-user]')
                .getAttribute('data-user-id'));
            toggle.setAttribute('data-easystud-long-list-action', 'all');
            toggle.setAttribute('aria-label', (getLabels(root).longlistall || '')
                .replace('__total__', window.total));
        } else {
            toggle.removeAttribute('data-easystud-open-user');
            toggle.removeAttribute('data-easystud-long-list-action');
            toggle.removeAttribute('aria-label');
        }

        if (expanded) {
            toggle.textContent = toggle.getAttribute('data-less-label') || getLabels(root).showless || '';
            return;
        }

        toggle.textContent = '+' + (window ? window.total : tokens.length);
        pendingMeasurements.push({container, tokens, toggle, total: window ? window.total : tokens.length});
    });

    // Read all rows together, then write all visibility states together. This avoids one style/layout pass per row.
    const measurements = pendingMeasurements.map(({container, tokens, toggle, total}) => {
        const styles = window.getComputedStyle(container);
        const gap = parseFloat(styles.columnGap || styles.gap || '0') || 0;
        const available = container.clientWidth;
        const togglewidth = toggle.getBoundingClientRect().width + gap;
        const tokenwidths = tokens.map(token => token.getBoundingClientRect().width);
        return {tokens, toggle, gap, available, togglewidth, tokenwidths, total};
    });

    measurements.forEach(({tokens, toggle, gap, available, togglewidth, tokenwidths, total}) => {
        let used = 0;
        let hidden = total - tokens.length;
        let visible = 0;

        const visibility = tokenwidths.map(tokenwidth => {
            const width = tokenwidth + (visible > 0 ? gap : 0);
            if (visible > 0 && used + width + togglewidth > available) {
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

export const scheduleParticipantTagOverflow = root => {
    window.requestAnimationFrame(() => syncParticipantTagOverflow(root));
};

export const syncGroupingChildrenState = (section, labels) => {
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
        empty.className = 'local-groupimport-easystud-tree__empty easyedu-entity-card-empty easyedu-entity-card-empty--grouping';
        const icon = document.createElement('span');
        icon.className = 'easyedu-entity-card-empty__icon';
        icon.setAttribute('aria-hidden', 'true');
        const glyph = document.createElement('span');
        glyph.className = 'fa fa-layer-group';
        icon.appendChild(glyph);
        const copy = document.createElement('span');
        copy.className = 'easyedu-entity-card-empty__copy';
        const message = document.createElement('span');
        message.textContent = labels.nogroupsingrouping || '';
        const help = document.createElement('small');
        help.className = 'easyedu-entity-card-empty__help';
        setEmptyHelp(help, labels.nogroupsingroupinghelp, labels.nogroupsingroupinghelptouch);
        copy.append(message, help);
        empty.append(icon, copy);
        children.appendChild(empty);
    }
};

export const syncUngroupedState = (root, labels) => {
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

/**
 * Members of a group card. On demand, a folded card renders only its first rows and notes
 * the full count (lever 2); the legacy page renders every row.
 *
 * @param {HTMLElement} group Group card.
 * @returns {Number}
 */
export const getGroupMemberCount = group => (group.hasAttribute('data-easystud-member-total') ?
    Number(group.getAttribute('data-easystud-member-total')) :
    group.querySelectorAll('[data-easystud-group-members] [data-easystud-member-id]').length);

/**
 * R10-05: member rows rendered in a group card.
 *
 * @param {HTMLElement} group Group card.
 * @returns {HTMLElement[]}
 */
export const getGroupMemberRows = group =>
    Array.from(group.querySelectorAll(':scope > [data-easystud-group-members] > [data-selectable-type="member"]'));

/**
 * R10-05: the member search typed in a group card, normalised as applyGroupMemberSearchToGroup reads it.
 *
 * @param {HTMLElement} group Group card.
 * @returns {String} Empty when the card is not searched.
 */
export const getGroupMemberSearchQuery = group => {
    const groupid = group.getAttribute('data-easystud-group-id') || '';
    const input = group.querySelector(':scope > [data-easystud-group-member-search-panel="' + groupid + '"] ' +
        '[data-easystud-group-member-search="' + groupid + '"]');
    return normalise(input ? input.value : '');
};

/**
 * R10-05: whether every member of a group card is selected. A lean catalog card counts its
 * members in the on-demand selection, since its other rows are not rendered.
 *
 * @param {HTMLElement} group Group card.
 * @returns {Boolean}
 */
export const isGroupFullySelected = group => {
    if (group.hasAttribute('data-easystud-sm-members-partial')) {
        const model = getOnDemandModel();
        const key = group.getAttribute('data-easystud-sm-catalog');
        if (!model) {
            return false;
        }
        const prefix = group.getAttribute('data-easystud-group-id') + ':';
        let selected = 0;
        model.selectedMembers.forEach((catalogkey, memberkey) => {
            if ((!key || catalogkey === key) && memberkey.startsWith(prefix)) {
                selected++;
            }
        });
        return selected >= getGroupMemberCount(group);
    }
    const rows = getGroupMemberRows(group);
    return rows.length > 0 && rows.every(row => row.classList.contains(selectedClass));
};

/**
 * R10-05: show the member "Select all" of a card from three members (its total, not its
 * rendered rows) and give it its label. Under a member search it only adds the matching
 * members, so it stays "Select all".
 *
 * @param {HTMLElement} group Group card.
 * @param {String|null} activetype Active selection type, or null to read it from the root.
 */
export const syncGroupSelectAll = (group, activetype = null) => {
    const button = group.querySelector(':scope > [data-easystud-group-select-all-row] > [data-easystud-group-select-all]');
    if (!button) {
        return;
    }
    const visible = getGroupMemberCount(group) > 2;
    button.parentElement.hidden = !visible;
    if (!visible) {
        return;
    }
    const searching = getGroupMemberSearchQuery(group) !== '';
    const state = !searching && isGroupFullySelected(group) ? 'deselect' : 'select';
    const label = button.getAttribute('data-easystud-' + state + '-label') || '';
    if (button.textContent !== label) {
        button.textContent = label;
    }
    const name = group.querySelector(':scope > .local-groupimport-easystud-group__header .local-groupimport-easystud-group__name');
    button.setAttribute('aria-label', (button.getAttribute('data-easystud-' + state + '-aria') || '')
        .replace('__name__', name ? name.textContent.trim() : ''));
    const root = group.closest('[data-easystud-selection-type]');
    const type = activetype === null && root ? root.getAttribute('data-easystud-selection-type') : activetype;
    // Same rule as the member checkboxes: members are only selected when no other type is.
    button.disabled = !areSelectionTypesCompatible(type, 'member') ||
        (searching && !getGroupMemberRows(group).some(row => !row.hidden));
};

/**
 * R10-05: member "Select all" row of a group card built in the browser (createGroupElement).
 *
 * @param {Number|String} groupid Group id.
 * @param {Object} labels EasyStud labels.
 * @returns {String}
 */
export const groupSelectAllRowHtml = (groupid, labels) => {
    const texts = {
        'select-label': labels.selectall,
        'deselect-label': labels.deselectall,
        'select-aria': labels.selectallmembersof,
        'deselect-aria': labels.deselectallmembersof,
    };
    return '<div class="local-groupimport-easystud-group__select-all-row" data-easystud-group-select-all-row="' +
        escapeHtml(groupid) +
        '" hidden><button type="button" class="btn btn-link p-0 local-groupimport-easystud-group__select-all" ' +
        'data-easystud-group-select-all="' + escapeHtml(groupid) + '"' +
        Object.keys(texts).map(key => ' data-easystud-' + key + '="' + escapeHtml(texts[key] || '') + '"').join('') +
        '></button></div>';
};

export const collapseGroupingSection = grouping => {
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

export const collapseAllGroupings = root => {
    root.querySelectorAll('[data-easystud-grouping-id].is-expanded').forEach(collapseGroupingSection);
};

export const setRenameEditing = (form, editing) => {
    if (!form) {
        return;
    }
    const edit = form.querySelector('.local-groupimport-easystud-rename__edit');
    const toggle = form.querySelector('[data-easystud-rename-toggle]');
    const header = form.closest('.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header');
    if (edit && editing) {
        prepareInlinePanelFocus(edit);
    }
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
    if (edit && !editing) {
        restoreInlinePanelFocus(edit);
    }
};

// K16-85 (Kevin 16/10): one card shows one inline panel at a time. Opening the member search, the
// add-by-identifier box, the grouping search or the add-groups box closes the card's other open
// panel (through its own Cancel when it has one, so a pending search is cleared too) and its
// action loses its active state.
const INLINE_CARD_PANELS = [
    ['[data-easystud-group-member-search-panel]', '[data-easystud-group-member-search-toggle]',
        '[data-easystud-group-member-search-cancel]'],
    ['[data-easystud-container-search-panel]', '[data-easystud-container-search-toggle]', null],
    ['[data-easystud-group-email-panel]', '[data-easystud-toggle-group-email]', '[data-easystud-cancel-group-email]'],
    ['[data-easystud-grouping-groups-panel]', '[data-easystud-toggle-grouping-groups]', null],
];
const INLINE_CARD_OWNER = '[data-easystud-group-id], [data-easystud-grouping-id]';

const closeOtherInlinePanels = panel => {
    const owner = panel.closest(INLINE_CARD_OWNER);
    if (!owner) {
        return;
    }
    const own = element => element.closest(INLINE_CARD_OWNER) === owner;
    INLINE_CARD_PANELS.forEach(([panelSelector, toggleSelector, cancelSelector]) => {
        if (panel.matches(panelSelector)) {
            return;
        }
        owner.querySelectorAll(panelSelector).forEach(other => {
            if (!own(other) || other.hidden || !other.classList.contains('is-open')) {
                return;
            }
            const cancel = cancelSelector ? other.querySelector(cancelSelector) : null;
            if (cancel) {
                cancel.click();
            } else {
                setInlinePanelOpen(other, false);
            }
        });
        owner.querySelectorAll(toggleSelector).forEach(toggle => {
            if (own(toggle)) {
                toggle.classList.remove('is-active');
            }
        });
    });
};

export const setInlinePanelOpen = (panel, open) => {
    if (!panel) {
        return Promise.resolve(false);
    }
    const root = panel.closest('#local-groupimport-easystud');
    requestGuideHighlightRefresh(root);
    if (open) {
        closeOtherInlinePanels(panel);
    }

    // Canonical framed disclosure is opt-in: preserve accepted tree/card Motion.
    if (panel.matches('[data-easystud-group-member-search-panel], [data-easystud-container-search-panel], ' +
            '[data-easystud-group-email-panel], [data-easystud-grouping-groups-panel]')) {
        if (open) {
            prepareInlinePanelFocus(panel);
        }
        return Motion.disclosePanel(panel, open, {onComplete: () => requestGuideHighlightRefresh(root)}).then(completed => {
            if (completed && !open && panel.hidden) {
                restoreInlinePanelFocus(panel);
            }
            return completed;
        });
    }
    panel.classList.toggle('is-open', open);
    const complete = () => requestGuideHighlightRefresh(root);
    if (open) {
        return Motion.expand(panel, {duration: Motion.timing.slow, onComplete: complete});
    }
    return Motion.collapse(panel, {duration: Motion.timing.slow, onComplete: complete});
};

/**
 * Reflect the id-based selection on one card (page card or detached copy).
 *
 * @param {Object} model Participant model.
 * @param {HTMLElement} card Participant card.
 * @returns {HTMLElement}
 */
export const syncCardSelection = (model, card) => {
    const selected = model.selected.has(Number(card.getAttribute('data-user-id')));
    card.classList.toggle(selectedClass, selected);
    const input = getSelectionInput(card);
    if (input) {
        input.checked = selected;
    }
    // K21-37: selecting a participant card expands its roles/groups/groupings/custom-fields block;
    // deselecting it collapses it again. Applied per card here, same as the rest of this function,
    // so bulk paths (Select all / Select results) get it for free without a separate DOM pass.
    setParticipantMetaExpanded(card, selected);
    return card;
};

/**
 * The card of a participant: on the current page, or else (on demand) a detached copy.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {String|Number} userid User id.
 * @returns {HTMLElement|null}
 */
export const findParticipantCard = (root, userid) => {
    if (!userid) {
        return null;
    }
    const model = getOnDemandModel(root);
    if (!model) {
        // No participant card exists until the course state has loaded.
        return null;
    }
    // Page cards are indexed at render time: a document-wide query per id is far too slow on large courses.
    const card = model.pageCards.get(Number(userid));
    if (card && card.isConnected) {
        return card;
    }
    const detached = getDetachedCard(model, Number(userid));
    return detached ? syncCardSelection(model, detached) : null;
};

/**
 * Number of results of a paginated list, across all its pages.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} list Paginated list.
 * @param {Object} config Pagination config.
 * @returns {Number}
 */
export const getPaginationTotal = (root, list, config) => {
    const ondemand = getOnDemandList(root, list);
    if (ondemand) {
        return ondemand.ids.length;
    }
    return Array.from(list.children).filter(item => {
        if (!item.matches(config.selector)) {
            return false;
        }
        return !item.hidden || item.getAttribute('data-easystud-page-hidden') === '1';
    }).length;
};

/**
 * Select or deselect many participants by id (Select all / Select results).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Number[]} ids User ids.
 * @param {Boolean} selected New state.
 */
const setOnDemandParticipantsSelected = (root, ids, selected) => {
    const model = getOnDemandModel(root);
    ids.forEach(userid => {
        if (selected) {
            model.selected.add(userid);
        } else {
            model.selected.delete(userid);
        }
    });
    root.querySelectorAll('[data-easystud-participant-list] [data-easystud-user]').forEach(card => syncCardSelection(model, card));
    model.detached.forEach(card => syncCardSelection(model, card));
};

/**
 * Catalog key of a flat group catalog list: participants, structure, or '' for other lists.
 *
 * @param {HTMLElement|null} list List element.
 * @returns {String}
 */
export const catalogKeyOf = list => {
    if (!list || !list.classList) {
        return '';
    }
    if (list.classList.contains('local-groupimport-easystud-participant-groups__list')) {
        return 'participants';
    }
    return list.classList.contains('local-groupimport-easystud-structure-groups__list') ? 'structure' : '';
};

/**
 * Reflect the id-based group selection on one catalog card (page card or detached copy).
 *
 * @param {Object} model On-demand model.
 * @param {HTMLElement} card Group card.
 * @returns {HTMLElement}
 */
export const syncGroupCardSelection = (model, card) => {
    const key = card.getAttribute('data-easystud-sm-catalog');
    const selected = model.selectedGroups.get(Number(card.getAttribute('data-easystud-group-id'))) === key;
    card.classList.toggle(selectedClass, selected);
    const input = getSelectionInput(card);
    if (input) {
        input.checked = selected;
    }
    card.querySelectorAll('[data-easystud-member-id][data-selectable-type="member"]').forEach(row => {
        const rowselected = model.selectedMembers.get(row.getAttribute('data-selectable-id')) === key;
        row.classList.toggle(selectedClass, rowselected);
        const rowinput = getSelectionInput(row);
        if (rowinput) {
            rowinput.checked = rowselected;
        }
    });
    return card;
};

/**
 * The card of a catalog group: on the current page, or else a detached copy.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Number} groupid Group id.
 * @param {String} key Catalog key.
 * @returns {HTMLElement|null}
 */
export const findCatalogGroupCard = (root, groupid, key) => {
    const model = getOnDemandModel(root);
    if (key === 'structure') {
        const tree = root.querySelector('[data-easystud-tree] [data-easystud-group-id="' + Number(groupid) + '"]');
        if (tree) {
            return tree;
        }
    }
    const card = model.catalogs[key].pageCards.get(Number(groupid));
    if (card && card.isConnected) {
        return card;
    }
    const detached = getDetachedGroupCard(model, Number(groupid), key);
    return detached ? syncGroupCardSelection(model, detached) : null;
};

/**
 * Select or deselect many catalog groups by id (Select all / Select results).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {String} key Catalog key.
 * @param {Number[]} ids Group ids.
 * @param {Boolean} selected New state.
 */
const setOnDemandGroupsSelected = (root, key, ids, selected) => {
    const model = getOnDemandModel(root);
    ids.forEach(groupid => {
        if (selected) {
            model.selectedGroups.set(groupid, key);
        } else {
            model.selectedGroups.delete(groupid);
        }
    });
    const catalog = model.catalogs[key];
    catalog.pageCards.forEach(card => syncGroupCardSelection(model, card));
    catalog.detached.forEach(card => syncGroupCardSelection(model, card));
};

/**
 * Describe an on-demand list (participants or a group catalog), or null for a list paginated in
 * the DOM (the groupings tree) or while the state loads.
 *
 * @param {HTMLElement|null} root EasyStud root.
 * @param {HTMLElement|null} list List element.
 * @returns {Object|null} {type, ids, isSelected(id), card(id), select(ids, selected)}
 */
export const getOnDemandList = (root, list) => {
    const model = getOnDemandModel(root);
    if (!model || !list || !list.matches) {
        return null;
    }
    if (list.matches('[data-easystud-participant-list]')) {
        return {
            type: 'participant',
            ids: model.filteredIds,
            isSelected: userid => model.selected.has(userid),
            card: userid => findParticipantCard(root, userid),
            select: (ids, selected) => setOnDemandParticipantsSelected(root, ids, selected),
        };
    }
    const key = catalogKeyOf(list);
    if (!key) {
        return null;
    }
    return {
        type: 'group',
        ids: model.catalogs[key].filteredIds,
        isSelected: groupid => model.selectedGroups.get(groupid) === key,
        card: groupid => findCatalogGroupCard(root, groupid, key),
        select: (ids, selected) => setOnDemandGroupsSelected(root, key, ids, selected),
    };
};

/**
 * K21-16/K21-37: expand or collapse one participant card's roles/groups/groupings/custom-fields
 * block. There is no dedicated fold control on the card (K21-37): selecting the card is what
 * expands it, deselecting it is what collapses it again (the pre-K21-16 behaviour).
 *
 * @param {HTMLElement|null} card The participant card ([data-easystud-user]).
 * @param {Boolean} expanded Target state.
 */
export const setParticipantMetaExpanded = (card, expanded) => {
    const meta = card && card.querySelector('[data-easystud-user-meta]');
    if (!meta) {
        return;
    }
    // "Full information" density (local/sm/participants.setMetaExpandedOverride) always shows
    // complete cards: selection state must not re-collapse them while that override is active.
    const model = getOnDemandModel();
    const forced = Boolean(model && model.metaExpandedOverride === true);
    meta.hidden = !(expanded || forced);
};
