/* ============================================================
   CONTACT — a letter you fill in and sign, plus a ticket stub.
   "Send it" opens the visitor's mail app (mailto); nothing is
   posted anywhere.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, S, email, mailto, copyEmail, openCal, useLenis, toast, REDUCED } = window.V;
  useLenis();

  const fmt = (d) => d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: S.tz }).toUpperCase();
  const today = new Date();
  qs(".js-date").textContent = fmt(today);
  qs(".js-loc").textContent = `${S.city.toUpperCase()}, ${S.country.toUpperCase()}`;

  /* reveal email in the letterhead */
  const rev = qs(".js-reveal");
  rev.addEventListener("click", () => {
    const m = email();
    const a = document.createElement("a");
    a.href = "mailto:" + m; a.textContent = m.toUpperCase();
    a.style.textDecoration = "underline";
    rev.replaceWith(a);
  });

  /* RE:: options */
  let re = "Opportunity";
  const opts = qsa(".l-re__opts button");
  const drawRe = () => opts.forEach((b) => { b.textContent = `[${b.dataset.re === re ? "X" : " "}] ${b.dataset.re}`; b.setAttribute("aria-pressed", String(b.dataset.re === re)); });
  opts.forEach((b) => b.addEventListener("click", () => { re = b.dataset.re; drawRe(); stub(); }));
  drawRe();

  /* signature pad */
  const pad = qs(".l-sign canvas"), ph = qs(".l-sign__ph"), clr = qs(".l-sign__clr");
  const ctx = pad.getContext("2d");
  let signed = false, drawing = false, last = null;
  const sizePad = () => {
    const r = pad.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    pad.width = r.width * dpr; pad.height = r.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#1e1e1e";
  };
  sizePad();
  addEventListener("resize", () => { if (!signed) sizePad(); });
  const pos = (e) => { const r = pad.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top, t: performance.now() }; };
  pad.addEventListener("pointerdown", (e) => { drawing = true; last = pos(e); pad.setPointerCapture(e.pointerId); });
  pad.addEventListener("pointermove", (e) => {
    if (!drawing) return;
    const p = pos(e);
    const v = Math.hypot(p.x - last.x, p.y - last.y) / Math.max(1, p.t - last.t);
    ctx.lineWidth = Math.max(0.9, 2.6 - v * 1.4);
    ctx.beginPath(); ctx.moveTo(last.x, last.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last = p;
    if (!signed) { signed = true; ph.hidden = true; clr.hidden = false; status(); }
  });
  addEventListener("pointerup", () => (drawing = false));
  clr.addEventListener("click", () => { ctx.clearRect(0, 0, pad.width, pad.height); signed = false; ph.hidden = false; clr.hidden = true; status(); });

  /* status + send */
  const from = qs("#from"), via = qs("#via"), body = qs("#letter"), name = qs("#name"), send = qs(".l-send"), stat = qs(".js-status");
  const valid = () => /\S+@\S+\.\S+/.test(from.value) && body.value.trim().length > 3;
  function status() {
    stat.textContent = `ONE REPLY, NO NEWSLETTER · ${signed ? "SIGNED" : "NOT YET SIGNED"}`;
    send.disabled = !valid();
  }
  [from, via, body, name].forEach((el) => el.addEventListener("input", () => { status(); stub(); }));
  status();

  /* ticket stub */
  const st = {
    job: qs(".js-job"), rec: qs(".js-rec"), reply: qs(".js-reply"), status: qs(".js-stat"), file: qs(".js-file"),
  };
  function stub(sent) {
    st.job.textContent = name.value.trim() ? name.value.trim().slice(0, 16).toUpperCase() : "——";
    st.file.textContent = re.toUpperCase();
    if (sent) {
      const r = new Date(); r.setDate(r.getDate() + 2);
      st.rec.textContent = fmt(new Date());
      st.reply.textContent = fmt(r);
      st.status.textContent = "IN YOUR OUTBOX";
    } else {
      st.status.textContent = body.value.trim() ? "BEING WRITTEN" : "BLANK";
    }
  }
  stub();

  send.addEventListener("click", () => {
    if (!valid()) { toast("Almost", "Add your email and a few words"); return; }
    const lines = [
      `Dear ${S.first},`,
      "",
      `RE :: ${re}`,
      `FROM :: ${from.value.trim()}`,
      via.value.trim() ? `VIA :: ${via.value.trim()}` : "",
      "",
      body.value.trim(),
      "",
      "Sincerely,",
      `${name.value.trim() || "(unsigned)"}${signed ? " — signed on your site" : ""}`,
    ].filter((l, i, a) => !(l === "" && a[i - 1] === ""));
    mailto(`${re} — from ${name.value.trim() || from.value.trim()}`, lines.join("\n"));
    stub(true);
    if (!REDUCED) gsap.fromTo(".stub", { rotate: 1.2 }, { rotate: -4, y: 14, duration: 0.5, ease: "back.out(2)", yoyo: true, repeat: 1 });
    toast("Opening your mail app", "Nothing is sent from this site");
  });

  qs(".js-cal").addEventListener("click", openCal);
  qs(".js-copy").addEventListener("click", copyEmail);

  /* barcode (decorative, generated) */
  const bars = qs(".stub__bar svg");
  let x = 0, out = "";
  const seed = "VYOMGOR-BENCH-01";
  for (let i = 0; i < 46; i++) { const w = 1 + ((seed.charCodeAt(i % seed.length) * (i + 3)) % 3); if (i % 2 === 0) out += `<rect x="${x}" y="0" width="${w}" height="34" fill="#1e1e1e"/>`; x += w + 1; }
  bars.setAttribute("viewBox", `0 0 ${x} 34`);
  bars.innerHTML = out;

  if (!REDUCED) {
    gsap.from(".letter", { y: 60, opacity: 0, duration: 1.1, ease: "power3.out", delay: 0.15 });
    gsap.from(".stub", { y: -80, rotate: 8, opacity: 0, duration: 1.2, ease: "back.out(1.6)", delay: 0.5 });
  }
});
