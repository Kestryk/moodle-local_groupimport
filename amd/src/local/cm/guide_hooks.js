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
 * EasyStud course manager: Guide path completion hooks.
 *
 * @module     local_groupimport/local/cm/guide_hooks
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import * as Guide from '../../easyedu_guide';
import {getSelectedItems} from './selection';
import {isResponsiveWorkspace, requestGuideHighlightRefresh} from './shared';

export const emitGuidedCompletion = (root, step, path = 'main') => {
    root.dispatchEvent(new CustomEvent('easystud:guided-complete', {
        bubbles: true,
        detail: {path, step},
    }));

    // Historical tutorial notifications remain; retired Kit paths no longer
    // receive broad numeric completions from these unrelated actions.
};

// Emit only the next unfinished milestone in the distinct Practice path.
// Presentation/highlights never call business commands or reuse broad legacy
// completion events (copy/drag/create grouping must not complete this exercise).
export const emitNativePathCompletion = (root, path, step) => {
    const checklist = document.querySelector(
        '[data-easyedu-guide-checklist][data-easyedu-guide-path="' + path + '"]'
    );
    if (!checklist || checklist.hidden || !root.isConnected) {
        return;
    }
    const next = checklist.querySelector('[data-easyedu-guide-step-id]:not(.is-complete)');
    if (!next || next.disabled || next.getAttribute('data-easyedu-guide-step-id') !== step) {
        return;
    }
    root.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
        bubbles: true,
        detail: {path, step},
    }));
};

export const emitPracticeCompletion = (root, step) => emitNativePathCompletion(root, 'practice-membership', step);
export const emitMemberPathCompletion = (root, step) => emitNativePathCompletion(root, 'reorganise-source-members', step);

// Navigation can portal this exact node outside the workspace on compact screens.
export const getActivityGuideRoot = root => root.easystudGuideOwner || root.querySelector('[data-easyedu-guide-root]');

// The retained Actions path shares the modern ordered milestone authority.
// A completed drag must also belong to the session that submitted the action.
export const emitTryActionsCompletion = (root, step, token = null) => {
    if (step === 'try-drag') {
        const current = Guide.getPathContextToken(getActivityGuideRoot(root), 'try-actions');
        if (!token || !current || token.root !== current.root || token.config !== current.config ||
                token.epoch !== current.epoch) {
            return;
        }
    }
    emitNativePathCompletion(root, 'try-actions', step);
};

// Guided path n°10: the drag start completes "try-drag" while the dragged card is masked
// (visibility: hidden), so the Guide drops its highlight and, without autoHighlightNext,
// never targets the next step. Once the cards are visible again, target the active
// step explicitly.
export const highlightActiveTryActionsStep = root => {
    const guideRoot = getActivityGuideRoot(root);
    const config = guideRoot && guideRoot.easyeduGuideConfig;
    const checklist = document.querySelector('[data-easyedu-guide-checklist][data-easyedu-guide-path="try-actions"]');
    if (!config || !config.paths || !checklist || checklist.hidden || !root.isConnected) {
        return;
    }
    const active = checklist.querySelector('[data-easyedu-guide-step-id].is-active:not(.is-complete)');
    const stepId = active ? active.getAttribute('data-easyedu-guide-step-id') : '';
    const step = (config.paths['try-actions'] || []).find(item => item.id === stepId);
    if (!step) {
        return;
    }
    const compact = Guide.guideModality().narrow;
    const target = (compact ? step.highlightTargetCompact : step.highlightTargetDesktop) ||
        step.highlightTarget || step.target;
    if (target) {
        requestGuideHighlightRefresh(root, {root: guideRoot, target});
    }
};

// C2-15-02 (Kevin, 15/10): drag and drop is disabled in the compact workspace (<= 1024 px), so
// guided path n°10 ("try-actions") teaches its first step with the card ⋮ menu there: open the
// menu, choose "Add to group", confirm the destination. The step keeps its id ("try-drag"), so
// saved progress and the requirements of the next steps are unchanged; desktop keeps the drag.
const COMPACT_MOVE_ITEM = '[data-easystud-context-action="participant-move-selected"]:not([hidden])';

const isCompactMoveStepActive = root => {
    const checklist = document.querySelector('[data-easyedu-guide-checklist][data-easyedu-guide-path="try-actions"]');
    if (!isResponsiveWorkspace() || !checklist || checklist.hidden || !root.isConnected) {
        return false;
    }
    const active = checklist.querySelector('[data-easyedu-guide-step-id].is-active:not(.is-complete)');
    return !!active && active.getAttribute('data-easyedu-guide-step-id') === 'try-drag';
};

