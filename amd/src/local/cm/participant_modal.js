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
 * EasyStud course manager: participant details dialog.
 *
 * @module     local_groupimport/local/cm/participant_modal
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Log from 'core/log';
import {fetchDetails} from '../sm/store';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {showEasyStudModal, hideEasyStudModal, bindCardModalKeyboard} from './modal';
import {rehydrateParticipantMembershipDetails, findParticipantCard} from './cards';
import {getSelectedItems} from './selection';
import {bindAnimatedDetails} from './advanced_settings';
import {escapeHtml} from './shared';

export const bindParticipantModal = root => {
    const modal = root.querySelector('[data-easystud-user-modal]');
    const body = root.querySelector('[data-easystud-user-modal-body]');
    const close = root.querySelector('[data-easystud-close-user-modal]');
    const openSelected = root.querySelector('[data-easystud-open-selected-user]');
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    let participantReturnFocus = null;
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

    let detailRequest = 0;

    const renderParticipantDetail = data => {
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
                (data.profileurl ? '<div class="local-groupimport-easystud-settings-modal__native easyedu-entity-dialog__actions">' +
                    '<a class="btn easyedu-button--secondary easyedu-action-with-icon" href="' + escapeHtml(data.profileurl) + '">' +
                        '<span class="fa fa-external-link-alt" aria-hidden="true"></span>' +
                        '<span>' + escapeHtml(labels.nativedetails || '') + '</span>' +
                    '</a>' +
                '</div>' : '') +
            '</div>';
        bindParticipantDetailLists(body);
    };

    /**
     * SM-RENDU: the on-demand card only carries light details. Load the others once
     * (local_groupimport_get_details) and update the open sheet; a closed or re-targeted
     * sheet ignores the answer, and an error keeps the light details.
     *
     * @param {Object} data Light details from the card.
     * @param {Number} request Request token of this opening.
     */
    const completeDeferredDetails = (data, request) => {
        const model = getOnDemandModel(root);
        if (!model || !data.detailsdeferred) {
            return;
        }
        const merge = details => Object.assign({}, data, details, {
            roles: data.roles,
            groups: data.groups,
            groupids: data.groupids,
            groupings: data.groupings,
            groupingids: data.groupingids,
            detailsdeferred: false,
        });
        model.userDetails = model.userDetails || new Map();
        if (model.userDetails.has(data.id)) {
            renderParticipantDetail(merge(model.userDetails.get(data.id)));
            return;
        }
        body.setAttribute('aria-busy', 'true');
        const settle = () => {
            if (request === detailRequest) {
                body.removeAttribute('aria-busy');
            }
        };
        fetchDetails(getOnDemandParticipants().courseId, 'user', [data.id]).then(items => {
            const details = items[0];
            if (details) {
                model.userDetails.set(data.id, details);
                if (request === detailRequest && !modal.hidden) {
                    renderParticipantDetail(merge(details));
                }
            }
            settle();
            return details || null;
        }).catch(error => {
            Log.error(error);
            settle();
        });
    };

    const openForUser = (user, trigger) => {
        rehydrateParticipantMembershipDetails(root);
        const detail = user.getAttribute('data-user-detail');
        if (!detail) {
            return;
        }
        const data = JSON.parse(detail);
        participantReturnFocus = trigger;
        detailRequest++;
        renderParticipantDetail(data);
        showEasyStudModal(modal);
        focusModal();
        completeDeferredDetails(data, detailRequest);
    };

    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-open-user]');
        if (!button || !root.contains(button)) {
            return;
        }
        const user = findParticipantCard(root, button.getAttribute('data-easystud-open-user'));
        if (user) {
            openForUser(user, button);
        }
    });

    if (openSelected) {
        openSelected.addEventListener('click', () => {
            const selected = getSelectedItems(root, 'participant');
            if (selected.length === 1) {
                openForUser(selected[0], openSelected);
            }
        });
    }

    // Restore the actual native trigger after, not during, the existing exit.
    // A cancelled exit must not move focus behind a still-open dialog.
    const closeParticipantModal = () => hideEasyStudModal(modal, () => {
        detailRequest++;
        if (participantReturnFocus && participantReturnFocus.isConnected) {
            participantReturnFocus.focus({preventScroll: true});
        }
        participantReturnFocus = null;
    });
    const focusModal = bindCardModalKeyboard(modal, closeParticipantModal);
    close.addEventListener('click', closeParticipantModal);
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeParticipantModal();
        }
    });
};
