// Generic EasyEdu guide foundation for Moodle plugins.
//
// Plugins should copy this module into their AMD source folder and configure
// selectors, paths and labels from plugin-specific PHP/Mustache data.

const DEFAULTS = {
  storageKey: 'easyedu.guide.seen',
  firstVisit: false,
  highlightAutoHideDelay: 9000,
  highlightStyle: 'default',
  // Instruction pauses are minimums, not deadlines: allow reading longer copy.
  narrationMinimumMs: 2400,
  narrationWordsPerMinute: 180,
  narrationLeadInMs: 900,
  targets: {},
  paths: {},
  unlockPaths: [],
  labels: {
    close: 'Close',
    next: 'Next',
    previous: 'Previous',
    start: 'Start guided path',
    hint: 'Choose a step. The guide opens the right area and keeps this checklist visible.',
    complete: 'Everything is ready. Return to the guide when you want to review another topic.',
    guidedPath: 'Guided path',
    visited: 'visited',
    completeStepFirst: 'Complete "{$a}" first',
    pathReset: 'Path reset. Start again when you are ready.',
    pathCancelled: 'Path cancelled. Your course data has not changed.'
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
  checklistMinimize: '[data-easyedu-guide-checklist-minimize], [data-easyedu-guide-checklist-restore]',
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
    const state = JSON.parse(storage.getItem(getStateKey(config)) || '{}') || {};
    if (config.presentationKey && state.presentationKey !== config.presentationKey &&
        Number.isInteger(state.slideIndex) && Number.isInteger(config.legacySlideOffset)) {
      return {...state, slideIndex: state.slideIndex + config.legacySlideOffset};
    }
    return state;
  } catch (error) {
    return {};
  }
};

