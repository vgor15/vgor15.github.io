/* ============================================================
   RECORD — frame any page of this site at a fixed size for
   screen recordings. H / Esc hides the bar.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, S } = window.V;
  const html = document.documentElement;
  const sel = qs("#recPage"), frame = qs(".rec-frame"), stage = qs(".rec-stage"), size = qs(".rec-size");
  const pages = [["Home", "/"], ...S.nav.map((n) => [n.label, n.href]), ["Changelog", "/changelog"], ...S.lab.map((l) => ["Lab · " + l.title, "/lab/" + l.slug]), ...S.writing.map((w) => ["Writing · " + w.title, "/writing/" + w.slug])];
  sel.innerHTML = pages.map(([l, h]) => `<option value="${h}">${l}</option>`).join("");
  const ratios = { "16:10": [1440, 900], "16:9": [1600, 900], "4:3": [1200, 900], "1:1": [1080, 1080], "9:16": [430, 764] };
  let ratio = "16:10", fit = true;

  const layout = () => {
    const [w, h] = ratios[ratio];
    frame.style.width = w + "px"; frame.style.height = h + "px";
    const r = stage.getBoundingClientRect();
    const sc = fit ? Math.min(r.width / w, r.height / h, 1) : 1;
    frame.style.transform = `scale(${sc})`;
    size.textContent = `${w} × ${h} · ${Math.round(sc * 100)}%`;
  };
  const load = () => { frame.src = sel.value; };
  sel.addEventListener("change", load);
  qsa("[data-ratio]").forEach((b) => b.addEventListener("click", () => { ratio = b.dataset.ratio; qsa("[data-ratio]").forEach((x) => x.classList.toggle("is-on", x === b)); layout(); }));
  qs(".js-fit").addEventListener("click", (e) => { fit = !fit; e.currentTarget.classList.toggle("is-on", fit); layout(); });
  qs(".js-bare").addEventListener("click", (e) => { html.classList.toggle("rec-bare"); e.currentTarget.classList.toggle("is-on"); layout(); });
  qs(".js-hide").addEventListener("click", () => html.classList.add("rec-hide"));
  document.addEventListener("keydown", (e) => {
    if (/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
    if (e.key === "h" || e.key === "H" || (e.key === "Escape" && html.classList.contains("rec-hide"))) html.classList.toggle("rec-hide");
  });
  addEventListener("resize", layout);
  load();
  layout();
});
