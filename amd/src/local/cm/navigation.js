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
 * EasyStud course manager: responsive and mobile navigation (Guide launcher, participant
 * navigation, back to top, layout modes, mobile entity views, panel overflow, Guide obstruction).
 *
 * @module     local_groupimport/local/cm/navigation
 * @copyright  2026 Kevin Jarniac
 * @license    http://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

import * as Motion from '../../motion';
import {animateViewIn, withoutListArrival} from './transitions';
import {
    structureFocusClass, participantFocusClass, responsiveWorkspaceQuery, isResponsiveWorkspace,
    requestGuideHighlightRefresh,
} from './shared';
import {
    scheduleCompleteListAlignment, schedulePanelActionOverflow, syncPanelActionOverflow, placeColumnActions,
    snapshotPanelActions, revealChangedPanelActions,
} from './layout';
import {clearSelectionState} from './selection';
import {emitPracticeCompletion} from './guide_hooks';
import {getSelectedFilterValues, updateRoleFilterMode} from './filters';
import {
    syncCatalogFilters, scheduleResponsiveUiRefresh, syncPagination, applyFilters, ensureMobileActionBar,
    scheduleGuideBottomObstruction, updateSelectionActions,
} from './workspace';

// Keep the shared guide launcher consumer-owned while the navigation component
// owns only destinations and its compact panel.
export const bindResponsiveGuideLauncher = root => {
    const guideSlot = root.querySelector('[data-easyedu-navigation-guide-slot]');
    const guideSource = root.querySelector('[data-easyedu-navigation-guide-source]');
    const guideNode = guideSource ?
        guideSource.querySelector('[data-easyedu-guide-root], [data-easystud-open-tutorial]') : null;
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

    const responsiveMedia = window.matchMedia(responsiveWorkspaceQuery);
    responsiveMedia.addEventListener('change', event => {
        syncGuideLauncher(event.matches);
    });
    syncGuideLauncher(responsiveMedia.matches);
};

export const bindCanonicalNavigation = root => {
    const navigationRoot = root.querySelector('[data-easyedu-navigation]');
    if (!navigationRoot || typeof require !== 'function') {
        return;
    }
    require(['local_groupimport/easyedu_navigation'], navigation => {
        if (navigation && typeof navigation.init === 'function') {
            navigation.init(navigationRoot);
        }
    });
};

// Restore Moodle's participant destinations in their own compact-only
// category. The native select remains server-owned in the header; this is a
// presentation copy of its capability-filtered links, matching the former
// EasyStud responsive navigation contract without changing desktop markup.
export const bindResponsiveParticipantNavigation = root => {
    const navigationRoot = root.querySelector('[data-easyedu-navigation]');
    const panel = navigationRoot ? navigationRoot.querySelector('[data-easyedu-navigation-panel]') : null;
    const mobileLinks = panel ? panel.querySelector('[data-easyedu-navigation-participant-links]') : null;
    const participantNavigation = root.querySelector('[data-easystud-participant-navigation]');
    if (!panel || !mobileLinks || !participantNavigation || mobileLinks.dataset.easyeduParticipantBound === '1') {
        return;
    }
    mobileLinks.dataset.easyeduParticipantBound = '1';

    const syncParticipantLinks = () => {
        // Moodle's select-menu may replace its dropdown node while its AMD
        // controller finishes populating the capability-filtered options.
        // Always resolve the current node instead of retaining a stale menu.
        const nativeMenu = participantNavigation.querySelector('.dropdown-menu');
        if (!nativeMenu) {
            return;
        }
        const entries = nativeMenu.querySelectorAll('.dropdown-header, .dropdown-item[data-value]');
        if (!entries.length) {
            return;
        }
        mobileLinks.replaceChildren();
        entries.forEach(item => {
            if (item.classList.contains('dropdown-header')) {
                const group = document.createElement('p');
                group.className = 'easyedu-navigation__participant-group';
                group.textContent = item.textContent.trim();
                mobileLinks.appendChild(group);
                return;
            }

            const url = item.getAttribute('data-value');
            if (!url) {
                return;
            }
            const link = document.createElement('a');
            link.className = 'easyedu-navigation__item easyedu-navigation__participant-link';
            link.setAttribute('data-easyedu-navigation-participant-item', '1');
            link.href = url;
            const linkLabel = document.createElement('span');
            linkLabel.className = 'easyedu-navigation__item-label';
            linkLabel.textContent = item.textContent.trim();
            const chevron = document.createElement('span');
            chevron.className = 'easyedu-navigation__item-chevron fa fa-chevron-right';
            chevron.setAttribute('aria-hidden', 'true');
            link.append(linkLabel, chevron);
            // The current EasyStud destination is already exposed by the tools
            // category; avoid exposing a second current-page marker here.
            if (!panel.querySelector('[aria-current="page"]') &&
                    (item.getAttribute('aria-selected') === 'true' || item.classList.contains('active'))) {
                link.setAttribute('aria-current', 'page');
            }
            mobileLinks.appendChild(link);
        });
    };

    syncParticipantLinks();
    const participantNavigationObserver = new MutationObserver(syncParticipantLinks);
    participantNavigationObserver.observe(participantNavigation, {
        attributes: true,
        attributeFilter: ['aria-selected', 'class', 'data-value'],
        childList: true,
        subtree: true,
    });
    // Cover a replacement that occurs in the same task as the initial
    // controller binding, before the observer can observe the new node.
    window.setTimeout(syncParticipantLinks, 0);
    window.setTimeout(syncParticipantLinks, 100);
};

