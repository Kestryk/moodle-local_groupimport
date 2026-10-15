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
 * Entity dialog structure (T048, Penpot S6-D5a): identity, read-only information,
 * relations (roles, groups, groupings), sticky footer "Open the Moodle profile" + Close.
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
import {
    entitySection, entityIdentity, entityReadonlyField, entitySkeletonField, entityPills, entityRelationSection,
    entityErrorNotice, entityCount, startEntityLoading, setEntityFooterBusy, bindEntityReveal,
} from './entity_dialog';

export const bindParticipantModal = root => {
    const modal = root.querySelector('[data-easystud-user-modal]');
    const body = root.querySelector('[data-easystud-user-modal-body]');
    const closeButtons = root.querySelectorAll('[data-easystud-close-user-modal]');
    const profileLink = root.querySelector('[data-easystud-user-profile-link]');
    const openSelected = root.querySelector('[data-easystud-open-selected-user]');
    const labels = JSON.parse(root.getAttribute('data-easystud-detail-labels') || '{}');
    let participantReturnFocus = null;
    let stopLoading = null;
    if (!modal || !body || !closeButtons.length) {
        return;
    }
    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog') || modal;
    bindEntityReveal(dialog);

    /**
     * Relation section of the participant (roles have no CSV, as in Penpot).
     *
     * @param {String} title Section title.
     * @param {String[]} values Names.
     * @param {Number[]} ids Matching ids (CSV).
     * @param {String} tone Pill tone.
     * @param {String} countTemplate Counter template.
     * @param {Object|null} csv {label, idLabel, file} or null.
     * @returns {String}
     */
    const renderRelation = (title, values, ids, tone, countTemplate, csv) => {
        const entries = (values || []).filter(Boolean);
        return entityRelationSection({
            title,
            type: tone,
            countText: entityCount(countTemplate, entries.length),
            content: entityPills(entries, tone, {
                lessLabel: labels.showless || '',
                emptyLabel: labels.advancedsettingsnotset || '',
            }),
            rows: entries.map((value, index) => ({name: value, id: String((ids || [])[index] || '')})),
            columns: csv ? [{key: 'name', label: csv.label}, {key: 'id', label: csv.idLabel}] : null,
            exportName: csv ? csv.file : '',
            exportLabel: csv ? (labels.exportcsvtemplate || '').replace('__name__', title) : '',
        });
    };

    const renderParticipantDetail = (data, state = 'ready') => {
        const loading = state === 'loading';
        const safeName = (data.fullname || '').toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') ||
            'participant';
        const groupsCsv = {
            label: labels.advancedsettingsgroupname || '',
            idLabel: labels.advancedsettingsgroupid || '',
            file: 'easystud-' + safeName + '-groups.csv',
        };
        const groupingsCsv = {
            label: labels.advancedsettingsgroupingname || '',
            idLabel: labels.advancedsettingsgroupingid || '',
            file: 'easystud-' + safeName + '-groupings.csv',
        };
        const fields = entityReadonlyField(labels.username || '', data.username) +
            entityReadonlyField(labels.idnumber || '', data.idnumber) +
            (loading ? entitySkeletonField('value') + entitySkeletonField('value') :
                entityReadonlyField(labels.institution || '', data.institution) +
                entityReadonlyField(labels.department || '', data.department) +
                entityReadonlyField(labels.city || '', data.city) +
                entityReadonlyField(labels.country || '', data.country) +
                entityReadonlyField(labels.language || '', data.lang));
        // Description is HTML formatted by Moodle (format_text) on the server.
        const description = loading ? entitySkeletonField('area', true) : (data.description ?
            '<div class="local-groupimport-easystud-entity__field local-groupimport-easystud-entity__field--wide">' +
                '<dt>' + escapeHtml(labels.advancedsettingsdescription || '') + '</dt>' +
                '<dd class="local-groupimport-easystud-entity__description">' + data.description + '</dd>' +
            '</div>' : '');
        const relations = renderRelation(labels.roles || '', data.roles, [], 'role', labels.rolescounttemplate || '', null) +
            renderRelation(labels.groups || '', data.groups, data.groupids, 'group', labels.groupscounttemplate || '',
                groupsCsv) +
            renderRelation(labels.groupings || '', data.groupings, data.groupingids, 'grouping',
                labels.groupingscounttemplate || '', groupingsCsv);
        const notice = state === 'error' ? entityErrorNotice(labels.entityloaderror || '', labels.retry || '') : '';
        // The participant picture is the HTML rendered by Moodle (user_picture).
        const identity = entityIdentity('participant', data.profileimage || '', data.fullname || '', data.email || '');
        body.innerHTML =
            '<div class="local-groupimport-easystud-entity__content">' +
                notice + identity +
                entitySection(labels.entityinformation || '',
                    '<dl class="local-groupimport-easystud-entity__fields">' + fields + description + '</dl>', 'information') +
                entitySection(labels.entityrelations || '', relations, 'relations') +
            '</div>';
        body.querySelectorAll('[data-easystud-settings-list-section]').forEach(details => {
            bindAnimatedDetails(details, details.querySelector(':scope > .local-groupimport-easystud-entity__relation-body'),
                'data-easystud-settings-list-state');
        });
        if (profileLink) {
            profileLink.hidden = !data.profileurl;
            profileLink.setAttribute('href', data.profileurl || '#');
        }
        setEntityFooterBusy(dialog, loading);
    };

    let detailRequest = 0;
    let currentData = null;

    const settleLoading = () => {
        if (stopLoading) {
            stopLoading();
            stopLoading = null;
        }
    };

    /**
     * SM-RENDU: the on-demand card only carries light details. Load the others once
     * (local_groupimport_get_details) and update the open sheet; a closed or re-targeted
     * sheet ignores the answer. While loading, the header and the known fields are shown,
     * the others are field skeletons and the footer action waits; an error keeps the light
     * details with a retry notice.
     *
     * @param {Object} data Light details from the card.
     * @param {Number} request Request token of this opening.
     */
    const completeDeferredDetails = (data, request) => {
        const model = getOnDemandModel(root);
        if (!model || !data.detailsdeferred) {
            renderParticipantDetail(data);
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
        settleLoading();
        renderParticipantDetail(data, 'loading');
        stopLoading = startEntityLoading(body);
        fetchDetails(getOnDemandParticipants().courseId, 'user', [data.id]).then(items => {
            const details = items[0];
            if (details) {
                model.userDetails.set(data.id, details);
            }
            if (request === detailRequest && !modal.hidden) {
                settleLoading();
                renderParticipantDetail(details ? merge(details) : data, details ? 'ready' : 'error');
            }
            return details || null;
        }).catch(error => {
            Log.error(error);
            if (request === detailRequest && !modal.hidden) {
                settleLoading();
                renderParticipantDetail(data, 'error');
            }
        });
    };

    const openForUser = (user, trigger) => {
        rehydrateParticipantMembershipDetails(root);
        const detail = user.getAttribute('data-user-detail');
        if (!detail) {
            return;
        }
        const data = JSON.parse(detail);
        currentData = data;
        participantReturnFocus = trigger;
        detailRequest++;
        completeDeferredDetails(data, detailRequest);
        showEasyStudModal(modal);
        body.scrollTop = 0;
        focusModal();
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

    body.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-entity-retry]') && currentData) {
            detailRequest++;
            completeDeferredDetails(currentData, detailRequest);
        }
    });

    if (profileLink) {
        // A waiting link (details still loading) must not navigate.
        profileLink.addEventListener('click', event => {
            if (profileLink.getAttribute('aria-disabled') === 'true') {
                event.preventDefault();
            }
        });
    }

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
        settleLoading();
        if (participantReturnFocus && participantReturnFocus.isConnected) {
            participantReturnFocus.focus({preventScroll: true});
        }
        participantReturnFocus = null;
    });
    const focusModal = bindCardModalKeyboard(modal, closeParticipantModal);
    closeButtons.forEach(button => button.addEventListener('click', closeParticipantModal));
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            closeParticipantModal();
        }
    });
};
