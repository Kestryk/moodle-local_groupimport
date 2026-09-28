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
 * CSV import page interactions.
 *
 * @module     local_groupimport/csv_import
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from './motion';

const hasFiles = event => {
    const types = event.dataTransfer ? Array.from(event.dataTransfer.types || []) : [];
    return types.indexOf('Files') !== -1;
};

const findFileInput = root => {
    return root.querySelector('input[type="file"]');
};

const findFilePicker = root => {
    if (!window.M || !M.core_filepicker || !M.core_filepicker.instances) {
        return null;
    }

    const instances = M.core_filepicker.instances;
    for (const clientId in instances) {
        if (!Object.prototype.hasOwnProperty.call(instances, clientId)) {
            continue;
        }

        const instance = instances[clientId];
        const options = instance ? instance.options || {} : {};
        const element = options.elementid ? document.getElementById(options.elementid) : null;
        const wrapper = document.getElementById(`filepicker-wrapper-${clientId}`);
        const info = document.getElementById(`file_info_${clientId}`);

        if ((element && root.contains(element)) || (wrapper && root.contains(wrapper)) || (info && root.contains(info))) {
            return {
                clientId: clientId,
                options: options,
            };
        }
    }

    return null;
};

const getUploadRepositoryId = repositories => {
    if (!repositories) {
        return null;
    }

    for (const key in repositories) {
        if (Object.prototype.hasOwnProperty.call(repositories, key) && repositories[key].type === 'upload') {
            return repositories[key].id;
        }
    }

    return null;
};

const appendAcceptedTypes = (formData, acceptedTypes) => {
    if (Array.isArray(acceptedTypes)) {
        acceptedTypes.forEach(type => formData.append('accepted_types[]', type));
        return;
    }

    if (acceptedTypes) {
        formData.append('accepted_types[]', acceptedTypes);
    }
};

const waitForFilePicker = (root, timeout = 8000) => {
    const started = performance.now();

    return new Promise(resolve => {
        const inspect = () => {
            const picker = findFilePicker(root);
            if (picker || performance.now() - started >= timeout) {
                resolve(picker);
                return;
            }
            window.setTimeout(inspect, 80);
        };
        inspect();
    });
};

const uploadToMoodleFilePicker = async(root, file) => {
    const picker = await waitForFilePicker(root);
    if (!picker || !window.M || !M.cfg || !M.cfg.sesskey || typeof FormData === 'undefined') {
        return false;
    }

    const options = picker.options;
    const repositoryId = getUploadRepositoryId(options.repositories);
    if (!repositoryId || !options.itemid || typeof XMLHttpRequest === 'undefined') {
        return false;
    }

    return new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        const acceptedTypes = options.acceptedtypes || options.accepted_types;
        const contextId = options.contextid || (options.context ? options.context.id : null);

        formData.append('repo_upload_file', file);
        formData.append('sesskey', M.cfg.sesskey);
        formData.append('repo_id', repositoryId);
        formData.append('itemid', options.itemid);
        formData.append('savepath', '/');
        formData.append('title', file.name);

        if (options.author) {
            formData.append('author', options.author);
        }
        if (contextId) {
            formData.append('ctx_id', contextId);
        }
        appendAcceptedTypes(formData, acceptedTypes);

        xhr.onreadystatechange = () => {
            if (xhr.readyState !== 4) {
                return;
            }

            if (xhr.status !== 200) {
                resolve(false);
                return;
            }

            try {
                const result = JSON.parse(xhr.responseText);
                if (!result || result.error) {
                    resolve(false);
                    return;
                }

                if (result.event === 'fileexists' && result.newfile) {
                    result.file = result.newfile.filename;
                    result.url = result.newfile.url;
                }
                result.client_id = picker.clientId;

                if (M.form_filepicker && typeof M.form_filepicker.callback === 'function') {
                    M.form_filepicker.callback(result);
                    resolve(true);
                    return;
                }
            } catch (error) {
                resolve(false);
                return;
            }

            resolve(false);
        };

        xhr.open('POST', `${M.cfg.wwwroot}/repository/repository_ajax.php?action=upload`, true);
        xhr.send(formData);
    });
};

const assignDroppedFile = (root, file) => {
    const input = findFileInput(root);
    if (!input || !file || typeof DataTransfer === 'undefined') {
        return false;
    }

    try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        input.files = transfer.files;
        input.dispatchEvent(new Event('change', {bubbles: true}));
        return true;
    } catch (error) {
        return false;
    }
};