const saveGuideState = (config, state) => {
  const storage = getStorage();
  if (!storage) {
    return;
  }

  if (config.presentationKey) {
    const backupKey = `${getStateKey(config)}.before-${config.presentationKey}`;
    if (storage.getItem(backupKey) === null) {
      storage.setItem(backupKey, storage.getItem(getStateKey(config)) || '{}');
    }
    storage.setItem(getStateKey(config), JSON.stringify({...state, presentationKey: config.presentationKey}));
  } else {
    storage.setItem(getStateKey(config), JSON.stringify(state || {}));
  }
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

const isPathComplete = (config, pathName) => {
  const steps = config.paths[pathName] || [];
  return steps.length > 0 && steps.every((step, index) => isStepComplete(config, pathName, step, index));
};

// Reset this Guide path only, never other progress or Moodle course data.
const resetPathProgress = (config, pathName) => {
  const state = loadGuideState(config);
  saveGuideState(config, {...state, path: state.path === pathName ? null : state.path, activeIndex: 0,
    completed: {...(state.completed || {}), [pathName]: []}});
};

const syncPathInvitation = (root, config) => {
  root.querySelectorAll('[data-easyedu-guide-reset-path]').forEach(button => {
    const path = button.getAttribute('data-easyedu-guide-reset-path');
    const state = loadGuideState(config);
    button.hidden = state.path !== path || isPathComplete(config, path);
    const footer = button.closest('[data-easyedu-guide-path-progress]');
    if (footer) { footer.hidden = button.hidden; }
  });
};

const dismissResume = (root, animate = false) => {
  clearTrackedTimeout(root, root.easyeduGuideResumeTimer);
  root.easyeduGuideResumeTimer = null;
  root.easyeduGuideResumeAnimation?.cancel();
  const notice = root.querySelector('[data-easyedu-guide-resume]');
  if (!notice || notice.hidden) { return; }
  if (!animate || getScrollBehavior(root) === 'auto') { notice.hidden = true; return; }
  const motion = notice.animate([{opacity: 1, transform: 'translateY(0)'},
    {opacity: 0, transform: 'translateY(.35rem)'}], {duration: 280, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
  root.easyeduGuideResumeAnimation = motion;
  motion.finished.then(() => { notice.hidden = true; motion.cancel(); }).catch(() => {});
};

const offerResume = (root, config, pathName) => {
  const notice = root.querySelector('[data-easyedu-guide-resume]');
  if (!notice || isPathComplete(config, pathName)) { return; }
  notice.dataset.easyeduGuideResumePathName = pathName;
  notice.hidden = false;
  root.easyeduGuideResumeTimer = setTrackedTimeout(root, () => dismissResume(root, true), 20000);
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
    ...state,
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
  const dialog = isVisibleElement(target) ? target.closest('[role="dialog"][aria-modal="true"]') : null;
  const externalDialog = dialog && dialog !== root.querySelector(SELECTORS.modal);
  root.toggleAttribute('data-easyedu-guide-target-in-dialog', !!externalDialog);
  if (externalDialog) {
    const bounds = target.getBoundingClientRect();
    root.setAttribute('data-easyedu-guide-dialog-dock', bounds.top + bounds.height / 2 > window.innerHeight / 2 ?
      'top' : 'bottom');
  } else {
    root.removeAttribute('data-easyedu-guide-dialog-dock');
  }
  if (!checklist || checklist.hidden || !isVisibleElement(target)) {
    return;
  }

  const rect = target.getBoundingClientRect();
  const viewportMiddle = window.innerWidth / 2;
  // A progress re-render must not reset docking. Move only when the settled
  // target actually overlaps the panel and another horizontal lane can fit.
  const hasDock = checklist.classList.contains('is-docked-right') || checklist.classList.contains('is-docked-left');
  if (hasDock) {
    const panel = checklist.getBoundingClientRect();
    const overlaps = rect.left < panel.right && rect.right > panel.left &&
      rect.top < panel.bottom && rect.bottom > panel.top;
    if (!overlaps || rect.width + panel.width + 32 > window.innerWidth) { return; }
  }
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

// Unlike Return to Guide, Stop invalidates pending native-dialog work.
const stopPath = (root, config, pathName, reset = false) => {
  root.easyeduGuidePathEpoch = (root.easyeduGuidePathEpoch || 0) + 1;
  clearStepOpenTimers(root);
  dismissResume(root);
  hideChecklist(root, config);
  if (reset) {
    resetPathProgress(config, pathName);
  } else {
    const state = loadGuideState(config);
    saveGuideState(config, {...state, path: null});
  }
  syncPathInvitation(root, config);
  root.querySelectorAll('[data-easyedu-guide-path-status]').forEach(status => {
    status.textContent = reset ? config.labels.pathReset : config.labels.pathCancelled;
  });
  if (reset && isModalOpen(root)) {
    const start = Array.from(root.querySelectorAll(SELECTORS.startPath))
      .find(button => button.getAttribute('data-easyedu-guide-start-path') === pathName);
    start?.focus({preventScroll: true});
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

  const epoch = root.easyeduGuidePathEpoch || 0;
  const begin = () => {
    if (epoch !== (root.easyeduGuidePathEpoch || 0)) { return; }
    runStepOpenAction(root, config, step, () => {
      const target = resolveStepHighlightTarget(config, step);
      scrollToTarget(root, target, {
        autoHideHighlight: true,
        autoHideDelay: config.highlightAutoHideDelay
      });
      callback();
    });
  };
  if (step.beforeHighlight) {
    const request = {target: step.beforeHighlight, root, handled: false};
    document.dispatchEvent(new CustomEvent('easyedu:guide-open-target', {detail: request}));
    if (request.ready) {
      Promise.resolve(request.ready).then(completed => {
        if (completed !== false && root.easyeduGuideConfig === config && !root.querySelector(SELECTORS.checklist)?.hidden) {
          begin();
        }
      }).catch(() => {});
      return;
    }
  }
  begin();
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

// The discovery presentation docks the original command, preserving every
// responsive target/open attribute and the existing delegated click handler.
const restoreInterfaceCue = root => {
  const docked = root.easyeduGuideDockedCommand;
  if (docked) {
    docked.anchor.replaceWith(docked.button);
    delete root.easyeduGuideDockedCommand;
  }
};

const syncInterfaceCue = (root, slide) => {
  restoreInterfaceCue(root);
  const slot = root.querySelector('[data-easyedu-guide-interface-cue-action]');
  if (!slot || !slide || slide.classList.contains('is-locked')) {
    return;
  }
  const button = slide.querySelector(SELECTORS.showTarget);
  if (!button) {
    return;
  }
  const anchor = document.createComment('Guide interface command origin');
  button.replaceWith(anchor);
  slot.appendChild(button);
  root.easyeduGuideDockedCommand = {anchor, button};
};

// Illustrations are DOM-only. They never dispatch business completion events.
const stopDiscoveryScene = root => {
  if (root.easyeduGuideSceneStop) {
    root.easyeduGuideSceneStop();
    root.easyeduGuideSceneStop = null;
  }
};

// Names are generated locally from the exercise input, never through Moodle APIs.
const renderDiscoveryNames = (root, scene, command) => {
  stopDiscoveryScene(root);
  const input = scene.querySelector('[data-guide-pattern]');
  const output = scene.querySelector('[data-guide-names]');
  if (!input || !output) { return; }
  if (command === 'letters') {
    input.value = input.value.replace(/[#@]/, value => value === '#' ? '@' : '#');
  }
  const match = input.value.match(/^(.*?)([#@])\*([1-9]\d*)$/);
  const template = scene.querySelector('[data-guide-name-card]');
  const warning = scene.querySelector('[data-guide-warning-host]');
  const warningText = scene.querySelector('[data-guide-warning-text]');
  const reduced = getScrollBehavior(root) === 'auto';
  const animations = new Set();
  let stopped = false;
  output.setAttribute('aria-busy', 'true');
  const animate = async(element, frames, duration, delay = 0) => {
    if (stopped || reduced) { return; }
    const animation = element.animate(frames, {duration, delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
    animations.add(animation);
    try { await animation.finished; } catch (error) { /* Departure/replay cancels the presentation only. */ }
    animation.cancel();
    animations.delete(animation);
  };
  root.easyeduGuideSceneStop = () => {
    stopped = true;
    animations.forEach(animation => animation.cancel());
    output.setAttribute('aria-busy', 'false');
  };
  const run = async() => {
    if (output.childElementCount || output.textContent) {
      await animate(output, [{opacity: 1}, {opacity: 0}], 110);
    }
    if (stopped) { return; }
    if (warning && !warning.hidden) {
      await animate(warning, [{opacity: 1}, {opacity: 0}], 110);
      if (stopped) { return; }
      warning.hidden = true;
    }
    input.removeAttribute('aria-invalid');
    const initialHeight = output.getBoundingClientRect().height;
    output.replaceChildren();
    if (command !== 'clear') {
      if (!match || Number(match[3]) > 6) {
        input.setAttribute('aria-invalid', 'true');
        if (warning && warningText) {
          warningText.textContent = output.getAttribute('data-invalid') || '';
          warning.hidden = false;
          await animate(warning, [{opacity: 0}, {opacity: 1}], 220);
        }
      } else {
        for (let index = 0; index < Number(match[3]); index++) {
          const name = match[1] + (match[2] === '#' ? index + 1 : String.fromCharCode(65 + index));
          const card = template?.content.firstElementChild?.cloneNode(true) || document.createElement('span');
          const label = card.querySelector('[data-guide-name]');
          if (label) { label.textContent = name; } else { card.textContent = name; }
          output.appendChild(card);
        }
      }
    }
    const finalHeight = output.getBoundingClientRect().height;
    await Promise.all([
      animate(output, [{height: initialHeight + 'px'}, {height: finalHeight + 'px'}], 320),
      ...Array.from(output.children, (card, index) => animate(card,
        [{opacity: 0, transform: 'translateY(8px)'}, {opacity: 1, transform: 'translateY(0)'}], 260, index * 55))
    ]);
    if (!stopped) { output.setAttribute('aria-busy', 'false'); }
  };
  run().catch(() => { stopDiscoveryScene(root); });
};

const playDiscoveryScene = (root, scene, requestedMode) => {
  stopDiscoveryScene(root);
  if (!scene) { return; }
  const kind = scene.getAttribute('data-easyedu-guide-scene');
  if (kind === 'concepts') { return; }
  if (kind === 'creation') {
    if (!scene.easyeduGuideNamesInitialized) {
      scene.easyeduGuideNamesInitialized = true;
      renderDiscoveryNames(root, scene, 'preview');
    }
    return;
  }
  const mode = requestedMode || scene.easyeduGuideSceneMode || (kind === 'actions' ? 'actions' : 'add');
  const stage = scene.querySelector('[data-guide-stage]');
  const result = scene.querySelector('[data-guide-result]');
  if (!stage || !result) { return; }
  if (!scene.easyeduGuideStageOriginal) {
    scene.easyeduGuideStageOriginal = stage.innerHTML;
    scene.easyeduGuideResultOriginal = result.textContent;
  }
  stage.innerHTML = scene.easyeduGuideStageOriginal;
  delete scene.dataset.guideSceneFinished;
  result.textContent = scene.easyeduGuideResultOriginal;
  scene.easyeduGuideSceneMode = mode === 'reset' ? null : mode;
  scene.dataset.guideMode = mode;
  scene.querySelectorAll('[data-guide-scene-command="add"], [data-guide-scene-command="move"]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.guideSceneCommand === mode));
  });
  const live = scene.parentElement.querySelector('[data-guide-live]');
  const liveCopy = live?.querySelector('[data-guide-live-copy]') || live;
  if (live) {
    liveCopy.textContent = scene.easyeduGuideResultOriginal;
    live.removeAttribute('data-guide-live-state');
    const completionIcon = live.querySelector('[data-guide-live-complete]');
    if (completionIcon) { completionIcon.hidden = true; }
  }
  delete scene.dataset.guidePhase;
  const recap = scene.querySelector('[data-guide-recap]');
  if (recap) { recap.hidden = true; }
  const origin = scene.querySelector('[data-guide-membership-origin]');
  const target = scene.querySelector('[data-guide-membership-target]');
  if (origin) { origin.classList.remove('is-removed'); origin.querySelector('b').textContent = origin.dataset.kept; }
  if (target) { target.classList.add('is-absent'); target.querySelector('b').textContent = target.dataset.absent; }
  scene.querySelectorAll('[data-guide-phase]').forEach(item => {
    item.removeAttribute('aria-current');
    item.hidden = false;
    if (!item.dataset.original) { item.dataset.original = item.textContent; }
    item.textContent = item.dataset.original;
  });
  if (mode === 'reset') { return; }

  const controller = new AbortController();
  const animations = new Set();
  let timer = null;
  let resolveWait = null;
  let dropFrame = null;
  const reduced = getScrollBehavior(root) === 'auto';
  const compact = window.matchMedia('(max-width: 64rem), (pointer: coarse), (hover: none)').matches;
  scene.toggleAttribute('data-guide-mobile-actions', compact);
  const wait = duration => new Promise(resolve => {
    resolveWait = resolve;
    timer = window.setTimeout(() => { timer = null; resolveWait = null; resolve(); }, duration);
  });
  const animate = async(element, frames, duration, retain = true) => {
    if (controller.signal.aborted || reduced) { return; }
    const animation = element.animate(frames, {duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
    animations.add(animation);
    try { await animation.finished; } catch (error) { /* Cancelled by departure. */ }
    if (!retain) { animation.cancel(); animations.delete(animation); }
  };
  // Fade the instruction copy, not the entire teaching scene. Its reading pause
  // starts only after the new sentence is visible; no business state is changed.
  const writeLive = async(text, state = 'active') => {
    if (!live || controller.signal.aborted) { return; }
    await animate(liveCopy, [{opacity: 1}, {opacity: 0}], 100, false);
    if (controller.signal.aborted) { return; }
    liveCopy.textContent = text;
    live.dataset.guideLiveState = state;
    const completionIcon = live.querySelector('[data-guide-live-complete]');
    if (completionIcon) { completionIcon.hidden = state !== 'finished'; }
    await animate(liveCopy, [{opacity: 0, transform: 'translateY(.15rem)'},
      {opacity: 1, transform: 'translateY(0)'}], 260, false);
  };
  // Scroll only the Guide reading surface, never the Moodle page. The same
  // cancellable animation set owns illustration and scroll, including exit.
  const reveal = async element => {
    const body = scene.closest('.easyedu-guide-modal__body');
    if (!body || controller.signal.aborted || element.hidden) { return; }
    const bounds = body.getBoundingClientRect(), item = element.getBoundingClientRect();
    const readingTop = bounds.top + (live?.getBoundingClientRect().height || 0) + 12;
    const readingBottom = bounds.bottom - 12;
    if (item.top >= readingTop && item.bottom <= readingBottom) { return; }
    const offset = item.height > readingBottom - readingTop || item.top < readingTop ?
      item.top - readingTop : item.bottom - readingBottom;
    const from = body.scrollTop;
    const to = Math.max(0, Math.min(from + offset, body.scrollHeight - body.clientHeight));
    if (reduced || !body.animate) { body.scrollTop = to; return; }
    // A clock animation supplies a cancellable, eased progress value;
    // scrolling stays a DOM property rather than an independent smooth-scroll.
    const clock = body.animate([{opacity: 1}, {opacity: 1}],
      {duration: 420, easing: 'cubic-bezier(.4,0,.2,1)'});
    animations.add(clock);
    await new Promise(resolve => {
      const tick = () => {
        if (controller.signal.aborted || clock.playState === 'idle') { resolve(); return; }
        const progress = clock.effect.getComputedTiming().progress;
        if (progress !== null) { body.scrollTop = from + (to - from) * progress; }
        if (clock.playState === 'finished') { body.scrollTop = to; resolve(); return; }
        requestAnimationFrame(tick);
      };
      tick();
    });
    clock.cancel(); animations.delete(clock);
  };
  const phase = async name => {
    const item = scene.querySelector(`[data-guide-phase="${name}"]`);
    scene.querySelectorAll('[data-guide-phase]').forEach(node => node.removeAttribute('aria-current'));
    if (item) {
      item.setAttribute('aria-current', 'step');
      const text = (compact && mode === 'add' && item.dataset.compactAdd) ||
        (compact && item.dataset.compact) || (mode === 'add' && item.dataset.add) || item.dataset.original;
      item.textContent = text;
      await writeLive(text);
      if (controller.signal.aborted) { return; }
      scene.dataset.guidePhase = name;
    }
    if (!reduced) {
      const words = item?.textContent.trim().split(/\s+/).filter(Boolean).length || 0;
      const minimum = Number(root.easyeduGuideConfig?.narrationMinimumMs) || DEFAULTS.narrationMinimumMs;
      const pace = Number(root.easyeduGuideConfig?.narrationWordsPerMinute) || DEFAULTS.narrationWordsPerMinute;
      const leadIn = Number(root.easyeduGuideConfig?.narrationLeadInMs) || DEFAULTS.narrationLeadInMs;
      await wait(Math.max(minimum, leadIn + words * 60000 / Math.max(1, pace)));
    }
  };
  root.easyeduGuideSceneStop = () => {
    controller.abort();
    if (timer !== null) { window.clearTimeout(timer); }
    if (resolveWait) { resolveWait(); }
    if (dropFrame !== null) { cancelAnimationFrame(dropFrame); }
    animations.forEach(animation => animation.cancel());
    stage.querySelector('[data-guide-destination]')?.classList.remove('is-guide-drop-target');
    stage.querySelector('[data-guide-ghost]')?.remove();
  };
  const run = async() => {
    const person = stage.querySelector('[data-guide-person]');
    const member = stage.querySelector('[data-guide-member]');
    const cursor = stage.querySelector('[data-guide-cursor]');
    const menu = stage.querySelector('[data-guide-menu]');
    const confirm = stage.querySelector('[data-guide-confirm]');
    if (compact && mode === 'add') {
      // Native mobile Add uses Participants > Move participants (addusers),
      // not the member-transfer action that removes the source membership.
      stage.querySelector('[data-guide-source-title]').textContent = scene.dataset.guideMobileParticipantsLabel;
      menu.querySelector('strong').textContent = scene.dataset.guideMobileAddAction;
      menu.querySelector('[data-guide-member-remove]').hidden = true;
      confirm.querySelector('header strong').textContent = scene.dataset.guideMobileAddAction;
      confirm.querySelector('[data-guide-consequence]').textContent = scene.dataset.guideMobileAddConsequence;
    }
    let cursorPoint = null;
    const travelPoint = async(point, duration) => {
      cursorPoint = point;
      const from = getComputedStyle(cursor).transform;
      cursor.hidden = false;
      await animate(cursor, [{transform: from},
        {transform: `translate(${point.x}px, ${point.y}px)`}], duration);
    };
    const travel = async(element, duration = 750, cardAnchor = false) => {
      if (reduced || controller.signal.aborted) { return; }
      const a = element.getBoundingClientRect(), b = stage.getBoundingClientRect();
      const point = {
        x: a.left - b.left + (cardAnchor ? Math.min(48, a.width / 2) : a.width / 2),
        y: a.top - b.top + (cardAnchor ? Math.min(28, a.height / 2) : a.height / 2)
      };
      await travelPoint(point, duration);
    };
    await reveal(person);
    await travel(person, 750, true);
    stage.querySelectorAll('.easyedu-guide-scene__person').forEach(node => node.classList.add('is-selected'));
    stage.querySelectorAll('[data-guide-illustrated-checkbox]').forEach(node => { node.checked = true; });
    await phase('select');
    if (controller.signal.aborted) { return; }
    if (mode !== 'add' || compact) {
      menu.hidden = false;
      // Desktop follows the illustrated click. Compact/reduced scenes anchor
      // to the same card without implying a mouse-only mobile interaction.
      const stageBounds = stage.getBoundingClientRect(), cardBounds = person.getBoundingClientRect();
      const point = cursorPoint || {x: cardBounds.left - stageBounds.left + 24,
        y: cardBounds.bottom - stageBounds.top};
      const menuBounds = menu.getBoundingClientRect();
      stage.style.setProperty('--easyedu-guide-menu-x',
        `${Math.max(0, Math.min(point.x + 12, stageBounds.width - menuBounds.width))}px`);
      stage.style.setProperty('--easyedu-guide-menu-y',
        `${Math.max(0, Math.min(point.y + 12, stageBounds.height - menuBounds.height))}px`);
      await reveal(menu);
      await animate(menu, [{opacity: 0}, {opacity: 1}], 280);
      await phase('menu');
      if (controller.signal.aborted) { return; }
      await travel(menu.querySelector('strong'));
      if (!compact) {
        await animate(cursor, [{opacity: 1}, {opacity: 0.45}, {opacity: 1}], 180);
      }
      await animate(menu, [{opacity: 1}, {opacity: 0}], 220);
      if (controller.signal.aborted) { return; }
      menu.hidden = true;
      confirm.hidden = false;
      await reveal(confirm);
      await animate(confirm, [{opacity: 0}, {opacity: 1}], 280);
      await phase('confirm');
      if (controller.signal.aborted) { return; }
      const submit = confirm.querySelector('[data-guide-simulated-submit]');
      await phase('validate');
      await reveal(submit);
      await travel(submit);
      await animate(submit, [{outline: '2px solid currentColor', outlineOffset: '2px'},
        {outline: '2px solid transparent', outlineOffset: '2px'}], 320);
      if (controller.signal.aborted) { return; }
      await animate(confirm, [{opacity: 1}, {opacity: 0}], 220);
      if (controller.signal.aborted) { return; }
      confirm.hidden = true;
      // Move the natural selected cards only after the illustrated confirmation.
      // Compact/reduced modes keep the same outcome without a mouse-only gesture.
      if (!compact && !reduced) {
        const destination = stage.querySelector('[data-guide-destination]').getBoundingClientRect();
        const selected = [...stage.querySelectorAll('[data-guide-source] .easyedu-guide-scene__person')];
        await Promise.all(selected.map((node, index) => {
          const source = node.getBoundingClientRect();
          return animate(node, [{transform: 'translate(0,0)', opacity: 1},
            {transform: `translate(${destination.left - source.left}px, ${destination.top - source.top + 32 + index * 12}px)`,
              opacity: 0.25}], 1200);
        }));
        if (controller.signal.aborted) { return; }
      }
    } else if (!compact && !reduced) {
      await phase('menu');
      if (controller.signal.aborted) { return; }
      const ghost = person.cloneNode(true);
      ghost.removeAttribute('data-guide-person');
      ghost.setAttribute('data-guide-ghost', '');
      ghost.setAttribute('aria-hidden', 'true');
      ghost.querySelectorAll('small').forEach(node => node.remove());
      ghost.classList.remove('is-selected');
      const badge = document.createElement('span');
      badge.className = 'easyedu-guide-scene__drag-badge';
      const grip = document.createElement('span');
      grip.className = 'fa fa-grip-vertical';
      badge.append(grip, document.createTextNode(scene.dataset.guideDragLabel || ''));
      ghost.appendChild(badge);
      stage.appendChild(ghost);
      const a = person.getBoundingClientRect(), b = stage.getBoundingClientRect();
      ghost.style.left = `${a.left - b.left}px`;
      ghost.style.top = `${a.top - b.top}px`;
      await animate(ghost, [{opacity: 0, transform: 'scale(.96)'}, {opacity: 1, transform: 'scale(1)'}], 180);
      const destinationNode = stage.querySelector('[data-guide-destination]');
      const destination = destinationNode.getBoundingClientRect();
      const dx = destination.left - a.left, dy = destination.top - a.top + 32;
      const startPoint = {...cursorPoint};
      // One displacement, duration and easing for ghost and pointer. Track
      // actual animated paint to reveal the destination only while hovering.
      const trackDrop = () => {
        if (controller.signal.aborted || !ghost.isConnected) { return; }
        const card = ghost.getBoundingClientRect(), drop = destinationNode.getBoundingClientRect();
        destinationNode.classList.toggle('is-guide-drop-target',
          card.right >= drop.left && card.left <= drop.right && card.bottom >= drop.top && card.top <= drop.bottom);
        dropFrame = requestAnimationFrame(trackDrop);
      };
      trackDrop();
      await Promise.all([animate(ghost, [{transform: 'translate(0,0)'},
        {transform: `translate(${dx}px,${dy}px)`}], 1200),
        travelPoint({x: startPoint.x + dx, y: startPoint.y + dy}, 1200)]);
      if (controller.signal.aborted) { return; }
      cancelAnimationFrame(dropFrame); dropFrame = null;
      member.hidden = false;
      await wait(220);
      destinationNode.classList.remove('is-guide-drop-target');
      await Promise.all([animate(ghost, [{transform: `translate(${dx}px,${dy}px)`, opacity: 1},
        {transform: 'translate(0,0)', opacity: 0.2}], 650), travelPoint(startPoint, 650)]);
      await animate(ghost, [{opacity: 0.2}, {opacity: 0}], 180);
      ghost.remove();
    }
    if (controller.signal.aborted) { return; }
    member.hidden = false;
    await animate(cursor, [{opacity: 1}, {opacity: 0}], 220);
    if (controller.signal.aborted) { return; }
    cursor.hidden = true;
    stage.querySelectorAll('.easyedu-guide-scene__person').forEach(node => node.classList.remove('is-selected'));
    stage.querySelectorAll('[data-guide-illustrated-checkbox]').forEach(node => { node.checked = false; });
    if (mode !== 'add') {
      stage.querySelectorAll('[data-guide-source] .easyedu-guide-scene__person').forEach(node => { node.hidden = true; });
      const empty = stage.querySelector('[data-guide-source-empty]');
      if (empty) { empty.hidden = false; }
    }
    if (origin && mode !== 'add') { origin.classList.add('is-removed'); origin.querySelector('b').textContent = origin.dataset.removed; }
    if (target) { target.classList.remove('is-absent'); target.querySelector('b').textContent = target.dataset.added; }
    result.textContent = result.getAttribute(`data-${mode}`) || '';
    await writeLive(scene.dataset.guideFinishedLabel || '', 'finished');
    if (recap) {
      // Keep it transparent during insertion/reveal: previously one fully
      // painted frame preceded the fade-in and caused the completion flash.
      recap.style.opacity = '0';
      recap.hidden = false;
      // Adding has no Move confirmation; compact devices explain actions instead of mouse gestures.
      recap.querySelectorAll('[data-guide-phase]').forEach(item => {
        item.hidden = mode === 'add' && !compact && ['confirm', 'validate'].includes(item.dataset.guidePhase);
        const copy = (compact && mode === 'add' && item.dataset.compactAdd) ||
          (compact && item.dataset.compact) || (mode === 'add' && item.dataset.add) || item.dataset.original;
        // The ordered list supplies recap numbering; live instructions retain their phase prefix.
        item.textContent = copy.replace(/^\d+\s*[\u00b7.]\s*/, '');
        item.removeAttribute('aria-current');
      });
      await reveal(recap);
      await animate(recap, [{opacity: 0}, {opacity: 1}], 280);
      recap.style.removeProperty('opacity');
    }
    if (controller.signal.aborted) { return; }
    scene.dataset.guideSceneFinished = 'true';
  };
  run().catch(() => { stopDiscoveryScene(root); });
};

const stopSlideTransition = root => {
  root.easyeduGuideSlideStop?.();
  root.easyeduGuideSlideStop = null;
};

// One cancellable presentation transition; the existing slide engine still owns state.
const setActiveSlide = (root, index, config, options = {}) => {
  stopSlideTransition(root);
  const modal = root.querySelector(SELECTORS.modal);
  const outgoing = root.querySelector(SELECTORS.slide + '.is-active');
  if (options.immediate || !root.classList.contains('easyedu-guide--discovery') ||
      !modal || modal.hidden || !outgoing || index === getActiveSlideIndex(root) || getScrollBehavior(root) === 'auto') {
    applyActiveSlide(root, index, config, options);
    return;
  }
  stopDiscoveryScene(root);
  const animations = new Set();
  let stopped = false;
  root.easyeduGuideSlideStop = () => {
    stopped = true;
    animations.forEach(animation => animation.cancel());
    root.removeAttribute('data-easyedu-guide-slide-transition');
  };
  const fade = async(element, from, to, duration) => {
    const animation = element.animate([{opacity: from}, {opacity: to}],
      {duration, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
    animations.add(animation);
    try { await animation.finished; } catch (error) { /* A newer navigation request wins. */ }
    return animation;
  };
  const run = async() => {
    root.setAttribute('data-easyedu-guide-slide-transition', 'out');
    const exit = await fade(outgoing, 1, 0, 110);
    if (stopped) { return; }
    applyActiveSlide(root, index, config, options);
    exit.cancel();
    root.setAttribute('data-easyedu-guide-slide-transition', 'in');
    const incoming = root.querySelector(SELECTORS.slide + '.is-active');
    const entry = await fade(incoming, 0, 1, 220);
    entry.cancel();
    if (!stopped) {
      root.removeAttribute('data-easyedu-guide-slide-transition');
      root.easyeduGuideSlideStop = null;
    }
  };
  run().catch(() => stopSlideTransition(root));
};

const applyActiveSlide = (root, index, config, options = {}) => {
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
  syncInterfaceCue(root, slides[safeIndex]);
  stopDiscoveryScene(root);
  const modal = root.querySelector(SELECTORS.modal);
  if (modal && !modal.hidden) {
    playDiscoveryScene(root, slides[safeIndex]?.querySelector('[data-easyedu-guide-scene]'));
  }
  scrollActiveNavItemIntoView(root);
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const openModal = (root, config) => {
  root.easyeduGuideExitStop?.();
  root.easyeduGuideExitStop = null;
  root.easyeduGuideExitPromise = null;
  stopSlideTransition(root);
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return;
  }

  const returnFocus = !modal.contains(document.activeElement) ? document.activeElement : null;
  Array.from(openGuideRoots).forEach(openRoot => {
    if (openRoot !== root) {
      closeModal(openRoot, false, false, {immediate: true});
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
  setActiveSlide(root, getActiveSlideIndex(root), config, {immediate: true});
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const closeModal = (root, preserveHighlight = false, restoreFocus = true, options = {}) => {
  stopSlideTransition(root);
  stopDiscoveryScene(root);
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    return Promise.resolve();
  }

  const finish = () => {
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
  if (options.immediate || modal.hidden || !root.classList.contains('easyedu-guide--discovery') ||
      getScrollBehavior(root) === 'auto') {
    finish();
    return Promise.resolve();
  }
  if (root.easyeduGuideExitPromise) { return root.easyeduGuideExitPromise; }
  const animation = modal.animate([{opacity: 1}, {opacity: 0}], {duration: 200, easing: 'ease', fill: 'both'});
  let stopped = false;
  const stopExit = () => { stopped = true; animation.cancel(); };
  root.easyeduGuideExitStop = stopExit;
  root.easyeduGuideExitPromise = animation.finished.catch(() => {}).then(() => {
    if (!stopped) { finish(); }
    animation.cancel();
    if (root.easyeduGuideExitStop === stopExit) {
      root.easyeduGuideExitPromise = null;
      root.easyeduGuideExitStop = null;
    }
  });
  return root.easyeduGuideExitPromise;
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
      (config.labels.complete || config.labels.guidedPath || 'Guided path') :
      `${config.labels.guidedPath || 'Guided path'}: ${step.title || getPathLabel(pathName, config)}`;
  }
  if (subtitle) {
    subtitle.textContent = `${completeCount}/${steps.length} ${config.labels.visited || 'visited'}`;
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
  const restore = root.querySelector('[data-easyedu-guide-checklist-restore]');
  if (restore) {
    minimize.hidden = minimized;
    restore.hidden = !minimized;
    restore.setAttribute('aria-expanded', minimized ? 'false' : 'true');
  }
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
    !checklist.hasAttribute('data-easyedu-guide-checklist-expanded');
  checklist.classList.remove('is-complete');
  checklist.classList.toggle('is-minimized', isCompactChecklistViewport() ? compactDefault : wasMinimized);
  checklist.classList.toggle('is-unlock-path', config.unlockPaths.includes(pathName));
  checklist.classList.toggle('has-guided-feedback', steps.some(step => !!step.feedback));
  checklist.setAttribute('data-easyedu-guide-path', pathName);
  list.innerHTML = '';
  checklist.toggleAttribute('data-easyedu-guide-checklist-scroll', steps.length > 3);

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
  if (!checklist || checklist.getAttribute('data-easyedu-guide-path') !== pathName ||
      loadGuideState(config).path !== pathName) {
    return;
  }

  const selector = `[data-easyedu-guide-step-id="${stepIdOrIndex}"], [data-easyedu-guide-step-index="${stepIdOrIndex}"]`;
  const item = checklist.querySelector(selector);
  const steps = config.paths[pathName] || [];
  if (!item || item.disabled || item.classList.contains('is-locked') || item.classList.contains('is-complete')) { return; }
  // A real later milestone supersedes the pending highlight/open from its
  // predecessor. Otherwise a fast Move click can be undone by the old close.
  clearStepOpenTimers(root);
  item.classList.add('is-complete');
  const completedIndex = Number(item.getAttribute('data-easyedu-guide-step-index'));
  saveChecklistProgress(root, config, pathName, Math.min(completedIndex + 1, Math.max(steps.length - 1, 0)));
  renderChecklist(root, config, pathName);
  syncPathInvitation(root, config);
  updateChecklistMessage(root, config, steps[completedIndex]);
  if (steps[completedIndex]?.autoHighlightNext && !isPathComplete(config, pathName)) {
    const next = checklist.querySelector('[data-easyedu-guide-step-index]:not(.is-complete):not(.is-locked)');
    if (next) {
      setStepOpenTimeout(root, () => {
        if (!checklist.hidden && checklist.getAttribute('data-easyedu-guide-path') === pathName) {
          const step = setActiveChecklistStep(root, config, Number(next.dataset.easyeduGuideStepIndex));
          highlightChecklistStep(root, config, step);
        }
      }, 260);
    }
  }
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
    if (event.ctrlKey || nav.scrollWidth <= nav.clientWidth) { return; }
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

  addTrackedListener(root, root, 'keydown', event => {
    if (event.key !== 'Enter' || event.isComposing ||
        !event.target.matches('[data-guide-pattern]')) { return; }
    event.preventDefault();
    renderDiscoveryNames(root, event.target.closest('[data-easyedu-guide-scene]'), 'preview');
  });

  addTrackedListener(root, root, 'click', event => {
    const sceneCommand = event.target.closest('[data-guide-scene-command]');
    if (sceneCommand && root.contains(sceneCommand)) {
      event.preventDefault();
      const scene = sceneCommand.closest('[data-easyedu-guide-scene]');
      const command = sceneCommand.getAttribute('data-guide-scene-command');
      if (['preview', 'letters', 'clear'].includes(command)) {
        renderDiscoveryNames(root, scene, command);
      } else {
        playDiscoveryScene(root, scene, command === 'replay' ? undefined : command);
      }
      return;
    }
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
      closeModal(root, true, false).then(() => {
        if (!root.querySelector(SELECTORS.modal).hidden) { return; }
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
      });
      return;
    }

    const startPath = event.target.closest(SELECTORS.startPath);
    if (startPath && root.contains(startPath)) {
      event.preventDefault();
      dismissResume(root);
      const requestedPath = startPath.getAttribute('data-easyedu-guide-start-path');
      if (isPathComplete(activeConfig, requestedPath)) { resetPathProgress(activeConfig, requestedPath); }
      syncSlideLocks(root, activeConfig);
      renderChecklist(root, activeConfig, requestedPath);
      syncPathInvitation(root, activeConfig);
      closeModal(root, false, false).then(() => {
        if (!root.querySelector(SELECTORS.modal).hidden) { return; }
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
      });
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

  root.querySelectorAll('[data-easyedu-guide-reset-path]').forEach(button => {
    addTrackedListener(root, button, 'click', () => {
      const activeConfig = root.easyeduGuideConfig || config;
      stopPath(root, activeConfig, button.getAttribute('data-easyedu-guide-reset-path'), true);
    });
  });
  const resume = root.querySelector('[data-easyedu-guide-resume-path]');
  if (resume) { addTrackedListener(root, resume, 'click', () => {
    const activeConfig = root.easyeduGuideConfig || config;
    const path = root.querySelector('[data-easyedu-guide-resume]').dataset.easyeduGuideResumePathName;
    dismissResume(root);
    if (!isPathComplete(activeConfig, path)) { renderChecklist(root, activeConfig, path); }
  }); }
  const cancelPath = root.querySelector('[data-easyedu-guide-cancel-path]');
  if (cancelPath) { addTrackedListener(root, cancelPath, 'click', () => {
    const activeConfig = root.easyeduGuideConfig || config;
    stopPath(root, activeConfig, loadGuideState(activeConfig).path);
  }); }

  addTrackedListener(root, root, 'keydown', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    if (!isModalOpen(root)) {
      return;
    }
    const modal = root.querySelector(SELECTORS.modal);
    if (modal && trapModalFocus(modal, event)) {
      return;
    }
    // Escape closes the Guide even while editing Practice. A nested control
    // that consumed the key (for example its own popup) keeps first priority.
    if (event.key === 'Escape') {
      if (!event.defaultPrevented) {
        event.preventDefault();
        closeModal(root);
      }
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
          const stepId = step.id || String(index);
          // The common completion gate validates dependencies BEFORE storing
          // progress. A click on a locked future target must not unlock it.
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

export const destroy = rootOrSelector => {
  const root = typeof rootOrSelector === 'string' ? document.querySelector(rootOrSelector) : rootOrSelector;
  if (!root) {
    return;
  }

  dismissResume(root);

  restoreInterfaceCue(root);
  stopSlideTransition(root);
  root.easyeduGuideExitStop?.();
  stopDiscoveryScene(root);
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

export const init = (rootOrSelector, rawConfig) => {
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
  // A completed path never reopens a checklist on reload. Unfinished progress
  // is offered, not imposed: only an explicit Resume renders the checklist.
  if (state.path && config.paths[state.path] && !isPathComplete(config, state.path)) {
    offerResume(root, config, state.path);
  }
  syncPathInvitation(root, config);

  const storage = getStorage();
  const seen = storage && storage.getItem(config.storageKey) === '1';
  if (config.firstVisit && !seen) {
    openModal(root, config);
  }
};

export default init;
