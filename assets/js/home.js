/* ============================================================
   HOME — two linked wheels of selected work.
   Big plates orbit a circle centred off the left edge, icon
   tiles orbit a mirrored circle off the right edge, and the
   title rolls in the middle. One progress value drives all.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, make, S, navigate, REDUCED } = window.V;
  const A = window.ART;
  const items = S.work.filter((w) => !w.hidden);
  const N = items.length;
  const root = qs(".home");
  const wl = qs(".wheel--l", root), wr = qs(".wheel--r", root), txt = qs(".wtext", root);
  const mod = (n, m) => ((n % m) + m) % m;
  const pad = (n) => String(n).padStart(2, "0");

  const POOL = 8;
  const makePlate = () => make(`<div class="plate"></div>`);
  const makeTile = () => make(`<div class="tile"></div>`);
  const makeText = () => make(`<div class="wtext__item" aria-hidden="true"></div>`);
  const plates = Array.from({ length: POOL }, () => wl.appendChild(makePlate()));
  const tiles = Array.from({ length: POOL }, () => wr.appendChild(makeTile()));
  const texts = Array.from({ length: 3 }, () => txt.appendChild(makeText()));
  const cache = new Map();

  const fillPlate = (el, it) => {
    el.innerHTML = it.img
      ? `<img src="${it.img}" alt="${it.title}" draggable="false" decoding="async">`
      : A.plates[it.plate] ? A.plates[it.plate]() : "";
  };
  const fillTile = (el, it) => { el.innerHTML = A.icons[it.icon] || A.icons.chip; };
  const fillText = (el, it, i) => {
    const ext = /^https?:/.test(it.href);
    el.innerHTML = `
      <span class="wtext__n">N°${pad(i + 1)} / ${pad(N)}</span>
      <span class="wtext__t">${it.title}</span>
      <span class="wtext__chips"><span class="tag">${it.by}</span><span class="tag">${it.year}</span></span>
      <a class="btn wtext__cta" href="${it.href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>View project</a>`;
  };
  const assign = (el, v, fill) => {
    if (cache.get(el) === v) return;
    cache.set(el, v);
    const i = mod(v, N);
    fill(el, items[i], i);
  };

  /* ---------- sr-only list ---------- */
  qs(".home__list").innerHTML = items.map((it) => `<li><a href="${it.href}">${it.title}, ${it.by}, ${it.year}. ${it.summary}</a></li>`).join("");

  /* ---------- geometry ---------- */
  let G = {};
  const measure = () => {
    const W = innerWidth, H = innerHeight;
    const mobile = W < 760;
    if (mobile) {
      // Plate and caption as one block, centred between the header and the hint.
      const pw = Math.min(W * 0.82, 420), ph = pw / 1.62;
      const top = 96, bottom = H - 76, textH = 160, gap = Math.max(16, Math.min(32, H * 0.035));
      const blockTop = top + Math.max(0, (bottom - top - (ph + gap + textH)) / 2);
      const pcy = blockTop + ph / 2;
      G = { mobile, W, H, pw, ph, R: W * 1.25, cx: W / 2, cy: pcy + W * 1.25, a: 0.62 };
      root.style.setProperty("--wt-top", blockTop + ph + gap + "px");
    } else {
      const pw = Math.max(200, Math.min(W * 0.3, 520, H * 0.62)); // H cap keeps phones in landscape clear of the caption
      const ph = pw / 1.62;
      const fx = W * 0.23, fy = H * 0.53;
      const t = (0.15 * W) / (0.36 * H);
      const a = 2 * Math.atan(t);
      const R = (0.36 * H) / Math.sin(a);
      const tw = Math.max(96, Math.min(W * 0.115, 170));
      const fx2 = W * 0.69;
      const t2 = (0.24 * W) / (0.34 * H);
      const a2 = 2 * Math.atan(t2);
      const R2 = (0.34 * H) / Math.sin(a2);
      G = { mobile, W, H, pw, ph, R, a, cx: fx - R, cy: fy, tw, R2, a2, cx2: fx2 + R2 };
    }
    root.style.setProperty("--pw", G.pw + "px");
    root.style.setProperty("--tw", (G.tw || 0) + "px");
    wr.style.display = G.mobile ? "none" : "";
  };
  measure();
  addEventListener("resize", measure);

  /* ---------- state + render ---------- */
  const st = { p: 0, target: 0, vel: 0 };
  let lastCur = -1;

  const render = () => {
    const base = Math.floor(st.p) - 3;
    const skew = Math.max(-8, Math.min(8, st.vel * 90));
    for (let j = 0; j < POOL; j++) {
      const v = base + j, d = v - st.p;
      const pl = plates[j];
      assign(pl, v, fillPlate);
      const ad = Math.abs(d);
      const sc = 1 - Math.min(ad, 2) * 0.12;
      if (G.mobile) {
        const th = -Math.PI / 2 + d * G.a * 0.5;
        const x = G.cx + G.R * Math.cos(th), y = G.cy + G.R * Math.sin(th);
        pl.style.transform = `translate3d(${x - G.pw / 2}px, ${y - G.ph / 2}px, 0) rotate(${d * G.a * 0.5 * 57.3 * 0.7}deg) scale(${sc})`;
      } else {
        const th = d * G.a;
        const x = G.cx + G.R * Math.cos(th), y = G.cy - G.R * Math.sin(th);
        pl.style.transform = `translate3d(${x - G.pw / 2}px, ${y - G.ph / 2}px, 0) rotate(${-th * 57.3 * 0.62}deg) skewY(${skew}deg) scale(${sc})`;
        const tl = tiles[j];
        assign(tl, v, fillTile);
        const th2 = d * G.a2;
        const x2 = G.cx2 - G.R2 * Math.cos(th2), y2 = G.cy - G.R2 * Math.sin(th2);
        tl.style.transform = `translate3d(${x2 - G.tw / 2}px, ${y2 - G.tw / 2}px, 0) rotate(${th2 * 57.3 * 0.55}deg) scale(${sc})`;
        tl.style.zIndex = 10 - Math.round(ad * 2);
        tl.style.opacity = ad > 2.6 ? 0 : 1;
      }
      pl.style.zIndex = 10 - Math.round(ad * 2);
      pl.style.opacity = ad > 2.6 ? 0 : 1;
      pl.dataset.v = v;
    }
    const tb = Math.floor(st.p);
    for (let k = 0; k < 3; k++) {
      const v = tb - 1 + k, d = v - st.p;
      const el = texts[k];
      assign(el, v, fillText);
      el.style.transform = `translate3d(0, ${-d * 120}px, 0)`;
      el.style.opacity = Math.max(0, 1 - Math.abs(d) * 1.6);
      el.style.pointerEvents = Math.abs(d) < 0.3 ? "auto" : "none";
    }
    const cur = mod(Math.round(st.p), N);
    if (cur !== lastCur) { if (lastCur !== -1) window.V.sfx("tick"); lastCur = cur; root.setAttribute("aria-label", `Selected work, ${items[cur].title}, ${cur + 1} of ${N}`); }
  };

  gsap.ticker.add(() => {
    const prev = st.p;
    st.p += (st.target - st.p) * (REDUCED ? 1 : 0.11);
    if (Math.abs(st.target - st.p) < 0.0005) st.p = st.target;
    st.vel = st.p - prev;
    render();
  });

  /* ---------- input ---------- */
  let snapT;
  const snap = (delay = 160) => { clearTimeout(snapT); snapT = setTimeout(() => (st.target = Math.round(st.target)), delay); };
  root.addEventListener("wheel", (e) => {
    e.preventDefault();
    const dv = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    st.target += Math.max(-0.6, Math.min(0.6, dv * 0.0028));
    snap();
  }, { passive: false });

  let drag = null;
  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("a, button")) return;
    drag = { x: e.clientX, y: e.clientY, t0: st.target, moved: 0, lastY: e.clientY, lastX: e.clientX, lastT: performance.now(), v: 0, target: e.target };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved < 4) return;
    root.classList.add("is-drag");
    const amt = G.mobile ? -dx / (G.W * 0.55) : (dy - dx * 0.4) / (G.H * 0.42);
    st.target = drag.t0 + amt;
    const now = performance.now(), dt = Math.max(1, now - drag.lastT);
    const step = G.mobile ? -(e.clientX - drag.lastX) / (G.W * 0.55) : (e.clientY - drag.lastY - (e.clientX - drag.lastX) * 0.4) / (G.H * 0.42);
    drag.v = (step / dt) * 16;
    drag.lastX = e.clientX; drag.lastY = e.clientY; drag.lastT = now;
  });
  const end = (e) => {
    if (!drag) return;
    root.classList.remove("is-drag");
    if (drag.moved < 6) {
      const pl = drag.target.closest && drag.target.closest(".plate, .tile");
      if (pl) {
        const idx = plates.indexOf(pl) >= 0 ? plates.indexOf(pl) : tiles.indexOf(pl);
        const v = Math.floor(st.p) - 3 + idx;
        if (v === Math.round(st.p)) open(mod(v, N));
        else st.target = v;
      }
    } else {
      st.target = Math.round(st.target + Math.max(-3, Math.min(3, drag.v * 6)));
    }
    drag = null;
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);

  const open = (i) => {
    const it = items[i];
    if (/^https?:/.test(it.href)) window.open(it.href, "_blank", "noopener,noreferrer");
    else navigate(it.href);
  };
  document.addEventListener("keydown", (e) => {
    if (/INPUT|TEXTAREA/.test(document.activeElement.tagName) || document.querySelector(".is-on.pal, .is-on.sheet, .is-on.wn")) return;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") { st.target = Math.round(st.target) + 1; e.preventDefault(); }
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") { st.target = Math.round(st.target) - 1; e.preventDefault(); }
    else if (e.key === "Enter" && e.target === document.body) open(mod(Math.round(st.p), N));
  });

  /* ---------- intro ---------- */
  render();
  if (!REDUCED) {
    st.p = -2.4; st.target = 0;
    gsap.from([".home__intro", ".home__hint"], { opacity: 0, y: 12, duration: 0.9, ease: "power3.out", delay: 0.6, stagger: 0.1 });
  }
});
