// This file is part of Moodle - http://moodle.org/
// Moodle is free software under the GNU GPL v3 or later.
/**
 * K16-01 list disclosure controls, bounded member rows and participant labels.
 * @module local_groupimport/local/cm/long_lists
 * @copyright 2026 Kevin Jarniac
 * @license http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import * as Motion from '../../motion';
import {listPolicy, listWindow, matchingMemberIds} from '../sm/list_windows';
import {renderMissingMemberRows} from '../sm/groups';
import {countLabel} from '../sm/index';
import {getOnDemandModel} from './state';
import {getLabels, normalise, selectedClass, requestGuideHighlightRefresh} from './shared';

const text = (label, values) => Object.keys(values).reduce((s, key) =>
    s.replace(new RegExp('__' + key + '__', 'g'), String(values[key])), label || '');

/**
 * Preserve a stable live region during announcements.
 * @param {HTMLElement} root Plugin root.
 * @param {String} message Announcement.
 */
export const announceLongList = (root, message) => {
    let live = root.querySelector('[data-easystud-long-list-live]');
    if (!live) {
        live = document.createElement('div');
        live.className = 'sr-only';
        live.setAttribute('aria-live', 'polite');
        live.setAttribute('aria-atomic', 'true');
        live.setAttribute('data-easystud-long-list-live', '1');
        root.appendChild(live);
    }
    live.textContent = message;
};

/**
 * Keep an existing footer and focused button identity.
 * @param {HTMLElement} owner Card or section.
 * @param {String} kind members or groups.
 * @param {Object} state Complete window counts.
 * @param {Boolean} paged Use section pagination.
 */
export const syncLongListFooter = (owner, kind, state, paged = false) => {
    const root = owner.closest('#local-groupimport-easystud');
    const labels = getLabels(root);
    let footer = owner.querySelector(':scope > [data-easystud-long-list-footer]');
    if (!footer) {
        footer = document.createElement(paged ? 'nav' : 'div');
        footer.setAttribute('data-easystud-long-list-footer', kind);
        const button = (action, classes) => {
            const node = document.createElement('button');
            node.type = 'button';
            node.className = classes;
            node.setAttribute('data-easystud-long-list-action', action);
            return node;
        };
        if (paged) {
            // K16-01 formula C, K17-50: the same pagination bar as the list columns (selection and count,
            // « ‹ 1 / N › », tools). The EasyStud page hooks give the arrows the one flat style; the Kit
            // boxed buttons (data-easyedu-page-*) are no longer used anywhere in EasyStud.
            footer.className = 'local-groupimport-easystud-pagination local-groupimport-easystud-pagination--section';
            const selection = document.createElement('span');
            selection.className = 'local-groupimport-easystud-pagination__selection';
            const select = button('select', 'btn btn-sm btn-outline-secondary local-groupimport-easystud-pagination__select');
            select.appendChild(document.createElement('span'));
            const count = document.createElement('span');
            count.className = 'local-groupimport-easystud-pagination__count';
            count.setAttribute('data-easystud-long-list-count', '1');
            selection.append(select, count);
            const controls = document.createElement('span');
            controls.className = 'local-groupimport-easystud-pagination__controls';
            const pageButton = (action, hook) => {
                const node = button(action, 'btn btn-sm btn-outline-secondary');
                node.setAttribute(hook, '1');
                return node;
            };
            const label = document.createElement('span');
            label.setAttribute('data-easystud-page-label', '1');
            controls.append(pageButton('first', 'data-easystud-page-first'),
                pageButton('previous', 'data-easystud-page-prev'), label,
                pageButton('next', 'data-easystud-page-next'), pageButton('last', 'data-easystud-page-last'));
            const tools = document.createElement('span');
            tools.className = 'local-groupimport-easystud-pagination__tools';
            const size = document.createElement('span');
            size.className = 'local-groupimport-easystud-long-list__per-page';
            size.setAttribute('data-easystud-long-list-per-page', '1');
            tools.append(size);
            footer.append(selection, controls, tools);
        } else {
            footer.className = 'local-groupimport-easystud-long-list';
            const count = document.createElement('span');
            count.setAttribute('data-easystud-long-list-count', '1');
            footer.appendChild(count);
            ['more', 'less', 'all', 'select'].forEach(action => {
                const accent = action === 'more' ? ' easyedu-button--secondary-accent' : '';
                footer.appendChild(button(action, 'easyedu-button easyedu-button--secondary' + accent));
            });
        }
        const selection = owner.querySelector(':scope > [data-easystud-group-select-all-row]');
        owner.insertBefore(footer, selection);
    }
    footer.hidden = paged ? !state.total : state.total <= listPolicy[kind].initial;
    footer.setAttribute('role', paged ? 'navigation' : 'group');
    const title = owner.querySelector(':scope > .local-groupimport-easystud-tree__toggle, ' +
        ':scope > .local-groupimport-easystud-group__header .local-groupimport-easystud-group__name');
    if (title) {
        footer.setAttribute('aria-label', title.textContent.trim());
    }
    footer.setAttribute('data-total', state.total);
    const values = {...state, step: Math.min(listPolicy[kind].step || 0, state.remaining,
        listPolicy[kind].ceiling - state.limit)};
    const count = footer.querySelector('[data-easystud-long-list-count]');
    const buttons = Object.fromEntries(Array.from(footer.querySelectorAll('button')).map(b =>
        [b.getAttribute('data-easystud-long-list-action'), b]));
    if (paged) {
        count.textContent = text(labels.longlistpage, {...values, start: state.total ? (state.page - 1) * state.size + 1 : 0,
            end: Math.min(state.page * state.size, state.total)});
        footer.querySelector('[data-easystud-long-list-per-page]').textContent =
            text(labels.longlistperpage, {size: state.size});
        footer.querySelector('[data-easystud-page-label]').textContent = state.page + ' / ' + state.pages;
        footer.setAttribute('data-pages', state.pages);
        buttons.first.textContent = '«';
        buttons.previous.textContent = '‹';
        buttons.next.textContent = '›';
        buttons.last.textContent = '»';
        buttons.first.setAttribute('aria-label', labels.paginationfirstpage || '');
        buttons.previous.setAttribute('aria-label', labels.longlistprevious || '');
        buttons.next.setAttribute('aria-label', labels.longlistnext || '');
        buttons.last.setAttribute('aria-label', labels.paginationlastpage || '');
        buttons.first.disabled = state.page <= 1;
        buttons.previous.disabled = state.page <= 1;
        buttons.next.disabled = state.page >= state.pages;
        buttons.last.disabled = state.page >= state.pages;
        footer.querySelector('.local-groupimport-easystud-pagination__controls').hidden = state.pages <= 1;
        buttons.select.firstElementChild.textContent = labels.selectall || '';
        buttons.select.hidden = !state.total;
        return;
    }
    count.textContent = text(labels.longlistshown, values);
    buttons.more.hidden = !state.more;
    buttons.more.textContent = text(labels.longlistmore, values);
    buttons.less.hidden = state.limit <= listPolicy[kind].initial;
    buttons.less.textContent = labels.showless || '';
    buttons.less.classList.add('local-groupimport-easystud-long-list__quiet');
    buttons.all.hidden = !state.all;
    buttons.all.textContent = text(labels.longlistall, values);
    buttons.all.setAttribute('data-easystud-open-advanced-settings', '1');
    buttons.all.setAttribute('data-easystud-advanced-target', kind === 'members' ? 'group' : 'grouping');
    buttons.select.hidden = kind !== 'groups';
    buttons.select.textContent = labels.selectall || '';
};

