/* ============================================================
   LED MATRIX — a grid of LEDs run as one spring integration
   on a single ticker, pushed around by the pointer.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, REDUCED } = window.V;
  useLenis();
  const cv = qs("#matrix"), ctx = cv.getContext("2d");
  const cfg = { k: 0.06, damp: 0.86, radius: 120, force: 1, mode: "repel", gap: 22 };
  let W = 0, H = 0, dots = [], ptr = { x: -9999, y: -9999, on: false }, t = 0;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = [];
    const g = cfg.gap;
    const cols = Math.floor((W - g) / g), rows = Math.floor((H - g) / g);
    const ox = (W - (cols - 1) * g) / 2, oy = (H - (rows - 1) * g) / 2;
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) dots.push({ hx: ox + x * g, hy: oy + y * g, x: ox + x * g, y: oy + y * g, vx: 0, vy: 0 });
  };

  const step = () => {
    t += 0.016;
    ctx.clearRect(0, 0, W, H);
    const r = cfg.radius, r2 = r * r;
    const idleX = W / 2 + Math.cos(t * 0.7) * W * 0.28, idleY = H / 2 + Math.sin(t * 1.1) * H * 0.25;
    const px = ptr.on ? ptr.x : idleX, py = ptr.on ? ptr.y : idleY;
    const sign = cfg.mode === "repel" ? 1 : -1;
    for (const d of dots) {
      const dx = d.x - px, dy = d.y - py, dist2 = dx * dx + dy * dy;
      if (dist2 < r2) {
        const dist = Math.sqrt(dist2) || 1, f = (1 - dist / r) * cfg.force * (ptr.on ? 3.2 : 1.6) * sign;
        d.vx += (dx / dist) * f; d.vy += (dy / dist) * f;
      }
      d.vx += (d.hx - d.x) * cfg.k; d.vy += (d.hy - d.y) * cfg.k;
      d.vx *= cfg.damp; d.vy *= cfg.damp;
      d.x += d.vx; d.y += d.vy;
      const disp = Math.min(1, Math.hypot(d.x - d.hx, d.y - d.hy) / 18);
      const rad = 2 + disp * 4.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, rad, 0, Math.PI * 2);
      ctx.fillStyle = disp > 0.08 ? `rgba(217,188,114,${0.35 + disp * 0.65})` : "rgba(235,231,221,0.16)";
      ctx.fill();
      if (disp > 0.5) { ctx.beginPath(); ctx.arc(d.x, d.y, rad * 2.2, 0, Math.PI * 2); ctx.fillStyle = `rgba(217,188,114,${(disp - 0.5) * 0.18})`; ctx.fill(); }
    }
  };

  cv.addEventListener("pointermove", (e) => { const b = cv.getBoundingClientRect(); ptr = { x: e.clientX - b.left, y: e.clientY - b.top, on: true }; });
  cv.addEventListener("pointerleave", () => (ptr.on = false));
  cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); cfg.force = 2.2; });
  cv.addEventListener("pointerup", () => (cfg.force = +qs("#force").value));

  const bind = (id, key, fmt) => {
    const el = qs("#" + id), out = qs(`output[for="${id}"]`);
    const set = () => { cfg[key] = +el.value; out.textContent = fmt(+el.value); if (key === "gap") resize(); };
    el.addEventListener("input", set); set();
  };
  bind("k", "k", (v) => v.toFixed(3));
  bind("damp", "damp", (v) => v.toFixed(2));
  bind("radius", "radius", (v) => v + " px");
  bind("force", "force", (v) => v.toFixed(1));
  bind("gap", "gap", (v) => v + " px");
  qsa("[data-mode]").forEach((b) => b.addEventListener("click", () => { cfg.mode = b.dataset.mode; qsa("[data-mode]").forEach((x) => x.classList.toggle("is-on", x === b)); }));

  addEventListener("resize", resize);
  resize();
  if (REDUCED) step(); else gsap.ticker.add(step);
});
