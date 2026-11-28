/* Spawner: put lots of things on the island cheaply.
   Every type is drawn with InstancedMesh (one draw call per part), so
   hundreds of trees, flowers or collectibles cost almost nothing.

   const sp = new Spawner(scene);
   sp.define("tree", { parts: [{ geo, mat, y: 0.9 }, { geo2, mat2, y: 2.6, colors: ["#3fbf5a", "#55d36b"] }], max: 200, radius: 0.8 });
   sp.spawn([{ type: "tree", x: 4, z: -2, s: 1.1, r: 0.3 }, ...]);  // returns the new ids
   sp.hide(id) / sp.show(id)        // e.g. a collected item
   sp.hover(id)                     // springs that instance up to 1.1x (or the type's hoverScale)

   Instances that are `interactive` take part in raycasting via sp.pick(raycaster). */
import * as THREE from "/assets/vendor/three.module.min.js";

const UP = new THREE.Vector3(0, 1, 0);
const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), sc = new THREE.Vector3(), col = new THREE.Color();

export class Spawner {
  constructor(scene) { this.scene = scene; this.types = new Map(); this.items = []; this.hovered = -1; }

  /* parts: [{ geo, mat, y = 0, scale = [1,1,1], colors?, shadow? }]
     opts: max, radius (collision; 0 = walk through), interactive, hoverScale, bob (float up and down), spin */
  define(name, { parts, max = 64, radius = 0, interactive = false, hoverScale = 1.1, bob = 0, spin = 0, shadow = true }) {
    const meshes = parts.map((p) => {
      const mesh = new THREE.InstancedMesh(p.geo, p.mat, max);
      mesh.count = 0; mesh.castShadow = shadow && p.shadow !== false; mesh.receiveShadow = true;
      mesh.instanceMatrix.setUsage(bob || spin || interactive ? THREE.DynamicDrawUsage : THREE.StaticDrawUsage);
      mesh.frustumCulled = false; // instances spread over the whole island
      this.scene.add(mesh);
      return { mesh, y: p.y || 0, scale: p.scale || [1, 1, 1], colors: p.colors, offset: p.offset || [0, 0] };
    });
    this.types.set(name, { name, meshes, max, radius, interactive, hoverScale, bob, spin, ids: [] });
  }

  spawn(list) {
    const out = [];
    for (const it of list) {
      const T = this.types.get(it.type); if (!T || T.ids.length >= T.max) continue;
      const id = this.items.length, slot = T.ids.length;
      const item = { id, T, slot, x: it.x, z: it.z, s: it.s ?? 1, r: it.r ?? 0, k: 1, kv: 0, target: 1, visible: true, data: it.data, phase: Math.random() * 6.28 };
      this.items.push(item); T.ids.push(id);
      T.meshes.forEach((m, i) => { m.mesh.count = T.ids.length; if (m.colors) m.mesh.setColorAt(slot, col.setStyle(it.colors?.[i] || m.colors[(id * 7 + i * 3) % m.colors.length])); });
      this.write(item);
      out.push(id);
    }
    this.types.forEach((T) => T.meshes.forEach((m) => { m.mesh.instanceMatrix.needsUpdate = true; if (m.mesh.instanceColor) m.mesh.instanceColor.needsUpdate = true; }));
    return out;
  }

  write(item, t = 0) {
    const { T } = item, s = item.visible ? item.s * item.k : 0;
    const lift = T.bob ? Math.sin(t * 2 + item.phase) * T.bob : 0;
    q.setFromAxisAngle(UP, item.r + (T.spin ? t * T.spin : 0));
    T.meshes.forEach((m) => {
      v.set(item.x + m.offset[0] * item.s, (m.y + lift) * item.s, item.z + m.offset[1] * item.s);
      sc.set(m.scale[0] * s, m.scale[1] * s, m.scale[2] * s);
      m4.compose(v, q, sc); m.mesh.setMatrixAt(item.slot, m4);
    });
  }

  /* collision circles for the character controller */
  colliders() { return this.items.filter((i) => i.T.radius > 0).map((i) => ({ x: i.x, z: i.z, r: i.T.radius * i.s })); }
  of(type) { const T = this.types.get(type); return T ? T.ids.map((id) => this.items[id]) : []; }

  hide(id) { const it = this.items[id]; if (it) { it.target = 0; it.hiding = true; } }
  show(id) { const it = this.items[id]; if (it) { it.visible = true; it.hiding = false; it.target = 1; } }

  /* returns the item under the ray, interactive types only */
  pick(ray) {
    const meshes = []; this.types.forEach((T) => T.interactive && T.meshes.forEach((m) => meshes.push(m.mesh)));
    if (!meshes.length) return null;
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    for (const T of this.types.values()) if (T.meshes.some((m) => m.mesh === hit.object)) { const it = this.items[T.ids[hit.instanceId]]; return it && it.visible && !it.hiding ? it : null; }
    return null;
  }
  hover(id) { this.hovered = id; }

  /* springy scale (hover 1.1x, collect shrink), bobbing and spinning */
  update(dt, t) {
    const dirty = new Set();
    for (const it of this.items) {
      const T = it.T;
      const goal = it.hiding ? 0 : this.hovered === it.id ? T.hoverScale : it.target;
      const moving = Math.abs(goal - it.k) > 1e-3 || Math.abs(it.kv) > 1e-3;
      if (moving) {
        it.kv += (goal - it.k) * 220 * dt; it.kv *= Math.exp(-16 * dt); it.k += it.kv * dt; // damped spring
        if (it.hiding && it.k < 0.02) { it.visible = false; it.k = 0; it.kv = 0; }
      }
      if (moving || T.bob || T.spin) { this.write(it, t); dirty.add(T); }
    }
    dirty.forEach((T) => T.meshes.forEach((m) => (m.mesh.instanceMatrix.needsUpdate = true)));
  }
}
