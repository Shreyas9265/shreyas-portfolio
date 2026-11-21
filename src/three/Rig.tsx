import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { type CarHandle } from './Car911';
import Car from './Car';
import Exhaust from './Exhaust';
import { frameAt, N, STOP_LEN, tAtG, UP } from './track';
import { drive, emitDrive } from './store';
import { prefersReducedMotion } from '../lib/motion';
import { avatarSpot } from './Avatar';
import { heightAt } from './terrain';

const SPOT = avatarSpot();

const smooth = (x: number) => x * x * (3 - 2 * x);

/**
 * Moves the car along the road from scroll and flies the camera.
 * Hero: the parked car turns to follow the mouse. Drive: chase camera. Finish: slow orbit.
 */
export default function Rig({ desktop }: { desktop: boolean }) {
  const car = useRef<CarHandle>(null);
  const light = useRef<THREE.SpotLight>(null);
  const aim = useRef<THREE.Object3D>(null);
  const { camera, pointer } = useThree();
  const reduce = prefersReducedMotion();
  const cam = useRef({ pos: new THREE.Vector3(8, 3, 6), look: new THREE.Vector3(), steer: 0, roll: 0, turn: 0, spin: 0, tilt: 0, intro: reduce ? 1 : 0 });

  useEffect(() => { if (light.current && aim.current) light.current.target = aim.current; }, []);
  useEffect(() => { if (import.meta.env.DEV) Object.assign(window, { __dbg: { drive, camera, car } }); }, [camera]);

  useFrame((state, dtRaw) => {
    const c = car.current; if (!c) return;
    const dt = Math.min(dtRaw, 0.05);
    const cc = cam.current;

    // scroll → position along the road
    const target = drive.hero + drive.route * N;
    const prev = drive.g;
    drive.g = reduce ? target : THREE.MathUtils.damp(drive.g, target, 4.2, dt);
    const dg = drive.g - prev;
    drive.speed = THREE.MathUtils.damp(drive.speed, Math.min(199, Math.abs(dg / dt) * STOP_LEN * 2.237 * 0.9), 6, dt);

    const k = smooth(THREE.MathUtils.clamp(drive.hero * 1.15, 0, 1)); // 0 = parked in hero, 1 = driving
    const finish = THREE.MathUtils.clamp((drive.g - (N + 0.35)) / 0.6, 0, 1);
    const o = Math.max(smooth(drive.outro), smooth(finish));          // 1 = parked at the finish
    const parked = Math.max(1 - k, o);

    // car pose
    const t = tAtG(drive.g);
    const { p, tan, side } = frameAt(t);
    const ahead = frameAt(Math.min(1, t + 0.01)).tan;
    const curve = THREE.MathUtils.clamp(Math.atan2(tan.x * ahead.z - tan.z * ahead.x, tan.dot(ahead)) * 14, -0.45, 0.45);
    // while parked, the car turns toward the mouse like a showroom turntable
    // At the start line the car turns slowly on the spot like a showroom turntable; the mouse adds a nudge.
    // Once you scroll, it unwinds the shortest way back to face down the road.
    const atStart = 1 - k;
    if (!reduce && atStart > 0.5) cc.spin += dt * 0.45;
    else cc.spin = THREE.MathUtils.damp(Math.atan2(Math.sin(cc.spin), Math.cos(cc.spin)), 0, 3, dt);
    cc.turn = THREE.MathUtils.damp(cc.turn, reduce ? 0 : -pointer.x * 0.6 * parked, 3.5, dt);
    cc.tilt = THREE.MathUtils.damp(cc.tilt, reduce ? 0 : pointer.y * 0.05 * parked, 3.5, dt);
    cc.steer = THREE.MathUtils.damp(cc.steer, THREE.MathUtils.clamp(-curve * 0.7 * (1 - parked) + (-pointer.x * 0.22 * parked), -0.28, 0.28), 6, dt);
    cc.roll = THREE.MathUtils.damp(cc.roll, curve * 0.12 * Math.min(1, drive.speed / 60), 4, dt);
    c.group.position.set(p.x, 0, p.z);
    c.group.rotation.set(cc.roll, Math.atan2(-tan.z, tan.x) + cc.turn + cc.spin, cc.tilt, 'YXZ');
    c.front.forEach((w) => { if (w) w.rotation.y = cc.steer; });
    // cap visual wheel spin per frame so fast wheels never strobe or appear to turn backwards
    c.spin(THREE.MathUtils.clamp(dg * STOP_LEN, -0.11, 0.11));
    c.brake.emissiveIntensity = dg < -0.0005 || (drive.speed < 4 && drive.g > 0.02) ? 4.5 : 2.2;

    const passed = Math.min(N - 1, Math.floor(drive.g + 0.02) - 1);
    if (passed !== drive.passed) { drive.passed = passed; emitDrive(); }

    // camera
    const time = state.clock.elapsedTime;
    cc.intro = Math.min(1, cc.intro + dt * 0.45);
    const carPos = c.group.position;
    const portrait = state.size.width < state.size.height;
    const sweep = 1 - smooth(cc.intro);

    const orbitA = 0.95 + Math.sin(time * 0.08) * 0.12 + pointer.x * 0.25 + sweep * 2.4;
    const orbitR = (portrait ? 8.6 : 6.6) + sweep * 9;
    const orbit = new THREE.Vector3(carPos.x + Math.cos(orbitA) * orbitR, 1.5 + pointer.y * 0.5 + sweep * 4, carPos.z + Math.sin(orbitA) * orbitR);
    const back = portrait ? 10 : 7.6, high = portrait ? 3.8 : 2.7;
    const chase = carPos.clone().addScaledVector(tan, -back).addScaledVector(UP, high + pointer.y * 0.6).addScaledVector(side, 1.6 + pointer.x * 1.6);
    // finish: frame the car and the avatar together, drifting with the mouse
    const pair = carPos.clone().lerp(SPOT.pos, 0.6);
    const outroA = Math.atan2(-tan.z, -tan.x) + 0.55 + Math.sin(time * 0.07) * 0.1 + pointer.x * 0.35;
    const outroR = portrait ? 9 : 7;
    const outroCam = new THREE.Vector3(pair.x + Math.cos(outroA) * outroR, 1.9 + pointer.y * 0.5, pair.z + Math.sin(outroA) * outroR);

    const desired = orbit.lerp(chase, k).lerp(outroCam, o);
    const look = carPos.clone().addScaledVector(UP, 0.7).addScaledVector(tan, 6 * k * (1 - o)).lerp(pair.clone().setY(1.15), o);
    // dev-only: window.__cam = { pos: [x,y,z], look: [x,y,z] } (relative to the car) to inspect details up close
    const dbg = import.meta.env.DEV ? (window as unknown as { __cam?: { pos: number[]; look: number[] } }).__cam : undefined;
    if (dbg) {
      const m = c.group.matrixWorld;
      camera.position.set(dbg.pos[0], dbg.pos[1], dbg.pos[2]).applyMatrix4(m);
      camera.lookAt(new THREE.Vector3(dbg.look[0], dbg.look[1], dbg.look[2]).applyMatrix4(m));
      (camera as THREE.PerspectiveCamera).filmOffset = 0; (camera as THREE.PerspectiveCamera).updateProjectionMatrix();
      return;
    }
    // never dip below the hills beside the road
    desired.y = Math.max(desired.y, heightAt(desired.x, desired.z) + 1.6);
    cc.pos.lerp(desired, reduce ? 1 : 1 - Math.exp(-dt * 8));
    cc.look.lerp(look, reduce ? 1 : 1 - Math.exp(-dt * 7));
    camera.position.copy(cc.pos);
    camera.lookAt(cc.look);

    const pc = camera as THREE.PerspectiveCamera;
    const shift = desktop ? -9 * (1 - k) + -6 * o : 0;
    if (Math.abs(pc.filmOffset - shift) > 0.01) { pc.filmOffset = shift; pc.updateProjectionMatrix(); }
    const fov = (portrait ? 56 : 40) + Math.min(10, drive.speed / 14) * k * (1 - o);
    if (Math.abs(pc.fov - fov) > 0.05) { pc.fov = THREE.MathUtils.damp(pc.fov, fov, 3, dt); pc.updateProjectionMatrix(); }

    // headlights fade out in daylight
    if (light.current) light.current.intensity = 180 * (1 - drive.dayMix * 0.9);
  });

  return (
    <>
      <Car ref={car} />
      <CarLights lightRef={light} aimRef={aim} carRef={car} />
      <Exhaust carRef={car} />
    </>
  );
}

