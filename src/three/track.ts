import * as THREE from 'three';
import { slots } from '../data/profile';

export const UP = new THREE.Vector3(0, 1, 0);
export const N = slots.length;
export const ROAD_W = 4.2;

// Deterministic winding road heading into -z.
const pts: THREE.Vector3[] = [];
for (let i = 0; i <= 18; i++) {
  const z = -i * 42;
  const x = i < 2 ? 0 : Math.sin(i * 0.85) * 24 + Math.sin(i * 0.31) * 16;
  pts.push(new THREE.Vector3(x, 0, z));
}
export const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.5);
export const LENGTH = curve.getLength();

const START_T = 0.025, END_T = 0.965;
/** g runs 0 (start line) → N+1 (finish); milestone i sits at g = i + 1. */
export const tAtG = (g: number) => START_T + (END_T - START_T) * THREE.MathUtils.clamp(g / (N + 1), 0, 1);
export const STOP_LEN = (LENGTH * (END_T - START_T)) / (N + 1);

export function frameAt(t: number) {
  const p = curve.getPointAt(t);
  const tan = curve.getTangentAt(t).normalize();
  const side = new THREE.Vector3().crossVectors(tan, UP).normalize(); // points to the right of travel
  return { p, tan, side };
}

/** Small seeded RNG so scenery is identical on every load. */
export function rng(seed: number) {
  return () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
}

/** Distance from a point to the road centerline (sampled). */
const samples = Array.from({ length: 400 }, (_, i) => curve.getPointAt(i / 399));
export const distToRoad = (x: number, z: number) => {
  let m = Infinity;
  for (const s of samples) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < m) m = d; }
  return Math.sqrt(m);
};
