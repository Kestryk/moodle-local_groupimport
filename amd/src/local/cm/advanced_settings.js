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
 * EasyStud course manager: group and grouping advanced settings dialog.
 *
 * @module     local_groupimport/local/cm/advanced_settings
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {fetchDetails} from '../sm/store';
import {countLabel} from '../sm/index';
import Notification from 'core/notification';
import {requestGuideHighlightRefresh, normalise, getLabels, showNotification} from './shared';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {hideEasyStudModal, bindCardModalKeyboard} from './modal';
import {
    getGroupName, getGroupElementsById, rehydrateParticipantMembershipDetails, updateCatalogGroupingTags,
    scheduleGroupGroupingOverflow, getGroupMemberCount, findParticipantCard,
} from './cards';
import {emitEditorInspectionCompletion} from './guide_hooks';
import {ensureFullGroupMembers} from './group_cards';
import {ensureTreeSection} from './workspace';
import {postFormAction} from './actions';

const clearAdvancedFileDragState = root => {
    root.querySelectorAll('.local-groupimport-easystud-settings-modal__filepicker.is-drag-over')
        .forEach(item => item.classList.remove('is-drag-over'));
    root.querySelectorAll('.local-groupimport-easystud-settings-modal__dialog.is-file-drag-over')
        .forEach(item => item.classList.remove('is-file-drag-over'));
};

const getAdvancedFileDropTarget = event => {
    const modal = event.target.closest('[data-easystud-advanced-settings-modal]');
    const input = modal ? modal.querySelector('[data-easystud-advanced-file-input]') : null;
    const filepicker = input ? input.closest('.local-groupimport-easystud-settings-modal__filepicker') : null;
    const dialog = modal ? modal.querySelector('.local-groupimport-easystud-settings-modal__dialog') : null;
    if (!modal || !input || !filepicker || !dialog) {
        return null;
    }
    return {modal, input, filepicker, dialog};
};

export const bindAdvancedSettings = root => {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-open-advanced-settings]');
        if (!button || !root.contains(button)) {
            return;
        }
        const targetType = button.getAttribute('data-easystud-advanced-target') || 'group';
        const item = button.closest(targetType === 'grouping' ?
            '[data-easystud-grouping-id]' :
            '[data-easystud-group-id]');
        if (!item) {
            return;
        }
        event.preventDefault();
        openAdvancedSettingsModal(root, item, button);
    });

    root.addEventListener('click', event => {
        const trigger = event.target.closest('[data-easystud-advanced-file-trigger]');
        if (!trigger || !root.contains(trigger)) {
            return;
        }
        event.preventDefault();
        const filepicker = trigger.closest('.local-groupimport-easystud-settings-modal__filepicker');
        const input = filepicker ? filepicker.querySelector('[data-easystud-advanced-file-input]') : null;
        if (!input) {
            return;
        }
        input.click();
    });

    root.addEventListener('click', event => {
        const exportButton = event.target.closest('[data-easystud-settings-export]');
        if (!exportButton || !root.contains(exportButton)) {
            return;
        }
        event.preventDefault();
        const section = exportButton.closest('[data-easystud-settings-list-section]');
        if (section) {
            exportAdvancedListSection(section);
        }
    });

    root.addEventListener('submit', event => {
        const form = event.target.closest('[data-easystud-advanced-settings-form]');
        if (!form || !root.contains(form)) {
            return;
        }
        event.preventDefault();
        const submit = form.querySelector('[type="submit"]');
        if (submit) {
            submit.disabled = true;
        }
        postFormAction(new FormData(form)).then(response => {
            if (response.group) {
                applyAdvancedGroupUpdate(root, response.group);
                resetAdvancedDeletePictureCommand(form);
            }
            if (response.grouping) {
                applyAdvancedGroupingUpdate(root, response.grouping);
            }
            const modal = form.closest('[data-easystud-advanced-settings-modal]');
            if (modal) {
                modal.easystudCompleteEditorClose();
            }
            showNotification(root, response.message || '', 'success');
        }).catch(error => {
            showNotification(root, error.message || '', 'error');
        }).finally(() => {
            if (submit) {
                submit.disabled = false;
            }
        });
    });

    root.addEventListener('change', event => {
        const toggle = event.target.closest('[data-easystud-delete-picture-input]');
        if (toggle && root.contains(toggle)) {
            syncAdvancedSettingsToggle(toggle);
            return;
        }
        const input = event.target.closest('[data-easystud-advanced-file-input]');
        if (!input || !root.contains(input)) {
            return;
        }
        updateAdvancedFilePickerName(root, input);
    });

    root.addEventListener('dragover', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            clearAdvancedFileDragState(root);
            return;
        }
        event.preventDefault();
        target.filepicker.classList.add('is-drag-over');
        target.dialog.classList.add('is-file-drag-over');
    });

    root.addEventListener('dragenter', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            return;
        }
        target.filepicker.classList.add('is-drag-over');
        target.dialog.classList.add('is-file-drag-over');
    });

    root.addEventListener('dragleave', event => {
        const target = getAdvancedFileDropTarget(event);
        if (target && !target.modal.contains(event.relatedTarget)) {
            target.filepicker.classList.remove('is-drag-over');
            target.dialog.classList.remove('is-file-drag-over');
        }
    });

    root.addEventListener('drop', event => {
        const target = getAdvancedFileDropTarget(event);
        if (!target || !root.contains(target.modal)) {
            return;
        }
        event.preventDefault();
        target.filepicker.classList.remove('is-drag-over');
        target.dialog.classList.remove('is-file-drag-over');
        const input = target.input;
        const files = event.dataTransfer ? event.dataTransfer.files : null;
        if (!input || !files || !files.length) {
            return;
        }
        const imagefile = Array.from(files).find(file => file.type && file.type.indexOf('image/') === 0);
        if (!imagefile) {
            return;
        }
        try {
            if (window.DataTransfer) {
                const transfer = new DataTransfer();
                transfer.items.add(imagefile);
                input.files = transfer.files;
            } else {
                input.files = files;
            }
        } catch (error) {
            return;
        }
        updateAdvancedFilePickerName(root, input);
    });
};