// The compact copy and cue of the step. The dedicated strings do not exist yet (they belong to
// Codex n°1's lang files): until manage.php passes titleCompact/descriptionCompact/feedbackCompact,
// FALLBACK to existing strings with the same meaning: the menu item label, then the "Add to group"
// steps of the Practice path. Returns false while the Guide has no configuration yet.
export const installTryActionsCompactMove = (root, guideRoot) => {
    const config = guideRoot && guideRoot.easyeduGuideConfig;
    const steps = config && config.paths ? config.paths['try-actions'] : null;
    const step = steps ? steps.find(item => item.id === 'try-drag') : null;
    if (!step) {
        return false;
    }
    if (step.easystudCompactMove) {
        return true;
    }
    const practice = config.paths['practice-membership'] || [];
    const practiceText = (id, field) => (practice.find(item => item.id === id) || {})[field] || '';
    const menuItem = root.querySelector('[data-easystud-context-action="participant-move-selected"]');
    step.easystudCompactMove = true;
    step.highlightTargetCompact = step.highlightTargetCompact || 'participantCardActions';
    step.titleCompact = step.titleCompact || (menuItem && menuItem.getAttribute('data-easystud-context-label')) ||
        practiceText('open-move', 'title');
    step.descriptionCompact = step.descriptionCompact || practiceText('confirm-move', 'description');
    step.feedbackCompact = step.feedbackCompact || practiceText('open-move', 'description');
    return true;
};

// The cue follows the real sequence: card ⋮ menu, then "Add to group" in the action sheet, then
// Confirm in the move dialog; closing the sheet or the dialog brings it back to the ⋮ menu.
export const syncTryActionsMoveCue = root => {
    if (!isCompactMoveStepActive(root)) {
        return;
    }
    const modal = root.querySelector('[data-easystud-move-modal]');
    const menu = root.querySelector('[data-easystud-context-menu]');
    let target = 'participantCardActions';
    if (modal && !modal.hidden && modal.getAttribute('data-easystud-move-context') === 'participant') {
        target = 'participantMoveConfirm';
    } else if (menu && !menu.hidden && menu.querySelector(COMPACT_MOVE_ITEM)) {
        target = COMPACT_MOVE_ITEM;
    }
    // Not through requestGuideHighlightRefresh: opening the sheet selects the card, and the
    // targetless layout refresh that follows would cancel this target in that shared slot.
    const detail = {root: getActivityGuideRoot(root), target, dock: true};
    const epoch = (root.easystudMoveCueEpoch || 0) + 1;
    root.easystudMoveCueEpoch = epoch;
    const dispatch = () => {
        if (root.easystudMoveCueEpoch === epoch && isCompactMoveStepActive(root)) {
            document.dispatchEvent(new CustomEvent('easyedu:guide-refresh-highlight', {detail}));
        }
    };
    (root.easystudMoveCueTimers || []).forEach(timer => window.clearTimeout(timer));
    root.easystudMoveCueTimers = [0, Motion.timing.slow + 20].map(delay => window.setTimeout(dispatch, delay));
    // The action sheet and the dialog slide in with Web Animations, which no mutation reports:
    // paint the cue again on the settled control once their motion has finished.
    const layers = {[COMPACT_MOVE_ITEM]: menu, participantMoveConfirm: modal};
    const layer = layers[target] || null;
    if (layer && layer.getAnimations) {
        Promise.all(layer.getAnimations({subtree: true}).map(animation => animation.finished))
            .then(dispatch).catch(() => dispatch());
    }
};

// The session of the dialog is captured when it opens, like the desktop drag captures it on drop.
export const captureTryActionsMoveToken = root => isResponsiveWorkspace() ?
    Guide.getPathContextToken(getActivityGuideRoot(root), 'try-actions') : null;

// Only a participant addition confirmed by Moodle completes the compact step.
export const emitTryActionsMoveCompletion = (root, token) => {
    if (!token) {
        return;
    }
    emitTryActionsCompletion(root, 'try-drag', token);
    highlightActiveTryActionsStep(root);
};

export const emitTryActionsSelection = root => {
    if (getSelectedItems(root, 'participant').length) {
        emitTryActionsCompletion(root, 'try-selection');
    }
};

const activityGroupingSessionIsCurrent = (root, token) => {
    const current = Guide.getPathContextToken(getActivityGuideRoot(root), 'prepare-activity-grouping');
    return !!token && !!current && token.root === current.root && token.config === current.config &&
        token.epoch === current.epoch;
};

