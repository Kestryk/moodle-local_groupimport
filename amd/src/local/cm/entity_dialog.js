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
 * EasyStud course manager: shared body of the card detail dialogs ("entity dialog").
 *
 * T048 / K18 (Kevin 16/10/2026, decision no. 6, Penpot S6-D5a/b/c): participant, group and
 * grouping details share one structure: 1 identity (56px visual, name, context line),
 * 2 information (two-column fields), 3 relations (identical disclosure sections with a
 * counter and a CSV text action; members as related-person rows, other relations as
 * 22px pills, 8 visible then "+N", never an inner scroll), 4 image (groups only).
 * Every value is escaped here; callers pass trusted Moodle HTML only as visualHtml.
 *
 * @module     local_groupimport/local/cm/entity_dialog
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {countLabel} from '../sm/index';
import {escapeHtml} from './shared';

const prefix = 'local-groupimport-easystud-entity';

/** Relations show this many items, then a "+N" reveal (no inner scroll). */
export const visibleRelationLimit = 8;

/** A skeleton only appears when the answer takes longer than this (no flash). */
const skeletonDelay = 150;

let listSequence = 0;

/**
 * One body section: quiet uppercase caption, then its content.
 *
 * @param {String} caption Section caption.
 * @param {String} content Section HTML.
 * @param {String} modifier Section modifier (information, relations, image).
 * @returns {String}
 */
export const entitySection = (caption, content, modifier) =>
    '<section class="' + prefix + '__section ' + prefix + '__section--' + escapeHtml(modifier) + '">' +
        '<h4 class="' + prefix + '__caption">' + escapeHtml(caption) + '</h4>' +
        content +
    '</section>';

/**
 * Identity block: entity rail, 56px visual, name and context line.
 *
 * @param {String} kind participant, group or grouping.
 * @param {String} visualHtml Trusted visual HTML (Moodle user_picture or a decorative icon).
 * @param {String} name Entity name.
 * @param {String} context Context line (e-mail, counts).
 * @returns {String}
 */
export const entityIdentity = (kind, visualHtml, name, context) =>
    '<div class="' + prefix + '__identity ' + prefix + '__identity--' + escapeHtml(kind) + '">' +
        '<div class="' + prefix + '__visual" aria-hidden="true">' + visualHtml + '</div>' +
        '<div class="' + prefix + '__identity-text">' +
            '<p class="' + prefix + '__name">' + escapeHtml(name) + '</p>' +
            (context ? '<p class="' + prefix + '__context">' + escapeHtml(context) + '</p>' : '') +
        '</div>' +
    '</div>';

/**
 * Decorative icon used as the 56px visual of a group or a grouping.
 *
 * @param {String} icon Font Awesome class.
 * @returns {String}
 */
export const entityIcon = icon => '<span class="fa ' + escapeHtml(icon) + '" aria-hidden="true"></span>';

/**
 * Read-only field (participant information).
 *
 * @param {String} label Field label.
 * @param {String} value Field value; an empty value renders nothing.
 * @returns {String}
 */
export const entityReadonlyField = (label, value) => {
    if (!value) {
        return '';
    }
    return '<div class="' + prefix + '__field">' +
        '<dt>' + escapeHtml(label) + '</dt>' +
        '<dd>' + escapeHtml(value) + '</dd>' +
    '</div>';
};

/**
 * Skeleton of one field, at the geometry of the final field.
 *
 * @param {String} variant value (read-only text), control (38px field) or area (textarea).
 * @param {Boolean} wide Whether the field spans both columns.
 * @param {String} tag Wrapper element.
 * @returns {String}
 */
export const entitySkeletonField = (variant = 'value', wide = false, tag = 'div') =>
    '<' + tag + ' class="' + prefix + '__field ' + prefix + '__field--skeleton' +
            (wide ? ' ' + prefix + '__field--wide' : '') + '" aria-hidden="true">' +
        '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--label"></span>' +
        '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--' + escapeHtml(variant) + '"></span>' +
    '</' + tag + '>';

/**
 * Skeleton of one relation section (title row, then a row of items).
 *
 * @param {String} variant pills or rows.
 * @returns {String}
 */
export const entitySkeletonRelation = (variant = 'pills') =>
    '<div class="' + prefix + '__relation ' + prefix + '__relation--skeleton" aria-hidden="true">' +
        '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--title"></span>' +
        (variant === 'rows' ?
            '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--row"></span>' +
            '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--row"></span>' :
            '<span class="' + prefix + '__skeleton ' + prefix + '__skeleton--pills"></span>') +
    '</div>';

/**
 * Items beyond the visible limit are hidden behind one reveal control.
 *
 * @param {Number} index Item index.
 * @returns {String}
 */
