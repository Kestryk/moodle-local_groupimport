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
 * Shared EasyStud Guide path-completion emitter (X9: single definition for
 * emitNativePathCompletion). Dependency-free on purpose so it can be imported from the
 * lightweight Mass Import Guide adapter as well as the course manager Guide hooks.
 *
 * @module     local_groupimport/local/guide_path_completion
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Emit only the next unfinished milestone in the distinct path. Presentation/highlights
// never call business commands or reuse broad legacy completion events.
export const emitNativePathCompletion = (root, path, step) => {
    const checklist = document.querySelector(
        '[data-easyedu-guide-checklist][data-easyedu-guide-path="' + path + '"]'
    );
    if (!checklist || checklist.hidden || !root.isConnected) {
        return;
    }
    const next = checklist.querySelector('[data-easyedu-guide-step-id]:not(.is-complete)');
    if (!next || next.disabled || next.getAttribute('data-easyedu-guide-step-id') !== step) {
        return;
    }
    root.dispatchEvent(new CustomEvent('easyedu:guide-step-complete', {
        bubbles: true,
        detail: {path, step},
    }));
};
