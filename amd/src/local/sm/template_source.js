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
 * Single chokepoint for fetching a raw Mustache template source string.
 *
 * `sm/groups` and `sm/participants` build many cards (group catalog entries, participant
 * rows) from the same compiled template, synchronously, without a per-card render round
 * trip. That needs the raw template source once, parsed once with `core/mustache`, then
 * rendered directly for every card. Moodle's only public client API (`core/templates`,
 * `Templates.render` / `renderForPromise`) does not expose that: each call does a full
 * render (HTML + JS) from a context and returns a Promise, with no supported way to get
 * back the compiled source for repeated synchronous use.
 *
 * The only way to get the raw source client-side is `core/local/templates/loader`
 * (`Loader.getTemplate`), a `core/local/*` module: not documented for plugin use and not
 * covered by Moodle HQ's API compatibility guarantee (Moodle could change or remove it
 * without notice, unlike a documented public API).
 *
 * 20261023 (11bis API audit): checked byte-for-byte identical across local copies of the
 * three certification targets (4.5 LTS, 5.1, 5.3) — see
 * RAPPORT-API-INTERNE-MOODLE-20261023.md in the review folder for the comparison and the
 * decision to keep using it (accepted, documented risk; no public equivalent exists).
 * Importing it only here, instead of directly from both `sm/groups` and `sm/participants`,
 * means a future Moodle break only needs a fix in this one file.
 *
 * @module     local_groupimport/local/sm/template_source
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import Loader from 'core/local/templates/loader';

/**
 * Fetch a template's raw Mustache source (fetched once, Moodle's own loader caches it).
 *
 * @param {String} templateName Template name, e.g. 'local_groupimport/sm/group_card'.
 * @returns {Promise<String>} The raw Mustache source.
 */
export const getTemplateSource = templateName => Loader.getTemplate(templateName);
