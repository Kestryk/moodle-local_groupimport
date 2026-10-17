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
 * EasyStud course manager: group and grouping details dialog (entity dialog, T048).
 *
 * @module     local_groupimport/local/cm/advanced_settings
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import Log from 'core/log';
import {fetchDetails} from '../sm/store';
import {countLabel} from '../sm/index';
import {requestGuideHighlightRefresh, normalise, getLabels, showNotification, escapeHtml} from './shared';
import {getOnDemandModel, getOnDemandParticipants} from './state';
import {getSelectedItems, setItemSelected, clearSelectionState, getActiveSelectionType} from './selection';
import {areSelectionTypesCompatible} from './shared';
import {getSelectedMemberRow} from '../sm/groups';
import {hideEasyStudModal, bindCardModalKeyboard} from './modal';
import {
    entitySection, entityIdentity, entityIcon, entitySkeletonField, entitySkeletonRelation, entityPills,
    entityMemberRows, entityRelationSection, entityErrorNotice, entityCount, startEntityLoading,
    setEntityFooterBusy, bindEntityReveal,
} from './entity_dialog';
import {
    getGroupName, getGroupElementsById, rehydrateParticipantMembershipDetails, updateCatalogGroupingTags,
    scheduleGroupGroupingOverflow, getGroupMemberCount, findParticipantCard,
} from './cards';
import {emitEditorInspectionCompletion} from './guide_hooks';
import {ensureFullGroupMembers} from './group_cards';
import {ensureTreeSection} from './workspace';
import {postFormAction, removeMembers, handleActionError} from './actions';
import {updateSelectionActions} from './workspace';

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

/**
 * One CSV cell: RFC 4180 quoting, neutralised against spreadsheet formula injection.
 *
 * Member and group names are user input. A cell starting with = + - @, a tab or a carriage
 * return (or the full-width = + - @) would run as a formula in a spreadsheet: a leading
 * single quote keeps it as text (OWASP CSV injection).
 *
 * @param {*} value Cell value.
 * @returns {String}
 */
