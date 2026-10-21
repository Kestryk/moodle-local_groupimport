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
import Log from 'core/log';
import {createStore} from './local/sm/store';
import {filterParticipantIds} from './local/sm/index';
import {createParticipantModel} from './local/sm/participants';
import {attachGroupCatalogs} from './local/sm/groups';
import {onReady, runSafely, getLabels} from './local/cm/shared';
import {setOnDemandParticipants} from './local/cm/state';
import {scheduleCompleteListAlignment} from './local/cm/layout';
import {syncResponsiveDragAvailability} from './local/cm/drag_support';
import {
    normaliseAllGroupGroupingTags, scheduleGroupGroupingOverflow, scheduleParticipantTagOverflow,
    syncGroupingChildrenState, syncUngroupedState,
} from './local/cm/cards';
import {
    normaliseMemberRemoveLabels, updateGroupingBadge, syncAllCountBadges, ensureDuplicateButtons,
    ensureAdvancedSettingsButtons, ensureInlinePanelCancelButtons,
} from './local/cm/group_cards';
import {updateParticipantEmptyState} from './local/cm/filters';
import {bindAccessibleNames} from './local/cm/accessible_names';
import {
    syncCatalogFilters, scheduleResponsiveUiRefresh, syncPagination, applyFilters, updateSelectionActions,
} from './local/cm/workspace';
import {bindAdvancedSettings} from './local/cm/advanced_settings';
import {bindGroupSelectAll, bindSelection} from './local/cm/selection_controls';
import {bindPagination, bindFilters, bindTree, bindCatalogFilters, bindAdvancedFilters} from './local/cm/list_controls';
import {
    bindContainerGroupSearch, bindGroupMemberSearch, bindNestedGroupActionMenus, bindGroupMemberToggles,
    bindTagToggles, bindHoverPopovers,
} from './local/cm/group_card_controls';
import {
    bindQuickCreate, bindRenameForms, bindGroupMemberActions, bindGroupingGroupActions, bindBulkActions,
    bindParticipantMessaging, bindDuplicateActions,
} from './local/cm/quick_actions';
import {bindResponsiveDragGuard, bindGroupDragDrop, bindUserDragDrop} from './local/cm/drag_drop';
import {
    bindResponsiveGuideLauncher, bindCanonicalNavigation, bindResponsiveParticipantNavigation, bindBackToTop,
    bindLayoutModeToggle, bindMobileEntityViews, bindPanelActionOverflow, bindGuideBottomObstruction,
} from './local/cm/navigation';
import {bindOptionalTools, bindPastePreview} from './local/cm/optional_tools';
import {bindMoveModal} from './local/cm/move_modal';
import {bindParticipantModal} from './local/cm/participant_modal';
import {bindContextMenu} from './local/cm/context_menu';
import {bindSharedGuideTargets} from './local/cm/guide';

/**
 * SM-RENDU (K21-17): say in the participant list that the course state could not be loaded, with
 * a Reload button, instead of an empty exception dialog over the page. Kit warning notice (the
 * same recipe as the entity dialog's error state, templates/sm/participant_card and
 * local/cm/entity_dialog.entityErrorNotice), not a raw Bootstrap alert.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Object} strings Participant card labels from manage.php (loaderror, reload).
 */
const showOnDemandLoadError = (root, strings) => {
    const list = root.querySelector('[data-easystud-participant-list]');
    if (!list || list.querySelector('[data-easystud-sm-error]')) {
        return;
    }
    const message = document.createElement('div');
    message.className = 'easyedu-notice easyedu-notice--warning local-groupimport-easystud__sm-error';
    message.setAttribute('role', 'alert');
    message.setAttribute('data-easystud-sm-error', '1');
    const icon = document.createElement('span');
    icon.className = 'fa fa-exclamation-triangle';
    icon.setAttribute('aria-hidden', 'true');
    const copy = document.createElement('div');
    copy.className = 'local-groupimport-easystud__sm-error-copy';
    const text = document.createElement('p');
    text.textContent = strings.loaderror || '';
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.className = 'btn easyedu-button--secondary local-groupimport-easystud__sm-error-reload';
    reload.textContent = strings.reload || '';
    reload.addEventListener('click', () => window.location.reload());
    copy.append(text, reload);
    message.append(icon, copy);
    const top = list.querySelector(':scope > [data-easystud-pagination="top"]');
    list.insertBefore(message, top ? top.nextSibling : list.firstChild);
};