const updateAdvancedFilePickerName = (root, input) => {
    const filepicker = input.closest('.local-groupimport-easystud-settings-modal__filepicker');
    const name = filepicker ? filepicker.querySelector('[data-easystud-advanced-file-name]') : null;
    if (!name) {
        return;
    }
    const labels = getLabels(root);
    name.textContent = input.files && input.files.length ?
        input.files[0].name :
        (labels.advancedsettingsnofile || '');
};

const downloadTextFile = (filename, content, mimetype = 'text/csv;charset=utf-8') => {
    const blob = new Blob([content], {type: mimetype});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 250);
};

const getCsvValue = value => '"' + (value || '').toString().replace(/"/g, '""') + '"';

const exportAdvancedListSection = section => {
    const filename = section.getAttribute('data-easystud-settings-export-name') || 'easystud-export.csv';
    const headers = Array.from(section.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
    const rows = Array.from(section.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    });
    const csv = '\ufeff' + [headers].concat(rows).map(row => row.map(getCsvValue).join(';')).join('\r\n');
    downloadTextFile(filename, csv);
};

export const escapeHtml = value => {
    const element = document.createElement('span');
    element.textContent = value || '';
    return element.innerHTML;
};

const getAdvancedValue = (item, key) => item ? (item.getAttribute('data-easystud-advanced-' + key) || '') : '';

const getUserById = (root, userid) => {
    return userid ? findParticipantCard(root, userid) : null;
};

const getAdvancedGroupMemberRows = (root, item) => {
    const seen = new Set();
    return Array.from(item.querySelectorAll(':scope > [data-easystud-group-members] [data-easystud-member-id]')).map(member => {
        const userid = member.getAttribute('data-easystud-member-id') || '';
        if (!userid || seen.has(userid)) {
            return null;
        }
        seen.add(userid);
        const user = getUserById(root, userid);
        return {
            name: (member.querySelector('.local-groupimport-easystud-member__name') || {}).textContent || '',
            email: user ? (user.getAttribute('data-user-email') || '') : '',
            id: userid,
        };
    }).filter(Boolean);
};

const getAdvancedGroupGroupingRows = (root, item) => {
    const ids = (item.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
    return ids.map(groupingid => {
        const grouping = root.querySelector('[data-easystud-grouping-id="' + groupingid + '"]');
        return {
            name: grouping ? getAdvancedValue(grouping, 'name') : '',
            id: groupingid,
        };
    }).filter(row => row.name || row.id);
};

const getAdvancedGroupingGroupRows = (item) => {
    return Array.from(item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]')).map(group => {
        return {
            name: getAdvancedValue(group, 'name') || getGroupName(group),
            members: getAdvancedCountLabel(null, group, true),
            id: group.getAttribute('data-easystud-group-id') || '',
        };
    });
};

