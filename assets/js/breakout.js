/* ============================================================
   VYOM GOR: breakout.js, the playable 404
   LED-matrix Breakout: the bricks spell 404. Break them all and
   the bus recovers and takes you home. Mouse, touch or arrow keys;
   tap or Space to launch.
   ============================================================ */
document.addEventListener("vg:ready", () => {
  "use strict";
  const V = window.V, cv = document.querySelector(".bo__cv"), msg = document.querySelector(".bo__msg");
  if (!cv) return;
  const g = cv.getContext("2d");
  const FONT = { 4: ["00010", "00110", "01010", "10010", "11111", "00010", "00010"], 0: ["01110", "10001", "10011", "10101", "11001", "10001", "01110"] };
  const COLS = 23, ROWS = 17, TOP = 2; // LED grid; the 404 occupies rows 2..8
  let W = 0, H = 0, cell = 10, bricks, ball, pad, lives, state = "ready", raf = 0, last = 0, keys = { l: false, r: false };

  const reset = (full) => {
    if (full) {
      bricks = new Set(); lives = 3;
      "404".split("").forEach((d, k) => FONT[d].forEach((row, r) => [...row].forEach((on, c) => { if (on === "1") bricks.add(`${3 + k * 6 + c},${TOP + r}`); })));
    }
    pad = { x: COLS / 2, w: 4.2 };
    ball = { x: COLS / 2, y: ROWS - 2.6, vx: 0, vy: 0, stuck: true };
    state = "ready";
  };
  const size = () => {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0);
    cell = Math.min(W / COLS, H / ROWS);
  };
  const say = (t) => { msg.textContent = t; };
  const launch = () => {
    if (state === "won") return;
    if (state === "over") { reset(true); say("Break the 404 to get home."); }
    if (!ball.stuck) return;
    ball.stuck = false; state = "play";
    const a = (-Math.PI / 2) + (Math.random() - 0.5) * 0.6; ball.vx = Math.cos(a) * 11; ball.vy = Math.sin(a) * 11;
    V.sfx && V.sfx("click");
  };
  const step = (dt) => {
    if (keys.l) pad.x -= 22 * dt; if (keys.r) pad.x += 22 * dt;
    pad.x = Math.max(pad.w / 2, Math.min(COLS - pad.w / 2, pad.x));
    if (ball.stuck) { ball.x = pad.x; ball.y = ROWS - 2.6; return; }
    const sub = 4;
    for (let s = 0; s < sub; s++) {
      const h = dt / sub;
      ball.x += ball.vx * h; ball.y += ball.vy * h;
      if (ball.x < 0.5) { ball.x = 0.5; ball.vx *= -1; }
      if (ball.x > COLS - 0.5) { ball.x = COLS - 0.5; ball.vx *= -1; }
      if (ball.y < 0.5) { ball.y = 0.5; ball.vy *= -1; }
      // paddle
      if (ball.vy > 0 && ball.y > ROWS - 2.1 && ball.y < ROWS - 1.2 && Math.abs(ball.x - pad.x) < pad.w / 2 + 0.4) {
        const off = (ball.x - pad.x) / (pad.w / 2), speed = Math.min(20, Math.hypot(ball.vx, ball.vy) * 1.03), a = -Math.PI / 2 + off * 1.05;
        ball.vx = Math.cos(a) * speed; ball.vy = Math.sin(a) * speed; ball.y = ROWS - 2.1;
        V.sfx && V.sfx("tick");
      }
      // bricks
      const cx = Math.floor(ball.x), cy = Math.floor(ball.y), key = `${cx},${cy}`;
      if (bricks.has(key)) {
        bricks.delete(key); V.sfx && V.sfx("key");
        const fx = ball.x - (cx + 0.5), fy = ball.y - (cy + 0.5);
        if (Math.abs(fx) > Math.abs(fy)) ball.vx *= -1; else ball.vy *= -1;
        if (!bricks.size) { state = "won"; say("Bus recovered. Taking you home…"); V.sfx && V.sfx("relay"); setTimeout(() => V.navigate("/"), 1600); return; }
      }
      if (ball.y > ROWS + 0.5) {
        lives--;
        if (lives <= 0) { state = "over"; say("Bus off. Tap or press Space to try again."); ball.stuck = true; return; }
        reset(false); say(`${lives} ${lives === 1 ? "life" : "lives"} left. Tap to launch.`); return;
      }
    }
  };
  const paint = () => {
    const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
    const panel = css("--panel") || "#1c1b19";
    g.fillStyle = panel; g.fillRect(0, 0, W, H);
    const ox = (W - COLS * cell) / 2, oy = (H - ROWS * cell) / 2, r = cell * 0.34;
    const led = (x, y, color, glow) => {
      const px = ox + (x + 0.5) * cell, py = oy + (y + 0.5) * cell;
      if (glow) { g.shadowColor = color; g.shadowBlur = cell * 0.9; }
      g.fillStyle = color; g.beginPath(); g.arc(px, py, r, 0, 7); g.fill(); g.shadowBlur = 0;
    };
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) led(x, y, "rgba(235,231,221,0.07)");
    bricks.forEach((k) => { const [x, y] = k.split(",").map(Number); led(x, y, "#d9bc72", true); });
    for (let i = 0; i < pad.w; i++) led(Math.round(pad.x - pad.w / 2 + i), ROWS - 1, "#ebe7dd", true);
    const bx = ox + ball.x * cell, by = oy + ball.y * cell;
    g.shadowColor = "#fff2c4"; g.shadowBlur = cell; g.fillStyle = "#fff6dc"; g.beginPath(); g.arc(bx, by, r * 1.05, 0, 7); g.fill(); g.shadowBlur = 0;
    g.fillStyle = "rgba(235,231,221,0.55)"; g.font = `500 ${Math.max(10, cell * 0.55)}px 'Geist Mono', monospace`;
    g.fillText("● ".repeat(Math.max(0, lives)).trim(), ox + 4, oy + ROWS * cell - 4);
  };
  const frame = (now) => {
    const dt = Math.min(0.033, (now - last) / 1000 || 0.016); last = now;
    step(dt); paint();
    raf = requestAnimationFrame(frame);
  };
  size(); reset(true); paint();
  new ResizeObserver(() => { size(); paint(); }).observe(cv);
  const localX = (e) => { const r = cv.getBoundingClientRect(); return ((e.clientX - r.left) - (W - COLS * cell) / 2) / cell; };
  cv.addEventListener("pointermove", (e) => { pad.x = localX(e); });
  cv.addEventListener("pointerdown", (e) => { pad.x = localX(e); launch(); });
  addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { keys.l = true; e.preventDefault(); }
    else if (e.key === "ArrowRight") { keys.r = true; e.preventDefault(); }
    else if (e.key === " " && document.activeElement === cv) { launch(); e.preventDefault(); }
  });
  addEventListener("keyup", (e) => { if (e.key === "ArrowLeft") keys.l = false; if (e.key === "ArrowRight") keys.r = false; });
  cv.addEventListener("keydown", (e) => { if (e.key === "Enter") launch(); });
  if (V.REDUCED) { say("Break the 404 to get home. Tap or press Space to launch."); }
  const io = new IntersectionObserver((es) => { cancelAnimationFrame(raf); if (es[0].isIntersecting) { last = performance.now(); raf = requestAnimationFrame(frame); } });
  io.observe(cv);
});
