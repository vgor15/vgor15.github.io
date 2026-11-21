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
  splitIn(qs(".h-page"));
  reveals();
});
