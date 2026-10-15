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
 * EasyStud course manager: context menu (right click and mobile card actions).
 *
 * @module     local_groupimport/local/cm/context_menu
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {selectedClass, isResponsiveWorkspace, getLabels, showNotification, areSelectionTypesCompatible} from './shared';
import {isResponsiveDragSuppressed} from './drag_support';
import {
    getGroupName, getTreeGroupElementsById, getGroupsWithGroupingMembership, setRenameEditing, setInlinePanelOpen,
} from './cards';
import {
    getSelectedItemsForContext, getParticipantItemsForContext, setItemSelected, clearSelectionForType, clearSelection,
    clearSelectionState, getActiveSelectionType,
} from './selection';
import {emitGuidedCompletion, emitTryActionsCompletion} from './guide_hooks';
import {ensureGroupMemberSearchControls, normaliseCardMenuButton, ensureGroupEmailPanel} from './group_cards';
import {getGroupsInGrouping, selectGroupingGroups, updateSelectionActions} from './workspace';
import {
    handleActionError, postAction, copyGroupElementToGrouping, removeGroupsFromGroupings, removeMembers,
    appendUsersToGroupCopies,
} from './actions';
import {getSelectedMessageUserIds, openParticipantMessageModal} from './messaging';
import {openAdvancedSettingsModal} from './advanced_settings';

