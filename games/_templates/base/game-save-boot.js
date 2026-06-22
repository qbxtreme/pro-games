/**
 * Load pro-save before game scripts and defer game boot until cloud/local restore finishes.
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!window.BecomeAProSave && script && typeof document.write === "function") {
    var proSaveSrc = script.getAttribute("data-pro-save");
    if (!proSaveSrc) {
      try {
        proSaveSrc = new URL("../../pro-save.js", script.src).pathname;
      } catch (_) {
        proSaveSrc = "/pro-save.js";
      }
    }
    document.write('<script src="' + proSaveSrc + '"><\/script>');
  }

  window.__bapDeferInit = function (fn) {
    if (typeof fn !== "function") return;
    if (window.BecomeAProSave && BecomeAProSave.whenReady) {
      BecomeAProSave.whenReady.then(fn);
      return;
    }
    fn();
  };

  window.__bapWatchSave = function (storageKey, reloadFn) {
    if (!storageKey || typeof reloadFn !== "function") return;
    function run() {
      try { reloadFn(); } catch (_) {}
    }
    if (!window.BecomeAProSave) return;
    BecomeAProSave.registerGameReload(storageKey, run);
    BecomeAProSave.onRestore(run);
    BecomeAProSave.whenReady.then(function (restored) {
      if (restored) run();
    });
  };
})();
