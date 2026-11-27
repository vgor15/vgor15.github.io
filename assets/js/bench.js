/* ============================================================
   BENCH — swinging lanyard badge (spring pendulum) + sections.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, S, useLenis, reveals, REDUCED } = window.V;
  useLenis();
  const B = S.bench;
  const NOHOVER = matchMedia("(hover: none)").matches;

  /* ---------- badge content ---------- */
  qs(".badge__top").innerHTML = `<span>${B.badge.kind}</span><span>${B.badge.year}</span>`;
  qs(".badge__icon").innerHTML = S.photo ? `<img src="${S.photo}" alt="${S.name}" width="92" height="92" decoding="async">` : window.ART.icons.can;
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
  /* ---------- datasheet ---------- */
  const pins = [
    ["C", "Primary language: CAN dashboard firmware, imperfect_cell, production-test tooling", "/lab/can-bus"],
    ["C++", "Data structures practice", "https://github.com/vgor15/Leetcode"],
    ["ARM7", "LPC2129: GPIO, ADC, timers, VIC interrupts", "/lab/register-flipper"],
    ["CAN", "Two-node CAN 2.0B network, frame 0x500", "/lab/can-bus"],
    ["UART", "Debug logging at 9600 8N1", "/lab/logic-analyzer"],
    ["I2C", "GPIO expanders for LEDs, buzzers and buttons", "/lab/logic-analyzer"],
    ["SPI", "MCP3204 ADC driver in Vector India labs", "/lab/logic-analyzer"],
    ["RTOS", "Basics: tasks and scheduling (Vector India)", ""],
    ["Linux", "System programming: processes, signals, threads", "/writing/a-shell-is-a-loop"],
    ["fork", "fork / execvp / wait in imperfect_cell", "/lab/shell"],
    ["pthr", "POSIX threads in multithreaded test tooling", ""],
    ["sysd", "systemd services for deployment", ""],
    ["GDB", "Low-level debugging", ""],
    ["Git", `Version control · ${S.github.repos} public repos`, "https://github.com/vgor15"],
    ["Py", "Scripting and tooling", ""],
    ["VCC", "Curiosity, 3.3 V nominal", ""],
  ];
  const dsEl = qs(".js-ds");
  const pinSvg = () => {
    let s = `<svg viewBox="0 0 360 300" role="img" aria-label="DIP-16 chip with skills as pins">
      <rect x="110" y="20" width="140" height="260" rx="8" fill="var(--ink)"/>
      <path d="M165 20a15 15 0 0 0 30 0" fill="var(--surface)"/>
      <circle cx="128" cy="40" r="5" fill="var(--surface)" opacity=".5"/>
      <text x="180" y="146" text-anchor="middle" fill="var(--gold-soft)" font-family="Geist Mono" font-size="14" transform="rotate(-90 180 150)">VG-2026E</text>`;
    pins.forEach(([name], i) => {
      const left = i < 8, k = left ? i : 15 - i;
      const y = 38 + k * 30;
      const x = left ? 82 : 250;
      s += `<g class="pin" data-pin="${i}" tabindex="0" role="button" aria-label="Pin ${i + 1}: ${name}">
        <rect class="pin__hit" x="${left ? 0 : 250}" y="${y - 9}" width="110" height="30" fill="transparent"/>
        <rect x="${x}" y="${y}" width="28" height="12" rx="2"/>
        <text class="pn" x="${left ? 128 : 232}" y="${y + 10}" text-anchor="middle" fill="var(--paper)">${i + 1}</text>
        <text x="${left ? 74 : 286}" y="${y + 10}" text-anchor="${left ? "end" : "start"}">${name}</text>
      </g>`;
    });
    return s + `</svg>`;
  };
  dsEl.innerHTML = `
    <div class="ds__top">
      <div class="ds__pn">PART NO.<b>VG-2026E</b>Embedded software engineer · rev 2026.11</div>
      <p class="ds__desc">General-purpose embedded engineer in a one-person package. C/C++ core, ARM7 peripherals, CAN and serial buses, Linux userspace. ${NOHOVER ? "Tap" : "Hover"} a pin to see where it was used.</p>
    </div>
    <div class="ds__body">
      <div class="ds__chip">${pinSvg()}</div>
      <table class="ds__tbl"><thead><tr><th>Pin</th><th>Name</th><th>Function · where it was used</th></tr></thead>
        <tbody>${pins.map(([n, f, h], i) => `<tr data-pin="${i}"><td>${i + 1}</td><td>${n}</td><td>${h ? `<a href="${h}"${/^https?:/.test(h) ? ' target="_blank" rel="noopener noreferrer"' : ""}>${f}</a>` : f}</td></tr>`).join("")}</tbody></table>
    </div>
    <div class="ds__cond">
      <div>Location<b>${S.city}, IN</b></div>
      <div>Timezone<b>IST · UTC+5:30</b></div>
      <div>Status<b>${S.status}</b></div>
      <div>Package<b>DIP-16 · 1 human</b></div>
    </div>`;
  const hi = (i, on) => qsa(`[data-pin="${i}"]`, dsEl).forEach((el) => el.classList.toggle("is-on", on));
  qsa("[data-pin]", dsEl).forEach((el) => {
    el.addEventListener("mouseenter", () => { hi(el.dataset.pin, true); window.V.sfx("tick"); });
    el.addEventListener("mouseleave", () => hi(el.dataset.pin, false));
    el.addEventListener("focus", () => hi(el.dataset.pin, true));
    el.addEventListener("blur", () => hi(el.dataset.pin, false));
    // Touch screens have no hover: a tap highlights the pin until the next tap.
    el.addEventListener("click", () => {
      if (!NOHOVER) return;
      const was = el.classList.contains("is-on");
      qsa("[data-pin].is-on", dsEl).forEach((x) => x.classList.remove("is-on"));
      if (!was) hi(el.dataset.pin, true);
    });
  });

  /* ---------- certificates ---------- */
  const seal = `<svg class="cert__seal" viewBox="0 0 60 60" fill="none" aria-hidden="true">${Array.from({ length: 16 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return `<path d="M${30 + Math.cos(a) * 22} ${30 + Math.sin(a) * 22} L${30 + Math.cos(a + 0.2) * 28} ${30 + Math.sin(a + 0.2) * 28}" stroke="currentColor" stroke-width="2"/>`; }).join("")}<circle cx="30" cy="30" r="20" stroke="currentColor" stroke-width="2"/><circle cx="30" cy="30" r="14" stroke="currentColor" stroke-width="1"/><path d="M23 30l5 5 9-10" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  qs(".js-certs").innerHTML = S.certificates.map((c, i) => `
    <article class="cert" data-rv="${i * 0.08}">
      ${seal}
      <span class="cert__k">Certificate · N°${String(i + 1).padStart(2, "0")}</span>
      <h3 class="cert__t">${c.title}</h3>
      <span class="cert__o">${c.org}</span>
      <p class="cert__n">${c.note}</p>
      <div class="cert__f"><span>${c.when}</span><span>${c.file ? `<a href="${c.file}" target="_blank" rel="noopener">View original ↗</a>` : "Original on request"}</span></div>
    </article>`).join("");

  /* ---------- testimonials (hidden until real quotes exist) ---------- */
  if (S.testimonials && S.testimonials.length) {
    qs(".js-quotes").innerHTML = S.testimonials.map((t) => `<figure class="quote" data-rv><p>${t.quote}</p><footer>${t.name} · ${t.role}</footer></figure>`).join("");
    qs(".js-quotes-sec").hidden = false;
  }

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
