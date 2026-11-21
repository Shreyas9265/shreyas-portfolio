import { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { drive } from './store';
import * as THREE from 'three';
import { curve, frameAt, ROAD_W, tAtG, N } from './track';

/** A ribbon mesh that follows the curve, offset sideways from the centerline. */
function ribbon(off0: number, off1: number, y: number, segs = 900) {
  const pos: number[] = [], idx: number[] = [], uv: number[] = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, { p, side } = frameAt(t);
    const a = p.clone().addScaledVector(side, off0), b = p.clone().addScaledVector(side, off1);
    pos.push(a.x, y, a.z, b.x, y, b.z);
    uv.push(0, t * 160, 1, t * 160);
    if (i < segs) { const k = i * 2; idx.push(k, k + 2, k + 1, k + 1, k + 2, k + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

function checkerTexture() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 32;
  const x = c.getContext('2d')!;
  for (let i = 0; i < 16; i++) for (let j = 0; j < 4; j++) { x.fillStyle = (i + j) % 2 ? '#f4f4f0' : '#111'; x.fillRect(i * 8, j * 8, 8, 8); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function Road() {
  const parts = useMemo(() => {
    const asphalt = ribbon(-ROAD_W, ROAD_W, 0.01);
    const shoulderL = ribbon(-ROAD_W - 1.4, -ROAD_W, 0.005);
    const shoulderR = ribbon(ROAD_W, ROAD_W + 1.4, 0.005);
    const edgeL = ribbon(-ROAD_W + 0.25, -ROAD_W + 0.4, 0.02);
    const edgeR = ribbon(ROAD_W - 0.4, ROAD_W - 0.25, 0.02);
    // center dashes
    const dashes: THREE.Matrix4[] = [];
    const L = curve.getLength(), count = Math.floor(L / 5);
    const q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), m = new THREE.Matrix4();
    for (let i = 0; i < count; i++) {
      const { p, tan } = frameAt(i / count);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(tan.x, tan.z));
      dashes.push(m.clone().compose(new THREE.Vector3(p.x, 0.025, p.z), q, s));
    }
    return { asphalt, shoulderL, shoulderR, edgeL, edgeR, dashes };
  }, []);

  const checker = useMemo(checkerTexture, []);
  const base = import.meta.env.BASE_URL;
  const tex = useTexture({ map: `${base}textures/asphalt_diff.jpg`, normalMap: `${base}textures/asphalt_nor_gl.jpg`, roughnessMap: `${base}textures/asphalt_rough.jpg` });
  const asphalt = useMemo(() => {
    Object.values(tex).forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1.8, 1.1); t.anisotropy = 8; });
    tex.map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ ...tex, roughness: 1, side: THREE.DoubleSide, normalScale: new THREE.Vector2(0.8, 0.8) });
  }, [tex]);
  const shoulder = useMemo(() => new THREE.MeshStandardMaterial({ map: tex.map, normalMap: tex.normalMap, color: '#9a8f80', roughness: 1, side: THREE.DoubleSide }), [tex]);
  useFrame(() => {
    asphalt.color.set('#3a4048').lerp(new THREE.Color('#d8d8d8'), drive.dayMix);
    shoulder.color.set('#2d2a26').lerp(new THREE.Color('#9a8f80'), drive.dayMix);
  });
  const lineAt = (g: number) => {
    const { p, tan } = frameAt(tAtG(g));
    return { pos: [p.x, 0.03, p.z] as [number, number, number], rot: Math.atan2(tan.x, tan.z) };
  };
  const start = lineAt(0), finish = lineAt(N + 1);

  return (
    <group>
      <mesh geometry={parts.asphalt} material={asphalt} />
      <mesh geometry={parts.shoulderL} material={shoulder} />
      <mesh geometry={parts.shoulderR} material={shoulder} />
      <mesh geometry={parts.edgeL}><meshStandardMaterial color="#e8e8e2" emissive="#ffffff" emissiveIntensity={0.12} roughness={0.6} side={THREE.DoubleSide} /></mesh>
      <mesh geometry={parts.edgeR}><meshStandardMaterial color="#e8e8e2" emissive="#ffffff" emissiveIntensity={0.12} roughness={0.6} side={THREE.DoubleSide} /></mesh>
      <instancedMesh args={[undefined, undefined, parts.dashes.length]} ref={(im) => { if (im) { parts.dashes.forEach((mm, i) => im.setMatrixAt(i, mm)); im.instanceMatrix.needsUpdate = true; } }}>
        <boxGeometry args={[0.16, 0.01, 2.2]} />
        <meshStandardMaterial color="#e8b923" emissive="#f2c230" emissiveIntensity={0.35} roughness={0.6} />
      </instancedMesh>
      {[start, finish].map((l, i) => (
        <mesh key={i} position={l.pos} rotation={[-Math.PI / 2, 0, l.rot]}>
          <planeGeometry args={[ROAD_W * 2, 2]} />
          <meshStandardMaterial map={checker} roughness={0.8} />
        </mesh>
      ))}
      <FinishArch pos={finish.pos} rot={finish.rot} tex={checker} />
    </group>
  );
}

function FinishArch({ pos, rot, tex }: { pos: [number, number, number]; rot: number; tex: THREE.Texture }) {
  return (
    <group position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
      {[-ROAD_W - 1, ROAD_W + 1].map((x) => (
        <mesh key={x} position={[x, 3, 0]}><boxGeometry args={[0.35, 6, 0.35]} /><meshStandardMaterial color="#1b1d22" metalness={0.6} roughness={0.4} /></mesh>
      ))}
      <mesh position={[0, 6.1, 0]}><boxGeometry args={[ROAD_W * 2 + 2.4, 1.1, 0.3]} /><meshStandardMaterial map={tex} emissive="#ffffff" emissiveIntensity={0.15} emissiveMap={tex} /></mesh>
    </group>
  );
}
