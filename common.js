/* Cadence shared runtime. Load order is defined in each HTML page:
   lib/data.js → lib/charts.js → lib/pro-catalog.js → lib/audio.js →
   lib/theme.js → lib/billing.js → lib/suggestions.js → lib/reminders.js → common.js
*/
(function (global) {
  "use strict";
  const FL = global.FL = global.FL || {};

  function prefersReducedMotion() {
    return !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function runAnimationLoop(tick) {
    let frame = null;
    const loop = (t) => {
      if (global.document && global.document.hidden) {
        frame = null;
        return;
      }
      if (prefersReducedMotion()) {
        frame = null;
        return;
      }
      tick(t);
      frame = global.requestAnimationFrame(loop);
    };
    if (global.document) {
      global.document.addEventListener("visibilitychange", () => {
        if (!global.document.hidden && frame === null && !prefersReducedMotion()) {
          frame = global.requestAnimationFrame(loop);
        }
      });
    }
    if (!prefersReducedMotion()) frame = global.requestAnimationFrame(loop);
    return () => {
      if (frame) global.cancelAnimationFrame(frame);
      frame = null;
    };
  }

  Object.assign(FL, { prefersReducedMotion, runAnimationLoop });
})(typeof window !== "undefined" ? window : globalThis);
