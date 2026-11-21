/* ============================================================
   VYOM GOR — core.js
   Global chrome: HUD, header, ⌘K palette, What's new, themes,
   mobile menu, info sheet, veil transitions, email, scheduler.
   ============================================================ */
(() => {
  "use strict";
  const S = window.SITE;
  const D = document;
  const html = D.documentElement;
  const qs = (s, c = D) => c.querySelector(s);
  const qsa = (s, c = D) => [...c.querySelectorAll(s)];
  const make = (markup) => { const t = D.createElement("template"); t.innerHTML = markup.trim(); return t.content.firstElementChild; };
  const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) {} },
    del(k, s = localStorage) { try { s.removeItem(k); } catch (e) {} },
  };
  const norm = (p) => {
    p = (p || "/").replace(/index\.html$/, "").replace(/\.html$/, "");
    if (p.length > 1) p = p.replace(/\/+$/, "");
    return p || "/";
  };
  const PATH = norm(location.pathname);
  const PAGE = D.body.dataset.page || "home";

  /* ---------- icons ---------- */
  const I = {
    arrow: '<svg viewBox="0 0 12 12" fill="none"><path d="M3 9 9 3M4 3h5v5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    right: '<svg viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    left: '<svg viewBox="0 0 16 16" fill="none"><path d="M13 8H3M7 4 3 8l4 4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="4.6" stroke="currentColor" stroke-width="1.4"/><path d="m10.5 10.5 3 3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
    bell: '<svg viewBox="0 0 16 16" fill="none"><path d="M4 11V7a4 4 0 0 1 8 0v4l1 1.2H3L4 11Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="M6.6 13.6a1.5 1.5 0 0 0 2.8 0" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    sun: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="2.8" stroke="currentColor" stroke-width="1.3"/><path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M3.4 12.6l1.1-1.1M11.5 4.5l1.1-1.1" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>',
    moon: '<svg viewBox="0 0 16 16" fill="none"><path d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="4.6" r="0.9" fill="currentColor"/><path d="M8 7v5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    close: '<svg viewBox="0 0 12 12" fill="none"><path d="m3 3 6 6M9 3 3 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>',
    github: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M8 .2a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.3 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 8 .2Z"/></svg>',
    linkedin: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M2.2 5.6h2.6V14H2.2V5.6Zm1.3-4.1a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3ZM6.4 5.6h2.5v1.2c.4-.7 1.2-1.4 2.6-1.4 2.7 0 3.2 1.8 3.2 4.1V14h-2.6v-4c0-1 0-2.2-1.4-2.2-1.4 0-1.6 1-1.6 2.1V14H6.4V5.6Z"/></svg>',
    x: '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M12.2 1.5h2.2L9.6 7l5.7 7.5h-4.5L7.3 10l-4 4.5H1.1l5.2-5.9L.9 1.5h4.6l3.2 4.2 3.5-4.2Zm-.8 11.7h1.2L4.7 2.7H3.4l8 10.5Z"/></svg>',
    brief: '<svg viewBox="0 0 16 16" fill="none"><rect x="2" y="4.5" width="12" height="8.5" rx="1.5" stroke="currentColor" stroke-width="1.3"/><path d="M6 4.5V3.2c0-.4.3-.7.7-.7h2.6c.4 0 .7.3.7.7v1.3M2 8h12" stroke="currentColor" stroke-width="1.3"/></svg>',
    trophy: '<svg viewBox="0 0 16 16" fill="none"><path d="M5 2.5h6v3.2a3 3 0 0 1-6 0V2.5ZM5 3.5H2.8v.8A2.2 2.2 0 0 0 5 6.5M11 3.5h2.2v.8A2.2 2.2 0 0 1 11 6.5M8 8.7v2.6M5.6 13.5h4.8M6.5 11.3h3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    menu: '<svg viewBox="0 0 16 16" fill="none"><path d="M2.5 5.5h11M2.5 10.5h11" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>',
  };

  /* ---------- small helpers ---------- */
  const email = () => String.fromCharCode(...S.mail.u) + "@" + String.fromCharCode(...S.mail.d);
  const pageLabel = { home: null, about: "About", lab: "Lab", "lab-exp": "Lab", writing: "Writing", post: "Writing", bench: "Bench", contact: "Contact", record: "Record", changelog: "Log", notfound: "404", resume: "Resume", now: "Now", notes: "Notes" };

  /* ============================================================
     CHROME
     ============================================================ */
  function buildChrome() {
    D.body.prepend(make('<div class="paper-fx" aria-hidden="true"></div>'));
    D.body.prepend(make('<a class="skip" href="#main">Skip to content</a>'));

    const hud = make(`
      <div class="hud" role="status" aria-label="Live telemetry">
        <span class="hud__chip">${S.tzLabel}::<b class="js-clock">--:--</b></span>
        <span class="hud__chip">FPS::<b class="js-fps">--</b></span>
        <span class="hud__chip">LCP::<b class="js-lcp">--</b></span>
        <span class="hud__chip">VYOM::<b class="js-here">--</b></span>
        <span class="hud__chip"><i class="live blink"></i>BUS::<b>0x500</b></span>
        <span class="hud__chip">STATUS::<b>${S.status}</b></span>
        <button class="hud__chip js-snd" type="button" aria-pressed="false" aria-label="Toggle sound">SND::<b>OFF</b></button>
      </div>`);
    D.body.append(hud);

    const label = pageLabel[PAGE];
    const logo = label
      ? `<a class="logo" href="/" aria-label="${S.name}, home"><span class="logo__c">${S.initials[0]}</span><span class="logo__b"><span>${label}</span></span></a>`
      : `<a class="logo" href="/" aria-label="${S.name}, home"><span class="logo__c">${S.initials[0]}</span><span class="logo__b"><span>${S.initials[1]}</span></span></a>`;
    const navLinks = S.nav.map((n) => {
      const on = PATH === n.href || PATH.startsWith(n.href + "/");
      return `<a href="${n.href}"${on ? ' class="is-active" aria-current="page"' : ""}>${n.label}</a>`;
    }).join("");

    const hdr = make(`
      <header class="hdr">
        ${logo}
        <div class="navwrap">
          <nav class="navpill" aria-label="Primary">${navLinks}</nav>
          <button class="iconbtn kbtn js-pal" type="button" aria-label="Open command menu">⌘K</button>
        </div>
        <div class="hdr__right">
          <button class="iconbtn js-wn" type="button" aria-label="What’s new">${I.bell}<i class="bell-dot" hidden></i></button>
          <div class="themeseg" role="group" aria-label="Theme">
            <button type="button" data-theme-set="light" aria-label="Light theme">${I.sun}</button>
            <button type="button" data-theme-set="dark" aria-label="Dark theme">${I.moon}</button>
          </div>
          <button class="iconbtn menubtn js-menu" type="button" aria-label="Menu" aria-expanded="false">${I.menu}</button>
        </div>
      </header>`);
    D.body.append(hdr);

    D.body.append(make('<div class="scrim" aria-hidden="true"></div>'));
    D.body.append(make(`<div class="toast" role="status" aria-live="polite"><b></b><span></span></div>`));
    D.body.append(make(`<div class="veil" aria-hidden="true"><div class="veil__sheet"></div></div>`));

    if (!D.body.hasAttribute("data-no-info")) {
      D.body.append(make(`<button class="info-btn js-info" type="button" aria-label="About this site">${I.info}</button>`));
    }
  }

  /* ---------- HUD ---------- */
  function initHUD() {
    const clockFmt = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: S.tz });
    const partFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", hour: "numeric", minute: "numeric", hour12: false, timeZone: S.tz });
    const days = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tick = () => {
      const now = new Date();
      const t = clockFmt.format(now);
      qsa(".js-clock").forEach((e) => (e.textContent = t));
      const parts = Object.fromEntries(partFmt.formatToParts(now).map((p) => [p.type, p.value]));
      const hr = (parseInt(parts.hour, 10) % 24) + parseInt(parts.minute, 10) / 60;
      const atBench = S.schedule.days.includes(days[parts.weekday]) && hr >= S.schedule.from && hr < S.schedule.to;
      qsa(".js-here").forEach((e) => (e.textContent = atBench ? "AT BENCH" : "OFF BENCH"));
    };
    tick();
    setInterval(tick, 1000);

    let frames = 0, last = performance.now();
    const fpsEls = qsa(".js-fps");
    const loop = (now) => {
      frames++;
      if (now - last >= 500) {
        const fps = Math.round((frames * 1000) / (now - last));
        fpsEls.forEach((e) => (e.textContent = fps));
        frames = 0; last = now;
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    const setLCP = (ms) => qsa(".js-lcp").forEach((e) => (e.textContent = (ms / 1000).toFixed(1) + "s"));
    try {
      new PerformanceObserver((list) => {
        const e = list.getEntries().pop();
        if (e) setLCP(e.renderTime || e.loadTime || e.startTime);
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch (e) {
      addEventListener("load", () => {
        const n = performance.getEntriesByType("navigation")[0];
        if (n) setLCP(n.domContentLoadedEventEnd);
      });
    }
  }

  /* ---------- header hide on scroll ---------- */
  function initHeaderScroll() {
    const hdr = qs(".hdr");
    let lastY = scrollY;
    addEventListener("scroll", () => {
      const y = scrollY;
      if (y > 140 && y > lastY + 4) hdr.classList.add("is-hidden");
      else if (y < lastY - 4 || y < 140) hdr.classList.remove("is-hidden");
      lastY = y;
    }, { passive: true });
  }

  /* ---------- theme ---------- */
  const mq = matchMedia("(prefers-color-scheme: dark)");
  function applyTheme(pref) {
    const dark = pref === "dark" || (pref === "system" && mq.matches);
    html.setAttribute("data-theme", dark ? "dark" : "light");
    html.setAttribute("data-pref", pref);
    qsa("[data-theme-set]").forEach((b) => b.classList.toggle("is-on", b.dataset.themeSet === (dark ? "dark" : "light")));
    D.dispatchEvent(new CustomEvent("vg:theme", { detail: { dark } }));
  }
  function setTheme(pref) { store.set("vg-theme", pref); applyTheme(pref); }
  function initTheme() {
    applyTheme(html.getAttribute("data-pref") || "light");
    D.addEventListener("click", (e) => {
      const b = e.target.closest("[data-theme-set]");
      if (b) setTheme(b.dataset.themeSet);
    });
    mq.addEventListener("change", () => { if (html.getAttribute("data-pref") === "system") applyTheme("system"); });
  }

  /* ---------- overlay manager ---------- */
  const scrimEl = () => qs(".scrim");
  let openLayer = null;
  function openOverlay(el, opts = {}) {
    closeOverlay();
    el.classList.add("is-on");
    if (opts.scrim !== false) scrimEl().classList.add("is-on");
    openLayer = { el, onClose: opts.onClose };
    V.lenis && V.lenis.stop();
  }
  function closeOverlay() {
    if (!openLayer) return;
    openLayer.el.classList.remove("is-on");
    scrimEl().classList.remove("is-on");
    const cb = openLayer.onClose;
    openLayer = null;
    V.lenis && V.lenis.start();
    cb && cb();
  }

  /* ---------- ⌘K palette ---------- */
  function initPalette() {
    const items = [
      { g: "Pages", label: "Home", path: "/", go: "/" },
      ...S.nav.map((n) => ({ g: "Pages", label: n.label, path: n.href, go: n.href })),
      { g: "Pages", label: "Resume", path: "/resume", go: "/resume", kw: "cv pdf" },
      { g: "Pages", label: "Now", path: "/now", go: "/now", kw: "current" },
      { g: "Pages", label: "Notes", path: "/notes", go: "/notes", kw: "til today i learned" },
      ...S.lab.map((l) => ({ g: "Lab", label: l.title, path: "/lab/" + l.slug, go: "/lab/" + l.slug, kw: l.tags.join(" ") })),
      ...S.writing.map((w) => ({ g: "Writing", label: w.title, path: "/writing/" + w.slug, go: "/writing/" + w.slug })),
      { g: "Tools", label: "Open shell", path: "`", act: () => openShell(), kw: "terminal imperfect_cell cell" },
      { g: "Tools", label: "Book a call", path: "15 min", act: () => openCal(), kw: "cal meeting schedule" },
      { g: "Tools", label: "Copy email", path: "mail", act: () => copyEmail(), kw: "contact" },
      { g: "Tools", label: "Record", path: "/record", go: "/record" },
      { g: "Tools", label: "Changelog", path: "/changelog", go: "/changelog", kw: "what's new" },
      { g: "Tools", label: "Privacy & credits", path: "i", act: () => openInfo() },
      { g: "Tools", label: "Toggle sound", path: "snd", act: () => toggleSound(), kw: "audio mute" },
      ...S.socials.map((s) => ({ g: "Elsewhere", label: s.label, path: "↗", href: s.url })),
      { g: "Theme", label: "Light", path: "", act: () => setTheme("light") },
      { g: "Theme", label: "Dark", path: "", act: () => setTheme("dark") },
      { g: "Theme", label: "System", path: "", act: () => setTheme("system") },
    ];
    const pal = make(`
      <div class="pal" role="dialog" aria-modal="true" aria-label="Command menu">
        <div class="pal__search">${I.search}<input type="text" placeholder="Search anything" aria-label="Search" autocomplete="off" spellcheck="false"></div>
        <div class="pal__list" role="listbox"></div>
        <div class="pal__empty">No results.</div>
        <div class="pal__foot"><span><kbd>↑↓</kbd>Navigate</span><span><kbd>↵</kbd>Select</span><span><kbd>esc</kbd>Close</span></div>
      </div>`);
    D.body.append(pal);
    const input = qs("input", pal), list = qs(".pal__list", pal), empty = qs(".pal__empty", pal);
    let shown = [], sel = 0;

    const render = () => {
      const q = input.value.trim().toLowerCase();
      shown = items.filter((it) => !q || (it.label + " " + it.path + " " + (it.kw || "") + " " + it.g).toLowerCase().includes(q));
      let out = "", lastG = "";
      shown.forEach((it, i) => {
        if (it.g !== lastG) { out += `<div class="pal__group">${it.g}</div>`; lastG = it.g; }
        out += `<button class="pal__item${i === sel ? " is-sel" : ""}" type="button" role="option" data-i="${i}"><span class="ar">→</span>${it.label}<span class="path">${it.path}</span></button>`;
      });
      list.innerHTML = out;
      empty.style.display = shown.length ? "none" : "block";
    };
    const run = (it) => {
      if (!it) return;
      closeOverlay();
      if (it.go) navigate(it.go);
      else if (it.href) window.open(it.href, "_blank", "noopener,noreferrer");
      else if (it.act) setTimeout(it.act, 60);
    };
    const open = () => {
      input.value = ""; sel = 0; render();
      openOverlay(pal);
      setTimeout(() => input.focus(), 30);
    };
    V.openPalette = open;
    input.addEventListener("input", () => { sel = 0; render(); });
    input.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") { sel = Math.min(sel + 1, shown.length - 1); render(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
      else if (e.key === "Enter") { run(shown[sel]); e.preventDefault(); }
      const cur = qs(".is-sel", list); cur && cur.scrollIntoView({ block: "nearest" });
    });
    list.addEventListener("mousemove", (e) => {
      const b = e.target.closest(".pal__item");
      if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; qsa(".pal__item", list).forEach((x) => x.classList.toggle("is-sel", +x.dataset.i === sel)); }
    });
    list.addEventListener("click", (e) => { const b = e.target.closest(".pal__item"); if (b) run(shown[+b.dataset.i]); });
    qsa(".js-pal").forEach((b) => b.addEventListener("click", open));
  }

  /* ---------- What's new ---------- */
  function initWhatsNew() {
    const entries = S.changelog.slice(0, 8);
    const latest = S.changelog.reduce((m, c) => (c.date > m ? c.date : m), "");
    const seen = () => store.get("vg-seen") || "";
    const wn = make(`
      <div class="wn" role="dialog" aria-label="What’s new">
        <div class="wn__head"><span>What’s new</span><button type="button" class="js-wn-read">Mark all read</button></div>
        <div class="wn__list"></div>
        <a class="wn__foot" href="/changelog">View all →</a>
      </div>`);
    D.body.append(wn);
    const listEl = qs(".wn__list", wn), dot = qs(".bell-dot");
    const render = () => {
      const s = seen();
      listEl.innerHTML = entries.map((c) => {
        const ext = /^https?:/.test(c.href);
        return `<a class="wn__item${c.date > s ? " is-unread" : ""}" href="${c.href}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>
          <span class="wn__meta"><span class="tag">${c.type}</span>${c.label}</span>
          <span class="wn__title">${c.title}</span>
          <span class="wn__desc">${c.desc}</span>
          <span class="wn__go">${I.arrow}</span>
        </a>`;
      }).join("");
      dot.hidden = !(latest > s);
    };
    render();
    qs(".js-wn-read", wn).addEventListener("click", () => { store.set("vg-seen", latest); render(); });
    qsa(".js-wn").forEach((b) => b.addEventListener("click", () => {
      if (wn.classList.contains("is-on")) closeOverlay();
      else openOverlay(wn, { scrim: true });
    }));
  }

  /* ---------- mobile menu ---------- */
  function initMobileMenu() {
    const mm = make(`
      <div class="mmenu" role="dialog" aria-label="Menu">
        <nav aria-label="Mobile">${[{ label: "Home", href: "/" }, ...S.nav].map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}</nav>
        <div>
          <div class="mmenu__hud">${qs(".hud").innerHTML}</div>
          <div class="mmenu__row" style="margin-bottom:18px">
            <button class="btn" type="button" data-theme-set="light">${I.sun} Light</button>
            <button class="btn" type="button" data-theme-set="dark">${I.moon} Dark</button>
            <button class="btn js-pal" type="button">⌘K</button>
          </div>
          <div class="mmenu__soc">${S.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.label} ↗</a>`).join("")}</div>
        </div>
      </div>`);
    D.body.append(mm);
    qsa(".js-pal", mm).forEach((b) => b.addEventListener("click", () => { toggle(false); setTimeout(() => V.openPalette(), 50); }));
    const btn = qs(".js-menu");
    const toggle = (on) => {
      mm.classList.toggle("is-on", on);
      btn.setAttribute("aria-expanded", String(on));
      btn.innerHTML = on ? I.close : I.menu;
      on ? V.lenis && V.lenis.stop() : V.lenis && V.lenis.start();
    };
    btn.addEventListener("click", () => toggle(!mm.classList.contains("is-on")));
    mm.addEventListener("click", (e) => { if (e.target.closest("a[href^='/']")) toggle(false); });
  }

  /* ---------- info sheet (privacy + credits) ---------- */
  function openInfo() {
    let sh = qs(".sheet--info");
    if (!sh) {
      sh = make(`
        <div class="sheet sheet--info" role="dialog" aria-modal="true" aria-label="About this site">
          <div class="sheet__head"><span class="sheet__label">About this site ::</span><button class="sheet__x js-x" type="button" aria-label="Close">${I.close}</button></div>
          <p>No cookies. No analytics. No trackers. Fonts and scripts are served from this site, so loading a page talks to no one else.</p>
          <p class="muted">The scheduler only connects to cal.com after you ask for it. Your email address is built on click, not stored in the page. The contact letter opens your own mail app; nothing is sent to a server.</p>
          <h4>Shortcuts</h4>
          <ul>
            <li><kbd>⌘K</kbd> / <kbd>Ctrl K</kbd> command menu</li>
            <li><kbd>\`</kbd> open the imperfect_cell shell</li>
            <li><kbd>←</kbd> <kbd>→</kbd> turn the wheels on the home page</li>
          </ul>
          <h4>Credits</h4>
          <ul>
            <li><a href="${S.credit.url}" target="_blank" rel="noopener noreferrer">${S.credit.text} ↗</a></li>
            <li>Type: Geist & Geist Mono (OFL). Motion: GSAP & Lenis.</li>
            <li>Built by ${S.name} · ${S.city}, ${S.country}</li>
          </ul>
        </div>`);
      D.body.append(sh);
      qs(".js-x", sh).addEventListener("click", closeOverlay);
    }
    openOverlay(sh);
  }

  /* ---------- toast ---------- */
  let toastT;
  function toast(title, sub = "") {
    const t = qs(".toast");
    qs("b", t).textContent = title;
    qs("span", t).textContent = sub;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 2600);
  }

  /* ---------- email ---------- */
  function copyEmail() {
    const m = email();
    const done = () => toast("Email copied", m);
    if (navigator.clipboard && isSecureContext) navigator.clipboard.writeText(m).then(done, () => toast("Email", m));
    else toast("Email", m);
  }
  function mailto(subject, body) {
    location.href = `mailto:${email()}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(body || "")}`;
  }

  /* ---------- cal.com (click-to-load) ---------- */
  let calLoaded = false;
  function openCal() {
    let sh = qs(".sheet--cal");
    if (!sh) {
      sh = make(`
        <div class="sheet sheet--cal" role="dialog" aria-modal="true" aria-label="Book a call">
          <div class="sheet__head"><span class="sheet__label">Book a call :: 15 min · via cal.com</span><button class="sheet__x js-x" type="button" aria-label="Close">${I.close}</button></div>
          <div class="cal-frame"><div class="cal-frame__wait">Connecting to cal.com…</div><div id="cal-embed" style="position:relative;z-index:1;min-height:600px"></div></div>
        </div>`);
      D.body.append(sh);
      qs(".js-x", sh).addEventListener("click", closeOverlay);
    }
    openOverlay(sh);
    if (calLoaded) return;
    calLoaded = true;
    (function (C, A, L) {
      const p = (a, ar) => a.q.push(ar);
      const d = C.document;
      C.Cal = C.Cal || function () {
        const cal = C.Cal, ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          const api = function () { p(api, arguments); };
          const ns = ar[1]; api.q = api.q || [];
          if (typeof ns === "string") { cal.ns[ns] = cal.ns[ns] || api; p(cal.ns[ns], ar); p(cal, ["initNamespace", ns]); } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, "https://app.cal.com/embed/embed.js", "init");
    const theme = html.getAttribute("data-theme");
    Cal("init", { origin: "https://cal.com" });
    Cal("inline", { elementOrSelector: "#cal-embed", calLink: S.cal, config: { theme } });
    Cal("ui", { theme, styles: { branding: { brandColor: "#a5802a" } }, hideEventTypeDetails: false });
  }

  /* ---------- shell overlay (lazy) ---------- */
  function openShell() {
    const go = () => window.VShell && window.VShell.overlay({ open: openOverlay, close: closeOverlay });
    if (window.VShell) return go();
    const s = D.createElement("script");
    s.src = "/assets/js/lab/shell.js";
    s.onload = go;
    D.body.append(s);
  }

  /* ---------- veil transitions ---------- */
  function navigate(href) {
    const sheet = qs(".veil__sheet");
    if (REDUCED || !window.gsap) { location.href = href; return; }
    store.set("vg-veil", "1", sessionStorage);
    gsap.fromTo(sheet, { yPercent: 104 }, { yPercent: 0, duration: 0.55, ease: "power3.inOut", onComplete: () => (location.href = href) });
  }
  function initTransitions() {
    const sheet = qs(".veil__sheet");
    if (html.classList.contains("is-entering") && window.gsap) {
      store.del("vg-veil", sessionStorage);
      gsap.set(sheet, { yPercent: 0 });
      html.classList.remove("is-entering");
      gsap.to(sheet, { yPercent: -104, duration: 0.75, delay: 0.05, ease: "power3.inOut", onComplete: () => gsap.set(sheet, { yPercent: 104 }) });
    } else {
      html.classList.remove("is-entering");
      store.del("vg-veil", sessionStorage);
    }
    D.addEventListener("click", (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest("a[href]");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (norm(url.pathname) === PATH && !url.hash) { e.preventDefault(); closeOverlay(); return; }
      e.preventDefault();
      closeOverlay();
      navigate(url.pathname + url.search + url.hash);
    });
    addEventListener("pageshow", (e) => { if (e.persisted && window.gsap) gsap.set(sheet, { yPercent: 104 }); });
  }

  /* ---------- keyboard ---------- */
  function initKeys() {
    D.addEventListener("keydown", (e) => {
      const typing = /INPUT|TEXTAREA|SELECT/.test(D.activeElement && D.activeElement.tagName) || (D.activeElement && D.activeElement.isContentEditable);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openLayer ? closeOverlay() : V.openPalette(); return; }
      if (e.key === "Escape" && openLayer) { closeOverlay(); return; }
      if (typing) return;
      if (e.key === "`") { e.preventDefault(); openShell(); }
      else if (e.key === "/" ) { e.preventDefault(); V.openPalette(); }
    });
    scrimEl().addEventListener("click", closeOverlay);
    qsa(".js-info").forEach((b) => b.addEventListener("click", openInfo));
  }

  /* ---------- smooth scroll + reveals ---------- */
  function useLenis() {
    if (REDUCED || !window.Lenis || V.lenis) return V.lenis;
    V.lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (window.ScrollTrigger) V.lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add((t) => V.lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    return V.lenis;
  }
  function reveals(root = D) {
    const els = qsa("[data-rv]", root);
    if (!window.gsap || REDUCED) { els.forEach((e) => (e.style.opacity = 1)); return; }
    const io = new IntersectionObserver((ents) => {
      ents.forEach((en) => {
        if (!en.isIntersecting) return;
        io.unobserve(en.target);
        gsap.fromTo(en.target, { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: parseFloat(en.target.dataset.rv) || 0 });
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach((e) => io.observe(e));
  }
  function splitIn(el, delay = 0) {
    if (!el || !window.gsap) return;
    if (REDUCED || !window.SplitText) { el.style.opacity = 1; return; }
    el.style.opacity = 1;
    const st = SplitText.create(el, { type: "lines,words", mask: "lines" });
    gsap.from(st.words, { yPercent: 110, duration: 1.05, ease: "power4.out", stagger: 0.035, delay });
  }

  /* ---------- sound (synthesised, off by default) ---------- */
  const SND = { on: store.get("vg-sound") === "on", ctx: null, noise: null };
  function audio() {
    if (!SND.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      SND.ctx = new AC();
      const len = SND.ctx.sampleRate * 0.05;
      SND.noise = SND.ctx.createBuffer(1, len, SND.ctx.sampleRate);
      const d = SND.noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    }
    if (SND.ctx.state === "suspended") SND.ctx.resume();
    return SND.ctx;
  }
  function sfx(name) {
    if (!SND.on) return;
    const c = audio(); if (!c) return;
    const t = c.currentTime;
    const blip = (freq, dur, vol, type = "sine", at = 0) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.setValueAtTime(freq, t + at);
      g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(g).connect(c.destination); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    const click = (vol, at = 0, hp = 1800) => {
      const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
      s.buffer = SND.noise; f.type = "highpass"; f.frequency.value = hp; g.gain.value = vol;
      s.connect(f).connect(g).connect(c.destination); s.start(t + at);
    };
    if (name === "tick") blip(2100, 0.03, 0.025);
    else if (name === "click") click(0.22);
    else if (name === "key") click(0.12, 0, 3200);
    else if (name === "relay") { click(0.35, 0, 900); click(0.22, 0.05, 1400); }
    else if (name === "buzz") blip(2300, 0.09, 0.03, "square");
    else if (name === "boot") { blip(880, 0.08, 0.04); blip(1320, 0.12, 0.04, "sine", 0.09); }
  }
  function toggleSound(force) {
    SND.on = typeof force === "boolean" ? force : !SND.on;
    store.set("vg-sound", SND.on ? "on" : "off");
    qsa(".js-snd").forEach((b) => { b.querySelector("b").textContent = SND.on ? "ON" : "OFF"; b.setAttribute("aria-pressed", String(SND.on)); });
    if (SND.on) { audio(); sfx("boot"); }
  }
  function initSound() {
    toggleSound(SND.on);
    D.addEventListener("click", (e) => {
      if (e.target.closest(".js-snd")) { toggleSound(); return; }
      if (e.target.closest("a, button")) sfx("click");
    });
    let lastHover = null;
    D.addEventListener("mouseover", (e) => {
      const a = e.target.closest(".navpill a, .pal__item, .wn__item, .lab-row__go, .btn");
      if (a && a !== lastHover) { lastHover = a; sfx("tick"); }
      if (!a) lastHover = null;
    });
  }

  /* ---------- first-visit boot log (home only) ---------- */
  function bootLog() {
    if (PAGE !== "home" || REDUCED || store.get("vg-booted", sessionStorage) || !window.gsap) return;
    store.set("vg-booted", "1", sessionStorage);
    const lines = [
      `U-Boot 2026.11-vg · <b>LPC2129</b> · ARM7TDMI-S @ 60 MHz`,
      `SRAM: 16 KiB · Flash: 256 KiB <span class="ok">OK</span>`,
      `[ 0.000000] Booting <b>${S.name}</b> · ${S.role.toLowerCase()}`,
      `[ 0.011204] can2: up · id <b>0x500</b> · dlc 8 <span class="ok">OK</span>`,
      `[ 0.024871] lcd: HD44780 16×2 · CGRAM 8 glyphs loaded <span class="ok">OK</span>`,
      `[ 0.031557] uart0: 9600 8N1 <span class="ok">OK</span>`,
      `[ 0.046020] fs: mounted /lab /writing /bench /resume`,
      `[ 0.058331] shell: imperfect_cell ready · press \` anytime`,
      `[ 0.071942] status: <b>${S.status}</b>`,
      `[ 0.080000] ${S.city.toLowerCase()} · ${S.tzLabel} · welcome.`,
    ];
    const el = make(`<div class="boot" role="status" aria-label="Loading"><span class="boot__skip">Click to skip</span><div class="boot__log"></div><div class="boot__big" aria-hidden="true"><span><i style="display:block;font-style:normal">${S.first}</i></span><span><i style="display:block;font-style:normal;color:var(--gold)">${S.name.split(" ")[1]}</i></span></div></div>`);
    D.body.append(el);
    const log = qs(".boot__log", el);
    const tl = gsap.timeline({ onComplete: done });
    gsap.set(qsa(".boot__big i", el), { yPercent: 110 });
    lines.forEach((l, i) => tl.call(() => { log.insertAdjacentHTML("beforeend", (i ? "\n" : "") + l); sfx("key"); }, null, i * 0.11));
    tl.to(qsa(".boot__big i", el), { yPercent: 0, duration: 0.8, ease: "power4.out", stagger: 0.08 }, 0.35);
    tl.to(el, { yPercent: -100, duration: 0.85, ease: "power4.inOut" }, "+=0.45");
    function done() { el.remove(); }
    const skip = () => { tl.progress(1); };
    el.addEventListener("click", skip);
    D.addEventListener("keydown", skip, { once: true });
  }

  /* ---------- prev / next on lab experiment pages ---------- */
  function labPager() {
    const i = S.lab.findIndex((l) => PATH === "/lab/" + l.slug);
    if (i < 0) return;
    const prev = S.lab[(i - 1 + S.lab.length) % S.lab.length], next = S.lab[(i + 1) % S.lab.length];
    qs("main").append(make(`<nav class="lab-pager" aria-label="More experiments"><a href="/lab/${prev.slug}"><span>← Previous</span>${prev.title}</a><a href="/lab/${next.slug}"><span>Next →</span>${next.title}</a></nav>`));
  }

  /* ============================================================ */
  const V = (window.V = { qs, qsa, make, I, S, store, email, copyEmail, mailto, toast, openCal, openShell, openInfo, openOverlay, closeOverlay, navigate, useLenis, reveals, splitIn, setTheme, sfx, toggleSound, REDUCED, PATH, PAGE, lenis: null, openPalette: () => {} });

  function boot() {
    if (window.gsap) {
      const plugins = [window.ScrollTrigger, window.SplitText, window.Draggable, window.InertiaPlugin, window.Observer, window.ScrambleTextPlugin].filter(Boolean);
      gsap.registerPlugin(...plugins);
    }
    buildChrome();
    initHUD();
    initTheme();
    initPalette();
    initWhatsNew();
    initMobileMenu();
    initKeys();
    initHeaderScroll();
    initSound();
    initTransitions();
    bootLog();
    if (PAGE === "lab-exp") labPager();
    D.dispatchEvent(new CustomEvent("vg:ready"));
    if (window.gsap && !REDUCED) {
      gsap.from(".hud__chip", { yPercent: -110, duration: 0.7, ease: "power3.out", stagger: 0.04, delay: 0.1 });
      gsap.from(".hdr > *", { y: -14, opacity: 0, duration: 0.8, ease: "power3.out", stagger: 0.06, delay: 0.15 });
    }
  }
  if (D.readyState === "loading") D.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
