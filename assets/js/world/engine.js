/* The world engine: one transparent WebGL2 canvas behind every page.
   It never owns content: pages stay fully readable without it.
   Pauses when the tab is hidden, adapts resolution to the device. */
import * as THREE from "/assets/vendor/three.module.min.js";
import { detectTier, Governor, TIERS } from "./quality.js";

export function createEngine() {
  const canvas = document.createElement("canvas");
  canvas.className = "world"; canvas.setAttribute("aria-hidden", "true");
  document.body.prepend(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  const tier = detectTier(renderer.getContext());
  const gov = new Governor(tier, (dpr) => { renderer.setPixelRatio(dpr); resize(); });
  renderer.setPixelRatio(gov.dpr);
  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);
  camera.position.set(0, 0, 30);
  const state = { pointer: { x: 0, y: 0 }, scroll: 0, time: 0, dive: 0 };
  let scene = null, raf = 0, last = 0, running = false;

  const resize = () => { const w = innerWidth, h = innerHeight; renderer.setSize(w, h, false); camera.aspect = w / Math.max(1, h); camera.updateProjectionMatrix(); scene && scene.resize && scene.resize(w, h); };
  addEventListener("resize", resize);
  addEventListener("pointermove", (e) => { state.pointer.x = (e.clientX / innerWidth) * 2 - 1; state.pointer.y = -(e.clientY / innerHeight) * 2 + 1; }, { passive: true });
  addEventListener("scroll", () => { const max = document.documentElement.scrollHeight - innerHeight; state.scroll = max > 0 ? scrollY / max : 0; }, { passive: true });

  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now; state.time += dt;
    gov.frame(dt);
    if (state.dive) { const k = Math.min(1, (now - state.dive) / 420), e = k * k * (3 - 2 * k); camera.fov = 55 - 38 * e; camera.updateProjectionMatrix(); canvas.style.filter = `brightness(${1 + e * 1.6}) blur(${e * 2}px)`; }
    if (scene) { scene.update(dt, state); renderer.render(scene.root, camera); }
    if (running) raf = requestAnimationFrame(frame);
  };
  const start = () => { if (running || document.hidden) return; running = true; last = performance.now(); raf = requestAnimationFrame(frame); };
  const stop = () => { running = false; cancelAnimationFrame(raf); };
  document.addEventListener("visibilitychange", () => (document.hidden ? stop() : start()));

  return {
    THREE, renderer, camera, canvas, tier, cfg: TIERS[tier], state,
    setScene(s) { if (scene && scene.dispose) scene.dispose(); scene = s; resize(); if (scene && scene.update) scene.update(0, state); renderer.render(scene.root, camera); requestAnimationFrame(() => canvas.classList.add("is-on")); start(); },
    start, stop,
    destroy() { stop(); if (scene && scene.dispose) scene.dispose(); renderer.dispose(); canvas.remove(); },
  };
}