// Copy text to the clipboard when the browser allows it.
const copyText = text => {
    if (navigator.clipboard && text) {
        navigator.clipboard.writeText(text);
    }
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

// Menu motion (Penpot "Menu contextuel mobile — animation", 15/10/2026): the mobile sheet slides
// up and fades in over its fading backdrop, its submenus unfold as an accordion; the desktop menu
// and its flyouts only fade. Closing plays the reverse, a little faster.
const menuMotion = {
    sheetIn: 240,
    sheetOut: 200,
    backdropIn: 200,
    backdropOut: 200,
    accordionIn: 200,
    accordionOut: 160,
    fadeIn: Motion.timing.fast,
    fadeOut: 80,
    popIn: Motion.timing.normal,
    popOut: 130,
    reducedFade: 120,
    popEasing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    sheetEasing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
    sheetOutEasing: 'cubic-bezier(0.4, 0, 1, 1)',
};

// Bind right-click menus for fast local actions.
export const bindContextMenu = (root, courseId) => {
    const menu = root.querySelector('[data-easystud-context-menu]');
    const backdrop = root.querySelector('[data-easystud-context-backdrop]');
    if (!menu) {
        return;
    }

    let context = null;
    let returnFocus = null;
    const menuList = menu.querySelector('.local-groupimport-easystud-context-menu__list');
    const submenuGroups = Array.from(menu.querySelectorAll('[data-easystud-context-group]'));
    let openGroup = null;
    let openedByHover = false;
    let hoverTimer = null;

    const isMenuRtl = () => window.getComputedStyle(menu).direction === 'rtl';

    // Menu animations: none under reduced motion or with the plugin animations disabled.
    const menuAnimations = new Map();
    let menuClosing = false;
    const canAnimate = element => !!element && typeof element.animate === 'function' &&
        Motion.isEnabled(menu) && !root.classList.contains('is-easyedu-motion-off');
    const stopAnimation = element => {
        const animation = element ? menuAnimations.get(element) : null;
        if (animation) {
            menuAnimations.delete(element);
            animation.cancel();
        }
    };
    // The onDone callback runs once the animation has played to its end, never when it was replaced or stopped.
    // With keep, the end state stays applied until stopAnimation (onDone hides the element first).
    // Reduced level: every animation of the menu (desktop, mobile sheet, backdrop, accordion) is an opacity
    // fade of 120 ms at most; a motion with nothing to fade (height, offset only) completes at once.
    const toFade = frames => {
        const faded = frames.map(frame => frame.opacity === undefined ? null : {opacity: frame.opacity});
        const same = faded.length < 2 || faded.includes(null) ||
            Number(faded[0].opacity) === Number(faded[faded.length - 1].opacity);
        return same ? null : faded;
    };
    const runAnimation = (element, keyframes, {duration, easing = 'ease-out', keep = false, onDone = null}) => {
        stopAnimation(element);
        let frames = keyframes;
        let length = duration;
        if (Motion.getLevel(menu) === 'reduced') {
            frames = toFade(keyframes);
            length = Math.min(menuMotion.reducedFade, duration);
            if (!frames) {
                if (onDone) {
                    window.setTimeout(onDone, 0);
                }
                return;
            }
        }
        const animation = element.animate(frames, {duration: length, easing, fill: 'both'});
        menuAnimations.set(element, animation);
        animation.finished.then(() => {
            if (menuAnimations.get(element) !== animation) {
                return false;
            }
            if (!keep) {
                stopAnimation(element);
            }
            if (onDone) {
                onDone();
            }
            return true;
        }).catch(() => false);
    };

    // Desktop menu keyframes: container and items move as one piece, a fade plus a small offset and
    // scale from the pointer (closing: faster and shorter). Reduced motion: 120 ms fade only.
    const getDesktopKeyframes = opening => {
        const level = Motion.getLevel(menu);
        if (level === 'reduced') {
            return {keyframes: opening ? [{opacity: 0}, {opacity: 1}] : [{opacity: 1}, {opacity: 0}],
                duration: menuMotion.reducedFade};
        }
        const origin = menu.easystudMenuOrigin || '0px 0px';
        const rest = {opacity: 1, transform: 'none', transformOrigin: origin};
        const away = {opacity: 0, transform: 'translateY(' + (opening ? -5 : -3) + 'px) scale(' + (opening ? 0.98 : 0.99) + ')',
            transformOrigin: origin};
        return {keyframes: opening ? [away, rest] : [rest, away], duration: opening ? menuMotion.popIn : menuMotion.popOut};
    };

    const getGroupParts = group => ({
        toggle: group ? group.querySelector(':scope > [data-easystud-context-submenu-toggle]') : null,
        submenu: group ? group.querySelector(':scope > [data-easystud-context-submenu]') : null,
    });

    const getSubmenuItems = submenu => submenu ? Array.from(
        submenu.querySelectorAll(':scope > [data-easystud-context-action]')).filter(item => !item.hidden) : [];

    // Focusable items of one level: the top level (a flattened group lends its
    // single child, a closed submenu never does) or one open submenu.
    const getLevelItems = submenu => {
        if (submenu) {
            return getSubmenuItems(submenu);
        }
        const items = [];
        Array.from(menuList ? menuList.children : []).forEach(entry => {
            if (entry.hidden || entry.hasAttribute('data-easystud-context-separator')) {
                return;
            }
            if (entry.hasAttribute('data-easystud-context-group')) {
                const parts = getGroupParts(entry);
                if (entry.classList.contains('is-flattened')) {
                    items.push(...getSubmenuItems(parts.submenu));
                } else if (parts.toggle && !parts.toggle.hidden) {
                    items.push(parts.toggle);
                }
            } else if (entry.matches('button')) {
                items.push(entry);
            }
        });
        return items;
    };

    const clearHoverTimer = () => {
        window.clearTimeout(hoverTimer);
        hoverTimer = null;
    };

    const closeSubmenu = group => {
        if (!group || group.classList.contains('is-flattened')) {
            return;
        }
        const {toggle, submenu} = getGroupParts(group);
        if (submenu) {
            const hadFocus = submenu.contains(document.activeElement);
            if (!submenu.hidden && !menu.hidden && !menuClosing && menu.classList.contains('is-mobile-sheet') &&
                    canAnimate(submenu)) {
                // The sheet accordion folds before hiding (a reopening cancels it).
                const height = submenu.getBoundingClientRect().height;
                runAnimation(submenu, [
                    {height: height + 'px', opacity: 1, overflow: 'hidden'},
                    {height: '0px', opacity: 0, overflow: 'hidden'},
                ], {duration: menuMotion.accordionOut, easing: menuMotion.sheetOutEasing, keep: true, onDone: () => {
                    submenu.hidden = true;
                    stopAnimation(submenu);
                }});
            } else {
                stopAnimation(submenu);
                submenu.hidden = true;
            }
            submenu.style.removeProperty('left');
            submenu.style.removeProperty('top');
            if (hadFocus && toggle && !toggle.hidden) {
                toggle.focus({preventScroll: true});
            }
        }
        if (toggle) {
            toggle.setAttribute('aria-expanded', 'false');
        }
        if (openGroup === group) {
            openGroup = null;
            openedByHover = false;
        }
    };

    const closeSubmenus = () => {
        clearHoverTimer();
        submenuGroups.forEach(closeSubmenu);
        openGroup = null;
        openedByHover = false;
    };

    // Desktop flyout beside its trigger: flipped when it would overflow, then
    // clamped to the viewport. The mobile sheet keeps it inline (accordion).
    const positionSubmenu = (toggle, submenu) => {
        submenu.style.removeProperty('left');
        submenu.style.removeProperty('top');
        if (menu.classList.contains('is-mobile-sheet')) {
            return;
        }
        const anchor = toggle.getBoundingClientRect();
        const rect = submenu.getBoundingClientRect();
        const offset = parseFloat(window.getComputedStyle(submenu).paddingTop) || 0;
        const rtl = isMenuRtl();
        let left = rtl ? anchor.left - 4 - rect.width : anchor.right + 4;
        if (!rtl && left + rect.width > window.innerWidth - 8) {
            left = anchor.left - 4 - rect.width;
        } else if (rtl && left < 8) {
            left = anchor.right + 4;
        }
        left = Math.max(8, Math.min(left, window.innerWidth - rect.width - 8));
        const top = Math.max(8, Math.min(anchor.top - offset, window.innerHeight - rect.height - 8));
        submenu.style.left = left + 'px';
        submenu.style.top = top + 'px';
    };

    const openSubmenu = (group, focusFirst) => {
        if (!group || group.hidden || group.classList.contains('is-flattened')) {
            return;
        }
        const {toggle, submenu} = getGroupParts(group);
        if (!toggle || !submenu) {
            return;
        }
        clearHoverTimer();
        if (openGroup && openGroup !== group) {
            closeSubmenu(openGroup);
        }
        // A fold still playing starts the unfold from its current height.
        const folding = menuAnimations.has(submenu);
        const fromHeight = folding && !submenu.hidden ? submenu.getBoundingClientRect().height : 0;
        stopAnimation(submenu);
        submenu.hidden = false;
        toggle.setAttribute('aria-expanded', 'true');
        openGroup = group;
        positionSubmenu(toggle, submenu);
        const sheet = menu.classList.contains('is-mobile-sheet');
        const reveal = () => {
            if (sheet && submenu.scrollIntoView && !submenu.hidden) {
                submenu.scrollIntoView({block: 'nearest'});
            }
        };
        if (canAnimate(submenu) && sheet) {
            const height = submenu.getBoundingClientRect().height;
            // The sheet list scrolls the unfolded actions into view once they have their height.
            runAnimation(submenu, [
                {height: fromHeight + 'px', opacity: folding ? 1 : 0, overflow: 'hidden'},
                {height: height + 'px', opacity: 1, overflow: 'hidden'},
            ], {duration: menuMotion.accordionIn, easing: menuMotion.sheetEasing, onDone: reveal});
        } else {
            if (canAnimate(submenu) && !folding) {
                runAnimation(submenu, [{opacity: 0}, {opacity: 1}], {duration: menuMotion.fadeIn});
            }
            reveal();
        }
        if (focusFirst) {
            const first = getSubmenuItems(submenu)[0];
            if (first) {
                first.focus({preventScroll: true});
            }
        }
    };

    // One separator between two non-empty sections, never at an edge or doubled.
    const syncSeparators = () => {
        let seenVisible = false;
        let pending = null;
        Array.from(menuList ? menuList.children : []).forEach(entry => {
            if (entry.hasAttribute('data-easystud-context-separator')) {
                entry.hidden = true;
                if (seenVisible) {
                    pending = entry;
                }
                return;
            }
            if (entry.hidden) {
                return;
            }
            if (pending) {
                pending.hidden = false;
                pending = null;
            }
            seenVisible = true;
        });
    };

    // Hide the menu, its backdrop and their animations now.
    const finishHideMenu = () => {
        menuClosing = false;
        menu.hidden = true;
        menu.inert = false;
        menu.removeAttribute('inert');
        menu.classList.remove('is-mobile-sheet');
        stopAnimation(menu);
        if (backdrop) {
            backdrop.hidden = true;
            stopAnimation(backdrop);
        }
    };

    const hideMenu = () => {
        if (menuClosing) {
            return;
        }
        // The menu leaves with its animation, inert meanwhile; everything else closes at once.
        const sheet = menu.classList.contains('is-mobile-sheet');
        const animate = !menu.hidden && (sheet ? canAnimate(menu) : Motion.getLevel(menu) !== 'minimal');
        menuClosing = animate;
        closeSubmenus();
        if (animate) {
            const desktop = sheet ? null : getDesktopKeyframes(false);
            menu.setAttribute('inert', '');
            menu.inert = true;
            runAnimation(menu, sheet ? [
                {transform: 'translateY(0)', opacity: 1},
                {transform: 'translateY(100%)', opacity: 0},
            ] : desktop.keyframes, {
                duration: sheet ? menuMotion.sheetOut : desktop.duration,
                easing: sheet ? menuMotion.sheetOutEasing : 'cubic-bezier(0.4, 0, 1, 1)',
                keep: true,
                onDone: finishHideMenu,
            });
            if (sheet && backdrop && !backdrop.hidden) {
                runAnimation(backdrop, [{opacity: 1}, {opacity: 0}],
                    {duration: menuMotion.backdropOut, easing: 'ease-in', keep: true});
            }
        } else {
            finishHideMenu();
        }
        root.querySelectorAll('[data-easystud-card-menu][aria-expanded="true"]').forEach(button => {
            button.setAttribute('aria-expanded', 'false');
        });
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
                !target.matches('[data-easystud-group-id][data-easystud-advanced-type="group"], ' +
                    '[data-easystud-grouping-id][data-easystud-advanced-type="grouping"]') ||
                !metadata.every(attribute => target.hasAttribute(attribute)) ||
                !target.getAttribute('data-easystud-advanced-native-url')) {
            return false;
        }

        const header = target.querySelector(':scope > .local-groupimport-easystud-group__header, ' +
            ':scope > .local-groupimport-easystud-grouping__header');
        const direct = header?.querySelector(':scope > [data-easystud-open-advanced-settings]');
        return !!header && (!direct || !direct.getClientRects().length);
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
                    'group-search-members',
                    'group-paste-emails',
                    'group-add-copied-users',
                    'group-focus-rename',
                    'grouping-paste-groups',
                    'grouping-add-copied-groups',
                    'grouping-search-groups',
                    'grouping-focus-rename',
                    'copy-grouping-name',
                    'copy-grouping-id',
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
            if (!hidden && ['group-open-advanced-settings', 'grouping-open-advanced-settings'].includes(
                    button.getAttribute('data-easystud-context-action')) &&
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

        // A submenu holds at least two visible actions; a single one is shown
        // inline as a plain item and an empty one disappears.
        submenuGroups.forEach(group => {
            const {toggle, submenu} = getGroupParts(group);
            const contexts = (group.getAttribute('data-easystud-contexts') || '').split(' ');
            const count = contexts.indexOf(type) === -1 ? 0 : getSubmenuItems(submenu).length;
            const flattened = count === 1;
            group.hidden = count === 0;
            group.classList.toggle('is-flattened', flattened);
            if (submenu) {
                submenu.hidden = !flattened;
                submenu.setAttribute('role', flattened ? 'group' : 'menu');
                submenu.style.removeProperty('left');
                submenu.style.removeProperty('top');
            }
            if (toggle) {
                toggle.hidden = flattened;
                toggle.setAttribute('aria-expanded', 'false');
                const text = toggle.querySelector('[data-easystud-context-text]');
                if (text) {
                    text.textContent = toggle.getAttribute(items.length > 1 ? 'data-easystud-context-multi-label' :
                        'data-easystud-context-label') || toggle.getAttribute('data-easystud-context-label') || '';
                }
            }
        });
        openGroup = null;
        openedByHover = false;
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
        if (menuClosing) {
            // Reopened while leaving: drop the closing animation and start from a closed menu.
            finishHideMenu();
        }
        submenuGroups.forEach(group => stopAnimation(getGroupParts(group).submenu));
        context = {type, target};
        returnFocus = event.currentTarget && event.currentTarget.focus ? event.currentTarget : target;
        if (returnFocus && returnFocus.matches && returnFocus.matches('[data-easystud-card-menu]')) {
            returnFocus.setAttribute('aria-expanded', 'true');
        }
        setVisibleActions(type, target);
        syncMaskedGroupingMenuAction(type, target);
        syncSeparators();
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
            // Grow from the point that was clicked (clamped to the menu), not from a fixed corner.
            const placed = menu.getBoundingClientRect();
            menu.easystudMenuOrigin = Math.max(0, Math.min(placed.width, event.clientX - placed.left)) + 'px ' +
                Math.max(0, Math.min(placed.height, event.clientY - placed.top)) + 'px';
        }
        if (canAnimate(menu) && mobile) {
            runAnimation(menu, [
                {transform: 'translateY(100%)', opacity: 0},
                {transform: 'translateY(0)', opacity: 1},
            ], {duration: menuMotion.sheetIn, easing: menuMotion.sheetEasing});
            if (backdrop) {
                runAnimation(backdrop, [{opacity: 0}, {opacity: 1}], {duration: menuMotion.backdropIn});
            }
        } else if (!mobile && Motion.getLevel(menu) !== 'minimal') {
            const desktop = getDesktopKeyframes(true);
            runAnimation(menu, desktop.keyframes, {duration: desktop.duration, easing: menuMotion.popEasing});
        }
        const first = getLevelItems(null)[0];
        if (first) {
            first.focus({preventScroll: true});
        }
        if (type === 'participant' && target && target.isConnected && root.contains(target)) {
            emitTryActionsCompletion(root, 'try-context');
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

        const submenuToggle = event.target.closest('[data-easystud-context-submenu-toggle]');
        if (submenuToggle && menu.contains(submenuToggle)) {
            const group = submenuToggle.closest('[data-easystud-context-group]');
            // A keyboard activation (Enter/Space) always opens and enters the submenu.
            const keyboard = event.detail === 0;
            if (!keyboard && group === openGroup && !openedByHover) {
                closeSubmenu(group);
            } else {
                openSubmenu(group, keyboard);
            }
            openedByHover = false;
            return;
        }

        const button = event.target.closest('[data-easystud-context-action]');
        if (!button || !context) {
            return;
        }

        const action = button.getAttribute('data-easystud-context-action');
        const contextType = context.type;
        const target = context.target;
        const contextOpener = returnFocus;
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
        } else if (action === 'group-search-members') {
            ensureGroupMemberSearchControls(root, target);
            const searchToggle = target.querySelector('[data-easystud-group-member-search-toggle]');
            if (searchToggle) {
                searchToggle.click();
            }
        } else if (action === 'group-paste-emails') {
            const groupid = target.getAttribute('data-easystud-group-id');
            const panel = ensureGroupEmailPanel(target, groupid, getLabels(root));
            if (panel) {
                const box = panel.querySelector('[data-easystud-group-email-box]');
                const transition = setInlinePanelOpen(panel, true);
                if (box) {
                    transition.then(completed => {
                        if (completed) {
                            box.focus({preventScroll: true});
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
                                box.focus({preventScroll: true});
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
        } else if (action === 'group-open-advanced-settings' || action === 'grouping-open-advanced-settings') {
            const opener = contextOpener || document.activeElement;
            openAdvancedSettingsModal(root, target, opener);
        } else if (action === 'copy-group-name') {
            copyText(getContextItems('group', target).map(group => getGroupName(group)).filter(Boolean).join('\n'));
        } else if (action === 'copy-group-id') {
            copyText(getContextItems('group', target).map(group => group.getAttribute('data-easystud-group-id'))
                .filter(Boolean).join('\n'));
        } else if (action === 'group-move-selected') {
            const button = root.querySelector('[data-easystud-move-selected-groups]');
            if (button) {
                button.click();
            }
        } else if (action === 'group-remove-from-grouping') {
            removeGroupsFromGroupings(root, courseId, getContextItems('group', target))
                .catch(error => handleActionError(root, error));
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
                            box.focus({preventScroll: true});
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
                                box.focus({preventScroll: true});
                            }
                        });
                    }
                }
            });
        } else if (action === 'grouping-search-groups') {
            // The header's direct toggle is hidden on narrow screens; delegate to
            // this grouping's own toggle so bindContainerGroupSearch keeps the
            // expand, Motion panel, focus and Cancel behaviour.
            const groupingid = target.getAttribute('data-easystud-grouping-id') || '';
            const searchToggle = groupingid ? target.querySelector(
                '[data-easystud-container-search-toggle="' + groupingid + '"]') : null;
            if (searchToggle) {
                searchToggle.click();
            }
        } else if (action === 'grouping-select-groups') {
            selectGroupingGroups(root, getContextItems('grouping', target));
        } else if (action === 'copy-grouping-name') {
            const name = target.querySelector('.local-groupimport-easystud-grouping__name');
            copyText(name ? name.textContent : '');
        } else if (action === 'copy-grouping-id') {
            copyText(target.getAttribute('data-easystud-grouping-id') || '');
        } else if (action === 'member-move-selected') {
            root.dispatchEvent(new CustomEvent('easystud:move-members', {detail: {
                members: getContextItems('member', target),
                opener: contextOpener || target.querySelector('[data-easystud-selector-input]'),
            }}));
        } else if (action === 'remove-member') {
            const members = getContextItems('member', target);
            removeMembers(root, courseId, members).then(response => {
                clearSelectionState(root);
                updateSelectionActions(root);
                showNotification(root, response.message || '', 'success');
            }).catch(error => handleActionError(root, error));
        } else if (action === 'paste-field') {
            pasteIntoField(target).catch(() => {});
        }
    });

    // A long press opens the mobile backdrop under the held finger. Consume
    // the resulting compatibility click before its target can close the menu.
    document.addEventListener('click', event => {
        if (suppressNextDocumentClick) {
            suppressNextDocumentClick = false;
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
    document.addEventListener('click', event => {
        if (!menu.hidden && !menu.contains(event.target)) {
            hideMenu();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hideMenu();
        }
    });

    // Desktop flyouts open on hover after a short intent delay and stay open
    // while the pointer travels to (or rests in) their own submenu.
    const isHoverMenu = () => !menu.hidden && !menu.classList.contains('is-mobile-sheet');
    submenuGroups.forEach(group => {
        group.addEventListener('mouseenter', () => {
            if (!isHoverMenu() || group.classList.contains('is-flattened')) {
                return;
            }
            clearHoverTimer();
            if (openGroup === group) {
                return;
            }
            hoverTimer = window.setTimeout(() => {
                hoverTimer = null;
                openSubmenu(group, false);
                openedByHover = true;
            }, 120);
        });
        group.addEventListener('mouseleave', () => {
            if (openGroup !== group) {
                clearHoverTimer();
            }
        });
    });
    menu.addEventListener('mouseover', event => {
        if (!openGroup || !isHoverMenu() || !menuList || hoverTimer !== null) {
            return;
        }
        const entry = Array.from(menuList.children).find(child => child.contains(event.target));
        if (!entry || entry === openGroup || entry.hasAttribute('data-easystud-context-separator')) {
            return;
        }
        hoverTimer = window.setTimeout(() => {
            hoverTimer = null;
            closeSubmenu(openGroup);
        }, 120);
    });

    // Menu keyboard: arrows/Home/End move within the current level, the
    // forward arrow enters a submenu, back arrow or Escape leaves it.
    const levelMoves = {
        ArrowDown: (items, index) => items[(index + 1) % items.length],
        ArrowUp: (items, index) => items[index <= 0 ? items.length - 1 : index - 1],
        Home: items => items[0],
        End: items => items[items.length - 1],
    };
    const leaveSubmenu = () => {
        const toggle = getGroupParts(openGroup).toggle;
        closeSubmenu(openGroup);
        if (toggle) {
            toggle.focus({preventScroll: true});
        }
    };
    // Back arrow or Escape leaves the open submenu; the forward arrow enters one.
    const handleSubmenuKey = (event, active, inSubmenu) => {
        const rtl = isMenuRtl();
        if (inSubmenu && (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || event.key === 'Escape')) {
            // Keep the document-level Escape from closing the whole menu.
            event.stopPropagation();
            leaveSubmenu();
            return true;
        }
        if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') && active && menu.contains(active) &&
                active.matches('[data-easystud-context-submenu-toggle]')) {
            openSubmenu(active.closest('[data-easystud-context-group]'), true);
            return true;
        }
        return false;
    };
    menu.addEventListener('keydown', event => {
        if (menu.hidden) {
            return;
        }
        const active = document.activeElement;
        const openSubmenuElement = getGroupParts(openGroup).submenu;
        const inSubmenu = !!(openSubmenuElement && active && openSubmenuElement.contains(active));
        if (handleSubmenuKey(event, active, inSubmenu)) {
            event.preventDefault();
            return;
        }
        const move = Object.prototype.hasOwnProperty.call(levelMoves, event.key) ? levelMoves[event.key] : null;
        const items = move ? getLevelItems(inSubmenu ? openSubmenuElement : null) : [];
        const next = items.length ? move(items, items.indexOf(active)) : null;
        if (!next) {
            return;
        }
        event.preventDefault();
        if (!inSubmenu && openGroup && !openGroup.contains(next)) {
            closeSubmenu(openGroup);
        }
        next.focus({preventScroll: true});
    });

    if (backdrop) {
        backdrop.addEventListener('click', hideMenu);
    }
    menu.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-context-close]')) {
            hideMenu();
        }
    });
    window.addEventListener('scroll', event => {
        if (!isResponsiveWorkspace() && !(event.target instanceof Node && menu.contains(event.target))) {
            hideMenu();
        }
    }, true);
};