const forwardDroppedFileToMoodle = (root, file) => {
    const target = root.querySelector('.filepicker-filelist');
    if (!target || !file || typeof DataTransfer === 'undefined' || typeof DragEvent === 'undefined') {
        return false;
    }

    try {
        const transfer = new DataTransfer();
        transfer.items.add(file);
        ['dragenter', 'dragover', 'drop'].forEach(type => {
            target.dispatchEvent(new DragEvent(type, {
                bubbles: true,
                cancelable: true,
                dataTransfer: transfer,
            }));
        });
        return true;
    } catch (error) {
        return false;
    }
};

const getFileTypeIcon = filename => {
    const extension = (filename.split('.').pop() || '').toLowerCase();
    if (extension === 'csv') {
        return 'fa-file-csv';
    }
    if (extension === 'xls' || extension === 'xlsx') {
        return 'fa-file-excel';
    }
    if (['gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'].indexOf(extension) !== -1) {
        return 'fa-file-image';
    }
    return 'fa-file';
};

const notifyFilePickerChange = picker => {
    const elementId = picker && picker.options ? picker.options.elementid : null;
    const element = elementId ? document.getElementById(elementId) : null;

    if (window.M && M.form_filepicker && M.form_filepicker.instances && elementId &&
            M.form_filepicker.instances[elementId]) {
        M.form_filepicker.instances[elementId].fileadded = false;
    }
    if (window.M && M.form_filepicker && M.form_filepicker.Y && elementId) {
        const yuiElement = M.form_filepicker.Y.one(`#${elementId}`);
        if (yuiElement) {
            yuiElement.simulate('change');
            return;
        }
    }
    if (element) {
        element.dispatchEvent(new Event('change', {bubbles: true}));
    }
};

const deleteSelectedFile = async(root, filename) => {
    const picker = findFilePicker(root);
    if (!picker || !filename || !window.M || !M.cfg || !M.cfg.sesskey || !picker.options.itemid) {
        return false;
    }

    const parameters = new URLSearchParams({
        action: 'delete',
        sesskey: M.cfg.sesskey,
        itemid: picker.options.itemid,
        filepath: '/',
        filename: filename,
    });
    const response = await fetch(`${M.cfg.wwwroot}/repository/draftfiles_ajax.php`, {
        method: 'POST',
        body: parameters,
        credentials: 'same-origin',
        headers: {'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'},
    });
    if (!response.ok || !await response.json()) {
        return false;
    }

    const filenameContainer = root.querySelector(`#file_info_${picker.clientId} .filepicker-filename`);
    if (filenameContainer) {
        filenameContainer.innerHTML = '<div class="dndupload-progressbars"></div>';
    }
    notifyFilePickerChange(picker);
    return true;
};

const syncSelectedFileState = root => {
    const deposit = root.querySelector('.easyedu-file-deposit--moodle');
    if (!deposit) {
        return;
    }
    const filenameContainer = deposit.querySelector('.filepicker-filename');
    const anchor = filenameContainer ? filenameContainer.querySelector('a') : null;
    if (!filenameContainer || !anchor) {
        deposit.classList.remove('has-selected-file');
        return;
    }

    const filename = anchor.textContent.trim();
    let selected = anchor.closest('.easyedu-file-deposit__selected-file');
    if (!selected) {
        selected = document.createElement('span');
        selected.className = 'easyedu-file-deposit__selected-file';
        anchor.parentNode.insertBefore(selected, anchor);
        selected.appendChild(anchor);
    }

    let typeIcon = anchor.querySelector('.easyedu-file-deposit__file-type');
    if (!typeIcon) {
        typeIcon = document.createElement('span');
        typeIcon.setAttribute('aria-hidden', 'true');
        anchor.insertBefore(typeIcon, anchor.firstChild);
    }
    typeIcon.className = `fa ${getFileTypeIcon(filename)} easyedu-file-deposit__file-type`;

    let remove = selected.querySelector('.easyedu-file-deposit__remove');
    if (!remove) {
        remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'easyedu-file-deposit__remove';
        remove.innerHTML = '<span class="fa fa-trash" aria-hidden="true"></span>';
        selected.appendChild(remove);
        remove.addEventListener('click', async() => {
            remove.disabled = true;
            if (!await deleteSelectedFile(root, filename)) {
                remove.disabled = false;
            }
        });
    }
    remove.setAttribute('aria-label', deposit.dataset.easyeduRemoveLabel || 'Remove selected file');
    deposit.classList.add('has-selected-file');
};

