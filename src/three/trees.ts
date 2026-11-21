import * as THREE from 'three';
import { rng } from './track';

/**
 * Paints a conifer onto a canvas: thousands of needle strokes in tiers, lit from the upper left,
 * darker toward the core. Used as an alpha-cut billboard texture.
 */
export function paintTree(seed: number) {
  const W = 256, H = 512, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const x = cv.getContext('2d')!, r = rng(seed);
  const cx = W / 2, top = 18 + r() * 20, base = H - 70;
  // trunk
  const tg = x.createLinearGradient(cx - 9, 0, cx + 9, 0);
  tg.addColorStop(0, '#2b1d14'); tg.addColorStop(0.5, '#4a3424'); tg.addColorStop(1, '#22170f');
  x.fillStyle = tg; x.fillRect(cx - 8, base - 140, 16, H - base + 140);
  // foliage tiers, back to front
  const hue = 105 + r() * 25, sat = 28 + r() * 18;
  const tiers = 15 + Math.floor(r() * 6);
  for (let t = 0; t < tiers; t++) {
    const k = t / (tiers - 1);
    const y = top + k * (base - top);
    const half = 10 + Math.pow(k, 0.9) * (W * 0.42) * (0.85 + r() * 0.2);
    const strokes = 120 + Math.floor(k * 260);
    for (let s = 0; s < strokes; s++) {
      const u = (r() * 2 - 1);
      const px = cx + u * half * Math.sqrt(r());
      const py = y + (r() - 0.3) * 26 + Math.abs(u) * 14;
      const len = 6 + r() * 14;
      const ang = Math.PI / 2 + u * 0.9 + (r() - 0.5) * 0.6;
      const lit = 0.55 + (-u * 0.25) + (1 - k) * 0.12 + (r() - 0.5) * 0.25;
      x.strokeStyle = `hsla(${hue + (r() - 0.5) * 12}, ${sat}%, ${Math.max(6, Math.min(48, lit * 34))}%, ${0.75 + r() * 0.25})`;
      x.lineWidth = 1 + r() * 1.6;
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(ang) * len * Math.sign(u || 1) * 0.6, py + Math.sin(ang) * len * 0.45); x.stroke();
    }
  }
  // inner shadow so the core reads as depth
  x.globalCompositeOperation = 'source-atop';
  const sg = x.createLinearGradient(0, 0, W, 0);
  sg.addColorStop(0, 'rgba(255,255,230,0.06)'); sg.addColorStop(0.5, 'rgba(0,0,0,0.18)'); sg.addColorStop(1, 'rgba(0,0,0,0.38)');
  x.fillStyle = sg; x.fillRect(0, 0, W, H);
  x.globalCompositeOperation = 'source-over';
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; tex.generateMipmaps = true;
  return tex;
}

/** Two crossed quads (1 wide, 2 tall) standing on y = 0, with soft upward normals for even lighting. */
export function crossedQuads() {
  const g = new THREE.BufferGeometry();
  const pos: number[] = [], uv: number[] = [], nor: number[] = [], idx: number[] = [];
  [0, Math.PI / 2].forEach((a, q) => {
    const c = Math.cos(a) * 0.5, s = Math.sin(a) * 0.5, b = q * 4;
    pos.push(-c, 0, -s, c, 0, s, c, 2, s, -c, 2, -s);
    uv.push(0, 0, 1, 0, 1, 1, 0, 1);
    for (let i = 0; i < 4; i++) nor.push(-s * 0.6, 0.8, c * 0.6);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  });
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setIndex(idx);
  return g;
}
