/* Cinematic pipeline: the island as a tiny physical model on a desk.
   RenderPass (4x MSAA, half-float) → SSAO contact shadows → tilt-shift blur
   (sharp band through the middle, soft top and bottom) → subtle high-threshold
   bloom (lamps, beacon, windows at night) → OutputPass (tone mapping + sRGB).

   Quality ladder, so it never lags:
     3 = SSAO + tilt-shift + bloom   (strong GPUs)
     2 = tilt-shift + bloom          (mid GPUs, or when 3 can't hold the frame rate)
     1 = plain render                (phones / weak GPUs)
   tick(dt) watches the real frame rate and steps down a level if needed. */
import * as THREE from "/assets/vendor/three.module.min.js";
import { EffectComposer } from "/assets/vendor/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "/assets/vendor/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "/assets/vendor/jsm/postprocessing/ShaderPass.js";
import { SSAOPass } from "/assets/vendor/jsm/postprocessing/SSAOPass.js";
import { UnrealBloomPass } from "/assets/vendor/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "/assets/vendor/jsm/postprocessing/OutputPass.js";
import { HorizontalTiltShiftShader } from "/assets/vendor/jsm/shaders/HorizontalTiltShiftShader.js";
import { VerticalTiltShiftShader } from "/assets/vendor/jsm/shaders/VerticalTiltShiftShader.js";

export function createPipeline(renderer, scene, camera, tier) {
  let level = tier === "high" ? 3 : tier === "mid" ? 2 : 1;
  const px = renderer.getPixelRatio(), w = innerWidth, h = innerHeight;
  const rt = new THREE.WebGLRenderTarget(w * px, h * px, { type: THREE.HalfFloatType, samples: 4 });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(px); composer.setSize(w, h);

  const render = new RenderPass(scene, camera);
  const ssao = new SSAOPass(scene, camera, w, h, 16);
  Object.assign(ssao, { kernelRadius: 1.6, minDistance: 0.0006, maxDistance: 0.012 });
  const tiltH = new ShaderPass(HorizontalTiltShiftShader), tiltV = new ShaderPass(VerticalTiltShiftShader);
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.4, 0.6, 1.25);
  const out = new OutputPass();
  [render, ssao, tiltH, tiltV, bloom, out].forEach((p) => composer.addPass(p));

  let focus = 0.5;
  const tilt = (strength) => {
    tiltH.uniforms.h.value = strength / innerWidth; tiltV.uniforms.v.value = strength / innerHeight;
    tiltH.uniforms.r.value = tiltV.uniforms.r.value = focus; // the sharp band follows the character on screen
  };
  let tiltStrength = 5.2;
  const apply = () => { ssao.enabled = level >= 3; tiltH.enabled = tiltV.enabled = bloom.enabled = level >= 2; tilt(tiltStrength); };
  apply();

  // frame-rate watch: 2 s windows, step down if we clearly miss the target
  let acc = 0, frames = 0, cool = 3;
  const target = tier === "high" ? 52 : 40;

  return {
    get level() { return level; },
    setSize(width, height) { composer.setPixelRatio(renderer.getPixelRatio()); composer.setSize(width, height); ssao.setSize(width * renderer.getPixelRatio(), height * renderer.getPixelRatio()); tilt(tiltStrength); },
    setTilt(s) { tiltStrength = s; tilt(s); },
    setFocus(y) { focus += (y - focus) * 0.15; tiltH.uniforms.r.value = tiltV.uniforms.r.value = focus; },
    setBloom(strength) { bloom.strength = strength; },
    render() { if (level >= 2) composer.render(); else renderer.render(scene, camera); },
    tick(dt) {
      acc += dt; frames++;
      if (acc < 2) return;
      const fps = frames / acc; acc = 0; frames = 0;
      if (cool > 0) { cool--; return; }
      if (fps < target - 8 && level > 1) { level--; apply(); cool = 2; }
    },
  };
}
