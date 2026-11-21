/* ============================================================
   CAN BUS LAB — Node A (Main_A.c) → CAN2 → Node B (MainB.c)
   A faithful replay of the firmware's behaviour, quirks included.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, REDUCED, toast } = window.V;
  const { buildFrame, model, drawLCD } = window.CAN;
  useLenis();

  const ui = {
    speed: qs("#speed"), temp: qs("#temp"),
    speedOut: qs("#speedOut"), tempOut: qs("#tempOut"),
    sw: qsa(".sw[data-sw]"),
    lcd: qs("#lcd"), leds: qsa(".leds i"),
    frame: qs("#frame"), bits: qs("#bits"), note: qs("#note"),
    con: qs("#console"), bus: qs("#busSvg"), auto: qs("#auto"),
  };

  /* ---------- Node A state ---------- */
  const A = { speedAdc: +ui.speed.value, tempC: +ui.temp.value, flags: [0, 0, 0], byteB: 0 };
  const codes = [[model.CODES.HEAD_ON, model.CODES.HEAD_OFF], [model.CODES.LEFT_ON, model.CODES.LEFT_OFF], [model.CODES.RIGHT_ON, model.CODES.RIGHT_OFF]];
  const swNames = ["SW1 · P0.14 · headlight", "SW2 · P0.15 · left", "SW3 · P0.16 · right"];

  /* ---------- Node B state (mirrors MainB.c globals) ---------- */
  const B = { byteA: 0, byteB: 0, sflag1: 0, sflag2: 0, head: false, timer1: 0, timer2: 0 };
  const cells = Array(32).fill(" ");
  cells[0] = { g: 0 }; cells[15] = { g: 1 };          // lcd_cmd(0x80) data(0); lcd_cmd(0x8F) data(1)
  const led = [false, false, false];                  // LED1 head, LED2 left, LED3 right (active-low on the board)

  const log = (who, msg) => {
    const d = document.createElement("div");
    d.innerHTML = `<span class="${who === "A" ? "t-gold" : "t-c"}">[${who}]</span> ${msg}`;
    ui.con.appendChild(d);
    while (ui.con.children.length > 80) ui.con.firstChild.remove();
    ui.con.scrollTop = ui.con.scrollHeight;
  };

  /* ---------- transmit ---------- */
  const hex = (n, w = 2) => "0x" + n.toString(16).toUpperCase().padStart(w, "0");
  function transmit(byteA, kind) {
    const f = buildFrame(0x500, model.payload(byteA, A.byteB));
    renderFrame(f, kind);
    animatePacket(kind);
    setTimeout(() => receive(f), REDUCED ? 0 : 420);
  }
  function telemetry() {
    A.byteB = model.adcForTemp(A.tempC);
    log("A", `uart speed ${A.speedAdc}  uart temp ${A.tempC}`);
    transmit(A.speedAdc, "telemetry");
  }
  function pressSwitch(i) {
    A.flags[i] ^= 1;                                   // flagN ^= 1
    const code = codes[i][A.flags[i] ? 0 : 1];
    ui.sw[i].classList.toggle("is-on", !!A.flags[i]);
    ui.sw[i].setAttribute("aria-pressed", String(!!A.flags[i]));
    log("A", `${swNames[i]} → v1.byteA = ${hex(code)}`);
    transmit(code, "event");
  }

  /* ---------- receive (CAN2_Rx_Handler) + Node B loop ---------- */
  function receive(f) {
    B.byteA = f.data[0] | (f.data[1] << 8) | (f.data[2] << 16) | (f.data[3] << 24);
    B.byteB = f.data[4] | (f.data[5] << 8) | (f.data[6] << 16) | (f.data[7] << 24);
    const lo = B.byteA & 0xff;
    const isCode = [0x05, 0x06, 0x07, 0x08, 0x09, 0x10].includes(lo);
    const fromSpeed = isCode && B.byteA > 0x10;
    ui.note.hidden = !fromSpeed;
    if (fromSpeed) ui.note.innerHTML = `<b>Collision.</b> Speed reading ${B.byteA} has low byte ${hex(lo)}, the same as a switch code. Node B can't tell them apart, so it just acted on it. Fix: give switch events their own CAN ID.`;
    nodeB();
    const kmh = Math.floor((280 * (B.byteA & 0xffff)) / 1023);
    log("B", `k/h ${kmh}  temp ${model.tempC(B.byteB & 0xffff)}`);
  }
  function put(col, row, ch) { cells[row * 16 + col] = ch; }
  function putStr(col, row, s) { [...s].forEach((c, i) => put(col + i, row, c)); }
  function nodeB() {
    const temp1 = B.byteB & 0xffff, temp2 = B.byteA & 0xffff;
    const vout1 = (temp1 * 3.3) / 1023;
    let t1 = Math.trunc((vout1 - 0.5) / 0.01);
    if (t1 < 0) t1 = (t1 >>> 0) % 1000;              // u32 wrap, then only 3 digits are shown
    const vout = Math.floor((280 * temp2) / 1023);
    putStr(0, 1, "S:");
    put(2, 1, String(Math.floor(vout / 100) % 10)); put(3, 1, String(Math.floor(vout / 10) % 10)); put(4, 1, String(vout % 10));
    putStr(5, 1, "k/h");
    putStr(9, 1, "T:");
    put(11, 1, String(Math.floor(t1 / 100) % 10)); put(12, 1, String(Math.floor(t1 / 10) % 10)); put(13, 1, String(t1 % 10));
    put(14, 1, "ß"); put(15, 1, "c");

    const lo = B.byteA & 0xff;
    if (lo === 0x05) { put(7, 0, { g: 2 }); put(8, 0, "D"); led[0] = true; B.head = true; }
    if (lo === 0x06) { put(7, 0, " "); put(8, 0, " "); led[0] = false; B.head = false; }
    if (lo === 0x07) B.sflag1 = 1;
    if (lo === 0x09) B.sflag2 = 1;
    if (B.sflag1) { if (B.timer1) { put(0, 0, { g: 0 }); led[1] = true; } else { put(0, 0, " "); led[1] = false; } }
    if (lo === 0x08 || lo === 0x09) { B.sflag1 = 0; put(0, 0, { g: 0 }); led[1] = false; }
    if (B.sflag2) { if (B.timer2) { put(15, 0, { g: 1 }); led[2] = true; } else { put(15, 0, " "); led[2] = false; } }
    if (lo === 0x07 || lo === 0x10) { B.sflag2 = 0; put(15, 0, { g: 1 }); led[2] = false; }
  }

  /* ---------- render ---------- */
  const dark = () => document.documentElement.getAttribute("data-theme") === "dark";
  function renderLCD() {
    drawLCD(ui.lcd, cells, { px: 4, bg: "#b8f06a", on: "#163008", off: "#a6dc5c" });
    ui.leds.forEach((l, i) => l.classList.toggle("on", led[i]));
  }
  function renderFrame(f, kind) {
    const d = f.data.map((b) => hex(b)).join(" ");
    ui.frame.innerHTML = `
      <span><em>SOF</em>0</span>
      <span class="f-id"><em>ID · 11 bit</em>${hex(f.id, 3)}</span>
      <span><em>RTR</em>0</span><span><em>IDE</em>0</span><span><em>r0</em>0</span>
      <span><em>DLC</em>${f.dlc}</span>
      <span><em>DATA · byteA | byteB</em>${d}</span>
      <span><em>CRC-15</em>${hex(f.crc, 4)}</span>
      <span><em>ACK</em>0</span><span><em>EOF</em>1111111</span>
      <span><em>${kind}</em>${f.bits.length} bits · ${f.stuffed} stuffed</span>`;
    ui.bits.innerHTML = f.bits.map((x) => `<i class="${x.stuff ? "s" : x.b ? "r" : "d"}" title="${x.f}${x.stuff ? " (stuff)" : ""}"></i>`).join("");
  }
  function animatePacket(kind) {
    if (REDUCED) return;
    const pk = document.createElementNS("http://www.w3.org/2000/svg", "g");
    pk.innerHTML = `<rect x="-26" y="-11" width="52" height="22" rx="4" fill="${kind === "event" ? "var(--gold)" : "var(--ink)"}"/><text x="0" y="4" text-anchor="middle" font-family="Geist Mono" font-size="10" fill="var(--paper)">0x500</text>`;
    ui.bus.appendChild(pk);
    const w = ui.bus.viewBox.baseVal.width;
    gsap.fromTo(pk, { x: 60, y: 48 }, { x: w - 60, duration: 0.42, ease: "power1.in", onComplete: () => pk.remove() });
    gsap.fromTo("#busH, #busL", { strokeWidth: 3 }, { strokeWidth: 1.6, duration: 0.5 });
  }

  /* ---------- timers: Node A timer1 (telemetry), Node B timer1 (blink) ---------- */
  let teleT = setInterval(() => ui.auto.checked && telemetry(), 750);
  setInterval(() => { B.timer1 ^= 1; B.timer2 ^= 1; nodeB(); }, 500);
  gsap.ticker.add(renderLCD);

  /* ---------- inputs ---------- */
  const upd = () => {
    A.speedAdc = +ui.speed.value;
    A.tempC = +ui.temp.value;
    ui.speedOut.textContent = `${A.speedAdc} · ${model.speedKmh(A.speedAdc)} km/h`;
    ui.tempOut.textContent = `${model.adcForTemp(A.tempC)} · ${A.tempC} °C`;
  };
  ui.speed.addEventListener("input", upd);
  ui.temp.addEventListener("input", upd);
  ui.sw.forEach((s, i) => s.addEventListener("click", () => pressSwitch(i)));
  const autoSw = ui.auto.closest(".sw");
  autoSw.classList.toggle("is-on", ui.auto.checked);
  ui.auto.addEventListener("change", () => autoSw.classList.toggle("is-on", ui.auto.checked));
  qs("#sendNow").addEventListener("click", telemetry);
  qs("#collide").addEventListener("click", () => { ui.speed.value = 263; upd(); telemetry(); toast("Speed ADC set to 263", "263 = 0x107, low byte 0x07"); });
  upd();
  A.byteB = model.adcForTemp(A.tempC);
  nodeB();
  renderLCD();
  telemetry();

  /* copy code */
  qsa(".copy").forEach((b) => b.addEventListener("click", () => {
    const code = b.parentElement.innerText.replace(/^Copy\s*/, "");
    navigator.clipboard && navigator.clipboard.writeText(code).then(() => toast("Copied", "CAN2_Rx_Handler"));
  }));
});