const initSelectedFileState = root => {
    const deposit = root.querySelector('.easyedu-file-deposit--moodle');
    if (!deposit || deposit.dataset.easyeduSelectedFileBound === '1') {
        return;
    }
    deposit.dataset.easyeduSelectedFileBound = '1';
    syncSelectedFileState(root);
    new MutationObserver(() => syncSelectedFileState(root)).observe(deposit, {
        childList: true,
        subtree: true,
    });
};

const applyUploadCollapsed = (root, button, collapsed) => {
    root.classList.toggle('is-upload-collapsed', collapsed);

    if (button) {
        const expanded = !collapsed;
        const icon = button.querySelector('.fa');
        const label = collapsed ? button.dataset.expandLabel : button.dataset.collapseLabel;

        button.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        if (label) {
            button.setAttribute('aria-label', label);
        }
        if (icon) {
            // Keep one glyph: CSS rotates it on the same clock as the column.
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-left');
        }
    }

    try {
        window.localStorage.setItem('local_groupimport_import_upload_collapsed', collapsed ? '1' : '0');
    } catch (error) {
        // Ignore unavailable storage; the control still works for the current page.
    }
};

const parseCssTime = value => {
    const time = String(value || '').trim();
    if (time.endsWith('ms')) {
        return parseFloat(time) || 0;
    }
    if (time.endsWith('s')) {
        return (parseFloat(time) || 0) * 1000;
    }
    return 0;
};

const waitForTransition = (element, propertyName) => {
    if (!element) {
        return Promise.resolve(true);
    }
    const style = window.getComputedStyle(element);
    const properties = style.transitionProperty.split(',').map(value => value.trim());
    const durations = style.transitionDuration.split(',').map(parseCssTime);
    const delays = style.transitionDelay.split(',').map(parseCssTime);
    let maximum = 0;
    properties.forEach((property, index) => {
        if (property === propertyName || property === 'all') {
            maximum = Math.max(maximum,
                durations[index % durations.length] + delays[index % delays.length]);
        }
    });
    if (maximum <= 0) {
        return Promise.resolve(true);
    }
    return new Promise(resolve => {
        let completed = false;
        const finish = () => {
            if (completed) {
                return;
            }
            completed = true;
            element.removeEventListener('transitionend', onEnd);
            window.clearTimeout(timeout);
            resolve(true);
        };
        const onEnd = event => {
            if (event.target === element && event.propertyName === propertyName) {
                finish();
            }
        };
        const timeout = window.setTimeout(finish, maximum + 80);
        element.addEventListener('transitionend', onEnd);
    });
};

const clearUploadTransitionState = root => {
    root.classList.remove('is-upload-collapsing', 'is-upload-expanding');
};

const setUploadCollapsed = async(root, button, collapsed, animate = false) => {
    clearUploadTransitionState(root);
    const current = root.classList.contains('is-upload-collapsed');
    const grid = root.querySelector('.local-groupimport-import__grid');
    const content = root.querySelector('.local-groupimport-import-card--upload .easyedu-panel__copy');

    if (!animate || !Motion.isEnabled(root) || !grid || !content || current === collapsed) {
        applyUploadCollapsed(root, button, collapsed);
        return true;
    }

    if (collapsed) {
        // Keep the expanded geometry while copy and fields fade. Only after
        // they are visually absent may the grid contract to its compact rail.
        root.classList.add('is-upload-collapsing');
        await waitForTransition(content, 'opacity');
        applyUploadCollapsed(root, button, true);
        root.classList.remove('is-upload-collapsing');
        await waitForTransition(grid, 'grid-template-columns');
        return true;
    }

    // Keep content out of flow and transparent while the rail grows. Once the
    // full track exists, restore layout participation and fade content in.
    root.classList.add('is-upload-expanding');
    applyUploadCollapsed(root, button, false);
    await waitForTransition(grid, 'grid-template-columns');
    root.classList.remove('is-upload-expanding');
    await waitForTransition(content, 'opacity');
    return true;
};

