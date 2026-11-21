/* ============================================================
   BENCH — swinging lanyard badge (spring pendulum) + sections.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, S, useLenis, reveals, REDUCED } = window.V;
  useLenis();
  const B = S.bench;

  /* ---------- badge content ---------- */
  qs(".badge__top").innerHTML = `<span>${B.badge.kind}</span><span>${B.badge.year}</span>`;
  qs(".badge__icon").innerHTML = window.ART.icons.can;
  qs(".badge__name").textContent = S.name;
  qs(".badge__role").textContent = B.badge.role;
  qs(".badge__bot").innerHTML = `<span>${B.badge.org}</span><span>${B.badge.loc}</span>`;

  /* ---------- sections ---------- */
  qs(".js-xp").innerHTML = B.experience.map((x) => `
    <div class="xp" data-rv>
      <div class="xp__when">${x.when}<br>${x.where}</div>
      <div>
        <div class="xp__role">${x.role} <span class="xp__org">· ${x.org}</span></div>
        <p>${x.text}</p>
        <ul>${x.points.map((p) => `<li>${p}</li>`).join("")}</ul>
      </div>
    </div>`).join("");
  qs(".js-edu").innerHTML = B.education.map((e) => `
    <div class="xp" data-rv>
      <div class="xp__when">${e.when}</div>
      <div><div class="xp__role">${e.title}</div><p>${e.where} · ${e.note}</p></div>
    </div>`).join("");
  qs(".js-skills").innerHTML = B.skills.map((g) => `<div data-rv><h3>${g.group}</h3><ul>${g.items.map((i) => `<li>${i}</li>`).join("")}</ul></div>`).join("");
  qs(".js-hobbies").innerHTML = B.hobbies.map((h) => `<span class="tag" style="height:26px;padding:0 10px;font-size:11px">${h}</span>`).join("");

  /* ---------- pendulum ---------- */
  const rig = qs(".lanyard__rig"), badge = qs(".badge"), card = qs(".badge__card");
  const s = { a: 0, v: 0, drag: false, off: 0 };
  const K = 0.035, DAMP = 0.965;
  const pivot = () => { const r = qs(".lanyard").getBoundingClientRect(); return { x: r.left, y: r.top }; };
  const angleTo = (x, y) => { const p = pivot(); return Math.atan2(x - p.x, y - p.y); };

  badge.addEventListener("pointerdown", (e) => {
    s.drag = true; s.off = angleTo(e.clientX, e.clientY) + s.a;
    badge.classList.add("is-drag");
    badge.setPointerCapture(e.pointerId);
  });
  badge.addEventListener("pointermove", (e) => {
    if (!s.drag) return;
    const target = -(angleTo(e.clientX, e.clientY) - s.off);
    const na = Math.max(-1.1, Math.min(1.1, target));
    s.v = na - s.a; s.a = na;
  });
  const end = () => { s.drag = false; badge.classList.remove("is-drag"); };
  badge.addEventListener("pointerup", end);
  badge.addEventListener("pointercancel", end);
  badge.addEventListener("dblclick", () => (s.v += 0.12));

  gsap.ticker.add(() => {
    if (!s.drag) { s.v += -s.a * K; s.v *= DAMP; s.a += s.v; }
    rig.style.transform = `rotate(${s.a * 57.3}deg)`;
    card.style.setProperty("--sheen", `${-60 + s.a * 160}%`);
  });

  if (!REDUCED) {
    gsap.from(rig, { y: -560, duration: 1.4, ease: "elastic.out(1, 0.55)", delay: 0.2, onComplete: () => (s.v = 0.045) });
  }
  reveals();
});
