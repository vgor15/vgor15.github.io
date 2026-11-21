/* ============================================================
   VYOM GOR — art.js
   Generated SVG plates (wheel art) and line icons (wheel tiles,
   lab previews). Everything is drawn in code: no stock images.
   ============================================================ */
(() => {
  const gold = "currentColor";

  const icons = {
    can: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="18" y="14" width="28" height="28" rx="3"/><rect x="25" y="21" width="14" height="14" rx="1.5"/>
      <path d="M22 14v-5M28 14v-5M34 14v-5M40 14v-5M22 47v-5M28 47v-5M34 47v-5M40 47v-5M18 20h-5M18 26h-5M18 32h-5M18 38h-5M46 20h5M46 26h5M46 32h5M46 38h5"/>
      <path d="M8 55h8l3-4 3 8 3-8 3 8 3-8 3 8 3-4h12"/></svg>`,
    cell: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round">
      <path d="M32 8c10 0 22 7 23 20 1 12-7 26-22 28C18 58 8 47 9 33 10 18 20 8 32 8Z"/>
      <circle cx="30" cy="31" r="8"/><circle cx="30" cy="31" r="2.5" fill="${gold}"/>
      <circle cx="45" cy="20" r="2"/><circle cx="19" cy="44" r="2.4"/><circle cx="46" cy="42" r="1.6"/></svg>`,
    test: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="12" y="10" width="40" height="46" rx="4"/><path d="M24 10V6h16v4"/>
      <path d="M20 24l3 3 6-6M20 36l3 3 6-6M20 48l3 3 6-6M34 25h11M34 37h11M34 49h8"/></svg>`,
    lcd: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="16" width="52" height="32" rx="3"/><rect x="11" y="21" width="42" height="22" rx="1"/>
      <path d="M15 27l-2 2.5 2 2.5M18 29.5h3M49 27l2 2.5-2 2.5M43 29.5h3M15 38h4M22 38h4M29 38h2M35 38h4M42 38h4"/></svg>`,
    tree: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round">
      <circle cx="32" cy="12" r="5"/><circle cx="18" cy="31" r="5"/><circle cx="46" cy="31" r="5"/><circle cx="10" cy="51" r="4.5"/><circle cx="26" cy="51" r="4.5"/><circle cx="54" cy="51" r="4.5"/>
      <path d="M29 16l-8 11M35 16l8 11M16 35.5l-4 11M20.5 35.5l3.5 11M48.5 35.5l4 11"/></svg>`,
    grid: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"><path d="M24 10v44M40 10v44M10 24h44M10 40h44"/><path d="M13 13l8 8M21 13l-8 8"/><circle cx="32" cy="32" r="4.5"/></svg>`,
    chip: `<svg viewBox="0 0 64 64" fill="none" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"><rect x="16" y="16" width="32" height="32" rx="3"/><path d="M24 16v-6M32 16v-6M40 16v-6M24 54v-6M32 54v-6M40 54v-6M16 24h-6M16 32h-6M16 40h-6M54 24h-6M54 32h-6M54 40h-6"/><circle cx="23" cy="23" r="1.6" fill="${gold}"/></svg>`,
    vg: `<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="3"><circle cx="38" cy="60" r="26"/><rect x="64" y="34" width="44" height="52" rx="9"/><path d="M27 48l11 25 11-25" stroke-linecap="round" stroke-linejoin="round"/><path d="M96 52c-2-4-6-6-10-6-7 0-11 6-11 14s4 14 11 14c6 0 10-4 10-10h-9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  };

  /* HD44780 dot-matrix as SVG. cells: 32 entries (char or {g}) */
  let uidN = 0;
  const uid = () => "u" + (++uidN);
  function lcdSVG(cells, x, y, px, on = "#163008", off = "#a6dc5c") {
    const pid = "lcdOff" + uid();
    const C = window.CAN;
    if (!C) return "";
    const gap = px * 0.28, pitch = px + gap, cw = 6 * pitch, ch = 9 * pitch;
    let dots = "", bg = "";
    for (let r = 0; r < 2; r++) for (let c = 0; c < 16; c++) {
      const cell = cells[r * 16 + c];
      const rows = cell && typeof cell === "object" ? C.CGRAM[cell.g] : [...(C.FONT[cell] || C.FONT[" "]), 0];
      const ox = x + c * cw, oy = y + r * ch;
      bg += `<rect x="${ox}" y="${oy}" width="${5 * pitch - gap}" height="${8 * pitch - gap}" fill="url(#${pid})"/>`;
      for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 5; xx++) if ((rows[yy] >> (4 - xx)) & 1) dots += `<rect x="${(ox + xx * pitch).toFixed(1)}" y="${(oy + yy * pitch).toFixed(1)}" width="${px}" height="${px}" rx="${px * 0.18}" fill="${on}"/>`;
    }
    return `<defs><pattern id="${pid}" x="${x}" y="${y}" width="${pitch}" height="${pitch}" patternUnits="userSpaceOnUse"><rect width="${px}" height="${px}" rx="${px * 0.18}" fill="${off}"/></pattern></defs>${bg}${dots}`;
  }
  const dashCells = () => {
    const row1 = Array(16).fill(" "); row1[0] = { g: 0 }; row1[7] = { g: 2 }; row1[8] = "D"; row1[15] = { g: 1 };
    return row1.concat([..."S:140k/h T:026ßc"]);
  };

  const plates = {
    canIllo() {
      const k = uid();
      const pins = (x, y, n, dx, dy, w, h) => Array.from({ length: n }, (_, i) => `<rect x="${x + i * dx}" y="${y + i * dy}" width="${w}" height="${h}" rx="2" fill="#d9bc72"/>`).join("");
      const lcd = lcdSVG(dashCells(), 1000, 399, 2.9);
      const twist = (phase, color) => {
        let d = "M 742 560";
        for (let i = 0; i <= 28; i++) { const x = 742 + i * 5.6, y = 560 + Math.sin(i * 0.9 + phase) * 16; d += ` L ${x.toFixed(1)} ${y.toFixed(1)}`; }
        return `<path d="${d}" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`;
      };
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Illustration: two LPC2129 nodes on a CAN bus, Node B showing speed and temperature on a 16x2 LCD">
        <defs>
          <pattern id="grid${k}" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="2" fill="#1e1e1e" opacity=".08"/></pattern>
          <filter id="sh${k}" x="-10%" y="-10%" width="120%" height="130%"><feDropShadow dx="0" dy="26" stdDeviation="26" flood-color="#1e1e1e" flood-opacity=".22"/></filter>
          <radialGradient id="glow${k}"><stop offset="0" stop-color="#ffd98a"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
        </defs>
        <rect width="1620" height="1000" fill="#f4f0e5"/><rect width="1620" height="1000" fill="url(#grid${k})"/>
        <text x="110" y="150" font-family="Geist Mono, monospace" font-size="30" fill="#a5802a" letter-spacing="2">CAN 2.0B · ID 0x500 · 2 ECUs</text>
        <text x="110" y="236" font-family="Geist, sans-serif" font-size="60" font-weight="600" fill="#1e1e1e" letter-spacing="-2">Node A → Node B</text>

        <g filter="url(#sh${k})">
          <rect x="170" y="300" width="572" height="470" rx="30" fill="#1e1e1e"/>
          <rect x="196" y="326" width="520" height="418" rx="16" fill="none" stroke="#ffffff" stroke-opacity=".08" stroke-width="2"/>
          <path d="M440 460 H600 V400 M440 520 H640 V600 H700 M380 600 V700 H560 M300 470 H250 V680" fill="none" stroke="#a5802a" stroke-width="4" stroke-opacity=".75" stroke-linecap="round"/>
          <rect x="300" y="420" width="150" height="150" rx="10" fill="#2b2a28" stroke="#d9bc72" stroke-width="3"/>
          ${pins(312, 404, 8, 17, 0, 9, 14)}${pins(312, 572, 8, 17, 0, 9, 14)}${pins(284, 432, 8, 0, 17, 14, 9)}${pins(452, 432, 8, 0, 17, 14, 9)}
          <text x="375" y="490" text-anchor="middle" font-family="Geist Mono, monospace" font-size="20" fill="#d9bc72">LPC</text><text x="375" y="516" text-anchor="middle" font-family="Geist Mono, monospace" font-size="20" fill="#d9bc72">2129</text>
          <circle cx="600" cy="420" r="40" fill="#2b2a28" stroke="#d9bc72" stroke-width="4"/><path d="M600 420 L622 396" stroke="#d9bc72" stroke-width="6" stroke-linecap="round"/>
          <text x="600" y="490" text-anchor="middle" font-family="Geist Mono, monospace" font-size="16" fill="#ebe7dd" opacity=".6">SPEED</text>
          ${[0, 1, 2].map((i) => `<rect x="${520 + i * 62}" y="640" width="44" height="44" rx="8" fill="#2b2a28" stroke="#ebe7dd" stroke-opacity=".35" stroke-width="2"/><circle cx="${542 + i * 62}" cy="662" r="11" fill="${i === 1 ? "#d9bc72" : "#ebe7dd"}" opacity="${i === 1 ? 1 : 0.5}"/>`).join("")}
          <rect x="230" y="640" width="70" height="44" rx="6" fill="#2b2a28" stroke="#d9bc72" stroke-width="2"/><text x="265" y="668" text-anchor="middle" font-family="Geist Mono, monospace" font-size="13" fill="#d9bc72">9700</text>
          <text x="214" y="730" font-family="Geist Mono, monospace" font-size="20" fill="#ebe7dd" opacity=".7">NODE A · TX</text>
        </g>

        ${twist(0, "#a5802a")}${twist(Math.PI, "#1e1e1e")}
        <rect x="790" y="488" width="96" height="38" rx="8" fill="#1e1e1e"/><text x="838" y="514" text-anchor="middle" font-family="Geist Mono, monospace" font-size="20" fill="#f4f0e5">0x500</text>
        <text x="760" y="622" font-family="Geist Mono, monospace" font-size="16" fill="#a5802a">CANH</text><text x="826" y="622" font-family="Geist Mono, monospace" font-size="16" fill="#1e1e1e" opacity=".6">CANL</text>

        <g filter="url(#sh${k})">
          <rect x="890" y="300" width="572" height="470" rx="30" fill="#1e1e1e"/>
          <rect x="950" y="336" width="452" height="190" rx="12" fill="#2d6b2a"/>
          <rect x="968" y="350" width="416" height="162" rx="6" fill="#0e1508"/>
          <rect x="984" y="360" width="384" height="142" rx="3" fill="#b8f06a"/>
          ${lcd}
          <path d="M960 600 H1140 V700 M1180 560 V680 H1400" fill="none" stroke="#a5802a" stroke-width="4" stroke-opacity=".75" stroke-linecap="round"/>
          <circle cx="1240" cy="620" r="44" fill="url(#glow${k})"/>
          ${[0, 1, 2].map((i) => `<circle cx="${1200 + i * 40}" cy="620" r="12" fill="${i === 1 ? "#ffd98a" : "#3d3b37"}"/>`).join("")}
          <text x="934" y="730" font-family="Geist Mono, monospace" font-size="20" fill="#ebe7dd" opacity=".7">NODE B · RX · IRQ 27</text>
        </g>
        <text x="1510" y="900" text-anchor="end" font-family="Geist Mono, monospace" font-size="24" fill="#1e1e1e" opacity=".45">LPC2129 · MCP9700 · HD44780 · Keil µVision</text>
      </svg>`;
    },
    lcdPlate() {
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="16x2 LCD showing speed 140 km/h and temperature 26 °C">
        <rect width="1620" height="1000" fill="#1c1b19"/>
        <rect x="90" y="230" width="1440" height="540" rx="30" fill="#2d6b2a"/>
        <rect x="140" y="275" width="1340" height="450" rx="16" fill="#0e1508"/>
        <rect x="180" y="310" width="1260" height="380" rx="8" fill="#b8f06a"/>
        ${lcdSVG(dashCells(), 211, 393, 9.84)}
        <text x="90" y="170" font-family="Geist Mono, monospace" font-size="32" fill="#d9bc72" letter-spacing="2">HD44780 · 16×2 · CGRAM</text>
        <text x="90" y="880" font-family="Geist Mono, monospace" font-size="28" fill="#ebe7dd" opacity=".5">replayed in your browser → /lab/can-bus</text>
      </svg>`;
    },
    terminal() {
      const L = [
        ["#7fd1d8", "🦠[/home/vyom]🦠 > ", "#e6e1d6", "./cell"],
        ["#8f8a80", "", "#8f8a80", "Imperfect Cell v1 · read → eval → execute → loop"],
        ["#7fd1d8", "🦠[/home/vyom]🦠 > ", "#e6e1d6", "echo -n fork exec wait"],
        ["#e6e1d6", "", "#e6e1d6", "fork exec wait"],
        ["#7fd1d8", "🦠[/home/vyom]🦠 > ", "#e6e1d6", "ls src"],
        ["#e6e1d6", "", "#92d38a", "builtin.c  cell.c  cell.h  utils.c"],
        ["#7fd1d8", "🦠[/home/vyom]", "#ff7a6b", "[69]🦠 > exit"],
        ["#e8c56b", "", "#e8c56b", "[===========💥]  ✅ EXIT ✅"],
      ];
      const rows = L.map((r, i) => `<text x="70" y="${190 + i * 88}" font-family="Geist Mono, monospace" font-size="44"><tspan fill="${r[0]}">${r[1]}</tspan><tspan fill="${r[2]}">${r[3]}</tspan></text>`).join("");
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="imperfect_cell terminal session">
        <rect width="1620" height="1000" fill="#121110"/><rect width="1620" height="96" fill="#1d1c1a"/>
        <circle cx="62" cy="48" r="13" fill="#3a3834"/><circle cx="104" cy="48" r="13" fill="#3a3834"/><circle cx="146" cy="48" r="13" fill="#3a3834"/>
        <text x="200" y="58" font-family="Geist Mono, monospace" font-size="30" fill="#8f8a80">cell — bash — 80×24</text>
        ${rows}<rect x="1110" y="796" width="26" height="48" fill="#d9bc72"/></svg>`;
    },
    test() {
      const rows = ["GPIO EXPANDER", "STATUS LEDS", "BUZZER", "STORAGE", "ETHERNET", "WIRELESS", "GNSS TIME", "USB"];
      const r = rows.map((t, i) => {
        const y = 250 + i * 86;
        return `<text x="110" y="${y}" font-family="Geist Mono, monospace" font-size="38" fill="#1e1e1e">${t}</text>
          <path d="M620 ${y - 12} H1230" stroke="#1e1e1e" stroke-opacity=".25" stroke-width="3" stroke-dasharray="4 12"/>
          <rect x="1270" y="${y - 44}" width="220" height="58" rx="8" fill="#a5802a"/><text x="1380" y="${y - 3}" text-anchor="middle" font-family="Geist Mono, monospace" font-size="34" font-weight="600" fill="#fff">PASS</text>`;
      }).join("");
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Generic hardware self-test checklist">
        <rect width="1620" height="1000" fill="#f6f3ea"/>
        <text x="110" y="140" font-family="Geist, sans-serif" font-size="64" font-weight="600" fill="#1e1e1e" letter-spacing="-2">Self-test</text>
        <text x="1490" y="140" text-anchor="end" font-family="Geist Mono, monospace" font-size="34" fill="#a5802a">8 / 8 PASS</text>
        ${r}</svg>`;
    },
    tree() {
      const N = [[810, 220], [520, 430], [1100, 430], [360, 660], [680, 660], [940, 660], [1260, 660], [280, 860], [440, 860], [1180, 860], [1340, 860]];
      const E = [[0, 1], [0, 2], [1, 3], [1, 4], [2, 5], [2, 6], [3, 7], [3, 8], [6, 9], [6, 10]];
      const vals = [42, 17, 73, 8, 29, 56, 91, 3, 12, 85, 99];
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Binary search tree">
        <rect width="1620" height="1000" fill="#f6f3ea"/>
        ${E.map(([a, b]) => `<path d="M${N[a][0]} ${N[a][1]} L${N[b][0]} ${N[b][1]}" stroke="#1e1e1e" stroke-opacity=".35" stroke-width="5"/>`).join("")}
        ${N.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i === 0 ? 64 : 52}" fill="${i === 0 ? "#a5802a" : "#fdfcfa"}" stroke="#1e1e1e" stroke-width="5"/><text x="${x}" y="${y + 15}" text-anchor="middle" font-family="Geist Mono, monospace" font-size="${i === 0 ? 46 : 38}" fill="${i === 0 ? "#fff" : "#1e1e1e"}">${vals[i]}</text>`).join("")}
        <text x="90" y="120" font-family="Geist Mono, monospace" font-size="34" fill="#a5802a">insert(42) · O(log n)</text></svg>`;
    },
    grid() {
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice"><rect width="1620" height="1000" fill="#121110"/>
        <path d="M680 200v600M940 200v600M420 400h780M420 600h780" stroke="#e6e1d6" stroke-width="8"/>
        <text x="550" y="340" font-size="140" fill="#ff7a6b" font-family="Geist Mono" text-anchor="middle">X</text>
        <text x="810" y="540" font-size="140" fill="#7fd1d8" font-family="Geist Mono" text-anchor="middle">O</text>
        <text x="1070" y="740" font-size="140" fill="#ff7a6b" font-family="Geist Mono" text-anchor="middle">X</text></svg>`;
    },
    lcd() {
      return `<svg viewBox="0 0 1620 1000" preserveAspectRatio="xMidYMid slice"><rect width="1620" height="1000" fill="#1f2a12"/>
        <text x="810" y="540" font-size="120" fill="#b8f06a" font-family="Geist Mono" text-anchor="middle">LPC2129</text></svg>`;
    },
  };

  /* Small dark previews for the Lab grid (300×200) */
  const previews = {
    "can-bus": `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#1c1b19"/><rect x="40" y="58" width="220" height="64" rx="6" fill="#1f2a12" stroke="#2d6b2a" stroke-width="4"/>
      <text x="56" y="84" font-family="Geist Mono" font-size="14" fill="#b8f06a">◄      ≡D      ►</text><text x="56" y="108" font-family="Geist Mono" font-size="14" fill="#b8f06a">S:142k/h T:026°c</text>
      <path d="M20 158h40l6-10 6 20 6-20 6 20 6-20 6 10h184" stroke="#d9bc72" stroke-width="2" fill="none"/><text x="20" y="190" font-family="Geist Mono" font-size="10" fill="#ebe7dd80">ID 0x500 · DLC 8</text></svg>`,
    "glyph-studio": `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#1c1b19"/>${[0, 0x04, 0x08, 0x1f, 0x1f, 0x08, 0x04, 0].map((row, y) => [0, 1, 2, 3, 4].map((x) => `<rect x="${105 + x * 18}" y="${30 + y * 18}" width="15" height="15" rx="2" fill="${(row >> (4 - x)) & 1 ? "#d9bc72" : "#ffffff14"}"/>`).join("")).join("")}</svg>`,
    "logic-analyzer": `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#1c1b19"/><path d="M14 60h30v-24h22v24h22v-24h44v24h22v-24h22v24h88" stroke="#d9bc72" stroke-width="2" fill="none"/><path d="M14 130h18v-24h18v24h18v-24h18v24h18v-24h18v24h18v-24h18v24h18v-24h18v24h18v-24h18v24h40" stroke="#7fd1d8" stroke-width="2" fill="none"/><text x="14" y="180" font-family="Geist Mono" font-size="10" fill="#ebe7dd80">UART 9600 8N1 · 0x56 'V'</text></svg>`,
    "register-flipper": `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#1c1b19"/>${Array.from({ length: 16 }, (_, i) => `<rect x="${18 + i * 17}" y="70" width="13" height="40" rx="2" fill="${[1, 2, 3, 9, 14].includes(i) ? "#d9bc72" : "#ffffff18"}"/>`).join("")}<text x="18" y="146" font-family="Geist Mono" font-size="12" fill="#ebe7dd">IOSET0 = 0x000E0000;</text></svg>`,
    "led-matrix": `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#1c1b19"/>${Array.from({ length: 13 * 8 }, (_, i) => { const x = i % 13, y = (i / 13) | 0; const d = Math.hypot(x - 6, y - 3.5); return `<circle cx="${30 + x * 20}" cy="${30 + y * 20}" r="${Math.max(2, 6 - d * 0.9)}" fill="${d < 2.5 ? "#d9bc72" : "#ffffff30"}"/>`; }).join("")}</svg>`,
    shell: `<svg viewBox="0 0 300 200"><rect width="300" height="200" fill="#121110"/><text x="16" y="44" font-family="Geist Mono" font-size="12" fill="#7fd1d8">🦠[~]🦠 &gt; <tspan fill="#e6e1d6">help</tspan></text><text x="16" y="70" font-family="Geist Mono" font-size="12" fill="#8f8a80">builtins: cd echo env exit</text><text x="16" y="96" font-family="Geist Mono" font-size="12" fill="#7fd1d8">🦠[~]🦠 &gt; <tspan fill="#e6e1d6">whoami</tspan></text><text x="16" y="122" font-family="Geist Mono" font-size="12" fill="#92d38a">vyom</text><rect x="104" y="136" width="8" height="14" fill="#d9bc72"/></svg>`,
  };

  window.ART = { icons, plates, previews };
})();