/**
 * Synchronise just the requested member rows.
 * @param {HTMLElement} group Group card.
 * @returns {Boolean} Whether a model owns this card.
 */
export const syncMemberWindow = group => {
    const root = group.closest('#local-groupimport-easystud');
    const model = getOnDemandModel(root);
    const id = Number(group.getAttribute('data-easystud-group-id'));
    if (!root || !model || !model.groups.has(id)) {
        return false;
    }
    const list = group.querySelector('[data-easystud-group-members]');
    if (!list) {
        return false;
    }
    const input = group.querySelector('[data-easystud-group-member-search]');
    const query = normalise(input ? input.value : '');
    if (group.easystudMemberQuery !== query) {
        group.easystudMemberQuery = query;
        group.easystudMemberLimit = listPolicy.members.initial;
    }
    const ids = matchingMemberIds(model, id, query);
    const state = listWindow('members', ids.length, group.easystudMemberLimit);
    // K16-84: a long group no longer opens its member search by itself; the search
    // stays one click away on the card's search action.
    const toggle = group.querySelector('[data-easystud-group-members-toggle]');
    const ungrouped = !!group.closest('.local-groupimport-easystud-tree__section--ungrouped');
    const folded = ungrouped && toggle && toggle.getAttribute('aria-expanded') !== 'true';
    group.setAttribute('data-easystud-member-total', model.groups.get(id).memberids.length);
    group.setAttribute('data-easystud-sm-members-partial', '1');
    renderMissingMemberRows(model, group, folded ? [] : ids.slice(0, state.shown));
    list.hidden = !!folded;
    list.classList.remove('has-extra-members');
    list.classList.add('is-expanded', 'local-groupimport-easystud-long-list__members');
    list.querySelectorAll('[data-easystud-member-id]').forEach(row => {
        row.hidden = false;
        row.classList.remove('is-collapsed', 'local-groupimport-easystud-member--extra');
        const selected = model.selectedMembers.has(row.getAttribute('data-selectable-id'));
        row.classList.toggle(selectedClass, selected);
        row.querySelector('input[type="checkbox"]').checked = selected;
    });
    group.querySelectorAll('[data-easystud-group-members-toggle], [data-easystud-group-members-more]')
        .forEach(button => {
            button.hidden = true;
        });
    syncLongListFooter(group, 'members', state);
    if (ungrouped && toggle) {
        group.classList.add('local-groupimport-easystud-long-list__foldable');
        toggle.hidden = false;
        const footer = group.querySelector(':scope > [data-easystud-long-list-footer]');
        footer.hidden = !!folded || state.total <= listPolicy.members.initial;
        const select = group.querySelector('[data-easystud-group-select-all-row]');
        if (select) {
            select.hidden = !!folded;
        }
    }
    return true;
};

