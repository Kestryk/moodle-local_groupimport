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
import {
    selectedClass, isResponsiveWorkspace, getLabels, showNotification, areSelectionTypesCompatible,
    requestGuideHighlightRefresh,
} from './shared';
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
    handleActionError, postAction, postAddEmailsInBatches,
    copyGroupElementToGrouping, removeGroupsFromGroupings, removeMembers,
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

// Menu animations: none under reduced motion or with the plugin animations disabled.
const createMenuAnimator = (root, menu) => {
    const menuAnimations = new Map();
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

    return {canAnimate, stopAnimation, runAnimation, getDesktopKeyframes, isAnimating: element => menuAnimations.has(element)};
};

const isMenuRtl = ui => window.getComputedStyle(ui.menu).direction === 'rtl';

const getGroupParts = group => ({
    toggle: group ? group.querySelector(':scope > [data-easystud-context-submenu-toggle]') : null,
    submenu: group ? group.querySelector(':scope > [data-easystud-context-submenu]') : null,
});

const getSubmenuItems = submenu => submenu ? Array.from(
    submenu.querySelectorAll(':scope > [data-easystud-context-action]')).filter(item => !item.hidden) : [];

// Focusable items of one level: the top level (a flattened group lends its
// single child, a closed submenu never does) or one open submenu.
const getLevelItems = (ui, submenu) => {
    if (submenu) {
        return getSubmenuItems(submenu);
    }
    const items = [];
    Array.from(ui.menuList ? ui.menuList.children : []).forEach(entry => {
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

const clearHoverTimer = ui => {
    window.clearTimeout(ui.hoverTimer);
    ui.hoverTimer = null;
};

const closeSubmenu = (ui, group) => {
    if (!group || group.classList.contains('is-flattened')) {
        return;
    }
    const {menu, animator} = ui;
    const {toggle, submenu} = getGroupParts(group);
    if (submenu) {
        const hadFocus = submenu.contains(document.activeElement);
        if (!submenu.hidden && !menu.hidden && !ui.menuClosing && menu.classList.contains('is-mobile-sheet') &&
                animator.canAnimate(submenu)) {
            // The sheet accordion folds before hiding (a reopening cancels it).
            const height = submenu.getBoundingClientRect().height;
            animator.runAnimation(submenu, [
                {height: height + 'px', opacity: 1, overflow: 'hidden'},
                {height: '0px', opacity: 0, overflow: 'hidden'},
            ], {duration: menuMotion.accordionOut, easing: menuMotion.sheetOutEasing, keep: true, onDone: () => {
                submenu.hidden = true;
                animator.stopAnimation(submenu);
            }});
        } else {
            animator.stopAnimation(submenu);
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
    if (ui.openGroup === group) {
        ui.openGroup = null;
        ui.openedByHover = false;
    }
};

const closeSubmenus = ui => {
    clearHoverTimer(ui);
    ui.submenuGroups.forEach(group => closeSubmenu(ui, group));
    ui.openGroup = null;
    ui.openedByHover = false;
};

// Desktop flyout beside its trigger: flipped when it would overflow, then
// clamped to the viewport. The mobile sheet keeps it inline (accordion).
const positionSubmenu = (ui, toggle, submenu) => {
    submenu.style.removeProperty('left');
    submenu.style.removeProperty('top');
    if (ui.menu.classList.contains('is-mobile-sheet')) {
        return;
    }
    const anchor = toggle.getBoundingClientRect();
    const rect = submenu.getBoundingClientRect();
    const offset = parseFloat(window.getComputedStyle(submenu).paddingTop) || 0;
    const rtl = isMenuRtl(ui);
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

const openSubmenu = (ui, group, focusFirst) => {
    if (!group || group.hidden || group.classList.contains('is-flattened')) {
        return;
    }
    const {menu, animator} = ui;
    const {toggle, submenu} = getGroupParts(group);
    if (!toggle || !submenu) {
        return;
    }
    clearHoverTimer(ui);
    if (ui.openGroup && ui.openGroup !== group) {
        closeSubmenu(ui, ui.openGroup);
    }
    // A fold still playing starts the unfold from its current height.
    const folding = animator.isAnimating(submenu);
    const fromHeight = folding && !submenu.hidden ? submenu.getBoundingClientRect().height : 0;
    animator.stopAnimation(submenu);
    submenu.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    ui.openGroup = group;
    positionSubmenu(ui, toggle, submenu);
    const sheet = menu.classList.contains('is-mobile-sheet');
    const reveal = () => {
        if (sheet && submenu.scrollIntoView && !submenu.hidden) {
            submenu.scrollIntoView({block: 'nearest'});
        }
    };
    if (animator.canAnimate(submenu) && sheet) {
        const height = submenu.getBoundingClientRect().height;
        // The sheet list scrolls the unfolded actions into view once they have their height.
        animator.runAnimation(submenu, [
            {height: fromHeight + 'px', opacity: folding ? 1 : 0, overflow: 'hidden'},
            {height: height + 'px', opacity: 1, overflow: 'hidden'},
        ], {duration: menuMotion.accordionIn, easing: menuMotion.sheetEasing, onDone: reveal});
    } else {
        if (animator.canAnimate(submenu) && !folding) {
            animator.runAnimation(submenu, [{opacity: 0}, {opacity: 1}], {duration: menuMotion.fadeIn});
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
const syncSeparators = menuList => {
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
const finishHideMenu = ui => {
    const {root, menu, backdrop, animator} = ui;
    ui.menuClosing = false;
    menu.hidden = true;
    menu.inert = false;
    menu.removeAttribute('inert');
    menu.classList.remove('is-mobile-sheet');
    animator.stopAnimation(menu);
    if (backdrop) {
        backdrop.hidden = true;
        animator.stopAnimation(backdrop);
    }
    // J-G3 (P-G2): the Guide checklist re-docks once the sheet has gone.
    requestGuideHighlightRefresh(root);
};

const hideMenu = ui => {
    if (ui.menuClosing) {
        return;
    }
    const {root, menu, backdrop, animator} = ui;
    // The menu leaves with its animation, inert meanwhile; everything else closes at once.
    const sheet = menu.classList.contains('is-mobile-sheet');
    const animate = !menu.hidden && (sheet ? animator.canAnimate(menu) : Motion.getLevel(menu) !== 'minimal');
    ui.menuClosing = animate;
    closeSubmenus(ui);
    if (animate) {
        const desktop = sheet ? null : animator.getDesktopKeyframes(false);
        menu.setAttribute('inert', '');
        menu.inert = true;
        animator.runAnimation(menu, sheet ? [
            {transform: 'translateY(0)', opacity: 1},
            {transform: 'translateY(100%)', opacity: 0},
        ] : desktop.keyframes, {
            duration: sheet ? menuMotion.sheetOut : desktop.duration,
            easing: sheet ? menuMotion.sheetOutEasing : 'cubic-bezier(0.4, 0, 1, 1)',
            keep: true,
            onDone: () => finishHideMenu(ui),
        });
        if (sheet && backdrop && !backdrop.hidden) {
            animator.runAnimation(backdrop, [{opacity: 1}, {opacity: 0}],
                {duration: menuMotion.backdropOut, easing: 'ease-in', keep: true});
        }
    } else {
        finishHideMenu(ui);
    }
    root.querySelectorAll('[data-easystud-card-menu][aria-expanded="true"]').forEach(button => {
        button.setAttribute('aria-expanded', 'false');
    });
    ui.context = null;
    if (ui.returnFocus && document.contains(ui.returnFocus)) {
        ui.returnFocus.focus({preventScroll: true});
    }
    ui.returnFocus = null;
};

const getContextItems = (root, type, target) => {
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

// Actions that act on one target only: hidden when the menu applies to a multiple selection.
const SINGLE_TARGET_ACTIONS = [
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
];

// Extra availability conditions of some actions, beyond their declared contexts.
const ACTION_AVAILABILITY = {
    'participant-open-details': root => !!root.querySelector('[data-easystud-open-user]') ||
        !!root.querySelector('[data-easystud-open-selected-user]'),
    'group-remove-from-grouping': (root, items) => getGroupsWithGroupingMembership(root, items).length !== 0,
    'grouping-select-groups': (root, items) => items.some(item => getGroupsInGrouping(item).length > 0),
    'group-open-advanced-settings': (root, items, target) => canOpenAdvancedSettingsFromContext(items, target),
    'grouping-open-advanced-settings': (root, items, target) => canOpenAdvancedSettingsFromContext(items, target),
};

const isActionHidden = (root, button, type, items, target) => {
    const contexts = (button.getAttribute('data-easystud-contexts') || '').split(' ');
    if (contexts.indexOf(type) === -1) {
        return true;
    }
    const action = button.getAttribute('data-easystud-context-action');
    if (items.length > 1 && SINGLE_TARGET_ACTIONS.indexOf(action) !== -1) {
        return true;
    }
    const available = Object.prototype.hasOwnProperty.call(ACTION_AVAILABILITY, action) ?
        ACTION_AVAILABILITY[action] : null;
    return !!available && !available(root, items, target);
};

const getContextLabel = (element, items) => element.getAttribute(items.length > 1 ? 'data-easystud-context-multi-label' :
    'data-easystud-context-label') || element.getAttribute('data-easystud-context-label') || '';

const setVisibleActions = (ui, type, target) => {
    const {root, menu} = ui;
    const items = getContextItems(root, type, target);
    menu.querySelectorAll('[data-easystud-context-action]').forEach(button => {
        button.hidden = isActionHidden(root, button, type, items, target);
        const text = button.querySelector('[data-easystud-context-text]');
        if (text) {
            text.textContent = getContextLabel(button, items);
        }
    });

    // A submenu holds at least two visible actions; a single one is shown
    // inline as a plain item and an empty one disappears.
    ui.submenuGroups.forEach(group => {
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
                text.textContent = getContextLabel(toggle, items);
            }
        }
    });
    ui.openGroup = null;
    ui.openedByHover = false;
};

const syncMaskedGroupingMenuAction = (menu, type, target) => {
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

// Place the menu: a bottom sheet on the responsive workspace, else at the pointer, clamped to the viewport.
const placeMenu = (ui, event, mobile) => {
    const {menu, backdrop} = ui;
    menu.classList.toggle('is-mobile-sheet', mobile);
    if (backdrop) {
        backdrop.hidden = !mobile;
    }
    if (mobile) {
        menu.style.removeProperty('left');
        menu.style.removeProperty('top');
        return;
    }
    const rect = menu.getBoundingClientRect();
    const left = Math.min(event.clientX, window.innerWidth - rect.width - 8);
    const top = Math.min(event.clientY, window.innerHeight - rect.height - 8);
    menu.style.left = Math.max(8, left) + 'px';
    menu.style.top = Math.max(8, top) + 'px';
    // Grow from the point that was clicked (clamped to the menu), not from a fixed corner.
    const placed = menu.getBoundingClientRect();
    menu.easystudMenuOrigin = Math.max(0, Math.min(placed.width, event.clientX - placed.left)) + 'px ' +
        Math.max(0, Math.min(placed.height, event.clientY - placed.top)) + 'px';
};

const showMenu = (ui, event, type, target) => {
    const {root, menu, backdrop, animator} = ui;
    event.preventDefault();
    if (ui.menuClosing) {
        // Reopened while leaving: drop the closing animation and start from a closed menu.
        finishHideMenu(ui);
    }
    ui.submenuGroups.forEach(group => animator.stopAnimation(getGroupParts(group).submenu));
    ui.context = {type, target};
    ui.returnFocus = event.currentTarget && event.currentTarget.focus ? event.currentTarget : target;
    if (ui.returnFocus && ui.returnFocus.matches && ui.returnFocus.matches('[data-easystud-card-menu]')) {
        ui.returnFocus.setAttribute('aria-expanded', 'true');
    }
    setVisibleActions(ui, type, target);
    syncMaskedGroupingMenuAction(menu, type, target);
    syncSeparators(ui.menuList);
    menu.hidden = false;
    const mobile = isResponsiveWorkspace();
    placeMenu(ui, event, mobile);
    if (animator.canAnimate(menu) && mobile) {
        animator.runAnimation(menu, [
            {transform: 'translateY(100%)', opacity: 0},
            {transform: 'translateY(0)', opacity: 1},
        ], {duration: menuMotion.sheetIn, easing: menuMotion.sheetEasing});
        if (backdrop) {
            animator.runAnimation(backdrop, [{opacity: 0}, {opacity: 1}], {duration: menuMotion.backdropIn});
        }
    } else if (!mobile && Motion.getLevel(menu) !== 'minimal') {
        const desktop = animator.getDesktopKeyframes(true);
        animator.runAnimation(menu, desktop.keyframes, {duration: desktop.duration, easing: menuMotion.popEasing});
    }
    const first = getLevelItems(ui, null)[0];
    if (first) {
        first.focus({preventScroll: true});
    }
    // J-G3 (P-G2): an opening sheet or menu can cover the step target or the checklist; let the
    // Guide re-evaluate its docking (its refresh runs now and again after the slow motion).
    requestGuideHighlightRefresh(root);
    if (type === 'participant' && target && target.isConnected && root.contains(target)) {
        emitTryActionsCompletion(root, 'try-context');
    }
};

const getContextTarget = (root, event) => {
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

const prepareContextSelection = (root, item) => {
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

const ensureCardMenuButtons = root => {
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

// Action handlers, grouped by the target type the action belongs to. Each one receives
// {root, courseId, button, contextType, target, contextOpener}, after the menu has closed.

// Open an inline paste panel, then focus its field once the panel has finished opening.
const openPastePanel = (panel, boxSelector) => {
    if (!panel) {
        return;
    }
    const box = panel.querySelector(boxSelector);
    const transition = setInlinePanelOpen(panel, true);
    if (box) {
        transition.then(completed => {
            if (completed) {
                box.focus({preventScroll: true});
            }
        });
    }
};

const openGroupEmailPanel = (root, target) => {
    const groupid = target.getAttribute('data-easystud-group-id');
    openPastePanel(ensureGroupEmailPanel(target, groupid, getLabels(root)), '[data-easystud-group-email-box]');
};

const openGroupingGroupsPanel = (root, target) => {
    const groupingid = target.getAttribute('data-easystud-grouping-id');
    openPastePanel(root.querySelector('[data-easystud-grouping-groups-panel="' + groupingid + '"]'),
        '[data-easystud-grouping-groups-box]');
};

const focusRename = target => {
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
};

// Delegate to an existing page control (toolbar or card button) when it is present.
const clickControl = (root, selector) => {
    const button = root.querySelector(selector);
    if (button) {
        button.click();
    }
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

const addCopiedUsersToGroup = (root, courseId, group) => {
    if (!group || !navigator.clipboard || !navigator.clipboard.readText) {
        return Promise.reject(new Error('Clipboard unavailable'));
    }
    const labels = getLabels(root);
    const groupid = group.getAttribute('data-easystud-group-id');
    return navigator.clipboard.readText().then(text => postAddEmailsInBatches(root, courseId, groupid, text)).then(response => {
        appendUsersToGroupCopies(root, groupid, response.users || [], labels);
        clearSelectionState(root);
        updateSelectionActions(root);
        showNotification(root, response.message || '', 'success');
        emitGuidedCompletion(root, 1, 'grouping');
    });
};

const addCopiedGroupsToGrouping = (root, courseId, grouping) => {
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

const participantActions = {
    'copy-participant-field': ({root, button, contextType, target}) => {
        const fieldkey = button.getAttribute('data-easystud-context-field') || '';
        const users = getParticipantItemsForContext(root, contextType, target);
        const values = users.map(user => getUserCopyFieldValue(user, fieldkey)).filter(Boolean);
        copyText(values.join('\n'));
    },
    'copy-participant-name': ({root, contextType, target}) => {
        const users = getParticipantItemsForContext(root, contextType, target);
        copyText(users.map(user => {
            const node = user.querySelector('.local-groupimport-easystud-user__name');
            return node ? node.textContent.trim() : '';
        }).filter(Boolean).join('\n'));
    },
    'copy-participant-id': ({root, contextType, target}) => {
        const users = getParticipantItemsForContext(root, contextType, target);
        copyText(users.map(user => user.getAttribute('data-user-id')).filter(Boolean).join('\n'));
    },
    'participant-open-details': ({root, target}) =>
        clickControl(root, '[data-easystud-open-user="' + target.getAttribute('data-user-id') + '"]'),
    'participant-move-selected': ({root}) => clickControl(root, '[data-easystud-move-selected-participants]'),
    'participant-message-selected': ({root, contextType, target}) =>
        openParticipantMessageModal(root, getSelectedMessageUserIds(root, contextType, target)),
};

const groupActions = {
    'group-search-members': ({root, target}) => {
        ensureGroupMemberSearchControls(root, target);
        const searchToggle = target.querySelector('[data-easystud-group-member-search-toggle]');
        if (searchToggle) {
            searchToggle.click();
        }
    },
    'group-paste-emails': ({root, target}) => openGroupEmailPanel(root, target),
    'group-add-copied-users': ({root, courseId, target}) => {
        addCopiedUsersToGroup(root, courseId, target).catch(() => openGroupEmailPanel(root, target));
    },
    'group-focus-rename': ({target}) => focusRename(target),
    'group-open-advanced-settings': ({root, target, contextOpener}) =>
        openAdvancedSettingsModal(root, target, contextOpener || document.activeElement),
    'copy-group-name': ({root, target}) => copyText(getContextItems(root, 'group', target)
        .map(group => getGroupName(group)).filter(Boolean).join('\n')),
    'copy-group-id': ({root, target}) => copyText(getContextItems(root, 'group', target)
        .map(group => group.getAttribute('data-easystud-group-id')).filter(Boolean).join('\n')),
    'group-move-selected': ({root}) => clickControl(root, '[data-easystud-move-selected-groups]'),
    'group-remove-from-grouping': ({root, courseId, target}) => {
        removeGroupsFromGroupings(root, courseId, getContextItems(root, 'group', target))
            .catch(error => handleActionError(root, error));
    },
    'group-delete-selected': ({root}) => clickControl(root, '[data-easystud-delete-selected-groups]'),
};

const groupingActions = {
    'grouping-focus-rename': ({target}) => focusRename(target),
    'grouping-open-advanced-settings': ({root, target, contextOpener}) =>
        openAdvancedSettingsModal(root, target, contextOpener || document.activeElement),
    'grouping-paste-groups': ({root, target}) => openGroupingGroupsPanel(root, target),
    'grouping-add-copied-groups': ({root, courseId, target}) => {
        addCopiedGroupsToGrouping(root, courseId, target).catch(() => openGroupingGroupsPanel(root, target));
    },
    'grouping-search-groups': ({target}) => {
        // The header's direct toggle is hidden on narrow screens; delegate to
        // this grouping's own toggle so bindContainerGroupSearch keeps the
        // expand, Motion panel, focus and Cancel behaviour.
        const groupingid = target.getAttribute('data-easystud-grouping-id') || '';
        const searchToggle = groupingid ? target.querySelector(
            '[data-easystud-container-search-toggle="' + groupingid + '"]') : null;
        if (searchToggle) {
            searchToggle.click();
        }
    },
    'grouping-select-groups': ({root, target}) => selectGroupingGroups(root, getContextItems(root, 'grouping', target)),
    'copy-grouping-name': ({target}) => {
        const name = target.querySelector('.local-groupimport-easystud-grouping__name');
        copyText(name ? name.textContent : '');
    },
    'copy-grouping-id': ({target}) => copyText(target.getAttribute('data-easystud-grouping-id') || ''),
};

const memberActions = {
    'member-move-selected': ({root, target, contextOpener}) => {
        root.dispatchEvent(new CustomEvent('easystud:move-members', {detail: {
            members: getContextItems(root, 'member', target),
            opener: contextOpener || target.querySelector('[data-easystud-selector-input]'),
        }}));
    },
    'remove-member': ({root, courseId, target}) => {
        const members = getContextItems(root, 'member', target);
        removeMembers(root, courseId, members).then(response => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, response.message || '', 'success');
        }).catch(error => handleActionError(root, error));
    },
};

const commonActions = {
    'clear-selection': ({root, contextType}) => {
        clearSelection(root, contextType);
        updateSelectionActions(root);
    },
    'paste-field': ({target}) => {
        pasteIntoField(target).catch(() => {});
    },
};

const CONTEXT_ACTION_HANDLERS = Object.assign({}, participantActions, groupActions, groupingActions, memberActions,
    commonActions);

// Menu clicks: the masked grouping pill, a submenu toggle, or an action run on the menu's context.
const handleMenuClick = (ui, courseId, event) => {
    const {root, menu} = ui;
    const maskedPillAction = event.target.closest('[data-easystud-masked-pill-action]');
    if (maskedPillAction && ui.context) {
        const target = ui.context.target;
        hideMenu(ui);
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
        if (!keyboard && group === ui.openGroup && !ui.openedByHover) {
            closeSubmenu(ui, group);
        } else {
            openSubmenu(ui, group, keyboard);
        }
        ui.openedByHover = false;
        return;
    }

    const button = event.target.closest('[data-easystud-context-action]');
    if (!button || !ui.context) {
        return;
    }

    const action = button.getAttribute('data-easystud-context-action');
    const request = {root, courseId, button, contextType: ui.context.type, target: ui.context.target,
        contextOpener: ui.returnFocus};
    hideMenu(ui);
    if (Object.prototype.hasOwnProperty.call(CONTEXT_ACTION_HANDLERS, action)) {
        CONTEXT_ACTION_HANDLERS[action](request);
    }
};

// Card menu buttons (added to every card, including cards rendered later) open the menu below themselves.
const bindCardMenuButtons = ui => {
    const {root} = ui;
    root.addEventListener('click', event => {
        const trigger = event.target.closest('[data-easystud-card-menu]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }
        event.stopPropagation();
        const item = getContextTarget(root, {target: trigger});
        if (!item) {
            return;
        }
        // The trigger is measured after the selection change, which can move it.
        prepareContextSelection(root, item);
        showMenu(ui, {
            preventDefault: () => event.preventDefault(),
            clientX: trigger.getBoundingClientRect().right,
            clientY: trigger.getBoundingClientRect().bottom,
            currentTarget: trigger,
        }, item.type, item.target);
    });
    ensureCardMenuButtons(root);
    let cardMenuRefreshFrame = null;
    const cardMenuObserver = new MutationObserver(mutations => {
        if (!mutations.some(mutation => mutation.addedNodes.length) || cardMenuRefreshFrame !== null) {
            return;
        }
        cardMenuRefreshFrame = window.requestAnimationFrame(() => {
            cardMenuRefreshFrame = null;
            ensureCardMenuButtons(root);
        });
    });
    cardMenuObserver.observe(root, {childList: true, subtree: true});
};

// A touch long press (responsive workspace) opens the menu under the finger.
const bindLongPressMenu = (root, open) => {
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
        const item = getContextTarget(root, event);
        if (!item) {
            return;
        }
        longPressPoint = {x: event.clientX, y: event.clientY};
        root.classList.add('local-groupimport-easystud--long-press-armed');
        longPressTimer = window.setTimeout(() => {
            suppressNextDocumentClick = true;
            open({
                preventDefault: () => {},
                clientX: longPressPoint.x,
                clientY: longPressPoint.y,
            }, item);
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
    root.addEventListener('scroll', clearLongPress, {capture: true, passive: true});

    // A long press opens the mobile backdrop under the held finger. Consume
    // the resulting compatibility click before its target can close the menu.
    document.addEventListener('click', event => {
        if (suppressNextDocumentClick) {
            suppressNextDocumentClick = false;
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
};

// Desktop flyouts open on hover after a short intent delay and stay open
// while the pointer travels to (or rests in) their own submenu.
const bindSubmenuHover = ui => {
    const {menu, menuList} = ui;
    const isHoverMenu = () => !menu.hidden && !menu.classList.contains('is-mobile-sheet');
    ui.submenuGroups.forEach(group => {
        group.addEventListener('mouseenter', () => {
            if (!isHoverMenu() || group.classList.contains('is-flattened')) {
                return;
            }
            clearHoverTimer(ui);
            if (ui.openGroup === group) {
                return;
            }
            ui.hoverTimer = window.setTimeout(() => {
                ui.hoverTimer = null;
                openSubmenu(ui, group, false);
                ui.openedByHover = true;
            }, 120);
        });
        group.addEventListener('mouseleave', () => {
            if (ui.openGroup !== group) {
                clearHoverTimer(ui);
            }
        });
    });
    menu.addEventListener('mouseover', event => {
        if (!ui.openGroup || !isHoverMenu() || !menuList || ui.hoverTimer !== null) {
            return;
        }
        const entry = Array.from(menuList.children).find(child => child.contains(event.target));
        if (!entry || entry === ui.openGroup || entry.hasAttribute('data-easystud-context-separator')) {
            return;
        }
        ui.hoverTimer = window.setTimeout(() => {
            ui.hoverTimer = null;
            closeSubmenu(ui, ui.openGroup);
        }, 120);
    });
};

// Menu keyboard: arrows/Home/End move within the current level, the
// forward arrow enters a submenu, back arrow or Escape leaves it.
const levelMoves = {
    ArrowDown: (items, index) => items[(index + 1) % items.length],
    ArrowUp: (items, index) => items[index <= 0 ? items.length - 1 : index - 1],
    Home: items => items[0],
    End: items => items[items.length - 1],
};

const leaveSubmenu = ui => {
    const toggle = getGroupParts(ui.openGroup).toggle;
    closeSubmenu(ui, ui.openGroup);
    if (toggle) {
        toggle.focus({preventScroll: true});
    }
};

// Back arrow or Escape leaves the open submenu; the forward arrow enters one.
const handleSubmenuKey = (ui, event, active, inSubmenu) => {
    const rtl = isMenuRtl(ui);
    if (inSubmenu && (event.key === (rtl ? 'ArrowRight' : 'ArrowLeft') || event.key === 'Escape')) {
        // Keep the document-level Escape from closing the whole menu.
        event.stopPropagation();
        leaveSubmenu(ui);
        return true;
    }
    if (event.key === (rtl ? 'ArrowLeft' : 'ArrowRight') && active && ui.menu.contains(active) &&
            active.matches('[data-easystud-context-submenu-toggle]')) {
        openSubmenu(ui, active.closest('[data-easystud-context-group]'), true);
        return true;
    }
    return false;
};

const bindMenuKeyboard = ui => {
    const {menu} = ui;
    menu.addEventListener('keydown', event => {
        if (menu.hidden) {
            return;
        }
        const active = document.activeElement;
        const openSubmenuElement = getGroupParts(ui.openGroup).submenu;
        const inSubmenu = !!(openSubmenuElement && active && openSubmenuElement.contains(active));
        if (handleSubmenuKey(ui, event, active, inSubmenu)) {
            event.preventDefault();
            return;
        }
        const move = Object.prototype.hasOwnProperty.call(levelMoves, event.key) ? levelMoves[event.key] : null;
        const items = move ? getLevelItems(ui, inSubmenu ? openSubmenuElement : null) : [];
        const next = items.length ? move(items, items.indexOf(active)) : null;
        if (!next) {
            return;
        }
        event.preventDefault();
        if (!inSubmenu && ui.openGroup && !ui.openGroup.contains(next)) {
            closeSubmenu(ui, ui.openGroup);
        }
        next.focus({preventScroll: true});
    });
};

// Bind right-click menus for fast local actions.
export const bindContextMenu = (root, courseId) => {
    const menu = root.querySelector('[data-easystud-context-menu]');
    const backdrop = root.querySelector('[data-easystud-context-backdrop]');
    if (!menu) {
        return;
    }

    // One menu per course manager root; its open context and submenu state live here.
    const ui = {
        root,
        menu,
        backdrop,
        menuList: menu.querySelector('.local-groupimport-easystud-context-menu__list'),
        submenuGroups: Array.from(menu.querySelectorAll('[data-easystud-context-group]')),
        animator: createMenuAnimator(root, menu),
        context: null,
        returnFocus: null,
        openGroup: null,
        openedByHover: false,
        hoverTimer: null,
        menuClosing: false,
    };
    const hide = () => hideMenu(ui);
    // Select the target (unless it is already part of the selection), then open the menu on it.
    const openOn = (event, item) => {
        prepareContextSelection(root, item);
        showMenu(ui, event, item.type, item.target);
    };

    bindCardMenuButtons(ui);
    root.addEventListener('contextmenu', event => {
        const item = getContextTarget(root, event);
        if (item) {
            openOn(event, item);
        }
    });
    bindLongPressMenu(root, openOn);
    menu.addEventListener('click', event => handleMenuClick(ui, courseId, event));

    document.addEventListener('click', event => {
        if (!menu.hidden && !menu.contains(event.target)) {
            hide();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            hide();
        }
    });
    bindSubmenuHover(ui);
    bindMenuKeyboard(ui);

    if (backdrop) {
        backdrop.addEventListener('click', hide);
    }
    menu.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-context-close]')) {
            hide();
        }
    });
    window.addEventListener('scroll', event => {
        if (!isResponsiveWorkspace() && !(event.target instanceof Node && menu.contains(event.target))) {
            hide();
        }
    }, {capture: true, passive: true});
};
