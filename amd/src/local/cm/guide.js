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
 * EasyStud course manager: shared Guide targets.
 *
 * @module     local_groupimport/local/cm/guide
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Guide from '../../guide_api';
import {isResponsiveWorkspace, getLabels} from './shared';
import {scheduleParticipantTagOverflow, setInlinePanelOpen} from './cards';
import {
    getActivityGuideRoot, verifyActivityGrouping, installTryActionsCompactMove, syncTryActionsMoveCue,
} from './guide_hooks';
import {
    normaliseCardMenuButton, ensureGroupEmailPanel,
} from './group_cards';
import {expandGroupingSection, ensureTreeSection} from './workspace';

// Guided path n°10 in the compact workspace (C2-15-02): install the ⋮ menu variant of its first
// step and let its cue follow the action sheet and the move dialog as they open and close.
const bindTryActionsCompactMove = (root, guideRoot) => {
    if (!installTryActionsCompactMove(root, guideRoot)) {
        // The Guide normally initialises first; otherwise install on its first step request.
        const retry = () => {
            if (installTryActionsCompactMove(root, guideRoot)) {
                document.removeEventListener('easyedu:guide-open-target', retry);
            }
        };
        document.addEventListener('easyedu:guide-open-target', retry);
    }
    if (!window.MutationObserver) {
        return;
    }
    let frame = null;
    const observer = new MutationObserver(() => {
        if (frame === null) {
            frame = window.requestAnimationFrame(() => {
                frame = null;
                syncTryActionsMoveCue(root);
            });
        }
    });
    ['[data-easystud-context-menu]', '[data-easystud-move-modal]'].forEach(selector => {
        const node = root.querySelector(selector);
        if (node) {
            observer.observe(node, {attributes: true, attributeFilter: ['hidden']});
        }
    });
};

