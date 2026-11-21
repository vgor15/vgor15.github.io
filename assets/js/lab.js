/* ============================================================
   LAB INDEX — LIST / WHEEL / GRID views over one state.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, make, I, S, store, navigate, REDUCED } = window.V;
  const A = window.ART;
  const items = S.lab;
  const N = items.length;
  const mod = (n, m) => ((n % m) + m) % m;
  const root = qs(".labx");
  const vList = qs(".lab-view--list"), vWheel = qs(".lab-view--wheel"), vGrid = qs(".lab-view--grid");
  const href = (it) => "/lab/" + it.slug;

  /* sr-only list */
  qs(".lab__sr").innerHTML = items.map((it) => `<li><a href="${href(it)}">${it.title} — ${it.desc}</a></li>`).join("");

  /* ---------- rows for list + wheel ---------- */
  const POOL = 13;
  const rowHTML = () => `<div class="lab-row"><span class="lab-row__t"></span><span class="lab-row__meta"></span></div>`;
  const lRows = Array.from({ length: POOL }, () => vList.appendChild(make(rowHTML())));
  const wRows = Array.from({ length: POOL }, () => vWheel.appendChild(make(rowHTML())));
  const cache = new Map();
  const fillRow = (el, v) => {
    if (cache.get(el) === v) return;
    cache.set(el, v);
    const it = items[mod(v, N)];
    el.querySelector(".lab-row__t").textContent = it.title;
    el.querySelector(".lab-row__meta").innerHTML = it.tags.map((t) => `<span class="tag">${t}</span>`).join("") + (it.isNew ? `<span class="tag tag--new">New</span>` : "") + `<a class="lab-row__go" href="${href(it)}" aria-label="Open ${it.title}">${I.arrow}</a>`;
    el.dataset.v = v;
  };

  const st = { p: 0, target: 0 };
  let mode = store.get("vg-lab-view") || "wheel";
  let W = innerWidth, H = innerHeight;
  addEventListener("resize", () => { W = innerWidth; H = innerHeight; layoutGrid(true); });

  const renderRows = () => {
    const base = Math.round(st.p) - Math.floor(POOL / 2);
    const fs = Math.max(40, Math.min(W * 0.066, 92));
    const rowH = fs * 1.08;
    const cur = Math.round(st.p);
    for (let j = 0; j < POOL; j++) {
      const v = base + j, d = v - st.p;
      const ad = Math.abs(d);
      if (mode === "list") {
        const r = lRows[j];
        fillRow(r, v);
        r.style.transform = `translate3d(0, ${d * rowH - rowH / 2}px, 0)`;
        r.style.opacity = ad > 7 ? 0 : 1;
        r.classList.toggle("is-cur", v === cur);
      } else if (mode === "wheel") {
        const r = wRows[j];
        fillRow(r, v);
        const R = Math.max(H * 1.05, 720);
        const step = (rowH * 1.02) / R;
        const th = d * step;
        const x = -(R - R * Math.cos(th)) * 1.6;
        const y = R * Math.sin(th);
        r.style.transform = `translate3d(${x}px, ${y - rowH / 2}px, 0) rotate(${th * 57.3}deg)`;
        r.style.opacity = ad > 6 ? 0 : 1;
        r.classList.toggle("is-cur", v === cur);
      }
    }
  };

  /* ---------- grid ---------- */
  const CW = 340, CH = 272;
  const gStage = make(`<div class="lab-grid-stage"></div>`);
  vGrid.appendChild(gStage);
  let gPool = [], gCols = 0, gRows = 0;
  const g = { x: 0, y: 0, vx: 0, vy: 0 };
  const cardFor = (cx, cy) => items[mod(cx * 2 + cy * 3, N)];
  function layoutGrid(rebuild) {
    const cols = Math.ceil(W / CW) + 2, rows = Math.ceil(H / CH) + 2;
    if (rebuild || cols !== gCols || rows !== gRows) {
      gCols = cols; gRows = rows;
      gStage.innerHTML = "";
      gPool = [];
      for (let i = 0; i < cols * rows; i++) {
        const el = make(`<a class="lab-card"><div class="lab-card__pv"></div><div class="lab-card__cap"><span></span><span></span></div></a>`);
        gStage.appendChild(el);
        gPool.push({ el, key: "" });
      }
    }
    renderGrid();
  }
  function renderGrid() {
    const startCol = Math.floor(-g.x / CW) - 1, startRow = Math.floor(-g.y / CH) - 1;
    let i = 0;
    for (let r = 0; r < gRows; r++) for (let c = 0; c < gCols; c++) {
      const wc = startCol + c, wr = startRow + r;
      const cell = gPool[i++];
      const key = wc + ":" + wr;
      if (cell.key !== key) {
        cell.key = key;
        const it = cardFor(wc, wr);
        cell.el.href = href(it);
        cell.el.querySelector(".lab-card__pv").innerHTML = A.previews[it.slug] || "";
        const cap = cell.el.querySelectorAll(".lab-card__cap span");
        cap[0].textContent = it.title;
        cap[1].innerHTML = it.tags.map((t) => `<span class="tag">${t}</span>`).join("") + (it.isNew ? `<span class="tag tag--new">New</span>` : "");
      }
      const offX = (wr % 2 ? CW / 2 : 0);
      cell.el.style.transform = `translate3d(${wc * CW + offX + g.x + 20}px, ${wr * CH + g.y + 110}px, 0)`;
    }
  }

  /* ---------- mode switch ---------- */
  const setMode = (m) => {
    mode = m;
    store.set("vg-lab-view", m);
    [vList, vWheel, vGrid].forEach((v) => v.classList.toggle("is-on", v.dataset.view === m));
    qsa(".seg button").forEach((b) => b.classList.toggle("is-on", b.dataset.mode === m));
    cache.clear();
    if (m === "grid") layoutGrid(true); else renderRows();
    if (!REDUCED) {
      const targets = m === "grid" ? qsa(".lab-card", vGrid) : qsa(".lab-row", m === "list" ? vList : vWheel);
      gsap.from(targets, { opacity: 0, x: m === "grid" ? 0 : -40, y: m === "grid" ? 30 : 0, duration: 0.7, ease: "power3.out", stagger: 0.02, clearProps: "opacity" });
    }
  };
  qsa(".seg button").forEach((b) => b.addEventListener("click", () => setMode(b.dataset.mode)));

  /* ---------- input ---------- */
  let snapT;
  const snap = () => { clearTimeout(snapT); snapT = setTimeout(() => (st.target = Math.round(st.target)), 150); };
  root.addEventListener("wheel", (e) => {
    e.preventDefault();
    if (mode === "grid") { g.x -= e.deltaX; g.y -= e.deltaY; renderGrid(); return; }
    st.target += Math.max(-0.5, Math.min(0.5, e.deltaY * 0.0024));
    snap();
  }, { passive: false });

  let drag = null;
  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest(".seg, .lab-row__go")) return;
    drag = { x: e.clientX, y: e.clientY, sx: g.x, sy: g.y, t0: st.target, moved: 0, lx: e.clientX, ly: e.clientY, lt: performance.now(), target: e.target };
    root.setPointerCapture(e.pointerId);
  });
  root.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    drag.moved = Math.max(drag.moved, Math.hypot(dx, dy));
    if (drag.moved < 4) return;
    const now = performance.now(), dt = Math.max(1, now - drag.lt);
    if (mode === "grid") {
      gStage.classList.add("is-drag");
      g.x = drag.sx + dx; g.y = drag.sy + dy;
      g.vx = ((e.clientX - drag.lx) / dt) * 16; g.vy = ((e.clientY - drag.ly) / dt) * 16;
      renderGrid();
    } else {
      const rowH = Math.max(40, Math.min(W * 0.066, 92)) * 1.08;
      st.target = drag.t0 - dy / rowH;
      drag.v = -((e.clientY - drag.ly) / dt) * 16 / rowH;
    }
    drag.lx = e.clientX; drag.ly = e.clientY; drag.lt = now;
  });
  const end = () => {
    if (!drag) return;
    gStage.classList.remove("is-drag");
    if (drag.moved < 6) {
      const card = drag.target.closest(".lab-card");
      const row = drag.target.closest(".lab-row");
      if (card) navigate(card.getAttribute("href"));
      else if (row) {
        const v = +row.dataset.v;
        if (v === Math.round(st.p)) navigate(href(items[mod(v, N)]));
        else st.target = v;
      }
    } else if (mode === "grid") {
      const glide = () => {
        g.vx *= 0.94; g.vy *= 0.94; g.x += g.vx; g.y += g.vy; renderGrid();
        if (Math.abs(g.vx) + Math.abs(g.vy) > 0.3) requestAnimationFrame(glide);
      };
      requestAnimationFrame(glide);
    } else {
      st.target = Math.round(st.target + Math.max(-4, Math.min(4, (drag.v || 0) * 8)));
    }
    drag = null;
  };
  root.addEventListener("pointerup", end);
  root.addEventListener("pointercancel", end);
  root.addEventListener("click", (e) => { if (e.target.closest(".lab-card")) e.preventDefault(); });

  document.addEventListener("keydown", (e) => {
    if (document.querySelector(".is-on.pal, .is-on.sheet, .is-on.wn") || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (mode === "grid") return;
    if (e.key === "ArrowDown") { st.target = Math.round(st.target) + 1; e.preventDefault(); }
    else if (e.key === "ArrowUp") { st.target = Math.round(st.target) - 1; e.preventDefault(); }
    else if (e.key === "Enter") navigate(href(items[mod(Math.round(st.p), N)]));
  });

  gsap.ticker.add(() => {
    if (mode === "grid") return;
    st.p += (st.target - st.p) * (REDUCED ? 1 : 0.12);
    if (Math.abs(st.target - st.p) < 0.0005) st.p = st.target;
    renderRows();
  });

  setMode(mode);
});
