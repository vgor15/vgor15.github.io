/* ============================================================
   LOGIC ANALYZER — encode bytes as UART / I2C / SPI waveforms
   and decode them back, drawn on a canvas.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, REDUCED } = window.V;
  useLenis();
  const cv = qs("#scope"), ctx = cv.getContext("2d");
  const input = qs("#bytes"), addr = qs("#addr"), info = qs("#lainfo");
  let proto = "uart", scan = 0;

  const parse = (s) => {
    s = s.trim();
    if (/^(0x[0-9a-f]{1,2}\s*)+$/i.test(s)) return s.split(/\s+/).map((h) => parseInt(h, 16) & 0xff).slice(0, 8);
    return [...s].slice(0, 8).map((c) => c.charCodeAt(0) & 0xff);
  };
  const hx = (n) => "0x" + n.toString(16).toUpperCase().padStart(2, "0");
  const chr = (b) => (b >= 32 && b < 127 ? `'${String.fromCharCode(b)}'` : "");

  /* Each builder returns { traces: [{name, levels:[0/1 per half-bit slot]}], notes:[{from,to,label,trace}] , unit } */
  function uart(bytes) {
    const tx = [1, 1, 1, 1], notes = [];
    bytes.forEach((b) => {
      const s = tx.length;
      tx.push(0);
      for (let i = 0; i < 8; i++) tx.push((b >> i) & 1);
      tx.push(1);
      notes.push({ from: s, to: s + 10, label: `${hx(b)} ${chr(b)}`, trace: 0 });
      notes.push({ from: s, to: s + 1, label: "S", trace: 0, small: true });
      tx.push(1);
    });
    tx.push(1, 1, 1);
    return { traces: [{ name: "TX", levels: tx }], notes, unit: "bit", sub: `8N1 · LSB first · ${bytes.length} byte${bytes.length > 1 ? "s" : ""}` };
  }
  function i2c(bytes, a) {
    const scl = [], sda = [], notes = [];
    const push = (c, d, n = 1) => { for (let i = 0; i < n; i++) { scl.push(c); sda.push(d); } };
    push(1, 1, 3);
    push(1, 0, 1); notes.push({ from: scl.length - 1, to: scl.length, label: "START", trace: 1, small: true });
    push(0, 0, 1);
    const sendByte = (b, label) => {
      const s = scl.length;
      for (let i = 7; i >= 0; i--) { const bit = (b >> i) & 1; push(0, bit, 1); push(1, bit, 1); push(0, bit, 1); }
      push(0, 0, 1); push(1, 0, 1); push(0, 0, 1);
      notes.push({ from: s, to: s + 24, label, trace: 1 });
      notes.push({ from: s + 24, to: s + 27, label: "ACK", trace: 1, small: true });
    };
    sendByte((a << 1) | 0, `${hx(a)} W`);
    bytes.forEach((b) => sendByte(b, `${hx(b)} ${chr(b)}`));
    push(0, 0, 1); push(1, 0, 1); push(1, 1, 1);
    notes.push({ from: scl.length - 2, to: scl.length, label: "STOP", trace: 1, small: true });
    push(1, 1, 2);
    return { traces: [{ name: "SCL", levels: scl }, { name: "SDA", levels: sda }], notes, unit: "slot", sub: `7-bit address ${hx(a)} · write · MSB first` };
  }
  function spi(bytes) {
    const cs = [], sck = [], mosi = [], miso = [], notes = [];
    const push = (c, k, o, i, n = 1) => { for (let j = 0; j < n; j++) { cs.push(c); sck.push(k); mosi.push(o); miso.push(i); } };
    push(1, 0, 0, 1, 3); push(0, 0, 0, 1, 1);
    bytes.forEach((b, n) => {
      const s = cs.length;
      const r = (b ^ 0xff) & 0xff;
      for (let i = 7; i >= 0; i--) { const o = (b >> i) & 1, q = (r >> i) & 1; push(0, 0, o, q); push(0, 1, o, q); }
      notes.push({ from: s, to: s + 16, label: `${hx(b)} ${chr(b)}`, trace: 2 });
      notes.push({ from: s, to: s + 16, label: hx(r), trace: 3 });
    });
    push(0, 0, 0, 1, 1); push(1, 0, 0, 1, 3);
    return { traces: [{ name: "CS", levels: cs }, { name: "SCK", levels: sck }, { name: "MOSI", levels: mosi }, { name: "MISO", levels: miso }], notes, unit: "slot", sub: "mode 0 · MSB first · MISO echoes ~byte" };
  }

  let model;
  const build = () => {
    const bytes = parse(input.value || "V");
    const a = parseInt(addr.value, 16) & 0x7f || 0x50;
    model = proto === "uart" ? uart(bytes) : proto === "i2c" ? i2c(bytes, a) : spi(bytes);
    info.textContent = model.sub;
    qs("#addrWrap").hidden = proto !== "i2c";
  };

  const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
  function draw() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const W = cv.clientWidth, H = cv.clientHeight;
    if (cv.width !== W * dpr) { cv.width = W * dpr; cv.height = H * dpr; }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    const tr = model.traces, n = tr[0].levels.length;
    const left = 60, right = 16, top = 24;
    const laneH = (H - top - 20) / tr.length;
    const dx = (W - left - right) / n;
    const colors = ["#d9bc72", "#7fd1d8", "#e6e1d6", "#92d38a"];
    ctx.font = "11px Geist Mono, monospace";
    // grid
    ctx.strokeStyle = "#ffffff0d"; ctx.lineWidth = 1;
    for (let i = 0; i <= n; i += model.unit === "bit" ? 1 : 2) { const x = left + i * dx; ctx.beginPath(); ctx.moveTo(x, top - 8); ctx.lineTo(x, H - 12); ctx.stroke(); }
    tr.forEach((t, k) => {
      const y0 = top + k * laneH, hi = y0 + laneH * 0.18, lo = y0 + laneH * 0.62;
      ctx.fillStyle = "#ebe7dd99"; ctx.fillText(t.name, 12, (hi + lo) / 2 + 4);
      ctx.strokeStyle = colors[k % colors.length]; ctx.lineWidth = 1.8; ctx.beginPath();
      t.levels.forEach((v, i) => {
        const x = left + i * dx, y = v ? hi : lo;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        ctx.lineTo(x + dx, y);
      });
      ctx.stroke();
    });
    // decoded notes
    model.notes.forEach((nt) => {
      const y0 = top + nt.trace * laneH;
      const x1 = left + nt.from * dx + 1, x2 = left + nt.to * dx - 1;
      const y = y0 + laneH * 0.7;
      if (nt.small) { ctx.fillStyle = "#ebe7dd80"; ctx.fillText(nt.label, x1, y0 + laneH * 0.12); return; }
      ctx.fillStyle = "#d9bc7226"; ctx.fillRect(x1, y, x2 - x1, 16);
      ctx.fillStyle = "#d9bc72"; ctx.fillText(nt.label, x1 + 4, y + 12);
    });
    // scan cursor
    const sx = left + (scan % 1) * (W - left - right);
    ctx.strokeStyle = "#ffffff55"; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(sx, top - 10); ctx.lineTo(sx, H - 8); ctx.stroke(); ctx.setLineDash([]);
  }

  qsa("[data-proto]").forEach((b) => b.addEventListener("click", () => {
    proto = b.dataset.proto;
    qsa("[data-proto]").forEach((x) => x.classList.toggle("is-on", x === b));
    build(); draw();
  }));
  input.addEventListener("input", () => { build(); draw(); });
  addr.addEventListener("input", () => { build(); draw(); });
  addEventListener("resize", draw);
  document.addEventListener("vg:theme", draw);
  build();
  draw();
  if (!REDUCED) gsap.ticker.add((t, dt) => { scan += dt / 4000; draw(); });
});
