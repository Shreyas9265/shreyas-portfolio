import * as THREE from 'three';
import { curve, ROAD_W, rng } from './track';

// Small seeded gradient noise + fBm, so hills look natural but identical on every load.
const perm = (() => { const r = rng(1984), p = Array.from({ length: 256 }, (_, i) => i); for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return [...p, ...p]; })();
const grad = (h: number, x: number, y: number) => { const g = h & 7; const u = g < 4 ? x : y, v = g < 4 ? y : x; return ((g & 1) ? -u : u) + ((g & 2) ? -2 * v : 2 * v); };
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
export function noise(x: number, y: number) {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255; x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y), a = perm[X] + Y, b = perm[X + 1] + Y;
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(grad(perm[a], x, y), grad(perm[b], x - 1, y), u), THREE.MathUtils.lerp(grad(perm[a + 1], x, y - 1), grad(perm[b + 1], x - 1, y - 1), u), v) * 0.5;
}
export const fbm = (x: number, y: number, oct = 5) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < oct; i++) { s += a * noise(x * f, y * f); f *= 2.03; a *= 0.5; } return s; };

// Fast distance-to-road using a coarse sample of the centerline.
const samples = Array.from({ length: 260 }, (_, i) => curve.getPointAt(i / 259));
export function roadDist(x: number, z: number) {
  let m = Infinity;
  for (const s of samples) { const d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < m) m = d; }
  return Math.sqrt(m);
}

const smooth = (a: number, b: number, x: number) => { const t = THREE.MathUtils.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

/** Ground height: flat at the road, gentle meadows nearby, mountains far out. */
export function heightAt(x: number, z: number, d = roadDist(x, z)) {
  if (d < ROAD_W + 1.6) return -0.05;
  const meadow = smooth(ROAD_W + 1.6, 40, d) * (fbm(x * 0.018, z * 0.018, 3) * 5 + 1.2);
  const hills = smooth(45, 260, d) * Math.max(0, fbm(x * 0.0035 + 7, z * 0.0035 - 3) + 0.25) * 230;
  return meadow + hills;
}
