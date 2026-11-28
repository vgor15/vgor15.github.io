/* VYOM ISLAND: the home page as a little world you can walk around.
   Loader → Enter → VY-01 says hi → style your avatar → explore.
   Every place is also a real page, so the plain site always has everything.
   Runs only with WebGL2 and when Plain view is off; otherwise the normal
   home page stays as it is. */
import { ZONES, LINES, ACH, LOOKS, DEFAULT_LOOK, zone } from "./data.js";
import { sound } from "./audio.js";

const html = document.documentElement, D = document;
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const plainPref = () => { try { return localStorage.getItem("vg-plain") === "1"; } catch (e) { return false; } };
const params = new URLSearchParams(location.search);
if (params.has("plain")) { try { localStorage.setItem("vg-plain", "1"); } catch (e) {} }
const hasGL2 = (() => { try { return !!D.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safeHref = (u) => (/^(https:\/\/|\/(?!\/))/.test(String(u || "")) ? String(u) : "");
const isExternal = (u) => /^https:\/\//.test(u);

/* the plain home offers a way back into the island */
D.addEventListener("click", (e) => {
  const b = e.target.closest && e.target.closest(".js-island-on");
  if (b) { e.preventDefault(); try { localStorage.setItem("vg-plain", "0"); } catch (err) {} location.href = "/"; }
});

/* the header Plain-view switch on the plain home brings the island back */
D.addEventListener("click", (e) => { if (e.target.closest && e.target.closest(".js-plain") && D.body.dataset.page === "home" && !html.classList.contains("isl-on")) setTimeout(() => { if (!plainPref()) location.reload(); }, 60); });
if (hasGL2 && !plainPref()) boot();
else html.classList.add("isl-off");

function boot() {
  html.classList.add("isl-on");
  const save = Object.assign({ look: { ...DEFAULT_LOOK }, ach: {}, intro: false }, store.get("vg-island", {}));
  const persist = () => store.set("vg-island", save);

  /* ================= UI shell ================= */
  const ui = D.createElement("div");
  ui.className = "isl";
  ui.innerHTML = `
  <div class="isl-load" role="dialog" aria-modal="true" aria-labelledby="isl-name">
    <div class="isl-load__in">
      <h2 class="isl-load__name" id="isl-name"><span>V</span><span>Y</span><span>O</span><span>M</span></h2>
      <p class="isl-load__sub">Island · A portfolio you can walk around</p>
      <div class="isl-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg"/></svg>
        <b class="isl-ring__pct" aria-live="polite">0%</b>
        <button type="button" class="isl-enter" hidden>Enter</button></div>
      <p class="isl-load__note">🔊 Sound on · no cookies, no trackers · <a href="/?plain=1" class="js-plain-link">Prefer the plain site?</a></p>
    </div>
  </div>
  <header class="isl-top">
    <button type="button" class="isl-logo js-home" aria-label="Back to the plaza">VYOM</button>
    <nav class="isl-nav" aria-label="Island">
      <button type="button" class="isl-pill js-dash" aria-label="Your progress"><span class="isl-pill__ic" aria-hidden="true">🏆</span><span class="isl-pill__t">Progress</span><b class="js-count">0/${ACH.length}</b></button>
      <button type="button" class="isl-pill js-goto" data-zone="house"><span class="isl-pill__ic" aria-hidden="true">🏡</span><span class="isl-pill__t">About</span></button>
      <button type="button" class="isl-pill js-goto" data-zone="workshop"><span class="isl-pill__ic" aria-hidden="true">🛠️</span><span class="isl-pill__t">Work</span></button>
      <button type="button" class="isl-cta js-hire">Hire Vyom</button>
    </nav>
  </header>
  <div class="isl-labels"></div>
  <div class="isl-prompt" hidden><button type="button" class="isl-prompt__b"></button></div>
  <section class="isl-dialog" aria-label="Conversation" hidden>
    <span class="isl-dialog__who"></span>
    <p class="isl-dialog__t" aria-hidden="true"></p>
    <p class="sr-only isl-dialog__sr" aria-live="polite"></p>
    <div class="isl-dialog__acts"></div>
  </section>
  <div class="isl-bl">
    <button type="button" class="isl-round js-sound" aria-pressed="true" aria-label="Sound"><span aria-hidden="true">🔊</span></button>
    <button type="button" class="isl-round js-style" aria-label="Style your avatar"><span aria-hidden="true">🧢</span></button>
    <button type="button" class="isl-round js-night" aria-pressed="false" aria-label="Switch to night"><span aria-hidden="true">🌙</span></button>
  </div>
  <button type="button" class="isl-map js-map" aria-label="Open the island map"><canvas class="isl-mini" width="150" height="96" aria-hidden="true"></canvas><span>Map</span></button>
  <div class="isl-br"><a href="/resume">Résumé</a><button type="button" class="js-email">Email</button><a href="/?plain=1" class="js-plain-link">Plain site</a></div>
  <p class="isl-hint" aria-hidden="true">Click the ground to walk · drag to look around</p>
  <div class="isl-toasts" aria-live="polite"></div>
  <div class="isl-sheet" role="dialog" aria-modal="true" aria-labelledby="isl-sheet-h" hidden>
    <div class="isl-sheet__card"><button type="button" class="isl-x js-close" aria-label="Close">✕</button><div class="isl-sheet__body"></div></div>
  </div>
  <div class="isl-fade" aria-hidden="true"></div>`;
  D.body.append(ui);
  const $ = (s) => ui.querySelector(s);
  const pct = $(".isl-ring__pct"), ring = $(".isl-ring .fg"), enterBtn = $(".isl-enter");
  let shown = 0, goal = 8;
  const loadTick = setInterval(() => { shown += (goal - shown) * 0.12 + 0.2; shown = Math.min(shown, goal); pct.textContent = Math.round(shown) + "%"; ring.style.strokeDashoffset = String(327 * (1 - shown / 100)); if (shown >= 99.5) { clearInterval(loadTick); pct.textContent = "100%"; pct.hidden = true; enterBtn.hidden = false; enterBtn.focus({ preventScroll: true }); } }, 30);
  D.addEventListener("click", (e) => { if (e.target.closest(".js-plain-link")) { try { localStorage.setItem("vg-plain", "1"); } catch (err) {} } });

  /* ================= load the 3D bits ================= */
  (async () => {
    const fonts = D.fonts ? Promise.all([D.fonts.load('800 40px "Unbounded"'), D.fonts.load('600 20px "Geist"')]).catch(() => {}) : Promise.resolve();
    const [THREE, { buildWorld, islandR, ROAD }, { makePerson, makeBot }, Q] = await Promise.all([
      import("/assets/vendor/three.module.min.js"), import("./world.js"), import("./avatar.js"), import("../world/quality.js"),
    ]);
    goal = 45;
    if (!window.SITE) await new Promise((r) => D.addEventListener("vg:ready", r, { once: true }));
    await fonts;
    run(THREE, buildWorld, islandR, ROAD, makePerson, makeBot, Q);
  })().catch((e) => { console.warn("[island] off:", e && e.message); html.classList.remove("isl-on"); html.classList.add("isl-off"); ui.remove(); });

  function run(THREE, buildWorld, islandR, ROAD, makePerson, makeBot, Q) {
    /* ---------- renderer ---------- */
    const canvas = D.createElement("canvas"); canvas.className = "isl-cv"; canvas.setAttribute("aria-hidden", "true");
    ui.prepend(canvas);
    const probe = canvas.getContext("webgl2", { antialias: false }) ;
    const tier = Q.detectTier(probe);
    const renderer = new THREE.WebGLRenderer({ canvas, context: probe, antialias: false, powerPreference: "high-performance" });
    const cfg = { high: { dpr: 1.75 }, mid: { dpr: 1.35 }, low: { dpr: 1 } }[tier];
    const gov = new Q.Governor(tier, (d) => { renderer.setPixelRatio(Math.min(d, cfg.dpr)); });
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, cfg.dpr));
    renderer.shadowMap.enabled = tier !== "low"; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    const W = buildWorld(renderer, tier);
    goal = 80;
    const { scene } = W;
    const camera = new THREE.PerspectiveCamera(42, 1, 0.5, 900);
    const resize = () => { renderer.setSize(innerWidth, innerHeight, false); camera.aspect = innerWidth / Math.max(1, innerHeight); camera.fov = innerWidth < innerHeight ? 55 : 42; camera.updateProjectionMatrix(); };
    addEventListener("resize", resize); resize();

    /* ---------- characters ---------- */
    const player = makePerson({ ...save.look });
    player.root.position.set(0, 0, 11.5); player.root.rotation.y = Math.PI;
    scene.add(player.root);
    const bot = makeBot(); bot.root.position.set(3.4, 0, 3.6); scene.add(bot.root);
    const npcs = {};
    ZONES.forEach((z) => {
      const spot = W.npcSpot(z);
      if (z.npc.bot) { npcs[z.id] = { who: bot, spot, z, bot: true }; return; }
      const p = makePerson({ ...z.npc.look }); p.root.position.copy(spot.pos); p.root.rotation.y = spot.face; scene.add(p.root);
      W.colliders.push({ x: spot.pos.x, z: spot.pos.z, r: 0.8 });
      npcs[z.id] = { who: p, spot, z, home: spot.face };
    });
    const marker = new THREE.Mesh(new THREE.RingGeometry(0.45, 0.7, 28), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    marker.rotation.x = -Math.PI / 2; marker.position.y = 0.08; scene.add(marker);
    renderer.shadowMap.needsUpdate = true;

    /* ---------- state ---------- */
    const S = {
      mode: "intro", yaw: 0, pitch: 0.92, dist: 21, yawT: 0, pitchT: 0.92, distT: 21,
      target: null, onArrive: null, speed: 0, keys: new Set(), near: null, talking: null, busy: false,
      camPos: new THREE.Vector3(0, 90, 120), camLook: new THREE.Vector3(0, 0, 0), t: 0, stepT: 0, towerTaps: 0, rideFrom: 0,
    };
    const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3();

    /* ---------- achievements ---------- */
    const count = $(".js-count");
    const refreshCount = () => (count.textContent = `${Object.keys(save.ach).length}/${ACH.length}`);
    refreshCount();
    const unlock = (id) => {
      if (save.ach[id]) return; const a = ACH.find((x) => x.id === id); if (!a) return;
      save.ach[id] = Date.now(); persist(); refreshCount();
      const t = D.createElement("div"); t.className = "isl-toast";
      t.innerHTML = `<span class="isl-toast__ic" aria-hidden="true">${a.icon}</span><span><small>Achievement unlocked</small><b>${esc(a.title)}</b></span>`;
      $(".isl-toasts").append(t); sound.fanfare();
      requestAnimationFrame(() => t.classList.add("is-on"));
      setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 400); }, 3400);
      const visits = ZONES.every((z) => save.ach["visit-" + z.id]);
      if (id.startsWith("visit-") && visits) setTimeout(() => { unlock("explorer"); queue(LINES.explorer(), "VY-01", 880); }, 900);
    };

    /* ---------- dialog ---------- */
    const dlg = $(".isl-dialog"), dWho = $(".isl-dialog__who"), dT = $(".isl-dialog__t"), dSr = $(".isl-dialog__sr"), dActs = $(".isl-dialog__acts");
    let steps = [], si = 0, typing = 0, typed = 0, voice = 600, after = null, pending = [];
    const queue = (lines, who, v) => { if (!dlg.hidden) pending.push([lines, who, v]); else say(lines, who, v); };
    function say(lines, who, v = 600, done = null) {
      steps = lines; si = 0; voice = v; after = done; dWho.textContent = who; dlg.hidden = false; dlg.classList.remove("is-out");
      S.talking = who; showStep();
    }
    function showStep() {
      const st = steps[si]; typed = 0; dT.textContent = ""; dSr.textContent = st.t; dActs.innerHTML = "";
      clearInterval(typing);
      const finish = () => { clearInterval(typing); typing = 0; dT.textContent = st.t; buttons(st); };
      if (REDUCED) return finish();
      typing = setInterval(() => { typed += 2; dT.textContent = st.t.slice(0, typed); if (typed % 4 === 0) sound.blip(voice); if (typed >= st.t.length) finish(); }, 28);
      dlg.onclick = (e) => { if (typing && !e.target.closest("button")) finish(); };
    }
    function buttons(st) {
      if (st.choices) st.choices.forEach((c, i) => { const b = D.createElement("button"); b.type = "button"; b.className = "isl-btn" + (i === st.choices.length - 1 ? " isl-btn--go" : ""); b.textContent = c.label; b.onclick = () => { sound.click(); endDialog(); act(c.act); }; dActs.append(b); });
      else { const b = D.createElement("button"); b.type = "button"; b.className = "isl-btn isl-btn--go"; b.textContent = si < steps.length - 1 ? "Next" : "Okay!"; b.onclick = () => { sound.click(); next(); }; dActs.append(b); }
      const first = dActs.querySelector(".isl-btn--go"); first && first.focus({ preventScroll: true });
    }
    function next() { if (si < steps.length - 1) { si++; showStep(); } else { const f = after; endDialog(); f && f(); } }
    function endDialog() {
      clearInterval(typing); typing = 0; dlg.classList.add("is-out"); S.talking = null;
      setTimeout(() => { if (dlg.classList.contains("is-out")) dlg.hidden = true; if (pending.length) { const p = pending.shift(); say(...p); } }, 220);
      if (S.mode === "talk") S.mode = "follow";
    }

    /* ---------- sheet (panels, map, avatar maker, games, progress) ---------- */
    const sheet = $(".isl-sheet"), body = $(".isl-sheet__body");
    let opener = null, game = null, sheetKind = "";
    function openSheet(kind, htmlStr, cls = "") {
      if (!dlg.hidden) endDialog();
      opener = D.activeElement; sheetKind = kind; body.innerHTML = htmlStr; sheet.className = "isl-sheet " + cls; sheet.hidden = false;
      requestAnimationFrame(() => sheet.classList.add("is-on"));
      const f = body.querySelector("button, a, [tabindex]"); (f || $(".js-close")).focus({ preventScroll: true });
      sound.pop();
    }
    function closeSheet() {
      if (sheet.hidden) return;
      if (game) { game.destroy(); game = null; }
      sheet.classList.remove("is-on"); setTimeout(() => (sheet.hidden = true), 250);
      if (sheetKind === "style") { S.mode = "follow"; S.distT = 21; S.pitchT = 0.92; if (!save.ach.style) unlock("style"); }
      sheetKind = ""; opener && opener.focus && opener.focus({ preventScroll: true });
    }
    $(".js-close").onclick = closeSheet;
    sheet.addEventListener("click", (e) => { if (e.target === sheet) closeSheet(); });

    const link = (href, label, cls = "isl-btn") => { const h = safeHref(href); return h ? `<a class="${cls}" href="${esc(h)}"${isExternal(h) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(label)}</a>` : ""; };
    const ICON = { can: "🚗", cell: "🐚", test: "🧪", lcd: "📟", tree: "🌳", grid: "#️⃣", chip: "🔌" };
    const site = () => window.SITE || {};
    const PANELS = {
      workshop: () => { const work = (site().work || []).filter((w) => !w.hidden);
        return `<p class="isl-kicker">🛠️ The Workshop</p><h2 id="isl-sheet-h" class="isl-h">Things Vyom built</h2>
        <div class="isl-cards">${work.map((w) => `<article class="isl-card"><span class="isl-card__ic" aria-hidden="true">${ICON[w.icon] || "✨"}</span><div><h3>${esc(w.title)}</h3><p class="isl-meta">${esc(w.by)} · ${esc(w.year)}</p><p>${esc(w.summary)}</p>${link(w.href, isExternal(w.href || "") ? "Open on GitHub ↗" : "Take a look →", "isl-link")}</div></article>`).join("")}</div>
        <p class="isl-more">${link("/work", "See every project on one page →", "isl-btn isl-btn--go")}</p>`; },
      project: (w) => `<p class="isl-kicker">🔎 Up close</p><h2 id="isl-sheet-h" class="isl-h">${ICON[w.icon] || "✨"} ${esc(w.title)}</h2><p class="isl-meta">${esc(w.by)} · ${esc(w.year)}</p><p class="isl-lede">${esc(w.summary)}</p>
        <p class="isl-more">${link(w.href, isExternal(w.href || "") ? "Open on GitHub ↗" : "Take a look →", "isl-btn isl-btn--go")}<button type="button" class="isl-btn js-panel" data-p="workshop">All projects</button></p>`,
      garden: () => { const sk = (site().bench && site().bench.skills) || [];
        return `<p class="isl-kicker">🌱 Skill Garden</p><h2 id="isl-sheet-h" class="isl-h">What Vyom can do</h2>
        ${sk.map((g) => `<div class="isl-group"><h3>${esc(g.group)}</h3><ul class="isl-chips">${(g.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
        <p class="isl-more">${link("/machine", "Open the full skills page →", "isl-btn isl-btn--go")}</p>`; },
      house: () => { const a = site().about || {}, b = site().bench || {};
        return `<p class="isl-kicker">🏡 Vyom's House</p><h2 id="isl-sheet-h" class="isl-h">Hi, I'm ${esc(site().first || "Vyom")}</h2>
        ${(a.letter || []).map((p) => `<p>${esc(p)}</p>`).join("")}
        ${(a.journey || []).length ? `<ol class="isl-route">${a.journey.map((j) => `<li><b>${esc(j.place)}</b><span>${esc(j.years)} · ${esc(j.note)}</span></li>`).join("")}</ol>` : ""}
        ${(b.experience || []).length ? `<h3 class="isl-h3">Where I've worked</h3><ul class="isl-time">${b.experience.map((x) => `<li><span class="isl-meta">${esc(x.when)}</span><b>${esc(x.role)} · ${esc(x.org)}</b><p>${esc(x.text)}</p></li>`).join("")}</ul>` : ""}
        ${(a.awards || []).length ? `<ul class="isl-chips">${a.awards.map((x) => `<li>🏅 ${esc(x.title)}</li>`).join("")}</ul>` : ""}
        <p class="isl-more">${link("/resume", "Get the résumé", "isl-btn isl-btn--go")}${link("/about", "Read the full story →")}</p>`; },
      post: () => { const s = site(), so = s.socials || [];
        return `<p class="isl-kicker">📮 Post Office</p><h2 id="isl-sheet-h" class="isl-h">Say hello to Vyom</h2><p class="isl-lede">Jobs, projects, questions or just a hi. Every message gets read.</p>
        <div class="isl-contact"><button type="button" class="isl-big js-mail"><span aria-hidden="true">✉️</span><b>Email</b><small class="js-mail-addr">Tap to show the address</small></button>
        ${s.cal ? `<a class="isl-big" href="https://cal.com/${esc(s.cal)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📅</span><b>Book a call</b><small>15 minutes, free</small></a>` : ""}
        ${so.map((x) => { const h = safeHref(x.url); return h ? `<a class="isl-big" href="${esc(h)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">${x.icon === "github" ? "🐙" : x.icon === "linkedin" ? "💼" : "🐦"}</span><b>${esc(x.label)}</b><small>${esc(h.replace(/^https:\/\/(www\.)?/, ""))}</small></a>` : ""; }).join("")}
        <a class="isl-big" href="/resume"><span aria-hidden="true">📄</span><b>Résumé</b><small>one page, printable</small></a></div>
        <p class="isl-more">${link("/contact", "Write a letter on the contact page →", "isl-btn isl-btn--go")}</p>`; },
      arcade: () => { const lab = site().lab || [];
        return `<p class="isl-kicker">🕹️ The Arcade</p><h2 id="isl-sheet-h" class="isl-h">Games and toys</h2>
        <div class="isl-contact"><button type="button" class="isl-big js-game" data-g="packets"><span aria-hidden="true">📦</span><b>Packet Catch</b><small>catch the good messages</small></button>
        <button type="button" class="isl-big js-game" data-g="bits"><span aria-hidden="true">💡</span><b>Bit Flip</b><small>count like a computer</small></button>
        <a class="isl-big" href="/board"><span aria-hidden="true">🔌</span><b>The Board</b><small>flip real-looking switches</small></a>
        <a class="isl-big" href="/404"><span aria-hidden="true">🧱</span><b>Breakout</b><small>the playable 404 page</small></a>
        ${lab.filter((l) => l.slug).slice(0, 6).map((l) => `<a class="isl-big" href="/lab/${esc(encodeURIComponent(l.slug))}"><span aria-hidden="true">🧪</span><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></a>`).join("")}</div>
        <p class="isl-more">${link("/lab", "Open the whole lab →", "isl-btn isl-btn--go")}</p>`; },
      busstop: () => `<p class="isl-kicker">🚌 CAN Bus Stop</p><h2 id="isl-sheet-h" class="isl-h">The CAN bus, for real</h2><p class="isl-lede">Cars are full of little computers that talk over one shared wire called a CAN bus. Vyom built a mini version with two boards: one reads the speed and temperature, the other shows it on a screen.</p><p>You can play with a copy of it right in your browser.</p>
        <p class="isl-more">${link("/lab/can-bus", "Try the CAN Bus Lab →", "isl-btn isl-btn--go")}<button type="button" class="isl-btn js-ride">Ride the island bus</button></p>`,
      plaza: () => { const n = site().now || {};
        return `<p class="isl-kicker">📡 Welcome Plaza</p><h2 id="isl-sheet-h" class="isl-h">What Vyom's up to now</h2>
        ${["building", "learning", "next"].map((k) => (n[k] || []).length ? `<div class="isl-group"><h3>${{ building: "Building", learning: "Learning", next: "Up next" }[k]}</h3><ul class="isl-list">${n[k].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "").join("")}
        <p class="isl-more">${link("/now", "The full now page →", "isl-btn isl-btn--go")}</p>`; },
    };
    const panel = (id, data) => { const f = PANELS[id]; if (!f) return; openSheet("panel", f(data), "isl-sheet--panel"); if (id === "post") unlock("letter"); if (id === "project") unlock("project"); };
    body.addEventListener("click", (e) => {
      const p = e.target.closest(".js-panel"); if (p) return panel(p.dataset.p);
      const g = e.target.closest(".js-game"); if (g) return openGame(g.dataset.g);
      if (e.target.closest(".js-ride")) { closeSheet(); return ride(); }
      if (e.target.closest(".js-mail")) return showMail(e.target.closest(".js-mail"));
      const lk = e.target.closest(".js-look"); if (lk) return setLook(lk.dataset.k, lk.dataset.v);
      if (e.target.closest(".js-rand")) { Object.keys(LOOKS).forEach((k) => setLook(k, LOOKS[k][Math.random() * LOOKS[k].length | 0], true)); styleSheet(); return; }
      if (e.target.closest(".js-done")) return closeSheet();
      const zb = e.target.closest(".js-travel"); if (zb) { closeSheet(); unlock("map"); return travel(zb.dataset.zone); }
      if (e.target.closest(".js-reset")) { if (confirm("Reset your island progress and look?")) { save.ach = {}; save.look = { ...DEFAULT_LOOK }; save.intro = false; persist(); location.reload(); } }
    });
    const mailAddr = () => { try { return atob((site().emailEncoded) || ""); } catch (e) { return ""; } };
    function showMail(b) {
      const a = mailAddr(); if (!a) return;
      b.querySelector(".js-mail-addr").textContent = a;
      if (!b.nextElementSibling || !b.nextElementSibling.classList.contains("js-mail-acts")) {
        const row = D.createElement("div"); row.className = "isl-row js-mail-acts";
        row.innerHTML = `<a class="isl-btn isl-btn--go" href="mailto:${esc(a)}">Open my mail app</a><button type="button" class="isl-btn js-copy">Copy address</button>`;
        row.querySelector(".js-copy").onclick = (e) => { navigator.clipboard && navigator.clipboard.writeText(a).then(() => (e.target.textContent = "Copied!")).catch(() => {}); };
        b.after(row);
      }
    }

    /* avatar maker */
    const LABEL = { hat: { none: "✖ None", cap: "🧢 Cap", beanie: "🧶 Beanie", hardhat: "⛑️ Hard hat", headphones: "🎧 Headphones", crown: "👑 Crown" }, face: { smile: "😊 Smile", grin: "😁 Grin", cool: "😎 Cool", wow: "😮 Wow" }, extra: { none: "✖ None", backpack: "🎒 Backpack", scarf: "🧣 Scarf", cape: "🦸 Cape" } };
    function setLook(k, v, quiet) { save.look[k] = v; player.setLook({ [k]: v }); persist(); if (!quiet) { sound.click(); body.querySelectorAll(`.js-look[data-k="${k}"]`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v))); } }
    function styleSheet() {
      const row = (k, title, swatch) => `<fieldset class="isl-opt"><legend>${title}</legend><div>${LOOKS[k].map((v) => swatch ? `<button type="button" class="isl-sw js-look" data-k="${k}" data-v="${v}" style="--c:${v}" aria-pressed="${save.look[k] === v}" aria-label="${title} ${v}"></button>` : `<button type="button" class="isl-chip js-look" data-k="${k}" data-v="${v}" aria-pressed="${save.look[k] === v}">${LABEL[k][v]}</button>`).join("")}</div></fieldset>`;
      openSheet("style", `<p class="isl-kicker">🧢 Avatar maker</p><h2 id="isl-sheet-h" class="isl-h">Make it yours</h2>
        ${row("body", "Outfit", true)}${row("skin", "Skin", true)}${row("hat", "Hat")}${row("hatColor", "Hat colour", true)}${row("face", "Face")}${row("extra", "Extra")}
        <p class="isl-more"><button type="button" class="isl-btn js-rand">🎲 Surprise me</button><button type="button" class="isl-btn isl-btn--go js-done">Looking good!</button></p>`, "isl-sheet--side");
      S.mode = "style";
    }

    /* progress */
    function dashSheet() {
      const n = Object.keys(save.ach).length, p = Math.round((n / ACH.length) * 100);
      openSheet("dash", `<p class="isl-kicker">🏆 Your progress</p><h2 id="isl-sheet-h" class="isl-h">${n} of ${ACH.length} achievements</h2>
        <div class="isl-prog"><span style="width:${p}%"></span><b>${p}%</b></div>
        <ul class="isl-ach">${ACH.map((a) => `<li class="${save.ach[a.id] ? "is-got" : ""}"><span aria-hidden="true">${save.ach[a.id] ? a.icon : "🔒"}</span><div><b>${esc(a.title)}</b><small>${esc(a.text)}</small></div>${save.ach[a.id] ? '<em class="sr-only">unlocked</em>' : '<em class="sr-only">locked</em>'}</li>`).join("")}</ul>
        <p class="isl-more"><button type="button" class="isl-btn js-reset">Start over</button></p>`, "isl-sheet--panel");
    }

    /* map */
    const toMap = (x, z, w, h) => [w / 2 + (x / 52) * (w / 2), h / 2 + (z / 52) * (h / 2)];
    function drawMap(cv, big) {
      const g = cv.getContext("2d"), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
      g.fillStyle = "#6fe3f0"; g.fillRect(0, 0, w, h);
      const shape = (grow, col) => { g.beginPath(); for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2, r = islandR(a) + grow; const [x, y] = toMap(Math.cos(a) * r, Math.sin(a) * r, w, h); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.fillStyle = col; g.fill(); };
      shape(5.5, "#f6dfa0"); shape(0, "#72d65e");
      g.strokeStyle = "#5f6f8f"; g.lineWidth = Math.max(2, w / 90); g.beginPath(); const [cx, cy] = toMap(0, 0, w, h); g.arc(cx, cy, (ROAD / 52) * (w / 2), 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#f8edd2"; g.lineWidth = Math.max(2, w / 70); ZONES.slice(1).forEach((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], w, h); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); });
      ZONES.forEach((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], w, h); g.fillStyle = z.color; g.beginPath(); g.arc(x, y, big ? w / 34 : 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = big ? 4 : 1.5; g.stroke(); });
      const p = player.root.position, [px, py] = toMap(p.x, p.z, w, h); g.fillStyle = "#1d1a4f"; g.beginPath(); g.arc(px, py, big ? w / 60 : 3.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
    }
    function mapSheet() {
      openSheet("map", `<p class="isl-kicker">🧭 Island map</p><h2 id="isl-sheet-h" class="isl-h">Where to?</h2>
        <div class="isl-bigmap"><canvas width="720" height="720" aria-hidden="true"></canvas>${ZONES.map((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], 100, 100); return `<button type="button" class="isl-pin js-travel" data-zone="${z.id}" style="left:${x}%;top:${y}%;--c:${z.color}"><span aria-hidden="true">${z.icon}</span>${esc(z.name)}</button>`; }).join("")}</div>`, "isl-sheet--map");
      drawMap(body.querySelector("canvas"), true);
    }

    /* games */
    async function openGame(id) {
      const { packetCatch, bitFlip } = await import("./games.js");
      const title = id === "bits" ? "💡 Bit Flip" : "📦 Packet Catch";
      openSheet("game", `<p class="isl-kicker">🕹️ Arcade</p><h2 id="isl-sheet-h" class="isl-h">${title}</h2><div class="gm"></div><p class="isl-more"><button type="button" class="isl-btn isl-btn--go js-again">Play again</button><button type="button" class="isl-btn js-panel" data-p="arcade">More games</button></p>`, "isl-sheet--game");
      const box = body.querySelector(".gm");
      const start = () => { game && game.destroy(); game = (id === "bits" ? bitFlip : packetCatch)(box, { onEnd: (n) => { if (id === "packets" && n >= 15) unlock("packets"); if (id === "bits" && n >= 3) unlock("bits"); } }); };
      body.querySelector(".js-again").onclick = start; start();
    }

    /* ---------- acts from dialog choices ---------- */
    function act(a) {
      const z = S.near && S.near.id;
      if (a === "style") return styleSheet();
      if (a === "map") return mapSheet();
      if (a === "panel") return panel(z || "plaza");
      if (a === "ride") return ride();
      if (a === "resume") return (location.href = "/resume");
      if (a === "go") return (location.href = (zone(z) || ZONES[0]).href);
      if (a && a.startsWith("game:")) return openGame(a.slice(5));
      if (a === "skip") { save.intro = true; persist(); }
    }

    /* ---------- moving around ---------- */
    function walkTo(v, then = null) { S.target = v.clone(); S.target.y = 0; S.onArrive = then; marker.position.set(v.x, 0.08, v.z); marker.material.opacity = 0.9; marker.scale.setScalar(1.6); }
    function travel(id) {
      const z = zone(id); if (!z) return; const n = npcs[id];
      const dest = n.spot.stand.clone();
      const far = dest.distanceTo(player.root.position) > 30;
      const arrive = () => talkTo(id);
      if (far || REDUCED) { fade(() => { player.root.position.copy(dest); S.camPos.set(dest.x, 30, dest.z + 30); S.target = null; sound.whoosh(); arrive(); }); }
      else walkTo(dest, arrive);
    }
    function fade(mid) { const f = $(".isl-fade"); f.classList.add("is-on"); setTimeout(() => { mid(); setTimeout(() => f.classList.remove("is-on"), 120); }, 320); }
    function talkTo(id) {
      const z = zone(id); if (!z) return; S.near = z; unlock("visit-" + id);
      const n = npcs[id]; S.mode = "talk"; S.talkWith = n;
      frameTalk(n);
      say((LINES[id] || LINES.plaza)(), z.npc.name, z.npc.voice);
    }
    function frameTalk(n) {
      S.mode = "talk"; S.talkWith = n;
      const o = n.bot ? bot.root.position : n.who.root.position, pp = player.root.position;
      const base = Math.atan2(o.x - pp.x, o.z - pp.z);
      const turn = (a) => Math.atan2(Math.sin(a - S.yaw), Math.cos(a - S.yaw));
      const a1 = turn(base + Math.PI / 2), a2 = turn(base - Math.PI / 2);
      S.yawT = S.yaw + (Math.abs(a1) <= Math.abs(a2) ? a1 : a2) * 0.75;
      if (!n.bot) player.root.rotation.y = base;
    }
    function ride() {
      unlock("visit-busstop");
      fade(() => { player.root.visible = false; W.busState.riding = true; S.rideFrom = W.busState.a; S.mode = "bus"; sound.honk(); });
    }

    /* ---------- input ---------- */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const pointers = new Map(); let downAt = null, dragged = false, pinch = 0;
    canvas.addEventListener("pointerdown", (e) => { pointers.set(e.pointerId, [e.clientX, e.clientY]); downAt = [e.clientX, e.clientY]; dragged = false; canvas.setPointerCapture(e.pointerId); if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    canvas.addEventListener("pointermove", (e) => {
      if (!pointers.has(e.pointerId)) return; const prev = pointers.get(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); S.distT = Math.min(40, Math.max(9, S.distT * (pinch / Math.max(1, d)))); pinch = d; dragged = true; return; }
      if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 7) dragged = true;
      if (dragged && S.mode !== "intro") { S.yawT -= (e.clientX - prev[0]) * 0.006; S.pitchT = Math.min(1.35, Math.max(0.35, S.pitchT + (e.clientY - prev[1]) * 0.004)); }
    });
    const up = (e) => { pointers.delete(e.pointerId); if (!dragged && downAt && S.mode !== "intro" && S.mode !== "bus") pick(e.clientX, e.clientY); downAt = null; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", (e) => pointers.delete(e.pointerId));
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); S.distT = Math.min(40, Math.max(9, S.distT * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
    function pick(x, y) {
      ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
      const objs = W.clickables.map((c) => c.obj).concat(Object.values(npcs).map((n) => n.who.root));
      const hit = ray.intersectObjects(objs, true)[0];
      if (hit) {
        let o = hit.object; while (o && !objs.includes(o)) o = o.parent;
        const c = W.clickables.find((k) => k.obj === o);
        if (c) return clickThing(c);
        const n = Object.values(npcs).find((k) => k.who.root === o);
        if (n) return travel(n.z.id);
      }
      const p = ray.ray.intersectPlane(ground, tmpV);
      if (p) { const a = Math.atan2(p.z, p.x), d = Math.hypot(p.x, p.z), m = islandR(a) - 1.4; if (d > m) p.multiplyScalar(m / d); walkTo(p); sound.click(); }
    }
    function clickThing(c) {
      const wp = new THREE.Vector3(); c.obj.getWorldPosition(wp);
      const dir = new THREE.Vector3().subVectors(player.root.position, wp).setY(0); if (dir.lengthSq() < 0.01) dir.set(0, 0, 1); dir.normalize();
      const spot = wp.clone().addScaledVector(dir, 2.4);
      if (c.kind === "tower") { S.towerTaps++; sound.tone(600 + S.towerTaps * 120, 0.1, "square", 0.05); W.beacon.scale.setScalar(1.8); setTimeout(() => W.beacon.scale.setScalar(1), 150); if (S.towerTaps >= 5) unlock("tower"); return; }
      walkTo(spot, () => {
        if (c.kind === "project") panel("project", c.data);
        if (c.kind === "skill") panel("garden");
        if (c.kind === "game") openGame(c.data);
        if (c.kind === "letter") panel("post");
      });
    }
    addEventListener("keydown", (e) => {
      if (S.mode === "intro") return;
      if (e.key === "Escape") { if (!sheet.hidden) closeSheet(); else if (!dlg.hidden) endDialog(); return; }
      if (e.target.closest && e.target.closest("input, textarea, select")) return;
      if (!sheet.hidden) return;
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) { if (!dlg.hidden && k.startsWith("arrow")) return; S.keys.add(k); S.target = null; if (k.startsWith("arrow")) e.preventDefault(); }
      if (k === "e" && S.near && dlg.hidden) talkTo(S.near.id);
    });
    addEventListener("keyup", (e) => S.keys.delete(e.key.toLowerCase()));
    addEventListener("blur", () => S.keys.clear());

    /* ---------- buttons ---------- */
    ui.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("js-dash")) return dashSheet();
      if (b.classList.contains("js-map")) return mapSheet();
      if (b.classList.contains("js-style")) return styleSheet();
      if (b.classList.contains("js-hire")) return panel("post");
      if (b.classList.contains("js-home")) return travel("plaza");
      if (b.classList.contains("js-goto")) return travel(b.dataset.zone);
      if (b.classList.contains("js-label")) return travel(b.dataset.zone);
      if (b.classList.contains("js-email")) { panel("post"); const m = body.querySelector(".js-mail"); m && showMail(m); return; }
      if (b.classList.contains("js-sound")) { const on = sound.toggle(); b.setAttribute("aria-pressed", String(on)); b.firstElementChild.textContent = on ? "🔊" : "🔇"; return; }
      if (b.classList.contains("js-night")) { const dark = html.getAttribute("data-theme") !== "dark"; window.V && window.V.setTheme ? window.V.setTheme(dark ? "dark" : "light") : html.setAttribute("data-theme", dark ? "dark" : "light"); return; }
      if (b.classList.contains("isl-prompt__b") && S.near) return talkTo(S.near.id);
    });
    const soundBtn = $(".js-sound"); soundBtn.setAttribute("aria-pressed", String(sound.on)); soundBtn.firstElementChild.textContent = sound.on ? "🔊" : "🔇";
    let nightT = html.getAttribute("data-theme") === "dark" ? 1 : 0, nightK = nightT;
    const syncNight = () => { const dark = html.getAttribute("data-theme") === "dark"; nightT = dark ? 1 : 0; const b = $(".js-night"); b.setAttribute("aria-pressed", String(dark)); b.setAttribute("aria-label", dark ? "Switch to day" : "Switch to night"); b.firstElementChild.textContent = dark ? "☀️" : "🌙"; if (dark && S.mode !== "intro") unlock("night"); };
    D.addEventListener("vg:theme", syncNight); syncNight(); W.setNight(nightK);

    /* labels over each place */
    const labels = $(".isl-labels");
    const lab = ZONES.map((z) => { const b = D.createElement("button"); b.type = "button"; b.className = "isl-label js-label"; b.dataset.zone = z.id; b.style.setProperty("--c", z.color); b.innerHTML = `<span aria-hidden="true">${z.icon}</span>${esc(z.name)}`; labels.append(b); return { b, z, v: W.anchors[z.id] }; });
    const prompt = $(".isl-prompt"), promptB = $(".isl-prompt__b");

    /* ---------- enter ---------- */
    goal = 100;
    enterBtn.addEventListener("click", () => {
      sound.start(); sound.pop();
      ui.querySelector(".isl-load").classList.add("is-out");
      setTimeout(() => ui.querySelector(".isl-load").remove(), 900);
      html.classList.add("isl-in");
      S.mode = "follow"; S.yaw = S.yawT = 0;
      unlock("hello");
      setTimeout(() => {
        if (!save.intro) frameTalk(npcs.plaza); if (!save.intro) say(LINES.intro(), "VY-01", 880, () => { save.intro = true; persist(); });
        else { S.near = ZONES[0]; }
      }, REDUCED ? 100 : 1300);
    }, { once: true });

    /* ---------- loop ---------- */
    const mini = $(".isl-mini");
    let last = performance.now(), raf = 0, frameN = 0;
    const fwd = new THREE.Vector3(), mv = new THREE.Vector3();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt; frameN++;
      gov.frame(dt);
      W.update(dt, S.t);
      nightK += (nightT - nightK) * Math.min(1, dt * 2); if (Math.abs(nightT - nightK) > 0.002) W.setNight(nightK);

      /* walking */
      mv.set(0, 0, 0);
      if (S.keys.size && S.mode !== "bus" && dlg.hidden) {
        fwd.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw));
        const r = new THREE.Vector3(-fwd.z, 0, fwd.x);
        if (S.keys.has("w") || S.keys.has("arrowup")) mv.add(fwd);
        if (S.keys.has("s") || S.keys.has("arrowdown")) mv.sub(fwd);
        if (S.keys.has("d") || S.keys.has("arrowright")) mv.add(r);
        if (S.keys.has("a") || S.keys.has("arrowleft")) mv.sub(r);
        if (mv.lengthSq()) { mv.normalize(); unlock("steps"); }
      } else if (S.target && S.mode !== "bus") {
        mv.subVectors(S.target, player.root.position).setY(0);
        const d = mv.length();
        if (d < 0.35) { S.target = null; marker.material.opacity = 0; mv.set(0, 0, 0); const f = S.onArrive; S.onArrive = null; if (f) f(); else unlock("steps"); }
        else mv.divideScalar(d);
      }
      const p = player.root.position;
      const far = S.target ? S.target.distanceTo(p) : 0;
      const speed = mv.lengthSq() ? (far > 18 ? 11 : 7.5) : 0;
      S.speed += (speed - S.speed) * Math.min(1, dt * 10);
      if (speed) {
        const before = p.clone();
        p.addScaledVector(mv, S.speed * dt);
        for (const c of W.colliders) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.45; if (d < m && d > 1e-4) { p.x = c.x + (dx / d) * m; p.z = c.z + (dz / d) * m; } }
        const bp = W.bus.position, bd = Math.hypot(p.x - bp.x, p.z - bp.z); if (bd < 3) { p.x = bp.x + (p.x - bp.x) / bd * 3; p.z = bp.z + (p.z - bp.z) / bd * 3; }
        const a = Math.atan2(p.z, p.x), d = Math.hypot(p.x, p.z), lim = islandR(a) - 1.2; if (d > lim) p.multiplyScalar(lim / d);
        const want = Math.atan2(mv.x, mv.z); let dr = want - player.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); player.root.rotation.y += dr * Math.min(1, dt * 12);
        if (S.target && before.distanceTo(p) < S.speed * dt * 0.15) { S.stuck = (S.stuck || 0) + dt; if (S.stuck > 0.6) { S.target = null; marker.material.opacity = 0; S.stuck = 0; } } else S.stuck = 0;
        S.stepT -= dt; if (S.stepT < 0) { sound.step(); S.stepT = 0.32; }
      }
      player.update(dt, S.t, speed ? S.speed : 0);
      player.talking = false;
      if (marker.material.opacity > 0) { marker.scale.setScalar(Math.max(1, marker.scale.x - dt * 2)); marker.rotation.z += dt * 2; }

      /* nearby place */
      let near = null;
      for (const z of ZONES) { const n = npcs[z.id]; const ref = z.id === "plaza" ? new THREE.Vector3(0, 0, 0) : n.spot.pos; const lim = z.id === "plaza" ? 9.5 : 4.2; if (Math.hypot(p.x - ref.x, p.z - ref.z) < lim) { near = z; break; } }
      if (near !== S.nearSeen) {
        S.nearSeen = near; if (near) S.near = near;
        if (near && S.mode === "follow" && !save.ach["visit-" + near.id] && dlg.hidden && sheet.hidden && near.id !== "plaza") talkTo(near.id);
      }
      const showPrompt = near && dlg.hidden && sheet.hidden && S.mode === "follow";
      if (showPrompt) { const t = `Talk to ${near.npc.name}`; if (promptB.textContent !== t) promptB.textContent = t; }
      prompt.hidden = !showPrompt;

      /* characters */
      Object.values(npcs).forEach((n) => {
        if (n.bot) return;
        const who = n.who, wp = who.root.position;
        const close = Math.hypot(p.x - wp.x, p.z - wp.z) < 7;
        const want = close ? Math.atan2(p.x - wp.x, p.z - wp.z) : n.home;
        let dr = want - who.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); who.root.rotation.y += dr * Math.min(1, dt * 5);
        who.talking = S.talking === n.z.npc.name;
        who.update(dt, S.t, 0);
      });
      // VY-01 tags along beside you
      const bp = bot.root.position, side = new THREE.Vector3(Math.cos(player.root.rotation.y) * 1.9, 0, -Math.sin(player.root.rotation.y) * 1.9);
      const bt = S.mode === "style" ? p.clone().add(new THREE.Vector3(-Math.sin(player.root.rotation.y) * 3 + side.x, 0, -Math.cos(player.root.rotation.y) * 3 + side.z)) : S.mode === "bus" ? W.bus.position.clone().add(new THREE.Vector3(0, 3.2, 0)) : p.clone().add(side).add(new THREE.Vector3(-Math.sin(player.root.rotation.y) * 1.2, 0, -Math.cos(player.root.rotation.y) * 1.2));
      const bv = bt.clone().sub(bp); const bspd = bv.length();
      bp.addScaledVector(bv, Math.min(1, dt * 2.2));
      const look = S.talking === "VY-01" ? Math.atan2(p.x - bp.x, p.z - bp.z) : bspd > 0.6 ? Math.atan2(bv.x, bv.z) : Math.atan2(p.x - bp.x, p.z - bp.z);
      let br = look - bot.root.rotation.y; br = Math.atan2(Math.sin(br), Math.cos(br)); bot.root.rotation.y += br * Math.min(1, dt * 4);
      bot.talking = S.talking === "VY-01"; bot.update(dt, S.t, bspd);

      /* bus ride */
      if (S.mode === "bus" && W.busState.a - S.rideFrom > Math.PI * 2 - 0.05) {
        W.busState.riding = false; S.mode = "follow";
        fade(() => { const st = npcs.busstop.spot.stand; player.root.position.copy(st); player.root.visible = true; unlock("bus"); say(LINES.bus_done(), "Captain Bus", 300); });
      }

      /* camera */
      S.yaw += (S.yawT - S.yaw) * Math.min(1, dt * 6); S.pitch += (S.pitchT - S.pitch) * Math.min(1, dt * 6); S.dist += (S.distT - S.dist) * Math.min(1, dt * 5);
      let look3, pos3;
      if (S.mode === "intro") {
        const a = S.t * 0.06; look3 = tmpL.set(0, 0, 0); pos3 = tmpV.set(Math.sin(a) * 95, 62, Math.cos(a) * 95);
      } else if (S.mode === "bus") {
        const b = W.bus.position, a = W.busState.a; look3 = tmpL.copy(b).setY(1.5); pos3 = tmpV.set(Math.cos(a) * (ROAD + 16), 13, Math.sin(a) * (ROAD + 16)).add(new THREE.Vector3(Math.sin(a) * 8, 0, -Math.cos(a) * 8));
      } else if (S.mode === "style") {
        const fy = player.root.rotation.y, wide = innerWidth > 760, sx = wide ? 3.2 : 0; look3 = tmpL.set(p.x + Math.cos(fy) * sx, wide ? 1.5 : -0.4, p.z - Math.sin(fy) * sx); pos3 = tmpV.set(p.x + Math.sin(fy) * 10 + Math.cos(fy) * sx, 3.6, p.z + Math.cos(fy) * 10 - Math.sin(fy) * sx);
      } else if (S.mode === "talk" && S.talkWith) {
        const o = S.talkWith.bot ? bp : S.talkWith.who.root.position; const mid = p.clone().lerp(o, 0.5);
        const narrow = innerWidth < innerHeight; look3 = tmpL.copy(mid).setY(narrow ? -2.6 : -1.6); const d = narrow ? 22 : 17, pt = 0.68; pos3 = tmpV.set(mid.x + Math.sin(S.yaw) * Math.cos(pt) * d, 1.8 + Math.sin(pt) * d, mid.z + Math.cos(S.yaw) * Math.cos(pt) * d);
      } else {
        look3 = tmpL.copy(p).setY(1.4); pos3 = tmpV.set(p.x + Math.sin(S.yaw) * Math.cos(S.pitch) * S.dist, 1.4 + Math.sin(S.pitch) * S.dist, p.z + Math.cos(S.yaw) * Math.cos(S.pitch) * S.dist);
      }
      const k = REDUCED ? 1 : Math.min(1, dt * (S.mode === "intro" ? 1 : 3.2));
      S.camPos.lerp(pos3, k); S.camLook.lerp(look3, k);
      camera.position.copy(S.camPos); camera.lookAt(S.camLook);

      /* labels */
      const showLabels = S.mode !== "intro" && S.mode !== "style";
      lab.forEach((l) => {
        const v = l.v.clone().project(camera); const vis = showLabels && v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
        if (!vis) { if (!l.b.hidden) l.b.hidden = true; return; }
        l.b.hidden = false;
        const dd = camera.position.distanceTo(l.v), s = Math.max(0.62, Math.min(1, 34 / dd));
        l.b.style.transform = `translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px) translate(-50%, -100%) scale(${s.toFixed(3)})`;
      });
      if (frameN % 8 === 0) drawMap(mini, false);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    const startLoop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };
    D.addEventListener("visibilitychange", () => (D.hidden ? stopLoop() : startLoop()));
    renderer.compile(scene, camera);
    startLoop();
    window.VISLAND = { scene, camera, renderer, player, S, unlock, travel, tier };
  }
}