export const bindBackToTop = root => {
    const button = root.querySelector('[data-easystud-back-to-top]');
    if (!button) {
        return;
    }
    const media = window.matchMedia(responsiveWorkspaceQuery);
    const contextMenu = root.querySelector('[data-easystud-context-menu]');
    const modalSelector = '[role="dialog"]:not([hidden]):not([data-easyedu-navigation-panel]), .modal.show';
    const floatingSelector = '[data-easystud-mobile-actions]:not([hidden]), ' +
        '[data-easystud-action-busy-status]:not([hidden]), ' +
        '[data-easyedu-guided-panel]:not([hidden]), [data-easystud-guided-panel]:not([hidden])';
    let syncFrame = null;
    const sync = () => {
        const hasVisibleModal = Array.from(document.querySelectorAll(modalSelector)).some(surface => {
            const style = window.getComputedStyle(surface);
            return surface.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
        });
        const obscured = !!(
            (contextMenu && !contextMenu.hidden) ||
            hasVisibleModal ||
            root.querySelector('[data-easyedu-navigation-panel].is-open')
        );
        let offset = 14;
        root.querySelectorAll(floatingSelector).forEach(surface => {
            const rect = surface.getBoundingClientRect();
            // Safe-area padding can leave a small gap below a bottom-docked
            // surface. Treat it as occupying the bottom edge so the control
            // is always lifted above action trays and guided checklists.
            if (rect.width && rect.height && rect.bottom > window.innerHeight - 48) {
                offset = Math.max(offset, Math.ceil(window.innerHeight - rect.top + 12));
            }
        });
        const offsetValue = offset + 'px';
        const hidden = !media.matches || window.scrollY < 400 || obscured;
        if (button.style.getPropertyValue('--easyedu-back-to-top-bottom') !== offsetValue) {
            button.style.setProperty('--easyedu-back-to-top-bottom', offsetValue);
        }
        if (button.classList.contains('is-obscured') !== obscured) {
            button.classList.toggle('is-obscured', obscured);
        }
        if (button.hidden !== hidden) {
            button.hidden = hidden;
        }
    };
    const scheduleSync = () => {
        if (syncFrame !== null) {
            return;
        }
        syncFrame = window.requestAnimationFrame(() => {
            syncFrame = null;
            sync();
        });
    };
    button.addEventListener('click', () => {
        window.scrollTo({top: 0, behavior: Motion.scrollBehavior(button)});
    });
    window.addEventListener('scroll', scheduleSync, {passive: true});
    window.addEventListener('resize', scheduleSync);
    media.addEventListener('change', scheduleSync);

    const stateObserver = new MutationObserver(scheduleSync);
    const observeFloatingSurface = surface => stateObserver.observe(surface, {
        attributes: true,
        attributeFilter: ['class', 'hidden'],
    });
    if (contextMenu) {
        observeFloatingSurface(contextMenu);
    }
    root.querySelectorAll(floatingSelector).forEach(observeFloatingSurface);

    // Ajax updates may replace a floating surface. Watch additions only; observing every
    // class/hidden mutation in the manager would make this callback observe its own button.
    new MutationObserver(mutations => {
        mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
            if (!node || node.nodeType !== 1) {
                return;
            }
            if (node.matches && node.matches(floatingSelector)) {
                observeFloatingSurface(node);
            }
            if (node.querySelectorAll) {
                node.querySelectorAll(floatingSelector).forEach(observeFloatingSurface);
            }
        }));
        scheduleSync();
    }).observe(root, {childList: true, subtree: true});
    document.addEventListener('shown.bs.modal', scheduleSync);
    document.addEventListener('hidden.bs.modal', scheduleSync);
    sync();
};