const initUploadCollapse = root => {
    const button = root.querySelector('[data-local-groupimport-upload-toggle]');
    if (!button || button.dataset.localGroupimportUploadToggleBound === '1') {
        return;
    }
    button.dataset.localGroupimportUploadToggleBound = '1';

    let collapsed = root.classList.contains('is-upload-collapsed');
    try {
        const stored = window.localStorage.getItem('local_groupimport_import_upload_collapsed');
        if (stored === '0' || stored === '1') {
            collapsed = stored === '1';
        }
    } catch (error) {
        // Keep the server-rendered default when storage is unavailable.
    }

    setUploadCollapsed(root, button, collapsed);

    button.addEventListener('click', async() => {
        if (button.dataset.localGroupimportUploadToggleBusy === '1') {
            return;
        }
        button.dataset.localGroupimportUploadToggleBusy = '1';
        try {
            await setUploadCollapsed(root, button, !root.classList.contains('is-upload-collapsed'), true);
        } finally {
            delete button.dataset.localGroupimportUploadToggleBusy;
            clearUploadTransitionState(root);
        }
    });
};

const getPreviewRowText = row => {
    const inputs = Array.from(row.querySelectorAll('input[type="text"]'))
        .map(input => input.value || '');
    return `${row.textContent || ''} ${inputs.join(' ')}`.toLowerCase();
};

const setRowsChecked = (rows, checked) => {
    rows.forEach(row => {
        const checkbox = row.querySelector('input[type="checkbox"][name^="rowenabled"]');
        if (checkbox && !checkbox.disabled) {
            checkbox.checked = checked;
        }
    });
};

const areRowsChecked = rows => {
    const checkboxes = rows
        .map(row => row.querySelector('input[type="checkbox"][name^="rowenabled"]'))
        .filter(checkbox => checkbox && !checkbox.disabled);
    return checkboxes.length > 0 && checkboxes.every(checkbox => checkbox.checked);
};

const updateToggleButton = (button, rows, animate = false) => {
    if (!button) {
        return;
    }

    const shouldDeselect = areRowsChecked(rows);
    const nextAction = shouldDeselect ? 'deselect' : 'select';
    const mutate = () => {
        button.textContent = shouldDeselect ? button.dataset.deselectLabel : button.dataset.selectLabel;
        button.classList.toggle('btn-outline-secondary', shouldDeselect);
        button.classList.toggle('btn-outline-primary', !shouldDeselect);
        button.dataset.previewNextAction = nextAction;
        button.disabled = rows.length === 0;
    };
    if (animate && button.dataset.previewNextAction && button.dataset.previewNextAction !== nextAction) {
        Motion.swap(button, mutate, {
            exit: false,
            enterDuration: Motion.timing.normal,
            distance: '0.08rem',
            swapOpacity: 0.68,
        });
        return;
    }
    mutate();
};

const initPreviewTools = root => {
    const search = root.querySelector('[data-local-groupimport-preview-search]');
    const rows = Array.from(root.querySelectorAll('[data-local-groupimport-preview-row]'));
    if (!search || rows.length === 0) {
        return;
    }

    const toggleAll = root.querySelector('[data-local-groupimport-preview-toggle-all]');
    const empty = root.querySelector('[data-local-groupimport-preview-empty]');

    const getVisibleRows = () => rows.filter(row => !row.hidden);

    const updateRows = (animateToggle = false) => {
        const query = search.value.trim().toLowerCase();
        let visible = 0;

        rows.forEach(row => {
            const matches = query === '' || getPreviewRowText(row).indexOf(query) !== -1;
            row.hidden = !matches;
            if (matches) {
                visible++;
            }
        });

        const hasSearch = query !== '';
        const controlledRows = hasSearch ? getVisibleRows() : rows;
        if (toggleAll) {
            toggleAll.dataset.selectLabel = hasSearch
                ? toggleAll.dataset.selectResultsLabel
                : toggleAll.dataset.selectAllLabel;
            toggleAll.dataset.deselectLabel = hasSearch
                ? toggleAll.dataset.deselectResultsLabel
                : toggleAll.dataset.deselectAllLabel;
        }

        if (empty) {
            empty.hidden = visible !== 0;
        }

        updateToggleButton(toggleAll, controlledRows, animateToggle);
    };

    search.addEventListener('input', updateRows);
    rows.forEach(row => {
        row.querySelectorAll('input[type="text"]').forEach(input => {
            input.addEventListener('input', updateRows);
        });
        const checkbox = row.querySelector('input[type="checkbox"][name^="rowenabled"]');
        if (checkbox) {
            checkbox.addEventListener('change', () => updateRows(true));
        }
    });

    if (toggleAll) {
        toggleAll.addEventListener('click', () => {
            const controlledRows = search.value.trim() === '' ? rows : getVisibleRows();
            setRowsChecked(controlledRows, toggleAll.dataset.previewNextAction !== 'deselect');
            updateRows(true);
        });
    }

    updateRows();
};