const renderFieldHelp = help => {
    if (!help) {
        return '';
    }
    // The EasyStud hook owns accessible naming and popover binding; the
    // canonical UI Kit mixin owns all visual states.
    return '<button type="button" class="btn p-0 icon-no-margin ' +
        'local-groupimport-easystud-settings-modal__help" ' +
        'aria-label="' + escapeHtml(help) + '" data-easystud-hover-help="' + escapeHtml(help) + '">?</button>';
};

/**
 * Synchronise the visible state label of the canonical Kit checkbox toggle.
 *
 * The browser owns checkbox semantics while the shared toggle-check and
 * slideshow-toggle-row mixins own every visual and Motion state.
 *
 * @param {HTMLInputElement} input Checkbox submitted with the form.
 */
const syncAdvancedSettingsToggle = input => {
    const control = input.closest('.local-groupimport-easystud-settings-modal__image-toggle');
    const label = control ? control.querySelector('[data-easystud-settings-toggle-state]') : null;
    if (label) {
        label.textContent = input.checked ?
            (input.getAttribute('data-label-on') || '') :
            (input.getAttribute('data-label-off') || '');
    }
};

/**
 * Reset the destructive Delete picture command after a successful Save.
 *
 * The control represents one pending action for the current form submission;
 * it is not a stored on/off preference.
 *
 * @param {HTMLFormElement} form Advanced Group settings form.
 */
const resetAdvancedDeletePictureCommand = form => {
    const input = form.querySelector('[data-easystud-delete-picture-input]');
    if (!input) {
        return;
    }
    input.checked = false;
    syncAdvancedSettingsToggle(input);
};

const getAdvancedCountLabel = (root, item, isgroup) => {
    const labels = root ? getLabels(root) : {};
    const raw = getAdvancedValue(item, 'count');
    if (raw && raw.indexOf('__count__') === -1) {
        return raw;
    }

    const count = isgroup ? getGroupMemberCount(item) :
        item.querySelectorAll(':scope > .local-groupimport-easystud-tree__children > [data-easystud-group-id]').length;
    const template = isgroup ?
        (labels.memberscounttemplate || '') :
        (labels.groupscounttemplate || '');
    if (template.indexOf('__count__') === -1) {
        return template;
    }
    return countLabel(template, count);
};

const renderAdvancedInput = (label, name, value, type = 'text', help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field">' +
        '<span>' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<input type="' + type + '" class="form-control form-control-sm" name="' + escapeHtml(name) + '" value="' +
            escapeHtml(value || '') + '">' +
    '</label>';
};

const renderAdvancedTextarea = (label, name, value, help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field local-groupimport-easystud-settings-modal__field--wide">' +
        '<span>' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<textarea class="form-control form-control-sm" name="' + escapeHtml(name) + '" rows="2">' +
            escapeHtml(value || '') +
        '</textarea>' +
    '</label>';
};

/**
 * Bind one native details element to the shared EasyEdu disclosure Motion.
 *
 * Native details remains the no-script and reduced-motion path. The explicit
 * state attribute keeps the visual chevron in sync while Motion temporarily
 * leaves a closing details element open to animate its content.
 *
 * @param {HTMLElement} details The details element.
 * @param {HTMLElement} content The direct disclosure content.
 * @param {String} stateAttribute Attribute used by the component CSS.
 */