const extraAttribute = index => index >= visibleRelationLimit ? ' hidden data-easystud-entity-extra="1"' : '';

/**
 * Reveal control shown after the visible items.
 *
 * @param {Number} extra Hidden item count.
 * @param {String} moreLabel Collapsed label.
 * @param {String} lessLabel Expanded label.
 * @param {String} listId Controlled list id.
 * @param {String} className Button classes.
 * @returns {String}
 */
const moreButton = (extra, moreLabel, lessLabel, listId, className) =>
    '<button type="button" class="' + className + '" data-easystud-entity-more="1" aria-expanded="false" ' +
        'aria-controls="' + escapeHtml(listId) + '" data-easystud-more-label="' + escapeHtml(moreLabel) + '" ' +
        'data-easystud-less-label="' + escapeHtml(lessLabel) + '">' + escapeHtml(moreLabel) + '</button>';

/**
 * Related objects as 22px pills: 8 visible, then "+N".
 *
 * @param {String[]} values Names.
 * @param {String} tone role, group or grouping.
 * @param {Object} options {lessLabel, emptyLabel}.
 * @returns {String}
 */
export const entityPills = (values, tone, options = {}) => {
    const entries = (values || []).filter(Boolean);
    if (!entries.length) {
        return '<p class="' + prefix + '__empty">' + escapeHtml(options.emptyLabel || '') + '</p>';
    }
    const listId = prefix + '-list-' + (++listSequence);
    const extra = entries.length - visibleRelationLimit;
    return '<ul class="' + prefix + '__pills" id="' + listId + '">' +
        entries.map((value, index) => '<li class="' + prefix + '__pill ' + prefix + '__pill--' + escapeHtml(tone) + '"' +
            extraAttribute(index) + '>' + escapeHtml(value) + '</li>').join('') +
        (extra > 0 ? '<li class="' + prefix + '__pill-more">' +
            moreButton(extra, '+' + extra, options.lessLabel || '', listId,
                prefix + '__pill ' + prefix + '__pill--more') + '</li>' : '') +
    '</ul>';
};

/**
 * Members as related-person rows: 8 visible, then "+ N other members".
 *
 * @param {Object[]} rows {name, email}.
 * @param {Object} options {moreTemplate, lessLabel, emptyLabel}.
 * @returns {String}
 */
export const entityMemberRows = (rows, options = {}) => {
    if (!rows.length) {
        return '<p class="' + prefix + '__empty">' + escapeHtml(options.emptyLabel || '') + '</p>';
    }
    const listId = prefix + '-list-' + (++listSequence);
    const extra = rows.length - visibleRelationLimit;
    return '<ul class="' + prefix + '__members" id="' + listId + '">' +
            rows.map((row, index) => '<li class="easyedu-related-person-row ' + prefix + '__member"' +
                extraAttribute(index) + '>' +
                '<span class="easyedu-related-person-row__name">' + escapeHtml(row.name) + '</span>' +
                (row.email ? '<span class="' + prefix + '__member-meta">' + escapeHtml(row.email) + '</span>' : '') +
            '</li>').join('') +
        '</ul>' +
        (extra > 0 ? moreButton(extra, countLabel(options.moreTemplate || '', extra), options.lessLabel || '', listId,
            prefix + '__text-action ' + prefix + '__more') : '');
};

/**
 * Hidden CSV table read by the existing export (formula-protected cells).
 *
 * @param {Object[]} rows Rows.
 * @param {Object[]} columns {key, label}.
 * @returns {String}
 */
const exportTable = (rows, columns) =>
    '<table hidden>' +
        '<thead><tr>' + columns.map(column => '<th>' + escapeHtml(column.label) + '</th>').join('') + '</tr></thead>' +
        '<tbody>' + rows.map(row => '<tr>' + columns.map(column => '<td>' + escapeHtml(row[column.key] || '') + '</td>')
            .join('') + '</tr>').join('') + '</tbody>' +
    '</table>';

/**
 * One relation disclosure section: chevron, title, counter pill, CSV text action.
 *
 * The native details element keeps the existing disclosure Motion (bindAnimatedDetails)
 * and the data-easystud-settings-list-section hooks of the CSV export.
 *
 * @param {Object} section {title, countText, content, rows, columns, exportName, exportLabel, type}.
 * @returns {String}
 */
// Kevin 16/10 no. 15: the section counters are 22px pills in the tone of their relation.
const countTones = {role: 'role', group: 'group', groups: 'group', members: 'group', grouping: 'grouping', groupings: 'grouping'};

