(function () {
  "use strict";

  window.AllOutControls = {
    JOY_CAP: 56,
    SPEED_MULT: 1.18,

    bindJoystick(joy, keys) {
      const base = document.getElementById("joystick-base");
      const knob = document.getElementById("joystick-knob");
      if (!base || !knob || base.dataset.aoBound) return;
      base.dataset.aoBound = "1";

      let pid = null;
      let cx = 0;
      let cy = 0;
      const cap = this.JOY_CAP;

      const setJoy = (x, y) => {
        let dx = x - cx;
        let dy = y - cy;
        const m = Math.hypot(dx, dy);
        if (m > cap) {
          dx = (dx / m) * cap;
          dy = (dy / m) * cap;
        }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joy.dx = dx / cap;
        joy.dy = dy / cap;
        if (joy.active !== undefined) joy.active = true;
      };

      const endJoy = () => {
        pid = null;
        knob.style.transform = "translate(-50%, -50%)";
        joy.dx = 0;
        joy.dy = 0;
        if (joy.active !== undefined) joy.active = false;
      };

      base.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        pid = e.pointerId;
        base.setPointerCapture(pid);
        const r = base.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
        setJoy(e.clientX, e.clientY);
      }, { passive: false });
      base.addEventListener("pointermove", (e) => {
        if (e.pointerId === pid) {
          e.preventDefault();
          setJoy(e.clientX, e.clientY);
        }
      }, { passive: false });
      base.addEventListener("pointerup", (e) => {
        if (e.pointerId === pid) endJoy();
      });
      base.addEventListener("pointercancel", (e) => {
        if (e.pointerId === pid) endJoy();
      });

      if (keys) this.bindKeyboard(keys);
    },

    bindMoveStick(joy, baseId, knobId) {
      const base = document.getElementById(baseId || "move-base");
      const knob = document.getElementById(knobId || "move-knob");
      if (!base || !knob || base.dataset.aoBound) return;
      base.dataset.aoBound = "1";

      let pid = null;
      let cx = 0;
      let cy = 0;
      const cap = this.JOY_CAP;

      const setJoy = (x, y) => {
        let dx = x - cx;
        let dy = y - cy;
        const m = Math.hypot(dx, dy);
        if (m > cap) {
          dx = (dx / m) * cap;
          dy = (dy / m) * cap;
        }
        knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        joy.dx = dx / cap;
        joy.dy = dy / cap;
      };

      const endJoy = () => {
        pid = null;
        knob.style.transform = "translate(-50%, -50%)";
        joy.dx = 0;
        joy.dy = 0;
      };

      base.addEventListener("pointerdown", (e) => {
        pid = e.pointerId;
        base.setPointerCapture(pid);
        const r = base.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
        setJoy(e.clientX, e.clientY);
      });
      base.addEventListener("pointermove", (e) => {
        if (e.pointerId === pid) setJoy(e.clientX, e.clientY);
      });
      base.addEventListener("pointerup", (e) => {
        if (e.pointerId === pid) endJoy();
      });
    },

    bindKeyboard(keys) {
      if (window.__aoKeysBound) return;
      window.__aoKeysBound = true;
      window.addEventListener("keydown", (e) => {
        keys[e.key] = true;
      });
      window.addEventListener("keyup", (e) => {
        keys[e.key] = false;
      });
    },

    moveSpeed(baseSpeed, dt, mx, my, keys) {
      let x = mx;
      let y = my;
      if (keys) {
        if (keys.ArrowLeft || keys.a || keys.A) x -= 1;
        if (keys.ArrowRight || keys.d || keys.D) x += 1;
        if (keys.ArrowUp || keys.w || keys.W) y -= 1;
        if (keys.ArrowDown || keys.s || keys.S) y += 1;
      }
      const len = Math.hypot(x, y);
      if (len < 0.12) return null;
      const spd = baseSpeed * this.SPEED_MULT * dt;
      return { vx: (x / len) * spd, vy: (y / len) * spd, facing: x >= 0 ? 1 : -1 };
    },
  };

  /** Standard centered follow camera — movement matches screen direction (no shoulder swing). */
  window.AllOutCamera = {
    VIEW_X: 0.5,
    VIEW_Y: 0.5,
    LEAD: 0,
    LERP: 8,

    viewOffsetX(w) {
      return w * this.VIEW_X;
    },

    viewOffsetY(h) {
      return h * this.VIEW_Y;
    },

    worldToScreen(wx, wy, cam, w, h) {
      return {
        x: wx - cam.x + this.viewOffsetX(w),
        y: wy - cam.y + this.viewOffsetY(h),
      };
    },

    screenToWorld(sx, sy, cam, w, h) {
      return {
        x: sx + cam.x - this.viewOffsetX(w),
        y: sy + cam.y - this.viewOffsetY(h),
      };
    },

    camOrigin(cam, w, h) {
      return { x: cam.x - this.viewOffsetX(w), y: cam.y - this.viewOffsetY(h) };
    },

    applyWorldTransform(ctx, cam, w, h) {
      ctx.translate(this.viewOffsetX(w) - cam.x, this.viewOffsetY(h) - cam.y);
    },

    follow(cam, px, py, dt, mx, my, lerp) {
      const t = Math.min(1, (dt || 0.016) * (lerp || this.LERP));
      cam.x += (px - cam.x) * t;
      cam.y += (py - cam.y) * t;
    },

    /** For games that store cam as top-left world corner (shooter, battlegrounds). */
    followTopLeft(cam, px, py, w, h, dt, mx, my, lerp) {
      const tx = px - this.viewOffsetX(w);
      const ty = py - this.viewOffsetY(h);
      const t = Math.min(1, (dt || 0.016) * (lerp || this.LERP));
      cam.x += (tx - cam.x) * t;
      cam.y += (ty - cam.y) * t;
    },

    /** Fixed-angle 3D camera for Game3DCore (does not swing behind the player). */
    standard3D(overrides) {
      return {
        style: "fixed",
        height: 11,
        distance: 10,
        fov: 42,
        fogFar: 150,
        lookAtY: 0.55,
        lerp: 0.1,
        ...overrides,
      };
    },
  };
})();
