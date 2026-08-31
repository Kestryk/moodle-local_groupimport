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
 * EasyStud navigation integration for Moodle course participant menus.
 *
 * @module     local_groupimport/navigation
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Parse a URL safely.
const parseUrl = value => {
    try {
        return new URL(value, window.location.origin);
    } catch (error) {
        return null;
    }
};

// Check whether the URL is the native participants page for the current course.
const isNativeParticipantsUrl = (url, courseId) => {
    if (!url) {
        return false;
    }
    return url.pathname.endsWith('/user/index.php') &&
        url.searchParams.get('id') === courseId.toString() &&
        url.searchParams.get('local_groupimport_native') !== '1';
};

// Check whether a URL is the explicit Moodle participants page bypassing EasyStud.
const isExplicitNativeParticipantsUrl = (url, courseId) => {
    if (!url) {
        return false;
    }
    return url.pathname.endsWith('/user/index.php') &&
        url.searchParams.get('id') === courseId.toString() &&
        url.searchParams.get('local_groupimport_native') === '1';
};

// Check whether a URL points at any Moodle enrolled users page for the current course.
const isAnyParticipantsUrl = (url, courseId) => {
    return isNativeParticipantsUrl(url, courseId) || isExplicitNativeParticipantsUrl(url, courseId);
};

// Redirect old/native participant entry points to EasyStud unless the native view was explicitly requested.
const redirectNativeParticipantsPage = (courseId, managerUrl) => {
    const current = parseUrl(window.location.href);
    if (isNativeParticipantsUrl(current, courseId)) {
        window.location.replace(managerUrl);
    }
};

// Replace the visible course Participants tab/link with the EasyStud manager URL.
const replaceSecondaryParticipantsLinks = (courseId, managerUrl) => {
    document.querySelectorAll('.secondary-navigation a[href], .moremenu a[href], a[data-key="participants"][href]').forEach(link => {
        const url = parseUrl(link.getAttribute('href'));
        if (isNativeParticipantsUrl(url, courseId)) {
            link.setAttribute('href', managerUrl);
        }
    });
};

// Add EasyStud as the first option in Moodle's participant tertiary menu.
const enhanceParticipantsDropdown = (courseId, managerUrl, nativeParticipantsUrl, managerLabel, nativeParticipantsLabel) => {
    const input = document.querySelector('input[name="participantsnavigation"]');
    if (!input) {
        return;
    }

    const menu = input.closest('.dropdown.select-menu');
    const listbox = menu ? menu.querySelector('[role="listbox"]') : null;
    const firstGroup = listbox ? listbox.querySelector('ul[role="group"]') : null;
    if (!menu || !firstGroup) {
        return;
    }

    const nativeOptions = Array.from(listbox.querySelectorAll('[role="option"][data-value]')).filter(option => {
        const url = parseUrl(option.getAttribute('data-value'));
        return isAnyParticipantsUrl(url, courseId);
    });
    const nativeOption = nativeOptions[0] || document.createElement('li');
    nativeOptions.slice(1).forEach(option => option.remove());

    nativeOption.className = 'dropdown-item';
    nativeOption.setAttribute('role', 'option');
    nativeOption.setAttribute('data-value', nativeParticipantsUrl);
    nativeOption.setAttribute('data-local-groupimport-native-option', '1');
    nativeOption.textContent = nativeParticipantsLabel || '';
    nativeOption.onclick = event => {
        event.preventDefault();
        window.location.href = nativeParticipantsUrl;
    };

    if (isAnyParticipantsUrl(parseUrl(input.value), courseId)) {
        input.value = nativeParticipantsUrl;
    }

    let option = firstGroup.querySelector('[data-local-groupimport-easystud-option]');
    if (!option) {
        option = document.createElement('li');
        option.className = 'dropdown-item';
        option.setAttribute('role', 'option');
        option.setAttribute('data-value', managerUrl);
        option.setAttribute('data-local-groupimport-easystud-option', '1');
        option.addEventListener('click', event => {
            event.preventDefault();
            window.location.href = managerUrl;
        });
    }
    option.textContent = managerLabel;

    const groupLabel = firstGroup.querySelector('li[role="presentation"]');
    const insertBeforeNode = groupLabel ? groupLabel.nextSibling : null;
    firstGroup.insertBefore(option, insertBeforeNode);
    firstGroup.insertBefore(nativeOption, option.nextSibling);
};

// Navigate when a participant navigation select_menu option is chosen.
const bindParticipantsNavigationSelector = () => {
    document.addEventListener('click', event => {
        const option = event.target.closest('.select-menu [role="option"][data-value]');
        if (!option) {
            return;
        }

        const menu = option.closest('.select-menu');
        const input = menu ? menu.querySelector('input[name="participantsnavigation"]') : null;
        if (!input) {
            return;
        }

        const value = option.getAttribute('data-value');
        if (!value || value === input.value) {
            return;
        }

        event.preventDefault();
        window.location.href = value;
    });
};

// Initialise EasyStud navigation integration.
export const init = (courseId, managerUrl, nativeParticipantsUrl, managerLabel, nativeParticipantsLabel) => {
    redirectNativeParticipantsPage(courseId, managerUrl);

    const enhance = () => {
        replaceSecondaryParticipantsLinks(courseId, managerUrl);
        enhanceParticipantsDropdown(courseId, managerUrl, nativeParticipantsUrl, managerLabel, nativeParticipantsLabel);
    };

    enhance();
    bindParticipantsNavigationSelector();
    window.setTimeout(enhance, 250);
    window.setTimeout(enhance, 1000);
};