/**
 * SM-RENDU: load the compact course state and render the participant list from it.
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Number} courseId Course id.
 * @param {Object} strings Participant card labels from manage.php.
 * @param {Object} groupStrings Group card labels from manage.php.
 * @returns {Promise} Settles once the first render is done or has failed.
 */
const startOnDemandState = (root, courseId, strings, groupStrings) => {
    root.setAttribute('data-easystud-rendering-mode', 'reactive');
    let store = null;
    return createStore(root, courseId)
        .then(loaded => {
            store = loaded;
            return createParticipantModel(loaded.raw, strings);
        })
        .then(model => attachGroupCatalogs(model, groupStrings))
        .then(model => {
            const {reactive, raw, loadMs} = store;
            setOnDemandParticipants({root, model, courseId});
            const renderStarted = window.performance.now();
            // The first cards replace the list skeletons with a short fade (CSS), once.
            root.classList.add('is-easystud-sm-entering');
            window.setTimeout(() => root.classList.remove('is-easystud-sm-entering'), 700);
            applyFilters(root);
            syncCatalogFilters(root);
            root.querySelectorAll('[data-easystud-tree] [data-easystud-grouping-id]').forEach(updateGroupingBadge);
            updateSelectionActions(root);
            const timings = {
                loadMs,
                firstRenderMs: Math.round(window.performance.now() - renderStarted),
            };
            // The course state (names, e-mails, memberships) stays off the DOM node unless the
            // site runs in developer debugging, where the Playwright integration specs read it.
            root.easystudSm = window.M && M.cfg && M.cfg.developerdebug ? Object.assign({
                reactive,
                raw,
                model,
                filterParticipantIds: filters => filterParticipantIds(model.index, filters),
            }, timings) : timings;
            root.setAttribute('data-easystud-sm-ready', '1');
            root.dispatchEvent(new CustomEvent('local_groupimport/sm:ready', {detail: {loadMs}}));
            return root.easystudSm;
        })
        .catch(error => {
            root.setAttribute('data-easystud-sm-ready', 'error');
            root.querySelectorAll('[data-easystud-sm-loading]').forEach(node => node.remove());
            showOnDemandLoadError(root, strings);
            Log.error(error);
        });
};

// Initialise the manager.

export const init = (rootId, courseId, options = {}) => {
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
        // Card labels, for the on-demand lists and the Guide specimens (local/sm/specimen).
        root.easystudCardStrings = {cards: options.cardstrings || {}, groups: options.groupstrings || {}};
        // The page reports ready only once the state has drawn the lists.
        runSafely(() => {
            root.easystudSmStarting = startOnDemandState(root, courseId, options.cardstrings || {},
                options.groupstrings || {});
        });

        [
            () => bindFilters(root),
            () => bindSelection(root),
            () => bindGroupSelectAll(root),
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
            () => bindOptionalTools(root),
            () => bindPastePreview(root),
            () => bindHoverPopovers(root),
            () => bindAccessibleNames(root),
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
        const markInitialised = () => window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                root.removeAttribute('data-easystud-manager-initialising');
                root.setAttribute('data-easystud-manager-initialised', '1');
                if (!loadingController || typeof loadingController.complete !== 'function') {
                    root.classList.remove('local-groupimport-easystud--booting');
                }
            });
        });
        if (root.easystudSmStarting) {
            // T061: the bindings are in place, the course state is still loading. Show the real
            // frame and its per-component skeletons now; the page stays busy and non-interactive
            // (loading bootstrap) until the lists are drawn.
            window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
                root.setAttribute('data-easyedu-loading-frame', '1');
            }));
        }
        (root.easystudSmStarting || Promise.resolve()).then(markInitialised).catch(markInitialised);
    });
};
