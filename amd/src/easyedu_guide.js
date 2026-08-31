// This file is generated from the embedded EasyEdu guide kit source and adapted to Moodle AMD.
// Keep behaviour aligned with easyedu-guide-kit/amd/src/easyedu_guide.js, then pass
// selectors, paths and labels from plugin-specific PHP/Mustache data.

define([], function() {
// Generic EasyEdu guide foundation for Moodle plugins.
//
// Plugins should copy this module into their AMD source folder and configure
// selectors, paths and labels from plugin-specific PHP/Mustache data.

const DEFAULTS = {
  storageKey: 'easyedu.guide.seen',
  firstVisit: false,
  highlightAutoHideDelay: 9000,
  highlightStyle: 'default',
  targets: {},
  paths: {},
  unlockPaths: [],
  labels: {
    close: '',
    next: '',
    previous: '',
    start: '',
    hint: '',
    complete: '',
    guidedPath: '',
    visited: '',
    completeStepFirst: ''
  }
};

const SELECTORS = {
  open: '[data-easyedu-guide-open]',
  close: '[data-easyedu-guide-close]',
  modal: '[data-easyedu-guide-modal]',
  slide: '[data-easyedu-guide-slide]',
  nav: '[data-easyedu-guide-nav]',
  navItem: '[data-easyedu-guide-nav-item]',
  navNext: '[data-easyedu-guide-nav-next]',
  navPrevious: '[data-easyedu-guide-nav-previous]',
  next: '[data-easyedu-guide-next]',
  previous: '[data-easyedu-guide-previous]',
  showTarget: '[data-easyedu-guide-show-target]',
  startPath: '[data-easyedu-guide-start-path]',
  checklist: '[data-easyedu-guide-checklist]',
  checklistClose: '[data-easyedu-guide-checklist-close]',
  checklistItems: '[data-easyedu-guide-checklist-items]',
  checklistMessage: '[data-easyedu-guide-checklist-message]',
  checklistMinimize: '[data-easyedu-guide-checklist-minimize]',
  checklistReturn: '[data-easyedu-guide-checklist-return]',
  checklistSubtitle: '[data-easyedu-guide-checklist-subtitle]',
  checklistTitle: '[data-easyedu-guide-checklist-title]',
  interfaceReturn: '[data-easyedu-guide-interface-return]',
  interfaceReturnButton: '[data-easyedu-guide-interface-return-button]',
  interfaceReturnDismiss: '[data-easyedu-guide-interface-return-dismiss]',
  highlight: '[data-easyedu-guide-highlight]'
};

const HIGHLIGHT_TARGET_CLASS = 'is-easyedu-guide-highlight-target';
const PAGE_SCROLL_LOCK_CLASS = 'easyedu-guide-dialog-open';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');
const openGuideRoots = new Set();

const addTrackedListener = (root, target, type, handler, options) => {
  target.addEventListener(type, handler, options);
  root.easyeduGuideListeners = root.easyeduGuideListeners || [];
  root.easyeduGuideListeners.push({target, type, handler, options});
};

const clearTrackedListeners = root => {
  (root.easyeduGuideListeners || []).forEach(binding => {
    binding.target.removeEventListener(binding.type, binding.handler, binding.options);
  });
  root.easyeduGuideListeners = [];
};

const setTrackedTimeout = (root, callback, delay) => {
  root.easyeduGuideTimeouts = root.easyeduGuideTimeouts || new Set();
  const timer = window.setTimeout(() => {
    root.easyeduGuideTimeouts.delete(timer);
    callback();
  }, delay);
  root.easyeduGuideTimeouts.add(timer);
  return timer;
};

const clearTrackedTimeout = (root, timer) => {
  if (!timer) {
    return;
  }
  window.clearTimeout(timer);
  if (root.easyeduGuideTimeouts) {
    root.easyeduGuideTimeouts.delete(timer);
  }
};

const clearTrackedTimeouts = root => {
  (root.easyeduGuideTimeouts || []).forEach(timer => window.clearTimeout(timer));
  root.easyeduGuideTimeouts = new Set();
};

// Checklist steps can open a product view after a short transition. If the
// visitor immediately selects another step, only the superseded checklist
// transition must be cancelled; return-panel and highlight timers remain
// independent.
const clearStepOpenTimers = root => {
  (root.easyeduGuideStepOpenTimers || []).forEach(timer => clearTrackedTimeout(root, timer));
  root.easyeduGuideStepOpenTimers = new Set();
};

const setStepOpenTimeout = (root, callback, delay) => {
  root.easyeduGuideStepOpenTimers = root.easyeduGuideStepOpenTimers || new Set();
  let timer = null;
  timer = setTrackedTimeout(root, () => {
    root.easyeduGuideStepOpenTimers.delete(timer);
    callback();
  }, delay);
  root.easyeduGuideStepOpenTimers.add(timer);
  return timer;
};

const isMotionEnabled = root => {
  const policyRoot = root && root.closest ? root.closest('[data-easyedu-motion-policy]') : null;
  const disabledByAdmin = (policyRoot && policyRoot.getAttribute('data-easyedu-motion-policy') === 'disabled') ||
    (document.body && document.body.classList.contains('easyedu-motion-disabled'));
  const reducedByVisitor = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return !disabledByAdmin && !reducedByVisitor;
};

const getScrollBehavior = root => isMotionEnabled(root) ? 'smooth' : 'auto';

const scrollAnimationTokens = new WeakMap();
let windowScrollAnimationToken = null;

const easeGuideScroll = progress => {
  const safeProgress = Math.max(0, Math.min(progress, 1));
  return safeProgress < 0.5 ?
    4 * safeProgress * safeProgress * safeProgress :
    1 - Math.pow(-2 * safeProgress + 2, 3) / 2;
};

const animateScrollTo = (root, scroller, top, duration = 520) => {
  const reducedMotion = getScrollBehavior(root) === 'auto';
  const isWindow = scroller === window;
  const getCurrent = () => isWindow ? window.scrollY : scroller.scrollTop;
  const setCurrent = value => {
    if (isWindow) {
      window.scrollTo(0, value);
    } else {
      scroller.scrollTop = value;
    }
  };

  const maxTop = isWindow ?
    Math.max(0, document.documentElement.scrollHeight - (window.innerHeight || document.documentElement.clientHeight)) :
    Math.max(0, scroller.scrollHeight - scroller.clientHeight);
  const targetTop = Math.max(0, Math.min(top, maxTop));
  const startTop = getCurrent();
  const distance = targetTop - startTop;

  if (reducedMotion || Math.abs(distance) < 1) {
    setCurrent(targetTop);
    return;
  }

  const token = Symbol('easyedu-scroll');
  if (isWindow) {
    windowScrollAnimationToken = token;
  } else {
    scrollAnimationTokens.set(scroller, token);
  }
  root.easyeduGuideScrollers = root.easyeduGuideScrollers || new Set();
  root.easyeduGuideScrollers.add(scroller);

  const startTime = performance.now();
  const step = now => {
    const activeToken = isWindow ? windowScrollAnimationToken : scrollAnimationTokens.get(scroller);
    if (activeToken !== token) {
      return;
    }
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    setCurrent(startTop + distance * easeGuideScroll(progress));
    if (progress < 1) {
      window.requestAnimationFrame(step);
    } else {
      root.easyeduGuideScrollers.delete(scroller);
    }
  };
  window.requestAnimationFrame(step);
};

const mergeConfig = config => Object.assign({}, DEFAULTS, config || {}, {
  labels: Object.assign({}, DEFAULTS.labels, (config && config.labels) || {}),
  targets: Object.assign({}, DEFAULTS.targets, (config && config.targets) || {}),
  paths: Object.assign({}, DEFAULTS.paths, (config && config.paths) || {}),
  unlockPaths: Array.isArray(config && config.unlockPaths) ? config.unlockPaths : DEFAULTS.unlockPaths
});

const isVisibleElement = element => {
  if (!element || !element.isConnected || element.hidden) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (style.display === 'none' || style.visibility === 'hidden' || style.visibility === 'collapse') {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return element.getClientRects().length > 0 && rect.width > 0 && rect.height > 0;
};

const lockPageScroll = root => {
  openGuideRoots.add(root);
  document.documentElement.classList.add(PAGE_SCROLL_LOCK_CLASS);
};

const unlockPageScroll = root => {
  openGuideRoots.delete(root);
  if (openGuideRoots.size === 0) {
    document.documentElement.classList.remove(PAGE_SCROLL_LOCK_CLASS);
  }
};

const getFocusableElements = modal => Array.from(modal.querySelectorAll(FOCUSABLE_SELECTOR))
  .filter(isVisibleElement);

const trapModalFocus = (modal, event) => {
  if (event.key !== 'Tab') {
    return false;
  }

  const focusable = getFocusableElements(modal);
  if (focusable.length === 0) {
    event.preventDefault();
    modal.focus({preventScroll: true});
    return true;
  }

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (!modal.contains(document.activeElement)) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus({preventScroll: true});
    return true;
  }
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus({preventScroll: true});
    return true;
  }
  if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus({preventScroll: true});
    return true;
  }

  return false;
};

