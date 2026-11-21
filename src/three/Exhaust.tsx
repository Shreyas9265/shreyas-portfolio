import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { CarHandle } from './Car911';
import { drive } from './store';
import { prefersReducedMotion } from '../lib/motion';

const COUNT = 90;

function puffTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128;
  const x = c.getContext('2d')!;
  for (let i = 0; i < 9; i++) {
    const px = 40 + Math.random() * 48, py = 40 + Math.random() * 48, r = 22 + Math.random() * 22;
    const g = x.createRadialGradient(px, py, 0, px, py, r);
    g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, Math.PI * 2); x.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

type P = { s: THREE.Sprite; m: THREE.SpriteMaterial; life: number; max: number; v: THREE.Vector3; grow: number; spin: number };

/** Exhaust smoke from the twin tailpipes. More smoke the faster you scroll; a burst when you accelerate. */
export default function Exhaust({ carRef }: { carRef: React.RefObject<CarHandle | null> }) {
  const group = useRef<THREE.Group>(null);
  const tex = useMemo(puffTexture, []);
  const pool = useMemo<P[]>(() => Array.from({ length: COUNT }, () => {
    const m = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0, color: '#bfc3c8' });
    const s = new THREE.Sprite(m); s.visible = false;
    return { s, m, life: 0, max: 1, v: new THREE.Vector3(), grow: 1, spin: 0 };
  }), [tex]);
  const state = useRef({ acc: 0, lastSpeed: 0, next: 0 });
  const reduce = prefersReducedMotion();
  const tmp = useMemo(() => ({ back: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), side: new THREE.Vector3(), pos: new THREE.Vector3() }), []);

  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05), car = carRef.current;
    if (!car || reduce) return;
    const st = state.current;
    const speed = drive.speed, accel = Math.max(0, speed - st.lastSpeed) / Math.max(dt, 1e-3);
    st.lastSpeed = speed;

    // emission: idle trickle, more with speed, extra on acceleration
    const rate = (speed < 3 ? 1.5 : 4) + speed * 0.8 + Math.min(110, accel * 0.6);
    st.acc += rate * dt;
    const g = car.group;
    tmp.back.set(-1, 0, 0).applyQuaternion(g.quaternion);
    tmp.side.set(0, 0, 1).applyQuaternion(g.quaternion);
    const rearX = (car.exhaustX ?? -2.25) + 0.05;
    const night = 1 - drive.dayMix;
    while (st.acc >= 1) {
      st.acc -= 1;
      const p = pool[st.next]; st.next = (st.next + 1) % COUNT;
      const pipe = (Math.random() < 0.5 ? -1 : 1) * 0.2;
      tmp.pos.set(rearX, 0.32, pipe).applyMatrix4(g.matrixWorld);
      p.s.position.copy(tmp.pos);
      p.v.copy(tmp.back).multiplyScalar(1.2 + speed * 0.05 + Math.random()).addScaledVector(tmp.up, 0.5 + Math.random() * 0.6).addScaledVector(tmp.side, (Math.random() - 0.5) * 0.8);
      p.life = 0; p.max = 0.9 + Math.random() * 1.1 + speed * 0.004;
      p.grow = 0.9 + Math.random() * 1.1 + speed * 0.014;
      p.spin = (Math.random() - 0.5) * 1.5;
      p.m.rotation = Math.random() * Math.PI * 2;
      p.m.color.set(night > 0.5 ? '#7d8592' : '#c9ccd1');
      p.s.visible = true;
    }

    for (const p of pool) {
      if (!p.s.visible) continue;
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) { p.s.visible = false; continue; }
      p.v.multiplyScalar(1 - dt * 1.4); p.v.y += dt * 0.35;
      p.s.position.addScaledVector(p.v, dt);
      const size = 0.25 + p.grow * Math.sqrt(k);
      p.s.scale.set(size, size, size);
      p.m.rotation += p.spin * dt;
      p.m.opacity = Math.sin(Math.min(1, k * 4) * Math.PI / 2) * (1 - k) * (0.12 + Math.min(0.28, speed * 0.003));
    }
  });

  return <group ref={group}>{pool.map((p, i) => <primitive key={i} object={p.s} />)}</group>;
}
