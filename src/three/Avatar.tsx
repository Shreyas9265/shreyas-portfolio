import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { frameAt, N, ROAD_W, tAtG } from './track';
import { drive } from './store';

/**
 * Your avatar, standing beside the parked car at the finish line.
 * Export it from MetaPerson Creator (avatarsdk.com) as GLB and save it as public/models/avatar.glb.
 */
export const AVATAR_URL = `${import.meta.env.BASE_URL}models/avatar.glb`;
const HEIGHT = 1.8;

/** Where the avatar stands: beside the car at the finish, turned toward the arriving camera. */
export function avatarSpot() {
  const { p, tan, side } = frameAt(tAtG(N + 1));
  const pos = p.clone().addScaledVector(side, ROAD_W * 0.62).addScaledVector(tan, 0.6);
  const face = tan.clone().multiplyScalar(-1).addScaledVector(side, -0.55).normalize();
  return { pos, rot: Math.atan2(face.x, face.z), side };
}

export default function Avatar() {
  const [has, setHas] = useState(false);
  useEffect(() => {
    fetch(AVATAR_URL, { method: 'HEAD' })
      .then((r) => { const ct = r.headers.get('content-type') ?? ''; if (r.ok && !ct.includes('html')) setHas(true); })
      .catch(() => {});
  }, []);
  const spot = useMemo(avatarSpot, []);
  const root = useRef<THREE.Group>(null);
  useFrame(() => { if (root.current) root.current.visible = drive.g > N - 1.5; });
  return (
    <group ref={root} position={spot.pos} rotation={[0, spot.rot, 0]}>
      {has ? <Suspense fallback={null}><Person /></Suspense> : import.meta.env.DEV ? <Placeholder /> : null}
      <AvatarLights />
    </group>
  );
}

const Z = new THREE.Vector3(0, 0, 1);
const _q = new THREE.Quaternion(), _pq = new THREE.Quaternion();

/** Rotate a bone about a world-space axis, starting from a stored rest pose. */
function poseWorld(bone: THREE.Bone, rest: THREE.Quaternion, axis: THREE.Vector3, angle: number) {
  bone.parent!.getWorldQuaternion(_pq);
  _q.setFromAxisAngle(axis, angle);
  // local = parent⁻¹ · worldRot · parent · rest
  bone.quaternion.copy(_pq).invert().multiply(_q).multiply(_pq).multiply(rest);
}

/**
 * Your MetaPerson avatar: arms lowered from the T-pose, breathing, blinking, a slight smile,
 * head following the mouse, and a wave when the car arrives (or when you click it).
 */