const focusTarget = target => {
  if (!isVisibleElement(target)) {
    return;
  }

  const generatedTabIndex = !target.hasAttribute('tabindex') &&
    !target.matches('a[href], button, input, select, textarea');
  if (generatedTabIndex) {
    target.setAttribute('tabindex', '-1');
    target.addEventListener('blur', () => target.removeAttribute('tabindex'), {once: true});
  }
  target.focus({preventScroll: true});
};

const getStorage = () => {
  try {
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const getStateKey = config => `${config.storageKey}.checklist`;

const loadGuideState = config => {
  const storage = getStorage();
  if (!storage) {
    return {};
  }

  try {
    return JSON.parse(storage.getItem(getStateKey(config)) || '{}') || {};
  } catch (error) {
    return {};
  }
};

const saveGuideState = (config, state) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  storage.setItem(getStateKey(config), JSON.stringify(state || {}));
};

const getCompletedSteps = (config, pathName) => {
  const state = loadGuideState(config);
  const completed = state.completed && state.completed[pathName];

  return Array.isArray(completed) ? completed : [];
};

const isStepComplete = (config, pathName, step, index) => {
  const stepId = step && step.id ? step.id : String(index);

  return getCompletedSteps(config, pathName).includes(stepId);
};

const saveChecklistProgress = (root, config, pathName, activeIndex = 0) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const state = loadGuideState(config);
  const completed = {};

  Object.keys(state.completed || {}).forEach(key => {
    completed[key] = Array.isArray(state.completed[key]) ? state.completed[key] : [];
  });

  if (checklist) {
    completed[pathName] = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id].is-complete'))
      .map(item => item.getAttribute('data-easyedu-guide-step-id'))
      .filter(Boolean);
  }

  saveGuideState(config, {
    path: pathName,
    activeIndex,
    completed,
    slideIndex: Number(root.getAttribute('data-easyedu-guide-current-slide') || 0)
  });
};

const clearChecklistProgress = config => {
  const state = loadGuideState(config);
  saveGuideState(config, {
    completed: {},
    slideIndex: Number(state.slideIndex || 0)
  });
};