const getCsvValue = value => {
    const text = (value === undefined || value === null ? '' : value).toString();
    const safe = /^[=+\-@\t\r\uff1d\uff0b\uff0d\uff20]/.test(text) ? "'" + text : text;
    return '"' + safe.replace(/"/g, '""') + '"';
};

const exportAdvancedListSection = section => {
    const filename = section.getAttribute('data-easystud-settings-export-name') || 'easystud-export.csv';
    const headers = Array.from(section.querySelectorAll('thead th')).map(cell => cell.textContent.trim());
    const rows = Array.from(section.querySelectorAll('tbody tr')).map(row => {
        return Array.from(row.querySelectorAll('td')).map(cell => cell.textContent.trim());
    });
    const csv = '\ufeff' + [headers].concat(rows).map(row => row.map(getCsvValue).join(';')).join('\r\n');
    downloadTextFile(filename, csv);
};

const getAdvancedValue = (item, key) => item ? (item.getAttribute('data-easystud-advanced-' + key) || '') : '';

const getUserById = (root, userid) => {
    return userid ? findParticipantCard(root, userid) : null;
};

const getAdvancedGroupMemberRows = (root, item) => {
    const model = getOnDemandModel(root);
    const group = model ? model.groups.get(Number(item.getAttribute('data-easystud-group-id'))) : null;
    if (group) {
        return (group.memberids || []).filter(id => model.byId.has(id)).map(id => {
            const user = model.byId.get(id);
            return {id, name: user.fullname, email: user.email || ''};
        });
    }
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

const getDialogSelectedMemberIds = (root, item) => {
    const groupid = item.getAttribute('data-easystud-group-id');
    return getSelectedItems(root, 'member').filter(Boolean).filter(member => {
        const card = member.closest('[data-easystud-group-id]');
        return card && card.getAttribute('data-easystud-group-id') === groupid;
    }).map(member => String(member.getAttribute('data-easystud-member-id')));
};

/**
 * Members relation section of a group dialog: Kit member rows with selection and "-" (K16-15).
 *
 * @param {HTMLElement} root Workspace root.
 * @param {HTMLElement} item Group card.
 * @param {Object[]} memberRows {id, name, email}.
 * @param {String|null} countText Counter text when the card attribute is stale.
 * @returns {String}
 */
const renderMemberSection = (root, item, memberRows, countText = null) => {
    const labels = getLabels(root);
    const name = getAdvancedValue(item, 'name');
    const safeTitle = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'easystud';
    return entityRelationSection({
        title: labels.advancedsettingsmembers || '',
        type: 'members',
        countText: countText !== null ? countText : getAdvancedCountLabel(root, item, true),
        content: entityMemberRows(memberRows, {
            moreTemplate: labels.entityothermemberstemplate || '',
            lessLabel: labels.showless || '',
            emptyLabel: labels.advancedsettingsnomembers || '',
            removable: true,
            selected: getDialogSelectedMemberIds(root, item),
            selectLabel: labels.entityselectmember || '',
            removeLabel: labels.removeuser || '',
            selectedTemplate: labels.entitymembersselected || '',
            moveLabel: labels.movemembers || '',
            bulkRemoveLabel: labels.deletemembersselection || '',
        }),
        rows: memberRows,
        columns: [
            {key: 'name', label: labels.advancedsettingsmembername || ''},
            {key: 'email', label: labels.advancedsettingsmemberemail || ''},
            {key: 'id', label: labels.advancedsettingsmemberid || ''},
        ],
        exportName: 'easystud-' + safeTitle + '-members.csv',
        exportLabel: (labels.exportcsvtemplate || '').replace('__name__', labels.advancedsettingsmembers || ''),
    });
};

/**
 * Action item of a member of the dialog group: the card row when it exists, else the detached
 * row the on-demand model renders for selections (the item the workspace selection uses).
 *
 * @param {HTMLElement} root Workspace root.
 * @param {HTMLElement} item Group card.
 * @param {String} userid User id.
 * @returns {HTMLElement|null}
 */
const getDialogMemberItem = (root, item, userid) => {
    const row = item.querySelector('[data-easystud-member-id="' + userid + '"]');
    if (row) {
        return row;
    }
    const model = getOnDemandModel(root);
    return model ? getSelectedMemberRow(model, item.getAttribute('data-easystud-group-id'), userid,
        item.getAttribute('data-easystud-sm-catalog') || 'structure') : null;
};

// Member sections are replaced after a native write; the close control remains attached.
const focusDialogMemberFallback = modal => {
    if (modal.isConnected && !modal.hidden && !modal.classList.contains('is-closing')) {
        modal.querySelector('[data-easystud-close-advanced-settings]')?.focus({preventScroll: true});
    }
};

const refreshDialogMembers = (root, item, modal) => {
    const current = modal.querySelector('.local-groupimport-easystud-entity__relation--members');
    if (!current) {
        return;
    }
    const wasOpen = current.open;
    const restoreFocus = current.contains(document.activeElement);
    const holder = document.createElement('div');
    const rows = getAdvancedGroupMemberRows(root, item);
    const template = getLabels(root).memberscounttemplate || '';
    const countText = template.indexOf('__count__') === -1 ? null : countLabel(template, rows.length);
    holder.innerHTML = renderMemberSection(root, item, rows, countText);
    const next = holder.firstElementChild;
    next.open = wasOpen;
    current.replaceWith(next);
    bindAnimatedDetails(next, next.querySelector(':scope > .local-groupimport-easystud-entity__relation-body'),
        'data-easystud-settings-list-state');
    if (restoreFocus) {
        focusDialogMemberFallback(modal);
    }
    const context = modal.querySelector('.local-groupimport-easystud-entity__context');
    if (context && countText) {
        context.textContent = [countText, context.textContent.split(' · ')[1] || ''].filter(Boolean).join(' · ');
    }
};

const syncDialogBulk = (root, item, modal) => {
    const selected = getDialogSelectedMemberIds(root, item);
    modal.querySelectorAll('[data-easystud-entity-select]').forEach(input => {
        const on = selected.indexOf(input.getAttribute('data-easystud-entity-select')) !== -1;
        input.checked = on;
        input.closest('.easyedu-related-person-row').classList.toggle('is-selected', on);
    });
    const bulk = modal.querySelector('[data-easystud-entity-bulk]');
    if (bulk) {
        bulk.hidden = !selected.length;
        bulk.querySelector('[data-easystud-entity-bulk-count]').textContent =
            (getLabels(root).entitymembersselected || '').replace('{}', String(selected.length));
    }
};

/**
 * Selection, "-" and bulk actions of the dialog members: same selection state, removeMembers and
 * move dialog as the group cards (no second implementation).
 *
 * @param {HTMLElement} root Workspace root.
 * @param {HTMLElement} item Group card.
 * @param {HTMLElement} modal Dialog.
 */
const bindDialogMembers = (root, item, modal) => {
    const courseId = root.getAttribute('data-easystud-course-id') || '';
    modal.addEventListener('change', event => {
        const input = event.target.closest('[data-easystud-entity-select]');
        if (!input) {
            return;
        }
        const member = getDialogMemberItem(root, item, input.getAttribute('data-easystud-entity-select'));
        if (!member) {
            input.checked = false;
            return;
        }
        if (input.checked && !areSelectionTypesCompatible(getActiveSelectionType(root), 'member')) {
            // A compact card menu selects its group. An explicit member choice starts member selection,
            // through the shared authority, without mixing incompatible workspace selection types.
            clearSelectionState(root);
        }
        setItemSelected(member, input.checked);
        updateSelectionActions(root);
        syncDialogBulk(root, item, modal);
    });
    // The workspace state is refreshed a moment after every action (data-easystud-sm-version changes):
    // the member list then follows it, whatever the action (removal here, move dialog, a card).
    const observer = new MutationObserver(() => {
        if (!modal.isConnected) {
            observer.disconnect();
            return;
        }
        refreshDialogMembers(root, item, modal);
    });
    observer.observe(root, {attributes: true, attributeFilter: ['data-easystud-sm-version']});
    const removeThen = members => {
        const restoreFocus = modal.contains(document.activeElement);
        const ids = members.map(member => String(member.getAttribute('data-easystud-member-id')));
        return removeMembers(root, courseId, members).then(response => {
            clearSelectionState(root);
            updateSelectionActions(root);
            showNotification(root, (response && response.message) || '', 'success');
            // Immediate feedback; the refreshed state then rebuilds the list and the counters.
            modal.querySelectorAll('[data-easystud-entity-member]').forEach(row => {
                if (ids.indexOf(row.getAttribute('data-easystud-entity-member')) !== -1) {
                    row.remove();
                }
            });
            syncDialogBulk(root, item, modal);
            if (restoreFocus && document.activeElement === document.body) {
                focusDialogMemberFallback(modal);
            }
            return response;
        }).catch(error => handleActionError(root, error));
    };
    modal.addEventListener('click', event => {
        const remove = event.target.closest('[data-easystud-entity-remove]');
        if (remove) {
            const member = getDialogMemberItem(root, item, remove.getAttribute('data-easystud-entity-remove'));
            const selected = getSelectedItems(root, 'member').filter(Boolean);
            if (member) {
                removeThen(member.classList.contains('is-selected') && selected.length > 1 ? selected : [member]);
            }
            return;
        }
        if (event.target.closest('[data-easystud-entity-bulk-remove]')) {
            const selected = getSelectedItems(root, 'member').filter(Boolean);
            if (selected.length) {
                removeThen(selected);
            }
            return;
        }
        if (event.target.closest('[data-easystud-entity-bulk-move]')) {
            const open = root.querySelector('[data-easystud-move-selected-members]:not([disabled])');
            if (open) {
                // Same stacking layer as this dialog: the later one in the document is on top.
                const moveModal = root.querySelector('[data-easystud-move-modal]');
                if (moveModal) {
                    root.appendChild(moveModal);
                }
                open.click();
            }
        }
    });
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
    const model = getOnDemandModel();
    const grouping = model ? model.groupings.get(Number(item.getAttribute('data-easystud-grouping-id'))) : null;
    if (grouping) {
        return (grouping.groupids || []).filter(id => model.groups.has(id)).map(id => {
            const group = model.groups.get(id);
            return {id, name: group.name, members: countLabel(model.groupStrings.memberscount, group.memberids.length)};
        });
    }
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

// Entity dialog fields (T048): label above a Kit text field M, no card around the field.
const renderAdvancedInput = (label, name, value, type = 'text', help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field local-groupimport-easystud-entity__field">' +
        '<span class="local-groupimport-easystud-entity__label">' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<input type="' + type + '" class="form-control local-groupimport-easystud-entity__input" name="' +
            escapeHtml(name) + '" value="' + escapeHtml(value || '') + '"' +
            (type === 'password' ? ' autocomplete="new-password"' : '') + '>' +
    '</label>';
};

const renderAdvancedTextarea = (label, name, value, help = '') => {
    return '<label class="local-groupimport-easystud-settings-modal__field ' +
            'local-groupimport-easystud-settings-modal__field--wide ' +
            'local-groupimport-easystud-entity__field local-groupimport-easystud-entity__field--wide">' +
        '<span class="local-groupimport-easystud-entity__label">' + escapeHtml(label) + renderFieldHelp(help) + '</span>' +
        '<textarea class="form-control local-groupimport-easystud-entity__textarea" name="' + escapeHtml(name) + '" rows="3">' +
            escapeHtml(value || '') +
        '</textarea>' +
    '</label>';
};

const renderAdvancedReadonly = (label, value) => {
    return '<div class="local-groupimport-easystud-settings-modal__field ' +
            'local-groupimport-easystud-settings-modal__field--readonly ' +
            'local-groupimport-easystud-entity__field local-groupimport-easystud-entity__field--wide">' +
        '<span class="local-groupimport-easystud-entity__label">' + escapeHtml(label) + '</span>' +
        '<span class="local-groupimport-easystud-entity__value">' + escapeHtml(value) + '</span>' +
    '</div>';
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

/**
 * Group image section: current image, compact deposit (same family as Mass Import) and
 * the Kit switch that deletes the image on save. The native file input, its trigger and
 * the drag-and-drop hooks are unchanged.
 *
 * @param {Object} labels Labels.
 * @param {String} picture Current picture URL.
 * @param {String} inputId File input id.
 * @returns {String}
 */
const renderAdvancedImageSection = (labels, picture, inputId) => {
    const preview = picture ?
        '<img src="' + escapeHtml(picture) + '" alt="">' :
        '<div class="local-groupimport-easystud-settings-modal__image-placeholder">' +
            '<span class="fa fa-image" aria-hidden="true"></span>' +
            '<span>' + escapeHtml(labels.advancedsettingsnoimage || '') + '</span>' +
        '</div>';
    return entitySection(labels.entityimage || '',
        '<div class="local-groupimport-easystud-entity__image-grid">' +
            '<div class="local-groupimport-easystud-settings-modal__image local-groupimport-easystud-entity__image-preview">' +
                preview +
            '</div>' +
            '<div class="local-groupimport-easystud-settings-modal__filepicker local-groupimport-easystud-entity__deposit">' +
                '<input type="file" id="' + inputId + '" name="imagefile" accept="image/*" ' +
                    'data-easystud-advanced-file-input="1">' +
                '<span class="local-groupimport-easystud-entity__deposit-icon fa fa-file-import" aria-hidden="true"></span>' +
                '<button type="button" class="local-groupimport-easystud-entity__deposit-trigger" ' +
                    'data-easystud-advanced-file-trigger="1" aria-controls="' + inputId + '">' +
                    escapeHtml(labels.entityimagedeposit || '') +
                '</button>' +
                '<span class="local-groupimport-easystud-entity__deposit-support">' +
                    escapeHtml(labels.entityimagesupport || '') + renderFieldHelp(labels.advancedsettingsimagehelp || '') +
                '</span>' +
                '<span class="local-groupimport-easystud-settings-modal__filename" data-easystud-advanced-file-name>' +
                    escapeHtml(labels.advancedsettingsnofile || '') +
                '</span>' +
            '</div>' +
        '</div>' +
        '<label class="local-groupimport-easystud-settings-modal__image-toggle local-groupimport-easystud-entity__switch">' +
            '<input type="checkbox" name="deletepicture" value="1" data-easystud-delete-picture-input="1" ' +
                'id="local-groupimport-easystud-deletepicture-toggle" ' +
                'data-label-on="' + escapeHtml(labels.enabled || '') + '" ' +
                'data-label-off="' + escapeHtml(labels.disabled || '') + '">' +
            '<span>' +
                '<strong class="local-groupimport-easystud-settings-modal__image-toggle-label">' +
                    escapeHtml(labels.deletepictureonsave || labels.deletepicture || '') +
                '</strong>' +
                '<small data-easystud-settings-toggle-state="1">' + escapeHtml(labels.disabled || '') + '</small>' +
            '</span>' +
        '</label>', 'image');
};

/**
 * Body of the group or grouping dialog (T048 entity dialog, Penpot S6-D5a/b).
 *
 * @param {HTMLElement} root Workspace root.
 * @param {HTMLElement} item Group or grouping card.
 * @param {String} state ready, loading or error.
 * @returns {String}
 */
const renderAdvancedBody = (root, item, state) => {
    const labels = getLabels(root);
    const type = getAdvancedValue(item, 'type');
    const isgroup = type === 'group';
    const name = getAdvancedValue(item, 'name');
    const safeTitle = name.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'easystud';
    const memberRows = isgroup ? getAdvancedGroupMemberRows(root, item) : [];
    const groupGroupingRows = isgroup ? getAdvancedGroupGroupingRows(root, item) : [];
    const groupingGroupRows = isgroup ? [] : getAdvancedGroupingGroupRows(item);
    const context = isgroup ?
        [getAdvancedCountLabel(root, item, true), entityCount(labels.groupingscounttemplate || '', groupGroupingRows.length)]
            .filter(Boolean).join(' \u00b7 ') :
        getAdvancedCountLabel(root, item, false);
    const identity = entityIdentity(type, entityIcon(isgroup ? 'fa-users' : 'fa-sitemap'), name, context);

    if (state === 'error') {
        return identity + entityErrorNotice(labels.entityloaderror || '', labels.retry || '');
    }
    if (state === 'loading') {
        // Header and identity are known from the card; every loaded field is a skeleton
        // at the geometry of the final field.
        return identity +
            entitySection(labels.entityinformation || '',
                '<div class="local-groupimport-easystud-entity__fields">' +
                    entitySkeletonField('control') + entitySkeletonField('control') +
                    entitySkeletonField('control') + entitySkeletonField('area', true) +
                '</div>', 'information') +
            entitySection(labels.entityrelations || '', entitySkeletonRelation('rows') + entitySkeletonRelation(), 'relations') +
            entitySection(labels.entityimage || '',
                '<div class="local-groupimport-easystud-entity__image-grid">' +
                    '<span class="local-groupimport-easystud-entity__skeleton ' +
                        'local-groupimport-easystud-entity__skeleton--image" aria-hidden="true"></span>' +
                    '<span class="local-groupimport-easystud-entity__skeleton ' +
                        'local-groupimport-easystud-entity__skeleton--deposit" aria-hidden="true"></span>' +
                '</div>', 'image');
    }

    const config = isgroup ? '' : getAdvancedValue(item, 'config');
    const fields = renderAdvancedInput(labels.advancedsettingsname || '', 'name', name) +
        renderAdvancedInput(labels.advancedsettingsidnumber || '', 'idnumber', getAdvancedValue(item, 'idnumber')) +
        (isgroup ? renderAdvancedInput(labels.advancedsettingsenrolmentkey || '', 'enrolmentkey', '', 'password',
            labels.advancedsettingsenrolmentkeyhelp || '') : '') +
        renderAdvancedTextarea(labels.advancedsettingsdescription || '', 'description',
            getAdvancedValue(item, 'raw-description')) +
        (config ? renderAdvancedReadonly(labels.advancedsettingsconfigdata || '', config) : '');
    const memberSection = isgroup ? renderMemberSection(root, item, memberRows) : '';
    const groupingSection = entityRelationSection({
        title: labels.groupings || '',
        type: 'groupings',
        countText: entityCount(labels.groupingscounttemplate || '', groupGroupingRows.length),
        content: entityPills(groupGroupingRows.map(row => row.name), 'grouping', {
            lessLabel: labels.showless || '',
            emptyLabel: labels.advancedsettingsnogroupings || '',
        }),
        rows: groupGroupingRows,
        columns: [
            {key: 'name', label: labels.advancedsettingsgroupingname || ''},
            {key: 'id', label: labels.advancedsettingsgroupingid || ''},
        ],
        exportName: 'easystud-' + safeTitle + '-groupings.csv',
        exportLabel: (labels.exportcsvtemplate || '').replace('__name__', labels.groupings || ''),
    });
    const groupSection = entityRelationSection({
        title: labels.advancedsettingsgroups || '',
        type: 'groups',
        countText: entityCount(labels.groupscounttemplate || '', groupingGroupRows.length),
        content: entityPills(groupingGroupRows.map(row => row.name), 'group', {
            lessLabel: labels.showless || '',
            emptyLabel: labels.advancedsettingsnogroups || '',
        }),
        rows: groupingGroupRows,
        columns: [
            {key: 'name', label: labels.advancedsettingsgroupname || ''},
            {key: 'members', label: labels.advancedsettingsmembers || ''},
            {key: 'id', label: labels.advancedsettingsgroupid || ''},
        ],
        exportName: 'easystud-' + safeTitle + '-groups.csv',
        exportLabel: (labels.exportcsvtemplate || '').replace('__name__', labels.advancedsettingsgroups || ''),
    });
    const imageInputId = 'local-groupimport-easystud-group-image-' + (item.getAttribute('data-easystud-group-id') || 'current');
    return identity +
        entitySection(labels.entityinformation || '',
            '<div class="local-groupimport-easystud-settings-modal__grid local-groupimport-easystud-entity__fields">' +
                fields + '</div>', 'information') +
        entitySection(labels.entityrelations || '', isgroup ? memberSection + groupingSection : groupSection, 'relations') +
        (isgroup ? renderAdvancedImageSection(labels, getAdvancedValue(item, 'picture'), escapeHtml(imageInputId)) : '');
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
    // The dialog opens at once: header filled, field skeletons, footer visible but waiting.
    const modal = openAdvancedSettingsModalNow(root, item, returnFocus, 'loading');
    const load = () => {
        item.setAttribute('aria-busy', 'true');
        fetchDetails(getOnDemandParticipants().courseId, 'group', [groupid]).then(items => {
            item.removeAttribute('aria-busy');
            if (items[0]) {
                model.groupDetails.set(groupid, items[0]);
                apply(items[0]);
            }
            if (modal.isConnected && !modal.hidden) {
                modal.easystudRenderEditor(items[0] ? 'ready' : 'error');
            }
            return items;
        }).catch(error => {
            item.removeAttribute('aria-busy');
            Log.error(error);
            if (modal.isConnected && !modal.hidden) {
                modal.easystudRenderEditor('error');
            }
        });
    };
    modal.easystudRetryEditor = () => {
        modal.easystudRenderEditor('loading');
        load();
    };
    load();
};

const openAdvancedSettingsModalNow = (root, item, returnFocus = null, initialState = 'ready') => {
    const labels = getLabels(root);
    const type = getAdvancedValue(item, 'type');
    const isgroup = type === 'group';
    const nativeurl = getAdvancedValue(item, 'native-url');
    const typeLabel = isgroup ? (labels.groupdetails || '') :
        (labels.groupingdetails || '');
    const pluginLabel = labels.pluginname || '';
    const icon = isgroup ? 'fa-users' : 'fa-sitemap';
    const titleId = 'local-groupimport-easystud-editor-title-' + type;

    let modal = root.querySelector('[data-easystud-advanced-settings-modal]');
    if (modal) {
        modal.remove();
    }
    modal = document.createElement('div');
    modal.className = 'local-groupimport-easystud-modal local-groupimport-easystud-settings-modal easyedu-modal-layer';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', titleId);
    modal.setAttribute('data-easystud-advanced-settings-modal', '1');
    modal.setAttribute('data-easystud-editor-context', type);
    modal.innerHTML =
        '<div class="local-groupimport-easystud-modal__dialog local-groupimport-easystud-settings-modal__dialog easyedu-entity-dialog ' +
                'local-groupimport-easystud-entity local-groupimport-easystud-entity--' + type + ' ' +
                (isgroup ? 'local-groupimport-easystud-settings-modal__dialog--group' :
                    'local-groupimport-easystud-settings-modal__dialog--grouping') + '">' +
            '<div class="local-groupimport-easystud-modal__header local-groupimport-easystud-settings-modal__header easyedu-entity-dialog__header easyedu-dialog-header-palette--success">' +
                '<div class="local-groupimport-easystud-settings-modal__heading easyedu-entity-dialog__heading">' +
                    '<span class="local-groupimport-easystud-settings-modal__icon easyedu-entity-dialog__icon ' +
                        'local-groupimport-easystud-entity__tile fa ' + icon + '" aria-hidden="true"></span>' +
                    '<div>' +
                        '<span class="local-groupimport-easystud-settings-modal__eyebrow easyedu-entity-dialog__eyebrow">' +
                            escapeHtml(pluginLabel) +
                        '</span>' +
                        '<h3 class="easyedu-modal-title" id="' + titleId + '">' + escapeHtml(typeLabel) + '</h3>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="local-groupimport-easystud-modal__close" ' +
                    'data-easystud-close-advanced-settings="1" aria-label="' +
                    escapeHtml(labels.close || '') + '">' +
                    '<span aria-hidden="true">&times;</span>' +
                '</button>' +
            '</div>' +
            '<form class="local-groupimport-easystud-settings-modal__form local-groupimport-easystud-entity__form" ' +
                    'data-easystud-advanced-settings-form="1">' +
                '<input type="hidden" name="courseid" value="' + escapeHtml(root.getAttribute('data-easystud-course-id') || '') + '">' +
                '<input type="hidden" name="action" value="' +
                    (isgroup ? 'updategroupadvanced' : 'updategroupingadvanced') + '">' +
                '<input type="hidden" name="' + (isgroup ? 'groupid' : 'groupingid') + '" value="' +
                    escapeHtml(isgroup ? (item.getAttribute('data-easystud-group-id') || '') :
                        (item.getAttribute('data-easystud-grouping-id') || '')) + '">' +
                '<div class="local-groupimport-easystud-modal__body easyedu-entity-dialog__body ' +
                    'local-groupimport-easystud-entity__body" data-easystud-advanced-settings-body="1"></div>' +
                // Guide-style sticky footer: external action on the left, Cancel then Save on the right.
                '<div class="local-groupimport-easystud-modal__footer easyedu-entity-dialog__actions ' +
                        'local-groupimport-easystud-entity__footer">' +
                    (nativeurl ?
                        '<a class="local-groupimport-easystud-entity__native" href="' + escapeHtml(nativeurl) + '" ' +
                                'data-easystud-entity-await="1" aria-label="' + escapeHtml(labels.advancedsettingsnative || '') + '">' +
                            '<span class="local-groupimport-easystud-entity__native-icon" aria-hidden="true">&#8599;</span>' +
                            '<span class="local-groupimport-easystud-entity__native-long">' +
                                escapeHtml(labels.advancedsettingsnative || '') + '</span>' +
                            '<span class="local-groupimport-easystud-entity__native-short" aria-hidden="true">' +
                                escapeHtml(labels.advancedsettingsnativeshort || '') + '</span>' +
                        '</a>' : '') +
                    '<button type="button" class="btn easyedu-button--secondary" data-easystud-close-advanced-settings="1">' +
                        escapeHtml(labels.cancel || '') +
                    '</button>' +
                    '<button type="submit" class="btn easyedu-button" data-easystud-entity-await="1">' +
                        escapeHtml(labels.save || '') +
                    '</button>' +
                '</div>' +
            '</form>' +
        '</div>';

    const dialog = modal.querySelector('.local-groupimport-easystud-modal__dialog');
    const body = modal.querySelector('[data-easystud-advanced-settings-body]');
    let stopLoading = null;
    let opened = false;
    const renderEditor = state => {
        if (stopLoading) {
            stopLoading();
            stopLoading = null;
        }
        body.innerHTML = renderAdvancedBody(root, item, state);
        setEntityFooterBusy(dialog, state !== 'ready');
        if (state === 'loading') {
            stopLoading = startEntityLoading(body);
            return;
        }
        modal.querySelectorAll('[data-easystud-settings-list-section]').forEach(details => {
            const requested = state === 'ready' && !opened &&
                returnFocus?.getAttribute('data-easystud-long-list-action') === 'all' &&
                details.classList.contains('local-groupimport-easystud-entity__relation--' +
                    (isgroup ? 'members' : 'groups'));
            if (requested) {
                details.open = true;
            }
            bindAnimatedDetails(details, details.querySelector(':scope > .local-groupimport-easystud-entity__relation-body'),
                'data-easystud-settings-list-state');
            if (requested) {
                details.scrollIntoView({block: 'nearest', behavior: 'auto'});
            }
        });
        if (state === 'ready' && !opened) {
            // Guide inspection starts once the real fields exist (never on a skeleton).
            opened = true;
            emitEditorInspectionCompletion(root, type, 'open-editor');
            requestGuideHighlightRefresh(root);
        }
    };
    modal.easystudRenderEditor = renderEditor;

    const closeModal = (completeInspection = true) => hideEasyStudModal(modal, () => {
        if (stopLoading) {
            stopLoading();
            stopLoading = null;
        }
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
            return;
        }
        if (event.target.closest('[data-easystud-entity-retry]') && modal.easystudRetryEditor) {
            modal.easystudRetryEditor();
            return;
        }
        const waiting = event.target.closest('a[data-easystud-entity-await][aria-disabled="true"]');
        if (waiting) {
            event.preventDefault();
        }
    });
    bindEntityReveal(dialog);
    if (isgroup) {
        bindDialogMembers(root, item, modal);
    }
    root.appendChild(modal);
    renderEditor(initialState);
    const focusModal = bindCardModalKeyboard(modal, closeModal);
    focusModal();
    return modal;
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