export const bindAnimatedDetails = (details, content, stateAttribute) => {
    const summary = details ? details.querySelector(':scope > summary') : null;
    if (!details || !summary || !content || details.dataset.easystudMotionBound === '1') {
        return;
    }
    details.dataset.easystudMotionBound = '1';

    const syncState = open => {
        details.setAttribute(stateAttribute, open ? 'open' : 'closed');
        summary.setAttribute('aria-expanded', open ? 'true' : 'false');
    };
    syncState(details.open);
    details.addEventListener('toggle', () => {
        if (!Motion.isEnabled(details)) {
            syncState(details.open);
        }
    });
    summary.addEventListener('click', event => {
        if (event.target.closest('[data-easystud-settings-export]') || !Motion.isEnabled(details)) {
            return;
        }
        event.preventDefault();
        const shouldOpen = details.getAttribute(stateAttribute) === 'closed';
        syncState(shouldOpen);
        if (!shouldOpen) {
            Motion.collapse(content, {
                duration: Motion.timing.slow,
                onComplete: () => {
                    details.open = false;
                },
            });
            return;
        }
        details.open = true;
        content.hidden = true;
        Motion.expand(content, {duration: Motion.timing.slow});
    });
};

const renderAdvancedListSection = (title, rows, columns, exportname, emptylabel, type) => {
    const count = rows.length;
    const open = count <= 6 ? ' open' : '';
    const sectiontype = type ? ' local-groupimport-easystud-settings-modal__list-section--' + type : '';
    const visiblelist = rows.map(row => {
        const primary = row[columns[0].key] || '';
        const meta = columns.slice(1).map(column => {
            const value = row[column.key] || '';
            if (!value) {
                return '';
            }
            return '<span class="local-groupimport-easystud-settings-modal__list-item-chip">' +
                    '<span>' + escapeHtml(column.label) + '</span>' +
                    '<span>' + escapeHtml(value) + '</span>' +
                '</span>';
        }).filter(Boolean).join('');
        return '<li>' +
                '<span class="local-groupimport-easystud-settings-modal__list-item-primary">' +
                    escapeHtml(primary) +
                '</span>' +
                (meta ? '<span class="local-groupimport-easystud-settings-modal__list-item-meta">' + meta + '</span>' : '') +
            '</li>';
    }).join('');
    const exporttable =
        '<table hidden>' +
            '<thead><tr>' + columns.map(column => '<th>' + escapeHtml(column.label) + '</th>').join('') + '</tr></thead>' +
            '<tbody>' + rows.map(row => '<tr>' + columns.map(column => {
                return '<td>' + escapeHtml(row[column.key] || '') + '</td>';
            }).join('') + '</tr>').join('') + '</tbody>' +
        '</table>';

    return '<details class="local-groupimport-easystud-settings-modal__list-section' + sectiontype + '" ' +
            'data-easystud-settings-list-section="1"' +
            ' data-easystud-settings-export-name="' + escapeHtml(exportname) + '"' + open + '>' +
        '<summary>' +
            '<span class="local-groupimport-easystud-settings-modal__disclosure-chevron fa fa-chevron-down" ' +
                'aria-hidden="true"></span>' +
            '<span class="local-groupimport-easystud-settings-modal__list-title">' + escapeHtml(title) + '</span>' +
            '<strong><span>' + count + '</span><span class="local-groupimport-easystud-settings-modal__list-count-label">' +
                escapeHtml(title) + '</span></strong>' +
            '<button type="button" class="btn btn-sm btn-outline-secondary" data-easystud-settings-export="1" ' +
                (count ? '' : 'disabled') + '>' +
                '<span class="fa fa-file-export me-1" aria-hidden="true"></span>' +
                '<span>CSV</span>' +
            '</button>' +
        '</summary>' +
        (count ?
            '<div class="local-groupimport-easystud-settings-modal__list-scroll">' +
                '<ul>' + visiblelist + '</ul>' +
                exporttable +
            '</div>' :
            '<div class="local-groupimport-easystud-settings-modal__list-empty">' + escapeHtml(emptylabel || '') + '</div>') +
    '</details>';
};

