/* ============================================================
   ABOUT — postcard, letter, telemetry + CAN bit replay, UART.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, make, I, S, openOverlay, closeOverlay, useLenis, reveals, REDUCED } = window.V;
  const { buildFrame, model } = window.CAN;
  useLenis();

  /* ---------- stamp portrait (falls back to monogram) ---------- */
  const holder = qs(".stamp__img");
  const showMark = () => { holder.innerHTML = `<div class="mono-mark">${window.ART.icons.vg}</div>`; };
  if (S.photo) {
    holder.innerHTML = `<img src="${S.photo}" alt="Portrait of ${S.name}" width="400" height="500" decoding="async">`;
    holder.querySelector("img").addEventListener("error", showMark);
  } else showMark();

  /* ---------- postmarks ---------- */
  const ring = (id, cx, cy, r, text, rot) => `
    <svg width="${r * 2 + 8}" height="${r * 2 + 8}" viewBox="0 0 ${r * 2 + 8} ${r * 2 + 8}" style="left:${cx - r - 4}px;top:${cy - r - 4}px;transform:rotate(${rot}deg)" aria-hidden="true">
      <defs><path id="${id}" d="M ${r + 4},${r + 4} m -${r - 10},0 a ${r - 10},${r - 10} 0 1,1 ${(r - 10) * 2},0 a ${r - 10},${r - 10} 0 1,1 -${(r - 10) * 2},0"/></defs>
      <circle cx="${r + 4}" cy="${r + 4}" r="${r}" fill="none" stroke="currentColor" stroke-width="1.6"/>
      <circle cx="${r + 4}" cy="${r + 4}" r="${r - 22}" fill="none" stroke="currentColor" stroke-width="1"/>
      <text font-family="Geist Mono, monospace" font-size="9.5" fill="currentColor" letter-spacing="1.5"><textPath href="#${id}">${text}</textPath></text>
    </svg>`;
  const waves = (x, y, w) => `
    <svg width="${w}" height="44" viewBox="0 0 ${w} 44" style="left:${x}px;top:${y}px" aria-hidden="true">
      ${[6, 18, 30].map((yy) => `<path d="M0 ${yy} ${Array.from({ length: Math.ceil(w / 20) }, (_, i) => `q 5 -6 10 0 t 10 0`).join(" ")}" fill="none" stroke="currentColor" stroke-width="1.4"/>`).join("")}
    </svg>`;
  const J = S.about.journey;
  const marks = qs(".pc-marks");
  const mw = 520;
  const fitMarks = () => {
    const avail = marks.parentElement.clientWidth;
    const sc = Math.min(1, avail / mw);
    marks.style.width = mw + "px";
    marks.style.transformOrigin = "0 0";
    marks.style.transform = `scale(${sc})`;
    marks.style.marginBottom = `${-150 * (1 - sc)}px`;
  };
  fitMarks();
  addEventListener("resize", fitMarks);
  marks.innerHTML =
    ring("pm1", 60, 74, 52, `${J[0].place} · ${J[0].years} · ${J[0].note.toUpperCase()} ·`, -12) +
    waves(110, 40, 140) +
    ring("pm2", Math.min(mw - 160, 330), 86, 46, `${J[1].place} · ${J[1].years} ·`, 8) +
    ring("pm3", Math.min(mw - 60, 450), 70, 40, `${J[2].place} · ${J[2].years} ·`, -4) +
    `<svg width="54" height="40" viewBox="0 0 54 40" style="left:${Math.min(mw - 220, 250)}px;top:4px" aria-hidden="true"><rect x="10" y="8" width="34" height="24" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M16 8V3M22 8V3M28 8V3M34 8V3M40 8V3M16 37v-5M22 37v-5M28 37v-5M34 37v-5M40 37v-5" stroke="currentColor" stroke-width="1.2"/><text x="27" y="24" text-anchor="middle" font-family="Geist Mono" font-size="7" fill="currentColor">ARM7</text></svg>`;

  /* ---------- social row ---------- */
  qs(".pc-social").innerHTML = S.socials.map((s) => `<a href="${s.url}" target="_blank" rel="noopener noreferrer" aria-label="${s.label}">${I[s.icon]}</a>`).join("");
  qs(".route").textContent = S.about.route;

  /* ---------- letter sheet ---------- */
  const sig = `<svg class="sig" viewBox="0 0 170 60" fill="none" aria-label="Signature"><path class="sig-path" d="M6 18c6 14 10 26 13 30 5-14 9-26 15-36M38 30c2 10 6 14 10 8 3-5 3-12 3-12m0 0c0 14-2 26-10 28M60 28c-4 0-7 5-6 10 1 6 9 5 10-1 1-5-1-9-4-9M70 27c0 6-1 12-1 15m0-10c2-5 6-6 8-3 1 2 1 9 1 13m0-10c2-5 6-6 8-3 1 2 1 9 1 13M96 44c10-2 30-6 64-18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const letter = make(`
    <div class="sheet" role="dialog" aria-modal="true" aria-label="The letter">
      <div class="sheet__head"><span class="sheet__label">The letter ::</span><button class="sheet__x js-x" type="button" aria-label="Close">${I.close}</button></div>
      ${S.about.letter.map((p, i) => `<p${i === 0 ? ' class="muted"' : ""}>${p}</p>`).join("")}
      ${sig}
    </div>`);
  document.body.append(letter);
  qs(".js-x", letter).addEventListener("click", closeOverlay);
  const path = qs(".sig-path", letter);
  qs(".js-letter").addEventListener("click", () => {
    openOverlay(letter);
    if (!REDUCED) {
      const len = path.getTotalLength();
      gsap.fromTo(path, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.inOut", delay: 0.35 });
    }
  });

  /* ---------- awards sheet ---------- */
  const awards = make(`
    <div class="sheet" role="dialog" aria-modal="true" aria-label="Awards">
      <div class="sheet__head"><span class="sheet__label">On the shelf ::</span><button class="sheet__x js-x" type="button" aria-label="Close">${I.close}</button></div>
      <ul>${S.about.awards.map((a) => `<li><b style="color:var(--ink);font-weight:560">${a.title}</b> — ${a.note}</li>`).join("")}</ul>
    </div>`);
  document.body.append(awards);
  qs(".js-x", awards).addEventListener("click", closeOverlay);
  qs(".js-awards").addEventListener("click", () => openOverlay(awards));

  /* ---------- telemetry values ---------- */
  qs(".js-pos").textContent = S.pos;
  qs(".js-repos").textContent = `${S.github.repos} PUBLIC`;
  qs(".js-commits").textContent = `${S.github.contributions} / YR`;

  /* ---------- CAN bit replay grid ---------- */
  const grid = qs(".bus-grid");
  const COLS = 26, ROWS = 7, CELLS = COLS * ROWS;
  grid.innerHTML = "<i></i>".repeat(CELLS);
  const cells = [...grid.children];
  const sim = { speedAdc: 512, tempAdc: model.adcForTemp(26), t: 0 };
  const nextFrame = () => {
    sim.t += 0.35;
    sim.speedAdc = Math.round(512 + 380 * Math.sin(sim.t) + 60 * Math.sin(sim.t * 3.1));
    sim.tempAdc = model.adcForTemp(26 + Math.round(2 * Math.sin(sim.t * 0.4)));
    return buildFrame(0x500, model.payload(sim.speedAdc, sim.tempAdc));
  };
  let stream = [], ptr = 0, frame = null;
  const fieldLabel = qs(".js-field");
  const uartBig = qs(".uart__big"), uartLog = qs(".uart__log");
  const logLines = [];
  const pushUart = () => {
    const kmh = model.speedKmh(sim.speedAdc), c = model.tempC(sim.tempAdc);
    uartBig.textContent = `S:${String(kmh).padStart(3, "0")}k/h  T:${String(c).padStart(3, "0")}°c`;
    logLines.unshift(`uart speed ${sim.speedAdc}`, `uart temp ${c}`);
    logLines.length = 6;
    uartLog.innerHTML = logLines.filter(Boolean).slice(0, 3).map((l) => `<div>${l}</div>`).join("");
  };
  const step = () => {
    if (ptr >= stream.length) {
      frame = nextFrame();
      stream = frame.bits.concat(Array(12).fill({ b: 1, f: "IDLE" }));
      ptr = 0;
      pushUart();
    }
    const bit = stream[ptr++];
    for (let i = 0; i < CELLS - 1; i++) cells[i].className = cells[i + 1].className;
    cells[CELLS - 1].className = bit.f === "IDLE" ? "" : bit.stuff ? "l3" : bit.b ? "l2" : "l1";
    fieldLabel.textContent = bit.f === "IDLE" ? "BUS IDLE" : `${bit.f}${bit.stuff ? " · STUFF" : ""}`;
  };
  for (let i = 0; i < CELLS; i++) step();
  setInterval(step, REDUCED ? 400 : 45);

  /* ---------- intro ---------- */
  if (!REDUCED) {
    gsap.from(".postcard", { y: 40, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.15 });
    gsap.from(".stamp", { rotate: -6, y: 20, duration: 1.3, ease: "power3.out", delay: 0.25 });
    gsap.from(".pc-marks svg", { scale: 1.6, opacity: 0, duration: 0.6, ease: "back.out(2)", stagger: 0.12, delay: 0.6 });
  }
  reveals();
});
