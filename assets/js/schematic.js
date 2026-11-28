/* ============================================================
   VYOM GOR: schematic.js, the home page as a circuit diagram
   U1 (that's Vyom) is wired to every page as a component. Click a
   part and the drawing zooms down into it until it becomes the page.
   A WHEEL / SCHEMATIC switch sits bottom-right; the choice is remembered.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  "use strict";
  const V = window.V, S = V.S, D = document, html = D.documentElement;
  if (!V.qs(".home")) return;
  const NS = "http://www.w3.org/2000/svg";
  const pref = { get() { try { return localStorage.getItem("vg-home-view"); } catch (e) { return null; } }, set(v) { try { localStorage.setItem("vg-home-view", v); } catch (e) {} } };

  const seg = V.make(`<div class="viewseg" role="group" aria-label="Home view"><button type="button" data-v="core" aria-pressed="true">Core</button><button type="button" data-v="wheel" aria-pressed="false">Wheel</button><button type="button" data-v="schematic" aria-pressed="false">Circuit</button></div>`);
  D.body.append(seg);
  const wrap = V.make(`<section class="sch" aria-label="Site schematic: click a part to open that page"></section>`);
  V.qs("main").append(wrap);

  const n = (arr) => (Array.isArray(arr) ? arr.length : 0);
  const PARTS = [
    { ref: "R1", name: "ABOUT", value: "9.08 kΩ", href: "/about", sym: "res", side: "L" },
    { ref: "C1", name: "LAB", value: `${n(S.lab)} µF`, href: "/lab", sym: "cap", side: "L" },
    { ref: "D1", name: "WRITING", value: `${n(S.writing)} posts`, href: "/writing", sym: "led", side: "L" },
    { ref: "Y1", name: "NOW", value: "live", href: "/now", sym: "xtal", side: "L" },
    { ref: "J1", name: "CONTACT", value: "say hi", href: "/contact", sym: "conn", side: "R" },
    { ref: "LCD1", name: "BENCH", value: "16×2", href: "/bench", sym: "lcd", side: "R" },
    { ref: "SW1", name: "RESUME", value: "push", href: "/resume", sym: "sw", side: "R" },
    { ref: "TP1", name: "NOTES", value: `${n(S.notes)} TIL`, href: "/notes", sym: "tp", side: "R" },
    { ref: "U2", name: "BOARD", value: "3D", href: "/board", sym: "ic", side: "T" },
  ];

  const el = (tag, attrs = {}, parent) => { const e = D.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const text = (parent, x, y, s, cls, anchor = "middle") => { const t = el("text", { x, y, class: cls, "text-anchor": anchor }, parent); t.textContent = s; return t; };

  /* symbols drawn around (0,0), leads reaching x = ±48 */
  const SYM = {
    res: (g) => el("path", { d: "M-48 0H-30l4-10 8 20 8-20 8 20 8-20 8 20 4-10H48", class: "sch__ln" }, g),
    cap: (g) => { el("path", { d: "M-48 0H-6M6 0H48M-6-16V16M6-16V16", class: "sch__ln" }, g); },
    led: (g) => { el("path", { d: "M-48 0H-12M14 0H48M-12-14V14L14 0Z M14-14V14", class: "sch__ln" }, g); el("path", { d: "M2-20l10-10M10-30h-6M10-30v6M10-14l10-10M18-24h-6M18-24v6", class: "sch__ln sch__thin" }, g); },
    xtal: (g) => { el("path", { d: "M-48 0H-14M14 0H48M-14-14V14M14-14V14", class: "sch__ln" }, g); el("rect", { x: -8, y: -12, width: 16, height: 24, class: "sch__ln" }, g); },
    conn: (g) => { el("path", { d: "M-48 0H-20", class: "sch__ln" }, g); el("rect", { x: -20, y: -24, width: 40, height: 48, rx: 4, class: "sch__ln" }, g); [-12, 0, 12].forEach((y) => el("circle", { cx: 0, cy: y, r: 3.2, class: "sch__dot" }, g)); },
    lcd: (g) => { el("path", { d: "M-48 0H-34", class: "sch__ln" }, g); el("rect", { x: -34, y: -22, width: 68, height: 44, rx: 4, class: "sch__ln" }, g); el("rect", { x: -26, y: -14, width: 52, height: 28, class: "sch__scr" }, g); },
    sw: (g) => el("path", { d: "M-48 0H-16M16 0H48M-16 0L14-16", class: "sch__ln" }, g),
    tp: (g) => { el("path", { d: "M-48 0H-10", class: "sch__ln" }, g); el("circle", { cx: 0, cy: 0, r: 10, class: "sch__ln" }, g); },
    ic: (g) => { el("rect", { x: -34, y: -24, width: 68, height: 48, rx: 3, class: "sch__ln" }, g); [-22, -8, 6, 20].forEach((x) => { el("path", { d: `M${x} -24v-8M${x} 24v8`, class: "sch__ln sch__thin" }, g); }); },
  };

  let svg = null, vb = null, busy = false;
  const build = () => {
    wrap.innerHTML = "";
    const portrait = innerWidth < innerHeight * 0.95;
    const VW = portrait ? 720 : 1200, VH = portrait ? 1180 : 780;
    vb = { x: 0, y: 0, w: VW, h: VH };
    svg = el("svg", { viewBox: `0 0 ${VW} ${VH}`, class: "sch__svg", role: "group", "aria-label": "Schematic of this site" }, wrap);
    // MCU U1
    const U = portrait ? { x: 220, y: 380, w: 280, h: 400 } : { x: 450, y: 220, w: 300, h: 340 };
    const mcu = el("g", { class: "sch__mcu" }, svg);
    el("rect", { x: U.x, y: U.y, width: U.w, height: U.h, rx: 6, class: "sch__body" }, mcu);
    el("path", { d: `M${U.x + U.w / 2 - 16} ${U.y}a16 16 0 0 0 32 0`, class: "sch__ln" }, mcu);
    text(mcu, U.x + 16, U.y - 12, "U1", "sch__ref", "start");
    text(mcu, U.x + U.w / 2, U.y + U.h / 2 - 18, S.first ? S.first.toUpperCase() : "VYOM", "sch__big");
    text(mcu, U.x + U.w / 2, U.y + U.h / 2 + 14, "THAT IS ME · " + (S.city || "").toUpperCase(), "sch__val");
    text(mcu, U.x + U.w / 2, U.y + U.h / 2 + 40, "VDD 3V3 · coffee-powered", "sch__val sch__dim");
    const sides = { L: PARTS.filter((p) => p.side === "L"), R: PARTS.filter((p) => p.side === "R"), T: PARTS.filter((p) => p.side === "T") };
    const place = (p, i, count) => {
      if (p.side === "T") return { cx: U.x + U.w / 2, cy: U.y - (portrait ? 190 : 140), pin: { x: U.x + U.w / 2, y: U.y }, vertical: true };
      const pinY = U.y + ((i + 1) * U.h) / (count + 1);
      const cx = p.side === "L" ? (portrait ? 110 : 200) : (portrait ? VW - 110 : VW - 200);
      const cy = U.y + U.h / 2 + (i - (count - 1) / 2) * (portrait ? 200 : 150);
      return { cx, cy, pin: { x: p.side === "L" ? U.x : U.x + U.w, y: pinY } };
    };
    // wires first (under parts)
    const wires = el("g", { class: "sch__wires" }, svg);
    const parts = el("g", {}, svg);
    Object.values(sides).forEach((list) => list.forEach((p, i) => {
      const at = place(p, i, list.length);
      const lead = p.side === "L" ? at.cx + 48 : p.side === "R" ? at.cx - 48 : null;
      let d;
      if (p.side === "T") d = `M${at.cx} ${at.cy + 32}V${at.pin.y}`;
      else { const midX = (lead + at.pin.x) / 2; d = `M${lead} ${at.cy}H${midX}V${at.pin.y}H${at.pin.x}`; }
      el("path", { d, class: "sch__wire" }, wires);
      const flow = el("path", { d, class: "sch__flow", "data-ref": p.ref }, wires);
      el("circle", { cx: at.pin.x, cy: at.pin.y, r: 4, class: "sch__dot" }, wires);
      const pinLabel = p.side === "T" ? null : text(mcu, at.pin.x + (p.side === "L" ? 10 : -10), at.pin.y + 4, `P0.${PARTS.indexOf(p)}`, "sch__pin", p.side === "L" ? "start" : "end");
      // the part itself is a link
      const a = el("a", { href: p.href, class: "sch__part", "aria-label": `${p.name.charAt(0) + p.name.slice(1).toLowerCase()}: ${p.ref}, ${p.value}` }, parts);
      const g = el("g", { transform: `translate(${at.cx} ${at.cy})${p.side === "T" ? "" : p.side === "R" ? " scale(-1 1)" : ""}` }, a);
      el("rect", { x: -60, y: -46, width: 120, height: 92, class: "sch__hit" }, g);
      SYM[p.sym](g);
      if (p.sym === "lcd") { const t = text(g, 0, 5, "HI!", "sch__lcd"); if (p.side === "R") t.setAttribute("transform", "scale(-1 1)"); }
      const lx = at.cx, top = at.cy - (p.side === "T" ? 44 : 34), bottom = at.cy + (p.side === "T" ? 56 : 46);
      text(a, lx, top, `${p.ref}`, "sch__ref");
      text(a, lx, bottom, p.name, "sch__name");
      text(a, lx, bottom + 20, p.value, "sch__val");
      a.addEventListener("pointerenter", () => flow.classList.add("is-hot"));
      a.addEventListener("pointerleave", () => flow.classList.remove("is-hot"));
      a.addEventListener("focus", () => flow.classList.add("is-hot"));
      a.addEventListener("blur", () => flow.classList.remove("is-hot"));
      a.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); zoomTo(at.cx, at.cy, p.href); });
    }));
    // ground symbol and title block, like a real sheet
    const gx = U.x + U.w / 2, gy = U.y + U.h;
    el("path", { d: `M${gx} ${gy}v40M${gx - 22} ${gy + 40}h44M${gx - 14} ${gy + 48}h28M${gx - 6} ${gy + 56}h12`, class: "sch__ln" }, svg);
    const tb = el("g", { class: "sch__tb" }, svg), bw = portrait ? 300 : 340, bx = VW - bw - 24, by = VH - 92;
    el("rect", { x: bx, y: by, width: bw, height: 72, class: "sch__ln" }, tb);
    el("path", { d: `M${bx} ${by + 36}H${bx + bw}M${bx + bw * 0.62} ${by + 36}V${by + 72}`, class: "sch__ln sch__thin" }, tb);
    text(tb, bx + 12, by + 24, `TITLE: ${(S.name || "").toUpperCase()} · PORTFOLIO`, "sch__val", "start");
    text(tb, bx + 12, by + 60, `REV ${new Date().getFullYear()} · BLR`, "sch__val", "start");
    text(tb, bx + bw * 0.62 + 12, by + 60, "SHEET 1/1", "sch__val", "start");
  };

  const zoomTo = (cx, cy, href) => {
    if (busy) return; busy = true;
    if (V.REDUCED || !window.gsap) { V.navigate(href); return; }
    V.sfx && V.sfx("relay");
    const target = { w: 220, h: 220 * (vb.h / vb.w) };
    const st = { ...vb };
    gsap.to(st, { x: cx - target.w / 2, y: cy - target.h / 2, w: target.w, h: target.h, duration: 0.75, ease: "power3.in",
      onUpdate: () => svg.setAttribute("viewBox", `${st.x} ${st.y} ${st.w} ${st.h}`),
      onComplete: () => V.navigate(href) });
    gsap.to(wrap, { opacity: 0, duration: 0.25, delay: 0.55 });
  };

  const set = (v, save) => {
    const sch = v === "schematic";
    html.classList.toggle("view-schematic", sch);
    html.classList.toggle("view-core", v === "core");
    html.classList.toggle("view-wheel", v === "wheel");
    seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v)));
    if (sch && !svg) build();
    if (save) pref.set(v);
    if (sch && window.gsap && !V.REDUCED) gsap.fromTo(".sch__part", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.04, ease: "power2.out" });
  };
  seg.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) set(b.dataset.v, true); });
  let rT, lastPortrait = innerWidth < innerHeight * 0.95;
  addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(() => { const p = innerWidth < innerHeight * 0.95; if (svg && p !== lastPortrait) { lastPortrait = p; build(); } }, 200); });
  addEventListener("pageshow", (e) => { if (e.persisted) { busy = false; wrap.style.opacity = ""; if (svg) svg.setAttribute("viewBox", `${vb.x} ${vb.y} ${vb.w} ${vb.h}`); } });
  /* SIGNAL hero: live text from the content files, and a one-time decode of the name */
  const fill = (sel, v) => { const e = V.qs(sel); if (e && v) e.textContent = v; };
  fill(".js-sig-role", S.title); fill(".js-sig-status", S.status); fill(".js-sig-tag", S.tagline);
  if (!V.REDUCED) {
    const GLYPH = "01<>/{}#$%&@VYOMGR";
    V.qsa(".signal__name span").forEach((el, k) => {
      const final = el.textContent; let f = 0;
      const tick = () => {
        el.textContent = [...final].map((c, i) => (i < f / 3 - k * 2 ? c : GLYPH[(Math.random() * GLYPH.length) | 0])).join("");
        if (++f < (final.length + k * 2) * 3 + 6) setTimeout(tick, 40); else el.textContent = final;
      };
      tick();
    });
  }

  const saved = pref.get();
  set(saved === "schematic" || saved === "wheel" ? saved : "core", false);
});
