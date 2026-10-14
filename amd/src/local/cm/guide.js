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
 * EasyStud course manager: shared Guide targets and tutorial dialog.
 *
 * @module     local_groupimport/local/cm/guide
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import * as Guide from '../../easyedu_guide';
import {compactClass, isResponsiveWorkspace, getLabels, showNotification} from './shared';
import {schedulePanelActionOverflow} from './layout';
import {getGroupElementsById, scheduleParticipantTagOverflow, setInlinePanelOpen} from './cards';
import {getActivityGuideRoot, verifyActivityGrouping} from './guide_hooks';
import {
    syncGroupMembersCollapsible, syncGroupingGroupsCollapsible, scheduleGroupingResizeForGroup,
    normaliseCardMenuButton, ensureGroupEmailPanel,
} from './group_cards';
import {expandGroupingSection, ensureTreeSection} from './workspace';

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

// The shared Guide owns its modal and checklist UI. EasyStud still owns the
// product-specific controls that a slide can reveal (for example an inline
// email field or a grouping's add-groups field). Keep that adapter active
// even when the legacy tutorial modal is not rendered.
export const bindSharedGuideTargets = root => {
    const guideRoot = getActivityGuideRoot(root);
    if (guideRoot) {
        root.easystudGuideOwner = guideRoot;
    }
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

export const bindTutorialModal = root => {
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
    // Per person: M.cfg has no user id, so the server provides it on the root.
    const discoveryKey = 'local_groupimport_easystud_guide_seen_' +
        (root.getAttribute('data-easystud-course-id') || 'course') + '_' +
        (root.getAttribute('data-easystud-user-key') || 'guest');
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
