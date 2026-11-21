/* ============================================================
   WRITING — a stack of notebook pages you flip through.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, make, I, S, navigate, REDUCED } = window.V;
  const posts = S.writing;
  const book = qs(".book");
  qs(".writing__sr").innerHTML = posts.map((p) => `<li><a href="/writing/${p.slug}">${p.title} — ${p.excerpt}</a></li>`).join("");
  const pages = posts.map((p) => book.appendChild(make(`
    <a class="book__pg" href="/writing/${p.slug}" aria-label="${p.title}">
      <div class="book__top"><span>Writing · N°${p.n}</span><span>${p.read}</span></div>
      <div>
        <div class="book__n">${p.n}</div>
        <div class="book__t">${p.title}</div>
        <div class="book__x">${p.excerpt}</div>
      </div>
      <div class="book__bot"><span class="tag">${p.tag}</span><span>${p.date}</span></div>
    </a>`)));
  pages.slice().reverse().forEach((p) => book.appendChild(p));
  const ordered = pages;
  let cur = 0;
  const count = qs(".js-count");

  const layout = (animate) => {
    ordered.forEach((pg, i) => {
      const k = i - cur;
      const vars = k < 0
        ? { rotateY: -165, x: -30, opacity: 0, zIndex: 0, rotate: 0, scale: 1 }
        : { rotateY: 0, x: k * 14, y: k * -6, rotate: k * 2.2, scale: 1 - k * 0.035, opacity: k > 3 ? 0 : 1, zIndex: 20 - k };
      if (animate && !REDUCED) gsap.to(pg, { ...vars, duration: 0.9, ease: "power3.inOut" });
      else gsap.set(pg, vars);
      pg.tabIndex = k === 0 ? 0 : -1;
      pg.setAttribute("aria-hidden", String(k !== 0));
    });
    count.textContent = `${String(cur + 1).padStart(2, "0")} / ${String(ordered.length).padStart(2, "0")}`;
  };
  const go = (d) => { const n = Math.max(0, Math.min(ordered.length - 1, cur + d)); if (n !== cur) { cur = n; layout(true); } };
  qs(".js-prev").addEventListener("click", () => go(-1));
  qs(".js-next").addEventListener("click", () => go(1));
  document.addEventListener("keydown", (e) => {
    if (document.querySelector(".is-on.pal, .is-on.sheet, .is-on.wn")) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") go(1);
    if (e.key === "ArrowLeft" || e.key === "ArrowUp") go(-1);
  });
  let sx = null;
  book.addEventListener("pointerdown", (e) => (sx = e.clientX));
  book.addEventListener("pointerup", (e) => { if (sx !== null && Math.abs(e.clientX - sx) > 40) go(e.clientX < sx ? 1 : -1); sx = null; });
  book.addEventListener("click", (e) => { const pg = e.target.closest(".book__pg"); if (pg && ordered.indexOf(pg) !== cur) { e.preventDefault(); go(ordered.indexOf(pg) - cur); } });
  let wheelLock = 0;
  addEventListener("wheel", (e) => { const now = Date.now(); if (now - wheelLock < 700 || Math.abs(e.deltaY) < 12) return; wheelLock = now; go(e.deltaY > 0 ? 1 : -1); }, { passive: true });

  layout(false);
  if (!REDUCED) gsap.from(ordered, { y: 80, opacity: 0, rotateX: 25, duration: 1.1, ease: "power3.out", stagger: 0.08, delay: 0.2 });
});