export const emitActivityGroupingEntry = (root, id, token) => {
    if (activityGroupingSessionIsCurrent(root, token) && typeof id === 'string' && /^[1-9]\d*$/.test(id) &&
            Array.from(root.querySelectorAll('[data-easystud-grouping-id]'))
                .some(grouping => grouping.getAttribute('data-easystud-grouping-id') === id)) {
        emitNativePathCompletion(root, 'prepare-activity-grouping', 'open-grouping');
    }
};

export const emitActivityGroupSelection = root => {
    const selected = getSelectedItems(root, 'group');
    if (selected.length && selected.every(group => /^[1-9]\d*$/.test(
        group.getAttribute('data-easystud-group-id') || ''
    ))) {
        emitNativePathCompletion(root, 'prepare-activity-grouping', 'select-groups');
    }
};

// Only an explicit native disclosure, after Motion settles, can certify this step.
export const verifyActivityGrouping = (root, grouping, token) => {
    const context = Guide.getPathContext(getActivityGuideRoot(root), 'prepare-activity-grouping');
    if (!activityGroupingSessionIsCurrent(root, token) || !context ||
            grouping.getAttribute('data-easystud-grouping-id') !== context.destinationId) {
        return;
    }
    const toggle = grouping.querySelector('[data-easystud-collapse-toggle]');
    const children = grouping.querySelector('.local-groupimport-easystud-tree__children');
    if (!toggle || toggle.getAttribute('aria-expanded') !== 'true' || !children || children.hidden) {
        return;
    }
    const present = Array.from(children.querySelectorAll('[data-easystud-group-id]'))
        .filter(group => group.closest('[data-easystud-grouping-id]') === grouping && !group.hidden)
        .map(group => group.getAttribute('data-easystud-group-id'));
    if (context.groupIds.length && context.groupIds.every(id => present.includes(id))) {
        emitNativePathCompletion(root, 'prepare-activity-grouping', 'verify-grouping');
    }
};

// Capture before the native asynchronous Group batch, never from its late callback.
// This bridge stays inert until the additive activity path and schema are installed.
export const captureActivityGroupingConfirmation = (root, destinationId, groups) => {
    const path = 'prepare-activity-grouping';
    const checklist = document.querySelector(
        '[data-easyedu-guide-checklist][data-easyedu-guide-path="' + path + '"]'
    );
    const next = checklist && !checklist.hidden && root.isConnected ?
        checklist.querySelector('[data-easyedu-guide-step-id]:not(.is-complete)') : null;
    if (!next || next.disabled || next.getAttribute('data-easyedu-guide-step-id') !== 'confirm-groups' ||
            !/^[1-9]\d*$/.test(destinationId) || !groups.length) {
        return null;
    }
    const token = Guide.getPathContextToken(getActivityGuideRoot(root), path);
    const groupIds = groups.map(group => group.getAttribute('data-easystud-group-id'));
    const knownDestination = Array.from(root.querySelectorAll('[data-easystud-grouping-id]'))
        .some(grouping => grouping.getAttribute('data-easystud-grouping-id') === destinationId);
    if (!token || !knownDestination || groupIds.some(id => typeof id !== 'string' || !/^[1-9]\d*$/.test(id))) {
        return null;
    }
    return Object.freeze({
        token,
        requestCount: groups.length,
        context: Object.freeze({destinationId, groupIds: Object.freeze([...new Set(groupIds)])}),
    });
};

export const commitActivityGroupingConfirmation = (root, evidence, responses) => {
    if (!evidence || responses.length !== evidence.requestCount ||
            responses.some(response => !response || typeof response !== 'object' || response.success === false)) {
        return false;
    }
    const checklist = document.querySelector(
        '[data-easyedu-guide-checklist][data-easyedu-guide-path="prepare-activity-grouping"]'
    );
    const next = checklist && !checklist.hidden && root.isConnected ?
        checklist.querySelector('[data-easyedu-guide-step-id]:not(.is-complete)') : null;
    if (!next || next.disabled || next.getAttribute('data-easyedu-guide-step-id') !== 'confirm-groups' ||
            !Guide.setPathContext(getActivityGuideRoot(root), 'prepare-activity-grouping', evidence.context, evidence.token)) {
        return false;
    }
    emitNativePathCompletion(root, 'prepare-activity-grouping', 'confirm-groups');
    return true;
};
export const emitEditorInspectionCompletion = (root, type, step) => {
    if (type === 'group' || type === 'grouping') {
        emitNativePathCompletion(root, 'inspect-' + type + '-settings', step);
    }
};