function Person() {
  const { scene } = useGLTF(AVATAR_URL);
  const { pointer, clock } = useThree();
  const model = useMemo(() => {
    const m = cloneSkinned(scene);
    m.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh) { mesh.frustumCulled = false; } });
    const box = new THREE.Box3().setFromObject(m), size = box.getSize(new THREE.Vector3());
    m.scale.multiplyScalar(HEIGHT / size.y);
    m.position.y -= box.min.y * (HEIGHT / size.y);
    return m;
  }, [scene]);

  const rig = useMemo(() => {
    const bone = (name: string) => { let hit: THREE.Bone | null = null; model.traverse((o) => { if (!hit && (o as THREE.Bone).isBone && o.name.replace(/[^a-z0-9]/gi, '').toLowerCase() === name.toLowerCase()) hit = o as THREE.Bone; }); return hit as THREE.Bone | null; };
    const b = {
      head: bone('Head'), neck: bone('Neck'), spine: bone('Spine2'),
      lArm: bone('LeftArm'), rArm: bone('RightArm'), lFore: bone('LeftForeArm'), rFore: bone('RightForeArm'),
    };
    model.updateMatrixWorld(true);
    // Relax the T-pose: arms down beside the body, elbows slightly bent.
    if (b.lArm) poseWorld(b.lArm, b.lArm.quaternion.clone(), Z, -1.22);
    if (b.rArm) poseWorld(b.rArm, b.rArm.quaternion.clone(), Z, 1.22);
    model.updateMatrixWorld(true);
    if (b.lFore) poseWorld(b.lFore, b.lFore.quaternion.clone(), new THREE.Vector3(1, 0, 0), -0.18);
    if (b.rFore) poseWorld(b.rFore, b.rFore.quaternion.clone(), new THREE.Vector3(1, 0, 0), -0.18);
    model.updateMatrixWorld(true);
    const rest = Object.fromEntries(Object.entries(b).map(([k, v]) => [k, v?.quaternion.clone()])) as Record<keyof typeof b, THREE.Quaternion | undefined>;
    // Face blend shapes (ARKit names) on every mesh that has them.
    const faces: { mesh: THREE.Mesh; dict: Record<string, number> }[] = [];
    model.traverse((o) => { const mesh = o as THREE.Mesh; if (mesh.isMesh && mesh.morphTargetDictionary && mesh.morphTargetInfluences) faces.push({ mesh, dict: mesh.morphTargetDictionary }); });
    return { b, rest, faces };
  }, [model]);

  const anim = useRef({ lookX: 0, lookY: 0, wave: 0, waveStart: -10, nextBlink: 2, blink: 0, arrived: false });
  const setMorph = (name: string, v: number) => rig.faces.forEach(({ mesh, dict }) => { const i = dict[name]; if (i !== undefined) mesh.morphTargetInfluences![i] = v; });

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime, a = anim.current, { b, rest } = rig;
    const near = drive.g > N + 0.4;
    if (near && !a.arrived) a.waveStart = t + 0.6;
    a.arrived = near;

    // breathing
    if (b.spine && rest.spine) poseWorld(b.spine, rest.spine, new THREE.Vector3(1, 0, 0), Math.sin(t * 1.5) * 0.015);

    // head follows the mouse
    a.lookY = THREE.MathUtils.damp(a.lookY, near ? pointer.x * 0.6 : 0, 4, dt);
    a.lookX = THREE.MathUtils.damp(a.lookX, near ? -pointer.y * 0.25 : 0, 4, dt);
    if (b.neck && rest.neck) { b.neck.quaternion.copy(rest.neck); b.neck.rotateY(a.lookY * 0.4); b.neck.rotateX(a.lookX * 0.4); }
    if (b.head && rest.head) { b.head.quaternion.copy(rest.head); b.head.rotateY(a.lookY * 0.6); b.head.rotateX(a.lookX * 0.6); }

    // wave: raise the right arm, swing the forearm, lower it again (about 2.8 s)
    const w = t - a.waveStart;
    const raise = w > 0 && w < 2.8 ? Math.sin(Math.min(1, w / 0.5) * Math.PI / 2) * (w > 2.3 ? (2.8 - w) / 0.5 : 1) : 0;
    a.wave = THREE.MathUtils.damp(a.wave, raise, 10, dt);
    if (b.rArm && rest.rArm) poseWorld(b.rArm, rest.rArm, Z, -2.1 * a.wave);
    if (b.rFore && rest.rFore) poseWorld(b.rFore, rest.rFore, Z, a.wave * (-0.5 + Math.sin(w * 9) * 0.35));

    // blink every few seconds, keep a slight smile
    if (t > a.nextBlink) { a.blink = 1; a.nextBlink = t + 2.5 + Math.random() * 3; }
    a.blink = Math.max(0, a.blink - dt * 7);
    const lid = Math.sin(a.blink * Math.PI);
    setMorph('eyeBlinkLeft', lid); setMorph('eyeBlinkRight', lid);
    setMorph('mouthSmileLeft', 0.28); setMorph('mouthSmileRight', 0.28);
  });

  return (
    <primitive object={model}
      onClick={(e: { stopPropagation: () => void }) => { e.stopPropagation(); anim.current.waveStart = clock.elapsedTime; }}
      onPointerOver={() => { document.body.style.cursor = 'pointer'; }}
      onPointerOut={() => { document.body.style.cursor = ''; }}
    />
  );
}

/** Dev-only stand-in so you can see where the avatar will go before you add avatar.glb. */
function Placeholder() {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#7fb4ff', emissive: '#3d7dff', emissiveIntensity: 1.4, transparent: true, opacity: 0.55 }), []);
  const g = useRef<THREE.Group>(null);
  useFrame((s) => { if (g.current) g.current.position.y = Math.sin(s.clock.elapsedTime * 2) * 0.03; });
  return (
    <group ref={g}>
      <mesh material={mat} position={[0, 0.95, 0]}><capsuleGeometry args={[0.22, 0.9, 8, 16]} /></mesh>
      <mesh material={mat} position={[0, 1.62, 0]}><sphereGeometry args={[0.15, 24, 16]} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}><ringGeometry args={[0.45, 0.55, 48]} /><meshBasicMaterial color="#5d8dff" transparent opacity={0.8} /></mesh>
    </group>
  );
}

/** Soft key light from the front and a cool rim from behind, so the face reads at night too. */
function AvatarLights() {
  const key = useRef<THREE.SpotLight>(null);
  const rim = useRef<THREE.SpotLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  useEffect(() => { if (aim.current) { if (key.current) key.current.target = aim.current; if (rim.current) rim.current.target = aim.current; } }, []);
  useFrame(() => {
    const night = 1 - drive.dayMix, near = THREE.MathUtils.clamp((drive.g - N) * 2, 0, 1);
    if (key.current) key.current.intensity = (14 + night * 26) * near;
    if (rim.current) rim.current.intensity = (6 + night * 22) * near;
  });
  return (
    <>
      <object3D ref={aim} position={[0, 1.35, 0]} />
      <spotLight ref={key} position={[0.8, 2.6, 3.2]} angle={0.5} penumbra={0.9} distance={9} color="#ffe9d2" />
      <spotLight ref={rim} position={[-1.2, 2.4, -2.4]} angle={0.6} penumbra={1} distance={8} color="#9fbaff" />
    </>
  );
}