const resolveTarget = (config, keyOrSelector) => {
  if (!keyOrSelector) {
    return null;
  }

  if (Array.isArray(keyOrSelector)) {
    const matches = keyOrSelector.map(item => resolveTarget(config, item)).filter(Boolean);
    return matches.find(isVisibleElement) || null;
  }

  const selector = config.targets[keyOrSelector] || keyOrSelector;
  if (Array.isArray(selector)) {
    return resolveTarget(config, selector);
  }

  try {
    const targets = Array.from(document.querySelectorAll(selector));
    if (targets.length) {
      return targets.find(isVisibleElement) || null;
    }
  } catch (error) {
    // Continue with the data-target fallback below.
  }

  try {
    const escapedKey = window.CSS && window.CSS.escape ?
      window.CSS.escape(keyOrSelector) :
      String(keyOrSelector).replace(/"/g, '\\"');
    const fallback = document.querySelector(`[data-easyedu-guide-target="${escapedKey}"]`);
    return isVisibleElement(fallback) ? fallback : null;
  } catch (error) {
    return null;
  }
};

const eventMatchesTarget = (config, keyOrSelector, event) => {
  if (!keyOrSelector || !event || !event.target || !event.target.closest) {
    return false;
  }

  const selector = config.targets[keyOrSelector] || keyOrSelector;
  try {
    return !!event.target.closest(selector);
  } catch (error) {
    return false;
  }
};

const createHighlight = root => {
  if (!root.easyeduGuideId) {
    root.easyeduGuideId = `easyedu-guide-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  let highlight = document.querySelector(`${SELECTORS.highlight}[data-easyedu-guide-owner="${root.easyeduGuideId}"]`);
  if (highlight) {
    return highlight;
  }

  highlight = document.createElement('div');
  highlight.setAttribute('data-easyedu-guide-highlight', '1');
  highlight.setAttribute('data-easyedu-guide-owner', root.easyeduGuideId);
  highlight.className = 'easyedu-guide-highlight';
  highlight.hidden = true;
  document.body.appendChild(highlight);
  return highlight;
};

const clearHighlightAutoHideTimer = root => {
  if (root.easyeduGuideHighlightAutoHideTimer) {
    clearTrackedTimeout(root, root.easyeduGuideHighlightAutoHideTimer);
    root.easyeduGuideHighlightAutoHideTimer = null;
  }
};

const clearHighlightRefresh = root => {
  if (root.easyeduGuideRefreshFrame) {
    window.cancelAnimationFrame(root.easyeduGuideRefreshFrame);
    root.easyeduGuideRefreshFrame = null;
  }
  if (root.easyeduGuideRefreshBurstFrame) {
    window.cancelAnimationFrame(root.easyeduGuideRefreshBurstFrame);
    root.easyeduGuideRefreshBurstFrame = null;
  }
  root.easyeduGuideRefreshTarget = null;
  root.easyeduGuideRefreshShouldDock = false;
};

const observeHighlightedTarget = (root, target) => {
  if (!window.MutationObserver) {
    return;
  }
  if (!root.easyeduGuideMutationObserver) {
    root.easyeduGuideMutationObserver = new MutationObserver(() => {
      if (!isVisibleElement(root.easyeduGuideCurrentTarget)) {
        clearHighlight(root);
        return;
      }
      scheduleHighlightRefresh(root, root.easyeduGuideCurrentTarget, true);
    });
  }

  root.easyeduGuideMutationObserver.disconnect();
  if (isVisibleElement(target)) {
    root.easyeduGuideMutationObserver.observe(target.parentElement || root, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['aria-expanded', 'class', 'hidden', 'style']
    });
  }
};

const clearHighlightedTarget = root => {
  clearHighlightAutoHideTimer(root);
  if (root.easyeduGuideMutationObserver) {
    root.easyeduGuideMutationObserver.disconnect();
  }
  if (root.easyeduGuideCurrentTarget) {
    root.easyeduGuideCurrentTarget.classList.remove(HIGHLIGHT_TARGET_CLASS);
  }
  root.easyeduGuideCurrentTarget = null;
};

const clearHighlight = root => {
  clearHighlightRefresh(root);
  const highlight = createHighlight(root);
  highlight.hidden = true;
  clearHighlightedTarget(root);
};

const updateHighlight = (root, target) => {
  const highlight = createHighlight(root);
  if (!isVisibleElement(target)) {
    clearHighlight(root);
    return;
  }

  const rect = target.getBoundingClientRect();
  if (root.easyeduGuideCurrentTarget && root.easyeduGuideCurrentTarget !== target) {
    root.easyeduGuideCurrentTarget.classList.remove(HIGHLIGHT_TARGET_CLASS);
  }
  root.easyeduGuideCurrentTarget = target;
  target.classList.add(HIGHLIGHT_TARGET_CLASS);
  observeHighlightedTarget(root, target);
  highlight.classList.toggle(
    'easyedu-guide-highlight--pulse-blue',
    root.dataset.easyeduGuideHighlightStyle === 'pulse-blue'
  );
  highlight.hidden = false;
  highlight.style.height = `${Math.max(rect.height, 1)}px`;
  highlight.style.left = `${rect.left}px`;
  highlight.style.top = `${rect.top}px`;
  highlight.style.width = `${Math.max(rect.width, 1)}px`;
};

const scheduleHighlightAutoHide = (root, delay) => {
  clearHighlightAutoHideTimer(root);
  root.easyeduGuideHighlightAutoHideTimer = setTrackedTimeout(root, () => {
    clearHighlight(root);
  }, delay);
};

const scheduleHighlightRefresh = (root, target, shouldDock = true) => {
  if (target && !isVisibleElement(target)) {
    clearHighlight(root);
    return;
  }
  root.easyeduGuideRefreshTarget = target || null;
  root.easyeduGuideRefreshShouldDock = shouldDock;
  if (root.easyeduGuideRefreshFrame) {
    return;
  }

  root.easyeduGuideRefreshFrame = window.requestAnimationFrame(() => {
    const refreshTarget = root.easyeduGuideRefreshTarget || root.easyeduGuideCurrentTarget;
    root.easyeduGuideRefreshFrame = null;
    if (!isVisibleElement(refreshTarget)) {
      clearHighlight(root);
      return;
    }
    if (root.easyeduGuideRefreshShouldDock) {
      dockChecklistAwayFromTarget(root, refreshTarget);
    }
    updateHighlight(root, refreshTarget);
  });
};

const scheduleHighlightRefreshBurst = (root, target, shouldDock = true) => {
  if (root.easyeduGuideRefreshBurstFrame) {
    window.cancelAnimationFrame(root.easyeduGuideRefreshBurstFrame);
  }
  const startTime = performance.now();
  const refresh = now => {
    if (!isVisibleElement(target)) {
      root.easyeduGuideRefreshBurstFrame = null;
      clearHighlight(root);
      return;
    }
    scheduleHighlightRefresh(root, target, shouldDock);
    if (now - startTime < 800) {
      root.easyeduGuideRefreshBurstFrame = window.requestAnimationFrame(refresh);
    } else {
      root.easyeduGuideRefreshBurstFrame = null;
    }
  };
  root.easyeduGuideRefreshBurstFrame = window.requestAnimationFrame(refresh);
};

const dockChecklistAwayFromTarget = (root, target) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.hidden || !isVisibleElement(target)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const viewportMiddle = window.innerWidth / 2;
  const dockRight = rect.left < viewportMiddle;

  checklist.classList.toggle('is-docked-right', dockRight);
  checklist.classList.toggle('is-docked-left', !dockRight);
};

const showInterfaceReturn = root => {
  const returnPanel = root.querySelector(SELECTORS.interfaceReturn);
  if (returnPanel) {
    if (root.easyeduGuideReturnCloseTimer) {
      clearTrackedTimeout(root, root.easyeduGuideReturnCloseTimer);
      root.easyeduGuideReturnCloseTimer = null;
    }
    returnPanel.classList.remove('is-closing');
    if (root.easyeduGuideReturnTimer) {
      clearTrackedTimeout(root, root.easyeduGuideReturnTimer);
    }
    root.easyeduGuideInterfaceHighlightActive = true;
    returnPanel.hidden = false;
    root.easyeduGuideReturnTimer = setTrackedTimeout(root, () => {
      if (root.easyeduGuideInterfaceHighlightActive) {
        returnPanel.hidden = true;
        root.easyeduGuideInterfaceHighlightActive = false;
        clearHighlight(root);
      }
    }, 12000);
  }
};

const hideInterfaceReturn = (root, shouldClearHighlight = false) => {
  const returnPanel = root.querySelector(SELECTORS.interfaceReturn);
  if (root.easyeduGuideReturnTimer) {
    clearTrackedTimeout(root, root.easyeduGuideReturnTimer);
    root.easyeduGuideReturnTimer = null;
  }
  root.easyeduGuideInterfaceHighlightActive = false;
  if (returnPanel) {
    returnPanel.classList.add('is-closing');
    root.easyeduGuideReturnCloseTimer = setTrackedTimeout(root, () => {
      returnPanel.hidden = true;
      returnPanel.classList.remove('is-closing');
      root.easyeduGuideReturnCloseTimer = null;
    }, 180);
  }
  if (shouldClearHighlight) {
    clearHighlight(root);
  }
};

const hideChecklist = (root, config, clearProgress = false) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (checklist) {
    checklist.hidden = true;
    checklist.classList.remove('is-complete', 'is-minimized', 'is-docked-left', 'is-docked-right', 'is-unlock-path');
    checklist.removeAttribute('data-easyedu-guide-path');
    // A compact checklist is deliberately reopened in its space-saving state
    // for each guided-path entry.  Do not carry a prior manual expansion into
    // a new mobile journey.
    checklist.removeAttribute('data-easyedu-guide-checklist-expanded');
  }
  hideInterfaceReturn(root, true);
  clearHighlight(root);
  if (clearProgress) {
    clearChecklistProgress(config);
  }
};

const getScrollTopOffset = () => {
  const fixedElements = Array.from(document.querySelectorAll('.fixed-top, .sticky-top, [data-region="fixed-drawer-toggle"]'));
  const bottom = fixedElements.reduce((value, element) => {
    if (!isVisibleElement(element)) {
      return value;
    }
    const style = window.getComputedStyle(element);
    if (style.position !== 'fixed' && style.position !== 'sticky') {
      return value;
    }
    const rect = element.getBoundingClientRect();
    return rect.top <= 8 ? Math.max(value, rect.bottom) : value;
  }, 0);

  return Math.max(96, Math.min(bottom + 24, 180));
};

const getCompactChecklistBottomClearance = root => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.hidden || !window.matchMedia ||
    !window.matchMedia('(max-width: 40rem), (max-height: 32rem)').matches) {
    return 0;
  }

  const rect = checklist.getBoundingClientRect();
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  if (rect.top >= viewportHeight || rect.bottom <= 0) {
    return 0;
  }

  // The fixed compact checklist is a real viewport obstruction. Reserve its
  // measured height plus a small breathing space so a newly highlighted target
  // is scrolled above it rather than appearing underneath it.
  return Math.max(0, viewportHeight - Math.max(0, rect.top) + 16);
};

const isScrollableContainer = element => {
  if (!element || element === document.body || element === document.documentElement) {
    return false;
  }
  const style = window.getComputedStyle(element);
  const overflowY = style.overflowY;
  return ['auto', 'scroll', 'overlay'].includes(overflowY) &&
    element.scrollHeight > element.clientHeight + 2;
};

const scrollScrollableAncestorsToTarget = (root, target, bottomClearance = 0) => {
  let scrolled = false;
  let parent = target.parentElement;

  while (parent && parent !== document.body && parent !== document.documentElement) {
    if (isScrollableContainer(parent)) {
      const targetRect = target.getBoundingClientRect();
      const parentRect = parent.getBoundingClientRect();
      const margin = Math.min(Math.max(parent.clientHeight * 0.08, 18), 42);
      const parentBottomClearance = Math.max(
        margin,
        bottomClearance - Math.max(0, (window.innerHeight || document.documentElement.clientHeight) - parentRect.bottom)
      );
      let nextTop = parent.scrollTop;

      if (targetRect.top < parentRect.top + margin) {
        nextTop += targetRect.top - parentRect.top - margin;
      } else if (targetRect.bottom > parentRect.bottom - parentBottomClearance) {
        nextTop += targetRect.bottom - parentRect.bottom + parentBottomClearance;
      }

      nextTop = Math.max(0, Math.min(nextTop, parent.scrollHeight - parent.clientHeight));
      if (Math.abs(nextTop - parent.scrollTop) > 1) {
        animateScrollTo(root, parent, nextTop, 520);
        scrolled = true;
      }
    }
    parent = parent.parentElement;
  }

  return scrolled;
};

const scrollToTarget = (root, target, options = {}) => {
  if (!isVisibleElement(target)) {
    clearHighlight(root);
    return;
  }

  clearHighlightAutoHideTimer(root);
  dockChecklistAwayFromTarget(root, target);

  const topOffset = getScrollTopOffset();
  const checklistBottomClearance = getCompactChecklistBottomClearance(root);
  const scrolledInnerContainer = scrollScrollableAncestorsToTarget(root, target, checklistBottomClearance);

  const alignWindow = () => {
    if (!isVisibleElement(target)) {
      clearHighlight(root);
      return;
    }
    const rect = target.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    const bottomOffset = Math.max(
      Math.min(Math.max(viewportHeight * 0.18, 110), 180),
      checklistBottomClearance
    );
    const usableHeight = Math.max(160, viewportHeight - topOffset - bottomOffset);
    const needsScroll = rect.top < topOffset ||
      rect.bottom > viewportHeight - bottomOffset ||
      rect.height > usableHeight;

    if (needsScroll) {
      animateScrollTo(root, window, Math.max(0, window.scrollY + rect.top - topOffset), 520);
    }
  };

  if (scrolledInnerContainer) {
    setTrackedTimeout(root, alignWindow, getScrollBehavior(root) === 'smooth' ? 280 : 0);
  } else {
    alignWindow();
  }

  scheduleHighlightRefreshBurst(root, target);
  if (options.autoHideHighlight) {
    const delay = options.autoHideDelay || options.autoHideDelay === 0 ?
      options.autoHideDelay :
      DEFAULTS.highlightAutoHideDelay;
    scheduleHighlightAutoHide(root, delay);
  }
};

const resolveStepHighlightTarget = (config, step) => {
  if (!step) {
    return null;
  }

  const responsiveTarget = window.matchMedia && window.matchMedia('(max-width: 64rem)').matches ?
    step.highlightTargetCompact : step.highlightTargetDesktop;
  return resolveTarget(config, responsiveTarget || step.highlightTarget || step.showTarget || step.target);
};

const highlightChecklistStep = (root, config, step, callback = () => {}) => {
  if (!step) {
    callback();
    return;
  }

  runStepOpenAction(root, config, step, () => {
    const target = resolveStepHighlightTarget(config, step);
    scrollToTarget(root, target, {
      autoHideHighlight: true,
      autoHideDelay: config.highlightAutoHideDelay
    });
    callback();
  });
};

const scrollActiveNavItemIntoView = root => {
  const active = root.querySelector(`${SELECTORS.navItem}.is-active`);
  if (active) {
    active.scrollIntoView({
      behavior: getScrollBehavior(root),
      block: 'nearest',
      inline: 'center'
    });
  }
};

const getActiveSlideIndex = root => Number(root.getAttribute('data-easyedu-guide-current-slide') || 0);

const getSlideCount = root => root.querySelectorAll(SELECTORS.slide).length;

const isRequirementMet = (config, requirement) => {
  if (!requirement) {
    return true;
  }

  return !!resolveTarget(config, requirement);
};

const formatLabel = (template, value) => String(template || '')
  .replace('{$a}', value || '')
  .replace('__step__', value || '');

const getStepIdentifier = (step, index) => step.id || String(index);

const getRequiredStep = (steps, requiredStepId) => steps.find((step, index) => getStepIdentifier(step, index) === requiredStepId);

const getLockedStepRequirement = (config, steps, step) => {
  if (step.requiresStep) {
    const requiredStep = getRequiredStep(steps, step.requiresStep);
    return formatLabel(config.labels.completeStepFirst, (requiredStep && requiredStep.title) || step.requiresStep);
  }

  return step.requiresLabel || '';
};

const isChecklistComplete = list => {
  const steps = Array.from(list.querySelectorAll('[data-easyedu-guide-step-id]'));
  const actionable = steps.filter(step => !step.classList.contains('is-locked'));

  return actionable.length > 0 && actionable.every(step => step.classList.contains('is-complete'));
};

const getSlideRequirement = (root, index) => {
  const navItem = root.querySelector(`${SELECTORS.navItem}[data-easyedu-guide-nav-item="${index}"]`);
  const slide = root.querySelector(`${SELECTORS.slide}[data-easyedu-guide-slide="${index}"]`);

  return (navItem && navItem.getAttribute('data-easyedu-guide-requires')) ||
    (slide && slide.getAttribute('data-easyedu-guide-requires')) ||
    '';
};

const syncSlideLocks = (root, config) => {
  const slides = Array.from(root.querySelectorAll(SELECTORS.slide));

  root.querySelectorAll(SELECTORS.navItem).forEach((item, index) => {
    const requirement = item.getAttribute('data-easyedu-guide-requires') ||
      (slides[index] ? slides[index].getAttribute('data-easyedu-guide-requires') : '');
    const locked = requirement ? !isRequirementMet(config, requirement) : false;

    item.classList.toggle('is-locked', locked);
    item.setAttribute('aria-disabled', 'false');
    item.removeAttribute('tabindex');
  });
};

const isSlideLocked = (root, config, index) => {
  const requirement = getSlideRequirement(root, index);

  return requirement ? !isRequirementMet(config, requirement) : false;
};

const findAvailableSlideIndex = (root, config, requestedIndex, direction = 0) => {
  const total = getSlideCount(root);
  if (total <= 0) {
    return 0;
  }

  const start = Math.max(0, Math.min(requestedIndex, total - 1));
  if (!isSlideLocked(root, config, start)) {
    return start;
  }

  const forward = direction < 0 ? -1 : 1;
  for (let index = start + forward; index >= 0 && index < total; index += forward) {
    if (!isSlideLocked(root, config, index)) {
      return index;
    }
  }

  const backward = forward * -1;
  for (let index = start + backward; index >= 0 && index < total; index += backward) {
    if (!isSlideLocked(root, config, index)) {
      return index;
    }
  }

  return start;
};

const hasAvailableSlide = (root, config, currentIndex, direction) => {
  const total = getSlideCount(root);
  for (let index = currentIndex + direction; index >= 0 && index < total; index += direction) {
    if (!isSlideLocked(root, config, index)) {
      return true;
    }
  }

  return false;
};

const updateNavScrollButtons = root => {
  const nav = root.querySelector(SELECTORS.nav);
  const previous = root.querySelector(SELECTORS.navPrevious);
  const next = root.querySelector(SELECTORS.navNext);
  if (!nav || (!previous && !next)) {
    return;
  }

  const items = Array.from(nav.querySelectorAll(SELECTORS.navItem));
  const navRect = nav.getBoundingClientRect();
  const firstRect = items.length ? items[0].getBoundingClientRect() : navRect;
  const lastRect = items.length ? items[items.length - 1].getBoundingClientRect() : navRect;
  const atStart = firstRect.left >= navRect.left - 1 && firstRect.right <= navRect.right + 1;
  const atEnd = lastRect.left >= navRect.left - 1 && lastRect.right <= navRect.right + 1;
  if (previous) {
    previous.disabled = atStart;
  }
  if (next) {
    next.disabled = atEnd;
  }
};

const formatProgressLabel = (template, current, total) => {
  if (!template) {
    return `${current}/${total}`;
  }

  return template
    .replace('{$a->current}', String(current))
    .replace('{$a->total}', String(total))
    .replace('__current__', String(current))
    .replace('__total__', String(total));
};

const setActiveSlide = (root, index, config, options = {}) => {
  if (config) {
    syncSlideLocks(root, config);
  }

  const slides = Array.from(root.querySelectorAll(SELECTORS.slide));
  const direction = index < getActiveSlideIndex(root) ? -1 : 1;
  const safeIndex = config && !options.allowLocked ?
    findAvailableSlideIndex(root, config, index, direction) :
    Math.max(0, Math.min(index, slides.length - 1));
  const current = safeIndex + 1;
  const total = slides.length;

  slides.forEach((slide, slideIndex) => {
    const locked = config ? isSlideLocked(root, config, slideIndex) : false;
    slide.hidden = slideIndex !== safeIndex;
    slide.classList.toggle('is-active', slideIndex === safeIndex);
    slide.classList.toggle('is-locked', locked);
    slide.classList.toggle('is-locked-active', locked && slideIndex === safeIndex);
  });

  root.querySelectorAll(SELECTORS.navItem).forEach((item, itemIndex) => {
    item.classList.toggle('is-active', itemIndex === safeIndex);
    item.setAttribute('aria-current', itemIndex === safeIndex ? 'step' : 'false');
  });

  if (config) {
    root.querySelectorAll(SELECTORS.previous).forEach(button => {
      button.disabled = !hasAvailableSlide(root, config, safeIndex, -1);
    });
    root.querySelectorAll(SELECTORS.next).forEach(button => {
      button.disabled = !hasAvailableSlide(root, config, safeIndex, 1);
    });
  }

  root.querySelectorAll('[data-easyedu-guide-progress-label]').forEach(label => {
    label.textContent = formatProgressLabel(label.getAttribute('data-progress-label') || '', current, total);
  });

  root.querySelectorAll('[data-easyedu-guide-progress-bar]').forEach(progressBar => {
    progressBar.style.width = total > 0 ? ((current / total) * 100) + '%' : '0%';
    progressBar.setAttribute('aria-valuenow', String(current));
    progressBar.setAttribute('aria-valuemax', String(total));
  });

  root.setAttribute('data-easyedu-guide-current-slide', String(safeIndex));
  scrollActiveNavItemIntoView(root);
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const openModal = (root, config) => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  const returnFocus = !modal.contains(document.activeElement) ? document.activeElement : null;
  Array.from(openGuideRoots).forEach(openRoot => {
    if (openRoot !== root) {
      closeModal(openRoot, false, false);
    }
  });
  root.easyeduGuideReturnFocus = returnFocus;
  // Opening or returning to the guide only changes the visible surface. It
  // must not discard a guided path's persisted completion state.
  hideChecklist(root, config);
  lockPageScroll(root);
  modal.hidden = false;
  modal.classList.add('is-open');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('tabindex', '-1');
  modal.focus({preventScroll: true});

  const storage = getStorage();
  if (storage) {
    storage.setItem(config.storageKey, '1');
  }
  syncSlideLocks(root, config);
  setActiveSlide(root, getActiveSlideIndex(root), config);
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const closeModal = (root, preserveHighlight = false, restoreFocus = true) => {
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  modal.classList.remove('is-open');
  modal.hidden = true;
  modal.removeAttribute('aria-modal');
  unlockPageScroll(root);
  if (!preserveHighlight) {
    hideInterfaceReturn(root, true);
    clearHighlight(root);
  }
  const returnFocus = root.easyeduGuideReturnFocus;
  root.easyeduGuideReturnFocus = null;
  if (restoreFocus && isVisibleElement(returnFocus)) {
    returnFocus.focus({preventScroll: true});
  }
};

const getPathLabel = (pathName, config) => {
  const pathConfig = config.pathLabels && config.pathLabels[pathName];
  if (pathConfig) {
    return pathConfig;
  }

  return pathName
    .split(/[-_]+/)
    .filter(Boolean)
    .join(' ');
};

const updateChecklistHeader = (root, config, activeStep = null) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return;
  }

  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const steps = config.paths[pathName] || [];
  const items = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id]'));
  const activeItem = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = activeItem ? Number(activeItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const step = activeStep || steps[activeIndex] || steps[0] || {};
  const completeCount = items.filter(item => item.classList.contains('is-complete')).length;
  const complete = items.length > 0 && completeCount === items.length;
  const title = root.querySelector(SELECTORS.checklistTitle);
  const subtitle = root.querySelector(SELECTORS.checklistSubtitle);

  if (title) {
    title.textContent = complete ?
      (config.labels.complete || config.labels.guidedPath || '') :
      `${config.labels.guidedPath || ''}: ${step.title || getPathLabel(pathName, config)}`;
  }
  if (subtitle) {
    subtitle.textContent = `${completeCount}/${steps.length} ${config.labels.visited || ''}`;
  }
};

const isCompactChecklistViewport = () => window.matchMedia &&
  window.matchMedia('(max-width: 40rem), (max-height: 32rem)').matches;

const syncChecklistMinimizeControl = root => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const minimize = root.querySelector(SELECTORS.checklistMinimize);
  if (!checklist || !minimize) {
    return;
  }
  const minimized = checklist.classList.contains('is-minimized');
  minimize.setAttribute('aria-expanded', minimized ? 'false' : 'true');
  const icon = minimize.querySelector('.fa');
  if (icon) {
    icon.classList.toggle('fa-minus', !minimized);
    icon.classList.toggle('fa-expand', minimized);
  }
};

const renderChecklist = (root, config, pathName) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const list = root.querySelector(SELECTORS.checklistItems);
  const message = root.querySelector(SELECTORS.checklistMessage);
  const steps = config.paths[pathName] || [];

  if (!checklist || !list || steps.length === 0) {
    return;
  }

  checklist.hidden = false;
  hideInterfaceReturn(root, true);
  const wasMinimized = checklist.classList.contains('is-minimized');
  const compactDefault = isCompactChecklistViewport() &&
    checklist.getAttribute('data-easyedu-guide-checklist-expanded') !== '1';
  checklist.classList.remove('is-complete', 'is-docked-left', 'is-docked-right');
  checklist.classList.toggle('is-minimized', isCompactChecklistViewport() ? compactDefault : wasMinimized);
  checklist.classList.toggle('is-unlock-path', config.unlockPaths.includes(pathName));
  checklist.classList.toggle('has-guided-feedback', steps.some(step => !!step.feedback));
  checklist.setAttribute('data-easyedu-guide-path', pathName);
  list.innerHTML = '';

  steps.forEach((step, index) => {
    const stepComplete = isStepComplete(config, pathName, step, index);
    const dependencyMissing = step.requiresStep ? !getCompletedSteps(config, pathName).includes(step.requiresStep) : false;
    const locked = (step.requires ? !isRequirementMet(config, step.requires) : false) || dependencyMissing;
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'easyedu-guide-checklist__item easyedu-guided-panel__step';
    item.classList.toggle('is-locked', locked);
    item.classList.toggle('is-complete', stepComplete);
    item.disabled = locked;
    item.setAttribute('data-easyedu-guide-step-id', step.id || String(index));
    item.setAttribute('data-easyedu-guide-step-index', String(index));
    item.setAttribute('aria-disabled', locked ? 'true' : 'false');
    if (locked) {
      item.setAttribute('data-easyedu-guide-lock-message', getLockedStepRequirement(config, steps, step));
    }
    if (step.feedback) {
      item.setAttribute('data-easyedu-guide-feedback', step.feedback);
    }
    const marker = document.createElement('span');
    marker.className = 'easyedu-guide-checklist__marker easyedu-guided-panel__index';
    marker.textContent = String(index + 1);
    const label = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = step.title || '';
    label.appendChild(title);
    if (step.description) {
      const description = document.createElement('small');
      description.textContent = step.description;
      label.appendChild(description);
    }
    if (locked && (step.requiresLabel || step.requiresStepLabel || step.requiresStep)) {
      const requirement = document.createElement('small');
      requirement.className = 'easyedu-guide-checklist__requirement';
      requirement.textContent = getLockedStepRequirement(config, steps, step);
      label.appendChild(requirement);
    }
    item.append(marker, label);
    list.appendChild(item);
  });

  const state = loadGuideState(config);
  const preferredItem = state.path === pathName ?
    list.querySelector(`[data-easyedu-guide-step-index="${Number(state.activeIndex || 0)}"]:not(.is-locked)`) :
    null;
  const firstItem = preferredItem ||
    list.querySelector('[data-easyedu-guide-step-index]:not(.is-complete):not(.is-locked)') ||
    list.querySelector('[data-easyedu-guide-step-index]:not(.is-locked)');
  if (firstItem) {
    firstItem.classList.add('is-active');
    firstItem.setAttribute('aria-current', 'step');
  }

  if (message) {
    const allComplete = isChecklistComplete(list);
    const activeStepIndex = firstItem ? Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
    const activeStep = steps[activeStepIndex] || steps[0] || {};
    const completeMessage = message.getAttribute('data-complete-message') || config.labels.complete;
    const initialText = allComplete ? completeMessage : (activeStep.feedback || config.labels.hint || config.labels.complete);
    const icon = message.querySelector('.fa');
    const text = message.querySelector('[data-easyedu-guide-checklist-message-text]');
    checklist.classList.toggle('is-complete', allComplete);
    message.classList.toggle('is-complete', allComplete);
    if (icon) {
      icon.classList.toggle('fa-check-circle', allComplete);
      icon.classList.toggle('fa-location-arrow', !allComplete);
    }
    if (text) {
      text.textContent = initialText;
    }
  }

  saveChecklistProgress(root, config, pathName, firstItem ? Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0) : 0);
  updateChecklistHeader(root, config, firstItem ? steps[Number(firstItem.getAttribute('data-easyedu-guide-step-index') || 0)] : (steps[0] || null));
  syncChecklistMinimizeControl(root);
};

const updateChecklistMessage = (root, config, activeStep) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const message = root.querySelector(SELECTORS.checklistMessage);
  if (!checklist || !message) {
    return;
  }

  const items = Array.from(checklist.querySelectorAll('[data-easyedu-guide-step-id]'));
  const complete = isChecklistComplete(checklist);
  const icon = message.querySelector('.fa');
  const text = message.querySelector('[data-easyedu-guide-checklist-message-text]');
  const completeMessage = message.getAttribute('data-complete-message') || config.labels.complete;
  const activeMessage = activeStep && activeStep.feedback ? activeStep.feedback : (config.labels.hint || '');

  checklist.classList.toggle('is-complete', complete);
  message.classList.toggle('is-complete', complete);
  if (icon) {
    icon.classList.toggle('fa-location-arrow', !complete);
    icon.classList.toggle('fa-check-circle', complete);
  }
  if (text) {
    text.textContent = complete ? completeMessage : activeMessage;
  }
  updateChecklistHeader(root, config, activeStep || null);
};

const setActiveChecklistStep = (root, config, index) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return null;
  }
  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const steps = config.paths[pathName] || [];
  const safeIndex = Math.max(0, Math.min(index, steps.length - 1));
  checklist.querySelectorAll('[data-easyedu-guide-step-index]').forEach(item => {
    const active = Number(item.getAttribute('data-easyedu-guide-step-index') || 0) === safeIndex;
    item.classList.toggle('is-active', active);
    item.setAttribute('aria-current', active ? 'step' : 'false');
  });
  saveChecklistProgress(root, config, pathName, safeIndex);
  updateChecklistMessage(root, config, steps[safeIndex]);
  return steps[safeIndex] || null;
};

const markChecklistStepComplete = (root, config, stepIdOrIndex, activeStep) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist) {
    return;
  }
  const pathName = checklist.getAttribute('data-easyedu-guide-path') || '';
  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], ` +
    `[data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  if (item) {
    item.classList.add('is-complete');
  }
  const active = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = active ? Number(active.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const steps = config.paths[pathName] || [];
  saveChecklistProgress(root, config, pathName, Math.min(activeIndex + 1, Math.max(steps.length - 1, 0)));
  renderChecklist(root, config, pathName);
  updateChecklistMessage(root, config, activeStep || null);
};

const runStepOpenAction = (root, config, step, callback) => {
  clearStepOpenTimers(root);
  if (!step || !step.open) {
    callback();
    return;
  }

  const actions = Array.isArray(step.open) ? step.open : [step.open];
  const runAction = index => {
    if (index >= actions.length) {
      callback();
      return;
    }

    const action = actions[index];
    const targetKey = typeof action === 'string' ? action : (action.target || action.selector || action.open);
    const delay = Number(typeof action === 'string' ? step.openDelay : (action.delay || step.openDelay || 260));
    const request = {target: targetKey, root, handled: false};
    document.dispatchEvent(new CustomEvent('easyedu:guide-open-target', {
      detail: request
    }));
    if (!request.handled) {
      const openControl = resolveTarget(config, targetKey);
      const alreadyOpen = openControl &&
        (openControl.getAttribute('aria-expanded') === 'true' ||
          openControl.getAttribute('aria-pressed') === 'true');
      if (openControl && !alreadyOpen) {
        openControl.click();
      }
    }

    setStepOpenTimeout(root, () => runAction(index + 1), delay);
  };

  runAction(0);
};

const runShowTargetOpenAction = (root, config, targetButton, callback) => {
  const runAction = (targetKey, delay, done) => {
    if (!targetKey) {
      done();
      return;
    }

    const request = {target: targetKey, root, handled: false};
    document.dispatchEvent(new CustomEvent('easyedu:guide-open-target', {
      detail: request
    }));
    if (!request.handled) {
      const openControl = resolveTarget(config, targetKey);
      const alreadyOpen = openControl &&
        (openControl.getAttribute('aria-expanded') === 'true' ||
          openControl.getAttribute('aria-pressed') === 'true');
      if (openControl && !alreadyOpen) {
        openControl.click();
      }
    }
    setTrackedTimeout(root, done, delay);
  };

  const primaryTarget = targetButton.getAttribute('data-easyedu-guide-show-open');
  const primaryDelay = Math.max(0, Number(targetButton.getAttribute('data-easyedu-guide-show-open-delay') || 320));
  const detailTarget = targetButton.getAttribute('data-easyedu-guide-show-after-open');
  const detailDelay = Math.max(0, Number(targetButton.getAttribute('data-easyedu-guide-show-after-open-delay') || 320));
  runAction(primaryTarget, primaryDelay, () => runAction(detailTarget, detailDelay, callback));
};

// A product can expose a distinct, but equivalent, control in compact and
// desktop workspaces. Keep that decision in the product-owned slide data while
// the shared Guide remains responsible for resolving, scrolling and
// highlighting the selected visible control.
const resolveShowTargetKey = targetButton => {
  const compact = window.matchMedia && window.matchMedia('(max-width: 64rem)').matches;
  const variant = targetButton.getAttribute(
    compact ? 'data-easyedu-guide-show-target-compact' : 'data-easyedu-guide-show-target-desktop'
  );
  return variant || targetButton.getAttribute('data-easyedu-guide-show-target');
};

const notifyInterfaceTransition = (root, reason) => {
  root.dispatchEvent(new CustomEvent('easyedu:guide-interface-transition', {
    bubbles: true,
    detail: {reason}
  }));
};

const completeStep = (root, config, pathName, stepIdOrIndex) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.getAttribute('data-easyedu-guide-path') !== pathName) {
    return;
  }

  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], [data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  if (item) {
    item.classList.add('is-complete');
  }

  const active = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const activeIndex = active ? Number(active.getAttribute('data-easyedu-guide-step-index') || 0) : 0;
  const steps = config.paths[pathName] || [];
  saveChecklistProgress(root, config, pathName, Math.min(activeIndex + 1, Math.max(steps.length - 1, 0)));
  renderChecklist(root, config, pathName);
  updateChecklistMessage(root, config, active ? {
    feedback: active.getAttribute('data-easyedu-guide-feedback') || ''
  } : null);
};

const refreshActiveHighlight = (root, shouldDock = false) => {
  const highlight = document.querySelector(
    `${SELECTORS.highlight}[data-easyedu-guide-owner="${root.easyeduGuideId || ''}"]`
  );
  if (!highlight || highlight.hidden || !root.easyeduGuideCurrentTarget) {
    return;
  }

  if (shouldDock) {
    dockChecklistAwayFromTarget(root, root.easyeduGuideCurrentTarget);
  }

  updateHighlight(root, root.easyeduGuideCurrentTarget);
};

const isModalOpen = root => {
  const modal = root.querySelector(SELECTORS.modal);
  return !!modal && !modal.hidden && modal.classList.contains('is-open');
};

const isTypingTarget = target => {
  if (!target) {
    return false;
  }

  const tagName = target.tagName ? target.tagName.toLowerCase() : '';
  return target.isContentEditable ||
    tagName === 'input' ||
    tagName === 'select' ||
    tagName === 'textarea';
};

const moveNav = (root, direction) => {
  const nav = root.querySelector(SELECTORS.nav);
  if (!nav) {
    return;
  }

  const rtlMultiplier = window.getComputedStyle(nav).direction === 'rtl' ? -1 : 1;
  nav.scrollBy({
    left: direction * rtlMultiplier * Math.max(nav.clientWidth * 0.75, 160),
    behavior: getScrollBehavior(root)
  });
};

const bindNavWheel = root => {
  const nav = root.querySelector(SELECTORS.nav);
  if (!nav || nav.dataset.easyeduGuideWheelBound === '1') {
    return;
  }
  nav.dataset.easyeduGuideWheelBound = '1';
  addTrackedListener(root, nav, 'scroll', () => updateNavScrollButtons(root), {passive: true});
  addTrackedListener(root, nav, 'wheel', event => {
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) {
      return;
    }

    event.preventDefault();
    const rtlMultiplier = window.getComputedStyle(nav).direction === 'rtl' ? -1 : 1;
    nav.scrollBy({
      left: event.deltaY * rtlMultiplier,
      behavior: 'auto'
    });
    updateNavScrollButtons(root);
  }, {passive: false});
  addTrackedListener(root, window, 'resize', () => updateNavScrollButtons(root));
  updateNavScrollButtons(root);
};

const bindHighlightAutoRefresh = root => {
  if (root.dataset.easyeduGuideHighlightRefreshBound === '1') {
    return;
  }
  root.dataset.easyeduGuideHighlightRefreshBound = '1';

  const refresh = event => {
    const shouldDock = event && event.type !== 'scroll';
    scheduleHighlightRefresh(root, root.easyeduGuideCurrentTarget, shouldDock);
  };

  addTrackedListener(root, window, 'scroll', refresh, true);
  addTrackedListener(root, window, 'resize', refresh);
  addTrackedListener(root, document, 'transitionend', refresh, true);
  addTrackedListener(root, document, 'animationend', refresh, true);
  addTrackedListener(root, document, 'shown.bs.modal', refresh, true);
  addTrackedListener(root, document, 'hidden.bs.modal', refresh, true);

};

const bindGuide = (root, config) => {
  root.easyeduGuideConfig = config;
  if (root.dataset.easyeduGuideBound === '1') {
    return;
  }
  root.dataset.easyeduGuideBound = '1';

  addTrackedListener(root, root, 'click', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    const open = event.target.closest(SELECTORS.open);
    if (open && root.contains(open)) {
      event.preventDefault();
      openModal(root, activeConfig);
      return;
    }

    const navNext = event.target.closest(SELECTORS.navNext);
    if (navNext && root.contains(navNext)) {
      event.preventDefault();
      moveNav(root, 1);
      return;
    }

    const navPrevious = event.target.closest(SELECTORS.navPrevious);
    if (navPrevious && root.contains(navPrevious)) {
      event.preventDefault();
      moveNav(root, -1);
      return;
    }

    const close = event.target.closest(SELECTORS.close);
    if (close && root.contains(close)) {
      event.preventDefault();
      closeModal(root);
      return;
    }

    const next = event.target.closest(SELECTORS.next);
    if (next && root.contains(next)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) + 1, activeConfig);
      return;
    }

    const previous = event.target.closest(SELECTORS.previous);
    if (previous && root.contains(previous)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) - 1, activeConfig);
      return;
    }

    const minimize = event.target.closest(SELECTORS.checklistMinimize);
    if (minimize && root.contains(minimize)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const checklist = root.querySelector(SELECTORS.checklist);
      if (checklist) {
        const minimized = !checklist.classList.contains('is-minimized');
        checklist.classList.toggle('is-minimized', minimized);
        if (isCompactChecklistViewport()) {
          checklist.toggleAttribute('data-easyedu-guide-checklist-expanded', !minimized);
        }
        syncChecklistMinimizeControl(root);
      }
      return;
    }

    const navItem = event.target.closest(SELECTORS.navItem);
    if (navItem && root.contains(navItem)) {
      event.preventDefault();
      syncSlideLocks(root, activeConfig);
      setActiveSlide(root, Number(navItem.getAttribute('data-easyedu-guide-nav-item') || 0), activeConfig, {
        allowLocked: navItem.classList.contains('is-locked')
      });
      return;
    }

    const targetButton = event.target.closest(SELECTORS.showTarget);
    if (targetButton && root.contains(targetButton)) {
      event.preventDefault();
      closeModal(root, true, false);
      notifyInterfaceTransition(root, 'show-target');
      runShowTargetOpenAction(root, activeConfig, targetButton, () => {
        const target = resolveTarget(activeConfig, resolveShowTargetKey(targetButton));
        if (!target) {
          // A consumer can temporarily remove a target while changing views.
          // Reopen the guide rather than leaving the visitor without context.
          openModal(root, activeConfig);
          return;
        }
        scrollToTarget(root, target);
        focusTarget(target);
        showInterfaceReturn(root);
      });
      return;
    }

    const startPath = event.target.closest(SELECTORS.startPath);
    if (startPath && root.contains(startPath)) {
      event.preventDefault();
      syncSlideLocks(root, activeConfig);
      renderChecklist(root, activeConfig, startPath.getAttribute('data-easyedu-guide-start-path'));
      closeModal(root, false, false);
      notifyInterfaceTransition(root, 'guided-path');
      const checklist = root.querySelector(SELECTORS.checklist);
      const activeItem = checklist ?
        checklist.querySelector('[data-easyedu-guide-step-index].is-active') :
        null;
      const pathName = checklist ? checklist.getAttribute('data-easyedu-guide-path') : '';
      const steps = activeConfig.paths[pathName] || [];
      const stepIndex = activeItem ?
        Number(activeItem.getAttribute('data-easyedu-guide-step-index') || 0) :
        0;
      highlightChecklistStep(root, activeConfig, steps[stepIndex] || null);
      return;
    }

    const checklistItem = event.target.closest('[data-easyedu-guide-step-index]');
    if (checklistItem && root.contains(checklistItem)) {
      event.preventDefault();
      if (checklistItem.classList.contains('is-locked')) {
        return;
      }
      const checklist = root.querySelector(SELECTORS.checklist);
      const pathName = checklist ? checklist.getAttribute('data-easyedu-guide-path') : '';
      const stepIndex = Number(checklistItem.getAttribute('data-easyedu-guide-step-index') || 0);
      const step = setActiveChecklistStep(root, activeConfig, stepIndex);
      highlightChecklistStep(root, activeConfig, step, () => {
        if (step && (step.completeOnClick || step.completeOn || step.waitForCompletion ||
            ['action', 'event', 'reload'].includes(step.completionMode))) {
          updateChecklistMessage(root, activeConfig, step);
          return;
        }
        markChecklistStepComplete(root, activeConfig, step && step.id ? step.id : stepIndex, step);
      });
    }
  });

  addTrackedListener(root, root, 'keydown', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    if (!isModalOpen(root)) {
      return;
    }
    const modal = root.querySelector(SELECTORS.modal);
    if (modal && trapModalFocus(modal, event)) {
      return;
    }
    if (isTypingTarget(event.target)) {
      return;
    }

    const activeIndex = getActiveSlideIndex(root);
    const slideCount = getSlideCount(root);
    const rtlMultiplier = window.getComputedStyle(root).direction === 'rtl' ? -1 : 1;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setActiveSlide(root, activeIndex + rtlMultiplier, activeConfig);
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveSlide(root, activeIndex - rtlMultiplier, activeConfig);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSlide(root, 0, activeConfig);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveSlide(root, slideCount - 1, activeConfig);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal(root);
    }
  });

  addTrackedListener(root, document, 'focusin', event => {
    if (!isModalOpen(root)) {
      return;
    }
    const modal = root.querySelector(SELECTORS.modal);
    if (!modal || modal.contains(event.target)) {
      return;
    }
    const focusable = getFocusableElements(modal);
    (focusable[0] || modal).focus({preventScroll: true});
  });

  bindNavWheel(root);

  addTrackedListener(root, document, 'easyedu:guide-step-complete', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    if (!event.detail) {
      return;
    }
    completeStep(root, activeConfig, event.detail.path, event.detail.step);
  });

  addTrackedListener(root, document, 'easyedu:guide-refresh-highlight', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    const detail = event.detail || {};
    if (detail.root) {
      const targetRoot = typeof detail.root === 'string' ? document.querySelector(detail.root) : detail.root;
      if (targetRoot && targetRoot !== root) {
        return;
      }
    }

    const target = detail.target ? resolveTarget(activeConfig, detail.target) : root.easyeduGuideCurrentTarget;
    scheduleHighlightRefresh(root, target, detail.dock !== false);
  });

  Object.keys(config.paths).forEach(pathName => {
    config.paths[pathName].forEach((step, index) => {
      if (step.completeOnClick && step.target) {
        addTrackedListener(root, document, 'click', event => {
          if (!eventMatchesTarget(config, step.target, event)) {
            return;
          }

          const state = loadGuideState(config);
          const checklist = root.querySelector(SELECTORS.checklist);
          const currentPath = checklist && !checklist.hidden ?
            checklist.getAttribute('data-easyedu-guide-path') :
            (state.path || '');
          if (currentPath !== pathName) {
            return;
          }
          const completed = Object.assign({}, state.completed || {});
          const pathCompleted = Array.isArray(completed[pathName]) ? completed[pathName].slice() : [];
          const stepId = step.id || String(index);
          if (!pathCompleted.includes(stepId)) {
            pathCompleted.push(stepId);
          }
          completed[pathName] = pathCompleted;
          saveGuideState(config, {
            path: pathName,
            activeIndex: Math.min(index + 1, Math.max((config.paths[pathName] || []).length - 1, 0)),
            completed,
            slideIndex: Number(root.getAttribute('data-easyedu-guide-current-slide') || 0)
          });
          completeStep(root, config, pathName, stepId);
        }, true);
      }
      if (!step.completeOn) {
        return;
      }
      addTrackedListener(
        root,
        document,
        step.completeOn,
        () => completeStep(root, config, pathName, step.id || index)
      );
    });
  });

  const closeChecklist = root.querySelector(SELECTORS.checklistClose);
  if (closeChecklist) {
    addTrackedListener(root, closeChecklist, 'click', () => {
      hideChecklist(root, config);
    });
  }

  const returnFromInterface = root.querySelector(SELECTORS.interfaceReturnButton);
  if (returnFromInterface) {
    addTrackedListener(root, returnFromInterface, 'click', event => {
      event.preventDefault();
      hideInterfaceReturn(root, true);
      openModal(root, config);
    });
  }

  const dismissInterfaceReturn = root.querySelector(SELECTORS.interfaceReturnDismiss);
  if (dismissInterfaceReturn) {
    addTrackedListener(root, dismissInterfaceReturn, 'click', event => {
      event.preventDefault();
      hideInterfaceReturn(root, true);
    });
  }

  const returnToGuide = root.querySelector(SELECTORS.checklistReturn);
  if (returnToGuide) {
    addTrackedListener(root, returnToGuide, 'click', () => {
      hideChecklist(root, config);
      openModal(root, config);
    });
  }

  bindHighlightAutoRefresh(root);
};

const destroy = rootOrSelector => {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
  if (!root) {
    return;
  }

  unlockPageScroll(root);
  clearTrackedListeners(root);
  clearTrackedTimeouts(root);
  clearHighlightAutoHideTimer(root);
  hideInterfaceReturn(root, false);
  clearHighlightedTarget(root);
  const checklist = root.querySelector(SELECTORS.checklist);
  if (checklist) {
    checklist.hidden = true;
    checklist.classList.remove('is-complete', 'is-minimized', 'is-docked-left', 'is-docked-right', 'is-unlock-path');
  }

  if (root.easyeduGuideMutationObserver) {
    root.easyeduGuideMutationObserver.disconnect();
    root.easyeduGuideMutationObserver = null;
  }
  if (root.easyeduGuideRefreshFrame) {
    window.cancelAnimationFrame(root.easyeduGuideRefreshFrame);
    root.easyeduGuideRefreshFrame = null;
  }
  if (root.easyeduGuideRefreshBurstFrame) {
    window.cancelAnimationFrame(root.easyeduGuideRefreshBurstFrame);
    root.easyeduGuideRefreshBurstFrame = null;
  }
  (root.easyeduGuideScrollers || []).forEach(scroller => {
    if (scroller === window) {
      windowScrollAnimationToken = null;
    } else {
      scrollAnimationTokens.delete(scroller);
    }
  });
  root.easyeduGuideScrollers = new Set();

  const highlight = root.easyeduGuideId ?
    document.querySelector(`${SELECTORS.highlight}[data-easyedu-guide-owner="${root.easyeduGuideId}"]`) :
    null;
  if (highlight) {
    highlight.remove();
  }

  root.querySelectorAll(SELECTORS.modal).forEach(modal => {
    modal.hidden = true;
    modal.classList.remove('is-open');
    modal.removeAttribute('aria-modal');
  });
  const nav = root.querySelector(SELECTORS.nav);
  if (nav) {
    delete nav.dataset.easyeduGuideWheelBound;
  }
  delete root.dataset.easyeduGuideBound;
  delete root.dataset.easyeduGuideHighlightRefreshBound;
  delete root.dataset.easyeduGuideHighlightStyle;
  root.easyeduGuideConfig = null;
  root.easyeduGuideReturnFocus = null;
};

const init = (rootOrSelector, rawConfig) => {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;

  if (!root) {
    return;
  }

  const config = mergeConfig(rawConfig);
  root.dataset.easyeduGuideHighlightStyle = config.highlightStyle || DEFAULTS.highlightStyle;
  syncSlideLocks(root, config);
  const state = loadGuideState(config);
  const restoredSlideIndex = Number(state.slideIndex);
  setActiveSlide(root, Number.isFinite(restoredSlideIndex) ? restoredSlideIndex : 0, config, {
    allowLocked: Number.isFinite(restoredSlideIndex)
  });
  bindGuide(root, config);
  if (state.path && config.paths[state.path]) {
    renderChecklist(root, config, state.path);
  }

  const storage = getStorage();
  const seen = storage && storage.getItem(config.storageKey) === '1';
  if (config.firstVisit && !seen) {
    openModal(root, config);
  }
};

return {
  destroy: destroy,
  init: init
};
});
