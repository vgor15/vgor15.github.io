/* ============================================================
   VYOM GOR: content.js
   Loads the editable content in /content/*.json (the files the
   /admin panel writes) and builds window.SITE, the object every
   page script reads. core.js waits for window.SITE_READY before
   it builds the page and fires "vg:ready".
   ============================================================ */
(() => {
  "use strict";
  const FILES = ["site", "work", "about", "bench", "lab", "writing", "changelog", "now", "notes", "resume"];
  const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

  /* ---------- defence in depth for text that ends up in innerHTML ----------
     Content only comes from this repo, and the CSP already blocks inline
     scripts, but a pasted tag or a stray quote should still never become
     markup. A zero-width space after "<" stops a tag from opening while the
     text looks the same; straight double quotes become curly ones so they
     can't close an HTML attribute. */
  const URL_KEYS = new Set(["href", "url", "img", "photo", "file", "resume"]);
  const safeText = (s) =>
    s.replace(/<(?=[A-Za-z/!?])/g, "<​").replace(/(^|[\s([{])"/g, "$1“").replace(/"/g, "”");
  const safeUrl = (s) => {
    const v = s.trim();
    if (!v) return "";
    if (/^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(v)) return v.replace(/["<>\s]/g, encodeURIComponent);
    return ""; // javascript:, data:, protocol-relative and anything else is dropped
  };
  const clean = (v, key) => {
    if (typeof v === "string") return URL_KEYS.has(key) ? safeUrl(v) : safeText(v);
    if (Array.isArray(v)) return v.map((x) => clean(x, key));
    if (v && typeof v === "object") {
      const o = {};
      for (const k of Object.keys(v)) o[k] = clean(v[k], k);
      return o;
    }
    return v;
  };
  const swap = (v, map) => {
    if (typeof v === "string") return v.replace(/@(title)\b/g, (m, k) => map[k] ?? m);
    if (Array.isArray(v)) return v.map((x) => swap(x, map));
    if (v && typeof v === "object") { const o = {}; for (const k of Object.keys(v)) o[k] = swap(v[k], map); return o; }
    return v;
  };

  /* ---------- helpers ---------- */
  const todayIST = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD
  const fmtDate = (iso) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? `${MONTHS[+m[2] - 1]} ${+m[3]} ${m[1]}` : iso || "";
  };
  const codes = (s) => [...s].map((c) => c.charCodeAt(0));
  const decodeMail = (b64) => {
    try {
      const [u, d] = atob(b64 || "").split("@");
      return u && d ? { u: codes(u), d: codes(d) } : { u: [], d: [] };
    } catch (e) { return { u: [], d: [] }; }
  };
  const arr = (v) => (Array.isArray(v) ? v : []);
  const byDateDesc = (a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0);

  function build(c) {
    const site = c.site || {};
    const t = site.title || {};
    const title = t.switchOn && todayIST() >= t.switchOn ? t.next || t.current : t.current || site.role;
    const about = c.about || {};
    const bench = c.bench || {};

    const S = {
      ...site,
      title,
      mail: decodeMail(site.emailEncoded),
      work: arr(c.work),
      about: { route: about.route, journey: arr(about.journey), letter: arr(about.letter), awards: arr(about.awards) },
      places: arr(about.places),
      bench: {
        badge: bench.badge || {},
        experience: arr(bench.experience),
        education: arr(bench.education),
        skills: arr(bench.skills),
        hobbies: arr(bench.hobbies),
      },
      certificates: arr(bench.certificates),
      testimonials: arr(bench.testimonials).filter((q) => q && q.quote && q.name),
      lab: arr(c.lab),
      writing: arr(c.writing)
        .filter((p) => !p.draft)
        .map((p, i) => ({ ...p, n: String(i + 1).padStart(2, "0"), iso: p.date, date: fmtDate(p.date), read: (p.minutes || 5) + " MIN" })),
      changelog: arr(c.changelog)
        .map((e) => ({ ...e, label: e.label || MONTHS[+String(e.date).slice(5, 7) - 1] || "" }))
        .sort(byDateDesc),
      now: c.now || { building: [], learning: [], next: [] },
      notes: arr(c.notes),
      resumeDoc: c.resume || { projects: [] },
    };
    delete S.emailEncoded;
    return clean(swap(S, { title }), "");
  }

  const load = (name) =>
    fetch(`/content/${name}.json`, { cache: "no-cache", credentials: "same-origin" }).then((r) => {
      if (!r.ok) throw new Error(`${name}.json: HTTP ${r.status}`);
      return r.json();
    });

  /* The deploy build embeds all content files in each page as <script type="application/json" id="vg-content">,
     so the live site needs no extra request. Without it (local preview) the files are fetched. */
  const embedded = () => {
    const el = document.getElementById("vg-content");
    if (!el) return null;
    try { return JSON.parse(el.textContent); } catch (e) { console.warn("[content] embedded copy unreadable, fetching", e); return null; }
  };
  const fetchAll = () => Promise.all(FILES.map(load)).then((list) => {
    const c = {};
    FILES.forEach((f, i) => (c[f] = list[i]));
    return c;
  });

  const inline = embedded();
  window.SITE_READY = (inline ? Promise.resolve(inline) : fetchAll())
    .then((c) => {
      const S = build(c);
      window.SITE = S;
      return S;
    })
    .catch((err) => {
      console.error("[content]", err);
      const show = () => {
        const box = document.createElement("div");
        box.className = "content-error";
        box.setAttribute("role", "alert");
        box.innerHTML = `<p><b>This page couldn't load its content.</b><br>Check your connection, then try again.</p><button type="button" class="btn">Reload</button>`;
        box.querySelector("button").addEventListener("click", () => location.reload());
        (document.querySelector("main") || document.body).prepend(box);
        document.documentElement.classList.add("is-content-error");
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", show, { once: true });
      else show();
      throw err;
    });
})();
