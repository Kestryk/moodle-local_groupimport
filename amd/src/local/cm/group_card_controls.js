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
 * EasyStud course manager: group card bindings (searches, menus, member toggles,
 * tag toggles, hover popovers).
 *
 * @module     local_groupimport/local/cm/group_card_controls
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {hoverPopoverClass, isResponsiveWorkspace, requestGuideHighlightRefresh, escapeHtml} from './shared';
import {scheduleGroupGroupingOverflow, syncParticipantTagOverflow, setInlinePanelOpen} from './cards';
import {getSelectedItems, setItemSelected} from './selection';
import {emitGuidedCompletion} from './guide_hooks';
import {
    syncGroupMembersCollapsible, syncAllGroupMembersCollapsible, syncGroupingGroupsCollapsible,
    syncAllGroupingGroupsCollapsible, scheduleGroupingResizeForGroup, ensureGroupMemberSearchControls,
    ensureNestedGroupActionMenus, animateTreeChildren,
} from './group_cards';
import {
    expandGroupingSection, applyContainerGroupSearch, applyGroupMemberSearch, scheduleResponsiveUiRefresh,
    updateSelectionActions,
} from './workspace';

let groupMemberMotionToken = 0;

export const bindContainerGroupSearch = root => {
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
                        input.focus({preventScroll: true});
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

export const bindGroupMemberSearch = root => {
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
                        input.focus({preventScroll: true});
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

export const bindNestedGroupActionMenus = root => {
    const closeMenus = except => {
        root.querySelectorAll('[data-easystud-group-actions-menu]').forEach(menu => {
            if (menu === except) {
                return;
            }
            const group = menu.closest('[data-easystud-group-id], [data-easystud-grouping-id]');
            const header = menu.closest(
                '.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header'
            );
            const toggle = header ? header.querySelector('[data-easystud-group-actions-toggle]') : null;
            // The card keeps its raised stacking until the menu has left, so the fade is never clipped.
            Motion.hideMenu(menu, {anchor: toggle, onDone: completed => {
                if (completed && group && menu.hidden) {
                    group.classList.remove('is-actions-menu-open');
                }
            }});
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        });
    };

    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-group-actions-toggle]');
        if (toggle && root.contains(toggle)) {
            // The same native trigger serves desktop overflow and the mobile
            // context sheet. Leave responsive clicks to bindContextMenu;
            // otherwise this earlier listener consumes them behind the tray.
            if (isResponsiveWorkspace()) {
                closeMenus(null);
                return;
            }
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
            const open = menu.hidden || Motion.isMenuClosing(menu);
            closeMenus(menu);
            const group = toggle.closest('[data-easystud-group-id], [data-easystud-grouping-id]');
            if (group && open) {
                group.classList.add('is-actions-menu-open');
            }
            if (open) {
                Motion.showMenu(menu, {anchor: toggle});
            } else {
                Motion.hideMenu(menu, {anchor: toggle, onDone: completed => {
                    if (completed && group && menu.hidden) {
                        group.classList.remove('is-actions-menu-open');
                    }
                }});
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
    // Cards whose header changed width; a window resize refreshes the whole page.
    let refreshAll = false;
    const refreshCards = new Set();
    const refresh = cards => {
        if (cards) {
            cards.forEach(card => refreshCards.add(card));
        } else {
            refreshAll = true;
        }
        if (refreshFrame !== null) {
            window.cancelAnimationFrame(refreshFrame);
        }
        refreshFrame = window.requestAnimationFrame(() => {
            refreshFrame = null;
            const pending = refreshAll ? null : Array.from(refreshCards).filter(card => card.isConnected);
            refreshAll = false;
            refreshCards.clear();
            ensureNestedGroupActionMenus(root, pending);
            // A nested-card action change also changes the room available to
            // the Grouping tag. Re-evaluate its all-or-recover decision in
            // the same frame so it never remains visually clipped.
            scheduleGroupGroupingOverflow(root);
        });
    };
    window.addEventListener('resize', () => refresh());
    if (window.ResizeObserver) {
        const widths = new WeakMap();
        // Cards whose header changed during a view swap: measured once, when the swap ends.
        const swapCards = new Set();
        root.easystudAfterLayoutSwap = () => {
            if (swapCards.size) {
                refresh(Array.from(swapCards));
                swapCards.clear();
            }
        };
        const observer = new window.ResizeObserver(entries => {
            // Only the cards whose header width changed: measuring every card of a large
            // course again took seconds while the page settled.
            const changed = entries.filter(entry => {
                const width = Math.round(entry.contentRect.width * 10) / 10;
                const previous = widths.get(entry.target);
                widths.set(entry.target, width);
                return previous !== undefined && previous !== width;
            }).map(entry => entry.target.parentElement).filter(Boolean);
            if (changed.length && root.easystudLayoutSwapping) {
                changed.forEach(card => swapCards.add(card));
            } else if (changed.length) {
                refresh(changed);
            }
        });
        const observeHeaders = headers => headers.forEach(header => {
            widths.set(header, Math.round(header.getBoundingClientRect().width * 10) / 10);
            observer.observe(header);
        });
        observeHeaders(root.querySelectorAll(
            '.local-groupimport-easystud-group__header, .local-groupimport-easystud-grouping__header'
        ));
        root.easystudCardActionOverflowObserver = observer;
        // Cards rendered later (on demand) are watched too, from their width when rendered.
        root.easystudObserveCardHeaders = cards => observeHeaders(cards.map(card => card.querySelector(
            ':scope > .local-groupimport-easystud-group__header, :scope > .local-groupimport-easystud-grouping__header'
        )).filter(Boolean));
    }
};

/**
 * Clear member selection for the folded Group, including its catalogue copies.
 *
 * Another membership of the same user in a different Group remains selected.
 * Use the existing selection authority so checkboxes and all action surfaces
 * reconcile together, without changing the card's disclosure animation.
 *
 * @param {HTMLElement} root Workspace selection owner.
 * @param {HTMLElement} group Group whose member list is being folded.
 */
const clearFoldedGroupMemberSelection = (root, group) => {
    const groupid = group.getAttribute('data-easystud-group-id');
    if (!groupid) {
        return;
    }
    const selected = getSelectedItems(root, 'member').filter(member => {
        const owner = member.closest('[data-easystud-group-id]');
        return owner && owner.getAttribute('data-easystud-group-id') === groupid;
    });
    selected.forEach(member => setItemSelected(member, false));
    if (selected.length) {
        updateSelectionActions(root);
    }
};

/**
 * Fold or unfold the members of a group card, as its members toggle does (with its motion).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} group Group card.
 * @param {Boolean} expand True to unfold, false to fold.
 * @returns {Boolean} Whether the card changed.
 */
export const setGroupMembersExpanded = (root, group, expand) => {
    const toggle = group ? group.querySelector('[data-easystud-group-members-toggle]') : null;
    const list = group ? group.querySelector('[data-easystud-group-members]') : null;
    if (!toggle || !list || (toggle.getAttribute('aria-expanded') === 'true') === expand) {
        return false;
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
    const motionToken = String(++groupMemberMotionToken);
    list.setAttribute('data-easystud-members-motion-token', motionToken);
    list.classList.add('is-easyedu-disclosing');
    void Motion.resize(list, () => {
        toggle.setAttribute('aria-expanded', expand ? 'true' : 'false');
        if (!expand) {
            clearFoldedGroupMemberSelection(root, group);
        }
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
    return true;
};

export const bindGroupMemberToggles = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-group-members-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        const group = toggle.closest('[data-easystud-group-id]');
        if (!group) {
            return;
        }
        setGroupMembersExpanded(root, group, toggle.getAttribute('aria-expanded') !== 'true');
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

export const bindTagToggles = root => {
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
                // Dropdown-like list: height and opacity rise together from nothing (the tokens are
                // children of the container, so container and items arrive as one).
                Motion.expand(details, {
                    duration: Motion.timing.normal,
                    fromOpacity: 0,
                    onComplete: () => scheduleResponsiveUiRefresh(root),
                });
            } else {
                // Closing is faster than opening.
                Motion.collapse(details, {
                    duration: 130,
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
            syncParticipantTagOverflow(card);
        }, {
            duration: Motion.timing.normal,
            // A local disclosure changes no result order or page. Reinserting
            // sorted cards here destroys the native drawer's scroll anchor.
            onComplete: () => scheduleResponsiveUiRefresh(root, {pagination: false}),
        });
    });
};

/**
 * K15-07: hover bubbles are mounted on document.body, outside the EasyStud root, so they do not
 * inherit the admin palette. Copy the palette roles from the root and flag the customised ones
 * (same signal as data-easyedu-custom-rails); the Kit keeps the classic green when nothing is flagged.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {HTMLElement} tip Bubble element.
 */
const relayTipPalette = (root, tip) => {
    if (!root || !tip) {
        return;
    }
    const style = root.style;
    for (let index = 0; index < style.length; index++) {
        const name = style[index];
        if (/^--easyedu-(primary|accent|success|info)(-|$)/.test(name)) {
            tip.style.setProperty(name, style.getPropertyValue(name));
        }
    }
    const custom = (root.getAttribute('data-easyedu-custom-rails') || '').trim();
    if (custom) {
        tip.setAttribute('data-easyedu-custom-palette', custom);
    }
};

export const bindHoverPopovers = root => {
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
        relayTipPalette(root, activeTip);
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
