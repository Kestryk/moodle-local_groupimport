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
 * EasyStud course manager: optional tools (participant density, paste preview).
 *
 * @module     local_groupimport/local/cm/optional_tools
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {compactClass, isResponsiveWorkspace, requestGuideHighlightRefresh} from './shared';
import {showEasyStudModal, hideEasyStudModal, bindCardModalKeyboard} from './modal';
import {lazyKnownUserIdentifiers, renderIdentifierPreview} from './identifiers';
import {scheduleResponsiveUiRefresh, syncParticipantDensity, syncPagination} from './workspace';
import {syncParticipantTagOverflow} from './cards';
import {getOnDemandModel} from './state';
import {setMetaExpandedOverride} from '../sm/participants';

export const bindOptionalTools = root => {
    const densityToggle = root.querySelector('[data-easystud-density-toggle]');
    const mobileMembershipToggle = root.querySelector('[data-easystud-mobile-membership-toggle]');
    const modal = root.querySelector('[data-easystud-clipboard-modal]');
    const openClipboardButtons = Array.from(root.querySelectorAll(
        '[data-easystud-open-clipboard], [data-easyedu-navigation-action="open-clipboard"]'
    ));
    const closeClipboard = root.querySelector('[data-easystud-close-clipboard]');

    if (densityToggle) {
        const state = {
            desktopCompact: root.classList.contains(compactClass),
            mobileCompact: root.classList.contains(compactClass),
            responsive: isResponsiveWorkspace(),
            expandedParticipant: null,
        };
        root.easystudParticipantDensity = state;
        if (state.responsive) {
            root.classList.remove(compactClass);
        }
        const updateDensityToggle = () => {
            const mobile = isResponsiveWorkspace();
            const compact = mobile ? state.mobileCompact : root.classList.contains(compactClass);
            const model = getOnDemandModel(root);
            // Use the full participant index, not the current filter/page or empty Groups.
            const hasMemberships = !!model && model.index.some(entry => entry.groupids.length || entry.groupingids.length);
            densityToggle.disabled = mobile && !hasMemberships;
            densityToggle.setAttribute('aria-pressed', compact ? 'true' : 'false');
            const text = densityToggle.querySelector('span:last-child');
            if (text) {
                const detailedLabel = mobile ? 'data-mobile-detailed-label' : 'data-detailed-label';
                const compactLabel = mobile ? 'data-mobile-compact-label' : 'data-compact-label';
                text.textContent = compact ?
                    (densityToggle.getAttribute(detailedLabel) || '') :
                    (densityToggle.getAttribute(compactLabel) || '');
            }
            const icon = densityToggle.querySelector('.fa');
            if (icon) {
                icon.classList.toggle('fa-compress', !compact);
                icon.classList.toggle('fa-expand', compact);
            }
            if (mobileMembershipToggle) {
                mobileMembershipToggle.hidden = !mobile;
                mobileMembershipToggle.disabled = mobile && !hasMemberships;
                mobileMembershipToggle.setAttribute('aria-pressed', state.mobileCompact ? 'true' : 'false');
                mobileMembershipToggle.querySelector('span:last-child').textContent =
                    densityToggle.getAttribute(state.mobileCompact ?
                        'data-mobile-detailed-label' : 'data-mobile-compact-label') || '';
                const mobileIcon = mobileMembershipToggle.querySelector('.fa');
                mobileIcon.classList.toggle('fa-compress', !state.mobileCompact);
                mobileIcon.classList.toggle('fa-expand', state.mobileCompact);
            }
        };
        state.updateToggle = updateDensityToggle;

        densityToggle.addEventListener('click', () => {
            const mobile = isResponsiveWorkspace();
            const compact = mobile ? !state.mobileCompact : !root.classList.contains(compactClass);
            const participantList = root.querySelector('[data-easystud-participant-list]');
            const applyDensity = () => {
                state.mobileCompact = compact;
                state.desktopCompact = compact;
                if (!mobile) {
                    root.classList.toggle(compactClass, compact);
                }
                root.classList.remove('local-groupimport-easystud--single-participant-selected');
                root.querySelectorAll('.is-density-expanded').forEach(card => card.classList.remove('is-density-expanded'));
                root.easystudExpandedParticipant = null;
                // A manual density choice owns the whole card disclosure on either viewport.
                setMetaExpandedOverride(getOnDemandModel(root), !compact);
                syncParticipantDensity(root, {animate: false});
                // Density changes the page size (20 compact / 15 full): render that page
                // and resolve its tag rows before Motion.swap measures the final height.
                syncPagination(root);
                syncParticipantTagOverflow(participantList || root);
                scheduleResponsiveUiRefresh(root, {pagination: false});
            };
            if (participantList) {
                return Motion.swap(participantList, applyDensity, {
                    exitDuration: Motion.timing.fast,
                    enterDuration: Motion.timing.normal,
                }).then(() => requestGuideHighlightRefresh(root));
            } else {
                applyDensity();
            }
            return undefined;
        });

        if (mobileMembershipToggle) {
            mobileMembershipToggle.addEventListener('click', () => densityToggle.click());
        }
        syncParticipantDensity(root, {animate: false});
    }

    if (modal && openClipboardButtons.length && closeClipboard) {
        let lastClipboardOpener = openClipboardButtons[0];
        const restoreClipboardFocus = () => {
            const panel = lastClipboardOpener.closest('[data-easyedu-navigation-panel]');
            const trigger = panel && root.querySelector('[data-easyedu-navigation-open]');
            (trigger || lastClipboardOpener).focus();
        };
        bindCardModalKeyboard(modal, () => hideEasyStudModal(modal, restoreClipboardFocus));
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
export const bindPastePreview = root => {
    const box = root.querySelector('[data-easystud-paste-box]');
    const results = root.querySelector('[data-easystud-paste-results]');
    if (!box || !results) {
        return;
    }

    const knownIdentifiers = lazyKnownUserIdentifiers(root);
    const render = () => renderIdentifierPreview(box, results, knownIdentifiers());

    box.addEventListener('input', render);
    box.addEventListener('paste', () => window.setTimeout(render, 0));
};