// The shared Guide owns its modal and checklist UI. EasyStud still owns the
// product-specific controls that a slide can reveal (for example an inline
// email field or a grouping's add-groups field). Keep that adapter active
// independently from the removed legacy tutorial.
export const bindSharedGuideTargets = root => {
    const guideRoot = getActivityGuideRoot(root);
    if (guideRoot) {
        root.easystudGuideOwner = guideRoot;
    }
    if (!guideRoot || root.dataset.easystudGuideTargetsBound === '1') {
        return;
    }
    root.dataset.easystudGuideTargetsBound = '1';
    bindTryActionsCompactMove(root, guideRoot);

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

    const openEditorEntry = type => {
        if (isResponsiveWorkspace() || root.easystudDesktopMode !== 'structure') {
            ensureWorkspace(type === 'group' ? 'groups' : 'groupings');
        }
        const catalogue = type === 'group' ? '[data-easystud-structure-groups]' : '[data-easystud-tree]';
        const item = Array.from(root.querySelectorAll(catalogue + ' [data-easystud-advanced-type="' + type + '"]'))
            .find(node => node.getClientRects().length && !node.hidden);
        if (!item) {
            return null;
        }
        const header = item.querySelector(':scope > .local-groupimport-easystud-' + type + '__header');
        const direct = header?.querySelector(':scope > [data-easystud-open-advanced-settings]');
        if (direct?.getClientRects().length) {
            return direct;
        }
        const trigger = item.querySelector(':scope > [data-easystud-card-menu]') ||
            header?.querySelector(':scope > [data-easystud-card-menu]');
        if (!trigger?.getClientRects().length) {
            return null;
        }
        if (trigger.getAttribute('aria-expanded') !== 'true') {
            trigger.click();
        }
        const action = root.querySelector('[data-easystud-context-action="' + type + '-open-advanced-settings"]');
        return action && !action.hidden && action.getClientRects().length ? action : null;
    };

    const openEditorDialog = type => {
        const current = root.querySelector('[data-easystud-advanced-settings-modal]');
        if (current && !current.hidden) {
            return current.getAttribute('data-easystud-editor-context') === type ? current : null;
        }
        if (Array.from(root.querySelectorAll('[role="dialog"]')).some(node =>
                !node.hidden && node.getAttribute('aria-hidden') !== 'true' && node.getClientRects().length)) {
            return null;
        }
        const entry = openEditorEntry(type);
        if (entry && !entry.disabled) {
            entry.click();
        }
        const modal = root.querySelector('[data-easystud-advanced-settings-modal]');
        return modal?.getAttribute('data-easystud-editor-context') === type ? modal : null;
    };

    const openTarget = selector => {
        if (!selector) {
            return null;
        }
        if (selector === 'tutorial:activity-grouping-workspace' || selector === 'tutorial:activity-group-workspace' ||
                selector === 'tutorial:activity-grouping-result') {
            const workspace = selector === 'tutorial:activity-group-workspace' ? 'groups' : 'groupings';
            if (!isResponsiveWorkspace() && root.easystudDesktopMode !== 'structure') {
                root.easystudApplyDesktopMode?.('structure', false);
            } else if (isResponsiveWorkspace()) {
                const view = root.querySelector('[data-easystud-mobile-view="' + workspace + '"]');
                if (view && view.getAttribute('aria-pressed') !== 'true') {
                    view.click();
                }
            }
            root.querySelectorAll('[data-easystud-guide-activity-destination]').forEach(node => {
                node.removeAttribute('data-easystud-guide-activity-destination');
            });
            if (selector === 'tutorial:activity-grouping-result') {
                const context = Guide.getPathContext(getActivityGuideRoot(root), 'prepare-activity-grouping');
                const grouping = context ? Array.from(root.querySelectorAll('[data-easystud-grouping-id]'))
                    .find(node => node.getAttribute('data-easystud-grouping-id') === context.destinationId) : null;
                grouping?.setAttribute('data-easystud-guide-activity-destination', 'true');
                if (grouping) {
                    // Check the real state when the step starts: the destination may already be
                    // open since an earlier step. A closed destination is opened, and bindTree
                    // verifies it once its Motion settles.
                    const toggle = grouping.querySelector(
                        ':scope > .local-groupimport-easystud-grouping__header [data-easystud-collapse-toggle]'
                    );
                    if (toggle && toggle.getAttribute('aria-expanded') === 'false') {
                        toggle.click();
                    } else {
                        ensureTreeSection(root, grouping);
                        verifyActivityGrouping(root, grouping,
                            Guide.getPathContextToken(getActivityGuideRoot(root), 'prepare-activity-grouping'));
                    }
                }
                return grouping;
            }
            return root.querySelector(workspace === 'groups' ? '[data-easystud-structure-groups]' : '[data-easystud-tree]');
        }
        if (selector === 'tutorial:activity-group-dialog') {
            const modal = root.querySelector('[data-easystud-move-modal]');
            if (modal && modal.hidden) {
                Array.from(root.querySelectorAll('[data-easystud-move-selected-groups]'))
                    .find(button => !button.disabled)?.click();
            }
            return modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') === 'group' ? modal : null;
        }
        if (selector === 'tutorial:participant-filter-workspace' ||
                selector === 'tutorial:participant-filter-controls') {
            if (isResponsiveWorkspace()) {
                const view = root.querySelector('[data-easystud-mobile-view="participants"]');
                if (view && view.getAttribute('aria-pressed') !== 'true') {
                    view.click();
                }
            } else if (root.easystudDesktopMode !== 'participants') {
                root.easystudApplyDesktopMode?.('participants', false);
            }
            if (selector === 'tutorial:participant-filter-controls') {
                const toggle = root.querySelector('[data-easystud-advanced-filters-toggle="participants"]');
                if (toggle && toggle.getAttribute('aria-expanded') !== 'true') {
                    toggle.click();
                }
            }
            return root.querySelector('[data-easystud-search]');
        }
        const editorTargets = {
            'tutorial:group-editor-entry': ['group', false],
            'tutorial:grouping-editor-entry': ['grouping', false],
            'tutorial:group-editor-dialog': ['group', true],
            'tutorial:grouping-editor-dialog': ['grouping', true],
        };
        if (editorTargets[selector]) {
            const [type, dialog] = editorTargets[selector];
            return dialog ? openEditorDialog(type) : openEditorEntry(type);
        }
        if (selector === 'tutorial:close-participant-move-dialog') {
            const modal = root.querySelector('[data-easystud-move-modal]');
            if (modal && !modal.hidden) {
                modal.querySelector('[data-easystud-close-move-modal]')?.click();
            }
            return root;
        }
        if (selector === 'tutorial:participant-move-dialog') {
            const modal = root.querySelector('[data-easystud-move-modal]');
            if (modal && modal.hidden) {
                const action = Array.from(root.querySelectorAll('[data-easystud-move-selected-participants]'))
                    .find(button => !button.disabled);
                action?.click();
            }
            return modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') === 'participant' ?
                modal : null;
        }
        if (selector === 'tutorial:participant-details') {
            const participant = root.querySelector('[data-easystud-participant-list] [data-easystud-user]:not([hidden])');
            if (participant) {
                participant.focus({preventScroll: true});
            }
            scheduleParticipantTagOverflow(root);
            return participant;
        }
        if (selector === 'tutorial:member-move-dialog') {
            const modal = root.querySelector('[data-easystud-move-modal]');
            if (modal && modal.hidden) {
                const action = Array.from(root.querySelectorAll('[data-easystud-move-selected-members]'))
                    .find(button => !button.disabled);
                action?.click();
            }
            return modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') === 'member' ?
                modal : null;
        }
        if (selector === 'tutorial:source-group-members') {
            if (isResponsiveWorkspace() || root.easystudDesktopMode !== 'structure') {
                ensureWorkspace('groups');
            }
            const group = Array.from(root.querySelectorAll(
                '[data-easystud-structure-groups] [data-easystud-group-id]:not([hidden])'
            )).find(item => item.getClientRects().length &&
                item.querySelector('[data-easystud-member-id]:not([hidden])'));
            if (!group) {
                return null;
            }
            const toggle = group.querySelector('[data-easystud-group-members-toggle]');
            if (toggle && !toggle.hidden && toggle.getAttribute('aria-expanded') !== 'true') {
                toggle.click();
            }
            return group.querySelector('[data-easystud-group-members]') || group;
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
        if (request.target === 'tutorial:close-participant-move-dialog') {
            request.handled = true;
            request.ready = root.easystudCloseMoveDialog?.() || Promise.resolve(true);
            return;
        }
        if (request.target === 'tutorial:close-member-move-dialog') {
            const modal = root.querySelector('[data-easystud-move-modal]');
            request.handled = true;
            // Do not discard another native dialog's context during review.
            request.ready = modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') !== 'member' ?
                Promise.resolve(false) : root.easystudCloseMoveDialog?.() || Promise.resolve(true);
            return;
        }
        if (request.target === 'tutorial:close-group-editor' || request.target === 'tutorial:close-grouping-editor') {
            const type = request.target === 'tutorial:close-group-editor' ? 'group' : 'grouping';
            const modal = root.querySelector('[data-easystud-advanced-settings-modal]');
            request.handled = true;
            request.ready = !modal || modal.hidden ? Promise.resolve(true) :
                modal.getAttribute('data-easystud-editor-context') === type ?
                    modal.easystudCloseEditor?.() || Promise.resolve(false) : Promise.resolve(false);
            // Finish the originating click before revealing a compact card menu.
            // Reduced-motion exit can resolve inside that click's propagation;
            // its native outside-click listener would otherwise close the new menu.
            request.ready = Promise.resolve(request.ready).then(completed => completed === false ? false :
                new Promise(resolve => window.requestAnimationFrame(() => resolve(true))));
            return;
        }
        if (openTarget(request.target)) {
            request.handled = true;
        }
    });
};
