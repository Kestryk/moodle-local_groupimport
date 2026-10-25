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
 * Shared EasyStud count-label formatter (X9: single definition for countLabel).
 *
 * @module     local_groupimport/local/count_label
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

/**
 * Fill a count template: '__count__' (or '{$a}') stands for the count, and a template made by
 * local_groupimport_count_string()/local_groupimport_count_template() carries its singular form
 * first, before a '|'. The page language decides the form (CLDR rules: in French 0 and 1 are
 * singular).
 *
 * @param {String} template Count template.
 * @param {Number} count Count.
 * @returns {String}
 */
export const countLabel = (template, count) => {
    const forms = String(template || '').split('|');
    let singular = count === 1;
    try {
        singular = new Intl.PluralRules(document.documentElement.lang || undefined).select(count) === 'one';
    } catch (error) {
        // Unknown language tag: keep the English rule.
    }
    const form = forms.length > 1 && singular ? forms[0] : forms[forms.length - 1];
    return form.replace('__count__', String(count)).replace('{$a}', String(count));
};