const initHistoryModal = root => {
    const modal = root.querySelector('[data-local-groupimport-history-modal]');
    const openButtons = Array.from(root.querySelectorAll(
        '[data-local-groupimport-history-open], [data-easyedu-navigation-action="mass-import-history"]'
    ));
    if (!modal || openButtons.length === 0 || modal.dataset.localGroupimportHistoryBound === '1') {
        return;
    }
    modal.dataset.localGroupimportHistoryBound = '1';

    let opener = null;

    const restoreFocus = () => {
        const compactPanel = opener && opener.closest('[data-easyedu-navigation-panel]');
        const compactPanelClosed = compactPanel && compactPanel.getAttribute('aria-hidden') === 'true';
        if (opener && !compactPanelClosed && opener.getClientRects().length > 0) {
            opener.focus();
            return;
        }

        const navigationTrigger = root.querySelector('[data-easyedu-navigation-open]');
        if (navigationTrigger) {
            navigationTrigger.focus();
        }
    };

    const closeButtons = Array.from(modal.querySelectorAll('[data-local-groupimport-history-close]'));
    const close = () => {
        const dialog = modal.querySelector('.local-groupimport-import-modal__dialog') || modal;
        Motion.exit(dialog, {duration: Motion.timing.fast, distance: '0.2rem'}).then(completed => {
            if (completed) {
                modal.hidden = true;
                restoreFocus();
            }
        });
    };

    openButtons.forEach(button => {
        button.dataset.localGroupimportHistoryBound = '1';
        button.addEventListener('click', () => {
            opener = button;
            modal.hidden = false;
            const dialog = modal.querySelector('.local-groupimport-import-modal__dialog') || modal;
            Motion.enter(dialog, {duration: Motion.timing.slow, distance: '0.45rem'});
            const closeButton = modal.querySelector('[data-local-groupimport-history-close]');
            if (closeButton) {
                closeButton.focus();
            }
        });
    });

    closeButtons.forEach(button => button.addEventListener('click', close));
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            close();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            close();
        }
    });
};

const initRollbackModal = root => {
    const modal = root.querySelector('[data-local-groupimport-rollback-modal]');
    const form = modal ? modal.querySelector('[data-local-groupimport-rollback-form]') : null;
    const idInput = form ? form.querySelector('[data-local-groupimport-rollback-id]') : null;
    const filename = form ? form.querySelector('[data-local-groupimport-rollback-name]') : null;
    const openButtons = Array.from(root.querySelectorAll('[data-local-groupimport-rollback-open]'));
    if (!modal || !form || !idInput || openButtons.length === 0 ||
            modal.dataset.localGroupimportRollbackBound === '1') {
        return;
    }
    modal.dataset.localGroupimportRollbackBound = '1';

    const historyModal = root.querySelector('[data-local-groupimport-history-modal]');
    const closeButtons = Array.from(modal.querySelectorAll('[data-local-groupimport-rollback-close]'));

    const close = () => {
        const dialog = modal.querySelector('.local-groupimport-import-modal__dialog') || modal;
        Motion.exit(dialog, {duration: Motion.timing.fast, distance: '0.2rem'}).then(completed => {
            if (!completed) {
                return;
            }
            modal.hidden = true;
            if (historyModal) {
                historyModal.hidden = false;
                const historyDialog = historyModal.querySelector('.local-groupimport-import-modal__dialog') || historyModal;
                Motion.enter(historyDialog, {duration: Motion.timing.normal, distance: '0.3rem'});
            }
        });
    };

    openButtons.forEach(button => button.addEventListener('click', () => {
        idInput.value = button.dataset.localGroupimportRollbackOpen || '';
        if (filename) {
            filename.textContent = button.dataset.localGroupimportRollbackFilename || '';
        }
        if (historyModal) {
            historyModal.hidden = true;
        }
        modal.hidden = false;
        const dialog = modal.querySelector('.local-groupimport-import-modal__dialog') || modal;
        Motion.enter(dialog, {duration: Motion.timing.slow, distance: '0.45rem'});
        const primaryAction = form.querySelector('button[type="submit"]');
        if (primaryAction) {
            primaryAction.focus();
        }
    }));

    closeButtons.forEach(button => button.addEventListener('click', close));
    modal.addEventListener('click', event => {
        if (event.target === modal) {
            close();
        }
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !modal.hidden) {
            close();
        }
    });
};

