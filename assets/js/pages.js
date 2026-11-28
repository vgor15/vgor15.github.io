/* ============================================================
   NOW + NOTES — small content pages rendered from data.js
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, S, PAGE, useLenis, reveals, splitIn } = window.V;
  useLenis();
  const fmt = (d) => new Date(d + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

  if (PAGE === "now") {
    const N = S.now;
    qs(".js-updated").textContent = `Updated ${fmt(N.updated)} · ${S.city}`;
    qs(".now-grid").innerHTML = [["Building", N.building], ["Learning", N.learning], ["Next", N.next]]
      .map(([h, list], i) => `<section class="now-card" data-rv="${i * 0.08}"><h2>${h}</h2><ul>${list.map((x) => `<li>${x}</li>`).join("")}</ul></section>`).join("");
  }
  if (PAGE === "notes") {
    qs(".notes").innerHTML = S.notes.map((n, i) => `
      <article class="note-card" data-rv="${(i % 3) * 0.06}">
        <span class="tag">${n.tag}</span><span class="n">N°${String(i + 1).padStart(2, "0")}</span>
        <h3>${n.title}</h3><p>${n.body}</p>
      </article>`).join("");
  }
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const link = (href, text) => {
    if (!href) return "";
    const ext = /^https:\/\//.test(href);
    return `<a class="tag" href="${esc(href)}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ""}>${esc(text)}${ext ? " ↗" : ""}</a>`;
  };
  const isGitHub = (u) => { try { return new URL(u, location.href).hostname === "github.com"; } catch (e) { return false; } };
  if (PAGE === "work") {
    qs(".js-work").innerHTML = S.work.filter((w) => !w.hidden).map((w, i) => `
      <article class="now-card bezel" data-rv="${(i % 3) * 0.06}">
        <h2>${esc(w.year)} · ${esc(w.by)}</h2>
        <h3 style="font:700 22px/1.1 var(--display);letter-spacing:-.03em;margin:6px 0 8px">${esc(w.title)}</h3>
        <p style="color:var(--ink-muted)">${esc(w.summary)}</p>
        <p style="margin-top:12px">${link(w.href, isGitHub(w.href) ? "Code on GitHub" : "Open it")}</p>
      </article>`).join("");
  }
  if (PAGE === "machine") {
    qs(".js-skills").innerHTML = (S.bench.skills || []).map((g, i) => `
      <section class="now-card bezel" data-rv="${i * 0.06}"><h2>${esc(g.group)}</h2><ul>${(g.items || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul></section>`).join("");
    const toys = S.lab.map((l) => ({ title: l.title, desc: l.desc, href: `/lab/${l.slug}` })).concat([{ title: "Drive the site", desc: "Flip switches on a 3D board to pick a page.", href: "/board" }]);
    qs(".js-toys").innerHTML = toys.map((t, i) => `
      <article class="now-card" data-rv="${(i % 3) * 0.05}"><h3 style="font:700 19px/1.1 var(--display);letter-spacing:-.03em;margin-bottom:6px">${esc(t.title)}</h3><p style="color:var(--ink-muted)">${esc(t.desc)}</p><p style="margin-top:10px">${link(t.href, "Try it")}</p></article>`).join("");
  }
  splitIn(qs(".h-page"));
  reveals();
});
