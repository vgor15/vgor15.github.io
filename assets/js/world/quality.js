/* Quality tiers and the frame-rate governor.
   high: desktop GPU · mid: integrated / tablet · low: phones and weak GPUs.
   The governor watches real frame times and steps the pixel ratio down
   (and back up) to hold the target frame rate. */
export function detectTier(gl) {
  const coarse = matchMedia("(pointer: coarse)").matches;
  const mem = navigator.deviceMemory || 8, cores = navigator.hardwareConcurrency || 4;
  let renderer = "";
  try { const ext = gl.getExtension("WEBGL_debug_renderer_info"); if (ext) renderer = String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)).toLowerCase(); } catch (e) {}
  const weakGpu = /swiftshader|llvmpipe|software|mali-4|adreno \(tm\) [3-5]\d\d|powervr/.test(renderer);
  if (weakGpu || mem <= 3 || cores <= 3) return "low";
  if (coarse || /intel|uhd|iris/.test(renderer)) return "mid";
  return "high";
}

export const TIERS = {
  high: { dprMax: 2, dprMin: 1, particles: 1, target: 58 },
  mid: { dprMax: 1.75, dprMin: 1, particles: 0.6, target: 50 },
  low: { dprMax: 1.5, dprMin: 1, particles: 0.35, target: 30 },
};

export class Governor {
  constructor(tier, onDpr) {
    this.cfg = TIERS[tier]; this.onDpr = onDpr;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.cfg.dprMax);
    this.samples = []; this.cool = 0;
  }
  frame(dt) {
    this.samples.push(dt); if (this.samples.length < 45) return;
    const avg = this.samples.reduce((a, b) => a + b, 0) / this.samples.length; this.samples.length = 0;
    const fps = 1 / Math.max(avg, 1e-3);
    if (this.cool > 0) { this.cool--; return; }
    if (fps < this.cfg.target - 6 && this.dpr > this.cfg.dprMin) { this.dpr = Math.max(this.cfg.dprMin, this.dpr - 0.25); this.onDpr(this.dpr); this.cool = 2; }
    else if (fps > this.cfg.target + 4 && this.dpr < Math.min(window.devicePixelRatio || 1, this.cfg.dprMax)) { this.dpr = Math.min(this.cfg.dprMax, this.dpr + 0.25); this.onDpr(this.dpr); this.cool = 4; }
  }
}
