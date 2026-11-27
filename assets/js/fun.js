/* ============================================================
   VYOM GOR: fun.js, the playful layer on every page
   - Liquid-glass menu: true refraction in Chromium, frosted glass elsewhere
   - Your visit as a CAN capture (BUS:: chip): hovers, clicks, scrolls and
     keys become real CAN frames (CRC-15, stuff bits) on a live bus trace
   - Breadboard menu: drag a jumper wire from YOU into a page pin
   - Party mode (Konami code, or tap the clock five times) and fun facts (STATUS::)
   Nothing here leaves the visitor's browser.
   ============================================================ */
(() => {
  "use strict";
  const D = document, html = D.documentElement;
  const hex = (n, w = 3) => "0x" + n.toString(16).toUpperCase().padStart(w, "0");
  const ascii = (s) => [...String(s)].slice(0, 8).map((c) => c.charCodeAt(0) & 0x7f);
  const ss = { get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} } };
  const css = (name) => getComputedStyle(html).getPropertyValue(name).trim();

  D.addEventListener("vg:ready", () => {
    const V = window.V;
    const run = (name, fn) => { try { fn(V); } catch (e) { console.warn("[fun] " + name, e); } };
    run("glass", glass);
    run("capture", capture);
    run("breadboard", breadboard);
    run("party", party);
    run("facts", facts);
  });

  /* ---------------- liquid-glass menu ---------------- */
  function glass(V) {
    const pill = V.qs(".navpill");
    if (!pill) return;
    pill.classList.add("is-glass");
    if (!/Chrome\/|Chromium\//.test(navigator.userAgent)) return; // Safari and Firefox keep the frosted look
    D.body.insertAdjacentHTML("beforeend", `<svg class="lens-defs" width="0" height="0" aria-hidden="true" focusable="false"><filter id="vgLens" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feImage id="vgLensMap" x="0" y="0" width="10" height="10" preserveAspectRatio="none" result="map"/><feGaussianBlur in="SourceGraphic" stdDeviation="0.6" result="soft"/><feDisplacementMap in="soft" in2="map" scale="26" xChannelSelector="R" yChannelSelector="G"/></filter></svg>`);
    const build = () => {
      const r = pill.getBoundingClientRect(), w = Math.max(2, Math.round(r.width)), h = Math.max(2, Math.round(r.height));
      const c = D.createElement("canvas"); c.width = w; c.height = h;
      const x = c.getContext("2d"), img = x.createImageData(w, h), rad = h / 2, edge = Math.min(15, h * 0.42);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const cx = Math.min(Math.max(i, rad), w - rad), dx = i - cx, dy = j - rad, dist = Math.hypot(dx, dy);
        const inside = rad - dist, k = inside < edge ? Math.pow(1 - Math.max(inside, 0) / edge, 2) : 0;
        const nx = dist ? dx / dist : 0, ny = dist ? dy / dist : 0, o = (j * w + i) * 4;
        img.data[o] = 128 - nx * k * 127; img.data[o + 1] = 128 - ny * k * 127; img.data[o + 2] = 128; img.data[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      const fe = D.getElementById("vgLensMap");
      fe.setAttribute("href", c.toDataURL()); fe.setAttribute("width", w); fe.setAttribute("height", h);
    };
    build();
    pill.classList.add("is-refract");
    new ResizeObserver(build).observe(pill);
  }

  /* ---------------- your visit as a CAN capture ---------------- */
  function capture(V) {
    const KEY = "vg-cap";
    let cap = { t0: Date.now(), frames: [] };
    try { const s = JSON.parse(ss.get(KEY)); if (s && Array.isArray(s.frames) && s.t0) cap = s; } catch (e) {}
    const save = () => ss.set(KEY, JSON.stringify(cap));
    addEventListener("pagehide", save);
    D.addEventListener("visibilitychange", () => { if (D.hidden) save(); });

    let isOpen = false, paused = false, drawer = null;
    const queue = [];
    const label = (el) => (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ");
    const push = (id, bytes, note) => {
      if (paused) return;
      const f = { t: +((Date.now() - cap.t0) / 1000).toFixed(3), id, data: bytes.slice(0, 8).map((b) => b & 255), note };
      cap.frames.push(f);
      if (cap.frames.length > 400) cap.frames.splice(0, cap.frames.length - 400);
      V.qsa(".js-bus-id").forEach((b) => (b.textContent = hex(id)));
      if (isOpen) { queue.push(f); addRow(f); }
    };

    push(0x100, ascii(location.pathname), `page ${location.pathname}`);
    let lastHover = null, hoverT = 0;
    D.addEventListener("pointerover", (e) => {
      const a = e.target.closest && e.target.closest("a, button");
      if (!a || a === lastHover || a.closest(".cap")) return;
      lastHover = a;
      const now = performance.now(); if (now - hoverT < 120) return; hoverT = now;
      const l = label(a); if (l) push(0x3A0, ascii(l.toUpperCase()), `hover · ${l.slice(0, 28)}`);
    }, { passive: true });
    D.addEventListener("click", (e) => {
      if (e.target.closest && e.target.closest(".cap")) return;
      const t = e.target.closest && e.target.closest("a, button");
      push(0x0A0, [Math.round((e.clientX / innerWidth) * 255), Math.round((e.clientY / innerHeight) * 255), e.button || 0], `click · ${t ? label(t).slice(0, 28) : "page"}`);
    }, true);
    let scrollT = 0;
    const onScroll = () => {
      const now = performance.now(); if (now - scrollT < 350) return; scrollT = now;
      const max = D.documentElement.scrollHeight - innerHeight, pct = max > 0 ? Math.round((scrollY / max) * 100) : 0;
      push(0x2C0, [pct], `scroll · ${pct}%`);
    };
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("wheel", (e) => { const now = performance.now(); if (now - scrollT < 350) return; scrollT = now; push(0x2C1, [e.deltaY > 0 ? 1 : 0xff], `wheel · ${e.deltaY > 0 ? "down" : "up"}`); }, { passive: true });
    D.addEventListener("keydown", (e) => {
      // Never log what people type into fields: only keys pressed on the page itself.
      if (/INPUT|TEXTAREA|SELECT/.test(D.activeElement && D.activeElement.tagName) || (D.activeElement && D.activeElement.isContentEditable)) return;
      const k = e.key.length === 1 ? e.key : e.key.replace("Arrow", "");
      push(0x200, ascii(k.slice(0, 1)), `key · ${k}`);
    });
    D.addEventListener("visibilitychange", () => push(D.hidden ? 0x7F0 : 0x7F1, [], D.hidden ? "tab hidden · bus sleep" : "tab back · wake-up"));

    /* drawer */
    let cv, g, logEl, nEl, raf = 0, stream = [], pos = 0, last = 0;
    const addRow = (f) => {
      if (!logEl) return;
      const li = D.createElement("li");
      li.innerHTML = `<span class="cap__t"></span><b></b><span class="cap__d"></span><span class="cap__n"></span>`;
      li.children[0].textContent = f.t.toFixed(3).padStart(8, " ");
      li.children[1].textContent = hex(f.id);
      li.children[2].textContent = `[${f.data.length}] ${f.data.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" ")}`;
      li.children[3].textContent = f.note;
      logEl.prepend(li);
      while (logEl.children.length > 60) logEl.lastChild.remove();
      nEl.textContent = cap.frames.length;
    };
    const ensureCAN = () => new Promise((res) => {
      if (window.CAN) return res();
      const s = D.createElement("script"); s.src = "/assets/js/can.js"; s.onload = res; s.onerror = res; D.body.append(s);
    });
    const size = () => { const dpr = Math.min(devicePixelRatio || 1, 2), r = cv.getBoundingClientRect(); cv.width = Math.max(1, r.width * dpr); cv.height = Math.max(1, r.height * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    const nextBits = () => {
      const f = queue.shift();
      if (f && window.CAN) return window.CAN.buildFrame(f.id, f.data).bits.concat([{ b: 1, f: "IFS" }, { b: 1, f: "IFS" }, { b: 1, f: "IFS" }]);
      return Array.from({ length: 6 }, () => ({ b: 1, f: "IDLE" }));
    };
    const draw = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      const W = cv.clientWidth, H = cv.clientHeight, BW = W < 600 ? 6 : 8, vis = Math.ceil(W / BW) + 2;
      pos += dt * (70 + queue.length * 45);
      while (stream.length < pos + vis + 2) stream.push(...nextBits());
      const drop = Math.floor(pos) - 2; if (drop > 0) { stream.splice(0, drop); pos -= drop; }
      const gold = css("--gold") || "#a5802a", ink = css("--ink-muted") || "#555", faint = css("--line") || "#ddd";
      g.clearRect(0, 0, W, H);
      const hi = H * 0.2, mid = H * 0.42, lo = H * 0.64, off = (pos % 1) * BW, base = Math.floor(pos);
      g.strokeStyle = faint; g.lineWidth = 1; g.beginPath(); g.moveTo(0, mid); g.lineTo(W, mid); g.stroke();
      const lane = (high, color) => {
        g.strokeStyle = color; g.lineWidth = 2; g.beginPath();
        for (let i = 0; i < vis; i++) {
          const bit = stream[base + i]; if (!bit) break;
          const x = i * BW - off, y = bit.b === 0 ? (high ? hi : lo) : mid;
          if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
          g.lineTo(x + BW, y);
        }
        g.stroke();
      };
      lane(true, gold); lane(false, ink);
      g.font = "500 9px 'Geist Mono', monospace"; g.textBaseline = "top";
      let prevF = null, lastLabelX = -1e9;
      const LABELED = new Set(["SOF", "ID", "DLC", "DATA", "CRC", "ACK", "EOF"]);
      for (let i = 0; i < vis; i++) {
        const bit = stream[base + i]; if (!bit) break;
        const x = i * BW - off;
        if (bit.stuff) { g.fillStyle = gold; g.fillRect(x + 1, H * 0.72, BW - 2, 3); }
        if (bit.f !== prevF && LABELED.has(bit.f)) {
          g.fillStyle = faint; g.fillRect(x, hi - 4, 1, H * 0.62);
          if (x - lastLabelX > 30) { g.fillStyle = ink; g.fillText(bit.f, x + 2, H * 0.8); lastLabelX = x; }
        }
        prevF = bit.f;
      }
      if (isOpen && !paused) raf = requestAnimationFrame(draw);
    };
    const build = () => {
      drawer = V.make(`<section class="cap" aria-label="CAN capture of your visit" hidden>
        <div class="cap__bar">
          <div class="cap__title"><b>CAN capture · your visit</b><span><span class="js-cap-n">0</span> frames · 11-bit IDs · CRC-15 · stuff bits in gold</span></div>
          <div class="cap__btns"><button class="btn js-cap-pause" type="button" aria-pressed="false">Pause</button><button class="btn js-cap-dl" type="button">Download .log</button><button class="btn js-cap-x" type="button" aria-label="Close capture">Close</button></div>
        </div>
        <div class="cap__body"><canvas class="cap__scope" aria-hidden="true"></canvas><ol class="cap__log" aria-label="Frames, newest first"></ol></div>
        <p class="cap__note">Every hover, click, scroll and key press here is sent as a real CAN frame. Lower ID wins the bus, so clicks (0x0A0) beat hovers (0x3A0). It all stays in your browser.</p>
      </section>`);
      D.body.append(drawer);
      cv = V.qs(".cap__scope", drawer); g = cv.getContext("2d"); logEl = V.qs(".cap__log", drawer); nEl = V.qs(".js-cap-n", drawer);
      new ResizeObserver(size).observe(cv);
      V.qs(".js-cap-x", drawer).addEventListener("click", () => toggle(false));
      V.qs(".js-cap-pause", drawer).addEventListener("click", (e) => { paused = !paused; e.currentTarget.textContent = paused ? "Resume" : "Pause"; e.currentTarget.setAttribute("aria-pressed", String(paused)); if (!paused) { last = performance.now(); raf = requestAnimationFrame(draw); } });
      V.qs(".js-cap-dl", drawer).addEventListener("click", () => {
        // candump format: (seconds) interface ID#DATA, the same as Linux SocketCAN logs
        const t0 = cap.t0 / 1000;
        const text = cap.frames.map((f) => `(${(t0 + f.t).toFixed(6)}) vgor0 ${f.id.toString(16).toUpperCase().padStart(3, "0")}#${f.data.map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join("")} ; ${f.note}`).join("\n") + "\n";
        const a = D.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type: "text/plain" })); a.download = "vyom-visit.log"; D.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
        V.toast("Capture saved", "vyom-visit.log, in candump format");
      });
    };
    const toggle = (on) => {
      if (!drawer) build();
      isOpen = on;
      V.qsa(".js-bus").forEach((b) => b.setAttribute("aria-expanded", String(on)));
      drawer.hidden = !on;
      html.classList.toggle("has-cap", on);
      if (on) {
        logEl.innerHTML = ""; cap.frames.slice(-60).forEach(addRow); nEl.textContent = cap.frames.length;
        ensureCAN().then(() => { size(); queue.push(...cap.frames.slice(-6)); last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); });
      } else cancelAnimationFrame(raf);
    };
    D.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".js-bus")) { e.preventDefault(); toggle(!isOpen); } });
    D.addEventListener("keydown", (e) => { if (e.key === "Escape" && isOpen) toggle(false); });
    // phones: the BUS:: chip is hidden in the compact HUD, so the mobile menu gets a button
    const row = V.qs(".mmenu__row");
    if (row) { const b = V.make(`<button class="btn js-bus" type="button" aria-expanded="false">CAN capture</button>`); row.append(b); }
  }

  /* ---------------- breadboard menu ---------------- */
  function breadboard(V) {
    const PAGES = [["Home", "/"], ["About", "/about"], ["Lab", "/lab"], ["Writing", "/writing"], ["Bench", "/bench"], ["Board", "/board"], ["Contact", "/contact"], ["Resume", "/resume"], ["Now", "/now"], ["Notes", "/notes"]];
    const icon = `<svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><circle cx="3" cy="12.5" r="1.6" stroke="currentColor" stroke-width="1.3"/><circle cx="13" cy="3.5" r="1.6" stroke="currentColor" stroke-width="1.3"/><path d="M4.3 11.4C6 9 6 6 8 5.4s3.3-.7 3.8-1" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`;
    const right = V.qs(".hdr__right");
    if (right) right.prepend(V.make(`<button class="iconbtn js-bb" type="button" aria-label="Breadboard menu: plug a wire into a page" title="Breadboard menu">${icon}</button>`));
    const row = V.qs(".mmenu__row"); if (row) row.append(V.make(`<button class="btn js-bb" type="button">Breadboard</button>`));

    let dlg = null, cv, g, raf = 0, W = 0, H = 0, pins = [], you = null, rope = [], prev = [], grab = false, ptr = null, plugged = null, sparks = [], color = "#c2563a", segLen = 20;
    const COLORS = ["#c2563a", "#a5802a", "#3f6fb5", "#2f8a4c"];
    const layout = () => {
      const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const wide = W > H * 1.1;
      you = wide ? { x: Math.max(70, W * 0.13), y: H / 2 } : { x: W / 2, y: Math.max(64, H * 0.13) };
      const list = PAGES.filter(([, h]) => h !== location.pathname.replace(/\.html$/, "") || h === "/");
      const cols = wide ? 2 : 2, rows = Math.ceil(list.length / cols);
      pins = list.map(([name, href], i) => {
        const c = i % cols, rr = Math.floor(i / cols);
        const x = wide ? W * (0.6 + c * 0.2) : W * (0.3 + c * 0.4);
        const y = wide ? H * 0.14 + (rr * (H * 0.72)) / Math.max(1, rows - 1) : H * 0.34 + (rr * (H * 0.58)) / Math.max(1, rows - 1);
        return { name, href, x, y, hot: 0, lit: 0 };
      });
      const far = Math.max(...pins.map((p) => Math.hypot(p.x - you.x, p.y - you.y)));
      const N = 26; segLen = (far * 1.12) / (N - 1);
      rope = Array.from({ length: N }, (_, i) => ({ x: you.x + i * segLen * 0.55, y: you.y + Math.sin(i * 0.4) * 10 + i * 4 }));
      prev = rope.map((p) => ({ ...p }));
    };
    const step = (dt) => {
      const end = rope[rope.length - 1];
      for (let i = 1; i < rope.length; i++) {
        const p = rope[i], q = prev[i], vx = (p.x - q.x) * 0.97, vy = (p.y - q.y) * 0.97;
        q.x = p.x; q.y = p.y; p.x += vx; p.y += vy + (grab || plugged ? 260 : 900) * dt * dt;
      }
      if (grab && ptr) { end.x += (ptr.x - end.x) * 0.6; end.y += (ptr.y - end.y) * 0.6; }
      if (plugged) { end.x = plugged.x; end.y = plugged.y; }
      for (let k = 0; k < 18; k++) {
        rope[0].x = you.x; rope[0].y = you.y;
        for (let i = 0; i < rope.length - 1; i++) {
          const a = rope[i], b = rope[i + 1], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1e-6;
          if (d > segLen) { const diff = (d - segLen) / d, ka = i === 0 ? 0 : 0.5, kb = (grab || plugged) && i + 1 === rope.length - 1 ? 0 : 1 - ka; a.x += dx * diff * ka; a.y += dy * diff * ka; b.x -= dx * diff * kb; b.y -= dy * diff * kb; }
        }
        for (const p of rope) { p.x = Math.min(W - 8, Math.max(8, p.x)); p.y = Math.min(H - 8, Math.max(8, p.y)); }
      }
      pins.forEach((p) => { const d = Math.hypot(p.x - end.x, p.y - end.y); p.hot += ((grab && d < 40 ? 1 : 0) - p.hot) * 0.25; p.lit *= 0.985; });
      sparks = sparks.filter((s) => (s.life -= dt) > 0);
      sparks.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 500 * dt; });
    };
    const paint = () => {
      const ink = css("--ink") || "#1e1e1e", muted = css("--ink-muted") || "#666", surface = css("--surface") || "#fff", line = css("--divider") || "#ccc", gold = css("--gold") || "#a5802a";
      g.clearRect(0, 0, W, H);
      g.fillStyle = surface; g.beginPath(); g.roundRect(4, 4, W - 8, H - 8, 14); g.fill();
      g.strokeStyle = line; g.lineWidth = 1; g.stroke();
      g.fillStyle = line; for (let y = 22; y < H - 14; y += 16) for (let x = 22; x < W - 14; x += 16) g.fillRect(x, y, 3, 3);
      g.strokeStyle = "#c2563a66"; g.lineWidth = 2; g.beginPath(); g.moveTo(16, 12); g.lineTo(W - 16, 12); g.stroke();
      g.strokeStyle = "#3f6fb566"; g.beginPath(); g.moveTo(16, H - 12); g.lineTo(W - 16, H - 12); g.stroke();
      g.textBaseline = "middle";
      // YOU header
      g.fillStyle = ink; g.beginPath(); g.roundRect(you.x - 22, you.y - 14, 44, 28, 5); g.fill();
      g.fillStyle = surface; g.font = "600 11px 'Geist Mono', monospace"; g.textAlign = "center"; g.fillText("YOU", you.x, you.y + 1);
      // pins
      pins.forEach((p) => {
        g.fillStyle = `rgba(165,128,42,${0.12 + p.hot * 0.35})`; g.beginPath(); g.arc(p.x, p.y, 16 + p.hot * 6, 0, 7); g.fill();
        g.fillStyle = ink; g.beginPath(); g.arc(p.x, p.y, 5, 0, 7); g.fill();
        g.fillStyle = p.lit > 0.05 ? `rgba(255,190,60,${0.4 + p.lit * 0.6})` : line; g.beginPath(); g.arc(p.x - 22, p.y, 4, 0, 7); g.fill();
        g.fillStyle = ink; g.font = "560 14px Geist, sans-serif"; g.textAlign = "left"; g.fillText(p.name, p.x + 14, p.y + 1);
      });
      // wire: shadow, body, shine
      const path = () => { g.beginPath(); g.moveTo(rope[0].x, rope[0].y); for (let i = 1; i < rope.length - 1; i++) { const mx = (rope[i].x + rope[i + 1].x) / 2, my = (rope[i].y + rope[i + 1].y) / 2; g.quadraticCurveTo(rope[i].x, rope[i].y, mx, my); } const e = rope[rope.length - 1]; g.lineTo(e.x, e.y); };
      g.lineCap = "round"; g.lineJoin = "round";
      g.save(); g.translate(2, 4); path(); g.strokeStyle = "rgba(0,0,0,.14)"; g.lineWidth = 8; g.stroke(); g.restore();
      path(); g.strokeStyle = color; g.lineWidth = 7; g.stroke();
      path(); g.strokeStyle = "rgba(255,255,255,.35)"; g.lineWidth = 2; g.save(); g.translate(-1, -1.5); g.stroke(); g.restore();
      const e = rope[rope.length - 1], e2 = rope[rope.length - 2], ang = Math.atan2(e.y - e2.y, e.x - e2.x);
      g.save(); g.translate(e.x, e.y); g.rotate(ang); g.fillStyle = muted; g.fillRect(-12, -5, 12, 10); g.fillStyle = gold; g.fillRect(0, -1.5, 8, 3); g.restore();
      sparks.forEach((s) => { g.fillStyle = `rgba(255,${180 + (s.life * 60) | 0},80,${Math.min(1, s.life * 2)})`; g.fillRect(s.x, s.y, 2.5, 2.5); });
    };
    const loop = (() => { let last = 0; const f = (now) => { const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now; step(dt); paint(); if (dlg && dlg.open) raf = requestAnimationFrame(f); }; return () => { last = performance.now(); cancelAnimationFrame(raf); raf = requestAnimationFrame(f); }; })();
    const local = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const build = () => {
      dlg = V.make(`<dialog class="bb" aria-labelledby="bbTitle">
        <div class="bb__head"><div><b id="bbTitle">Breadboard menu</b><span>Drag the wire from YOU into any page pin.</span></div><button class="btn js-bb-x" type="button">Close</button></div>
        <div class="bb__stage"><canvas class="bb__cv" role="img" aria-label="Breadboard with a jumper wire and one pin per page"></canvas></div>
        <nav class="bb__list" aria-label="Or pick a page">${PAGES.map(([n, h]) => `<a href="${h}">${n}</a>`).join("")}</nav>
      </dialog>`);
      D.body.append(dlg);
      cv = V.qs(".bb__cv", dlg); g = cv.getContext("2d");
      V.qs(".js-bb-x", dlg).addEventListener("click", () => dlg.close());
      dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });
      dlg.addEventListener("close", () => cancelAnimationFrame(raf));
      cv.addEventListener("pointerdown", (e) => { if (plugged) return; ptr = local(e); grab = true; cv.setPointerCapture(e.pointerId); V.sfx && V.sfx("click"); });
      cv.addEventListener("pointermove", (e) => { if (grab) ptr = local(e); });
      const drop = () => {
        if (!grab) return; grab = false;
        const end = rope[rope.length - 1], hit = pins.find((p) => Math.hypot(p.x - end.x, p.y - end.y) < 40);
        if (!hit) return;
        plugged = hit; hit.lit = 1; V.sfx && V.sfx("relay");
        for (let i = 0; i < 26; i++) { const a = Math.random() * Math.PI * 2, s = 80 + Math.random() * 260; sparks.push({ x: hit.x, y: hit.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 120, life: 0.35 + Math.random() * 0.4 }); }
        setTimeout(() => { dlg.close(); V.navigate(hit.href); }, 520);
      };
      cv.addEventListener("pointerup", drop); cv.addEventListener("pointercancel", drop);
      new ResizeObserver(() => { if (dlg.open) layout(); }).observe(cv);
    };
    const open = () => {
      if (!dlg) build();
      plugged = null; grab = false; sparks = []; color = COLORS[(Math.random() * COLORS.length) | 0];
      dlg.showModal(); layout(); loop();
    };
    D.addEventListener("click", (e) => { const b = e.target.closest && e.target.closest(".js-bb"); if (!b) return; e.preventDefault(); if (V.qs(".mmenu.is-on")) V.qs(".menubtn") && V.qs(".menubtn").click(); open(); });
  }

  /* ---------------- party mode ---------------- */
  function party(V) {
    const on = () => html.classList.contains("party");
    const confetti = () => {
      if (V.REDUCED) return;
      const c = D.createElement("canvas"); c.className = "confetti"; c.setAttribute("aria-hidden", "true"); D.body.append(c);
      const dpr = Math.min(devicePixelRatio || 1, 2), W = innerWidth, H = innerHeight; c.width = W * dpr; c.height = H * dpr;
      const g = c.getContext("2d"); g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const cols = ["#a5802a", "#d9bc72", "#1e1e1e", "#c2563a", "#3f6fb5", "#9fd24a"], words = ["0x500", "CAN", "ACK", "1", "0", "✦"];
      const P = Array.from({ length: 170 }, () => ({ x: W / 2 + (Math.random() - 0.5) * 120, y: H * 0.35, vx: (Math.random() - 0.5) * 900, vy: -300 - Math.random() * 700, r: Math.random() * 6.3, vr: (Math.random() - 0.5) * 12, c: cols[(Math.random() * cols.length) | 0], w: Math.random() < 0.18 ? words[(Math.random() * words.length) | 0] : null, s: 5 + Math.random() * 6 }));
      let last = performance.now(), t = 0;
      const f = (now) => {
        const dt = Math.min(0.033, (now - last) / 1000); last = now; t += dt;
        g.clearRect(0, 0, W, H);
        P.forEach((p) => { p.vy += 1100 * dt; p.vx *= 0.99; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.globalAlpha = Math.max(0, 1 - t / 3.2); g.fillStyle = p.c; if (p.w) { g.font = "600 13px 'Geist Mono', monospace"; g.fillText(p.w, 0, 0); } else g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
        if (t < 3.3) requestAnimationFrame(f); else c.remove();
      };
      requestAnimationFrame(f);
    };
    const set = (v, quiet) => {
      html.classList.toggle("party", v);
      ss.set("vg-party", v ? "1" : "");
      if (quiet) return;
      if (v) { confetti(); V.toast("Party mode: ON", "Enter the same code again to calm down."); V.sfx && V.sfx("relay"); }
      else V.toast("Party mode: off", "Back to work.");
    };
    if (ss.get("vg-party")) set(true, true);
    const CODE = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
    let i = 0;
    D.addEventListener("keydown", (e) => {
      if (/INPUT|TEXTAREA|SELECT/.test(D.activeElement && D.activeElement.tagName)) return;
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === CODE[i] ? i + 1 : k === CODE[0] ? 1 : 0;
      if (i === CODE.length) { i = 0; set(!on()); }
    });
    // phones: tap the clock five times
    let taps = [], spark = 0;
    D.addEventListener("click", (e) => {
      const chip = e.target.closest && e.target.closest(".hud__chip");
      if (!chip || !chip.querySelector(".js-clock")) return;
      const now = performance.now(); taps = taps.filter((t) => now - t < 2200); taps.push(now);
      if (taps.length >= 5) { taps = []; set(!on()); }
    });
    D.addEventListener("pointermove", (e) => {
      if (!on() || V.REDUCED) return;
      const now = performance.now(); if (now - spark < 40) return; spark = now;
      const s = D.createElement("i"); s.className = "spark"; s.style.left = e.clientX + "px"; s.style.top = e.clientY + "px";
      D.body.append(s); setTimeout(() => s.remove(), 700);
    }, { passive: true });
  }

  /* ---------------- fun facts (STATUS:: chip) ---------------- */
  function facts(V) {
    const F = [
      ["Off the bench", "Anime, games, swimming, hiking, and hunting the next good food spot."],
      ["Kutch → Ahmedabad → Bengaluru", "Diploma, then a 9.08 CGPA B.Tech, then embedded Linux in Bengaluru."],
      ["Hand-drawn pixels", "The CAN dashboard's LCD arrows are custom CGRAM glyphs, drawn one 5×8 pixel at a time."],
      ["Press ` anywhere", "It opens imperfect_cell, his C shell, rebuilt for the browser. Try exit."],
      ["You're on the bus", "Every hover and click here is a CAN frame. Tap BUS:: to watch your own traffic."],
      ["There's a secret", "Gamers know the code. On a phone, tap the clock five times."],
      ["Lowest ID wins", "On CAN, a 0 bit overpowers a 1, so the frame with the smallest ID always gets the bus."],
      ["Breadboard menu", "Tap the wire icon at the top and plug yourself into a page."],
    ];
    let k = +(ss.get("vg-fact") || 0);
    D.addEventListener("click", (e) => {
      if (!(e.target.closest && e.target.closest(".js-fact"))) return;
      const [a, b] = F[k % F.length]; k++; ss.set("vg-fact", String(k));
      V.toast(a, b);
    });
  }
})();