export const entityRelationSection = section => {
    const rows = section.rows || [];
    const csv = !!section.columns;
    return '<details class="' + prefix + '__relation ' + prefix + '__relation--' + escapeHtml(section.type || 'default') +
            '" data-easystud-settings-list-section="1"' +
            (csv ? ' data-easystud-settings-export-name="' + escapeHtml(section.exportName || 'easystud-export.csv') + '"' : '') +
            ' open>' +
        '<summary class="' + prefix + '__relation-summary">' +
            '<span class="' + prefix + '__relation-chevron fa fa-chevron-up" aria-hidden="true"></span>' +
            '<span class="' + prefix + '__relation-title">' + escapeHtml(section.title) + '</span>' +
            '<span class="' + prefix + '__relation-count ' + prefix + '__pill ' + prefix + '__pill--' +
                escapeHtml(countTones[section.type] || 'empty') + '">' + escapeHtml(section.countText) + '</span>' +
            (csv ? '<button type="button" class="' + prefix + '__text-action ' + prefix + '__csv" ' +
                'data-easystud-settings-export="1" aria-label="' + escapeHtml(section.exportLabel || 'CSV') + '"' +
                (rows.length ? '' : ' disabled') + '>CSV</button>' : '') +
        '</summary>' +
        '<div class="' + prefix + '__relation-body">' +
            section.content +
            (csv && rows.length ? exportTable(rows, section.columns) : '') +
        '</div>' +
    '</details>';
};

/**
 * Error state of a dialog body: Kit warning notice and a retry action.
 *
 * @param {String} message Message.
 * @param {String} retryLabel Retry button label.
 * @returns {String}
 */
export const entityErrorNotice = (message, retryLabel) =>
    '<div class="easyedu-notice easyedu-notice--warning ' + prefix + '__error" role="alert">' +
        '<span class="fa fa-exclamation-triangle" aria-hidden="true"></span>' +
        '<div class="' + prefix + '__error-copy">' +
            '<p>' + escapeHtml(message) + '</p>' +
            '<button type="button" class="btn easyedu-button--secondary ' + prefix + '__retry" ' +
                'data-easystud-entity-retry="1">' + escapeHtml(retryLabel) + '</button>' +
        '</div>' +
    '</div>';

/**
 * Count label from a "one|other" template, or an empty string.
 *
 * @param {String} template Template.
 * @param {Number} count Count.
 * @returns {String}
 */
export const entityCount = (template, count) => template ? countLabel(template, count) : '';

/**
 * Loading state of a body: busy region, skeleton revealed after 150ms only.
 *
 * @param {HTMLElement} body Dialog body.
 * @returns {Function} Call it when the data has arrived (or failed).
 */
export const startEntityLoading = body => {
    body.setAttribute('aria-busy', 'true');
    body.classList.add('is-entity-loading');
    const timer = window.setTimeout(() => body.classList.add('is-entity-skeleton-visible'), skeletonDelay);
    return () => {
        window.clearTimeout(timer);
        body.removeAttribute('aria-busy');
        body.classList.remove('is-entity-loading', 'is-entity-skeleton-visible');
    };
};

/**
 * Footer actions that need the loaded data stay visible but disabled while loading.
 * Close and Cancel never wait: Escape and Cancel work during loading.
 *
 * @param {HTMLElement} container Dialog or footer.
 * @param {Boolean} busy Whether the data is still loading.
 */
export const setEntityFooterBusy = (container, busy) => {
    container.querySelectorAll('[data-easystud-entity-await]').forEach(action => {
        if (action.tagName === 'A') {
            if (busy) {
                action.setAttribute('aria-disabled', 'true');
                action.setAttribute('tabindex', '-1');
            } else {
                action.removeAttribute('aria-disabled');
                action.removeAttribute('tabindex');
            }
            action.classList.toggle('is-disabled', busy);
        } else {
            action.disabled = busy;
        }
    });
};

/**
 * Bind the "+N" reveal controls of one dialog once (delegated on the dialog).
 *
 * @param {HTMLElement} container Dialog element.
 */
export const bindEntityReveal = container => {
    if (!container || container.dataset.easystudEntityRevealBound === '1') {
        return;
    }
    container.dataset.easystudEntityRevealBound = '1';
    container.addEventListener('click', event => {
        const button = event.target.closest('[data-easystud-entity-more]');
        if (!button || !container.contains(button)) {
            return;
        }
        event.preventDefault();
        const list = document.getElementById(button.getAttribute('aria-controls') || '');
        if (!list) {
            return;
        }
        const open = button.getAttribute('aria-expanded') !== 'true';
        list.querySelectorAll('[data-easystud-entity-extra]').forEach(item => {
            item.hidden = !open;
            if (open) {
                Motion.enter(item, {duration: Motion.timing.fast, distance: '0.12rem'});
            }
        });
        button.setAttribute('aria-expanded', open ? 'true' : 'false');
        button.textContent = open ? (button.getAttribute('data-easystud-less-label') || '') :
            (button.getAttribute('data-easystud-more-label') || '');
    });
};