export const openAdvancedSettingsModal = (root, item, returnFocus = null) => {
    const model = getOnDemandModel(root);
    if (!model || !item) {
        openAdvancedSettingsModalNow(root, item, returnFocus);
        return;
    }
    if (item.hasAttribute('data-easystud-grouping-id')) {
        ensureTreeSection(root, item);
        openAdvancedSettingsModalNow(root, item, returnFocus);
        return;
    }
    // The settings list every member of the group.
    ensureFullGroupMembers(item);
    const groupid = Number(item.getAttribute('data-easystud-group-id'));
    model.groupDetails = model.groupDetails || new Map();
    const apply = details => {
        item.setAttribute('data-easystud-advanced-description', details.description || '');
        item.setAttribute('data-easystud-advanced-raw-description', details.rawdescription || '');
        item.setAttribute('data-easystud-advanced-idnumber', details.idnumber || '');
        item.setAttribute('data-easystud-advanced-picture', details.pictureurl || '');
        item.setAttribute('data-easystud-advanced-enrolment-key', details.enrolmentkey ? '1' : '0');
        item.setAttribute('data-easystud-advanced-hide-picture', details.hidepicture ? '1' : '0');
    };
    if (!groupid || model.groupDetails.has(groupid)) {
        if (groupid) {
            apply(model.groupDetails.get(groupid));
        }
        openAdvancedSettingsModalNow(root, item, returnFocus);
        return;
    }
    // On demand, cards do not carry the descriptions: load them once (local_groupimport_get_details).
    item.setAttribute('aria-busy', 'true');
    fetchDetails(getOnDemandParticipants().courseId, 'group', [groupid]).then(items => {
        if (items[0]) {
            model.groupDetails.set(groupid, items[0]);
            apply(items[0]);
        }
        item.removeAttribute('aria-busy');
        openAdvancedSettingsModalNow(root, item, returnFocus);
        return items;
    }).catch(error => {
        item.removeAttribute('aria-busy');
        Notification.exception(error);
    });
};

