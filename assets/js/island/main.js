/* VYOM ISLAND: the whole website as a little world you walk around.
   Loader → Enter → VY-01 says hi → style your avatar → explore eight places.
   Every old URL (/about, /work, /contact …) opens the island at its place.
   Without WebGL2, or with Plain view on, the same content renders as a
   bright storybook page instead. */
import { ZONES, LINES, ACH, LOOKS, DEFAULT_LOOK, zone } from "./data.js";
import { sound } from "./audio.js";
import { PANELS, storybook, esc, mailAddr, ROUTE_ZONE } from "./panels.js";

const html = document.documentElement, D = document;
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
const setPlain = (v) => { try { localStorage.setItem("vg-plain", v ? "1" : "0"); } catch (e) {} };
const plainPref = () => { try { return localStorage.getItem("vg-plain") === "1"; } catch (e) { return false; } };
if (new URLSearchParams(location.search).has("plain")) setPlain(true);
const hasGL2 = (() => { try { return !!D.createElement("canvas").getContext("webgl2"); } catch (e) { return false; } })();
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
const FINE = matchMedia("(pointer: fine)").matches;
const PATH = location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
const START = D.body.dataset.zone || ROUTE_ZONE[PATH] || "plaza";
const whenSite = () => (window.SITE ? Promise.resolve(window.SITE) : window.SITE_READY || new Promise((r) => addEventListener("load", () => r(window.SITE))));
const setTheme = (dark) => { html.setAttribute("data-theme", dark ? "dark" : "light"); try { localStorage.setItem("vg-theme", dark ? "dark" : "light"); } catch (e) {} D.dispatchEvent(new CustomEvent("vg:theme", { detail: { dark } })); };

D.addEventListener("click", (e) => {
  const on = e.target.closest && e.target.closest(".js-island-on");
  if (on) { e.preventDefault(); setPlain(false); location.reload(); }
  if (e.target.closest && e.target.closest(".js-plain-link")) setPlain(true);
});

/* ============ shared: the sheet (panels, map, games, reader, progress) ============ */
function makeSheet(root, { onClose } = {}) {
  const el = D.createElement("div");
  el.className = "isl-sheet"; el.hidden = true;
  el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "isl-sheet-h");
  el.innerHTML = `<div class="isl-sheet__card glass"><button type="button" class="isl-x js-close" aria-label="Close">✕</button><div class="isl-sheet__body"></div></div>`;
  root.append(el);
  const body = el.querySelector(".isl-sheet__body");
  let opener = null, kind = "", cleanup = null;
  const api = {
    el, body, get kind() { return kind; }, get open() { return !el.hidden; },
    show(k, markup, cls = "", done = null) {
      if (cleanup) { cleanup(); cleanup = null; }
      if (el.hidden) opener = D.activeElement;
      kind = k; body.innerHTML = markup; el.className = "isl-sheet " + cls; el.hidden = false; cleanup = done;
      requestAnimationFrame(() => el.classList.add("is-on"));
      const f = body.querySelector("button, a, input, [tabindex]"); (f || el.querySelector(".js-close")).focus({ preventScroll: true });
      sound.pop();
    },
    close() {
      if (el.hidden) return;
      if (cleanup) { cleanup(); cleanup = null; }
      const was = kind; kind = "";
      el.classList.remove("is-on"); setTimeout(() => { if (!kind) { el.hidden = true; body.innerHTML = ""; } }, 260);
      onClose && onClose(was);
      opener && opener.focus && opener.focus({ preventScroll: true });
    },
  };
  el.querySelector(".js-close").onclick = () => api.close();
  el.addEventListener("click", (e) => { if (e.target === el) api.close(); });
  return api;
}

/* email, letter form and games work the same in both modes */
function wireCommon(root, sheet, extra = {}) {
  root.addEventListener("click", async (e) => {
    const t = e.target.closest && e.target.closest("button, a"); if (!t) return;
    if (t.classList.contains("js-mail")) {
      const a = mailAddr(); if (!a) return;
      t.querySelector(".js-mail-addr").textContent = a;
      if (!t.nextElementSibling || !t.nextElementSibling.classList.contains("js-mail-acts")) {
        const row = D.createElement("div"); row.className = "isl-row js-mail-acts";
        row.innerHTML = `<a class="isl-btn isl-btn--go" href="mailto:${esc(a)}">Open my mail app</a><button type="button" class="isl-btn js-copy">Copy address</button>`;
        row.querySelector(".js-copy").onclick = (ev) => { navigator.clipboard && navigator.clipboard.writeText(a).then(() => (ev.target.textContent = "Copied!")).catch(() => {}); };
        t.after(row);
      }
      extra.onMail && extra.onMail();
    }
    if (t.classList.contains("js-game")) openGame(sheet, t.dataset.g, extra.onGame);
  });
  root.addEventListener("submit", (e) => {
    const f = e.target.closest(".js-letter"); if (!f) return;
    e.preventDefault();
    const a = mailAddr(), n = f.n.value.trim(), m = f.m.value.trim(); if (!a || !n || !m) return;
    location.href = `mailto:${a}?subject=${encodeURIComponent("Hello from " + n)}&body=${encodeURIComponent(m + "\n\n— " + n)}`;
    extra.onMail && extra.onMail();
  });
}
async function openGame(sheet, id, onEnd) {
  const { packetCatch, bitFlip } = await import("./games.js");
  let game = null;
  sheet.show("game", `<p class="isl-kicker">🕹️ Arcade</p><h2 id="isl-sheet-h" class="isl-h">${id === "bits" ? "💡 Bit Flip" : "📦 Packet Catch"}</h2><div class="gm"></div><p class="isl-more"><button type="button" class="isl-btn isl-btn--go js-again">Play again</button></p>`, "isl-sheet--game", () => game && game.destroy());
  const box = sheet.body.querySelector(".gm");
  const start = () => { game && game.destroy(); game = (id === "bits" ? bitFlip : packetCatch)(box, { onEnd: (n) => onEnd && onEnd(id, n) }); };
  sheet.body.querySelector(".js-again").onclick = start; start();
}

/* ============ no-3D: the storybook ============ */
function plain() {
  html.classList.add("isl-off");
  whenSite().then(() => {
    const main = D.getElementById("main") || D.body;
    const wrap = D.createElement("div"); wrap.innerHTML = storybook(hasGL2); main.append(wrap.firstElementChild);
    const sheet = makeSheet(D.body);
    wireCommon(D.body, sheet);
    D.body.addEventListener("click", (e) => {
      const t = e.target.closest && e.target.closest("button"); if (!t) return;
      if (t.classList.contains("js-read")) location.href = t.dataset.href;
      if (t.classList.contains("js-goto")) D.getElementById("p-" + t.dataset.zone)?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      if (t.classList.contains("js-panel")) D.getElementById("p-" + t.dataset.p)?.scrollIntoView({ behavior: REDUCED ? "auto" : "smooth" });
      if (t.classList.contains("js-ride")) location.href = "/lab/can-bus";
    });
    if (START !== "plaza") D.getElementById("p-" + START)?.scrollIntoView();
    html.dataset.ready = "plain";
  }).catch(() => {});
}