/**
 * Normalise a metadata value and discard empty or sentinel values.
 * @param {*} value Raw metadata value.
 * @returns {String} Trimmed value, or an empty string for a sentinel.
 */
export const normaliseTagValue = value => {
    const text = String(value ?? '').trim();
    return text && !['-', '\u2212', '\u2014'].includes(text) ? text : '';
};

// Supply only the window policy; cards owns shared token rendering and overflow.
export const syncTagWindow = container => {
    const serialized = container.getAttribute('data-easystud-long-tags');
    if (!serialized) {
        return null;
    }
    const items = JSON.parse(serialized).map(normaliseTagValue).filter(Boolean);
    const toggle = container.querySelector('[data-easystud-toggle-tags]');
    const expanded = toggle && toggle.getAttribute('data-expanded') === '1';
    const viewAll = items.length > listPolicy.tags.ceiling;
    return {items, total: items.length, viewAll,
        limit: expanded && !viewAll ? items.length : listPolicy.tags.initial};
};

/**
 * Bind controls once; refresh callbacks stay in their owning controller.
 * @param {HTMLElement} root Plugin root.
 * @param {Object} handlers Controller callbacks.
 */
export const bindLongLists = (root, handlers) => {
    root.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-long-list-action]');
        if (!button || !root.contains(button)) {
            return;
        }
        event.preventDefault();
        const footer = button.closest('[data-easystud-long-list-footer]');
        if (!footer) {
            // Participant disclosure uses the existing deferred-details opener.
            return;
        }
        const owner = footer.parentElement;
        const kind = footer.getAttribute('data-easystud-long-list-footer');
        const action = button.getAttribute('data-easystud-long-list-action');
        if (action === 'all' || action === 'select') {
            handlers[action](owner, kind, button);
            return;
        }
        const list = owner.querySelector(kind === 'members' ? '[data-easystud-group-members]' :
            '[data-easystud-container-group-list]');
        const selector = kind === 'members' ? '[data-easystud-member-id]' : '[data-easystud-group-id]';
        const before = Array.from(list.querySelectorAll(':scope > ' + selector));
        const identity = row => row.getAttribute(kind === 'members' ? 'data-easystud-member-id' : 'data-easystud-group-id');
        const previous = new Set(before.map(identity));
        const prop = kind === 'members' ? 'easystudMemberLimit' : 'easystudGroupLimit';
        owner[prop] = action === 'less' ? listPolicy[kind].initial :
            Math.min((owner[prop] || listPolicy[kind].initial) + listPolicy[kind].step, listPolicy[kind].ceiling);
        if (action === 'next' || action === 'previous') {
            owner.easystudGroupPage = (owner.easystudGroupPage || 1) + (action === 'next' ? 1 : -1);
        } else if (action === 'first') {
            owner.easystudGroupPage = 1;
        } else if (action === 'last') {
            owner.easystudGroupPage = Number(footer.getAttribute('data-pages')) || 1;
        }
        let arrivals = [];
        void Motion.resize(list, () => {
            handlers[kind](owner);
            if (action !== 'less') {
                arrivals = Array.from(list.querySelectorAll(':scope > ' + selector))
                    .filter(node => !previous.has(identity(node)))
                    .map(node => Motion.enter(node, {distance: '0px', duration: Motion.timing.fast}));
            }
        }, {duration: Motion.timing.normal}).then(async() => {
            await Promise.all(arrivals);
            const rows = Array.from(list.querySelectorAll(':scope > ' + selector));
            const row = action === 'less' ? rows[0] : rows.find(node => !previous.has(identity(node)));
            const target = row && row.querySelector('input[type="checkbox"], button, a[href]');
            if (target) {
                target.focus({preventScroll: true});
                if (action === 'less') {
                    owner.scrollIntoView({block: 'start', behavior: 'auto'});
                }
            }
            const added = rows.filter(node => !previous.has(identity(node))).length;
            const labels = getLabels(root);
            const message = countLabel(labels['longlistadded' + kind], added);
            announceLongList(root, added ? message : footer.querySelector('[data-easystud-long-list-count]').textContent);
            requestGuideHighlightRefresh(root);
            return true;
        });
    });
};
