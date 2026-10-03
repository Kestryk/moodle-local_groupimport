// Progressive enhancement of a native single-select. No product commands,
// HTML strings, network requests, global listeners or private style overrides.
const controls = new WeakMap();
let sequence = 0;

const normalise = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase();

/**
 * Keep the original select as the authoritative value and no-JS fallback.
 * The disclosure contains a labelled search and native pressed choice buttons;
 * it is not an ARIA combobox/listbox pretending to own arrow-key semantics.
 *
 * @param {HTMLSelectElement} select Existing labelled single-select.
 * @param {Object} labels Localised label/search/empty strings, never HTML.
 * @returns {Object} Controller with host, trigger, refresh and close methods.
 */
export const enhanceSelect = (select, labels) => {
    if (controls.has(select)) {
        return controls.get(select);
    }
    if (!select || select.multiple) {
        throw new Error('enhanceSelect expects a native single-select.');
    }
    const document = select.ownerDocument;
    const id = `easyedu-searchable-choice-${++sequence}`;
    const host = document.createElement('div');
    host.className = 'easyedu-searchable-choice';
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.id = `${id}-trigger`;
    trigger.className = 'easyedu-searchable-choice__trigger';
    trigger.setAttribute('aria-expanded', 'false');
    trigger.setAttribute('aria-controls', `${id}-panel`);
    const summary = document.createElement('span');
    summary.className = 'easyedu-searchable-choice__summary';
    const chevron = document.createElement('span');
    chevron.className = 'fa fa-chevron-down';
    chevron.setAttribute('aria-hidden', 'true');
    trigger.append(summary, chevron);
    const panel = document.createElement('div');
    panel.id = `${id}-panel`;
    panel.className = 'easyedu-searchable-choice__panel';
    panel.hidden = true;
    const searchLabel = document.createElement('label');
    searchLabel.className = 'easyedu-searchable-choice__search';
    const magnifier = document.createElement('span');
    magnifier.className = 'fa fa-search';
    magnifier.setAttribute('aria-hidden', 'true');
    const search = document.createElement('input');
    search.type = 'search';
    search.autocomplete = 'off';
    searchLabel.append(magnifier, search);
    const list = document.createElement('div');
    list.className = 'easyedu-searchable-choice__list';
    list.setAttribute('role', 'group');
    const empty = document.createElement('p');
    empty.className = 'easyedu-searchable-choice__empty';
    empty.setAttribute('role', 'status');
    empty.hidden = true;
    panel.append(searchLabel, list, empty);
    host.append(trigger, panel);
    const originalLabels = [...select.labels];
    const originalHidden = select.hidden;
    let rows = [];

    const close = (returnFocus = false) => {
        panel.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
        if (returnFocus) {
            trigger.focus();
        }
    };
    const syncValue = () => {
        const option = select.selectedOptions[0];
        summary.textContent = option ? option.textContent : '';
        trigger.setAttribute('aria-label', `${labels.label}: ${summary.textContent}`);
        trigger.disabled = select.disabled || !select.options.length;
        rows.forEach(row => {
            row.button.setAttribute('aria-pressed', String(row.option.selected));
            row.check.hidden = !row.option.selected;
        });
    };
    const filter = () => {
        const term = normalise(search.value.trim());
        let visible = 0;
        rows.forEach(row => {
            row.button.hidden = !normalise(row.option.textContent).includes(term);
            visible += row.button.hidden ? 0 : 1;
        });
        empty.hidden = visible !== 0;
        // Searching never removes options or changes the current native value.
    };
    const refresh = (nextLabels = labels) => {
        labels = nextLabels;
        close();
        search.value = '';
        search.placeholder = labels.search;
        search.setAttribute('aria-label', labels.search);
        list.setAttribute('aria-label', labels.label);
        empty.textContent = labels.empty;
        rows = [...select.options].map(option => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'easyedu-searchable-choice__option';
            button.disabled = option.disabled || (option.parentElement.tagName === 'OPTGROUP' && option.parentElement.disabled);
            const text = document.createElement('span');
            text.textContent = option.textContent;
            const check = document.createElement('span');
            check.className = 'fa fa-check';
            check.setAttribute('aria-hidden', 'true');
            button.append(text, check);
            button.addEventListener('click', () => {
                select.value = option.value;
                select.dispatchEvent(new Event('change', {bubbles: true}));
                syncValue();
                close(true);
            });
            return {option, button, check};
        });
        list.replaceChildren(...rows.map(row => row.button));
        syncValue();
        filter();
    };
    trigger.addEventListener('click', () => {
        if (!panel.hidden) {
            close();
            return;
        }
        panel.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        search.value = '';
        filter();
        search.focus();
    });
    search.addEventListener('input', filter);
    host.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) {
            event.preventDefault();
            event.stopPropagation();
            close(true);
        }
    });
    host.addEventListener('focusout', event => {
        if (event.relatedTarget && !host.contains(event.relatedTarget)) {
            close();
        }
    });
    select.addEventListener('change', syncValue);
    // Only hide the native control after the complete enhancement is ready.
    refresh();
    select.after(host);
    select.hidden = true;
    originalLabels.forEach(label => { label.htmlFor = trigger.id; });
    const controller = {
        host, trigger, refresh, close,
        destroy: () => {
            select.removeEventListener('change', syncValue);
            originalLabels.forEach(label => { label.htmlFor = select.id; });
            select.hidden = originalHidden;
            host.remove();
            controls.delete(select);
        },
    };
    controls.set(select, controller);
    return controller;
};
