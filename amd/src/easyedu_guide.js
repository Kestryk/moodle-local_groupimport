// This file is generated from the embedded EasyEdu guide kit source and adapted to Moodle AMD.
// Keep behaviour aligned with easyedu-guide-kit/amd/src/easyedu_guide.js, then pass
// selectors, paths and labels from plugin-specific PHP/Mustache data.

define(['local_groupimport/motion'], function(Motion) {
// Opt-in native fullscreen lifecycle. The caller owns translated controls,
// shared paint and modal focus. Never request fullscreen without a user action.
const createFullscreenController = (element, onChange = () => {}) => {
  const document = element.ownerDocument;
  const window = document.defaultView;
  let disposed = false;
  let pending = false;
  const ownsFullscreen = () => document.fullscreenElement === element;
  const available = () => !disposed && window.innerWidth >= 1024 &&
    document.fullscreenEnabled === true && typeof element.requestFullscreen === 'function';
  const notify = () => {
    if (!disposed) onChange({active: ownsFullscreen(), available: available(), pending});
  };
  const exit = async() => {
    // A Guide must never exit another surface's fullscreen session.
    if (!ownsFullscreen()) return true;
    try { await document.exitFullscreen(); return true; }
    catch (error) { return false; }
    finally { notify(); }
  };
  const toggle = async() => {
    if (pending || disposed) return false;
    if (ownsFullscreen()) return exit();
    if (!available() || !element.isConnected || element.hidden) return false;
    pending = true;
    notify();
    try {
      await element.requestFullscreen();
      // Teardown or a compact resize may race the browser's asynchronous entry.
      if (disposed || element.hidden || window.innerWidth < 1024) await exit();
      return !disposed && ownsFullscreen();
    } catch (error) {
      // Refusal leaves the ordinary dialog usable; never emulate browser mode.
      return false;
    } finally { pending = false; notify(); }
  };
  const resized = () => {
    if (window.innerWidth < 1024) void exit();
    notify();
  };
  document.addEventListener('fullscreenchange', notify);
  window.addEventListener('resize', resized);
  const destroy = async() => {
    disposed = true;
    document.removeEventListener('fullscreenchange', notify);
    window.removeEventListener('resize', resized);
    return exit();
  };
  notify();
  return {available, ownsFullscreen, toggle, exit, destroy};
};

const disclosePanel = Motion.disclosePanel;
const cancelRecapPanel = Motion.cancel;
// Generic EasyEdu guide foundation for Moodle plugins.



//
// Plugins should copy this module into their AMD source folder and configure
// selectors, paths and labels from plugin-specific PHP/Mustache data.

const DEFAULTS = {
  storageKey: 'easyedu.guide.seen',
  firstVisit: false,
  // Server eligibility is product-owned. This opt-in offers, never auto-opens.
  welcomeOffer: false,
  welcomeTarget: '',
  fullscreen: false,
  highlightAutoHideDelay: 9000,
  highlightStyle: 'default',
  // Instruction pauses are minimums, not deadlines: allow reading longer copy.
  // J-G2 (AN-1, AN-9): every phase is readable (3 s at least) and a demo stays within 25 s (4 s at
  // most per phase; Pause and "Next phase" remain available).
  narrationMinimumMs: 3000,
  narrationMaximumMs: 4000,
  narrationWordsPerMinute: 180,
  narrationLeadInMs: 900,
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
    guidedPathSeparator: ': ',
    completedSteps: '',
    completeTitle: '',
    visited: '',
    stepCompleted: 'Completed',
    stepLocked: 'Locked',
    completeStepFirst: '',
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
  gotoSlide: '[data-easyedu-guide-goto]',
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
const HIGHLIGHT_DIALOG_CLASS = 'easyedu-guide-highlight--in-dialog';
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

// One animation level for the whole Guide: Motion.getLevel ('full' | 'reduced' | 'minimal'). The
// system "reduce motion" preference is ignored by default (Motion owns that decision).
const getMotionLevel = root => Motion.getLevel(root);
const isMotionEnabled = root => getMotionLevel(root) !== 'minimal';
const getScrollBehavior = root => Motion.scrollBehavior(root);
const REDUCED_FADE_MS = 120;

// K15-30 / J-G1: ONE modality test for every Guide consumer. 'touch' = a coarse pointer, no hover, or a
// compact (<= 64rem) Guide: the demos then show a finger (lift, place, tap) instead of a mouse. 'narrow'
// is the product workspace breakpoint only (it alone swaps the workspace controls and highlight targets).
const GUIDE_NARROW_QUERY = '(max-width: 64rem)';
const GUIDE_TOUCH_QUERY = '(pointer: coarse), (hover: none)';
const guideModality = () => {
  const matches = query => !!(window.matchMedia && window.matchMedia(query).matches);
  const narrow = matches(GUIDE_NARROW_QUERY);
  const touch = narrow || matches(GUIDE_TOUCH_QUERY);
  return {touch, narrow, pointer: touch ? 'touch' : 'mouse'};
};

// Opacity-only copy of keyframes, or null when there is nothing to fade (reduced level).
const toFadeFrames = frames => {
  if (frames.length < 2 || frames.some(frame => frame.opacity === undefined) ||
      Number(frames[0].opacity) === Number(frames[frames.length - 1].opacity)) {
    return null;
  }
  return frames.map(frame => ({opacity: frame.opacity}));
};

const scrollAnimationTokens = new WeakMap();
let windowScrollAnimationToken = null;

const easeGuideScroll = progress => {
  const safeProgress = Math.max(0, Math.min(progress, 1));
  return safeProgress < 0.5 ?
    4 * safeProgress * safeProgress * safeProgress :
    1 - Math.pow(-2 * safeProgress + 2, 3) / 2;
};

const animateScrollTo = (root, scroller, top, duration = 520, onComplete = () => {}) => {
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
    onComplete();
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
      onComplete();
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

// Opt-in reading-order migration. Product adapters supply exact historical maps;
// progress/path data is carried unchanged and loading never writes storage.
const migrateGuideReadingState = (state, config) => {
  const ids = config.slideIds;
  if (!Array.isArray(ids) || !ids.length) return state;
  if (state.presentationKey === config.presentationKey) {
    const index = typeof state.slideId === 'string' ? ids.indexOf(state.slideId) : -1;
    return index >= 0 ? {...state, slideIndex: index} : state;
  }
  const origin = state.presentationKey || 'legacy';
  const map = config.readingIndexMigrations && config.readingIndexMigrations[origin];
  if (!Array.isArray(map) || !Number.isInteger(state.slideIndex)) return state;
  const index = map[state.slideIndex];
  if (!Number.isInteger(index) || index < 0 || index >= ids.length ||
      typeof ids[index] !== 'string' || !ids[index]) return state;
  return {...state, slideIndex: index, slideId: ids[index]};
};

const pruneUnknownPaths = (state, paths) => {
  if (!state || typeof state !== 'object' || Array.isArray(state)) { return {}; }
  let result = state;
  const own = name => Object.prototype.hasOwnProperty.call(paths, name);
  for (const field of ['completed', 'pathContexts']) {
    const entries = state[field];
    if (!entries || typeof entries !== 'object' || Array.isArray(entries)) { continue; }
    const retained = Object.entries(entries).filter(([name]) => own(name));
    if (retained.length !== Object.keys(entries).length) {
      result = {...result, [field]: Object.fromEntries(retained)};
    }
  }
  if (state.path && !own(state.path)) { result = {...result, path: null, activeIndex: 0}; }
  return result;
};

const loadGuideState = config => {
  const storage = getStorage();
  if (!storage) {
    return {};
  }

  try {
    const original = JSON.parse(storage.getItem(getStateKey(config)) || '{}') || {};
    const state = Object.prototype.hasOwnProperty.call(config, 'paths') ?
      pruneUnknownPaths(original, config.paths || {}) : original;
    if (state !== original) {
      // Retire unknown path IDs only; reading state and known progress remain.
      // A blocked/quota-limited store must not discard the cleaned in-memory state.
      try { storage.setItem(getStateKey(config), JSON.stringify(state)); } catch (error) { /* Storage unavailable. */ }
    }
    if (Array.isArray(config.slideIds) && config.slideIds.length) {
      return migrateGuideReadingState(state, config);
    }
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
    const next = {...state, presentationKey: config.presentationKey};
    if (Array.isArray(config.slideIds) && Number.isInteger(state.slideIndex) &&
        typeof config.slideIds[state.slideIndex] === 'string' && config.slideIds[state.slideIndex]) {
      next.slideId = config.slideIds[state.slideIndex];
    }
    storage.setItem(getStateKey(config), JSON.stringify(next));
  } else {
    storage.setItem(getStateKey(config), JSON.stringify(state || {}));
  }
};

// Only an explicit reading-navigation request opts in; initialization, opening
// and legacy consumers without stable IDs remain read-only.
const saveGuideReadingPosition = (config, index) => {
  if (!Array.isArray(config.slideIds) || !Number.isInteger(index) || !config.slideIds[index]) return;
  const state = loadGuideState(config);
  if (state.presentationKey === config.presentationKey && state.slideIndex === index &&
      state.slideId === config.slideIds[index]) return;
  saveGuideState(config, {...state, slideIndex: index});
};

// Opt-in ID-only context. Product adapters own evidence; the Kit owns its
// persistence and path-local lifecycle. No context write completes a milestone.
const normalisePathContext = (config, pathName, data) => {
  const own = (object, key) => object && Object.prototype.hasOwnProperty.call(object, key);
  if (!own(config.paths, pathName) || !own(config.pathContextFields, pathName)) { return null; }
  const schema = config.pathContextFields[pathName];
  if (!schema || typeof schema !== 'object' || Array.isArray(schema) ||
      !data || typeof data !== 'object' || Array.isArray(data)) { return null; }
  const fields = Object.keys(schema);
  if (!fields.length || fields.length !== Object.keys(data).length) { return null; }
  const result = {};
  const isId = value => typeof value === 'string' && /^[1-9]\d*$/.test(value);
  for (const field of fields) {
    if (['__proto__', 'constructor', 'prototype'].includes(field) || !own(data, field)) { return null; }
    const value = data[field];
    if (schema[field] === 'id' && isId(value)) {
      result[field] = value;
    } else if (schema[field] === 'ids' && Array.isArray(value) && value.length &&
        value.every(isId) && new Set(value).size === value.length) {
      result[field] = [...value];
    } else { return null; }
  }
  return result;
};

/** Read a validated copy; loading never writes or restores a checklist. */
const getPathContext = (root, pathName) => {
  const config = root?.easyeduGuideConfig;
  if (!config) { return null; }
  const state = loadGuideState(config);
  return normalisePathContext(config, pathName, state.pathContexts?.[pathName]);
};

/** Capture before a native asynchronous command, never in its late callback. */
const getPathContextToken = (root, pathName) => {
  const config = root?.easyeduGuideConfig;
  if (!config || !Object.prototype.hasOwnProperty.call(config.pathContextFields || {}, pathName)) { return null; }
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || checklist.hidden || checklist.getAttribute('data-easyedu-guide-path') !== pathName ||
      loadGuideState(config).path !== pathName) { return null; }
  return {root, config, pathName, epoch: root.easyeduGuidePathEpoch || 0};
};

/** Store explicit product evidence only while its original path session is active. */
const setPathContext = (root, pathName, data, token) => {
  const current = getPathContextToken(root, pathName);
  if (!current || !token || token.root !== root || token.config !== current.config ||
      token.pathName !== pathName || token.epoch !== current.epoch) { return false; }
  const context = normalisePathContext(current.config, pathName, data);
  if (!context || !getStorage()) { return false; }
  try {
    const state = loadGuideState(current.config);
    saveGuideState(current.config, {...state, pathContexts: {...(state.pathContexts || {}), [pathName]: context}});
    return JSON.stringify(getPathContext(root, pathName)) === JSON.stringify(context);
  } catch (error) { return false; }
};

const withoutPathContext = (state, pathName) => {
  if (!state.pathContexts || !Object.prototype.hasOwnProperty.call(state.pathContexts, pathName)) { return state; }
  const pathContexts = {...state.pathContexts};
  delete pathContexts[pathName];
  return {...state, pathContexts};
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
  const state = withoutPathContext(loadGuideState(config), pathName);
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
  const level = getMotionLevel(root);
  if (!animate || level === 'minimal') {
    notice.hidden = true;
    return;
  }
  const motion = notice.animate(level === 'reduced' ? [{opacity: 1}, {opacity: 0}] :
    [{opacity: 1, transform: 'translateY(0)'}, {opacity: 0, transform: 'translateY(.35rem)'}],
  {duration: level === 'reduced' ? REDUCED_FADE_MS : 280, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
  root.easyeduGuideResumeAnimation = motion;
  motion.finished.then(() => { notice.hidden = true; motion.cancel(); }).catch(() => {});
};

// Count only time outside pointer/keyboard interaction. One listener set per
// notice/root survives repeated offers and is cleared by normal Guide teardown.
const scheduleNoticeExpiry = (root, notice, timerKey, delay, expire) => {
  clearTrackedTimeout(root, root[timerKey]);
  const clocks = root.easyeduGuideNoticeClocks || (root.easyeduGuideNoticeClocks = new Map());
  const update = event => {
    const clock = clocks.get(timerKey);
    if (!clock || !clock.active || notice.hidden) { return; }
    if (event?.type === 'pointerenter') { clock.hovered = true; }
    if (event?.type === 'pointerleave') { clock.hovered = false; }
    if (event?.type === 'focusin') { clock.focused = true; }
    if (event?.type === 'focusout') { clock.focused = notice.contains(event.relatedTarget); }
    const now = performance.now();
    if (clock.hovered || clock.focused) {
      if (clock.started !== null) {
        clock.remaining = Math.max(0, clock.remaining - (now - clock.started));
        clock.started = null;
        clearTrackedTimeout(root, root[timerKey]);
        root[timerKey] = null;
      }
      return;
    }
    if (clock.started !== null) { return; }
    clock.started = now;
    root[timerKey] = setTrackedTimeout(root, () => {
      root[timerKey] = null;
      clock.active = false;
      if (!notice.hidden) { clock.expire(); }
    }, clock.remaining);
  };
  if (!clocks.has(timerKey)) {
    ['pointerenter', 'pointerleave', 'focusin', 'focusout'].forEach(type =>
      addTrackedListener(root, notice, type, update));
  }
  clocks.set(timerKey, {remaining: delay, started: null, expire, active: true,
    hovered: notice.matches(':hover'), focused: notice.contains(document.activeElement)});
  root[timerKey] = null;
  update();
};

const offerResume = (root, config, pathName) => {
  const notice = root.querySelector('[data-easyedu-guide-resume]');
  if (!notice || isPathComplete(config, pathName)) { return; }
  notice.dataset.easyeduGuideResumePathName = pathName;
  notice.hidden = false;
  scheduleNoticeExpiry(root, notice, 'easyeduGuideResumeTimer', 45000, () => dismissResume(root, true));
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

// Workspace cards may be replaced when a dialog closes or selection clears.
// Resolve the active step again instead of retaining a detached control.
const resolveActiveChecklistTarget = root => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const config = root.easyeduGuideConfig;
  if (!checklist || checklist.hidden || checklist.classList.contains('is-complete') || !config) {
    return null;
  }
  const active = checklist.querySelector('[data-easyedu-guide-step-id].is-active:not(.is-complete)');
  const steps = config.paths[checklist.getAttribute('data-easyedu-guide-path')] || [];
  const step = active && steps.find(item => item.id === active.getAttribute('data-easyedu-guide-step-id'));
  return resolveStepHighlightTarget(config, step);
};

const observeHighlightedTarget = (root, target) => {
  if (!window.MutationObserver) {
    return;
  }
  if (!root.easyeduGuideMutationObserver) {
    root.easyeduGuideMutationObserver = new MutationObserver(() => {
      const current = isVisibleElement(root.easyeduGuideCurrentTarget) ? root.easyeduGuideCurrentTarget :
        resolveActiveChecklistTarget(root);
      scheduleHighlightRefresh(root, current, true);
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
  highlight.removeAttribute('data-easyedu-motion-policy');
  highlight.removeAttribute('data-easyedu-motion-level');
  highlight.classList.remove(HIGHLIGHT_DIALOG_CLASS);
  highlight.style.removeProperty('--easyedu-modal-layer');
  root.removeAttribute('data-easyedu-guide-target-in-dialog');
  root.removeAttribute('data-easyedu-guide-dialog-dock');
  clearHighlightedTarget(root);
  releaseChecklistTopDock(root);
};

const getExternalTargetDialog = (root, target) => {
  const dialog = isVisibleElement(target) ? target.closest('[role="dialog"][aria-modal="true"]') : null;
  return dialog && dialog !== root.querySelector(SELECTORS.modal) ? dialog : null;
};

// A target inside a fixed layer that is not a native dialog (a compact action
// sheet, for example) would paint above the page-level cue and hide it. Lift the
// cue just above the highest fixed ancestor layer; ordinary page targets keep
// the canonical low layer.
const getTargetLayerIndex = target => {
  let layer = 0;
  for (let node = target.parentElement; node && node !== document.body; node = node.parentElement) {
    const style = window.getComputedStyle(node);
    const index = Number.parseInt(style.zIndex, 10);
    if (style.position === 'fixed' && Number.isFinite(index)) {
      layer = Math.max(layer, index);
    }
  }
  return layer;
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
  // The frame is portalled to body, outside the Guide's public layer tokens.
  // Re-evaluate on each paint, including target reparenting; keep page cues low.
  const inDialog = !!getExternalTargetDialog(root, target);
  root.toggleAttribute('data-easyedu-guide-target-in-dialog', inDialog);
  if (!inDialog) { root.removeAttribute('data-easyedu-guide-dialog-dock'); }
  highlight.classList.toggle(HIGHLIGHT_DIALOG_CLASS, inDialog);
  const modalLayer = inDialog ? window.getComputedStyle(root).getPropertyValue('--easyedu-modal-layer').trim() : '';
  if (modalLayer) { highlight.style.setProperty('--easyedu-modal-layer', modalLayer); }
  else { highlight.style.removeProperty('--easyedu-modal-layer'); }
  const targetLayer = inDialog ? 0 : getTargetLayerIndex(target);
  if (targetLayer) {
    highlight.style.zIndex = String(targetLayer + 1);
  } else {
    highlight.style.removeProperty('z-index');
  }
  highlight.classList.toggle(
    'easyedu-guide-highlight--pulse-blue',
    root.dataset.easyeduGuideHighlightStyle === 'pulse-blue'
  );
  // A body portal cannot inherit the root's policy. Relay this instance's
  // resolved policy, never a global body mutation affecting another Guide.
  highlight.setAttribute('data-easyedu-motion-policy', isMotionEnabled(root) ? 'enabled' : 'disabled');
  highlight.setAttribute('data-easyedu-motion-level', getMotionLevel(root));
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
    target = resolveActiveChecklistTarget(root);
  }
  // A targetless viewport refresh must not erase an explicit target queued
  // by the current step before its first paint (notably after reduced scroll).
  root.easyeduGuideRefreshTarget = target || root.easyeduGuideRefreshTarget || null;
  root.easyeduGuideRefreshShouldDock = shouldDock;
  if (root.easyeduGuideRefreshFrame) {
    return;
  }

  root.easyeduGuideRefreshFrame = window.requestAnimationFrame(() => {
    const queued = root.easyeduGuideRefreshTarget || root.easyeduGuideCurrentTarget;
    const refreshTarget = isVisibleElement(queued) ? queued : resolveActiveChecklistTarget(root);
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
    // A sheet or dialog may replace the initial cue while scrolling settles.
    // Keep following the newest requested control rather than restoring the old one.
    target = root.easyeduGuideRefreshTarget || root.easyeduGuideCurrentTarget || target;
    if (!isVisibleElement(target)) {
      target = resolveActiveChecklistTarget(root);
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

const CHECKLIST_TOP_DOCK_CLASS = 'is-docked-top';

const rectsOverlap = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

// Bottom edge of the host's fixed top bar (Moodle navbar): a raised checklist starts below it.
const getFixedTopClearance = () => {
  const bottom = Array.from(document.querySelectorAll('.fixed-top, .sticky-top, nav.navbar')).reduce((value, element) => {
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
  return Math.ceil(bottom) + 8;
};

const releaseChecklistTopDock = root => {
  root.easyeduGuideTopDockTarget = null;
  const checklist = root.querySelector(SELECTORS.checklist);
  if (!checklist || !checklist.classList.contains(CHECKLIST_TOP_DOCK_CLASS)) {
    return;
  }
  checklist.classList.remove(CHECKLIST_TOP_DOCK_CLASS);
  checklist.style.removeProperty('top');
  checklist.style.removeProperty('bottom');
};

// C2-15-01: a full-width target (a compact action sheet item, a wide control)
// leaves no side lane, so the bottom checklist could cover the very control the
// step asks for and intercept its click. Raise it above that target while it is
// current: keep it raised for the same target (no flicker while the target
// moves) and restore the canonical placement with the next target or cue clear.
// A target inside a native dialog keeps the dialog dock instead.
const dockChecklistAboveTarget = (root, checklist, target, inDialog) => {
  if (inDialog || (checklist.classList.contains(CHECKLIST_TOP_DOCK_CLASS) &&
      root.easyeduGuideTopDockTarget !== target)) {
    releaseChecklistTopDock(root);
    if (inDialog) {
      return;
    }
  }
  const rect = target.getBoundingClientRect();
  const panel = checklist.getBoundingClientRect();
  if (!rectsOverlap(rect, panel)) {
    return;
  }
  if (checklist.classList.contains(CHECKLIST_TOP_DOCK_CLASS)) {
    // The target moved up into the raised panel: the space above is too short,
    // so return to the canonical placement (it cannot be raised again below).
    releaseChecklistTopDock(root);
    return;
  }
  const top = getFixedTopClearance();
  if (top + panel.height + 8 > rect.top) {
    return;
  }
  checklist.classList.add(CHECKLIST_TOP_DOCK_CLASS);
  checklist.style.top = `${top}px`;
  checklist.style.bottom = 'auto';
  root.easyeduGuideTopDockTarget = target;
};

// J-G3 (P-G2, validated by Kevin on 16/10/2026): the checklist never covers the step target.
// Canonical side: right on desktop and tablet, bottom on compact viewports. Before each step the
// panel is compared with the target plus a 16 px margin; on overlap it moves to the opposite side
// (left, or top on compact viewports). When neither side fits (target under both lanes, or a
// usable height under 600 px) it folds into the reduced checklist, marked is-avoiding, and unfolds
// by itself once a later target leaves room. A checklist the user folded is never reopened.
const CHECKLIST_AVOID_MARGIN = 16;
const CHECKLIST_MIN_USABLE_HEIGHT = 600;
const CHECKLIST_LANE_INSET = 20;
const CHECKLIST_AVOIDING_CLASS = 'is-avoiding';

const inflateRect = (rect, margin) => ({
  left: rect.left - margin,
  right: rect.right + margin,
  top: rect.top - margin,
  bottom: rect.bottom + margin,
});

const foldChecklistAwayFromTarget = (root, checklist, target) => {
  root.easyeduGuideAvoidTarget = target;
  if (checklist.classList.contains('is-minimized')) {
    return;
  }
  const focused = document.activeElement;
  checklist.classList.add('is-minimized', CHECKLIST_AVOIDING_CLASS);
  checklist.removeAttribute('data-easyedu-guide-checklist-expanded');
  syncChecklistMinimizeControl(root);
  if (focused && checklist.contains(focused) && !isVisibleElement(focused)) {
    const restore = checklist.querySelector('[data-easyedu-guide-checklist-restore]') ||
      checklist.querySelector(SELECTORS.checklistMinimize);
    if (isVisibleElement(restore)) {
      restore.focus({preventScroll: true});
    }
  }
};

const unfoldAvoidingChecklist = (root, checklist) => {
  root.easyeduGuideAvoidTarget = null;
  if (!checklist.classList.contains(CHECKLIST_AVOIDING_CLASS)) {
    return;
  }
  checklist.classList.remove(CHECKLIST_AVOIDING_CLASS, 'is-minimized');
  if (isCompactChecklistViewport()) {
    checklist.setAttribute('data-easyedu-guide-checklist-expanded', '');
  }
  syncChecklistMinimizeControl(root);
};

const dockChecklistAwayFromTarget = (root, target) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const externalDialog = getExternalTargetDialog(root, target);
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
  // A fold made for this same target stays (re-renders must not make it blink).
  if (checklist.classList.contains(CHECKLIST_AVOIDING_CLASS) && root.easyeduGuideAvoidTarget === target) {
    // Folding can finish after the first dock measurement. Keep the fold, but
    // recheck the now smaller panel against a moving sheet or control.
    dockChecklistAboveTarget(root, checklist, target, !!externalDialog);
    return;
  }
  unfoldAvoidingChecklist(root, checklist);

  const zone = inflateRect(target.getBoundingClientRect(), CHECKLIST_AVOID_MARGIN);
  if (isCompactChecklistViewport()) {
    if (!rectsOverlap(zone, checklist.getBoundingClientRect())) {
      return;
    }
    dockChecklistAboveTarget(root, checklist, target, !!externalDialog);
    if (rectsOverlap(zone, checklist.getBoundingClientRect())) {
      foldChecklistAwayFromTarget(root, checklist, target);
    }
    return;
  }

  // Lanes are computed from the panel's declared width (min(26rem, 100vw - 2.5rem)), not from a
  // rect that may still be mid-transition.
  const panel = checklist.getBoundingClientRect();
  const width = Math.min(26 * 16, window.innerWidth - 40);
  const lane = left => ({left, right: left + width, top: panel.top, bottom: panel.bottom});
  const rightLane = lane(window.innerWidth - CHECKLIST_LANE_INSET - width);
  const leftLane = lane(CHECKLIST_LANE_INSET);
  const usableHeight = window.innerHeight - getFixedTopClearance();
  let dock = 'right';
  if (rectsOverlap(zone, rightLane)) {
    if (rectsOverlap(zone, leftLane) || usableHeight < CHECKLIST_MIN_USABLE_HEIGHT) {
      foldChecklistAwayFromTarget(root, checklist, target);
      checklist.classList.add('is-docked-right');
      checklist.classList.remove('is-docked-left');
      // The fold goes to the free corner: above the target when it sits low.
      dockChecklistAboveTarget(root, checklist, target, !!externalDialog);
      return;
    } else {
      dock = 'left';
    }
  }
  checklist.classList.toggle('is-docked-right', dock === 'right');
  checklist.classList.toggle('is-docked-left', dock === 'left');
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
    scheduleNoticeExpiry(root, returnPanel, 'easyeduGuideReturnTimer', 30000, () => {
      if (root.easyeduGuideInterfaceHighlightActive) {
        returnPanel.hidden = true;
        root.easyeduGuideInterfaceHighlightActive = false;
        clearHighlight(root);
      }
    });
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

const captureChecklistFocus = (root, opener) => {
  root.easyeduGuideChecklistReturnFocus = root.easyeduGuideReturnFocus ||
    Array.from(root.querySelectorAll(SELECTORS.open)).find(isVisibleElement) || opener;
};

const focusChecklist = root => {
  const title = root.querySelector(SELECTORS.checklistTitle);
  if (!isVisibleElement(title)) { return; }
  title.setAttribute('tabindex', '-1');
  title.focus({preventScroll: true});
};

const restoreChecklistFocus = (root, formerTarget) => {
  // Closing the checklist does not close a native dialog. Keep its focus
  // inside that dialog instead of returning to a launcher behind the backdrop.
  const dialog = getExternalTargetDialog(root, formerTarget);
  const destination = dialog ? formerTarget : root.easyeduGuideChecklistReturnFocus;
  if (isVisibleElement(destination)) { focusTarget(destination); }
  root.easyeduGuideChecklistReturnFocus = null;
};

const hideChecklist = (root, config, clearProgress = false, restoreFocus = false) => {
  const formerTarget = root.easyeduGuideCurrentTarget;
  const checklist = root.querySelector(SELECTORS.checklist);
  if (checklist) {
    checklist.hidden = true;
    checklist.classList.remove('is-complete', 'is-minimized', 'is-docked-left', 'is-docked-right', 'is-unlock-path',
      'is-avoiding');
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
  if (restoreFocus) { restoreChecklistFocus(root, formerTarget); }
};

// Unlike Return to Guide, Stop invalidates pending native-dialog work.
const stopPath = (root, config, pathName, reset = false) => {
  root.easyeduGuidePathEpoch = (root.easyeduGuidePathEpoch || 0) + 1;
  clearStepOpenTimers(root);
  dismissResume(root);
  hideChecklist(root, config, false, true);
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
    !window.matchMedia('(max-width: 40rem), (max-height: 32rem)').matches ||
    checklist.classList.contains(CHECKLIST_TOP_DOCK_CLASS)) {
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

const scrollScrollableAncestorsToTarget = (root, target, bottomClearance = 0, onComplete = () => {}) => {
  let scrolled = false;
  let pending = 0;
  const settled = () => {
    pending--;
    if (pending === 0) { onComplete(); }
  };
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
        pending++;
        animateScrollTo(root, parent, nextTop, 520, settled);
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
  // A new step supersedes its predecessor before scrolling, including instant
  // reduced/minimal scrolling that finishes before the next highlight frame.
  root.easyeduGuideRefreshTarget = target;
  dockChecklistAwayFromTarget(root, target);

  const topOffset = getScrollTopOffset();
  const checklistBottomClearance = getCompactChecklistBottomClearance(root);
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
  const bottomOffset = Math.max(
    Math.min(Math.max(viewportHeight * 0.18, 110), 180),
    checklistBottomClearance
  );

  const alignWindow = () => {
    if (!isVisibleElement(target)) {
      clearHighlight(root);
      return;
    }
    const rect = target.getBoundingClientRect();
    const usableHeight = Math.max(160, viewportHeight - topOffset - bottomOffset);
    const needsScroll = rect.top < topOffset ||
      rect.bottom > viewportHeight - bottomOffset ||
      rect.height > usableHeight;

    if (needsScroll) {
      animateScrollTo(root, window, Math.max(0, window.scrollY + rect.top - topOffset), 520);
    }
  };

  // Measure the outer scroll only after inner scrolling actually finishes.
  const epoch = root.easyeduGuidePathEpoch || 0;
  const alignAfterScroll = () => {
    if (epoch === (root.easyeduGuidePathEpoch || 0) && root.easyeduGuideRefreshTarget === target) {
      alignWindow();
    }
  };
  if (!scrollScrollableAncestorsToTarget(root, target, bottomOffset, alignAfterScroll)) {
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

// The compact workspace (no drag and drop, card menus instead of right click)
// starts at the same width as the product's responsive workspace.
const isResponsiveStepViewport = () => guideModality().narrow;

// A step may teach a different gesture in the compact workspace. Its optional
// titleCompact/descriptionCompact/feedbackCompact replace the ordinary copy
// there, exactly like highlightTargetCompact replaces the highlighted control.
const getStepText = (step, field) => {
  if (!step) {
    return '';
  }
  const compact = step[`${field}Compact`];
  return (isResponsiveStepViewport() && compact) || step[field] || '';
};

const resolveStepHighlightTarget = (config, step) => {
  if (!step) {
    return null;
  }

  const responsiveTarget = isResponsiveStepViewport() ?
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
        // A checklist is an active task, not a transient Show-in-interface cue.
        // Keep its target until the next step/path exit; long reading must not
        // silently remove the guidance. scrollToTarget clears any former timer.
        autoHideHighlight: false
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

const scrollActiveNavItemIntoView = (root, inline = 'center') => {
  const active = root.querySelector(`${SELECTORS.navItem}.is-active`);
  if (active) {
    active.scrollIntoView({
      behavior: getScrollBehavior(root),
      block: 'nearest',
      inline
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
    return formatLabel(config.labels.completeStepFirst, getStepText(requiredStep, 'title') || step.requiresStep);
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

// The discovery presentation docks the original command in the common footer
// (GS10), preserving every responsive target/open attribute and the existing
// delegated click handler.
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
  const cue = slot && slot.closest('.easyedu-guide-interface-cue');
  // A slide without a command has no interface destination: the footer slot
  // stays hidden and Previous/Next keep the footer alone.
  if (cue) {
    cue.hidden = true;
  }
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
  if (cue) {
    cue.hidden = false;
  }
};

// Illustrations are DOM-only. They never dispatch business completion events.
let recapPanelSequence = 0;

// Only the optional recap body uses shared Framed Motion. The illustration's
// existing scroll, reveal fade, clocks and card choreography remain its owner.
const prepareRecapDisclosure = recap => {
  const body = recap?.querySelector('[data-guide-recap-body]');
  const toggle = recap?.querySelector('[data-guide-recap-toggle]');
  if (!body || !toggle) { return; }
  cancelRecapPanel(body);
  if (!body.id) { body.id = `easyedu-guide-recap-panel-${++recapPanelSequence}`; }
  toggle.setAttribute('aria-controls', body.id);
  toggle.setAttribute('aria-expanded', 'true');
  body.hidden = false;
  body.classList.add('is-open');
};

const toggleRecapDisclosure = recap => {
  const body = recap?.querySelector('[data-guide-recap-body]');
  const toggle = recap?.querySelector('[data-guide-recap-toggle]');
  if (!body || !toggle) { return; }
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  const transition = disclosePanel(body, open, {collapseMargins: true});
  // The real shared effect is the duration authority, including reversals and
  // reduced/disabled policy. Do not duplicate its distance/timing calculation.
  const effect = body.getAnimations().find(animation => animation.playState === 'running');
  toggle.style.setProperty('--easyedu-guide-recap-motion-duration', `${effect?.effect.getTiming().duration || 0}ms`);
  toggle.setAttribute('aria-expanded', String(open));
  void transition;
};

const stopDiscoveryScene = root => {
  root.querySelectorAll('[data-guide-recap-body]').forEach(cancelRecapPanel);
  if (root.easyeduGuideLoupeStop) {
    root.easyeduGuideLoupeStop();
  }
  if (root.easyeduGuideSceneStop) {
    root.easyeduGuideSceneStop();
    root.easyeduGuideSceneStop = null;
  }
};

// E4 (K5): three-phase mini demonstration of a group card's search loupe (about 6.5 s). Fictional
// members, no Moodle call. Phase changes use Motion.enter, so the animation level applies; at the
// minimal level the same phases change without movement.
const LOUPE_PHASE_MS = [1500, 2600, 2400];
const runLoupeDemo = (root, demo) => {
  stopDiscoveryScene(root);
  const q = key => demo.querySelector(`[data-guide-loupe-${key}]`);
  const trigger = q('trigger');
  const panel = q('panel');
  const input = q('input');
  const caption = q('caption');
  const button = q('start');
  const label = q('start-label');
  const rows = [...demo.querySelectorAll('.easyedu-guide-anatomy__members li')];
  const query = demo.dataset.query || '';
  const timers = [];
  const after = (ms, fn) => {
    timers.push(setTimeout(fn, ms));
  };
  const reset = () => {
    trigger.classList.remove('is-pointed');
    panel.hidden = true;
    input.textContent = '';
    rows.forEach(row => {
      row.hidden = false;
      row.classList.remove('is-match');
    });
  };
  const finish = done => {
    timers.splice(0).forEach(clearTimeout);
    reset();
    root.easyeduGuideLoupeStop = null;
    demo.dataset.guideLoupeState = done ? 'done' : 'idle';
    button.disabled = false;
    button.setAttribute('aria-busy', 'false');
    label.textContent = done ? demo.dataset.replayLabel : demo.dataset.startLabel;
    caption.textContent = done ? demo.dataset.doneLabel : demo.dataset.idleLabel;
  };
  const enter = node => {
    if (isMotionEnabled(root)) {
      Motion.enter(node);
    }
  };
  root.easyeduGuideLoupeStop = () => finish(false);
  reset();
  demo.dataset.guideLoupeState = 'running';
  button.disabled = true;
  button.setAttribute('aria-busy', 'true');
  label.textContent = demo.dataset.runningLabel;
  // Phase 1: the pointer touches the loupe.
  caption.textContent = demo.dataset.phase1;
  trigger.classList.add('is-pointed');
  // Phase 2: the panel opens in the card and the query is typed.
  after(LOUPE_PHASE_MS[0], () => {
    caption.textContent = demo.dataset.phase2;
    trigger.classList.remove('is-pointed');
    panel.hidden = false;
    enter(panel);
    [...query].forEach((char, index) => after(450 + index * 330, () => {
      input.textContent += char;
    }));
  });
  // Phase 3: the list narrows to the match; Cancel restores it.
  after(LOUPE_PHASE_MS[0] + LOUPE_PHASE_MS[1], () => {
    caption.textContent = demo.dataset.phase3;
    rows.forEach(row => {
      const match = (row.dataset.name || '').includes(query);
      row.hidden = !match;
      row.classList.toggle('is-match', match);
      if (match) {
        enter(row);
      }
    });
  });
  after(LOUPE_PHASE_MS[0] + LOUPE_PHASE_MS[1] + LOUPE_PHASE_MS[2], () => finish(true));
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
  const level = getMotionLevel(root);
  const animations = new Set();
  let stopped = false;
  output.setAttribute('aria-busy', 'true');
  const animate = async(element, frames, duration, delay = 0) => {
    if (stopped || level === 'minimal') { return; }
    // Reduced level: opacity fades of 120 ms at most, no height, no translate, no stagger.
    const shown = level === 'reduced' ? toFadeFrames(frames) : frames;
    if (!shown) {
      return;
    }
    const animation = element.animate(shown, {
      duration: level === 'reduced' ? Math.min(REDUCED_FADE_MS, duration) : duration,
      delay: level === 'reduced' ? 0 : delay, easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
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

const playDiscoveryScene = (root, scene, requestedMode, start = true) => {
  stopDiscoveryScene(root);
  if (!scene) { return; }
  const kind = scene.getAttribute('data-easyedu-guide-scene');
  if (kind === 'concepts') { return; }
  // Inspection is an explicit, illustrated-only recipe. Unknown kinds must
  // not fall through to membership choreography requiring unrelated nodes.
  if (!['creation', 'membership', 'actions', 'inspection', 'simplecreate'].includes(kind)) { return; }
  if (kind === 'inspection' && !['card', 'trigger', 'menu', 'panel', 'input', 'chips'].every(role =>
    scene.querySelector(`[data-guide-inspection-${role}]`))) { return; }
  const defaultMode = kind === 'actions' ? 'actions' : 'add';
  const mode = requestedMode === 'reset' ? defaultMode : requestedMode || scene.easyeduGuideSceneMode || defaultMode;
  const stage = scene.querySelector('[data-guide-stage]');
  const result = scene.querySelector('[data-guide-result]');
  // J-G4: the simple-creation scene has no result line; every other kind needs one.
  if (!stage || (!result && !['creation', 'simplecreate'].includes(kind))) { return; }
  if (!scene.easyeduGuideStageOriginal) {
    scene.easyeduGuideStageOriginal = stage.innerHTML;
    scene.easyeduGuideResultOriginal = result ? result.textContent : '';
  }
  stage.innerHTML = scene.easyeduGuideStageOriginal;
  delete scene.dataset.guideSceneFinished;
  if (result) { result.textContent = scene.easyeduGuideResultOriginal; }
  scene.easyeduGuideSceneMode = mode === 'reset' ? null : mode;
  scene.dataset.guideMode = mode;
  scene.querySelectorAll('[data-guide-scene-command="add"], [data-guide-scene-command="move"]').forEach(button => {
    // E3: the two gestures are native radios; the checked state is the single source of truth.
    button.checked = button.dataset.guideSceneCommand === mode;
  });
  // New compositions own their live region; historical templates keep the
  // sibling fallback. Never attach playback to another scene's header.
  const live = scene.querySelector('[data-guide-live]') || scene.parentElement.querySelector('[data-guide-live]');
  const sceneHeader = scene.querySelector('[data-guide-scene-header]');
  const phaseCaption = sceneHeader?.querySelector('[data-guide-phase-caption]');
  // Touch modality (finger pointer, tap wording and flow); re-evaluated on every start and on change.
  const compact = guideModality().touch;
  // Count the applicable explanation phases, not animation frames or timers.
  // J-G4: the simple-creation scene reads its four phases from its root's labels.
  const applicablePhases = kind === 'simplecreate' ? [1, 2, 3, 4].map(n => ({dataset: {guidePhase: String(n)}})) :
    [...scene.querySelectorAll('[data-guide-phase]')].filter(item =>
    !(kind === 'membership' && mode === 'add' && !compact && ['confirm', 'validate'].includes(item.dataset.guidePhase)));
  const liveCopy = live?.querySelector('[data-guide-live-copy]') || live;
  const liveAnnouncement = live?.querySelector('[data-guide-live-announcement]');
  const pauseControl = live?.querySelector('[data-guide-playback="pause"]');
  const nextControl = live?.querySelector('[data-guide-playback="next-phase"]');
  const activity = live?.querySelector('[data-guide-activity]');
  const startControl = scene.querySelector('[data-guide-scene-command="start"]');
  // Clearance belongs to this reading surface and this scene's compact header.
  // Restore the previous inline value at completion/exit; no page scroll owner.
  const readingBody = scene.closest('.easyedu-guide-modal__body');
  const originalScrollPadding = readingBody?.style.getPropertyValue('scroll-padding-top') || '';
  const originalScrollPaddingPriority = readingBody?.style.getPropertyPriority('scroll-padding-top') || '';
  const restoreClearance = () => {
    if (!readingBody) { return; }
    if (originalScrollPadding) {
      readingBody.style.setProperty('scroll-padding-top', originalScrollPadding, originalScrollPaddingPriority);
    } else { readingBody.style.removeProperty('scroll-padding-top'); }
  };
  const updateClearance = () => {
    if (!sceneHeader || !readingBody) { return; }
    if (['playing', 'paused'].includes(sceneHeader.dataset.guidePlaybackState)) {
      readingBody.style.setProperty('scroll-padding-top', `${sceneHeader.getBoundingClientRect().height + 8}px`);
    } else { restoreClearance(); }
  };
  let headerObserver = null;
  const syncPlayback = (state, advancing = false) => {
    if (sceneHeader) {
      sceneHeader.dataset.guidePlaybackState = state;
      const controls = sceneHeader.querySelector('.easyedu-guide-scene__playback');
      if (controls) { controls.hidden = !['playing', 'paused'].includes(state); }
      // Collapse the useless disabled mode/Start row through canonical CSS
      // Motion; inert prevents invisible controls retaining keyboard focus.
      sceneHeader.querySelector('.easyedu-guide-scene__header-controls')?.toggleAttribute('inert',
        ['playing', 'paused'].includes(state));
      if (phaseCaption) {
        const labels = sceneHeader.dataset;
        const modeLabel = kind === 'membership' ? (mode === 'add' ? labels.addLabel : labels.moveLabel) : '';
        const current = applicablePhases.findIndex(item => item.dataset.guidePhase === scene.dataset.guidePhase) + 1;
        phaseCaption.hidden = !labels.stepLabel || state === 'finished';
        phaseCaption.textContent = state === 'idle' ? labels.readyLabel :
          (state === 'paused' ? labels.pausedLabel + ' · ' : '') + labels.stepLabel + ' ' + Math.max(1, current) + '/' + applicablePhases.length;
        if (modeLabel) { phaseCaption.textContent += ' · ' + modeLabel; }
      }
      updateClearance();
      if (state === 'finished') { headerObserver?.disconnect(); }
    }
    if (startControl) {
      const busy = ['playing', 'paused'].includes(state);
      startControl.disabled = busy;
      startControl.setAttribute('aria-busy', String(busy));
      startControl.querySelector('[data-guide-start-label]').textContent = busy ?
        startControl.dataset.runningLabel : state === 'finished' ?
          startControl.dataset.replayLabel : startControl.dataset.startLabel;
      scene.querySelectorAll('[data-guide-scene-command="add"], [data-guide-scene-command="move"]').forEach(button => {
        button.disabled = busy;
      });
    }
    if (!live) { return; }
    live.dataset.guidePlaybackState = state;
    if (activity) { activity.hidden = !['playing', 'paused'].includes(state); }
    if (pauseControl) {
      pauseControl.disabled = advancing || !['playing', 'paused'].includes(state);
      pauseControl.setAttribute('aria-pressed', String(state === 'paused'));
      pauseControl.setAttribute('aria-label', state === 'paused' ? pauseControl.dataset.resumeLabel : pauseControl.dataset.pauseLabel);
      pauseControl.querySelector('.fa').className = state === 'paused' ? 'fa fa-play' : 'fa fa-pause';
    }
    if (nextControl) { nextControl.disabled = !scene.dataset.guidePhase || advancing || !['playing', 'paused'].includes(state); }
  };
  syncPlayback('idle');
  if (live) {
    liveCopy.textContent = scene.easyeduGuideResultOriginal;
    if (liveAnnouncement) { liveAnnouncement.textContent = scene.easyeduGuideResultOriginal; }
    liveCopy.title = liveCopy.textContent;
    live.removeAttribute('data-guide-live-state');
    const completionIcon = live.querySelector('[data-guide-live-complete]');
    if (completionIcon) { completionIcon.hidden = true; }
  }
  delete scene.dataset.guidePhase;
  const recap = scene.querySelector('[data-guide-recap]');
  if (recap) { prepareRecapDisclosure(recap); recap.hidden = true; }
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
  // At rest, the membership strip is explicitly an expected outcome. Starting
  // restores actual illustrated memberships until the existing final phase.
  const memberships = scene.querySelector('[data-guide-memberships]');
  if (memberships && sceneHeader) {
    // One component and one set of IDs/state: only its placement changes.
    // The anchor survives idle mode changes, Reset and repeated play cycles.
    if (!memberships.easyeduGuideHome) {
      memberships.easyeduGuideHome = document.createComment('Guide membership result location');
      memberships.before(memberships.easyeduGuideHome);
    }
  }
  const membershipTitle = memberships?.querySelector('[data-guide-membership-title]');
  if (membershipTitle && !membershipTitle.dataset.original) { membershipTitle.dataset.original = membershipTitle.textContent; }
  const preview = !!sceneHeader && !!startControl && (requestedMode === 'reset' || !start) && kind === 'membership';
  if (memberships && sceneHeader) {
    if (preview) { sceneHeader.appendChild(memberships); }
    else { memberships.easyeduGuideHome.after(memberships); }
  }
  if (memberships) { memberships.toggleAttribute('data-guide-membership-preview', preview); }
  if (membershipTitle) { membershipTitle.textContent = preview ? membershipTitle.dataset.expected : membershipTitle.dataset.original; }
  if (preview) {
    if (origin) {
      origin.classList.toggle('is-removed', mode === 'move');
      origin.querySelector('b').textContent = mode === 'move' ? origin.dataset.removed : origin.dataset.kept;
    }
    if (target) { target.classList.remove('is-absent'); target.querySelector('b').textContent = target.dataset.added; }
    if (liveCopy) {
      liveCopy.textContent = result.dataset[mode] || scene.easyeduGuideResultOriginal;
      liveCopy.title = liveCopy.textContent;
    }
    // A phone may not fit title, introduction and the complete ready header at
    // once. Reveal its bottom with the existing owned/cancellable Guide scroll,
    // never scroll the Moodle page or leave the expected outcome below the fold.
    if (readingBody) {
      const bodyBounds = readingBody.getBoundingClientRect(), headerBounds = sceneHeader.getBoundingClientRect();
      if (headerBounds.bottom > bodyBounds.bottom - 8) {
        animateScrollTo(root, readingBody, readingBody.scrollTop + headerBounds.bottom - bodyBounds.bottom + 8);
      }
    }
  }
  scene.toggleAttribute('data-guide-mobile-actions', compact);
  if (kind === 'inspection') {
    stage.querySelector('[data-guide-inspection-trigger]').hidden = compact;
    const compactTrigger = stage.querySelector('[data-guide-inspection-mobile-trigger]');
    if (compactTrigger) { compactTrigger.hidden = !compact; }
  }
  if (requestedMode === 'reset' || !start) {
    if (kind === 'creation') { renderDiscoveryNames(root, scene, 'preview'); }
    return;
  }

  const controller = new AbortController();
  const animations = new Set();
  let timer = null;
  let resolveWait = null;
  let waitRemaining = 0;
  let waitDeadline = 0;
  let paused = false;
  let skipping = false;
  let advancing = false;
  let finished = false;
  const gates = new Set();
  let dropFrame = null;
  // 'minimal': phases switch instantly and the pointer is placed without travel. 'reduced': opacity fades
  // of 120 ms at most, the pointer appears at its destination. Reading durations never change.
  const level = getMotionLevel(root);
  const reduced = level === 'minimal';
  const fadeLevel = level === 'reduced';
  const still = level !== 'full';
  // Reading, illustration and scroll share one lifecycle. Pause retains the
  // unread duration; phase advance drains just this phase's presentation work.
  const assertActive = () => {
    if (controller.signal.aborted) { throw controller.signal.reason; }
  };
  const releaseGates = () => { gates.forEach(resolve => resolve()); gates.clear(); };
  const gate = async() => {
    if (paused && !skipping && !controller.signal.aborted) {
      await new Promise(resolve => gates.add(resolve));
    }
    assertActive();
  };
  const finishWait = () => {
    if (timer !== null) { window.clearTimeout(timer); }
    timer = null; waitRemaining = 0;
    const resolve = resolveWait; resolveWait = null;
    resolve?.();
  };
  const scheduleWait = () => {
    waitDeadline = performance.now() + waitRemaining;
    timer = window.setTimeout(finishWait, waitRemaining);
  };
  const wait = async duration => {
    await gate();
    assertActive();
    // K17-17: these three demonstrations are a single still image at Minimal,
    // not a timed slideshow. Other scenes retain their existing reading clock.
    if (skipping || (level === 'minimal' && scene.dataset.guideStaticMinimal === 'true' &&
        ['creation', 'membership', 'actions'].includes(kind))) {
      return;
    }
    await new Promise(resolve => {
      resolveWait = resolve; waitRemaining = duration; scheduleWait();
    });
    assertActive();
  };
  root.easyeduGuideScenePlayback = {
    scene,
    toggle: () => {
      if (controller.signal.aborted || finished || advancing) { return; }
      paused = !paused;
      if (paused) {
        if (timer !== null) {
          window.clearTimeout(timer); timer = null;
          waitRemaining = Math.max(0, waitDeadline - performance.now());
        }
        animations.forEach(animation => { if (animation.playState === 'running') { animation.pause(); } });
      } else {
        if (resolveWait) { scheduleWait(); }
        animations.forEach(animation => { if (animation.playState === 'paused') { animation.play(); } });
        releaseGates();
      }
      syncPlayback(paused ? 'paused' : 'playing');
    },
    next: () => {
      if (controller.signal.aborted || finished || advancing || !scene.dataset.guidePhase) { return; }
      advancing = true; skipping = true;
      syncPlayback(paused ? 'paused' : 'playing', true);
      finishWait(); releaseGates();
      animations.forEach(animation => {
        if (['running', 'paused'].includes(animation.playState)) { animation.finish(); }
      });
    }
  };
  syncPlayback('playing');
  if (sceneHeader && typeof ResizeObserver !== 'undefined') {
    headerObserver = new ResizeObserver(updateClearance);
    headerObserver.observe(sceneHeader);
  }
  let phaseTarget = null;
  const settleHeader = async() => {
    assertActive();
    if (!sceneHeader || reduced) { return; }
    const transitions = sceneHeader.getAnimations({subtree: true}).filter(animation =>
      animation.effect?.getComputedTiming().iterations !== Infinity);
    transitions.forEach(animation => animations.add(animation));
    await Promise.all(transitions.map(animation => animation.finished.catch(() => {})));
    transitions.forEach(animation => animations.delete(animation));
    assertActive();
  };
  const animate = async(element, frames, duration, retain = true) => {
    await gate();
    assertActive();
    if (reduced) { return; }
    const shown = fadeLevel ? toFadeFrames(frames) : frames;
    if (!shown) {
      return;
    }
    const animation = element.animate(shown, {duration: fadeLevel ? Math.min(REDUCED_FADE_MS, duration) : duration,
      easing: 'cubic-bezier(.4,0,.2,1)', fill: 'forwards'});
    animations.add(animation);
    if (skipping) { animation.finish(); }
    try { await animation.finished; } catch (error) { /* Cancelled by departure. */ }
    if (!retain) { animation.cancel(); animations.delete(animation); }
    assertActive();
  };
  // Illustrated pointer placed at its destination without travel ('minimal'), or faded in there ('reduced').
  const placeCursor = async(cursorEl, transform) => {
    await gate();
    assertActive();
    const wasHidden = cursorEl.hidden;
    cursorEl.style.transform = transform;
    cursorEl.hidden = false;
    if (fadeLevel && wasHidden) {
      await animate(cursorEl, [{opacity: 0}, {opacity: 1}], REDUCED_FADE_MS, false);
    }
  };
  // J-G2 (AN-2): a pointer that is not shown yet appears near its target (160 ms fade, then a
  // 24 px approach) instead of crossing the stage from its top-left corner; any travel keeps a
  // readable speed (0.8 px/ms at most).
  const POINTER_SPEED = 0.8;
  const movePointer = async(cursorEl, x, y, duration) => {
    const destination = `translate(${x}px, ${y}px)`;
    if (cursorEl.hidden) {
      const near = `translate(${x - 24}px, ${y + 12}px)`;
      cursorEl.style.transform = near;
      cursorEl.hidden = false;
      await animate(cursorEl, [{transform: near, opacity: 0}, {transform: near, opacity: 1}], 160);
      await animate(cursorEl, [{transform: near}, {transform: destination}], 220);
      return;
    }
    const from = new DOMMatrixReadOnly(getComputedStyle(cursorEl).transform);
    const distance = Math.hypot(x - from.m41, y - from.m42);
    await animate(cursorEl, [{transform: from.toString()}, {transform: destination}],
      Math.max(duration, Math.round(distance / POINTER_SPEED)));
  };
  // J-G1 (K15-30, P-G3): touch pointer gestures on the same WAAPI clock (animate/wait/gate), so Pause, Next phase
  // and departure own them. A finger does not travel: it lifts (80 ms fade), is placed (160 ms fade and 0.8 to 1
  // scale), taps (90 ms press, 360 ms ripple), presses and holds (450 ms ring) or drags (follows the card ghost).
  // 'reduced' keeps the fades only; 'minimal' places the pointer and shows no gesture.
  const touchDisc = cursorEl => cursorEl.querySelector('[data-guide-cursor-touch]') || cursorEl;
  const touchRipple = cursorEl => {
    const ripple = cursorEl.querySelector('[data-guide-cursor-ripple]');
    // Not awaited: the ripple overlaps the next step and stays owned by the clock (pause, next, departure).
    if (ripple) {
      animate(ripple, [{opacity: 0.5, transform: 'scale(1)'}, {opacity: 0, transform: 'scale(1.8)'}], 360, false)
        .catch(() => { /* Cancelled by departure. */ });
    }
  };
  const touchPointer = {
    place: async(cursorEl, x, y) => {
      cursorEl.dataset.guidePointer = 'touch';
      const destination = `translate(${x}px, ${y}px)`;
      if (still) { await placeCursor(cursorEl, destination); return; }
      await gate();
      assertActive();
      if (!cursorEl.hidden) { await animate(cursorEl, [{opacity: 1}, {opacity: 0}], 80, false); }
      cursorEl.style.transform = destination;
      cursorEl.hidden = false;
      await animate(cursorEl, [{opacity: 0, transform: `${destination} scale(.8)`},
        {opacity: 1, transform: `${destination} scale(1)`}], 160, false);
    },
    tap: async cursorEl => {
      if (!cursorEl || cursorEl.hidden) { return; }
      await gate();
      assertActive();
      if (reduced) { return; }
      touchRipple(cursorEl);
      await animate(touchDisc(cursorEl), [{transform: 'scale(1)'}, {transform: 'scale(.86)'},
        {transform: 'scale(1)'}], 90, false);
    },
    longPress: async cursorEl => {
      if (!cursorEl || cursorEl.hidden) { return; }
      await gate();
      assertActive();
      if (reduced) { return; }
      await animate(touchDisc(cursorEl), [{transform: 'scale(1)', '--easyedu-guide-press': 0},
        {transform: 'scale(.86)', '--easyedu-guide-press': 1}], 450, false);
      touchRipple(cursorEl);
    },
    // Press, then follow the card ghost (the caller animates it on the same clock), then release with a ripple.
    drag: async(cursorEl, dx, dy, duration, companions = []) => {
      if (!cursorEl || cursorEl.hidden) { return; }
      const from = new DOMMatrixReadOnly(getComputedStyle(cursorEl).transform);
      await gate();
      assertActive();
      if (reduced) { return; }
      await animate(touchDisc(cursorEl), [{transform: 'scale(1)'}, {transform: 'scale(.86)'}], 90);
      await Promise.all([animate(cursorEl, [{transform: from.toString()},
        {transform: `translate(${from.m41 + dx}px, ${from.m42 + dy}px)`}], duration), ...companions]);
      touchRipple(cursorEl);
    }
  };
  // The modality can change under a running demo (rotation, window resize): it returns to "Ready".
  const modalityQueries = [GUIDE_NARROW_QUERY, GUIDE_TOUCH_QUERY].map(query => window.matchMedia?.(query)).filter(Boolean);
  const onModalityChange = () => {
    if (guideModality().touch !== compact && !controller.signal.aborted) {
      playDiscoveryScene(root, scene, undefined, !scene.querySelector('[data-guide-scene-command="start"]'));
    }
  };
  modalityQueries.forEach(query => query.addEventListener?.('change', onModalityChange));
  controller.signal.addEventListener('abort', () => {
    modalityQueries.forEach(query => query.removeEventListener?.('change', onModalityChange));
  }, {once: true});
  // Fade the instruction copy, not the entire teaching scene. Its reading pause
  // starts only after the new sentence is visible; no business state is changed.
  const writeLive = async(text, state = 'active', immediate = false) => {
    assertActive();
    if (!live) { return; }
    if (!immediate) { await animate(liveCopy, [{opacity: 1}, {opacity: 0}], 100, false); }
    if (controller.signal.aborted) { return; }
    // The phase caption already supplies the visible number. Keep complete
    // narration for assistive technology and the historical template fallback.
    if (liveAnnouncement) { liveAnnouncement.textContent = text; }
    liveCopy.textContent = liveAnnouncement && phaseCaption && !phaseCaption.hidden && state === 'active' ?
      text.replace(/^\d+\s*[\u00b7.]\s*/, '') : text;
    liveCopy.title = text;
    live.dataset.guideLiveState = state;
    const completionIcon = live.querySelector('[data-guide-live-complete]');
    if (completionIcon) { completionIcon.hidden = state !== 'finished'; }
    if (!immediate) {
      await animate(liveCopy, [{opacity: 0, transform: 'translateY(.15rem)'},
        {opacity: 1, transform: 'translateY(0)'}], 260, false);
    }
  };
  // Scroll only the Guide reading surface, never the Moodle page. The same
  // cancellable animation set owns illustration and scroll, including exit.
  const reveal = async element => {
    await gate();
    assertActive();
    const body = scene.closest('.easyedu-guide-modal__body');
    if (!body || element.hidden) { return; }
    phaseTarget = element;
    updateClearance();
    const bounds = body.getBoundingClientRect(), item = element.getBoundingClientRect();
    const sticky = !sceneHeader || ['playing', 'paused'].includes(sceneHeader.dataset.guidePlaybackState);
    const readingTop = bounds.top + (sticky ? ((sceneHeader || live)?.getBoundingClientRect().height || 0) : 0) + 8;
    const readingBottom = bounds.bottom - 12;
    if (item.top >= readingTop && item.bottom <= readingBottom) { return; }
    const offset = item.height > readingBottom - readingTop || item.top < readingTop ?
      item.top - readingTop : item.bottom - readingBottom;
    const from = body.scrollTop;
    const to = Math.max(0, Math.min(from + offset, body.scrollHeight - body.clientHeight));
    if (still || skipping || !body.animate) { body.scrollTop = to; return; }
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
    assertActive();
  };
  // Reserve the real target's layout before scrolling, without painting it at
  // its old offscreen position. Keep the existing fade and cancellable clock.
  const revealPrepared = async(element, prepare = () => {}) => {
    assertActive();
    const visibility = element.style.visibility;
    const opacity = element.style.opacity;
    element.style.visibility = 'hidden';
    element.style.opacity = '0';
    element.hidden = false;
    try {
      prepare();
      await reveal(element);
      if (controller.signal.aborted) { return; }
      element.style.visibility = visibility;
      await animate(element, [{opacity: 0}, {opacity: 1}], 280);
    } finally {
      element.style.visibility = visibility;
      element.style.opacity = opacity;
    }
  };
  const phase = async(name, prepareTarget) => {
    assertActive();
    const jumped = skipping;
    skipping = false;
    const item = scene.querySelector(`[data-guide-phase="${name}"]`);
    scene.querySelectorAll('[data-guide-phase]').forEach(node => node.removeAttribute('aria-current'));
    if (item) {
      item.setAttribute('aria-current', 'step');
      const text = (compact && mode === 'add' && item.dataset.compactAdd) ||
        (compact && item.dataset.compact) || (mode === 'add' && item.dataset.add) || item.dataset.original;
      item.textContent = text;
      await writeLive(text, 'active', paused && jumped);
      if (controller.signal.aborted) { return; }
      scene.dataset.guidePhase = name;
    }
    advancing = false;
    syncPlayback(paused ? 'paused' : 'playing');
    if (prepareTarget) { await prepareTarget(); }
    // New narration can wrap and change the sticky height. Re-reveal the real
    // phase target after that copy update, not just before the phase begins.
    const validateTarget = ['membership', 'actions'].includes(kind) && name === 'validate' ?
      scene.querySelector('[data-guide-confirm]') : null;
    if (validateTarget || phaseTarget) { await reveal(validateTarget || phaseTarget); }
    await gate();
    if (controller.signal.aborted) { return; }
    // Reduced motion removes movement, never the time needed to read a phase.
    const words = item?.textContent.trim().split(/\s+/).filter(Boolean).length || 0;
    const minimum = Number(root.easyeduGuideConfig?.narrationMinimumMs) || DEFAULTS.narrationMinimumMs;
    const pace = Number(root.easyeduGuideConfig?.narrationWordsPerMinute) || DEFAULTS.narrationWordsPerMinute;
    const leadIn = Number(root.easyeduGuideConfig?.narrationLeadInMs) || DEFAULTS.narrationLeadInMs;
    const maximum = Math.max(minimum, Number(root.easyeduGuideConfig?.narrationMaximumMs) || DEFAULTS.narrationMaximumMs);
    let reading = Math.min(maximum, Math.max(minimum, leadIn + words * 60000 / Math.max(1, pace)));
    // Budget actual reading phases, on the same pausable clock at every Motion
    // level. Desktop Add has two phases (no confirmation); inspection has five.
    // Keep the illustrated result on screen, never add a second animation loop.
    if (kind === 'membership' && mode === 'add' && !compact) {
      reading += 5000;
    } else if (kind === 'inspection') {
      reading = Math.max(minimum - 350, reading - 350);
    } else if (kind === 'membership' && mode === 'move' && compact) {
      reading += 250;
    }
    await wait(reading);
  };
  root.easyeduGuideSceneStop = () => {
    controller.abort();
    headerObserver?.disconnect();
    restoreClearance();
    finishWait(); releaseGates();
    root.easyeduGuideScenePlayback = null;
    syncPlayback('idle');
    if (dropFrame !== null) { cancelAnimationFrame(dropFrame); }
    animations.forEach(animation => animation.cancel());
    stage.querySelector('[data-guide-destination]')?.classList.remove('is-guide-drop-target');
    stage.querySelector('[data-guide-ghost]')?.remove();
  };
  const run = async() => {
    if (kind === 'creation') {
      // K17-17: use the common pausable scene clock and existing Kit header.
      // Formula expansion is local illustration data, never a Moodle command.
      const input = stage.querySelector('[data-guide-pattern]');
      const output = scene.querySelector('[data-guide-names]');
      const template = scene.querySelector('[data-guide-name-card]');
      const sample = input.value;
      const match = sample.match(/^(.*?)([#@])\*([1-6])$/);
      if (!match || !template || !output) {
        return;
      }
      output.replaceChildren();
      input.value = '';
      await reveal(input);
      await phase('pattern');
      if (level === 'full') {
        for (const character of sample) {
          input.value += character;
          await wait(45);
        }
      } else {
        input.value = sample;
      }
      await phase('preview');
      for (let index = 0; index < Number(match[3]); index++) {
        const card = template.content.firstElementChild.cloneNode(true);
        card.querySelector('[data-guide-name]').textContent = match[1] +
          (match[2] === '#' ? index + 1 : String.fromCharCode(65 + index));
        output.appendChild(card);
        await reveal(card);
        await animate(card, [{opacity: 0, transform: 'translateY(8px)'},
          {opacity: 1, transform: 'translateY(0)'}], 260);
      }
      await phase('result');
      await writeLive(scene.dataset.guideFinishedLabel || '', 'finished');
      if (controller.signal.aborted) {
        return;
      }
      finished = true;
      advancing = false;
      syncPlayback('finished');
      await settleHeader();
      if (!controller.signal.aborted) {
        scene.dataset.guideSceneFinished = 'true';
      }
      return;
    }
    if (kind === 'simplecreate') {
      // J-G4 (P-G5, validated 16/10): create ONE group, then ONE grouping, then rename the group.
      // Illustration only: readonly fields and disabled buttons, never a Moodle command.
      const pick = selector => stage.querySelector(selector);
      const cursor = pick('[data-guide-cursor]');
      const field = role => pick(`[data-guide-simplecreate-input="${role}"]`);
      const submit = role => pick(`[data-guide-simplecreate-submit="${role}"]`);
      const created = role => pick(`[data-guide-simplecreate-result="${role}"]`);
      const groupingStage = pick('[data-guide-simplecreate-grouping-stage]');
      const cardName = pick('[data-guide-simplecreate-card-name]');
      const edit = pick('[data-guide-simplecreate-edit]');
      const rename = pick('[data-guide-simplecreate-rename]');
      const sample = name => stage.getAttribute(`data-guide-simplecreate-${name}`) || '';
      const pointAt = async element => {
        assertActive();
        if (!cursor || !element) { return; }
        await gate();
        const target = element.getBoundingClientRect(), frame = stage.getBoundingClientRect();
        const x = target.left - frame.left + target.width / 2, y = target.top - frame.top + target.height / 2;
        if (compact) { await touchPointer.place(cursor, x, y); return; }
        if (still) {
          await placeCursor(cursor, `translate(${x}px, ${y}px)`);
          return;
        }
        await movePointer(cursor, x, y, 520);
      };
      const hidePointer = async() => {
        if (!cursor || cursor.hidden) { return; }
        if (!still) { await animate(cursor, [{opacity: 1}, {opacity: 0}], 160, false); }
        cursor.hidden = true;
      };
      const press = element => element ? Promise.all([compact ? touchPointer.tap(cursor) : Promise.resolve(),
        animate(element, [{transform: 'scale(1)'}, {transform: 'scale(.94)'}, {transform: 'scale(1)'}], 220, false)]) :
        Promise.resolve();
      const type = async(input, text) => {
        if (!input) { return; }
        input.value = '';
        for (const character of text) {
          assertActive();
          input.value += character;
          await wait(still ? 0 : 45);
        }
        input.value = text;
      };
      const show = async element => {
        if (!element) { return; }
        element.hidden = false;
        await reveal(element);
        await animate(element, [{opacity: 0, transform: 'translateY(6px)'}, {opacity: 1, transform: 'translateY(0)'}],
          160, false);
      };
      // Same narration and reading clock as phase(), with the copy carried by the root labels.
      const say = async number => {
        assertActive();
        skipping = false;
        const text = stage.getAttribute(`data-guide-phase-${number}-label`) || '';
        await writeLive(text, 'active');
        if (controller.signal.aborted) { return; }
        scene.dataset.guidePhase = String(number);
        advancing = false;
        syncPlayback(paused ? 'paused' : 'playing');
        await gate();
        const words = text.trim().split(/\s+/).filter(Boolean).length;
        const minimum = Number(root.easyeduGuideConfig?.narrationMinimumMs) || DEFAULTS.narrationMinimumMs;
        const maximum = Math.max(minimum,
          Number(root.easyeduGuideConfig?.narrationMaximumMs) || DEFAULTS.narrationMaximumMs);
        const pace = Number(root.easyeduGuideConfig?.narrationWordsPerMinute) || DEFAULTS.narrationWordsPerMinute;
        const leadIn = Number(root.easyeduGuideConfig?.narrationLeadInMs) || DEFAULTS.narrationLeadInMs;
        await wait(Math.min(maximum, Math.max(minimum, leadIn + words * 60000 / Math.max(1, pace))));
      };
      await reveal(stage);
      await pointAt(field('group'));
      await say(1);
      if (compact) { await touchPointer.tap(cursor); }
      await type(field('group'), sample('name'));
      await pointAt(submit('group'));
      await say(2);
      await press(submit('group'));
      if (field('group')) { field('group').value = ''; }
      await show(created('group'));
      await show(groupingStage);
      await pointAt(field('grouping'));
      await say(3);
      if (compact) { await touchPointer.tap(cursor); }
      await type(field('grouping'), sample('grouping'));
      if (compact) { await pointAt(submit('grouping')); }
      await press(submit('grouping'));
      if (field('grouping')) { field('grouping').value = ''; }
      await show(created('grouping'));
      await pointAt(edit);
      await say(4);
      await press(edit);
      if (cardName && rename) {
        cardName.hidden = true;
        rename.hidden = false;
        await type(rename, sample('renamed'));
        cardName.textContent = sample('renamed');
        rename.hidden = true;
        cardName.hidden = false;
      }
      await hidePointer();
      if (controller.signal.aborted) { return; }
      await writeLive(scene.dataset.guideFinishedLabel || '', 'finished');
      if (controller.signal.aborted) { return; }
      finished = true;
      advancing = false;
      syncPlayback('finished');
      await settleHeader();
      if (!controller.signal.aborted) { scene.dataset.guideSceneFinished = 'true'; }
      return;
    }
    if (kind === 'inspection') {
      const card = stage.querySelector('[data-guide-inspection-card]');
      const trigger = stage.querySelector('[data-guide-inspection-trigger]');
      const compactTrigger = stage.querySelector('[data-guide-inspection-mobile-trigger]');
      const menu = stage.querySelector('[data-guide-inspection-menu]');
      const panel = stage.querySelector('[data-guide-inspection-panel]');
      const input = stage.querySelector('[data-guide-inspection-input]');
      const chips = stage.querySelector('[data-guide-inspection-chips]');
      const cancel = panel.querySelector('[data-guide-inspection-cancel]');
      const cursor = stage.querySelector('[data-guide-inspection-cursor]');
      const value = input.getAttribute('data-guide-example-value') || '';
      trigger.hidden = compact;
      if (compactTrigger) { compactTrigger.hidden = !compact; }
      // Illustration only: never focus, click or resolve a native identifier.
      // Reuse the shared pointer paint and playback clock, not a mobile mouse.
      const pointAt = async(element) => {
        assertActive();
        if (!cursor) { return; }
        await gate();
        assertActive();
        const target = element.getBoundingClientRect(), frame = stage.getBoundingClientRect();
        const x = target.left - frame.left + target.width / 2, y = target.top - frame.top + target.height / 2;
        if (compact) { await touchPointer.place(cursor, x, y); return; }
        if (still) {
          await placeCursor(cursor, `translate(${x}px, ${y}px)`);
          return;
        }
        await movePointer(cursor, x, y, 650);
      };
      const hidePointer = async() => {
        assertActive();
        if (still && cursor) {
          cursor.hidden = true;
          return;
        }
        if (!cursor || cursor.hidden) { return; }
        await animate(cursor, [{opacity: 1}, {opacity: 0}], 180);
        cursor.hidden = true;
        animations.forEach(animation => {
          if (animation.effect?.target === cursor) { animation.cancel(); animations.delete(animation); }
        });
      };
      // Animate the auto-sized card while keeping the natural field's layout.
      // Same WAAPI set/clock as reading: Pause, Next and departure own both.
      // J-G2 (AN-3): the card reaches its new size at once and only the panel fades and slides
      // (transform/opacity, no animated height, so no layout work per frame and no stutter).
      const disclose = async open => {
        await gate();
        assertActive();
        if (open) {
          panel.hidden = false;
          await animate(panel, [{opacity: 0, transform: 'translateY(-4px)'},
            {opacity: 1, transform: 'translateY(0)'}], 240, false);
        } else {
          await animate(panel, [{opacity: 1}, {opacity: 0}], 160, false);
          panel.hidden = true;
        }
      };
      await reveal(card);
      // Touch: the finger rests above the card's menu button during the first phase, taps it, then rests on
      // the menu entry it names (no mouse trajectory).
      if (compact && compactTrigger) { await pointAt(compactTrigger); }
      await phase('orient');
      if (controller.signal.aborted) { return; }
      if (compact) {
        await touchPointer.tap(cursor);
        menu.hidden = false;
        await reveal(menu);
        await animate(menu, [{opacity: 0}, {opacity: 1}], 280);
        await pointAt(menu.querySelector('strong'));
      } else {
        await pointAt(trigger);
      }
      await phase('open');
      if (controller.signal.aborted) { return; }
      if (compact) { await touchPointer.tap(cursor); }
      await hidePointer();
      menu.hidden = true;
      await disclose(true);
      await reveal(panel);
      if (controller.signal.aborted) { return; }
      input.value = value;
      await pointAt(input);
      await phase('enter');
      if (controller.signal.aborted) { return; }
      if (compact) { await touchPointer.tap(cursor); }
      await hidePointer();
      // J-G2 (AN-3): the chips take their place at once, then fade in (no animated height).
      chips.style.opacity = '0';
      chips.hidden = false;
      if (controller.signal.aborted) { return; }
      await reveal(chips);
      await animate(chips, [{opacity: 0}, {opacity: 1}], 260);
      chips.style.removeProperty('opacity');
      await phase('review');
      if (controller.signal.aborted) { return; }
      if (cancel) { await reveal(cancel); }
      if (cancel) { await pointAt(cancel); }
      await phase('return');
      if (controller.signal.aborted) { return; }
      if (compact) { await touchPointer.tap(cursor); }
      await hidePointer();
      await disclose(false);
      if (controller.signal.aborted) { return; }
      input.value = '';
      chips.hidden = true;
      result.textContent = result.dataset.inspection || scene.easyeduGuideResultOriginal;
      await writeLive(scene.dataset.guideFinishedLabel || '', 'finished');
      if (controller.signal.aborted) { return; }
      finished = true;
      advancing = false;
      syncPlayback('finished');
      await settleHeader();
      if (controller.signal.aborted) { return; }
      if (recap) {
        recap.style.opacity = '0';
        recap.hidden = false;
        recap.querySelectorAll('[data-guide-phase]').forEach(item => {
          item.textContent = ((compact && item.dataset.compact) || item.dataset.original)
            .replace(/^\d+\s*[\u00b7.]\s*/, '');
          item.removeAttribute('aria-current');
        });
        await reveal(recap);
        await animate(recap, [{opacity: 0}, {opacity: 1}], 280);
        recap.style.removeProperty('opacity');
      }
      if (!controller.signal.aborted) { scene.dataset.guideSceneFinished = 'true'; }
      return;
    }
    const person = stage.querySelector('[data-guide-person]');
    const member = stage.querySelector('[data-guide-member]');
    const cursor = stage.querySelector('[data-guide-cursor]');
    const menu = stage.querySelector('[data-guide-menu]');
    const confirm = stage.querySelector('[data-guide-confirm]');
    // The pointer keeps its original travel/drag clock. It is decorative and
    // must not paint through sticky chrome while its stage is being scrolled.
    let cursorVisibilityFrame = null;
    const cursorVisibility = cursor.style.visibility;
    const updateCursorVisibility = () => {
      if (controller.signal.aborted || finished) { return; }
      const body = readingBody?.getBoundingClientRect();
      const header = sceneHeader?.getBoundingClientRect();
      const point = cursor.getBoundingClientRect();
      const top = body && header && header.top <= body.top + 2 ? header.bottom : body?.top;
      cursor.style.visibility = body && (point.top < top || point.bottom > body.bottom) ? 'hidden' : cursorVisibility;
      // Only a gliding pointer or scroll needs a per-frame check; below the 'full' level it is
      // evaluated when the pointer is placed and when the reading surface scrolls.
      if (!still) { cursorVisibilityFrame = requestAnimationFrame(updateCursorVisibility); }
    };
    updateCursorVisibility();
    if (still) {
      readingBody?.addEventListener('scroll', updateCursorVisibility, {passive: true});
    }
    controller.signal.addEventListener('abort', () => {
      cancelAnimationFrame(cursorVisibilityFrame);
      readingBody?.removeEventListener('scroll', updateCursorVisibility);
      cursor.style.visibility = cursorVisibility;
    }, {once: true});
    if (compact && mode === 'add') {
      // Native mobile Add uses Participants > Move participants (addusers),
      // not the member-transfer action that removes the source membership.
      stage.querySelector('[data-guide-source-title]').textContent = scene.dataset.guideMobileParticipantsLabel;
      menu.querySelector('strong').textContent = scene.dataset.guideMobileAddAction;
      menu.querySelector('[data-guide-member-remove]').hidden = true;
      confirm.querySelector('header strong').textContent = scene.dataset.guideMobileAddAction;
      confirm.querySelector('[data-guide-simulated-submit]').textContent = scene.dataset.guideMobileAddSubmit ||
        confirm.querySelector('[data-guide-simulated-submit]').textContent;
      confirm.querySelector('[data-guide-consequence]').textContent = scene.dataset.guideMobileAddConsequence;
    }
    let cursorPoint = null;
    const travelPoint = async(point, duration) => {
      assertActive();
      cursorPoint = point;
      if (compact) {
        await touchPointer.place(cursor, point.x, point.y);
        updateCursorVisibility();
        return;
      }
      if (still) {
        await placeCursor(cursor, `translate(${point.x}px, ${point.y}px)`);
        updateCursorVisibility();
        return;
      }
      await movePointer(cursor, point.x, point.y, duration);
    };
    const travel = async(element, duration = 750, cardAnchor = false) => {
      assertActive();
      const a = element.getBoundingClientRect(), b = stage.getBoundingClientRect();
      const point = {
        x: a.left - b.left + (cardAnchor ? Math.min(48, a.width / 2) : a.width / 2),
        y: a.top - b.top + (cardAnchor ? Math.min(28, a.height / 2) : a.height / 2)
      };
      await travelPoint(point, duration);
    };
    await reveal(person);
    await travel(person, 750, true);
    if (compact) { await touchPointer.tap(cursor); }
    stage.querySelectorAll('.easyedu-guide-scene__person').forEach(node => node.classList.add('is-selected'));
    stage.querySelectorAll('[data-guide-illustrated-checkbox]').forEach(node => { node.checked = true; });
    await phase('select');
    if (controller.signal.aborted) { return; }
    if (mode !== 'add' || compact) {
      // Desktop follows the illustrated click. Compact/reduced scenes anchor
      // to the same card without implying a mouse-only mobile interaction.
      const stageBounds = stage.getBoundingClientRect(), cardBounds = person.getBoundingClientRect();
      const point = cursorPoint || {x: cardBounds.left - stageBounds.left + 24,
        y: cardBounds.bottom - stageBounds.top};
      await phase('menu', () => revealPrepared(menu, () => {
        const menuBounds = menu.getBoundingClientRect();
        stage.style.setProperty('--easyedu-guide-menu-x',
          `${Math.max(0, Math.min(point.x + 12, stageBounds.width - menuBounds.width))}px`);
        stage.style.setProperty('--easyedu-guide-menu-y',
          `${Math.max(0, Math.min(point.y + 12, stageBounds.height - menuBounds.height))}px`);
      }));
      if (controller.signal.aborted) { return; }
      await travel(menu.querySelector('strong'));
      if (compact) {
        await touchPointer.tap(cursor);
      } else if (!still) {
        await animate(cursor, [{opacity: 1}, {opacity: 0.45}, {opacity: 1}], 180);
      }
      await animate(menu, [{opacity: 1}, {opacity: 0}], 220);
      if (controller.signal.aborted) { return; }
      menu.hidden = true;
      await phase('confirm', () => revealPrepared(confirm));
      if (controller.signal.aborted) { return; }
      if (compact) {
        // Touch: choose the destination field of the confirmation before pressing the button.
        await travel(confirm.querySelector('.easyedu-guide-scene__destination'));
        await touchPointer.tap(cursor);
      }
      const submit = confirm.querySelector('[data-guide-simulated-submit]');
      await phase('validate');
      await reveal(submit);
      await travel(submit);
      if (compact) { await touchPointer.tap(cursor); }
      await animate(submit, [{outline: '2px solid currentColor', outlineOffset: '2px'},
        {outline: '2px solid transparent', outlineOffset: '2px'}], 320);
      if (controller.signal.aborted) { return; }
      await animate(confirm, [{opacity: 1}, {opacity: 0}], 220);
      if (controller.signal.aborted) { return; }
      confirm.hidden = true;
      // Move the natural selected cards only after the illustrated confirmation.
      // Compact/reduced modes keep the same outcome without a mouse-only gesture.
      // Confirmation can leave the scrollport focused on its destination field.
      // Reveal the cards before measuring displacement; reuse the same paused,
      // cancellable scene clock rather than scrolling the Moodle page behind it.
      await reveal(stage);
      if (controller.signal.aborted) { return; }
      if (!compact && !still) {
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
    } else if (!compact) {
      await phase('menu');
      if (controller.signal.aborted) { return; }
      if (!still) {
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
    }
    if (controller.signal.aborted) { return; }
    member.hidden = false;
    await animate(cursor, [{opacity: 1}, {opacity: 0}], 220);
    if (controller.signal.aborted) { return; }
    cursor.hidden = true;
    cancelAnimationFrame(cursorVisibilityFrame);
    cursor.style.visibility = cursorVisibility;
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
    finished = true;
    advancing = false;
    syncPlayback('finished');
    await settleHeader();
    if (controller.signal.aborted) { return; }
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
  // A stopped run may reject after its replacement starts. It must never
  // stop that newer run or write back into its restored illustration.
  run().catch(() => { if (!controller.signal.aborted) { stopDiscoveryScene(root); } });
};

const stopSlideTransition = root => {
  root.easyeduGuideSlideStop?.();
  root.easyeduGuideSlideStop = null;
};

// One cancellable presentation transition; the existing slide engine still owns state.
const setActiveSlide = (root, index, config, options = {}) => {
  root.easyeduGuideTooltipHide?.();
  stopSlideTransition(root);
  const modal = root.querySelector(SELECTORS.modal);
  const outgoing = root.querySelector(SELECTORS.slide + '.is-active');
  if (options.immediate || !root.classList.contains('easyedu-guide--discovery') ||
      !modal || modal.hidden || !outgoing || index === getActiveSlideIndex(root) || getMotionLevel(root) === 'minimal') {
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
  const fadeCap = getMotionLevel(root) === 'reduced' ? REDUCED_FADE_MS : Infinity;
  const fade = async(element, from, to, duration) => {
    const animation = element.animate([{opacity: from}, {opacity: to}],
      {duration: Math.min(duration, fadeCap), easing: 'cubic-bezier(.4,0,.2,1)', fill: 'both'});
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
  if (config && options.persistReading) saveGuideReadingPosition(config, safeIndex);
  syncInterfaceCue(root, slides[safeIndex]);
  stopDiscoveryScene(root);
  const modal = root.querySelector(SELECTORS.modal);
  if (modal && !modal.hidden) {
    const scene = slides[safeIndex]?.querySelector('[data-easyedu-guide-scene]');
    playDiscoveryScene(root, scene, undefined, !scene?.querySelector('[data-guide-scene-command="start"]'));
  }
  scrollActiveNavItemIntoView(root);
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const hideWelcome = root => {
  root.easyeduGuideWelcomeWaitStop?.();
  const invitation = root.querySelector('[data-easyedu-guide-welcome]');
  if (!invitation || invitation.hidden) { return; }
  invitation.hidden = true;
  if (root.easyeduGuideCurrentTarget === root.easyeduGuideWelcomeTarget) {
    clearHighlight(root);
  }
  root.easyeduGuideWelcomeTarget = null;
};

const offerWelcome = (root, config) => {
  // A first-visit invitation never competes with a resumed task or phone nav.
  if (!config.welcomeOffer || window.innerWidth < 1024 ||
      root.easyeduGuideWelcomeDismissed) { return; }
  const invitation = root.querySelector('[data-easyedu-guide-welcome]');
  const target = config.welcomeTarget ? document.querySelector(config.welcomeTarget) :
    root.querySelector(SELECTORS.open);
  if (!invitation || !target) { return; }
  if (!isVisibleElement(target)) {
    // Consumers may initialize Guide while their loading shell still hides
    // the launcher. Observe only its ancestry, never the whole document tree.
    // The wait is bounded and belongs to the Guide teardown lifecycle.
    if (!root.easyeduGuideWelcomeWaitStop) {
      const refresh = () => offerWelcome(root, config);
      const mutation = new MutationObserver(refresh);
      const resize = new ResizeObserver(refresh);
      resize.observe(target);
      for (let node = target; node; node = node.parentElement) {
        mutation.observe(node, {attributes: true, attributeFilter: ['class', 'hidden', 'style']});
      }
      const deadline = setTrackedTimeout(root, () => root.easyeduGuideWelcomeWaitStop?.(), 30000);
      root.easyeduGuideWelcomeWaitStop = () => {
        mutation.disconnect();
        resize.disconnect();
        clearTrackedTimeout(root, deadline);
        root.easyeduGuideWelcomeWaitStop = null;
      };
    }
    return;
  }
  root.easyeduGuideWelcomeWaitStop?.();
  invitation.hidden = false;
  root.easyeduGuideWelcomeTarget = target;
  updateHighlight(root, target);
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
  const wasOpen = !modal.hidden;
  root.easyeduGuideWelcomeDismissed = true;
  hideWelcome(root);

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
  if (!wasOpen) {
    // Adapter persists an actual opening; an impression/dismissal is not seen.
    document.dispatchEvent(new CustomEvent('easyedu:guide-opened', {detail: {root}}));
  }

  const storage = getStorage();
  if (storage) {
    storage.setItem(config.storageKey, '1');
  }
  syncSlideLocks(root, config);
  setActiveSlide(root, getActiveSlideIndex(root), config, {immediate: true});
  setTrackedTimeout(root, () => updateNavScrollButtons(root), 80);
};

const closeModal = (root, preserveHighlight = false, restoreFocus = true, options = {}) => {
  root.easyeduGuideTooltipHide?.();
  if (root.easyeduGuideFullscreen?.ownsFullscreen()) {
    return root.easyeduGuideFullscreen.exit().then(exited => {
      if (!exited) return;
      return closeModal(root, preserveHighlight, restoreFocus, options);
    });
  }
  stopSlideTransition(root);
  const modal = root.querySelector(SELECTORS.modal);
  if (!modal) {
    stopDiscoveryScene(root);
    return Promise.resolve();
  }

  const finish = () => {
    modal.classList.remove('is-open');
    modal.hidden = true;
    stopDiscoveryScene(root);
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
      getMotionLevel(root) === 'minimal') {
    finish();
    return Promise.resolve();
  }
  if (root.easyeduGuideExitPromise) { return root.easyeduGuideExitPromise; }
  const animation = modal.animate([{opacity: 1}, {opacity: 0}], {
    duration: getMotionLevel(root) === 'reduced' ? REDUCED_FADE_MS : 200, easing: 'ease', fill: 'both'});
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

// Scroll only this list; the interface target keeps its independent position.
const scrollActiveChecklistItemIntoView = root => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const list = root.querySelector(SELECTORS.checklistItems);
  const active = list && list.querySelector('[data-easyedu-guide-step-index].is-active');
  if (!checklist || checklist.hidden || !active || checklist.classList.contains('is-minimized')) { return; }
  window.requestAnimationFrame(() => {
    if (checklist.hidden || checklist.classList.contains('is-minimized') ||
        !list.contains(active) || !active.classList.contains('is-active') || !list.clientHeight) { return; }
    const bounds = list.getBoundingClientRect();
    const item = active.getBoundingClientRect();
    const top = bounds.top + list.clientTop;
    const bottom = top + list.clientHeight;
    const delta = item.top < top ? item.top - top : item.bottom > bottom ? item.bottom - bottom : 0;
    if (delta) {
      list.scrollTo({top: Math.max(0, list.scrollTop + delta), behavior: getScrollBehavior(root)});
    }
  });
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
  const step = steps[activeIndex] || activeStep || steps[0] || {};
  const completeCount = items.filter(item => item.classList.contains('is-complete')).length;
  const complete = items.length > 0 && completeCount === items.length;
  const title = root.querySelector(SELECTORS.checklistTitle);
  const subtitle = root.querySelector(SELECTORS.checklistSubtitle);

  if (title) {
    title.textContent = complete ?
      (config.labels.completeTitle || config.labels.complete || config.labels.guidedPath || '') :
      `${config.labels.guidedPath || ''}${config.labels.guidedPathSeparator || ': '}${getStepText(step, 'title') || getPathLabel(pathName, config)}`;
  }
  if (subtitle) {
    subtitle.textContent = `${completeCount} / ${steps.length} ${config.labels.completedSteps || ''}`;
  }
  scrollActiveChecklistItemIntoView(root);
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
  scrollActiveChecklistItemIntoView(root);
  const icon = minimize.querySelector('.fa');
  if (icon) {
    icon.classList.toggle('fa-minus', !minimized);
    icon.classList.toggle('fa-expand', minimized);
  }
};

// E2 (K9): a finished path always opens its full end box, also on compact viewports where
// in-progress paths start reduced. The user can still reduce it afterwards.
const expandCompleteChecklist = checklist => {
  checklist.classList.remove('is-minimized');
  checklist.setAttribute('data-easyedu-guide-checklist-expanded', '');
};

const renderChecklist = (root, config, pathName) => {
  const checklist = root.querySelector(SELECTORS.checklist);
  const list = root.querySelector(SELECTORS.checklistItems);
  const message = root.querySelector(SELECTORS.checklistMessage);
  const steps = config.paths[pathName] || [];

  if (!checklist || !list || steps.length === 0) {
    return;
  }

  const previousItems = Array.from(list.children);
  const reusable = checklist.getAttribute('data-easyedu-guide-path') === pathName ?
    new Map(previousItems.map(item => [item.getAttribute('data-easyedu-guide-step-id'), item])) : new Map();
  checklist.hidden = false;
  hideInterfaceReturn(root, true);
  const wasMinimized = checklist.classList.contains('is-minimized');
  const compactDefault = isCompactChecklistViewport() &&
    !checklist.hasAttribute('data-easyedu-guide-checklist-expanded');
  checklist.classList.remove('is-complete');
  checklist.classList.toggle('is-minimized', isCompactChecklistViewport() ? compactDefault : wasMinimized);
  checklist.classList.toggle('is-unlock-path', config.unlockPaths.includes(pathName));
  checklist.classList.toggle('has-guided-feedback', steps.some(step => !!getStepText(step, 'feedback')));
  checklist.setAttribute('data-easyedu-guide-path', pathName);
  // J-G3: canonical side from the first frame (right; compact viewports dock at the bottom).
  if (!checklist.classList.contains('is-docked-left') && !checklist.classList.contains('is-docked-right')) {
    checklist.classList.add('is-docked-right');
  }
  checklist.toggleAttribute('data-easyedu-guide-checklist-scroll', steps.length > 3);
  const retained = new Set();

  steps.forEach((step, index) => {
    const stepComplete = isStepComplete(config, pathName, step, index);
    const dependencyMissing = step.requiresStep ? !getCompletedSteps(config, pathName).includes(step.requiresStep) : false;
    const locked = (step.requires ? !isRequirementMet(config, step.requires) : false) || dependencyMissing;
    const id = step.id || String(index);
    const item = reusable.get(id) || document.createElement('button');
    retained.add(item);
    item.type = 'button';
    item.className = 'easyedu-guide-checklist__item easyedu-guided-panel__step';
    item.classList.toggle('is-locked', locked);
    item.classList.toggle('is-complete', stepComplete);
    item.disabled = locked;
    item.setAttribute('data-easyedu-guide-step-id', id);
    item.setAttribute('data-easyedu-guide-step-index', String(index));
    item.setAttribute('aria-disabled', locked ? 'true' : 'false');
    item.removeAttribute('aria-current');
    if (locked) {
      item.setAttribute('data-easyedu-guide-lock-message', getLockedStepRequirement(config, steps, step));
    } else { item.removeAttribute('data-easyedu-guide-lock-message'); }
    const feedback = getStepText(step, 'feedback');
    if (feedback) {
      item.setAttribute('data-easyedu-guide-feedback', feedback);
    } else { item.removeAttribute('data-easyedu-guide-feedback'); }
    const marker = document.createElement('span');
    marker.className = 'easyedu-guide-checklist__marker easyedu-guided-panel__index';
    marker.textContent = String(index + 1);
    const label = document.createElement('span');
    const title = document.createElement('strong');
    title.textContent = getStepText(step, 'title');
    label.appendChild(title);
    const descriptionText = getStepText(step, 'description');
    if (descriptionText) {
      const description = document.createElement('small');
      description.textContent = descriptionText;
      label.appendChild(description);
    }
    if (locked && (step.requiresLabel || step.requiresStepLabel || step.requiresStep)) {
      const requirement = document.createElement('small');
      requirement.className = 'easyedu-guide-checklist__requirement';
      requirement.textContent = getLockedStepRequirement(config, steps, step);
      label.appendChild(requirement);
    }
    const stateLabel = document.createElement('span');
    stateLabel.className = 'sr-only';
    stateLabel.setAttribute('data-easyedu-guide-step-state', '');
    stateLabel.textContent = stepComplete ? config.labels.stepCompleted : locked ? config.labels.stepLocked : '';
    item.replaceChildren(marker, label, stateLabel);
    // Moving even an existing focused button can blur it. Only insert when
    // the semantic order actually changed; progress alone keeps the node.
    if (list.children[index] !== item) { list.insertBefore(item, list.children[index] || null); }
  });
  previousItems.filter(item => !retained.has(item)).forEach(item => item.remove());

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
    const initialText = allComplete ? completeMessage :
      (getStepText(activeStep, 'feedback') || config.labels.hint || config.labels.complete);
    const icon = message.querySelector('.fa');
    const text = message.querySelector('[data-easyedu-guide-checklist-message-text]');
    checklist.classList.toggle('is-complete', allComplete);
    message.classList.toggle('is-complete', allComplete);
    if (allComplete) {
      expandCompleteChecklist(checklist);
    }
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
  const activeMessage = getStepText(activeStep, 'feedback') || config.labels.hint || '';

  checklist.classList.toggle('is-complete', complete);
  message.classList.toggle('is-complete', complete);
  if (complete) {
    expandCompleteChecklist(checklist);
    syncChecklistMinimizeControl(root);
  }
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
  const compact = guideModality().narrow;
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

// Crossing the compact breakpoint can swap a step's gesture (titleCompact,
// highlightTargetCompact, ...). Re-render the open checklist in place and move
// a painted cue to the equivalent control of the new workspace.
const refreshResponsiveChecklist = root => {
  const config = root.easyeduGuideConfig;
  const checklist = root.querySelector(SELECTORS.checklist);
  const pathName = checklist && !checklist.hidden ? checklist.getAttribute('data-easyedu-guide-path') : '';
  if (!config || !pathName || !config.paths[pathName]) {
    return;
  }
  renderChecklist(root, config, pathName);
  const active = checklist.querySelector('[data-easyedu-guide-step-index].is-active');
  const step = active ? config.paths[pathName][Number(active.getAttribute('data-easyedu-guide-step-index') || 0)] : null;
  updateChecklistMessage(root, config, step || null);
  if (step && root.easyeduGuideCurrentTarget && !isPathComplete(config, pathName)) {
    const target = resolveStepHighlightTarget(config, step);
    if (target) {
      scheduleHighlightRefresh(root, target, true);
    }
  }
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
  const refreshActiveNav = () => {
    updateNavScrollButtons(root);
    clearTrackedTimeout(root, root.easyeduGuideNavResizeTimer);
    root.easyeduGuideNavResizeTimer = setTrackedTimeout(root, () => {
      root.easyeduGuideNavResizeTimer = null;
      if (isModalOpen(root)) { scrollActiveNavItemIntoView(root, 'nearest'); }
    }, 120);
  };
  addTrackedListener(root, window, 'resize', refreshActiveNav);
  addTrackedListener(root, window, 'orientationchange', refreshActiveNav);
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

// The full navigation label remains the button's accessible name. This visual
// enhancement reveals ellipsised copy only, without repeating its name to AT.
const bindNavigationTooltips = root => {
  if (!root.classList.contains('easyedu-guide--discovery')) return;
  const modal = root.querySelector(SELECTORS.modal);
  const nav = root.querySelector(SELECTORS.nav);
  if (!modal || !nav) return;
  let tooltip = null;
  let target = null;
  let refreshFrame = null;
  let graceTimer = null;
  const cancelGrace = () => {
    if (graceTimer !== null) window.clearTimeout(graceTimer);
    graceTimer = null;
  };
  const hide = () => {
    cancelGrace();
    if (refreshFrame !== null) window.cancelAnimationFrame(refreshFrame);
    refreshFrame = null;
    tooltip?.remove();
    tooltip = null;
    // Restore the native pill title (K1) once the full-label tooltip is gone.
    if (target && target.dataset.easyeduGuideTitle !== undefined) {
      target.setAttribute('title', target.dataset.easyeduGuideTitle);
      delete target.dataset.easyeduGuideTitle;
    }
    target = null;
  };
  root.easyeduGuideTooltipHide = hide;
  const show = button => {
    const label = button?.querySelector('.easyedu-guide-nav-item__label');
    if (!label || modal.hidden || label.scrollWidth <= label.clientWidth + 1) {
      hide();
      return;
    }
    if (target === button) {
      cancelGrace();
      return;
    }
    hide();
    target = button;
    // One tooltip at a time: park the native title while this one is shown.
    if (button.hasAttribute('title')) {
      button.dataset.easyeduGuideTitle = button.getAttribute('title');
      button.removeAttribute('title');
    }
    tooltip = modal.ownerDocument.createElement('div');
    tooltip.className = 'easyedu-guide-label-tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.textContent = label.textContent.trim();
    // WCAG 1.4.13: the pointer may move onto the tooltip, which then stays visible.
    tooltip.addEventListener('pointerenter', cancelGrace);
    tooltip.addEventListener('pointerleave', event => {
      if (!target?.contains(event.relatedTarget)) {
        scheduleHide();
      }
    });
    // Append inside the actual fullscreen element, not a global body portal.
    modal.appendChild(tooltip);
    const margin = 12;
    const gap = 10;
    const anchor = button.getBoundingClientRect();
    let size = tooltip.getBoundingClientRect();
    if (size.height > 34.5) {
      tooltip.classList.add('is-multiline');
      size = tooltip.getBoundingClientRect();
    }
    const viewport = modal.ownerDocument.defaultView;
    const left = Math.max(margin, Math.min(anchor.left + (anchor.width - size.width) / 2,
      viewport.innerWidth - size.width - margin));
    const above = anchor.bottom + gap + size.height > viewport.innerHeight - margin;
    const top = Math.max(margin, Math.min(above ? anchor.top - size.height - gap : anchor.bottom + gap,
      viewport.innerHeight - size.height - margin));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.setProperty('--easyedu-tooltip-anchor',
      `${Math.max(12, Math.min(anchor.left + anchor.width / 2 - left, size.width - 12))}px`);
    tooltip.classList.toggle('is-above', above);
  };
  const scheduleHide = () => {
    cancelGrace();
    graceTimer = window.setTimeout(hide, 220);
  };
  const buttonFor = element => element?.closest?.(SELECTORS.navItem);
  addTrackedListener(root, nav, 'pointerover', event => {
    if (event.pointerType !== 'mouse') return;
    const button = buttonFor(event.target);
    if (button && !button.contains(event.relatedTarget)) show(button);
  });
  addTrackedListener(root, nav, 'pointerout', event => {
    const button = buttonFor(event.target);
    if (button === target && !button?.contains(event.relatedTarget)) {
      if (tooltip?.contains(event.relatedTarget)) {
        return;
      }
      scheduleHide();
    }
  });
  addTrackedListener(root, nav, 'focusin', event => {
    const button = buttonFor(event.target);
    if (button?.matches(':focus-visible')) show(button);
  });
  addTrackedListener(root, nav, 'focusout', hide);
  addTrackedListener(root, root, 'pointerdown', hide, true);
  addTrackedListener(root, root, 'click', hide, true);
  addTrackedListener(root, root, 'keydown', event => {
    if (event.key !== 'Escape') {
      return;
    }
    // WCAG 1.4.13: dismissing the label tooltip must not also close the Guide.
    const wasOpen = tooltip !== null;
    hide();
    if (wasOpen) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
  addTrackedListener(root, modal.ownerDocument, 'scroll', event => {
    const focused = buttonFor(modal.ownerDocument.activeElement);
    // Native keyboard focus can scroll the horizontal navigation after focusin.
    // Re-anchor its label on the next paint instead of losing keyboard help.
    // Other scrolling still dismisses it, and every teardown cancels this frame.
    if (event.target === nav && focused?.matches(':focus-visible')) {
      hide();
      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = null;
        show(focused);
      });
    } else {
      hide();
    }
  }, true);
  addTrackedListener(root, modal.ownerDocument, 'fullscreenchange', hide);
  addTrackedListener(root, window, 'resize', hide);
};

const bindGuide = (root, config) => {
  root.easyeduGuideConfig = config;
  if (root.dataset.easyeduGuideBound === '1') {
    return;
  }
  root.dataset.easyeduGuideBound = '1';
  bindNavigationTooltips(root);
  const responsiveSteps = window.matchMedia ? window.matchMedia(GUIDE_NARROW_QUERY) : null;
  if (responsiveSteps && responsiveSteps.addEventListener) {
    addTrackedListener(root, responsiveSteps, 'change', () => refreshResponsiveChecklist(root));
  }

  const fullscreenButton = root.querySelector('[data-easyedu-guide-fullscreen]');
  const fullscreenModal = root.querySelector(SELECTORS.modal);
  root.querySelectorAll('[data-easyedu-guide-fullscreen-help]').forEach(help => { help.hidden = true; });
  if (config.fullscreen && fullscreenButton && fullscreenModal) {
    root.easyeduGuideFullscreen = createFullscreenController(fullscreenModal, state => {
      fullscreenButton.hidden = !state.available;
      root.querySelectorAll('[data-easyedu-guide-fullscreen-help]').forEach(help => {
        help.hidden = !state.available;
      });
      fullscreenButton.disabled = state.pending;
      fullscreenButton.setAttribute('aria-pressed', state.active ? 'true' : 'false');
      fullscreenButton.setAttribute('aria-label', state.active ?
        fullscreenButton.dataset.exitLabel : fullscreenButton.dataset.enterLabel);
      fullscreenButton.title = fullscreenButton.getAttribute('aria-label');
      const glyph = fullscreenButton.querySelector('[data-easyedu-guide-fullscreen-glyph]');
      if (glyph) {
        glyph.setAttribute('d', state.active ? glyph.dataset.exitPath : glyph.dataset.enterPath);
      } else {
        const icon = fullscreenButton.querySelector('.fa');
        icon?.classList.toggle('fa-expand', !state.active);
        icon?.classList.toggle('fa-compress', state.active);
      }
      updateNavScrollButtons(root);
    });
    addTrackedListener(root, fullscreenButton, 'click', async event => {
      event.preventDefault();
      const controller = root.easyeduGuideFullscreen;
      const entered = await controller.toggle();
      const status = root.querySelector('[data-easyedu-guide-fullscreen-status]');
      if (status) status.textContent = !entered && !controller.ownsFullscreen() ?
        (fullscreenButton.dataset.unavailableLabel || '') : '';
    });
    // Native requestFullscreen can leave focus on the host document rather
    // than inside the Guide root. Keep Escape available for our owned session
    // only; a nested popup that consumed it still has first priority.
    const exitOwnedFullscreenOnEscape = event => {
      if (event.key === 'Escape' && !event.defaultPrevented &&
          root.easyeduGuideFullscreen?.ownsFullscreen()) {
        event.preventDefault();
        event.stopPropagation();
        void root.easyeduGuideFullscreen.exit();
      }
    };
    // Run before an enclosing Navigation panel can treat the Guide's Escape as
    // its own. Descendant popup handlers run first through ordinary bubbling.
    addTrackedListener(root, fullscreenModal, 'keydown', exitOwnedFullscreenOnEscape);
    addTrackedListener(root, fullscreenModal.ownerDocument, 'keydown', exitOwnedFullscreenOnEscape);
  }

  addTrackedListener(root, root, 'keydown', event => {
    if (event.key !== 'Enter' || event.isComposing ||
        !event.target.matches('[data-guide-pattern]')) { return; }
    event.preventDefault();
    renderDiscoveryNames(root, event.target.closest('[data-easyedu-guide-scene]'), 'preview');
  });

  addTrackedListener(root, root, 'click', event => {
    const welcomeDismiss = event.target.closest('[data-easyedu-guide-welcome-dismiss]');
    if (welcomeDismiss && root.contains(welcomeDismiss)) {
      event.preventDefault();
      root.easyeduGuideWelcomeDismissed = true;
      hideWelcome(root);
      return;
    }
    const playback = event.target.closest('[data-guide-playback]');
    if (playback && root.contains(playback)) {
      event.preventDefault();
      if (playback.disabled || event.detail > 1) { return; }
      const active = root.easyeduGuideScenePlayback;
      if (active && playback.closest('[data-easyedu-guide-slide]')?.contains(active.scene)) {
        if (playback.dataset.guidePlayback === 'pause') { active.toggle(); } else { active.next(); }
      }
      return;
    }
    const recapToggle = event.target.closest('[data-guide-recap-toggle]');
    if (recapToggle && root.contains(recapToggle)) {
      event.preventDefault();
      toggleRecapDisclosure(recapToggle.closest('[data-guide-recap]'));
      return;
    }

    const loupeStart = event.target.closest('[data-guide-loupe-start]');
    if (loupeStart && root.contains(loupeStart)) {
      event.preventDefault();
      if (!loupeStart.disabled) {
        runLoupeDemo(root, loupeStart.closest('[data-guide-loupe]'));
      }
      return;
    }
    const sceneCommand = event.target.closest('[data-guide-scene-command]');
    if (sceneCommand && root.contains(sceneCommand)) {
      // A radio keeps its native selection and keyboard behaviour: never cancel its click.
      if (sceneCommand.type !== 'radio') { event.preventDefault(); }
      if (sceneCommand.disabled) { return; }
      const scene = sceneCommand.closest('[data-easyedu-guide-scene]');
      if (scene.querySelector('[data-guide-scene-command="start"]') && event.detail > 1) { return; }
      const command = sceneCommand.getAttribute('data-guide-scene-command');
      if (['preview', 'letters', 'clear'].includes(command)) {
        renderDiscoveryNames(root, scene, command);
      } else {
        const manual = !!scene.querySelector('[data-guide-scene-command="start"]');
        const mode = ['replay', 'start'].includes(command) ? undefined : command;
        // Manual mode choices restore a ready illustration; only Start runs it.
        // Legacy templates keep their existing explicit command behavior.
        playDiscoveryScene(root, scene, mode, !manual || !['add', 'move'].includes(command));
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
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) + 1, activeConfig, {persistReading: true});
      return;
    }

    const previous = event.target.closest(SELECTORS.previous);
    if (previous && root.contains(previous)) {
      event.preventDefault();
      setActiveSlide(root, Number(root.getAttribute('data-easyedu-guide-current-slide') || 0) - 1, activeConfig, {persistReading: true});
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
        checklist.classList.remove('is-avoiding');
        if (isCompactChecklistViewport()) {
          checklist.toggleAttribute('data-easyedu-guide-checklist-expanded', !minimized);
        }
        syncChecklistMinimizeControl(root);
        // C2-15-01: the new size may now cover the current step's control.
        if (isVisibleElement(root.easyeduGuideCurrentTarget)) {
          releaseChecklistTopDock(root);
          dockChecklistAwayFromTarget(root, root.easyeduGuideCurrentTarget);
        }
        const nextControl = root.querySelector(minimized ? '[data-easyedu-guide-checklist-restore]' :
          '[data-easyedu-guide-checklist-minimize]');
        if (isVisibleElement(nextControl)) { nextControl.focus({preventScroll: true}); }
      }
      return;
    }

    const navItem = event.target.closest(SELECTORS.navItem);
    if (navItem && root.contains(navItem)) {
      event.preventDefault();
      syncSlideLocks(root, activeConfig);
      setActiveSlide(root, Number(navItem.getAttribute('data-easyedu-guide-nav-item') || 0), activeConfig, {
        allowLocked: navItem.classList.contains('is-locked'), persistReading: true
      });
      return;
    }

    // E1 (K2): a recap tile reopens an earlier slide through its own navigation item.
    // It never starts a path or touches the course; locked slides stay locked.
    const gotoLink = event.target.closest(SELECTORS.gotoSlide);
    if (gotoLink && root.contains(gotoLink)) {
      event.preventDefault();
      syncSlideLocks(root, activeConfig);
      const target = Number(gotoLink.getAttribute('data-easyedu-guide-goto'));
      const item = Number.isInteger(target) ?
        root.querySelector(`${SELECTORS.navItem}[data-easyedu-guide-nav-item="${target}"]`) : null;
      if (item) {
        setActiveSlide(root, target, activeConfig, {allowLocked: false, persistReading: true});
      }
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
      captureChecklistFocus(root, startPath);
      dismissResume(root);
      const requestedPath = startPath.getAttribute('data-easyedu-guide-start-path');
      // New context sessions invalidate obsolete native callbacks, including
      // leaving another path and then starting this same path again.
      if (Object.prototype.hasOwnProperty.call(activeConfig.pathContextFields || {}, requestedPath)) {
        root.easyeduGuidePathEpoch = (root.easyeduGuidePathEpoch || 0) + 1;
      }
      if (isPathComplete(activeConfig, requestedPath)) { resetPathProgress(activeConfig, requestedPath); }
      syncSlideLocks(root, activeConfig);
      renderChecklist(root, activeConfig, requestedPath);
      syncPathInvitation(root, activeConfig);
      closeModal(root, false, false).then(() => {
        if (!root.querySelector(SELECTORS.modal).hidden) { return; }
        focusChecklist(root);
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
    captureChecklistFocus(root, resume);
    dismissResume(root);
    if (!isPathComplete(activeConfig, path)) {
      renderChecklist(root, activeConfig, path);
      focusChecklist(root);
      const activeItem = root.querySelector(`${SELECTORS.checklist} [data-easyedu-guide-step-index].is-active`);
      const activeIndex = Number(activeItem?.getAttribute('data-easyedu-guide-step-index') || 0);
      highlightChecklistStep(root, activeConfig, activeConfig.paths[path]?.[activeIndex]);
    }
  }); }
  const cancelPath = root.querySelector('[data-easyedu-guide-cancel-path]');
  if (cancelPath) { addTrackedListener(root, cancelPath, 'click', () => {
    const activeConfig = root.easyeduGuideConfig || config;
    stopPath(root, activeConfig, loadGuideState(activeConfig).path);
  }); }

  addTrackedListener(root, root, 'keydown', event => {
    const activeConfig = root.easyeduGuideConfig || config;
    if (!isModalOpen(root)) {
      const checklist = root.querySelector(SELECTORS.checklist);
      if (event.key === 'Escape' && !event.defaultPrevented && checklist && !checklist.hidden &&
          !checklist.classList.contains('is-minimized') && checklist.contains(event.target)) {
        event.preventDefault();
        root.querySelector('[data-easyedu-guide-checklist-minimize]')?.click();
      }
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
        if (root.easyeduGuideFullscreen?.ownsFullscreen()) {
          void root.easyeduGuideFullscreen.exit();
          return;
        }
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
      setActiveSlide(root, activeIndex + rtlMultiplier, activeConfig, {persistReading: true});
      return;
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      setActiveSlide(root, activeIndex - rtlMultiplier, activeConfig, {persistReading: true});
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveSlide(root, 0, activeConfig, {persistReading: true});
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      setActiveSlide(root, slideCount - 1, activeConfig, {persistReading: true});
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

  // The header cross and the end box "Close" button share one command.
  root.querySelectorAll(SELECTORS.checklistClose).forEach(closeChecklist => {
    addTrackedListener(root, closeChecklist, 'click', () => {
      hideChecklist(root, config, false, true);
    });
  });

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

  root.easyeduGuideTooltipHide?.();
  delete root.easyeduGuideTooltipHide;

  void root.easyeduGuideFullscreen?.destroy();
  root.easyeduGuideFullscreen = null;

  dismissResume(root);

  hideWelcome(root);
  delete root.easyeduGuideWelcomeDismissed;
  restoreInterfaceCue(root);
  stopSlideTransition(root);
  root.easyeduGuideExitStop?.();
  stopDiscoveryScene(root);
  unlockPageScroll(root);
  clearTrackedListeners(root);
  clearTrackedTimeouts(root);
  delete root.easyeduGuideNoticeClocks;
  delete root.easyeduGuideNavResizeTimer;
  clearHighlightAutoHideTimer(root);
  hideInterfaceReturn(root, false);
  clearHighlightedTarget(root);
  releaseChecklistTopDock(root);
  const checklist = root.querySelector(SELECTORS.checklist);
  if (checklist) {
    checklist.hidden = true;
    checklist.classList.remove('is-complete', 'is-minimized', 'is-docked-left', 'is-docked-right', 'is-unlock-path',
      'is-avoiding');
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
  root.easyeduGuideChecklistReturnFocus = null;
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
  // A completed path never reopens a checklist on reload. Unfinished progress
  // is offered, not imposed: only an explicit Resume renders the checklist.
  if (state.path && config.paths[state.path] && !isPathComplete(config, state.path)) {
    offerResume(root, config, state.path);
  }
  syncPathInvitation(root, config);
  if (!state.path || !config.paths[state.path] || isPathComplete(config, state.path)) {
    offerWelcome(root, config);
  }
  addTrackedListener(root, window, 'resize', () => {
    if (window.innerWidth < 1024) { hideWelcome(root); }
  });

  const storage = getStorage();
  const seen = storage && storage.getItem(config.storageKey) === '1';
  if (config.firstVisit && !seen) {
    openModal(root, config);
  }
};

return {
  destroy: destroy,
  getPathContext: getPathContext,
  getPathContextToken: getPathContextToken,
  setPathContext: setPathContext,
  init: init,
  guideModality: guideModality
};
});
