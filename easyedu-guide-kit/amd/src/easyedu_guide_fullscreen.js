// Opt-in native fullscreen lifecycle. The caller owns translated controls,
// shared paint and modal focus. Never request fullscreen without a user action.
export const createFullscreenController = (element, onChange = () => {}) => {
  const document = element.ownerDocument;
  const window = document.defaultView;
  let disposed = false;
  let pending = false;
  let parked = [];
  const ownsFullscreen = () => document.fullscreenElement === element;
  // K17-41: the host page behind the Guide (thousands of participant cards) is
  // fully restyled and laid out when the viewport changes at native fullscreen
  // entry/exit, although the top layer already covers it. Skip its rendering
  // work with content-visibility while keeping each block's box size, so the
  // page and its scroll position are unchanged once the Guide closes.
  const parkHost = () => {
    if (parked.length) {
      return;
    }
    const html = document.documentElement;
    const measured = [];
    let node = element;
    while (node && node !== html && node.parentElement) {
      const parent = node.parentElement;
      for (const sibling of parent.children) {
        const skipped = sibling === node || /^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(sibling.tagName) ||
          sibling.hidden || window.getComputedStyle(sibling).display === 'none';
        if (!skipped) {
          const box = sibling.getBoundingClientRect();
          measured.push([sibling, box.width, box.height]);
        }
      }
      node = parent;
    }
    measured.forEach(([sibling, width, height]) => {
      sibling.style.setProperty('--easyedu-guide-parked-width', `${width}px`);
      sibling.style.setProperty('--easyedu-guide-parked-height', `${height}px`);
      sibling.setAttribute('data-easyedu-guide-parked', '');
    });
    parked = measured.map(item => item[0]);
    html.classList.add('easyedu-guide-is-fullscreen');
  };
  let unparkTimer = null;
  let unparkWaiters = [];
  // The viewport resize events of the exit reach the host while it is still pinned
  // (cheap); the page is released once they have settled.
  const scheduleUnpark = () => {
    if (!parked.length || unparkTimer !== null) {
      return;
    }
    unparkTimer = window.setTimeout(() => {
      unparkTimer = null;
      if (!ownsFullscreen() && !pending) {
        unparkHost();
      }
    }, 350);
  };
  const unparkHost = () => {
    if (parked.length) {
      parked.forEach(sibling => {
        sibling.removeAttribute('data-easyedu-guide-parked');
        sibling.style.removeProperty('--easyedu-guide-parked-width');
        sibling.style.removeProperty('--easyedu-guide-parked-height');
      });
      parked = [];
      document.documentElement.classList.remove('easyedu-guide-is-fullscreen');
    }
    unparkWaiters.splice(0).forEach(resolve => resolve());
  };
  // M53 (22/10/2026): the modal used to hide as soon as document.exitFullscreen() resolved,
  // while the host stayed parked (content-visibility:hidden, stale measured size) for another
  // ~350ms — a visible flash once the modal was gone but the real layout not yet released.
  // Callers that must cover the host until it is safe to see again (closeModal) await this.
  const waitForUnpark = () => new Promise(resolve => {
    if (!parked.length) { resolve(); return; }
    unparkWaiters.push(resolve);
  });
  const available = () => !disposed && window.innerWidth >= 1024 &&
    document.fullscreenEnabled === true && typeof element.requestFullscreen === 'function';
  const notify = () => {
    if (!ownsFullscreen() && !pending) {
      scheduleUnpark();
    }
    if (!disposed) onChange({active: ownsFullscreen(), available: available(), pending});
  };
  const exit = async() => {
    // A Guide must never exit another surface's fullscreen session.
    if (!ownsFullscreen()) {
      await waitForUnpark();
      return true;
    }
    try { await document.exitFullscreen(); return true; }
    catch (error) { return false; }
    finally { notify(); await waitForUnpark(); }
  };
  const toggle = async() => {
    if (pending || disposed) return false;
    if (ownsFullscreen()) return exit();
    if (!available() || !element.isConnected || element.hidden) return false;
    pending = true;
    parkHost();
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
  return {available, ownsFullscreen, isHostParked: () => parked.length > 0, toggle, exit, destroy};
};
