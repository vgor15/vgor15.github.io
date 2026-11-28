/* Arcade mini-games. Each one mounts into a box and returns { destroy }.
   Packet Catch: catch the good messages, dodge the broken ones.
   Bit Flip: flip eight switches so the lights add up to the number. */
import { sound } from "./audio.js";

export function packetCatch(box, { onEnd }) {
  box.innerHTML = `<div class="gm__bar"><b class="gm__score">Score 0</b><span class="gm__time">30s</span><span class="gm__lives" aria-label="Lives">♥♥♥</span></div>
    <canvas class="gm__cv" aria-label="Packet Catch game. Move with the mouse, finger or arrow keys."></canvas>
    <p class="gm__help">Catch the <b class="ok">green</b> messages in your basket. Dodge the <b class="no">red</b> broken ones!</p>`;
  const cv = box.querySelector("canvas"), g = cv.getContext("2d");
  const $s = box.querySelector(".gm__score"), $t = box.querySelector(".gm__time"), $l = box.querySelector(".gm__lives");
  let W = 0, H = 0, dpr = 1, basket = 0.5, keys = 0, items = [], score = 0, lives = 3, time = 30, spawn = 0, raf = 0, last = 0, over = false, pops = [];
  const size = () => { const r = cv.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
  size(); addEventListener("resize", size);
  const move = (e) => { const r = cv.getBoundingClientRect(); basket = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)); };
  cv.addEventListener("pointermove", move); cv.addEventListener("pointerdown", move);
  const kd = (e) => { if (e.key === "ArrowLeft" || e.key === "a") keys = -1; if (e.key === "ArrowRight" || e.key === "d") keys = 1; };
  const ku = (e) => { if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) keys = 0; };
  addEventListener("keydown", kd); addEventListener("keyup", ku);
  const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
    if (!over) {
      time -= dt; basket = Math.min(1, Math.max(0, basket + keys * dt * 1.3));
      spawn -= dt; if (spawn < 0) { spawn = Math.max(0.28, 0.75 - (30 - time) * 0.015); const bad = Math.random() < 0.28; items.push({ x: 0.06 + Math.random() * 0.88, y: -0.08, v: 0.32 + Math.random() * 0.2 + (30 - time) * 0.008, bad, id: (Math.random() * 0x7ff | 0).toString(16).toUpperCase().padStart(3, "0"), rot: (Math.random() - 0.5) * 0.4 }); }
      const bx = basket * W, by = H - 34, bw = Math.max(80, W * 0.16);
      items = items.filter((it) => {
        it.y += it.v * dt;
        const x = it.x * W, y = it.y * H;
        if (y > by - 14 && y < by + 14 && Math.abs(x - bx) < bw / 2 + 18) {
          if (it.bad) { lives--; sound.bad(); pops.push({ x, y, t: 0, txt: "oops!", c: "#ff3b3b" }); } else { score++; sound.good(); pops.push({ x, y, t: 0, txt: "+1", c: "#1fae5b" }); }
          return false;
        }
        return it.y < 1.1;
      });
      if (time <= 0 || lives <= 0) { over = true; time = Math.max(0, time); onEnd && onEnd(score); }
      $s.textContent = `Score ${score}`; $t.textContent = `${Math.ceil(time)}s`; $l.textContent = "♥".repeat(Math.max(0, lives)) + "♡".repeat(3 - Math.max(0, lives));
    }
    g.clearRect(0, 0, W, H);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, "#bfe9ff"); sky.addColorStop(1, "#effaff"); g.fillStyle = sky; g.fillRect(0, 0, W, H);
    g.fillStyle = "#72d65e"; g.fillRect(0, H - 14, W, 14);
    items.forEach((it) => { const x = it.x * W, y = it.y * H; g.save(); g.translate(x, y); g.rotate(it.rot); g.fillStyle = it.bad ? "#ff3b3b" : "#2fcf6a"; rr(-30, -15, 60, 30, 9); g.fill(); g.fillStyle = "#fff"; g.font = "800 13px Unbounded, Arial Black, sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(it.bad ? "ERR" : it.id, 0, 1); g.restore(); });
    const bx = basket * W, by = H - 34, bw = Math.max(80, W * 0.16);
    g.fillStyle = "#3d7bff"; rr(bx - bw / 2, by - 12, bw, 26, 10); g.fill(); g.fillStyle = "#ffd23f"; rr(bx - bw / 2 + 8, by - 8, bw - 16, 6, 3); g.fill();
    pops = pops.filter((p) => { p.t += dt; g.globalAlpha = Math.max(0, 1 - p.t * 1.5); g.fillStyle = p.c; g.font = "800 18px Unbounded, Arial Black, sans-serif"; g.textAlign = "center"; g.fillText(p.txt, p.x, p.y - p.t * 60); g.globalAlpha = 1; return p.t < 0.7; });
    if (over) { g.fillStyle = "rgba(29,26,79,.78)"; g.fillRect(0, 0, W, H); g.fillStyle = "#fff"; g.textAlign = "center"; g.font = "800 28px Unbounded, Arial Black, sans-serif"; g.fillText(score >= 15 ? "Amazing catch!" : "Nice try!", W / 2, H / 2 - 16); g.font = "600 16px Geist, Arial, sans-serif"; g.fillText(`You caught ${score} packets. Press Play again to retry.`, W / 2, H / 2 + 18); }
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return { destroy() { cancelAnimationFrame(raf); removeEventListener("resize", size); removeEventListener("keydown", kd); removeEventListener("keyup", ku); box.innerHTML = ""; } };
}

export function bitFlip(box, { onEnd }) {
  let target = 0, bits = 0, round = 0, solved = 0;
  box.innerHTML = `<div class="gm__bar"><b class="gm__score">Round 1 of 3</b><span class="gm__time">Make the lights add up to</span></div>
    <div class="bf"><p class="bf__target" aria-live="polite"></p>
      <div class="bf__leds" aria-hidden="true">${Array.from({ length: 8 }, () => "<i></i>").join("")}</div>
      <div class="bf__sw" role="group" aria-label="Eight switches">${[128, 64, 32, 16, 8, 4, 2, 1].map((v) => `<button type="button" class="bf__b" aria-pressed="false" data-v="${v}"><span>${v}</span></button>`).join("")}</div>
      <p class="bf__sum">Your lights add up to <b>0</b></p></div>
    <p class="gm__help">Each switch is worth the number on it. Turn on the right ones so they add up to the big number. (That's how computers count, in binary!)</p>`;
  const $t = box.querySelector(".bf__target"), $sum = box.querySelector(".bf__sum b"), $r = box.querySelector(".gm__score");
  const leds = [...box.querySelectorAll(".bf__leds i")], sws = [...box.querySelectorAll(".bf__b")];
  const next = () => { round++; bits = 0; target = [0, 5 + (Math.random() * 20 | 0), 30 + (Math.random() * 60 | 0), 100 + (Math.random() * 150 | 0)][Math.min(round, 3)]; $r.textContent = `Round ${round} of 3`; $t.textContent = target; draw(); };
  const draw = () => { sws.forEach((b, i) => { const on = !!(bits & (128 >> i)); b.setAttribute("aria-pressed", String(on)); leds[i].classList.toggle("on", on); }); $sum.textContent = bits; };
  sws.forEach((b) => b.addEventListener("click", () => {
    bits ^= +b.dataset.v; sound.click(); draw();
    if (bits === target) { solved++; sound.fanfare(); box.querySelector(".bf").classList.add("win"); setTimeout(() => { box.querySelector(".bf") && box.querySelector(".bf").classList.remove("win"); if (round >= 3) { $t.textContent = "🎉 All solved!"; $r.textContent = "You're a bit wizard"; onEnd && onEnd(solved); } else next(); }, 700); }
  }));
  next();
  return { destroy() { box.innerHTML = ""; } };
}
