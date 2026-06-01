(function () {
  "use strict";

  function fsElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement ||
      null
    );
  }

  function request(el) {
    const node = el || document.documentElement;
    const fn =
      node.requestFullscreen ||
      node.webkitRequestFullscreen ||
      node.webkitEnterFullscreen ||
      node.msRequestFullscreen;
    if (!fn) return Promise.reject(new Error("Fullscreen not supported"));
    return Promise.resolve(fn.call(node));
  }

  function exit() {
    const fn =
      document.exitFullscreen ||
      document.webkitExitFullscreen ||
      document.msExitFullscreen;
    if (!fn) return Promise.reject(new Error("Fullscreen not supported"));
    return Promise.resolve(fn.call(document));
  }

  function toggle(el) {
    return fsElement() ? exit() : request(el);
  }

  function injectStyles() {
    if (document.getElementById("allout-fs-styles")) return;
    const style = document.createElement("style");
    style.id = "allout-fs-styles";
    style.textContent = `
      #fs-play-overlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        padding: 24px;
        background: radial-gradient(circle at 50% 35%, #283593 0%, #0d1117 72%);
        color: #fff;
        text-align: center;
        font-family: "Segoe UI", system-ui, sans-serif;
      }
      #fs-play-overlay p {
        max-width: 340px;
        line-height: 1.45;
        opacity: 0.9;
        font-size: 0.95rem;
      }
      #fs-play-btn {
        border: 3px solid rgba(255,255,255,0.28);
        border-radius: 18px;
        padding: 16px 28px;
        font-size: 1.15rem;
        font-weight: 800;
        color: #fff;
        cursor: pointer;
        background: linear-gradient(180deg, #ef5350, #c62828);
        box-shadow: 0 10px 28px rgba(0,0,0,0.35);
      }
      #fs-play-skip {
        margin-top: 4px;
        background: transparent;
        border: none;
        color: #90caf9;
        font-size: 0.85rem;
        cursor: pointer;
        text-decoration: underline;
      }
      #fs-float-btn {
        position: fixed;
        right: 12px;
        bottom: 12px;
        z-index: 99990;
        width: 48px;
        height: 48px;
        border-radius: 14px;
        border: 2px solid rgba(255,255,255,0.25);
        background: rgba(26, 31, 46, 0.92);
        color: #fff;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,0.35);
      }
      #fs-float-btn.hidden { display: none; }
      :fullscreen #player-shell,
      :-webkit-full-screen #player-shell {
        width: 100%;
        height: 100%;
      }
    `;
    document.head.appendChild(style);
  }

  function showPlayOverlay(options) {
    injectStyles();
    if (document.getElementById("fs-play-overlay")) return;

    const opts = options || {};
    const overlay = document.createElement("div");
    overlay.id = "fs-play-overlay";
    overlay.innerHTML = `
      <div class="official-badge" style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:0.72rem;font-weight:800;letter-spacing:0.04em;text-transform:uppercase;background:rgba(129,212,250,0.18);border:1px solid rgba(129,212,250,0.45);color:#b3e5fc;">Pro Games</div>
      <button type="button" id="fs-play-btn">⛶ Play Fullscreen</button>
      <p>Tap to go fullscreen for the best All Out experience.</p>
      <button type="button" id="fs-play-skip">Play without fullscreen</button>
    `;
    document.body.appendChild(overlay);

    const start = (useFs) => {
      const done = () => {
        overlay.remove();
        if (typeof opts.onStart === "function") opts.onStart(useFs);
        mountFloatButton(opts.target);
      };
      if (useFs) {
        request(opts.target || document.documentElement).then(done).catch(done);
      } else {
        done();
      }
    };

    overlay.querySelector("#fs-play-btn").addEventListener("click", () => start(true));
    overlay.querySelector("#fs-play-skip").addEventListener("click", () => start(false));
  }

  function mountFloatButton(target) {
    if (document.getElementById("fs-float-btn")) return;
    injectStyles();
    const btn = document.createElement("button");
    btn.id = "fs-float-btn";
    btn.type = "button";
    btn.title = "Toggle fullscreen";
    btn.textContent = "⛶";
    btn.addEventListener("click", () => {
      toggle(target || document.documentElement).catch(() => {});
    });
    document.body.appendChild(btn);

    const sync = () => {
      btn.textContent = fsElement() ? "⛶" : "⛶";
      btn.title = fsElement() ? "Exit fullscreen (Esc)" : "Enter fullscreen";
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync);
    sync();
  }

  function autoOnGamePage(options) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => showPlayOverlay(options));
    } else {
      showPlayOverlay(options);
    }
  }

  window.AllOutFullscreen = {
    request,
    exit,
    toggle,
    active: () => !!fsElement(),
    showPlayOverlay,
    autoOnGamePage,
    mountFloatButton,
  };
})();