if (hasGL2 && !plainPref()) boot(); else plain();

/* ============ the island ============ */
function boot() {
  html.classList.add("isl-on");
  const save = Object.assign({ look: { ...DEFAULT_LOOK }, ach: {}, intro: false, chips: [] }, store.get("vg-island", {}));
  const persist = () => store.set("vg-island", save);

  const ui = D.createElement("div");
  ui.className = "isl";
  ui.innerHTML = `
  <div class="isl-load" role="dialog" aria-modal="true" aria-labelledby="isl-name">
    <div class="isl-load__in">
      <h2 class="isl-load__name" id="isl-name"><span>V</span><span>Y</span><span>O</span><span>M</span></h2>
      <p class="isl-load__sub">Island · a portfolio you can walk around</p>
      <div class="isl-ring"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="52" class="bg"/><circle cx="60" cy="60" r="52" class="fg"/></svg>
        <b class="isl-ring__pct" aria-live="polite">0%</b>
        <button type="button" class="isl-enter" hidden>Enter</button></div>
      <p class="isl-load__note">🔊 Sound on · no cookies, no trackers · <a href="/?plain=1" class="js-plain-link">Prefer a plain page?</a></p>
    </div>
  </div>
  <header class="isl-top ihud">
    <button type="button" class="isl-logo js-home" aria-label="Back to the plaza">VYOM</button>
    <nav class="isl-nav glass" aria-label="Island">
      <button type="button" class="isl-pill js-dash" aria-label="Your progress"><span class="isl-pill__ic" aria-hidden="true">🏆</span><span class="isl-pill__t">Progress</span><b class="js-count">0/${ACH.length}</b></button>
      <button type="button" class="isl-pill js-goto" data-zone="house" aria-label="About Vyom"><span class="isl-pill__ic" aria-hidden="true">🏡</span><span class="isl-pill__t">About</span></button>
      <button type="button" class="isl-pill js-goto" data-zone="workshop" aria-label="Work"><span class="isl-pill__ic" aria-hidden="true">🛠️</span><span class="isl-pill__t">Work</span></button>
      <button type="button" class="isl-pill js-goto" data-zone="library" aria-label="Writing"><span class="isl-pill__ic" aria-hidden="true">📚</span><span class="isl-pill__t">Writing</span></button>
    </nav>
    <button type="button" class="isl-cta js-hire">Hire Vyom</button>
  </header>
  <section class="isl-dialog glass" aria-label="Conversation" hidden>
    <span class="isl-dialog__who"></span>
    <p class="isl-dialog__t" aria-hidden="true"></p>
    <p class="sr-only isl-dialog__sr" aria-live="polite"></p>
    <div class="isl-dialog__acts"></div>
  </section>
  <div class="isl-bl ihud glass">
    <button type="button" class="isl-round js-sound" aria-pressed="true" aria-label="Sound"><span aria-hidden="true">🔊</span></button>
    <button type="button" class="isl-round js-style" aria-label="Style your avatar"><span aria-hidden="true">🧢</span></button>
    <button type="button" class="isl-round js-night" aria-pressed="false" aria-label="Switch to night"><span aria-hidden="true">🌙</span></button>
  </div>
  <button type="button" class="isl-map ihud glass js-map" aria-label="Open the island map"><canvas class="isl-mini" width="150" height="96" aria-hidden="true"></canvas><span>Map</span></button>
  <div class="isl-br ihud"><button type="button" class="js-read" data-href="/resume" data-title="Résumé">Résumé</button><button type="button" class="js-email">Email</button><a href="/?plain=1" class="js-plain-link">Plain page</a></div>
  <p class="isl-hint" aria-hidden="true">Click the ground to walk · drag to look around</p>
  <div class="isl-toasts" aria-live="polite"></div>
  <div class="isl-fade" aria-hidden="true"></div>`;
  D.body.append(ui);
  html.dataset.ready = "island";
  const $ = (s) => ui.querySelector(s);
  const pct = $(".isl-ring__pct"), ring = $(".isl-ring .fg"), enterBtn = $(".isl-enter");
  let shown = 0, goal = 8;
  const loadTick = setInterval(() => { shown += (goal - shown) * 0.12 + 0.2; shown = Math.min(shown, goal); pct.textContent = Math.round(shown) + "%"; ring.style.strokeDashoffset = String(327 * (1 - shown / 100)); if (shown >= 99.5) { clearInterval(loadTick); pct.hidden = true; enterBtn.hidden = false; enterBtn.focus({ preventScroll: true }); } }, 30);

  (async () => {
    const fonts = D.fonts ? Promise.all([D.fonts.load('800 40px "Unbounded"'), D.fonts.load('600 20px "Geist"')]).catch(() => {}) : Promise.resolve();
    const mods = await Promise.all([
      import("/assets/vendor/three.module.min.js"), import("./world.js"), import("./avatar.js"), import("../world/quality.js"),
      import("./post.js"), import("./materials.js"), import("/assets/vendor/jsm/renderers/CSS3DRenderer.js"),
    ]);
    goal = 45;
    await whenSite(); await fonts;
    run(...mods);
  })().catch((e) => { console.warn("[island] off:", e && e.message); html.classList.remove("isl-on"); ui.remove(); plain(); });

  function run(THREE, { buildWorld, islandR, ROAD }, { makePerson, makeBot }, Q, { createPipeline }, M, { CSS3DRenderer, CSS3DObject }) {
    /* ---------- renderer: crisp on high-DPI screens, antialiased, sRGB ---------- */
    const canvas = D.createElement("canvas"); canvas.className = "isl-cv"; canvas.setAttribute("aria-hidden", "true");
    ui.prepend(canvas);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance", stencil: false });
    const tier = Q.detectTier(renderer.getContext());
    M.setTier(tier);
    const DPR_MAX = { high: 2, mid: 1.5, low: 1.25 }[tier];
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, DPR_MAX));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
    renderer.shadowMap.enabled = tier !== "low"; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.shadowMap.autoUpdate = false;
    const W = buildWorld(renderer, tier);
    goal = 75;
    const { scene } = W;

    /* ---------- camera: high focal length, so the island reads as a clean miniature ---------- */
    const camera = new THREE.PerspectiveCamera(30, 1, 1, 800);
    const FK = () => Math.tan(THREE.MathUtils.degToRad(15)) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const pipe = createPipeline(renderer, scene, camera, tier);
    const css3d = new CSS3DRenderer(); css3d.domElement.className = "isl-3d"; canvas.after(css3d.domElement);
    const uiScene = new THREE.Scene();
    const resize = () => {
      camera.aspect = innerWidth / Math.max(1, innerHeight); camera.fov = innerWidth < innerHeight ? 44 : 30; camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight, false); pipe.setSize(innerWidth, innerHeight); css3d.setSize(innerWidth, innerHeight);
    };
    addEventListener("resize", resize); resize();
    const gov = new Q.Governor(tier, (d) => { renderer.setPixelRatio(Math.min(d, DPR_MAX)); pipe.setSize(innerWidth, innerHeight); });

    /* ---------- studio lighting: instant procedural studio, then the real HDRI ---------- */
    let pmrem = null;
    if (tier !== "low") {
      pmrem = new THREE.PMREMGenerator(renderer);
      import("/assets/vendor/jsm/environments/RoomEnvironment.js").then(({ RoomEnvironment }) => { scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; W.useEnv(); }).catch(() => {});
    }
    const loadHDRI = () => {
      if (!pmrem) return;
      import("/assets/vendor/jsm/loaders/RGBELoader.js").then(({ RGBELoader }) => new RGBELoader().load("/assets/hdri/studio_small_09_1k.hdr", (hdr) => {
        const env = pmrem.fromEquirectangular(hdr).texture; hdr.dispose();
        const old = scene.environment; scene.environment = env; if (old && old !== env) old.dispose();
      }, undefined, () => {})).catch(() => {});
    };

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
    // chips already found on an earlier visit stay found
    const chipItems = W.chipIds.map((id) => W.spawner.items[id]);
    save.chips = (save.chips || []).filter((i) => i < chipItems.length);
    save.chips.forEach((i) => { const it = chipItems[i]; it.visible = false; it.k = 0; it.hiding = true; W.spawner.write(it); });
    renderer.shadowMap.needsUpdate = true;

    /* ---------- state ---------- */
    const S = {
      mode: "intro", yaw: 0, pitch: 0.92, dist: 30, yawT: 0, pitchT: 0.92, distT: 30,
      target: null, onArrive: null, speed: 0, keys: new Set(), near: null, nearSeen: null, talking: null, talkWith: null,
      camPos: new THREE.Vector3(0, 120, 170), camLook: new THREE.Vector3(), t: 0, stepT: 0, towerTaps: 0, rideFrom: 0, stuck: 0,
    };
    const tmpV = new THREE.Vector3(), tmpL = new THREE.Vector3();

    /* ---------- achievements ---------- */
    const count = $(".js-count");
    const refreshCount = () => (count.textContent = `${Object.keys(save.ach).filter((k) => ACH.some((a) => a.id === k)).length}/${ACH.length}`);
    refreshCount();
    const toast = (icon, small, title) => {
      const t = D.createElement("div"); t.className = "isl-toast glass";
      t.innerHTML = `<span class="isl-toast__ic" aria-hidden="true">${icon}</span><span><small>${esc(small)}</small><b>${esc(title)}</b></span>`;
      $(".isl-toasts").append(t);
      requestAnimationFrame(() => t.classList.add("is-on"));
      setTimeout(() => { t.classList.remove("is-on"); setTimeout(() => t.remove(), 450); }, 3400);
    };
    const unlock = (id) => {
      if (save.ach[id]) return; const a = ACH.find((x) => x.id === id); if (!a) return;
      save.ach[id] = Date.now(); persist(); refreshCount(); toast(a.icon, "Achievement unlocked", a.title); sound.fanfare();
      if (id.startsWith("visit-") && ZONES.every((z) => save.ach["visit-" + z.id])) setTimeout(() => { unlock("explorer"); queue(LINES.explorer(), "VY-01", 880); }, 900);
    };

    /* ---------- dialog ---------- */
    const dlg = $(".isl-dialog"), dWho = $(".isl-dialog__who"), dT = $(".isl-dialog__t"), dSr = $(".isl-dialog__sr"), dActs = $(".isl-dialog__acts");
    let steps = [], si = 0, typing = 0, typed = 0, voice = 600, after = null; const pending = [];
    const queue = (lines, who, v) => { if (!dlg.hidden) pending.push([lines, who, v]); else say(lines, who, v); };
    function say(lines, who, v = 600, done = null) { steps = lines; si = 0; voice = v; after = done; dWho.textContent = who; dlg.hidden = false; dlg.classList.remove("is-out"); S.talking = who; showStep(); }
    function showStep() {
      const st = steps[si]; typed = 0; dT.textContent = ""; dSr.textContent = st.t; dActs.innerHTML = ""; clearInterval(typing);
      const finish = () => { clearInterval(typing); typing = 0; dT.textContent = st.t; buttons(st); };
      if (REDUCED) return finish();
      typing = setInterval(() => { typed += 2; dT.textContent = st.t.slice(0, typed); if (typed % 4 === 0) sound.blip(voice); if (typed >= st.t.length) finish(); }, 28);
      dlg.onclick = (e) => { if (typing && !e.target.closest("button")) finish(); };
    }
    function buttons(st) {
      if (st.choices) st.choices.forEach((c, i) => { const b = D.createElement("button"); b.type = "button"; b.className = "isl-btn" + (i === st.choices.length - 1 ? " isl-btn--go" : ""); b.textContent = c.label; b.onclick = () => { sound.click(); endDialog(); act(c.act); }; dActs.append(b); });
      else { const b = D.createElement("button"); b.type = "button"; b.className = "isl-btn isl-btn--go"; b.textContent = si < steps.length - 1 ? "Next" : "Okay!"; b.onclick = () => { sound.click(); next(); }; dActs.append(b); }
      const g = dActs.querySelector(".isl-btn--go"); g && g.focus({ preventScroll: true });
    }
    function next() { if (si < steps.length - 1) { si++; showStep(); } else { const f = after; endDialog(); f && f(); } }
    function endDialog() {
      clearInterval(typing); typing = 0; dlg.classList.add("is-out"); S.talking = null;
      setTimeout(() => { if (dlg.classList.contains("is-out")) dlg.hidden = true; if (pending.length) say(...pending.shift()); }, 220);
      if (S.mode === "talk") S.mode = "follow";
    }

    /* ---------- sheet ---------- */
    const sheet = makeSheet(ui, { onClose: (k) => { if (k === "style") { S.mode = "follow"; unlock("style"); } } });
    const openSheet = (k, m, cls, done) => { if (!dlg.hidden) endDialog(); sheet.show(k, m, cls, done); };
    const panel = (id, data) => { const f = PANELS[id]; if (!f) return; openSheet("panel", f(data), "isl-sheet--panel"); if (id === "post") unlock("letter"); if (id === "project") unlock("project"); };
    const reader = (href, title) => {
      openSheet("reader", `<p class="isl-kicker">📖 Reading on the island</p><h2 id="isl-sheet-h" class="isl-h isl-h--sm">${esc(title)}</h2><div class="isl-reader"><iframe src="${esc(href)}?embed=1" title="${esc(title)}"></iframe></div>`, "isl-sheet--reader");
      unlock("reader");
    };
    // a section link clicked inside the reader travels to that place on the island
    addEventListener("message", (e) => {
      if (e.origin !== location.origin || !e.data || typeof e.data.islGo !== "string") return;
      const z = ROUTE_ZONE[e.data.islGo]; sheet.close(); if (z) travel(z);
    });
    wireCommon(ui, sheet, { onMail: () => unlock("letter"), onGame: (id, n) => { if (id === "packets" && n >= 15) unlock("packets"); if (id === "bits" && n >= 3) unlock("bits"); } });

    const LABEL = { hat: { none: "✖ None", cap: "🧢 Cap", beanie: "🧶 Beanie", hardhat: "⛑️ Hard hat", headphones: "🎧 Headphones", crown: "👑 Crown" }, face: { smile: "😊 Smile", grin: "😁 Grin", cool: "😎 Cool", wow: "😮 Wow" }, extra: { none: "✖ None", backpack: "🎒 Backpack", scarf: "🧣 Scarf", cape: "🦸 Cape" } };
    function setLook(k, v, quiet) { save.look[k] = v; player.setLook({ [k]: v }); persist(); if (!quiet) { sound.click(); sheet.body.querySelectorAll(`.js-look[data-k="${k}"]`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === v))); } }
    function styleSheet() {
      const row = (k, title, swatch) => `<fieldset class="isl-opt"><legend>${title}</legend><div>${LOOKS[k].map((v) => swatch ? `<button type="button" class="isl-sw js-look" data-k="${k}" data-v="${v}" style="--c:${v}" aria-pressed="${save.look[k] === v}" aria-label="${title} ${v}"></button>` : `<button type="button" class="isl-chip js-look" data-k="${k}" data-v="${v}" aria-pressed="${save.look[k] === v}">${LABEL[k][v]}</button>`).join("")}</div></fieldset>`;
      openSheet("style", `<p class="isl-kicker">🧢 Avatar maker</p><h2 id="isl-sheet-h" class="isl-h">Make it yours</h2>
        ${row("body", "Outfit", true)}${row("skin", "Skin", true)}${row("hat", "Hat")}${row("hatColor", "Hat colour", true)}${row("face", "Face")}${row("extra", "Extra")}
        <p class="isl-more"><button type="button" class="isl-btn js-rand">🎲 Surprise me</button><button type="button" class="isl-btn isl-btn--go js-done">Looking good!</button></p>`, "isl-sheet--side");
      S.mode = "style";
    }
    function dashSheet() {
      const n = ACH.filter((a) => save.ach[a.id]).length, p = Math.round((n / ACH.length) * 100);
      openSheet("dash", `<p class="isl-kicker">🏆 Your progress</p><h2 id="isl-sheet-h" class="isl-h">${n} of ${ACH.length} achievements</h2>
        <div class="isl-prog"><span style="width:${p}%"></span><b>${p}%</b></div>
        <p class="isl-meta isl-chipcount">💾 Lost chips found: ${save.chips.length} of ${chipItems.length}</p>
        <ul class="isl-ach">${ACH.map((a) => `<li class="${save.ach[a.id] ? "is-got" : ""}"><span aria-hidden="true">${save.ach[a.id] ? a.icon : "🔒"}</span><div><b>${esc(a.title)}</b><small>${esc(a.text)}</small></div><em class="sr-only">${save.ach[a.id] ? "unlocked" : "locked"}</em></li>`).join("")}</ul>
        <p class="isl-more"><button type="button" class="isl-btn js-reset">Start over</button></p>`, "isl-sheet--panel");
    }
    const toMap = (x, z, w, h) => [w / 2 + (x / 52) * (w / 2), h / 2 + (z / 52) * (h / 2)];
    function drawMap(cv, big) {
      const g = cv.getContext("2d"), w = cv.width, h = cv.height; g.clearRect(0, 0, w, h);
      g.fillStyle = "#6fe3f0"; g.fillRect(0, 0, w, h);
      const shape = (grow, col) => { g.beginPath(); for (let i = 0; i <= 96; i++) { const a = (i / 96) * Math.PI * 2, r = islandR(a) + grow; const [x, y] = toMap(Math.cos(a) * r, Math.sin(a) * r, w, h); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.fillStyle = col; g.fill(); };
      shape(5.5, "#f6dfa0"); shape(0, "#72d65e");
      const [cx, cy] = toMap(0, 0, w, h);
      g.strokeStyle = "#5f6f8f"; g.lineWidth = Math.max(2, w / 90); g.beginPath(); g.arc(cx, cy, (ROAD / 52) * (w / 2), 0, Math.PI * 2); g.stroke();
      g.strokeStyle = "#f8edd2"; g.lineWidth = Math.max(2, w / 70); ZONES.slice(1).forEach((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], w, h); g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); });
      ZONES.forEach((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], w, h); g.fillStyle = z.color; g.beginPath(); g.arc(x, y, big ? w / 34 : 5, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = big ? 4 : 1.5; g.stroke(); });
      const p = player.root.position, [px, py] = toMap(p.x, p.z, w, h); g.fillStyle = "#1d1a4f"; g.beginPath(); g.arc(px, py, big ? w / 60 : 3.5, 0, Math.PI * 2); g.fill(); g.strokeStyle = "#fff"; g.lineWidth = 2; g.stroke();
    }
    function mapSheet() {
      openSheet("map", `<p class="isl-kicker">🧭 Island map</p><h2 id="isl-sheet-h" class="isl-h">Where to?</h2>
        <div class="isl-bigmap"><canvas width="720" height="720" aria-hidden="true"></canvas>${ZONES.map((z) => { const [x, y] = toMap(z.pos[0], z.pos[1], 100, 100); return `<button type="button" class="isl-pin js-travel" data-zone="${z.id}" style="left:${x}%;top:${y}%;--c:${z.color}"><span aria-hidden="true">${z.icon}</span>${esc(z.name)}</button>`; }).join("")}</div>`, "isl-sheet--map");
      drawMap(sheet.body.querySelector("canvas"), true);
    }

    function act(a) {
      const z = S.near && S.near.id;
      if (a === "style") return styleSheet();
      if (a === "map") return mapSheet();
      if (a === "panel") return panel(z || "plaza");
      if (a && a.startsWith("panel:")) return panel(a.slice(6));
      if (a === "ride") return ride();
      if (a === "resume") return reader("/resume", "Résumé");
      if (a === "go") return reader("/lab/can-bus", "CAN Bus Lab");
      if (a && a.startsWith("game:")) return openGame(sheet, a.slice(5), (id, n) => { if (id === "packets" && n >= 15) unlock("packets"); if (id === "bits" && n >= 3) unlock("bits"); });
      if (a === "skip") { save.intro = true; persist(); }
    }

    /* ---------- moving around ---------- */
    function walkTo(v, then = null) { S.target = v.clone(); S.target.y = 0; S.onArrive = then; marker.position.set(v.x, 0.08, v.z); marker.material.opacity = 0.9; marker.scale.setScalar(1.6); }
    function fade(mid) { const f = $(".isl-fade"); f.classList.add("is-on"); setTimeout(() => { mid(); setTimeout(() => f.classList.remove("is-on"), 140); }, 320); }
    function travel(id, then) {
      const z = zone(id); if (!z) return;
      const dest = npcs[id].spot.stand.clone();
      const arrive = then || (() => talkTo(id));
      if (dest.distanceTo(player.root.position) > 30 || REDUCED) fade(() => { player.root.position.copy(dest); S.camPos.set(dest.x, 40 * FK(), dest.z + 40 * FK()); S.target = null; sound.whoosh(); arrive(); });
      else walkTo(dest, arrive);
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
    function talkTo(id) { const z = zone(id); if (!z) return; S.near = z; unlock("visit-" + id); frameTalk(npcs[id]); say((LINES[id] || LINES.plaza)(), z.npc.name, z.npc.voice); }
    function ride() { unlock("visit-busstop"); fade(() => { player.root.visible = false; W.busState.riding = true; S.rideFrom = W.busState.a; S.mode = "bus"; sound.honk(); }); }

    /* ---------- spatial UI (CSS3DRenderer): place tags, hover tooltip, talk card ---------- */
    const PX = 0.03; // CSS pixels → world units; big layout + small scale keeps text crisp
    const tags = ZONES.map((z) => {
      const el = D.createElement("div"); el.className = "isl-tag";
      el.innerHTML = `<button type="button" class="js-label" data-zone="${z.id}" style="--c:${z.color}"><span aria-hidden="true">${z.icon}</span>${esc(z.name)}</button>`;
      const o = new CSS3DObject(el); o.scale.setScalar(PX); o.position.copy(W.anchors[z.id] || new THREE.Vector3(z.pos[0], 9, z.pos[1])); uiScene.add(o);
      return { o, z, el };
    });
    const tipEl = D.createElement("div"); tipEl.className = "isl-tip glass"; tipEl.setAttribute("aria-hidden", "true");
    tipEl.innerHTML = `<span class="isl-tip__ic"></span><span><b class="isl-tip__t"></b><small class="isl-tip__s"></small></span>`;
    const tip = new CSS3DObject(tipEl); tip.scale.setScalar(PX * 0.55); tip.visible = false; uiScene.add(tip);
    const nearEl = D.createElement("div"); nearEl.className = "isl-near glass";
    nearEl.innerHTML = `<small class="isl-near__z"></small><button type="button" class="isl-near__b"></button>`;
    const nearCard = new CSS3DObject(nearEl); nearCard.scale.setScalar(PX * 0.55); nearCard.visible = false; uiScene.add(nearCard);
    const ZTIP = { plaza: "Say hi to VY-01", workshop: "Projects Vyom built", garden: "Skills, growing", busstop: "Ride the CAN bus", arcade: "Games and toys", house: "Vyom's story", post: "Say hello", library: "Posts and notes" };

    /* ---------- hover: springy scale on anything you can click ---------- */
    const springs = new Map(); // object → { k, v, goal }
    const springTo = (o, goal) => { let s = springs.get(o); if (!s) { s = { k: 1, v: 0, goal: 1 }; springs.set(o, s); } s.goal = goal; };
    const hoverables = [
      ...W.clickables.map((c) => ({ obj: c.obj, c, grow: 1.12 })),
      ...Object.values(W.zoneGroups).map((g) => ({ obj: g.obj, zone: g.id, grow: 1.035 })),
      ...Object.values(npcs).filter((n) => !n.bot).map((n) => ({ obj: n.who.root, zone: n.z.id, grow: 1.1 })),
    ];
    const hoverObjs = hoverables.map((h) => h.obj);
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    let mouse = null, hovered = null, hoverDirty = false;
    const findHover = (hit) => { let o = hit.object; while (o && !hoverObjs.includes(o)) o = o.parent; return o ? hoverables.find((h) => h.obj === o) : null; };
    function castAt(x, y) {
      ndc.set((x / innerWidth) * 2 - 1, -(y / innerHeight) * 2 + 1); ray.setFromCamera(ndc, camera);
      const chip = W.spawner.pick(ray);
      const hits = ray.intersectObjects(hoverObjs, true);
      const h = hits.length ? findHover(hits[0]) : null;
      if (chip && (!hits.length || ray.ray.origin.distanceTo(new THREE.Vector3(chip.x, 1, chip.z)) < hits[0].distance)) return { chip };
      return h ? { h, point: hits[0].point } : null;
    }
    function updateHover() {
      if (!mouse || S.mode === "intro" || S.mode === "bus" || sheet.open) { setHover(null); return; }
      setHover(castAt(mouse[0], mouse[1]));
    }
    function setHover(r) {
      const prev = hovered; hovered = r;
      if (prev && prev.h && (!r || r.h !== prev.h)) springTo(prev.h.obj, 1);
      W.spawner.hover(r && r.chip ? r.chip.id : -1);
      canvas.style.cursor = r ? "pointer" : "";
      if (!r) { tip.visible = false; return; }
      if (r.h) springTo(r.h.obj, r.h.grow);
      let icon = "✨", title = "", sub = "", pos = null;
      if (r.chip) { icon = "💾"; title = "Lost chip"; sub = "Walk over it to pick it up"; pos = new THREE.Vector3(r.chip.x, 3.2, r.chip.z); }
      else if (r.h.zone) { const z = zone(r.h.zone); icon = z.icon; title = z.name; sub = ZTIP[z.id] || "Click to visit"; pos = r.point.clone(); pos.y += 2.6; }
      else { const c = r.h.c; const wp = new THREE.Vector3(); c.obj.getWorldPosition(wp); pos = wp.setY(wp.y + 4.2);
        ({ project: () => { icon = "🔎"; title = c.data.title; sub = "Open this project"; }, skill: () => { icon = "🌱"; title = c.data.group; sub = "See the skills"; }, game: () => { icon = "🕹️"; title = c.data === "bits" ? "Bit Flip" : "Packet Catch"; sub = "Play a round"; }, letter: () => { icon = "📮"; title = "Mailbox"; sub = "Write to Vyom"; }, library: () => { icon = "📚"; title = "Book pile"; sub = "Read the posts"; }, tower: () => { icon = "📶"; title = "Signal tower"; sub = "Tap it. Then tap it again."; } }[c.kind] || (() => {}))(); }
      tipEl.querySelector(".isl-tip__ic").textContent = icon; tipEl.querySelector(".isl-tip__t").textContent = title; tipEl.querySelector(".isl-tip__s").textContent = sub;
      tip.position.copy(pos); tip.visible = true; tipEl.classList.remove("is-pop"); void tipEl.offsetWidth; tipEl.classList.add("is-pop");
    }

    /* ---------- input ---------- */
    const pointers = new Map(); let downAt = null, dragged = false, pinch = 0;
    canvas.addEventListener("pointerdown", (e) => { pointers.set(e.pointerId, [e.clientX, e.clientY]); downAt = [e.clientX, e.clientY]; dragged = false; canvas.setPointerCapture(e.pointerId); if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = Math.hypot(a[0] - b[0], a[1] - b[1]); } });
    canvas.addEventListener("pointermove", (e) => {
      if (e.pointerType === "mouse") { mouse = [e.clientX, e.clientY]; hoverDirty = true; }
      if (!pointers.has(e.pointerId)) return; const prev = pointers.get(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]);
      if (pointers.size === 2) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); S.distT = Math.min(58, Math.max(13, S.distT * (pinch / Math.max(1, d)))); pinch = d; dragged = true; return; }
      if (Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 7) dragged = true;
      if (dragged && S.mode !== "intro") { S.yawT -= (e.clientX - prev[0]) * 0.006; S.pitchT = Math.min(1.35, Math.max(0.42, S.pitchT + (e.clientY - prev[1]) * 0.004)); }
    });
    canvas.addEventListener("pointerleave", () => { mouse = null; hoverDirty = true; });
    const up = (e) => { pointers.delete(e.pointerId); if (!dragged && downAt && S.mode !== "intro" && S.mode !== "bus") pick(e.clientX, e.clientY); downAt = null; };
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", (e) => pointers.delete(e.pointerId));
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); S.distT = Math.min(58, Math.max(13, S.distT * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
    function pick(x, y) {
      const r = castAt(x, y);
      if (r && r.chip) { const c = r.chip; W.shock(c.x, c.z, S.t, 0.6); return walkTo(new THREE.Vector3(c.x, 0, c.z)); }
      if (r && r.h) {
        if (r.h.zone) { W.shock(r.point.x, r.point.z, S.t, 0.7); return travel(r.h.zone); }
        return clickThing(r.h.c);
      }
      const p = ray.ray.intersectPlane(ground, tmpV);
      if (p) { const a = Math.atan2(p.z, p.x), d = Math.hypot(p.x, p.z), m = islandR(a) - 1.4; if (d > m) p.multiplyScalar(m / d); W.shock(p.x, p.z, S.t, 1); walkTo(p); sound.click(); }
    }
    function clickThing(c) {
      const wp = new THREE.Vector3(); c.obj.getWorldPosition(wp);
      W.shock(wp.x, wp.z, S.t, 0.7);
      if (c.kind === "tower") { S.towerTaps++; sound.tone(600 + S.towerTaps * 120, 0.1, "square", 0.05); springs.set(c.obj, { k: 1.25, v: 0, goal: 1 }); if (S.towerTaps >= 5) unlock("tower"); return; }
      const dir = new THREE.Vector3().subVectors(player.root.position, wp).setY(0); if (dir.lengthSq() < 0.01) dir.set(0, 0, 1); dir.normalize();
      walkTo(wp.clone().addScaledVector(dir, 2.4), () => {
        if (c.kind === "project") panel("project", c.data);
        if (c.kind === "skill") panel("garden");
        if (c.kind === "game") act("game:" + c.data);
        if (c.kind === "letter") panel("post");
        if (c.kind === "library") panel("library");
      });
    }
    addEventListener("keydown", (e) => {
      if (S.mode === "intro") return;
      if (e.key === "Escape") { if (sheet.open) sheet.close(); else if (!dlg.hidden) endDialog(); return; }
      if (e.target.closest && e.target.closest("input, textarea, select") || sheet.open) return;
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
      if (b.classList.contains("js-home")) { sheet.close(); return travel("plaza"); }
      if (b.classList.contains("js-goto") || b.classList.contains("js-label") || b.classList.contains("js-travel")) { if (b.classList.contains("js-travel")) unlock("map"); sheet.close(); return travel(b.dataset.zone); }
      if (b.classList.contains("js-read")) return reader(b.dataset.href, b.dataset.title || "Reader");
      if (b.classList.contains("js-panel")) return panel(b.dataset.p);
      if (b.classList.contains("js-ride")) { sheet.close(); return ride(); }
      if (b.classList.contains("js-look")) return setLook(b.dataset.k, b.dataset.v);
      if (b.classList.contains("js-rand")) { Object.keys(LOOKS).forEach((k) => setLook(k, LOOKS[k][Math.random() * LOOKS[k].length | 0], true)); return styleSheet(); }
      if (b.classList.contains("js-done")) return sheet.close();
      if (b.classList.contains("js-reset")) { if (confirm("Reset your island progress and look?")) { store.set("vg-island", {}); location.reload(); } return; }
      if (b.classList.contains("js-email")) { panel("post"); const m = sheet.body.querySelector(".js-mail"); m && m.click(); return; }
      if (b.classList.contains("js-sound")) { const on = sound.toggle(); b.setAttribute("aria-pressed", String(on)); b.firstElementChild.textContent = on ? "🔊" : "🔇"; return; }
      if (b.classList.contains("js-night")) return setTheme(html.getAttribute("data-theme") !== "dark");
      if (b.classList.contains("isl-near__b") && S.near) return talkTo(S.near.id);
    });
    const soundBtn = $(".js-sound"); soundBtn.setAttribute("aria-pressed", String(sound.on)); soundBtn.firstElementChild.textContent = sound.on ? "🔊" : "🔇";
    let nightT = html.getAttribute("data-theme") === "dark" ? 1 : 0, nightK = nightT;
    const syncNight = () => { const dark = html.getAttribute("data-theme") === "dark"; nightT = dark ? 1 : 0; const b = $(".js-night"); b.setAttribute("aria-pressed", String(dark)); b.setAttribute("aria-label", dark ? "Switch to day" : "Switch to night"); b.firstElementChild.textContent = dark ? "☀️" : "🌙"; if (dark && S.mode !== "intro") unlock("night"); };
    D.addEventListener("vg:theme", syncNight); syncNight(); W.setNight(nightK);

    /* the HUD steps aside while you just walk around, and comes back the moment you move the mouse */
    let idleT = 0;
    const wake = () => { html.classList.remove("isl-idle"); clearTimeout(idleT); if (FINE) idleT = setTimeout(() => { if (!sheet.open && dlg.hidden && S.mode === "follow") html.classList.add("isl-idle"); }, 4500); };
    ["pointermove", "keydown", "pointerdown"].forEach((t) => addEventListener(t, wake, { passive: true }));

    /* ---------- enter ---------- */
    goal = 100;
    enterBtn.addEventListener("click", () => {
      sound.start(); sound.pop();
      ui.querySelector(".isl-load").classList.add("is-out");
      setTimeout(() => ui.querySelector(".isl-load").remove(), 900);
      html.classList.add("isl-in"); S.mode = "follow"; S.yaw = S.yawT = 0;
      unlock("hello"); wake(); loadHDRI();
      setTimeout(() => {
        if (START !== "plaza") { const st = npcs[START].spot.stand; player.root.position.copy(st); S.camPos.set(st.x, 40, st.z + 40); talkTo(START); return; }
        if (!save.intro) { frameTalk(npcs.plaza); say(LINES.intro(), "VY-01", 880, () => { save.intro = true; persist(); }); }
        else S.near = ZONES[0];
      }, REDUCED ? 100 : 1300);
    }, { once: true });

    /* ---------- loop ---------- */
    const mini = $(".isl-mini");
    let last = performance.now(), raf = 0, frameN = 0;
    const fwd = new THREE.Vector3(), mv = new THREE.Vector3(), right = new THREE.Vector3(), ORIGIN = new THREE.Vector3();
    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; S.t += dt; frameN++;
      gov.frame(dt); pipe.tick(dt);
      W.update(dt, S.t);
      nightK += (nightT - nightK) * Math.min(1, dt * 2); if (Math.abs(nightT - nightK) > 0.002) W.setNight(nightK);
      const p = player.root.position;

      /* walking: keys move at once; a click turns to face the spot first, then walks */
      mv.set(0, 0, 0); let turnOnly = false;
      if (S.keys.size && S.mode !== "bus" && dlg.hidden) {
        fwd.set(-Math.sin(S.yaw), 0, -Math.cos(S.yaw)); right.set(-fwd.z, 0, fwd.x);
        if (S.keys.has("w") || S.keys.has("arrowup")) mv.add(fwd);
        if (S.keys.has("s") || S.keys.has("arrowdown")) mv.sub(fwd);
        if (S.keys.has("d") || S.keys.has("arrowright")) mv.add(right);
        if (S.keys.has("a") || S.keys.has("arrowleft")) mv.sub(right);
        if (mv.lengthSq()) { mv.normalize(); unlock("steps"); }
      } else if (S.target && S.mode !== "bus") {
        mv.subVectors(S.target, p).setY(0);
        const d = mv.length();
        if (d < 0.35) { S.target = null; marker.material.opacity = 0; mv.set(0, 0, 0); const f = S.onArrive; S.onArrive = null; if (f) f(); else unlock("steps"); }
        else { mv.divideScalar(d); const want = Math.atan2(mv.x, mv.z); let dr = want - player.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); turnOnly = Math.abs(dr) > 0.55; }
      }
      const far = S.target ? S.target.distanceTo(p) : 0;
      const speed = mv.lengthSq() && !turnOnly ? (far > 18 ? 11 : 7.5) : 0;
      S.speed += (speed - S.speed) * Math.min(1, dt * 9);
      if (mv.lengthSq()) {
        const want = Math.atan2(mv.x, mv.z); let dr = want - player.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); player.root.rotation.y += dr * Math.min(1, dt * (turnOnly ? 14 : 10));
      }
      if (S.speed > 0.05 && mv.lengthSq()) {
        const before = p.clone();
        p.addScaledVector(mv, S.speed * dt);
        for (const c of W.colliders) { const dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz), m = c.r + 0.45; if (d < m && d > 1e-4) { p.x = c.x + (dx / d) * m; p.z = c.z + (dz / d) * m; } }
        const bp = W.bus.position, bd = Math.hypot(p.x - bp.x, p.z - bp.z); if (bd < 3 && bd > 1e-4) { p.x = bp.x + (p.x - bp.x) / bd * 3; p.z = bp.z + (p.z - bp.z) / bd * 3; }
        const a = Math.atan2(p.z, p.x), d = Math.hypot(p.x, p.z), lim = islandR(a) - 1.2; if (d > lim) p.multiplyScalar(lim / d);
        if (S.target && before.distanceTo(p) < S.speed * dt * 0.15) { S.stuck += dt; if (S.stuck > 0.6) { S.target = null; marker.material.opacity = 0; S.stuck = 0; } } else S.stuck = 0;
        S.stepT -= dt; if (S.stepT < 0) { sound.step(); S.stepT = 0.32; }
      }
      player.update(dt, S.t, S.speed > 0.2 ? S.speed : 0);
      W.ground.uFocus.value.set(p.x, p.z);
      if (marker.material.opacity > 0) { marker.scale.setScalar(Math.max(1, marker.scale.x - dt * 2)); marker.rotation.z += dt * 2; }

      /* lost chips: walk over one to pick it up */
      chipItems.forEach((it, i) => {
        if (!it.visible || it.hiding) return;
        if (Math.hypot(p.x - it.x, p.z - it.z) < 1.7) {
          W.spawner.hide(it.id); save.chips.push(i); persist(); sound.good(); W.shock(it.x, it.z, S.t, 0.8);
          toast("💾", "Lost chip found", `${save.chips.length} of ${chipItems.length}`); unlock("chip");
          if (save.chips.length >= chipItems.length) { unlock("chips"); queue(LINES.chips(), "VY-01", 880); }
        }
      });

      /* nearby place: glass talk card floats over the character */
      let near = null;
      for (const z of ZONES) { const ref = z.id === "plaza" ? ORIGIN : npcs[z.id].spot.pos; if (Math.hypot(p.x - ref.x, p.z - ref.z) < (z.id === "plaza" ? 9.5 : 4.2)) { near = z; break; } }
      if (near !== S.nearSeen) {
        S.nearSeen = near; if (near) S.near = near;
        if (near && S.mode === "follow" && !save.ach["visit-" + near.id] && dlg.hidden && !sheet.open && near.id !== "plaza") talkTo(near.id);
      }
      const showNear = !!near && dlg.hidden && !sheet.open && S.mode === "follow";
      if (showNear) {
        const n = npcs[near.id], at = n.bot ? bot.root.position : n.who.root.position;
        nearCard.position.set(at.x, 5.4, at.z);
        const t = `Talk to ${near.npc.name}`, nb = nearEl.querySelector(".isl-near__b");
        if (nb.textContent !== t) { nb.textContent = t; nearEl.querySelector(".isl-near__z").textContent = near.name; nearEl.classList.remove("is-pop"); void nearEl.offsetWidth; nearEl.classList.add("is-pop"); }
      }
      nearCard.visible = showNear;

      /* characters */
      Object.values(npcs).forEach((n) => {
        if (n.bot) return;
        const who = n.who, wp = who.root.position;
        const want = Math.hypot(p.x - wp.x, p.z - wp.z) < 7 ? Math.atan2(p.x - wp.x, p.z - wp.z) : n.home;
        let dr = want - who.root.rotation.y; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); who.root.rotation.y += dr * Math.min(1, dt * 5);
        who.talking = S.talking === n.z.npc.name; who.update(dt, S.t, 0);
      });
      const bp = bot.root.position, ry = player.root.rotation.y, side = new THREE.Vector3(Math.cos(ry) * 1.9, 0, -Math.sin(ry) * 1.9);
      const bt = S.mode === "style" ? p.clone().add(new THREE.Vector3(-Math.sin(ry) * 3 + side.x, 0, -Math.cos(ry) * 3 + side.z))
        : S.mode === "bus" ? W.bus.position.clone().add(new THREE.Vector3(0, 3.2, 0))
        : p.clone().add(side).add(new THREE.Vector3(-Math.sin(ry) * 1.2, 0, -Math.cos(ry) * 1.2));
      const bv = bt.clone().sub(bp), bspd = bv.length();
      bp.addScaledVector(bv, Math.min(1, dt * 2.2));
      const look = S.talking === "VY-01" || bspd <= 0.6 ? Math.atan2(p.x - bp.x, p.z - bp.z) : Math.atan2(bv.x, bv.z);
      let br = look - bot.root.rotation.y; br = Math.atan2(Math.sin(br), Math.cos(br)); bot.root.rotation.y += br * Math.min(1, dt * 4);
      bot.talking = S.talking === "VY-01"; bot.update(dt, S.t, bspd);

      if (S.mode === "bus" && W.busState.a - S.rideFrom > Math.PI * 2 - 0.05) {
        W.busState.riding = false; S.mode = "follow";
        fade(() => { player.root.position.copy(npcs.busstop.spot.stand); player.root.visible = true; unlock("bus"); say(LINES.bus_done(), "Captain Bus", 300); });
      }

      /* springs: hovered buildings and props bounce with weight */
      springs.forEach((s, o) => { s.v += (s.goal - s.k) * 260 * dt; s.v *= Math.exp(-15 * dt); s.k += s.v * dt; o.scale.setScalar(s.k); if (Math.abs(s.goal - s.k) < 1e-4 && Math.abs(s.v) < 1e-4) { o.scale.setScalar(s.goal); if (s.goal === 1) springs.delete(o); } });
      if (hoverDirty || frameN % 6 === 0) { hoverDirty = false; updateHover(); }

      /* camera */
      const fk = FK();
      S.yaw += (S.yawT - S.yaw) * Math.min(1, dt * 6); S.pitch += (S.pitchT - S.pitch) * Math.min(1, dt * 6); S.dist += (S.distT - S.dist) * Math.min(1, dt * 5);
      let look3, pos3;
      if (S.mode === "intro") { const a = S.t * 0.06; look3 = tmpL.set(0, 0, 0); pos3 = tmpV.set(Math.sin(a) * 135 * fk, 88 * fk, Math.cos(a) * 135 * fk); }
      else if (S.mode === "bus") { const b = W.bus.position, a = W.busState.a; look3 = tmpL.copy(b).setY(1.5); pos3 = tmpV.set(Math.cos(a) * (ROAD + 22 * fk) + Math.sin(a) * 10, 18 * fk, Math.sin(a) * (ROAD + 22 * fk) - Math.cos(a) * 10); }
      else if (S.mode === "style") { const wide = innerWidth > 760, sx = wide ? 3.2 : 0, d = 14 * fk; look3 = tmpL.set(p.x + Math.cos(ry) * sx, wide ? 1.5 : -0.4, p.z - Math.sin(ry) * sx); pos3 = tmpV.set(p.x + Math.sin(ry) * d + Math.cos(ry) * sx, 4.6, p.z + Math.cos(ry) * d - Math.sin(ry) * sx); }
      else if (S.mode === "talk" && S.talkWith) {
        const o = S.talkWith.bot ? bp : S.talkWith.who.root.position, mid = p.clone().lerp(o, 0.5), narrow = innerWidth < innerHeight;
        look3 = tmpL.copy(mid).setY(narrow ? -2.6 : -1.6); const d = (narrow ? 31 : 24) * fk, pt = 0.68;
        pos3 = tmpV.set(mid.x + Math.sin(S.yaw) * Math.cos(pt) * d, 1.8 + Math.sin(pt) * d, mid.z + Math.cos(S.yaw) * Math.cos(pt) * d);
      } else { const d = S.dist * fk; look3 = tmpL.copy(p).setY(1.4); pos3 = tmpV.set(p.x + Math.sin(S.yaw) * Math.cos(S.pitch) * d, 1.4 + Math.sin(S.pitch) * d, p.z + Math.cos(S.yaw) * Math.cos(S.pitch) * d); }
      const k = REDUCED ? 1 : Math.min(1, dt * (S.mode === "intro" ? 1 : 3.2));
      S.camPos.lerp(pos3, k); S.camLook.lerp(look3, k);
      camera.position.copy(S.camPos); camera.lookAt(S.camLook);

      /* spatial UI faces the camera and tilts with it */
      const showTags = S.mode === "follow" || S.mode === "talk";
      tags.forEach((t) => { t.o.visible = showTags && !(S.nearSeen && S.nearSeen.id === t.z.id); t.o.quaternion.copy(camera.quaternion); });
      tip.quaternion.copy(camera.quaternion); nearCard.quaternion.copy(camera.quaternion);
      if (frameN % 8 === 0) drawMap(mini, false);

      tmpV.copy(p).setY(1.2).project(camera); pipe.setFocus(Math.min(0.85, Math.max(0.15, (tmpV.y + 1) / 2)));
      pipe.render();
      css3d.render(uiScene, camera);
      raf = requestAnimationFrame(frame);
    }
    const startLoop = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    const stopLoop = () => { cancelAnimationFrame(raf); raf = 0; };
    D.addEventListener("visibilitychange", () => (D.hidden ? stopLoop() : startLoop()));
    renderer.compile(scene, camera);
    startLoop();
    html.dataset.ready = "island";
    window.VISLAND = { scene, camera, renderer, player, S, unlock, travel, tier, pipe, W };
  }
}
