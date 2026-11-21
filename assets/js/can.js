/* ============================================================
   can.js — CAN 2.0A frame builder + Vyom's dashboard model.
   Mirrors the firmware in Node A (Main_A.c) / Node B (MainB.c):
   ID 0x500, DLC 8, byteA = speed ADC (or switch code), byteB = temp ADC.
   ============================================================ */
(() => {
  const bitsOf = (v, n) => Array.from({ length: n }, (_, i) => (v >> (n - 1 - i)) & 1);

  // CAN CRC-15, polynomial 0x4599, over SOF..DATA (unstuffed)
  function crc15(bits) {
    let crc = 0;
    for (const b of bits) {
      const nxt = b ^ ((crc >> 14) & 1);
      crc = (crc << 1) & 0x7fff;
      if (nxt) crc ^= 0x4599;
    }
    return crc;
  }

  /* Build a standard data frame. Returns stuffed bit list with field tags. */
  function buildFrame(id, data) {
    const dlc = data.length;
    const fields = [
      ["SOF", [0]],
      ["ID", bitsOf(id, 11)],
      ["RTR", [0]],
      ["IDE", [0]],
      ["r0", [0]],
      ["DLC", bitsOf(dlc, 4)],
      ["DATA", data.flatMap((b) => bitsOf(b, 8))],
    ];
    const pre = fields.flatMap(([, b]) => b);
    const crc = crc15(pre);
    fields.push(["CRC", bitsOf(crc, 15)]);
    const out = [];
    let run = 0, last = -1;
    for (const [name, bs] of fields) {
      for (const b of bs) {
        out.push({ b, f: name, stuff: false });
        if (b === last) run++; else { run = 1; last = b; }
        if (run === 5) {
          const s = 1 - b;
          out.push({ b: s, f: name, stuff: true });
          last = s; run = 1;
        }
      }
    }
    [["CRC_DEL", [1]], ["ACK", [0]], ["ACK_DEL", [1]], ["EOF", [1, 1, 1, 1, 1, 1, 1]]].forEach(([n, bs]) => bs.forEach((b) => out.push({ b, f: n, stuff: false })));
    return { id, dlc, data, crc, bits: out, stuffed: out.filter((x) => x.stuff).length };
  }

  /* Dashboard model — same maths as the firmware */
  const toBytes = (u32) => [u32 & 0xff, (u32 >> 8) & 0xff, (u32 >> 16) & 0xff, (u32 >>> 24) & 0xff];
  const model = {
    speedKmh: (adc) => Math.floor((280 * adc) / 1023),                 // vout = (280*temp2)/1023
    tempC: (adc) => Math.trunc(((adc * 3.3) / 1023 - 0.5) / 0.01),      // MCP9700: 500 mV @ 0 °C, 10 mV/°C
    adcForTemp: (c) => Math.round(((c * 0.01 + 0.5) * 1023) / 3.3),
    payload: (byteA, byteB) => [...toBytes(byteA), ...toBytes(byteB)],
    CODES: { HEAD_ON: 0x05, HEAD_OFF: 0x06, LEFT_ON: 0x07, LEFT_OFF: 0x08, RIGHT_ON: 0x09, RIGHT_OFF: 0x10 },
  };

  /* HD44780 CGRAM glyphs from LCD_4bit_driver.c → lcd_cgram() */
  const CGRAM = [
    [0x00, 0x04, 0x08, 0x1f, 0x1f, 0x08, 0x04, 0x00], // 0: arrow ← (comment says "r")
    [0x00, 0x04, 0x02, 0x1f, 0x1f, 0x02, 0x04, 0x00], // 1: arrow →
    [0x00, 0x0f, 0x00, 0x0f, 0x00, 0x0f, 0x00, 0x00], // 2: headlight beams
    [0x0e, 0x1f, 0x11, 0x11, 0x11, 0x11, 0x1f, 0x00], // 3: battery 0
    [0x0e, 0x1f, 0x11, 0x11, 0x11, 0x1f, 0x1f, 0x00], // 4: battery 30
    [0x0e, 0x1f, 0x11, 0x11, 0x1f, 0x1f, 0x1f, 0x00], // 5: battery 60
    [0x0e, 0x1f, 0x1f, 0x1f, 0x1f, 0x1f, 0x1f, 0x00], // 6: battery full
    [0x18, 0x18, 0x07, 0x08, 0x08, 0x08, 0x07, 0x00], // 7: °C
  ];

  /* Minimal 5×7 font for the LCD renderer (ASCII 32–126, HD44780-ish) */
  const F = {};
  const def = (ch, rows) => (F[ch] = rows);
  [
    [" ", [0, 0, 0, 0, 0, 0, 0]], ["0", [14, 17, 19, 21, 25, 17, 14]], ["1", [4, 12, 4, 4, 4, 4, 14]], ["2", [14, 17, 1, 2, 4, 8, 31]],
    ["3", [31, 2, 4, 2, 1, 17, 14]], ["4", [2, 6, 10, 18, 31, 2, 2]], ["5", [31, 16, 30, 1, 1, 17, 14]], ["6", [6, 8, 16, 30, 17, 17, 14]],
    ["7", [31, 1, 2, 4, 8, 8, 8]], ["8", [14, 17, 17, 14, 17, 17, 14]], ["9", [14, 17, 17, 15, 1, 2, 12]], [":", [0, 12, 12, 0, 12, 12, 0]],
    ["/", [0, 1, 2, 4, 8, 16, 0]], [".", [0, 0, 0, 0, 0, 12, 12]], ["-", [0, 0, 0, 31, 0, 0, 0]], ["^", [4, 10, 17, 0, 0, 0, 0]],
    ["A", [14, 17, 17, 17, 31, 17, 17]], ["B", [30, 17, 17, 30, 17, 17, 30]], ["C", [14, 17, 16, 16, 16, 17, 14]], ["D", [28, 18, 17, 17, 17, 18, 28]],
    ["E", [31, 16, 16, 30, 16, 16, 31]], ["F", [31, 16, 16, 30, 16, 16, 16]], ["G", [14, 17, 16, 23, 17, 17, 15]], ["H", [17, 17, 17, 31, 17, 17, 17]],
    ["I", [14, 4, 4, 4, 4, 4, 14]], ["K", [17, 18, 20, 24, 20, 18, 17]], ["L", [16, 16, 16, 16, 16, 16, 31]], ["M", [17, 27, 21, 21, 17, 17, 17]],
    ["N", [17, 17, 25, 21, 19, 17, 17]], ["O", [14, 17, 17, 17, 17, 17, 14]], ["P", [30, 17, 17, 30, 16, 16, 16]], ["R", [30, 17, 17, 30, 20, 18, 17]],
    ["S", [15, 16, 16, 14, 1, 1, 30]], ["T", [31, 4, 4, 4, 4, 4, 4]], ["U", [17, 17, 17, 17, 17, 17, 14]], ["V", [17, 17, 17, 17, 17, 10, 4]],
    ["W", [17, 17, 17, 21, 21, 21, 10]], ["Y", [17, 17, 17, 10, 4, 4, 4]], ["Z", [31, 1, 2, 4, 8, 16, 31]],
    ["a", [0, 0, 14, 1, 15, 17, 15]], ["c", [0, 0, 14, 16, 16, 17, 14]], ["d", [1, 1, 13, 19, 17, 17, 15]], ["e", [0, 0, 14, 17, 31, 16, 14]],
    ["h", [16, 16, 22, 25, 17, 17, 17]], ["i", [4, 0, 12, 4, 4, 4, 14]], ["k", [16, 16, 18, 20, 24, 20, 18]], ["l", [12, 4, 4, 4, 4, 4, 14]],
    ["m", [0, 0, 26, 21, 21, 17, 17]], ["n", [0, 0, 22, 25, 17, 17, 17]], ["o", [0, 0, 14, 17, 17, 17, 14]], ["p", [0, 0, 30, 17, 30, 16, 16]],
    ["r", [0, 0, 22, 25, 16, 16, 16]], ["s", [0, 0, 14, 16, 14, 1, 30]], ["t", [8, 8, 28, 8, 8, 9, 6]], ["u", [0, 0, 17, 17, 17, 19, 13]],
    ["v", [0, 0, 17, 17, 17, 10, 4]], ["y", [0, 0, 17, 17, 15, 1, 14]], ["x", [0, 0, 17, 10, 4, 10, 17]],
  ].forEach(([c, r]) => def(c, r));
  F["ß"] = [6, 9, 9, 6, 0, 0, 0]; // 223 = degree sign on HD44780 ROM A00

  /* Render a 16×2 LCD into a canvas. cells: array[32] of char or {g: index} */
  function drawLCD(canvas, cells, opts = {}) {
    const cg = opts.cgram || CGRAM;
    const px = opts.px || 4, gap = 1, cw = 5 * (px + gap) + px, chh = 8 * (px + gap) + px;
    const W = 16 * cw + px * 2, H = 2 * chh + px * 3;
    if (canvas.width !== W) { canvas.width = W; canvas.height = H; }
    const c = canvas.getContext("2d");
    c.fillStyle = opts.bg || "#b8f06a";
    c.fillRect(0, 0, W, H);
    for (let r = 0; r < 2; r++) for (let col = 0; col < 16; col++) {
      const cell = cells[r * 16 + col];
      let rows;
      if (cell && typeof cell === "object") rows = cg[cell.g];
      else rows = [...(F[cell] || F[" "]), 0];
      const ox = px + col * cw, oy = px + r * (chh + px);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) {
        const on = (rows[y] >> (4 - x)) & 1;
        c.fillStyle = on ? opts.on || "#1e3a0c" : opts.off || "#a8df5d";
        c.fillRect(ox + x * (px + gap), oy + y * (px + gap), px, px);
      }
    }
  }

  window.CAN = { buildFrame, crc15, model, CGRAM, FONT: F, drawLCD };
})();
