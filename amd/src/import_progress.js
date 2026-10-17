// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle. If not, see <https://www.gnu.org/licenses/>.

/**
 * Private progress in existing Kit panel text, with no additional visual recipe.
 * @module local_groupimport/import_progress
 * @copyright 2026 Kevin Jarniac
 * @license https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */
import Config from 'core/config';

/**
 * Poll only while the current document owns the progress panel.
 * @param {Object} labels Translated states and connection failure.
 */
export const init = labels => {
    const root = document.querySelector('[data-import-job]');
    const output = root?.querySelector('[data-import-job-state]');
    if (!output) {
        return;
    }
    let timer = null;
    const controller = new AbortController();
    window.addEventListener('pagehide', () => {
        clearTimeout(timer);
        controller.abort();
    }, {once: true});
    const poll = async() => {
        try {
            const response = await fetch(Config.wwwroot + '/local/groupimport/import_progress.php', {
                method: 'POST', credentials: 'same-origin', signal: controller.signal,
                body: new URLSearchParams({id: root.dataset.courseId, jobid: root.dataset.importJob, sesskey: Config.sesskey}),
            });
            if (!response.ok) {
                throw new Error('progress-unavailable');
            }
            const data = await response.json();
            if (data.error || !Object.prototype.hasOwnProperty.call(labels, data.status)) {
                throw new Error('progress-unavailable');
            }
            output.textContent = `${labels[data.status]} ${data.processed} / ${data.total}`;
            root.dataset.importJobStatus = data.status;
            if (!data.complete) {
                timer = setTimeout(poll, 2000);
            }
        } catch (error) {
            if (!controller.signal.aborted) {
                output.textContent = labels.unavailable;
                root.dataset.importJobStatus = 'unavailable';
            }
        }
    };
    poll();
};
