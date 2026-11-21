/* ============================================================
   REGISTER FLIPPER — LPC2129 GPIO port model.
   Build a mask, apply it as IODIR / IOSET / IOCLR, read IOPIN.
   Presets come from the CAN dashboard firmware.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, toast } = window.V;
  useLenis();
  const port = { 0: { dir: 0, pin: 0 }, 1: { dir: 0, pin: 0 } };
  let P = 0, mask = 0;

  const bitsEl = qs("#bits"), pinsEl = qs("#pins"), code = qs("#code");
  bitsEl.innerHTML = Array.from({ length: 32 }, (_, k) => { const b = 31 - k; return `<button type="button" data-b="${b}" aria-pressed="false"><span>${b}</span><b>0</b></button>`; }).join("");
  pinsEl.innerHTML = Array.from({ length: 32 }, (_, k) => `<i title="P${P}.${31 - k}"></i>`).join("");

  const presets = {
    leds: { p: 0, m: (1 << 17) | (1 << 18) | (1 << 19), label: "Node B LEDs · P0.17–19" },
    sw: { p: 0, m: (1 << 14) | (1 << 15) | (1 << 16), label: "Node A switches · P0.14–16" },
    lcd: { p: 1, m: 0xfe << 16, label: "LCD bus · P1.17–23 (0xFE<<16)" },
  };
  const hx = (n) => "0x" + (n >>> 0).toString(16).toUpperCase().padStart(8, "0");
  const list = (m) => Array.from({ length: 32 }, (_, b) => b).filter((b) => (m >>> b) & 1);
  const shifts = (m) => { const l = list(m); return l.length ? l.map((b) => `(1<<${b})`).join(" | ") : "0"; };

  const render = () => {
    qsa("#bits button").forEach((btn) => {
      const b = +btn.dataset.b, on = (mask >>> b) & 1;
      btn.classList.toggle("on", !!on);
      btn.setAttribute("aria-pressed", String(!!on));
      btn.querySelector("b").textContent = on;
      btn.querySelector("span").textContent = `P${P}.${b}`;
    });
    qs("#hex").textContent = hx(mask);
    qs("#dec").textContent = (mask >>> 0).toString(10);
    qs("#bin").textContent = (mask >>> 0).toString(2).padStart(32, "0").replace(/(.{8})/g, "$1 ").trim();
    const st = port[P];
    qsa("#pins i").forEach((el, k) => {
      const b = 31 - k;
      const out = (st.dir >>> b) & 1, hi = (st.pin >>> b) & 1;
      el.classList.toggle("on", !!(out && hi));
      el.style.opacity = out ? 1 : 0.35;
      el.title = `P${P}.${b} · ${out ? "output" : "input"} · ${hi ? "HIGH" : "LOW"}`;
    });
    qs("#pinstate").textContent = `IODIR${P} = ${hx(st.dir)}   IOPIN${P} = ${hx(st.pin)}`;
    const pins = list(mask).map((b) => `P${P}.${b}`).join(" ");
    code.innerHTML = `<button class="copy" type="button">Copy</button><span class="c">/* ${pins || "no bits selected"} */</span>
IODIR${P} |= ${hx(mask)};   <span class="c">/* make them outputs */</span>
IOSET${P}  = ${hx(mask)};   <span class="c">/* drive HIGH */</span>
IOCLR${P}  = ${hx(mask)};   <span class="c">/* drive LOW  */</span>

<span class="c">/* or, readable: */</span>
IOSET${P} = ${shifts(mask)};`;
    qs(".copy", code).addEventListener("click", () => navigator.clipboard && navigator.clipboard.writeText(code.innerText.replace(/^Copy\s*/, "")).then(() => toast("Copied", hx(mask))));
  };

  bitsEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { mask ^= 1 << +b.dataset.b; mask >>>= 0; render(); } });
  qsa("[data-port]").forEach((b) => b.addEventListener("click", () => { P = +b.dataset.port; qsa("[data-port]").forEach((x) => x.classList.toggle("is-on", x === b)); render(); }));
  qsa("[data-preset]").forEach((b) => b.addEventListener("click", () => {
    const pr = presets[b.dataset.preset]; P = pr.p; mask = pr.m >>> 0;
    qsa("[data-port]").forEach((x) => x.classList.toggle("is-on", +x.dataset.port === P));
    toast("Preset", pr.label); render();
  }));
  const act = {
    dir: () => { port[P].dir = (port[P].dir | mask) >>> 0; toast(`IODIR${P} |= ${hx(mask)}`, "pins are outputs now"); },
    set: () => { port[P].pin = (port[P].pin | (mask & port[P].dir)) >>> 0; toast(`IOSET${P} = ${hx(mask)}`, "only output pins change"); },
    clr: () => { port[P].pin = (port[P].pin & ~mask) >>> 0; toast(`IOCLR${P} = ${hx(mask)}`, "writing 1 clears; 0 does nothing"); },
    none: () => { mask = 0; },
  };
  qsa("[data-act]").forEach((b) => b.addEventListener("click", () => { act[b.dataset.act](); render(); }));
  render();
});
