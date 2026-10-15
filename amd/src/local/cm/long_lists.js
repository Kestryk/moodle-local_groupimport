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
import {getLabels, normalise, selectedClass, requestGuideHighlightRefresh, isResponsiveWorkspace} from './shared';

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
        footer = document.createElement('div');
        footer.className = 'local-groupimport-easystud-long-list';
        footer.setAttribute('data-easystud-long-list-footer', kind);
        const count = document.createElement('span');
        count.setAttribute('data-easystud-long-list-count', '1');
        footer.appendChild(count);
        ['more', 'less', 'all', 'previous', 'next', 'select'].forEach(action => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'easyedu-button easyedu-button--secondary';
            button.setAttribute('data-easystud-long-list-action', action);
            footer.appendChild(button);
        });
        const selection = owner.querySelector(':scope > [data-easystud-group-select-all-row]');
        owner.insertBefore(footer, selection);
    }
    footer.hidden = state.total <= listPolicy[kind].initial && !paged;
    footer.setAttribute('role', paged ? 'navigation' : 'group');
    const title = owner.querySelector(':scope > .local-groupimport-easystud-tree__toggle, ' +
        ':scope > .local-groupimport-easystud-group__header .local-groupimport-easystud-group__name');
    if (title) {
        footer.setAttribute('aria-label', title.textContent.trim());
    }
    footer.setAttribute('data-total', state.total);
    const values = {...state, step: Math.min(listPolicy[kind].step || 0, state.remaining,
        listPolicy[kind].ceiling - state.limit)};
    footer.querySelector('[data-easystud-long-list-count]').textContent = text(labels.longlistshown, values);
    const buttons = Object.fromEntries(Array.from(footer.querySelectorAll('button')).map(b =>
        [b.getAttribute('data-easystud-long-list-action'), b]));
    buttons.more.hidden = paged || !state.more;
    buttons.more.textContent = text(labels.longlistmore, values);
    buttons.less.hidden = paged || state.limit <= listPolicy[kind].initial;
    buttons.less.textContent = labels.showless || '';
    buttons.less.classList.add('local-groupimport-easystud-long-list__quiet');
    buttons.all.hidden = paged || !state.all;
    buttons.all.textContent = text(labels.longlistall, values);
    buttons.all.setAttribute('data-easystud-open-advanced-settings', '1');
    buttons.all.setAttribute('data-easystud-advanced-target', kind === 'members' ? 'group' : 'grouping');
    buttons.previous.hidden = buttons.next.hidden = !paged;
    buttons.previous.textContent = '‹';
    buttons.next.textContent = '›';
    buttons.previous.setAttribute('aria-label', labels.longlistprevious || '');
    buttons.next.setAttribute('aria-label', labels.longlistnext || '');
    buttons.previous.disabled = state.page <= 1;
    buttons.next.disabled = state.page >= state.pages;
    buttons.select.hidden = kind !== 'groups';
    buttons.select.textContent = labels.selectall || '';
    footer.classList.toggle('local-groupimport-easystud-pagination', paged);
    if (paged) {
        footer.querySelector('[data-easystud-long-list-count]').textContent =
            text(labels.longlistpage, {...values, start: state.total ? (state.page - 1) * state.size + 1 : 0,
                end: Math.min(state.page * state.size, state.total)});
    }
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
    const panel = input ? input.closest('[data-easystud-group-member-search-panel]') : null;
    if (panel && model.groups.get(id).memberids.length >= listPolicy.members.search && !group.easystudLongSearchReady) {
        group.easystudLongSearchReady = true;
        panel.hidden = false;
        panel.classList.add('is-open');
    }
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
        const header = group.querySelector('.local-groupimport-easystud-group__header');
        if (header && toggle.parentElement !== header) {
            header.prepend(toggle);
        }
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
 * Measure one compact prefix, reserving the visible +N target.
 * @param {HTMLElement} container Metadata row.
 * @param {HTMLElement|null} toggle Native disclosure target.
 * @param {String[]} items Full label payload.
 * @param {Boolean} expanded Current disclosure state.
 * @returns {Number|null} Compact budget, or no compact adjustment.
 */
const compactTagLimit = (container, toggle, items, expanded) => {
    if (expanded || !toggle || !isResponsiveWorkspace() || container.clientWidth < 1) {
        return null;
    }
    const tokens = Array.from(container.querySelectorAll('span.local-groupimport-easystud-token'));
    toggle.hidden = false;
    toggle.textContent = '+' + items.length;
    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const available = container.clientWidth;
    const widths = tokens.map(token => token.getBoundingClientRect().width);
    const allWidth = widths.reduce((sum, width) => sum + width + gap, -gap);
    let used = allWidth <= available && items.length <= listPolicy.tags.initial ? 0 :
        toggle.getBoundingClientRect().width + gap;
    let fitted = 0;
    widths.forEach((width, index) => {
        if (fitted === index && used + width <= available) {
            used += width + gap;
            fitted++;
        }
    });
    const limit = Math.max(1, fitted);
    tokens.slice(limit).forEach(token => token.remove());
    container.style.setProperty('--local-groupimport-long-tag-tail',
        Math.ceil(toggle.getBoundingClientRect().width + gap) + 'px');
    return limit;
};

/**
 * Render six desktop tokens, one compact line or the bounded expanded set.
 * @param {HTMLElement} container Metadata row.
 * @returns {Boolean} Whether this is a windowed row.
 */
export const syncTagWindow = container => {
    const serialized = container.getAttribute('data-easystud-long-tags');
    if (!serialized) {
        return false;
    }
    const items = JSON.parse(serialized);
    let toggle = container.querySelector('[data-easystud-toggle-tags]');
    if (!toggle && items.length > 1) {
        toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'btn btn-link p-0 local-groupimport-easystud-tags-toggle local-groupimport-easystud-token';
        toggle.setAttribute('data-easystud-toggle-tags', '1');
        toggle.setAttribute('data-less-label', getLabels(container.closest('#local-groupimport-easystud')).showless || '');
        container.appendChild(toggle);
    }
    const expanded = toggle && toggle.getAttribute('data-expanded') === '1';
    container.setAttribute('data-easystud-tags-window', expanded ? 'expanded' : 'collapsed');
    if (toggle) {
        toggle.classList.add(...(container.getAttribute('data-easystud-token-class') || '').split(' ').filter(Boolean));
    }
    let limit = expanded && items.length <= listPolicy.tags.ceiling ? items.length : listPolicy.tags.initial;
    const known = Array.from(container.querySelectorAll('span.local-groupimport-easystud-token'));
    items.slice(0, limit).forEach((item, index) => {
        let token = known[index];
        if (!token) {
            token = document.createElement('span');
            token.className = container.getAttribute('data-easystud-token-class');
            container.insertBefore(token, toggle);
        }
        token.textContent = item;
        token.hidden = false;
    });
    known.slice(limit).forEach(token => token.remove());
    const compact = compactTagLimit(container, toggle, items, expanded);
    if (compact !== null) {
        limit = compact;
    }
    if (toggle) {
        toggle.hidden = !expanded && items.length <= limit;
        toggle.textContent = expanded ? toggle.getAttribute('data-less-label') : '+' + (items.length - limit);
        toggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        toggle.setAttribute('aria-label', items.length > listPolicy.tags.ceiling ?
            text(getLabels(container.closest('#local-groupimport-easystud')).longlistall, {total: items.length}) :
            toggle.textContent);
        if (items.length > listPolicy.tags.ceiling) {
            toggle.setAttribute('data-easystud-open-user', container.closest('[data-easystud-user]')
                .getAttribute('data-user-id'));
        }
    }
    return true;
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
