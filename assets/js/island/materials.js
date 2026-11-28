/* Toy materials. On strong GPUs everything is MeshPhysicalMaterial with a soft
   clearcoat, so the island reads like matte vinyl / resin designer toys lit by a
   studio HDRI. Mid devices get MeshStandardMaterial, weak ones Lambert.
   setTier() must run before the world is built. */
import * as THREE from "/assets/vendor/three.module.min.js";

let TIER = "high";
const all = new Set();
export const setTier = (t) => (TIER = t);
export const tierOf = () => TIER;

export function toy(params = {}) {
  let m; params = { ...params };
  if (TIER !== "high") { delete params.clearcoat; delete params.clearcoatRoughness; }
  if (TIER === "low") { delete params.roughness; delete params.metalness; }
  if (TIER === "low") m = new THREE.MeshLambertMaterial(params);
  else if (TIER === "mid") m = new THREE.MeshStandardMaterial({ roughness: 0.62, metalness: 0, ...params });
  else m = new THREE.MeshPhysicalMaterial({ roughness: 0.58, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.32, ...params });
  all.add(m);
  return m;
}

/* night dims the studio reflections */
export function setEnvIntensity(k) { all.forEach((m) => { if ("envMapIntensity" in m) m.envMapIntensity = k; }); }

const cache = new Map();
export const mat = (color, opts = {}) => {
  const key = color + JSON.stringify(opts);
  if (!cache.has(key)) cache.set(key, toy({ color, flatShading: !opts.smooth, ...(opts.emissive ? { emissive: opts.emissive, emissiveIntensity: opts.ei ?? 1 } : {}) }));
  return cache.get(key);
};
