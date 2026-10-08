// Opt-in native fullscreen lifecycle. The caller owns translated controls,
// shared paint and modal focus. Never request fullscreen without a user action.
export const createFullscreenController = (element, onChange = () => {}) => {
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