export const init = (rootId) => {
    const root = document.getElementById(rootId);
    if (!root) {
        return;
    }

    Motion.init(root);

    initSelectedFileState(root);
    initUploadCollapse(root);
    initPreviewTools(root);
    initHistoryModal(root);
    initRollbackModal(root);

    const loadingReadyAttribute = root.dataset.easyeduLoadingReadyAttribute || 'data-easyedu-loading-ready';
    root.setAttribute(loadingReadyAttribute, '1');

    const overlay = root.querySelector('[data-local-groupimport-drop-overlay]');
    if (!overlay) {
        return;
    }

    let dragdepth = 0;
    let routingdrop = false;
    const deposit = root.querySelector('.easyedu-file-deposit');
    const isDepositEvent = event => deposit && deposit.contains(event.target);

    if (deposit) {
        ['dragenter', 'dragover'].forEach(type => deposit.addEventListener(type, event => {
            if (hasFiles(event)) {
                event.preventDefault();
                deposit.classList.add('is-dragover');
            }
        }));
        deposit.addEventListener('dragleave', event => {
            if (!deposit.contains(event.relatedTarget)) {
                deposit.classList.remove('is-dragover');
            }
        });
        deposit.addEventListener('drop', event => {
            deposit.classList.remove('is-dragover');
            if (hasFiles(event) && !event.target.closest('.filepicker-filelist')) {
                const file = event.dataTransfer.files[0];
                if (file) {
                    event.preventDefault();
                    forwardDroppedFileToMoodle(root, file);
                }
            }
        });
    }

    const showOverlay = () => {
        overlay.hidden = false;
        overlay.setAttribute('aria-hidden', 'false');
        root.classList.add('is-file-dragging');
    };

    const hideGlobalOverlay = () => {
        dragdepth = 0;
        overlay.hidden = true;
        overlay.setAttribute('aria-hidden', 'true');
        root.classList.remove('is-file-dragging');
    };

    const hideOverlay = () => {
        deposit?.classList.remove('is-dragover');
        hideGlobalOverlay();
    };

    window.addEventListener('dragenter', event => {
        if (isDepositEvent(event)) { hideGlobalOverlay(); return; }
        if (!hasFiles(event)) {
            return;
        }
        dragdepth++;
        showOverlay();
    });

    window.addEventListener('dragover', event => {
        if (isDepositEvent(event)) { hideGlobalOverlay(); return; }
        if (!hasFiles(event)) {
            return;
        }
        event.preventDefault();
        event.dataTransfer.dropEffect = 'copy';
        showOverlay();
    });

    window.addEventListener('dragleave', event => {
        if (isDepositEvent(event) && deposit.contains(event.relatedTarget)) { return; }
        if (!hasFiles(event)) {
            return;
        }
        dragdepth = Math.max(0, dragdepth - 1);
        if (dragdepth === 0) {
            hideOverlay();
        }
    });

    window.addEventListener('drop', event => {
        // The native drop target owns its upload/progress lifecycle.
        if (isDepositEvent(event)) { hideOverlay(); return; }
        if (routingdrop) {
            return;
        }
        if (!hasFiles(event)) {
            return;
        }
        event.preventDefault();

        const files = event.dataTransfer ? event.dataTransfer.files : null;
        const file = files && files.length > 0 ? files[0] : null;
        if (!file) {
            hideOverlay();
            return;
        }

        routingdrop = true;
        uploadToMoodleFilePicker(root, file)
            .then(uploaded => {
                if (!uploaded) {
                    const assigned = assignDroppedFile(root, file);
                    if (!assigned) {
                        forwardDroppedFileToMoodle(root, file);
                    }
                }
            })
            .finally(() => {
                routingdrop = false;
                hideOverlay();
            });
    });

    window.addEventListener('blur', hideOverlay);
};
