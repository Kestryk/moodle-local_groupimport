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
 * Starts the shared Guide from the page's JSON configuration element (Mass Import).
 *
 * Moodle adapter only: the configuration travels in a JSON script element, never as
 * inline AMD call arguments (K16-21).
 *
 * @module     local_groupimport/guide_bootstrap
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
define(['local_groupimport/easyedu_guide'], function(Guide) {
    const init = configId => {
        const element = document.getElementById(configId);
        if (!element) {
            throw new Error('Guide configuration is missing.');
        }
        if (element.dataset.initialized === '1') {
            return;
        }
        const config = JSON.parse(element.textContent);
        if (!Array.isArray(config.guide)) {
            throw new Error('Guide configuration is invalid.');
        }
        element.dataset.initialized = '1';
        Guide.init(...config.guide);
    };
    return {init: init};
});