const openAdvancedSettingsModalNow = (root, item, returnFocus = null) => {
    const labels = getLabels(root);
    const type = getAdvancedValue(item, 'type');
    const isgroup = type === 'group';
    const title = getAdvancedValue(item, 'name') || (labels.advancedsettings || '');
    const notset = labels.advancedsettingsnotset || '';
    const nativeurl = getAdvancedValue(item, 'native-url');
    const picture = getAdvancedValue(item, 'picture');
    const count = getAdvancedCountLabel(root, item, isgroup);
    const typeLabel = isgroup ? (labels.groupdetails || '') :
        (labels.groupingdetails || '');
    const pluginLabel = labels.pluginname || '';
    const icon = isgroup ? 'fa-users' : 'fa-layer-group';
    const memberRows = isgroup ? getAdvancedGroupMemberRows(root, item) : [];
    const groupGroupingRows = isgroup ? getAdvancedGroupGroupingRows(root, item) : [];
    const groupingGroupRows = isgroup ? [] : getAdvancedGroupingGroupRows(item);
    const listTitle = isgroup ? (labels.advancedsettingsmembers || '') : (labels.advancedsettingsgroups || '');
    const relatedTitle = labels.groupings || '';
    const safeTitle = title.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'easystud';
    const imageInputId = 'local-groupimport-easystud-group-image-' +
        escapeHtml(item.getAttribute('data-easystud-group-id') || 'current');

    let modal = root.querySelector('[data-easystud-advanced-settings-modal]');
    if (modal) {
        modal.remove();
    }
    modal = document.createElement('div');
    modal.className = 'local-groupimport-easystud-modal local-groupimport-easystud-settings-modal easyedu-modal-layer';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('data-easystud-advanced-settings-modal', '1');
    modal.setAttribute('data-easystud-editor-context', type);
    modal.innerHTML =
        '<div class="local-groupimport-easystud-modal__dialog local-groupimport-easystud-settings-modal__dialog easyedu-entity-dialog ' +
                (isgroup ? 'local-groupimport-easystud-settings-modal__dialog--group' :
                    'local-groupimport-easystud-settings-modal__dialog--grouping') + '">' +
            '<div class="local-groupimport-easystud-modal__header local-groupimport-easystud-settings-modal__header easyedu-entity-dialog__header easyedu-dialog-header-palette--success">' +
                '<div class="local-groupimport-easystud-settings-modal__heading easyedu-entity-dialog__heading">' +
                    '<span class="local-groupimport-easystud-settings-modal__icon easyedu-entity-dialog__icon fa ' +
                        icon + '" aria-hidden="true"></span>' +
                    '<div>' +
                        '<span class="local-groupimport-easystud-settings-modal__eyebrow easyedu-entity-dialog__eyebrow">' +
                            escapeHtml(pluginLabel) +
                        '</span>' +
                        '<h3 class="easyedu-modal-title">' + escapeHtml(typeLabel) + '</h3>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="local-groupimport-easystud-modal__close" ' +
                    'data-easystud-close-advanced-settings="1" aria-label="' +
                    escapeHtml(labels.close || '') + '">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<div class="local-groupimport-easystud-modal__body easyedu-entity-dialog__body">' +
                '<form class="local-groupimport-easystud-settings-modal__form" data-easystud-advanced-settings-form="1">' +
                    '<input type="hidden" name="courseid" value="' + escapeHtml(root.getAttribute('data-easystud-course-id') || '') + '">' +
                    '<input type="hidden" name="action" value="' +
                        (isgroup ? 'updategroupadvanced' : 'updategroupingadvanced') + '">' +
                    '<input type="hidden" name="' + (isgroup ? 'groupid' : 'groupingid') + '" value="' +
                        escapeHtml(isgroup ? (item.getAttribute('data-easystud-group-id') || '') :
                            (item.getAttribute('data-easystud-grouping-id') || '')) + '">' +
                    '<div class="local-groupimport-easystud-settings-modal__summary-grid ' +
                            (isgroup ? 'local-groupimport-easystud-settings-modal__summary-grid--group' : '') + '">' +
                        (isgroup ?
                            '<div class="local-groupimport-easystud-settings-modal__image">' +
                                (picture ?
                                    '<img src="' + escapeHtml(picture) + '" alt="">' :
                                    '<div class="local-groupimport-easystud-settings-modal__image-placeholder">' +
                                        '<span class="fa fa-image" aria-hidden="true"></span>' +
                                        '<span>' + escapeHtml(labels.advancedsettingsnoimage || '') + '</span>' +
                                    '</div>') +
                            '</div>' : '') +
                        '<div class="local-groupimport-easystud-settings-modal__grid">' +
                            renderAdvancedInput(labels.advancedsettingsname || '', 'name', getAdvancedValue(item, 'name')) +
                            renderAdvancedInput(labels.advancedsettingsidnumber || '', 'idnumber',
                                getAdvancedValue(item, 'idnumber')) +
                            '<div class="local-groupimport-easystud-settings-modal__field ' +
                                    'local-groupimport-easystud-settings-modal__field--readonly ' +
                                    'local-groupimport-easystud-settings-modal__field--entity-count">' +
                                '<span class="local-groupimport-easystud-settings-modal__field-label">' +
                                escapeHtml(isgroup ? (labels.advancedsettingsmembers || '') :
                                (labels.advancedsettingsgroups || '')) + '</span>' +
                                '<strong>' + escapeHtml(count || notset) + '</strong>' +
                            '</div>' +
                            (isgroup ?
                                renderAdvancedInput(labels.advancedsettingsenrolmentkey || '',
                                    'enrolmentkey', '', 'password', labels.advancedsettingsenrolmentkeyhelp || '') :
                                '<div class="local-groupimport-easystud-settings-modal__field local-groupimport-easystud-settings-modal__field--readonly">' +
                                    '<span>' + escapeHtml(labels.advancedsettingsconfigdata || '') + '</span>' +
                                    '<strong class="' + (!getAdvancedValue(item, 'config') ? 'is-empty' : '') + '">' +
                                        escapeHtml(getAdvancedValue(item, 'config') || notset) +
                                    '</strong>' +
                                '</div>') +
                        '</div>' +
                    '</div>' +
                    renderAdvancedTextarea(labels.advancedsettingsdescription || '', 'description',
                        getAdvancedValue(item, 'raw-description')) +
                    '<div class="local-groupimport-easystud-settings-modal__lists">' +
                        (isgroup ?
                            renderAdvancedListSection(listTitle, memberRows, [
                                {key: 'name', label: labels.advancedsettingsmembername || ''},
                                {key: 'email', label: labels.advancedsettingsmemberemail || ''},
                                {key: 'id', label: labels.advancedsettingsmemberid || ''},
                            ], 'easystud-' + safeTitle + '-members.csv', labels.advancedsettingsnomembers || '', 'members') +
                            renderAdvancedListSection(relatedTitle, groupGroupingRows, [
                                {key: 'name', label: labels.advancedsettingsgroupingname || ''},
                                {key: 'id', label: labels.advancedsettingsgroupingid || ''},
                            ], 'easystud-' + safeTitle + '-groupings.csv', labels.advancedsettingsnogroupings || '', 'groupings') :
                            renderAdvancedListSection(listTitle, groupingGroupRows, [
                                {key: 'name', label: labels.advancedsettingsgroupname || ''},
                                {key: 'members', label: labels.advancedsettingsmembers || ''},
                                {key: 'id', label: labels.advancedsettingsgroupid || ''},
                            ], 'easystud-' + safeTitle + '-groups.csv', labels.advancedsettingsnogroups || '', 'groups')) +
                    '</div>' +
                    (isgroup ?
                        '<div class="local-groupimport-easystud-settings-modal__file-row">' +
                            '<div class="local-groupimport-easystud-settings-modal__filemanager">' +
                                '<div class="local-groupimport-easystud-settings-modal__filemanager-title">' +
                                    '<span class="fa fa-file-image" aria-hidden="true"></span>' +
                                    '<span>' + escapeHtml(labels.advancedsettingsimage || '') +
                                        renderFieldHelp(labels.advancedsettingsimagehelp || '') + '</span>' +
                                '</div>' +
                                '<div class="local-groupimport-easystud-settings-modal__filepicker">' +
                                    '<input type="file" id="' + imageInputId + '" name="imagefile" accept="image/*" ' +
                                        'data-easystud-advanced-file-input="1">' +
                                    '<span class="local-groupimport-easystud-settings-modal__filepicker-icon fa fa-cloud-upload-alt" aria-hidden="true"></span>' +
                                    '<button type="button" class="btn btn-secondary btn-sm" ' +
                                        'data-easystud-advanced-file-trigger="1" aria-controls="' + imageInputId + '">' +
                                        escapeHtml(labels.advancedsettingschoosefile || '') +
                                    '</button>' +
                                    '<span class="local-groupimport-easystud-settings-modal__filename" data-easystud-advanced-file-name>' +
                                        escapeHtml(labels.advancedsettingsnofile || '') +
                                    '</span>' +
                                '</div>' +
                            '</div>' +
                            '<label class="local-groupimport-easystud-settings-modal__image-toggle">' +
                                '<input type="checkbox" name="deletepicture" value="1" ' +
                                    'data-easystud-delete-picture-input="1" ' +
                                    'id="local-groupimport-easystud-deletepicture-toggle" ' +
                                        'data-label-on="' + escapeHtml(labels.enabled || '') + '" ' +
                                        'data-label-off="' + escapeHtml(labels.disabled || '') + '" ' +
                                        'aria-label="' + escapeHtml(labels.deletepicture || '') + '">' +
                                '<span>' +
                                    '<strong class="local-groupimport-easystud-settings-modal__image-toggle-label">' +
                                        escapeHtml(labels.deletepicture || '') +
                                    '</strong>' +
                                    '<small data-easystud-settings-toggle-state="1">' +
                                        escapeHtml(labels.disabled || '') +
                                    '</small>' +
                                '</span>' +
                            '</label>' +
                        '</div>' : '') +
                    '<div class="local-groupimport-easystud-modal__footer easyedu-entity-dialog__actions">' +
                        '<button type="submit" class="btn easyedu-button easyedu-action-with-icon">' +
                            '<span class="fa fa-save" aria-hidden="true"></span>' +
                            '<span>' + escapeHtml(labels.save || '') + '</span>' +
                        '</button>' +
                        '<button type="button" class="btn easyedu-button--secondary" data-easystud-close-advanced-settings="1">' +
                            escapeHtml(labels.cancel || '') +
                        '</button>' +
                        (nativeurl ?
                            '<a class="btn easyedu-button--secondary easyedu-action-with-icon" href="' + escapeHtml(nativeurl) + '">' +
                                '<span class="fa fa-external-link-alt" aria-hidden="true"></span>' +
                                '<span>' + escapeHtml(labels.advancedsettingsnative || '') + '</span>' +
                            '</a>' : '') +
                    '</div>' +
                '</form>' +
            '</div>' +
        '</div>';

    const closeModal = (completeInspection = true) => hideEasyStudModal(modal, () => {
        modal.remove();
        if (returnFocus?.isConnected && returnFocus.getClientRects().length) {
            returnFocus.focus({preventScroll: true});
        }
        if (completeInspection) {
            emitEditorInspectionCompletion(root, type, 'cancel-editor');
        }
    });
    // Guide review awaits the same native exit, without claiming user Cancel.
    modal.easystudCloseEditor = () => closeModal(false);
    // Successful native Save closes through the same exit/focus/completion
    // callback as Cancel or Escape. Guide review still opts out explicitly.
    modal.easystudCompleteEditorClose = () => closeModal();
    modal.addEventListener('focusin', event => {
        if (event.target.matches('input[name="name"]')) {
            emitEditorInspectionCompletion(root, type, 'inspect-name');
        } else if (event.target.matches('textarea[name="description"]')) {
            emitEditorInspectionCompletion(root, type, 'inspect-description');
        }
    });
    modal.addEventListener('click', event => {
        if (event.target === modal || event.target.closest('[data-easystud-close-advanced-settings]')) {
            closeModal();
        }
    });
    root.appendChild(modal);
    const focusModal = bindCardModalKeyboard(modal, closeModal);
    focusModal();
    emitEditorInspectionCompletion(root, type, 'open-editor');
    modal.querySelectorAll('[data-easystud-settings-list-section]').forEach(details => {
        const content = details.querySelector(':scope > .local-groupimport-easystud-settings-modal__list-scroll, ' +
            ':scope > .local-groupimport-easystud-settings-modal__list-empty');
        bindAnimatedDetails(details, content, 'data-easystud-settings-list-state');
    });
};

