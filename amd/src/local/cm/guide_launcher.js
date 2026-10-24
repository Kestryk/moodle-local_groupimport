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

const bindFloatingGuideLauncher = (root, guideNode, guideLauncher) => {
    const navigation = root.querySelector('[data-easyedu-navigation]');
    if (!navigation || root.easystudFloatingGuideLauncher) {
        return;
    }
    const host = document.createElement('div');
    host.className = 'local-groupimport-easystud-easyedu-guide easyedu-guide';
    host.setAttribute('data-easyedu-guide-floating-host', '1');
    // The floating control shares the portalled Guide's resolved theme.
    const styles = window.getComputedStyle(guideNode);
    Array.from(styles).forEach(name => {
        if (name.startsWith('--easyedu-') || name.startsWith('--local-groupimport-easystud-')) {
            host.style.setProperty(name, styles.getPropertyValue(name));
        }
    });
    const launcher = guideLauncher.cloneNode(true);
    launcher.removeAttribute('id');
    launcher.removeAttribute('data-easyedu-guide-open');
    launcher.setAttribute('data-easyedu-guide-floating-launcher', '1');
    launcher.classList.add('easyedu-guide__launcher--floating');
    launcher.hidden = false;
    launcher.disabled = true;
    launcher.tabIndex = -1;
    launcher.setAttribute('aria-hidden', 'true');
    host.appendChild(launcher);
    document.body.appendChild(host);
    root.easystudFloatingGuideLauncher = host;
    launcher.addEventListener('click', () => guideLauncher.click());

    let frame = 0;
    const headers = Array.from(document.querySelectorAll('.navbar.fixed-top, .navbar.sticky-top'));
    const sync = () => {
        frame = 0;
        const top = headers.reduce((edge, header) => {
            const rect = header.getBoundingClientRect();
            return rect.top <= 0 && rect.height > 0 ? Math.max(edge, rect.bottom) : edge;
        }, 0);
        const rect = navigation.getBoundingClientRect();
        // Compact navigation has a zero-height anchor beside its drawer trigger.
        const visible = navigation.isConnected && rect.width > 0 && rect.bottom <= top;
        launcher.style.setProperty('--easyedu-guide-floating-top', `${top}px`);
        launcher.classList.toggle('is-visible', visible);
        launcher.disabled = !visible;
        launcher.tabIndex = visible ? 0 : -1;
        launcher.setAttribute('aria-hidden', visible ? 'false' : 'true');
    };
    const schedule = () => {
        if (!frame) {
            frame = window.requestAnimationFrame(sync);
        }
    };
    // Moodle scrolls its page container as well as the document in some layouts.
    document.addEventListener('scroll', schedule, {capture: true, passive: true});
    window.addEventListener('resize', schedule, {passive: true});
    const observer = new ResizeObserver(schedule);
    [navigation, ...headers].forEach(element => observer.observe(element));
    window.addEventListener('pagehide', event => {
        if (event.persisted) {
            return;
        }
        document.removeEventListener('scroll', schedule, true);
        window.removeEventListener('resize', schedule);
        observer.disconnect();
        window.cancelAnimationFrame(frame);
        host.remove();
        root.easystudFloatingGuideLauncher = null;
    }, {once: true});
    sync();
};

// Keep the shared guide launcher consumer-owned while the navigation component
// owns only destinations and its compact panel.
export const bindGuideLauncher = (root, query, {floating = false} = {}) => {
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
    if (floating) {
        bindFloatingGuideLauncher(root, guideNode, guideLauncher);
    }
};