/**
 * Mark the root while a view swap animates: the card headers then change width on every frame,
 * and the card action menus are measured once the swap has ended (bindNestedGroupActionMenus).
 *
 * @param {HTMLElement} root EasyStud root.
 * @param {Promise} swap Motion.swap promise.
 * @returns {Promise}
 */
const trackLayoutSwap = (root, swap) => {
    root.easystudLayoutSwapping = (root.easystudLayoutSwapping || 0) + 1;
    const release = () => {
        root.easystudLayoutSwapping -= 1;
        if (!root.easystudLayoutSwapping && root.easystudAfterLayoutSwap) {
            root.easystudAfterLayoutSwap();
        }
    };
    return Promise.resolve(swap).then(value => {
        release();
        return value;
    }, error => {
        release();
        throw error;
    });
};

export const bindLayoutModeToggle = root => {
    const buttons = Array.from(root.querySelectorAll('[data-easystud-layout-mode]'));
    const participantGroupsPanel = root.querySelector('[data-easystud-participant-groups-panel]');
    const structureGroupsPanel = root.querySelector('[data-easystud-structure-groups]');
    const layout = root.querySelector('.local-groupimport-easystud__layout');
    if (!buttons.length) {
        return;
    }

    const applyModeState = mode => {
        const normalisedmode = mode || 'both';
        root.easystudDesktopMode = normalisedmode;
        clearSelectionState(root);
        root.classList.toggle(participantFocusClass, normalisedmode === 'participants');
        root.classList.toggle(structureFocusClass, normalisedmode === 'structure');

        buttons.forEach(button => {
            const active = button.getAttribute('data-easystud-layout-mode') === normalisedmode;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.classList.toggle('active', active);
            button.classList.toggle('btn-primary', active);
            button.classList.toggle('btn-outline-secondary', !active);
            button.classList.toggle('btn-outline-primary', active);
        });

        if (participantGroupsPanel) {
            participantGroupsPanel.hidden = normalisedmode !== 'participants';
        }
        if (structureGroupsPanel) {
            structureGroupsPanel.hidden = normalisedmode !== 'structure';
        }
        root.querySelectorAll('.local-groupimport-easystud__participant-group-action').forEach(button => {
            button.hidden = normalisedmode !== 'participants';
        });
        root.querySelectorAll('.local-groupimport-easystud__participant-move-action').forEach(button => {
            button.hidden = normalisedmode === 'structure';
        });
        // Same frame as the mode change: each focus column shows its own actions from the first paint.
        placeColumnActions(root);

        updateRoleFilterMode(root);
        const hasModeDependentCatalogSearch = [
            '[data-easystud-catalog-search="participants"]',
            '[data-easystud-structure-group-search]',
            '[data-easystud-structure-grouping-search]',
        ].some(selector => {
            const control = root.querySelector(selector);
            return !!(control && control.value.trim());
        });
        const groupingFilter = root.querySelector('[data-easystud-grouping-filter]');
        if (hasModeDependentCatalogSearch) {
            syncCatalogFilters(root, {pagination: false, responsive: false});
        }
        if (getSelectedFilterValues(groupingFilter).length) {
            applyFilters(root, {pagination: false, responsive: false});
        }
        syncPagination(root);
        updateSelectionActions(root);
        scheduleResponsiveUiRefresh(root, {pagination: false});
        scheduleCompleteListAlignment(root);
        if (normalisedmode === 'participants' && !isResponsiveWorkspace()) {
            emitPracticeCompletion(root, 'open-participants');
        }
    };

    const applyMode = (mode, animate = true) => {
        if (animate && layout) {
            const actionsBefore = snapshotPanelActions(root);
            trackLayoutSwap(root, Motion.swap(layout, () => {
                applyModeState(mode);
                // The panel action bars are measured now, in the same frame as the mode change.
                // Left to the next animation frame, the buttons first showed in full and then
                // dropped into the overflow menu a frame later (the second, abrupt step).
                syncPanelActionOverflow(root);
                revealChangedPanelActions(root, actionsBefore);
            }, {
                exit: false,
                enterDuration: Motion.timing.normal,
                resize: false,
                swapOpacity: 0.62,
            })).then(() => {
                // The alignment pass queued by applyModeState measured the columns mid-animation;
                // measure again once they have settled (T020: 9.75 px residue at 1600/1920).
                scheduleCompleteListAlignment(root);
                requestGuideHighlightRefresh(root);
            });
            return;
        }
        applyModeState(mode);
    };

    buttons.forEach(button => {
        button.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            applyMode(button.getAttribute('data-easystud-layout-mode') || 'both');
        });
    });

    const configuredMode = root.getAttribute('data-easystud-default-layout-mode') || 'both';
    const initialMode = buttons.some(button => button.getAttribute('data-easystud-layout-mode') === configuredMode)
        ? configuredMode
        : (buttons[0].getAttribute('data-easystud-layout-mode') || 'participants');
    applyMode(initialMode, false);
    root.easystudApplyDesktopMode = applyMode;
};