const applyAdvancedGroupUpdate = (root, data) => {
    if (!data || !data.id) {
        return;
    }
    getGroupElementsById(root, data.id).forEach(group => {
        const name = group.querySelector('.local-groupimport-easystud-group__name');
        if (name) {
            name.textContent = data.name || '';
        }
        group.setAttribute('data-easystud-advanced-name', data.name || '');
        group.setAttribute('data-easystud-advanced-description', data.description || '');
        group.setAttribute('data-easystud-advanced-raw-description', data.rawdescription || '');
        group.setAttribute('data-easystud-advanced-idnumber', data.idnumber || '');
        group.setAttribute('data-easystud-advanced-native-url', data.nativeurl || '');
        group.setAttribute('data-easystud-advanced-picture', data.picture || '');
        group.setAttribute('data-easystud-advanced-enrolment-key', data.enrolmentkey ? '1' : '0');
        const input = group.querySelector('input[name="name"]');
        if (input) {
            input.value = data.rawname || data.name || '';
        }
    });
    rehydrateParticipantMembershipDetails(root);
    scheduleGroupGroupingOverflow(root);
    requestGuideHighlightRefresh(root);
};

const applyAdvancedGroupingUpdate = (root, data) => {
    if (!data || !data.id) {
        return;
    }
    const grouping = root.querySelector('[data-easystud-grouping-id="' + data.id + '"]');
    if (grouping) {
        const name = grouping.querySelector('.local-groupimport-easystud-grouping__name');
        if (name) {
            name.textContent = data.name || '';
        }
        grouping.setAttribute('data-easystud-advanced-name', data.name || '');
        grouping.setAttribute('data-easystud-advanced-description', data.description || '');
        grouping.setAttribute('data-easystud-advanced-raw-description', data.rawdescription || '');
        grouping.setAttribute('data-easystud-advanced-idnumber', data.idnumber || '');
        grouping.setAttribute('data-easystud-advanced-native-url', data.nativeurl || '');
        grouping.setAttribute('data-easystud-advanced-config', data.configdata || '');
        grouping.setAttribute('data-search-text', normalise(data.name || ''));
        const input = grouping.querySelector('input[name="name"]');
        if (input) {
            input.value = data.rawname || data.name || '';
        }
    }
    root.querySelectorAll('[data-easystud-group-id][data-grouping-ids]').forEach(group => {
        const ids = (group.getAttribute('data-grouping-ids') || '').split(',').filter(Boolean);
        if (ids.indexOf(String(data.id)) !== -1) {
            updateCatalogGroupingTags(root, group.getAttribute('data-easystud-group-id'));
        }
    });
    rehydrateParticipantMembershipDetails(root);
    scheduleGroupGroupingOverflow(root);
    requestGuideHighlightRefresh(root);
};
