import { useMemo, useRef, useState } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { chapters, sideOf, slots, type Item } from '../data/profile';
import { frameAt, ROAD_W, tAtG } from './track';
import { drive } from './store';
import { openDetails } from '../lib/details';

/** Ignore pointer events that land on the HTML layer (cards, buttons, nav). */
export const fromScene = (e: ThreeEvent<PointerEvent | MouseEvent>) =>
  !(e.nativeEvent.target as HTMLElement | null)?.closest?.('a, button, nav, .glass, input');

const COLORS = {
  Experience: { base: '#0f3a28', glow: '#1fa36b' },
  Education: { base: '#0f2747', glow: '#3d8bff' },
  Projects: { base: '#3a0c10', glow: '#ff3b47' },
};

/** Roadside billboards (one per item) plus an overhead gantry where each chapter starts. */
export default function Signs() {
  const boards = useMemo(() => slots.flatMap((slot, si) => slot.items.map((it, ii) => {
    const { p, tan, side } = frameAt(tAtG(si + 1));
    const dir = sideOf(si, ii, slot.items.length) === 'l' ? -1 : 1;
    const pos = p.clone().addScaledVector(side, dir * (ROAD_W + 4.4));
    const face = tan.clone().multiplyScalar(-1).addScaledVector(side, -dir * 0.7).normalize();
    return { it, si, chapter: slot.chapter, pos, rot: Math.atan2(face.x, face.z) };
  })), []);

  const gantries = useMemo(() => chapters.map((c, ci) => {
    const first = slots.findIndex((s) => s.chapter === c.name);
    const { p, tan } = frameAt(tAtG(first + 0.45));
    return { name: c.name, n: ci + 1, pos: p, rot: Math.atan2(-tan.x, -tan.z) };
  }), []);

  return (
    <group>
      {boards.map((b) => <Board key={b.it.title} {...b} />)}
      {gantries.map((g) => (
        <group key={g.name} position={[g.pos.x, 0, g.pos.z]} rotation={[0, g.rot, 0]}>
          {[-ROAD_W - 1.2, ROAD_W + 1.2].map((x) => (
            <mesh key={x} position={[x, 3.6, 0]}><boxGeometry args={[0.28, 7.2, 0.28]} /><meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} /></mesh>
          ))}
          <mesh position={[0, 7.4, 0]}><boxGeometry args={[ROAD_W * 2 + 2.8, 0.22, 0.22]} /><meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} /></mesh>
          <mesh position={[0, 6.5, 0.05]}>
            <boxGeometry args={[7.4, 1.7, 0.12]} />
            <meshStandardMaterial color={COLORS[g.name].base} emissive={COLORS[g.name].glow} emissiveIntensity={0.55} />
          </mesh>
          <Text position={[-3.4, 6.85, 0.13]} anchorX="left" fontSize={0.3} color="#f2c230" letterSpacing={0.12}>{`EXIT ${g.n}`}</Text>
          <Text position={[-3.4, 6.3, 0.13]} anchorX="left" fontSize={0.72} color="#ffffff" fontWeight={800} letterSpacing={0.02}>{g.name.toUpperCase()}</Text>
        </group>
      ))}
    </group>
  );
}

function Board({ it, si, chapter, pos, rot }: { it: Item; si: number; chapter: keyof typeof COLORS; pos: THREE.Vector3; rot: number }) {
  const frame = useRef<THREE.MeshStandardMaterial>(null);
  const group = useRef<THREE.Group>(null);
  const glow = useRef(0);
  const [hover, setHover] = useState(false);
  const cta = it.code ? 'CLICK TO SEE WHAT\'S INSIDE →' : 'CLICK FOR DETAILS →';

  useFrame((_, dt) => {
    const on = drive.g >= si + 1 - 0.02;
    glow.current = THREE.MathUtils.damp(glow.current, on ? 1 : 0, 4, dt);
    if (frame.current) frame.current.emissiveIntensity = 0.25 + glow.current * 2.4 + (hover ? 1.2 : 0);
    if (group.current) group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, hover ? 1.06 : 1, 10, dt));
  });

  return (
    <group position={[pos.x, 0, pos.z]} rotation={[0, rot, 0]}>
      {[-2.2, 2.2].map((x) => (
        <mesh key={x} position={[x, 1.6, -0.1]}><boxGeometry args={[0.16, 3.2, 0.16]} /><meshStandardMaterial color="#2b2e35" metalness={0.7} roughness={0.4} /></mesh>
      ))}
      <group
        ref={group}
        position={[0, 4.5, 0]}
        onClick={(e) => { if (!fromScene(e)) return; e.stopPropagation(); openDetails(it); }}
        onPointerOver={(e) => { if (!fromScene(e)) return; e.stopPropagation(); setHover(true); document.body.style.cursor = 'pointer'; }}
        onPointerOut={() => { setHover(false); document.body.style.cursor = ''; }}
      >
        <mesh>
          <boxGeometry args={[5.8, 3.2, 0.16]} />
          <meshStandardMaterial ref={frame} color={COLORS[chapter].base} emissive={COLORS[chapter].glow} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[0, 0, 0.09]}><planeGeometry args={[5.45, 2.85]} /><meshStandardMaterial color="#0c0e12" /></mesh>
        <Text position={[-2.55, 1.05, 0.11]} anchorX="left" fontSize={0.27} color="#f2c230" letterSpacing={0.06} maxWidth={5.1}>
          {`${it.when.toUpperCase()}  ·  ${it.kind.toUpperCase()}`}
        </Text>
        <Text position={[-2.55, 0.25, 0.11]} anchorX="left" anchorY="middle" fontSize={0.46} maxWidth={5.1} lineHeight={1.05} color="#ffffff" fontWeight={800}>
          {it.title}
        </Text>
        <Text position={[-2.55, -0.6, 0.11]} anchorX="left" fontSize={0.25} color="#a9b0bb" maxWidth={5.1}>{it.where ?? ''}</Text>
        <Text position={[-2.55, -1.08, 0.11]} anchorX="left" fontSize={0.24} color={hover ? '#ffffff' : '#ff8a90'} letterSpacing={0.08}>{cta}</Text>
      </group>
    </group>
  );
}