// Keep compact entity navigation independent from the three desktop workspaces.
export const bindMobileEntityViews = root => {
    const media = window.matchMedia ? window.matchMedia(responsiveWorkspaceQuery) : null;
    const switcher = root.querySelector('[data-easystud-mobile-view-switcher]');
    const buttons = Array.from(root.querySelectorAll('[data-easystud-mobile-view]'));
    const participantPanel = root.querySelector('[data-easystud-participants-panel]');
    const structurePanel = root.querySelector('[data-easystud-structure-panel]');
    const structureTitle = structurePanel ? structurePanel.querySelector('.local-groupimport-easystud__panel-title') : null;
    const structureTitleDefault = structureTitle ? structureTitle.textContent : '';
    const structureGroups = root.querySelector('[data-easystud-structure-groups]');
    const layout = root.querySelector('.local-groupimport-easystud__layout');
    if (!media || !switcher || !buttons.length || !participantPanel || !structurePanel) {
        return;
    }

    const configuredMobileView = root.getAttribute('data-easystud-default-mobile-view') || 'participants';
    let mobileView = ['participants', 'groups', 'groupings'].includes(configuredMobileView)
        ? configuredMobileView
        : 'participants';
    const closeResponsiveGuide = () => {
        root.querySelectorAll('[data-easystud-tutorial-modal], [data-easyedu-guide-modal]').forEach(modal => {
            modal.hidden = true;
        });
        root.querySelectorAll('[data-easystud-guided-panel], [data-easyedu-guided-panel], ' +
            '[data-easystud-tutorial-return], [data-easyedu-guide-return]').forEach(panel => {
            panel.hidden = true;
        });
    };

    const applyMobileState = view => {
        mobileView = ['participants', 'groups', 'groupings'].indexOf(view) === -1 ? 'participants' : view;
        root.setAttribute('data-easystud-mobile-view-active', mobileView);
        // Desktop focus classes hide whole regions and must not leak into the
        // three independent responsive workspaces.
        root.classList.remove(participantFocusClass, structureFocusClass);
        // Compact workspaces do not inherit the desktop structure-only action hiding.
        root.querySelectorAll('[data-easystud-move-selected-participants]').forEach(button => {
            button.hidden = false;
        });
        clearSelectionState(root);
        updateSelectionActions(root);

        buttons.forEach(button => {
            const active = button.getAttribute('data-easystud-mobile-view') === mobileView;
            button.setAttribute('aria-pressed', active ? 'true' : 'false');
            button.classList.toggle('is-active', active);
        });
        participantPanel.hidden = mobileView !== 'participants';
        structurePanel.hidden = mobileView === 'participants';
        if (structureGroups) {
            structureGroups.hidden = mobileView !== 'groups';
        }
        if (structureTitle && mobileView !== 'participants') {
            const activeButton = buttons.find(button => button.getAttribute('data-easystud-mobile-view') === mobileView);
            const label = activeButton ? activeButton.querySelector('span:last-child') : null;
            structureTitle.textContent = label ? label.textContent : structureTitleDefault;
        }
        closeResponsiveGuide();
        syncPagination(root);
        scheduleResponsiveUiRefresh(root, {pagination: false, guide: false});
        if (mobileView === 'participants') {
            emitPracticeCompletion(root, 'open-participants');
        }
    };

    const mobileViewOrder = ['participants', 'groups', 'groupings'];
    const applyMobileView = (view, animate = true) => {
        if (!media.matches) {
            return;
        }
        if (animate && layout && view !== mobileView) {
            // The state changes at once; only the incoming panel moves (fade + 8 px slide towards the tab).
            const direction = mobileViewOrder.indexOf(view) >= mobileViewOrder.indexOf(mobileView) ? 1 : -1;
            withoutListArrival(() => applyMobileState(view));
            const incoming = mobileView === 'participants' ? participantPanel : structurePanel;
            trackLayoutSwap(root, animateViewIn(incoming, direction));
            return;
        }
        applyMobileState(view);
    };

    const syncViewportMode = () => {
        root.classList.toggle('local-groupimport-easystud--responsive-workspace', media.matches);
        if (media.matches) {
            applyMobileView(mobileView, false);
            return;
        }
        root.removeAttribute('data-easystud-mobile-view-active');
        if (structureTitle) {
            structureTitle.textContent = structureTitleDefault;
        }
        participantPanel.hidden = false;
        structurePanel.hidden = false;
        if (root.easystudApplyDesktopMode) {
            root.easystudApplyDesktopMode(root.easystudDesktopMode || 'both', false);
        }
    };

    buttons.forEach(button => button.addEventListener('click', () => {
        applyMobileView(button.getAttribute('data-easystud-mobile-view') || 'participants');
    }));
    if (media.addEventListener) {
        media.addEventListener('change', syncViewportMode);
    } else {
        media.addListener(syncViewportMode);
    }
    syncViewportMode();
};

