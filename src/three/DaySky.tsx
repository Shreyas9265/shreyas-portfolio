import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { drive } from './store';
import { curve, frameAt, rng, tAtG } from './track';

/** Low-poly cloud clusters spread over the route, drifting slowly. Day only. */
export function Clouds() {
  const group = useRef<THREE.Group>(null);
  const clusters = useMemo(() => {
    const r = rng(42), box = new THREE.Box3().setFromPoints(curve.getPoints(100));
    return Array.from({ length: 22 }, () => ({
      x: THREE.MathUtils.lerp(box.min.x - 220, box.max.x + 220, r()),
      z: THREE.MathUtils.lerp(box.min.z - 120, box.max.z + 60, r()),
      y: 26 + r() * 18,
      puffs: Array.from({ length: 4 + Math.floor(r() * 4) }, (_, i) => ({ x: (i - 2.5) * (5 + r() * 3), y: r() * 3, z: (r() - 0.5) * 6, s: 5 + r() * 5 })),
    }));
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#eef4ff', emissiveIntensity: 0.35, roughness: 1, flatShading: true, transparent: true }), []);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  useFrame((state) => {
    if (!group.current) return;
    group.current.visible = drive.dayMix > 0.05;
    mat.opacity = Math.min(1, drive.dayMix * 1.2);
    group.current.position.x = Math.sin(state.clock.elapsedTime * 0.02) * 20;
  });
  return (
    <group ref={group}>
      {clusters.map((cl, i) => (
        <group key={i} position={[cl.x, cl.y, cl.z]}>
          {cl.puffs.map((p, j) => <mesh key={j} geometry={geo} material={mat} position={[p.x, p.y, p.z]} scale={[p.s * 1.3, p.s * 0.7, p.s]} />)}
        </group>
      ))}
    </group>
  );
}

/** Three flocks of birds circling above the car with flapping wings. Day only. */
export function Birds() {
  const group = useRef<THREE.Group>(null);
  const birds = useRef<{ root: THREE.Group; l: THREE.Group; r: THREE.Group }[]>([]);
  const flocks = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 3 }, (_, f) => ({
      radius: 18 + f * 10, height: 8 + f * 3, speed: (0.12 + r() * 0.06) * (f % 2 ? -1 : 1), phase: r() * 6,
      birds: Array.from({ length: 6 + f }, (_, i) => ({ dx: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 1.8, dz: -Math.ceil(i / 2) * 1.6, dy: (r() - 0.5) * 1.2, flap: r() * 6 })),
    }));
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#232832', roughness: 0.9, side: THREE.DoubleSide }), []);
  const wing = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.18, -1.1, 0, -0.1, 0, 0, -0.28], 3)); g.computeVertexNormals(); return g; }, []);
  const body = useMemo(() => new THREE.ConeGeometry(0.12, 0.7, 5).rotateX(Math.PI / 2), []);

  useFrame((state) => {
    if (!group.current) return;
    group.current.visible = drive.dayMix > 0.4;
    if (!group.current.visible) return;
    const time = state.clock.elapsedTime;
    const { p, tan } = frameAt(tAtG(drive.g));
    const center = p.clone().addScaledVector(tan, 34);
    let k = 0;
    flocks.forEach((fl) => {
      const a = fl.phase + time * fl.speed;
      const dir = fl.speed > 0 ? 1 : -1;
      const cx = center.x + Math.cos(a) * fl.radius, cz = center.z + Math.sin(a) * fl.radius;
      const heading = Math.atan2(-Math.sin(a) * dir, Math.cos(a) * dir); // tangent of the circle
      fl.birds.forEach((b) => {
        const bird = birds.current[k++]; if (!bird) return;
        const cos = Math.cos(heading), sin = Math.sin(heading);
        bird.root.position.set(cx + b.dx * cos + b.dz * sin, fl.height + b.dy + Math.sin(time * 0.8 + b.flap) * 0.6, cz - b.dx * sin + b.dz * cos);
        bird.root.rotation.y = heading;
        const flap = Math.sin(time * 9 + b.flap) * 0.6;
        bird.l.rotation.z = flap; bird.r.rotation.z = -flap;
      });
    });
  });

  let idx = 0;
  return (
    <group ref={group}>
      {flocks.map((fl, f) => fl.birds.map((_, i) => {
        const my = idx++;
        return (
          <group key={`${f}-${i}`} scale={1.4} ref={(o) => { if (o) birds.current[my] = { root: o, l: o.children[1] as THREE.Group, r: o.children[2] as THREE.Group }; }}>
            <mesh geometry={body} material={mat} />
            <group><mesh geometry={wing} material={mat} /></group>
            <group scale={[-1, 1, 1]}><mesh geometry={wing} material={mat} /></group>
          </group>
        );
      }))}
    </group>
  );
}
