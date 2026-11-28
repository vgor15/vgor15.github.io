/* What each place on the island shows. Shared by the 3D island (as pop-up
   panels) and the no-3D fallback (as one long storybook page).
   Every link stays on the island: lab toys, posts and the résumé open in the
   in-island reader; old section URLs travel to the matching place. */

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const safe = (u) => (/^(https:\/\/|\/(?!\/))/.test(String(u || "")) ? String(u) : "");
const S = () => window.SITE || {};

/* old URLs → island places */
export const ROUTE_ZONE = { "/": "plaza", "/about": "house", "/bench": "house", "/work": "workshop", "/machine": "garden", "/contact": "post", "/now": "plaza", "/notes": "library", "/changelog": "library", "/writing": "library", "/lab": "arcade" };
/* pages that still exist on their own and open inside the island reader */
export const isReader = (h) => /^\/(lab\/[\w-]+|writing\/[\w-]+|resume|board|404|record)$/.test(h);

/* one link, island style: external → new tab, reader pages → reader, sections → travel */
export function go(href, label, cls = "isl-btn") {
  const h = safe(href); if (!h) return "";
  if (/^https:\/\//.test(h)) return `<a class="${cls}" href="${esc(h)}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
  if (isReader(h)) return `<button type="button" class="${cls} js-read" data-href="${esc(h)}" data-title="${esc(label)}">${esc(label)}</button>`;
  const z = ROUTE_ZONE[h];
  if (z) return `<button type="button" class="${cls} js-goto" data-zone="${z}">${esc(label)}</button>`;
  return "";
}
export const mailAddr = () => { const m = S().mail; try { return m ? String.fromCharCode(...m.u) + "@" + String.fromCharCode(...m.d) : ""; } catch (e) { return ""; } };

const ICON = { can: "🚗", cell: "🐚", test: "🧪", lcd: "📟", tree: "🌳", grid: "#️⃣", chip: "🔌" };
const LABICON = { "can-bus": "🚌", "glyph-studio": "🔤", "logic-analyzer": "📈", "register-flipper": "🎚️", "led-matrix": "💡", shell: "🐚" };
const head = (kicker, title) => `<p class="isl-kicker">${kicker}</p><h2 class="isl-h" id="isl-sheet-h">${title}</h2>`;
const workCard = (w) => `<article class="isl-card"><span class="isl-card__ic" aria-hidden="true">${ICON[w.icon] || "✨"}</span><div><h3>${esc(w.title)}</h3><p class="isl-meta">${esc(w.by)} · ${esc(w.year)}</p><p>${esc(w.summary)}</p><p class="isl-row">${go(w.href, /^https:/.test(w.href || "") ? "Open on GitHub" : /^\/lab\//.test(w.href || "") ? "Play it here" : "Read more", "isl-btn isl-btn--sm")}</p></div></article>`;
const labTile = (l) => `<button type="button" class="isl-big js-read" data-href="/lab/${esc(encodeURIComponent(l.slug))}" data-title="${esc(l.title)}"><span aria-hidden="true">${LABICON[l.slug] || "🧪"}</span><b>${esc(l.title)}</b><small>${esc(l.desc)}</small></button>`;

export const PANELS = {
  plaza: () => { const s = S(), n = s.now || {};
    return `${head("📡 Welcome Plaza", `Hi, I'm ${esc(s.first || "Vyom")}!`)}
    <p class="isl-lede">${esc(s.title || s.role)} at ${esc(s.company)} in ${esc(s.city)}. ${esc(s.tagline)}</p>
    ${["building", "learning", "next"].map((k) => (n[k] || []).length ? `<div class="isl-group"><h3>${{ building: "Building right now", learning: "Learning", next: "Up next" }[k]}</h3><ul class="isl-list">${n[k].map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>` : "").join("")}
    <p class="isl-more">${go("/work", "See what I built", "isl-btn isl-btn--go")}${go("/contact", "Say hello")}</p>`; },
  workshop: () => `${head("🛠️ The Workshop", "Things Vyom built")}<div class="isl-cards">${(S().work || []).filter((w) => !w.hidden).map(workCard).join("")}</div>`,
  project: (w) => `${head("🔎 Up close", `${ICON[w.icon] || "✨"} ${esc(w.title)}`)}<p class="isl-meta">${esc(w.by)} · ${esc(w.year)}</p><p class="isl-lede">${esc(w.summary)}</p>
    <p class="isl-more">${go(w.href, /^https:/.test(w.href || "") ? "Open on GitHub" : "Take a look", "isl-btn isl-btn--go")}<button type="button" class="isl-btn js-panel" data-p="workshop">All projects</button></p>`,
  garden: () => { const s = S(), sk = (s.bench && s.bench.skills) || [];
    return `${head("🌱 Skill Garden", "What Vyom can do")}
    ${sk.map((g) => `<div class="isl-group"><h3>${esc(g.group)}</h3><ul class="isl-chips">${(g.items || []).map((i) => `<li>${esc(i)}</li>`).join("")}</ul></div>`).join("")}
    <h3 class="isl-h3">Try the skills yourself</h3><div class="isl-contact">${(s.lab || []).slice(0, 6).map(labTile).join("")}</div>`; },
  house: () => { const s = S(), a = s.about || {}, b = s.bench || {};
    return `${head("🏡 Vyom's House", `Hi, I'm ${esc(s.first || "Vyom")}`)}
    <p class="isl-meta">${esc(s.title)} · ${esc(s.company)} · ${esc(s.city)}</p>
    ${(a.letter || []).map((p) => `<p>${esc(p)}</p>`).join("")}
    ${(a.journey || []).length ? `<ol class="isl-route">${a.journey.map((j) => `<li><b>${esc(j.place)}</b><span>${esc(j.years)} · ${esc(j.note)}</span></li>`).join("")}</ol>` : ""}
    ${(b.experience || []).length ? `<h3 class="isl-h3">Where I've worked</h3><ul class="isl-time">${b.experience.map((x) => `<li><span class="isl-meta">${esc(x.when)} · ${esc(x.where)}</span><b>${esc(x.role)} · ${esc(x.org)}</b><p>${esc(x.text)}</p>${(x.points || []).length ? `<ul class="isl-list">${x.points.map((p) => `<li>${esc(p)}</li>`).join("")}</ul>` : ""}</li>`).join("")}</ul>` : ""}
    ${(b.education || []).length ? `<h3 class="isl-h3">School</h3><ul class="isl-time isl-time--alt">${b.education.map((e) => `<li><span class="isl-meta">${esc(e.when)}</span><b>${esc(e.title)}</b><p>${esc(e.where)}${e.note ? ` · ${esc(e.note)}` : ""}</p></li>`).join("")}</ul>` : ""}
    ${(a.awards || []).length ? `<h3 class="isl-h3">Proud of</h3><ul class="isl-chips">${a.awards.map((x) => `<li>🏅 ${esc(x.title)}</li>`).join("")}</ul>` : ""}
    <p class="isl-more">${go("/resume", "Read the résumé", "isl-btn isl-btn--go")}${go("/contact", "Write to me")}</p>`; },
  post: () => { const s = S(), so = s.socials || [];
    return `${head("📮 Post Office", "Say hello to Vyom")}<p class="isl-lede">Jobs, projects, questions or just a hi. Every message gets read.</p>
    <form class="isl-letter js-letter"><label><span>Your name</span><input name="n" autocomplete="name" maxlength="80" required></label>
      <label><span>Your message</span><textarea name="m" rows="4" maxlength="2000" required></textarea></label>
      <button class="isl-btn isl-btn--go" type="submit">Post it ✉️</button><small>Opens your own mail app with the letter ready. Nothing is sent from this page.</small></form>
    <div class="isl-contact"><button type="button" class="isl-big js-mail"><span aria-hidden="true">✉️</span><b>Email</b><small class="js-mail-addr">Tap to show the address</small></button>
    ${s.cal ? `<a class="isl-big" href="https://cal.com/${esc(s.cal)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📅</span><b>Book a call</b><small>15 minutes, free</small></a>` : ""}
    ${so.map((x) => { const h = safe(x.url); return h ? `<a class="isl-big" href="${esc(h)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">${x.icon === "github" ? "🐙" : x.icon === "linkedin" ? "💼" : "🐦"}</span><b>${esc(x.label)}</b><small>${esc(h.replace(/^https:\/\/(www\.)?/, ""))}</small></a>` : ""; }).join("")}
    <button type="button" class="isl-big js-read" data-href="/resume" data-title="Résumé"><span aria-hidden="true">📄</span><b>Résumé</b><small>one page, printable</small></button></div>`; },
  arcade: () => `${head("🕹️ The Arcade", "Games and toys")}
    <div class="isl-contact"><button type="button" class="isl-big js-game" data-g="packets"><span aria-hidden="true">📦</span><b>Packet Catch</b><small>catch the good messages</small></button>
    <button type="button" class="isl-big js-game" data-g="bits"><span aria-hidden="true">💡</span><b>Bit Flip</b><small>count like a computer</small></button>
    <button type="button" class="isl-big js-read" data-href="/404" data-title="Breakout"><span aria-hidden="true">🧱</span><b>Breakout</b><small>smash the bricks</small></button>
    <button type="button" class="isl-big js-read" data-href="/board" data-title="The Board"><span aria-hidden="true">🔌</span><b>The Board</b><small>flip real-looking switches</small></button>
    ${(S().lab || []).map(labTile).join("")}</div>`,
  busstop: () => `${head("🚌 CAN Bus Stop", "The CAN bus, for real")}<p class="isl-lede">Cars are full of little computers that talk over one shared wire called a CAN bus. Vyom built a mini version with two boards: one reads the speed and temperature, the other shows it on a screen.</p><p>You can play with a copy of it right here.</p>
    <p class="isl-more">${go("/lab/can-bus", "Play the CAN Bus Lab", "isl-btn isl-btn--go")}<button type="button" class="isl-btn js-ride">Ride the island bus</button></p>`,
  library: () => { const w = S().writing || [];
    return `${head("📚 The Library", "Stories from the bench")}
    <div class="isl-cards">${w.map((p) => `<article class="isl-card isl-card--post"><div><p class="isl-meta">${esc(p.date)} · ${esc(p.read)}</p><h3>${esc(p.title)}</h3><p>${esc(p.excerpt)}</p><p class="isl-row">${go(`/writing/${p.slug}`, "Read it", "isl-btn isl-btn--sm")}</p></div></article>`).join("")}</div>
    <p class="isl-more"><button type="button" class="isl-btn js-panel" data-p="notes">Notes and logbook</button></p>`; },
  notes: () => { const s = S(), n = s.notes || [], c = (s.changelog || []).slice(0, 12);
    return `${head("📝 Library shelf", "Notes and logbook")}
    ${n.length ? `<div class="isl-cards">${n.map((x) => `<article class="isl-card isl-card--post"><div><p class="isl-meta">${esc(x.tag)}</p><h3>${esc(x.title)}</h3><p>${esc(x.body)}</p></div></article>`).join("")}</div>` : ""}
    <h3 class="isl-h3">What changed lately</h3><ul class="isl-time">${c.map((x) => `<li><span class="isl-meta">${esc(x.date)} · ${esc(x.type)}</span><b>${esc(x.title)}</b><p>${esc(x.desc)}</p></li>`).join("")}</ul>
    <p class="isl-more"><button type="button" class="isl-btn js-panel" data-p="library">Back to the posts</button></p>`; },
};

/* The no-3D island: every place as one bright, readable page. */
export function storybook(withIslandButton) {
  const order = [["plaza", "📡"], ["workshop", "🛠️"], ["garden", "🌱"], ["house", "🏡"], ["library", "📚"], ["notes", "📝"], ["arcade", "🕹️"], ["busstop", "🚌"], ["post", "📮"]];
  return `<div class="isl-plain">
    <header class="isl-plain__top"><span class="isl-plain__logo" aria-hidden="true">VYOM</span>
      <nav aria-label="Island places">${order.map(([id, ic]) => `<a href="#p-${id}">${ic} <span>${{ plaza: "Hello", workshop: "Work", garden: "Skills", house: "About", library: "Writing", notes: "Notes", arcade: "Arcade", busstop: "CAN bus", post: "Contact" }[id]}</span></a>`).join("")}</nav>
      ${withIslandButton ? `<button type="button" class="isl-btn isl-btn--go js-island-on">Explore the 3D island</button>` : ""}</header>
    ${order.map(([id]) => `<section class="isl-plain__sec" id="p-${id}" aria-labelledby="h-${id}">${PANELS[id]().replace('id="isl-sheet-h"', `id="h-${id}"`)}</section>`).join("")}
  </div>`;
}