export const bindPanelActionOverflow = root => {
    root.addEventListener('click', event => {
        const toggle = event.target.closest('[data-easystud-panel-actions-toggle]');
        if (!toggle || !root.contains(toggle)) {
            return;
        }
        event.preventDefault();
        const actions = toggle.closest('.local-groupimport-easystud__panel-actions');
        const menu = actions ? actions.querySelector('[data-easystud-panel-actions-menu]') : null;
        if (!menu) {
            return;
        }
        const open = menu.hidden || Motion.isMenuClosing(menu);
        root.querySelectorAll('[data-easystud-panel-actions-menu]').forEach(otherMenu => {
            if (otherMenu !== menu) {
                const otherToggle = otherMenu.parentElement ?
                    otherMenu.parentElement.querySelector('[data-easystud-panel-actions-toggle]') : null;
                Motion.hideMenu(otherMenu, {anchor: otherToggle});
                if (otherToggle) {
                    otherToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
        if (open) {
            Motion.showMenu(menu, {anchor: toggle});
        } else {
            Motion.hideMenu(menu, {anchor: toggle});
        }
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    document.addEventListener('click', event => {
        if (root.contains(event.target) && event.target.closest('[data-easystud-panel-actions-toggle], [data-easystud-panel-actions-menu]')) {
            return;
        }
        root.querySelectorAll('[data-easystud-panel-actions-menu]').forEach(menu => {
            const menuToggle = menu.parentElement ?
                menu.parentElement.querySelector('[data-easystud-panel-actions-toggle]') : null;
            Motion.hideMenu(menu, {anchor: menuToggle});
        });
        root.querySelectorAll('[data-easystud-panel-actions-toggle]').forEach(toggle => {
            toggle.setAttribute('aria-expanded', 'false');
        });
    });

    schedulePanelActionOverflow(root);
};

export const bindGuideBottomObstruction = root => {
    const bar = ensureMobileActionBar(root);
    const refresh = () => scheduleGuideBottomObstruction(root);
    window.addEventListener('resize', refresh);
    window.addEventListener('orientationchange', refresh);
    if (window.ResizeObserver) {
        const observer = new window.ResizeObserver(refresh);
        observer.observe(bar);
        root.easystudGuideBottomObstructionObserver = observer;
    }
    refresh();
};