/** Headlight cone + soft fills, attached by copying the car's transform each frame. */
function CarLights({ lightRef, aimRef, carRef }: { lightRef: React.RefObject<THREE.SpotLight | null>; aimRef: React.RefObject<THREE.Object3D | null>; carRef: React.RefObject<CarHandle | null> }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const c = carRef.current; if (!c || !g.current) return;
    g.current.position.copy(c.group.position); g.current.rotation.copy(c.group.rotation);
  });
  return (
    <group ref={g}>
      <spotLight ref={lightRef} position={[2.2, 0.8, 0]} angle={0.5} penumbra={0.6} intensity={180} distance={60} color="#fff1cf" />
      <object3D ref={aimRef} position={[16, -0.5, 0]} />
      <pointLight position={[-2.8, 0.6, 0]} intensity={4} distance={5} color="#ff2233" />
      <pointLight position={[0, 4, 0]} intensity={2.5} distance={8} color="#9fb4ff" />
      <BlobShadow />
    </group>
  );
}

/** Soft shadow under the car so it sits on the road in daylight. */
function BlobShadow() {
  const tex = useMemo(() => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d')!, g = x.createRadialGradient(64, 64, 8, 64, 64, 64);
    g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }, []);
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={[5.6, 2.8, 1]} renderOrder={1}>
      <planeGeometry />
      <meshBasicMaterial map={tex} transparent depthWrite={false} />
    </mesh>
  );
}
