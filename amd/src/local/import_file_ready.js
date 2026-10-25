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
 * Shared EasyStud Mass Import file-picker readiness check (X9: single definition for
 * isImportFileReady). Dependency-free on purpose.
 *
 * @module     local_groupimport/local/import_file_ready
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// A draft item ID is allocated before any file exists. Only Moodle's completed filename
// callback certifies this single-file picker; raw local files and a progress bar must not
// submit the preview form while an upload is in flight.
export const isImportFileReady = deposit => {
    const filename = deposit ? deposit.querySelector('.filepicker-filename a') : null;
    return Boolean(filename && filename.textContent.trim() &&
        !deposit.querySelector('.dndupload-inprogress'));
};
