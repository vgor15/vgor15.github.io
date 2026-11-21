/* ============================================================
   GLYPH STUDIO — draw 5×8 HD44780 CGRAM glyphs, export C.
   Slots start with the 8 glyphs from lcd_cgram() in the
   CAN dashboard's LCD_4bit_driver.c.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  const { qs, qsa, useLenis, toast } = window.V;
  const { CGRAM, drawLCD } = window.CAN;
  useLenis();

  const names = ["arrow ←", "arrow →", "headlight", "batt 0", "batt 30", "batt 60", "batt full", "°C"];
  const glyphs = CGRAM.map((g) => g.slice());
  let sel = 0, paint = null;

  const ed = qs("#editor"), slotsEl = qs("#slots"), lcd = qs("#preview"), out = qs("#out"), nameEl = qs("#gname");
  ed.innerHTML = Array.from({ length: 40 }, (_, i) => `<button type="button" aria-label="Row ${((i / 5) | 0) + 1}, column ${(i % 5) + 1}" data-i="${i}"></button>`).join("");
  slotsEl.innerHTML = glyphs.map((_, i) => `<button type="button" data-s="${i}" aria-label="CGRAM slot ${i}"><canvas width="5" height="8"></canvas></button>`).join("");
  const cellsBtns = qsa("#editor button");

  const bit = (g, i) => (g[(i / 5) | 0] >> (4 - (i % 5))) & 1;
  const setBit = (g, i, v) => { const r = (i / 5) | 0, m = 1 << (4 - (i % 5)); g[r] = v ? g[r] | m : g[r] & ~m; };

  const drawSlot = (i) => {
    const c = slotsEl.children[i].querySelector("canvas").getContext("2d");
    c.fillStyle = "#1f2a12"; c.fillRect(0, 0, 5, 8);
    for (let p = 0; p < 40; p++) { c.fillStyle = bit(glyphs[i], p) ? "#b8f06a" : "#2a3a18"; c.fillRect(p % 5, (p / 5) | 0, 1, 1); }
  };
  const hx = (n) => "0x" + n.toString(16).toUpperCase().padStart(2, "0");
  const render = () => {
    cellsBtns.forEach((b, i) => b.classList.toggle("on", !!bit(glyphs[sel], i)));
    qsa("#slots button").forEach((b, i) => b.classList.toggle("is-sel", i === sel));
    glyphs.forEach((_, i) => drawSlot(i));
    nameEl.textContent = `Slot ${sel} · ${names[sel] || "custom"}`;
    const text = "CGRAM  0-7     ";
    const cells = [...text.padEnd(16).slice(0, 16)].concat([{ g: 0 }, " ", { g: 1 }, " ", { g: 2 }, " ", { g: 3 }, " ", { g: 4 }, " ", { g: 5 }, " ", { g: 6 }, " ", { g: 7 }, " "]);
    drawLCD(lcd, cells, { cgram: glyphs, px: 4, bg: "#b8f06a", on: "#163008", off: "#a6dc5c" });
    out.innerHTML = `<button class="copy" type="button">Copy</button><span class="c">/* CGRAM glyphs: paste into lcd_cgram() */</span>
<span class="k">unsigned char</span> s[<span class="n">8</span>][<span class="n">8</span>] = {
${glyphs.map((g, i) => `    { ${g.map(hx).join(", ")} },   <span class="c">/* ${i}: ${names[i] || "custom"} */</span>`).join("\n")}
};

lcd_cmd(<span class="n">0x40</span>);                 <span class="c">/* set CGRAM address 0 */</span>
<span class="k">for</span> (i = <span class="n">0</span>; i &lt; <span class="n">8</span>; i++)
    <span class="k">for</span> (j = <span class="n">0</span>; j &lt; <span class="n">8</span>; j++)
        lcd_data(s[i][j]);
<span class="c">/* show slot ${sel}: */</span> lcd_cmd(<span class="n">0x80</span>); lcd_data(<span class="n">${sel}</span>);`;
    qs(".copy", out).addEventListener("click", () => {
      navigator.clipboard && navigator.clipboard.writeText(out.innerText.replace(/^Copy\s*/, "")).then(() => toast("Copied", "CGRAM array"));
    });
  };

  ed.addEventListener("pointerdown", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const i = +b.dataset.i;
    paint = bit(glyphs[sel], i) ? 0 : 1;
    setBit(glyphs[sel], i, paint); render();
    ed.setPointerCapture(e.pointerId);
  });
  ed.addEventListener("pointermove", (e) => {
    if (paint === null) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const b = el && el.closest("#editor button");
    if (b && bit(glyphs[sel], +b.dataset.i) !== paint) { setBit(glyphs[sel], +b.dataset.i, paint); render(); }
  });
  addEventListener("pointerup", () => (paint = null));
  slotsEl.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { sel = +b.dataset.s; render(); } });

  const ops = {
    clear: (g) => g.fill(0),
    invert: (g) => g.forEach((r, i) => (g[i] = ~r & 0x1f)),
    up: (g) => g.push(g.shift()),
    down: (g) => g.unshift(g.pop()),
    left: (g) => g.forEach((r, i) => (g[i] = ((r << 1) | (r >> 4)) & 0x1f)),
    right: (g) => g.forEach((r, i) => (g[i] = ((r >> 1) | ((r & 1) << 4)) & 0x1f)),
    reset: (g) => CGRAM[sel] && CGRAM[sel].forEach((r, i) => (g[i] = r)),
  };
  qsa("[data-op]").forEach((b) => b.addEventListener("click", () => { ops[b.dataset.op](glyphs[sel]); render(); }));
  render();
});
