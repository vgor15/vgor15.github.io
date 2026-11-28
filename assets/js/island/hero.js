/* Realistic, animated characters.
   - The visitor is a rigged Mixamo character (assets/models/vyom/vyom.glb, textures
     shrunk from 113 MB to 3.4 MB).
   - The island's residents are Mixamo "X Bot" mannequins tinted in their place's colour.
   - Both share the same idle / walk / run clips (from Xbot.glb), retargeted by bone name
     (Mixamo rigs share one skeleton layout; only the name prefix differs).
   Hats from the avatar maker sit on the head bone. */
import * as THREE from "/assets/vendor/three.module.min.js";
import { GLTFLoader } from "/assets/vendor/jsm/loaders/GLTFLoader.js";
import { clone as cloneSkinned, retargetClip } from "/assets/vendor/jsm/utils/SkeletonUtils.js";
import { blobShadow, buildHat } from "./avatar.js";

const loader = new GLTFLoader();
const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const cache = new Map();
export const loadModel = (url) => { if (!cache.has(url)) cache.set(url, load(url)); return cache.get(url); };

const getSkinned = (root) => { let s = null; root.traverse((o) => { if (!s && o.isSkinnedMesh) s = o; }); return s; };
const prefixOf = (root) => { let p = null; root.traverse((o) => { if (!p && o.isBone && /Hips$/.test(o.name)) p = o.name.slice(0, -4); }); return p; };
/* keep rotations only (in-place motion), rename bones to the target rig */
function retarget(clips, prefix, bones) {
  return clips.map((c) => new THREE.AnimationClip(c.name, c.duration, c.tracks
    .filter((t) => /\.quaternion$/.test(t.name))
    .map((t) => { const tt = t.clone(); tt.name = t.name.replace(/^mixamorig\d*[_:]?/, prefix); return tt; })
    .filter((t) => bones.has(t.name.split(".")[0])))); // skip bones this rig doesn't have (e.g. eyes)
}

export async function makeHero({ url, height = 2.3, tint = null, look = null }) {
  const [gltf, xbot] = await Promise.all([loadModel(url), loadModel("/assets/models/xbot/Xbot.glb")]);
  const model = cloneSkinned(gltf.scene);
  const root = new THREE.Group(); root.add(model); root.add(blobShadow(0.6));
  model.updateMatrixWorld(true);
  let top = null, head = null;
  model.traverse((o) => {
    if (o.isBone && /HeadTop_End$/.test(o.name)) top = o;
    if (o.isBone && /Head$/.test(o.name)) head = o;
    if (o.isMesh) {
      o.castShadow = false; o.receiveShadow = true; o.frustumCulled = false;
      if (tint) { o.material = o.material.clone(); if (/Joints/i.test(o.material.name)) o.material.color.set("#2a2a33"); else o.material.color.set(tint); o.material.roughness = 0.38; o.material.metalness = 0.15; }
      if (o.material) o.material.envMapIntensity = 0.9;
    }
  });
  const v = new THREE.Vector3();
  const topY = top ? top.getWorldPosition(v).y : 1.8;
  model.scale.setScalar(height / topY);
  model.updateMatrixWorld(true);

  const prefix = prefixOf(model);
  const wanted = xbot.animations.filter((c) => ["idle", "walk", "run"].includes(c.name));
  let mixer, clips;
  if (prefix === prefixOf(xbot.scene) || /xbot/i.test(url)) {
    // same rig as the clips: play them as they are (rotations only, so everyone walks in place)
    mixer = new THREE.AnimationMixer(model);
    const bones = new Set(); model.traverse((o) => o.isBone && bones.add(o.name));
    clips = retarget(wanted, prefix, bones);
  } else {
    // a different Mixamo export: bones rest at different angles, so convert every frame through
    // world space (SkeletonUtils.retargetClip) instead of copying raw rotations
    const src = cloneSkinned(xbot.scene), target = getSkinned(model), source = getSkinned(src);
    const srcPrefix = prefixOf(src) || "mixamorig";
    const names = {}; target.skeleton.bones.forEach((b) => { names[b.name] = b.name.replace(prefix, srcPrefix); });
    mixer = new THREE.AnimationMixer(target);
    // baking moves the bones around; remember their rest transforms and put them back afterwards
    const rest = target.skeleton.bones.map((b) => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
    clips = wanted.map((c) => {
      const r = retargetClip(target, source, c, { names, hip: prefix + "Hips", fps: 30, useFirstFramePosition: true, preserveHipPosition: false });
      r.name = c.name; r.tracks = r.tracks.filter((t) => /quaternion$/.test(t.name)); return r;
    });
    target.skeleton.bones.forEach((b, i) => { b.position.copy(rest[i][0]); b.quaternion.copy(rest[i][1]); b.scale.copy(rest[i][2]); });
    model.updateMatrixWorld(true);
  }
  const act = Object.fromEntries(clips.map((c) => [c.name, mixer.clipAction(c)]));
  let current = act.idle; current && current.play();
  const play = (a, fade = 0.25) => { if (!a || a === current) return; a.reset().fadeIn(fade).play(); current && current.fadeOut(fade); current = a; };

  // hats ride on the head bone
  const holder = new THREE.Group();
  if (head && top) {
    head.add(holder);
    const hp = head.getWorldPosition(new THREE.Vector3()), tp = top.getWorldPosition(new THREE.Vector3());
    const r = hp.distanceTo(tp) * 0.52; // head radius in world units
    const centre = hp.clone().lerp(tp, 0.72);
    holder.position.copy(head.worldToLocal(centre.clone()));
    const ws = head.getWorldScale(new THREE.Vector3()).x;
    holder.scale.setScalar(r / 0.24 / ws);
  }
  const setLook = (l) => { holder.clear(); if (l) holder.add(buildHat(l)); };
  if (look) setLook(look);

  let talk = 0;
  return {
    root, realistic: true, setLook, mixer, act,
    set talking(x) { talk = x ? 1 : 0; },
    update(dt, t, speed) {
      if (speed > 8.5) { play(act.run); act.run.timeScale = speed / 11; }
      else if (speed > 0.3) { play(act.walk); act.walk.timeScale = Math.max(0.7, speed / 6.5); }
      else play(act.idle);
      mixer.update(dt);
      if (talk && head) { head.rotation.x += Math.sin(t * 8) * 0.07; head.rotation.y += Math.sin(t * 3.1) * 0.06; } // nods along while talking
    },
  };
}
