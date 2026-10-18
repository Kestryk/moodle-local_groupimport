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
 * Responsive Guide launcher shared by the EasyStud pages (Student Management, Mass Import).
 *
 * Dependency-free on purpose: Mass Import loads it without the Student Management modules
 * (GMI-C4). The behaviour is the one Student Management had in local/cm/navigation.
 *
 * @module     local_groupimport/local/cm/guide_launcher
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

// Keep the shared guide launcher consumer-owned while the navigation component
// owns only destinations and its compact panel.
export const bindGuideLauncher = (root, query) => {
    const guideSlot = root.querySelector('[data-easyedu-navigation-guide-slot]');
    const guideSource = root.querySelector('[data-easyedu-navigation-guide-source]');
    const guideNode = guideSource ?
        guideSource.querySelector('[data-easyedu-guide-root]') : null;
    const guideLauncher = guideNode ? guideNode.querySelector('[data-easyedu-guide-open]') : null;
    if (!guideNode || !guideSource || !guideSlot || !guideLauncher) {
        return;
    }
    if (guideNode.matches('[data-easyedu-guide-root]')) {
        root.easystudGuideOwner = guideNode;
    }
    const guideAnchor = document.createComment('easyedu-guide-responsive-anchor');
    guideSource.insertBefore(guideAnchor, guideNode);

    const preserveGuidePortalTheme = () => {
        // The guide is visually scoped below the EasyStud workspace. Portalling
        // it to body must retain the resolved product tokens, otherwise CSS
        // declarations using those variables become invalid (not transparent).
        const styles = window.getComputedStyle(guideNode);
        Array.from(styles).forEach(name => {
            if (!name.startsWith('--easyedu-') && !name.startsWith('--local-groupimport-easystud-')) {
                return;
            }
            const value = styles.getPropertyValue(name).trim();
            if (value !== '') {
                guideNode.style.setProperty(name, value);
            }
        });
        guideNode.setAttribute('data-easyedu-guide-portal-theme', '1');
    };

    const syncGuideLauncher = matches => {
        if (matches) {
            // The overlay surfaces must never live inside the compact drawer:
            // closing that drawer makes its descendants inert and invisible.
            if (guideNode.parentElement !== document.body) {
                preserveGuidePortalTheme();
                document.body.appendChild(guideNode);
            }
            guideLauncher.hidden = true;
            if (!guideSlot.querySelector('[data-easyedu-responsive-guide-launcher]')) {
                const compactLauncher = guideLauncher.cloneNode(true);
                compactLauncher.hidden = false;
                compactLauncher.removeAttribute('id');
                compactLauncher.setAttribute('data-easyedu-responsive-guide-launcher', '1');
                compactLauncher.addEventListener('click', event => {
                    event.preventDefault();
                    guideLauncher.click();
                });
                guideSlot.replaceChildren(compactLauncher);
            }
        } else {
            guideSlot.replaceChildren();
            if (guideAnchor.parentNode && guideNode.parentElement !== guideSource) {
                guideAnchor.parentNode.insertBefore(guideNode, guideAnchor.nextSibling);
            }
            guideLauncher.hidden = false;
        }
    };

    const responsiveMedia = window.matchMedia(query);
    responsiveMedia.addEventListener('change', event => {
        syncGuideLauncher(event.matches);
    });
    syncGuideLauncher(responsiveMedia.matches);
};
